#!/usr/bin/env node
/**
 * Publicador do bot de mídias: publica o que o médico APROVOU
 * (CONTEUDO_INSTAGRAM/aprovados/<slug>.md + .json, ver bot-aprovar.js).
 *
 *   npm run bot:publicar -- --slug=<slug>              prévia (padrão): desenha os slides, monta a legenda, checa
 *   npm run bot:publicar -- --slug=<slug> --confirmar  publica de verdade
 *   ... --redes=instagram,linkedin                     (padrão: as que tiverem credencial)
 *   npm run bot:publicar -- --todos [--confirmar]      todos os aprovados ainda não publicados
 *
 * O que publica por API:
 *   - Instagram: CARROSSEL — os slides aprovados desenhados em PNG 1080×1350
 *     (backend/lib/carrosselAprovado.js), gravados no Blob pela rota
 *     PUT /api/admin/redes-midia/:slug/:nome e publicados pelo fluxo oficial
 *     da Meta (containers → FINISHED → media_publish).
 *   - LinkedIn: um post aprovado por execução (UGC Posts API), com o link do artigo.
 * O que NÃO dá para publicar por API e fica manual: Reels e Shorts (as APIs
 * exigem o arquivo de vídeo; o aprovado é um roteiro) e Stories com enquete
 * (a API da Meta não publica figurinhas interativas).
 *
 * Travas (nesta ordem): aprovação médica registrada; artigo inalterado desde o
 * rascunho; rascunho sem edição não registrada depois da aprovação; checagens
 * do texto (CFM, idioma, tamanhos, CVV); fila pausada por token; e a MESMA
 * cadência da fila (REDES_POSTS_POR_DIA nas últimas 24h e intervalo mínimo),
 * contando os posts da fila e os deste bot. Nunca publica duas vezes a mesma peça.
 * Artigo que a fila já postou no feed (`publicadoRedesEm`) não ganha carrossel
 * nem Reel do bot, a não ser com --forcar (fica anotado no registro).
 *
 * Toda legenda leva a identificação do médico e o aviso da Res. CFM 2.454/2026.
 * Logs de envio (data, rede, id, link, status HTTP) vão para o .json do aprovado
 * e para a coleção registrospublicacao; publicado o carrossel, o par .md/.json
 * vai para CONTEUDO_INSTAGRAM/publicados/.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}

const db = require('../backend/lib/db');
const Artigo = require('../backend/models/Artigo');
const RegistroPublicacao = require('../backend/models/RegistroPublicacao');
const { lerAprovado, lerMetadadosVideo, renderizarSlides } = require('../backend/lib/carrosselAprovado');
const { publicarCarrosselNoInstagram, publicarReelNoInstagram, publicarNoLinkedIn } = require('../backend/lib/socialPublisher');
const { inspecionarVideo, validarVideo, sha256Arquivo } = require('../backend/lib/videoRedes');
const { enviarVideo, validarMetadados, credenciaisYoutube } = require('../backend/lib/youtube');
const { estadoPausa, registrarTokenInvalido } = require('../backend/lib/tokenInstagram');
// Mesma regra de cadência da fila (contagem unificada fila + bot, filaRedes.js).
const { motivoParaAguardar } = require('../backend/lib/filaRedes');
const { temaSensivel, IDENTIFICACAO_3_LINHAS, temIdentificacaoSocial } = require('../backend/lib/legendaInstagram');
const { checarEticaCfm } = require('../backend/lib/checagensAprovacao');
const { AVISO_CFM, IDENTIFICACAO, IDENTIFICACAO_COMPLETA, garantirConformidade, faltasConformidade } = require('../backend/lib/conformidadeCfm');
const { calcularMatriz } = require('../backend/lib/matrizMidia');
const { RE_INGLES, TERMOS_CFM, semNomesProprios } = require('../backend/lib/checagemRedes');
const { hashArtigo, hashTexto } = require('./bot-gemini');

const PASTA = path.join(RAIZ, 'CONTEUDO_INSTAGRAM');
const APROVADOS = path.join(PASTA, 'aprovados');
const RASCUNHOS = path.join(PASTA, 'rascunhos');
const PUBLICADOS = path.join(PASTA, 'publicados');
const BASE_API = process.env.BOT_API_BASE || 'https://drsaudemental.vercel.app';
const SITE = 'https://drsaudemental.vercel.app';
const LIMITE_LEGENDA = 2200;

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

const palavras = (s) => String(s).split(/\s+/).filter((p) => /[\p{L}\d]/u.test(p)).length;

/**
 * Trava inversa da fila (filaRedes.listarFila já pula o que o bot publicou):
 * artigo com `publicadoRedesEm` já foi postado no feed pela fila, e um
 * carrossel ou Reel do bot o repetiria. Só `--forcar` libera.
 */
function motivoJaPostadoPelaFila(artigo, { forcar = false } = {}) {
  if (forcar || !artigo || !artigo.publicadoRedesEm) return null;
  const em = new Date(artigo.publicadoRedesEm).toISOString().slice(0, 16).replace('T', ' ');
  return `a fila já postou este artigo no feed em ${em} UTC — use --forcar para publicar mesmo assim`;
}

/** Nota para o registro de publicação quando --forcar passou por cima da trava. */
function notaForcado(artigo, forcar) {
  return forcar && artigo.publicadoRedesEm ? `publicado com --forcar: a fila já tinha postado em ${new Date(artigo.publicadoRedesEm).toISOString()}` : '';
}

/** Metadados do aprovado; na primeira vez, copia o .json de rascunhos/ (aprovações anteriores a este módulo). */
function lerMeta(slug) {
  const arquivo = path.join(APROVADOS, `${slug}.json`);
  if (!fs.existsSync(arquivo)) {
    const antigo = path.join(RASCUNHOS, `${slug}.json`);
    if (!fs.existsSync(antigo)) return null;
    fs.copyFileSync(antigo, arquivo);
  }
  return { arquivo, meta: JSON.parse(fs.readFileSync(arquivo, 'utf8')) };
}

/** Legenda final: a aprovada + (tema sensível) CVV + identificação + aviso CFM, antes das hashtags. */
function montarLegenda(legendaAprovada, { sensivel = false } = {}) {
  return garantirConformidade(legendaAprovada, { sensivel, identificacao: IDENTIFICACAO_3_LINHAS });
}

/** Post do LinkedIn: o aprovado + CVV (tema sensível), identificação e aviso CFM. */
function montarTextoLinkedin(texto, artigo) {
  return garantirConformidade(texto, { sensivel: temaSensivel(artigo), identificacao: IDENTIFICACAO_3_LINHAS });
}

/** Grava o .json do pacote com a matriz multimídia recalculada (backend/lib/matrizMidia.js). */
function gravarMeta(arquivo, meta) {
  meta.matriz = calcularMatriz(meta);
  fs.writeFileSync(arquivo, JSON.stringify(meta, null, 2));
}

function checarTexto({ aprovado, legenda, artigo }) {
  const falhas = [];
  const n = aprovado.slides.length;
  if (n < 2 || n > 10) falhas.push(`carrossel com ${n} slides (o Instagram aceita de 2 a 10)`);
  aprovado.slides.forEach((s, i) => {
    const p = palavras(s.texto.replace(/\s*Apoio agora: CVV 188 · SAMU 192/, ''));
    if (p > 25) falhas.push(`slide ${i + 1} com ${p} palavras (máx. 25)`);
  });
  const artes = aprovado.slides.map((s) => s.texto).join('\n');
  const ingles = semNomesProprios(artes).match(RE_INGLES);
  if (ingles) falhas.push(`inglês nos slides: "${ingles[2]}"`);
  const tudo = `${artes}\n${legenda}`;
  for (const [re, motivo] of TERMOS_CFM) {
    const m = tudo.match(re);
    if (m) falhas.push(`CFM: ${motivo} ("${m[0]}")`);
  }
  if (/\bAntonio\b/.test(tudo)) falhas.push('"Antonio" sem acento');
  if (/#psiquiatria\b/i.test(tudo)) falhas.push('#psiquiatria');
  const marca = tudo.match(/#(?:dr|doutor|dra)[\p{L}\d_]*/iu);
  if (marca) falhas.push(`hashtag de marca "${marca[0]}" (Regra 17: as vagas de hashtag são para temas)`);
  if (/https?:\/\/|www\./i.test(legenda)) falhas.push('URL solta na legenda (não é clicável no Instagram)');
  if ([...legenda].length > LIMITE_LEGENDA) falhas.push(`legenda com ${[...legenda].length} caracteres (máx. ${LIMITE_LEGENDA})`);
  const hashtags = legenda.match(/#[\p{L}\d_]+/gu) || [];
  if (hashtags.length < 3 || hashtags.length > 5) falhas.push(`${hashtags.length} hashtags (3 a 5)`);
  if (!legenda.includes(AVISO_CFM)) falhas.push('legenda sem o aviso da Res. CFM 2.454/2026');
  if (!temIdentificacaoSocial(legenda)) falhas.push('legenda sem a identificação do médico');
  if (temaSensivel(artigo) && !legenda.includes('CVV 188')) falhas.push('tema sensível sem CVV 188 na legenda');
  // Ética médica/CFM (promessa de cura, sensacionalismo, identificação, CVV) — checagensAprovacao.js.
  falhas.push(...checarEticaCfm(legenda, { contexto: 'social', sensivel: temaSensivel(artigo) }).falhas.map((f) => `ética/CFM: ${f}`));
  return falhas;
}

const LIMITE_VIDEO_BLOB = 4400 * 1024; // corpo máximo da função da Vercel

/** Grava o MP4 aprovado no Blob (PUT /api/admin/redes-video) e devolve a URL pública. */
async function enviarVideoBlob(slug, peca, arquivo, sha256) {
  if (!process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no .env (necessário para gravar o vídeo no Blob)');
  const bytes = fs.readFileSync(arquivo);
  if (bytes.length > LIMITE_VIDEO_BLOB) {
    throw new Error(`vídeo com ${(bytes.length / 1024 / 1024).toFixed(1)} MB — o envio pela API do site aceita até 4,4 MB (reduza o bitrate e aprove de novo)`);
  }
  const nome = `${peca}-${sha256.slice(0, 12)}`;
  const r = await fetch(`${BASE_API}/api/admin/redes-video/${slug}/${nome}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'video/mp4' },
    body: bytes,
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok || !corpo.url) throw new Error(`upload do vídeo ${nome} falhou (HTTP ${r.status}: ${corpo.erro || ''})`);
  return corpo.url;
}

async function enviarSlide(slug, nome, buffer) {
  const r = await fetch(`${BASE_API}/api/admin/redes-midia/${slug}/${nome}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'image/png' },
    body: buffer,
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok || !corpo.url) throw new Error(`upload do slide ${nome} falhou (HTTP ${r.status}: ${corpo.erro || ''})`);
  return corpo.url;
}

async function publicarAprovado(slug, { confirmar, redes, forcar = false }) {
  const lido = lerMeta(slug);
  const arquivoMd = path.join(APROVADOS, `${slug}.md`);
  if (!lido || !fs.existsSync(arquivoMd)) return { slug, ok: false, motivo: 'aprovado não encontrado em CONTEUDO_INSTAGRAM/aprovados/' };
  const { arquivo, meta } = lido;

  // 1) Aprovação médica formal.
  if (!meta.aprovacao) return { slug, ok: false, motivo: 'sem aprovação médica registrada — rode npm run bot:aprovar' };

  // 2) Artigo inalterado desde o rascunho.
  const artigo = await Artigo.findOne({ slug }).lean();
  if (!artigo) return { slug, ok: false, motivo: 'artigo não existe mais no banco' };
  if (hashArtigo(artigo) !== meta.hashArtigo) return { slug, ok: false, motivo: 'o artigo mudou depois do rascunho — gere e aprove de novo' };

  // 3) Nenhuma edição depois da aprovação sem registro.
  const md = fs.readFileSync(arquivoMd, 'utf8');
  const semCabecalho = (t) => t.replace(/^> ✅ \*\*Aprovado\*\*.*\n> .*\n\n?/m, '').replace(/^# APROVADO — /, '# RASCUNHO — ');
  const hashAtual = hashTexto(semCabecalho(md));
  const editadoSemRegistro =
    hashAtual !== meta.aprovacao.hashRascunhoAprovado &&
    crypto.createHash('sha256').update(semCabecalho(md)).digest('hex') !== meta.aprovacao.hashRascunhoAprovado &&
    !(meta.aprovacao.correcoesPosAprovacao || []).length;
  if (editadoSemRegistro) return { slug, ok: false, motivo: 'o aprovado foi editado depois da aprovação sem registro — aprove de novo' };

  // 4) Texto.
  const aprovado = lerAprovado(md);
  const legenda = montarLegenda(aprovado.legenda, { sensivel: temaSensivel(artigo) });
  const falhas = checarTexto({ aprovado, legenda, artigo });
  if (falhas.length) return { slug, ok: false, motivo: 'reprovado nas checagens de texto', falhas };

  const slides = await renderizarSlides(aprovado);
  const pastaSlides = path.join(APROVADOS, `${slug}-slides`);
  fs.mkdirSync(pastaSlides, { recursive: true });
  slides.forEach((s, i) => fs.writeFileSync(path.join(pastaSlides, `${String(i + 1).padStart(2, '0')}.png`), s.buffer));

  meta.publicacao = meta.publicacao || { instagram: null, linkedin: [], logs: [] };
  const manuais = ['Reels (roteiro — requer vídeo)', 'Stories (enquetes — a API não publica figurinhas)', 'YouTube Shorts (roteiro — requer vídeo)'];
  const plano = [];
  // Um carrossel por artigo: um pacote novo (rascunho regenerado para os vídeos)
  // não republica o carrossel que já está no ar — a fonte é o banco, não o arquivo.
  const carrosselNoAr = await RegistroPublicacao.findOne({ slug, origem: 'bot', resultado: 'publicado', 'redes.instagram.tipo': 'carrossel' })
    .select('data redes')
    .lean();
  if (carrosselNoAr && !meta.publicacao.instagram) {
    meta.publicacao.instagram = { ...carrosselNoAr.redes.instagram, em: carrosselNoAr.data, deOutroPacote: true };
  }
  // A fila já postou o artigo no feed: não repete (o LinkedIn segue normalmente).
  const bloqueioFila = redes.includes('instagram') && !meta.publicacao.instagram ? motivoJaPostadoPelaFila(artigo, { forcar }) : null;
  const querInstagram = redes.includes('instagram') && !meta.publicacao.instagram && !bloqueioFila;
  const linkedinPendente = aprovado.linkedin.find((p) => !meta.publicacao.linkedin.some((x) => x.titulo === p.titulo));
  const querLinkedin = redes.includes('linkedin') && linkedinPendente;
  if (querInstagram) plano.push(`Instagram: carrossel com ${slides.length} slides`);
  if (querLinkedin) plano.push(`LinkedIn: ${linkedinPendente.titulo}`);

  const aguardar = await motivoParaAguardar();
  const pausa = await estadoPausa();
  if (!confirmar) {
    return { slug, ok: true, previa: true, plano, manuais, legenda, pastaSlides, aguardar, pausa: pausa && pausa.motivo, bloqueioFila };
  }
  if (bloqueioFila && !querLinkedin) return { slug, ok: false, motivo: `Instagram bloqueado: ${bloqueioFila}` };

  // 5) Travas de envio.
  if (querInstagram && pausa) return { slug, ok: false, motivo: `fila/conta pausada: ${pausa.motivo}` };
  if (querInstagram && aguardar) return { slug, ok: false, motivo: `aguardando a cadência da conta: ${aguardar}` };
  if (!process.env.ADMIN_TOKEN) return { slug, ok: false, motivo: 'ADMIN_TOKEN ausente no .env (necessário para gravar os slides no Blob)' };

  const registrar = (log) => {
    meta.publicacao.logs.push({ em: new Date(), ...log });
    gravarMeta(arquivo, meta);
  };

  if (querInstagram) {
    try {
      const urls = [];
      for (const [i, s] of slides.entries()) {
        const nome = `slide-${String(i + 1).padStart(2, '0')}-${crypto.createHash('sha256').update(s.buffer).digest('hex').slice(0, 10)}`;
        urls.push(await enviarSlide(slug, nome, s.buffer));
      }
      const r = await publicarCarrosselNoInstagram({ imagensUrls: urls, legenda });
      meta.publicacao.instagram = { id: r.id, permalink: r.permalink, statusHttp: r.statusHttp, itens: r.itens, em: new Date() };
      registrar({ rede: 'instagram', peca: 'carrossel', status: 'publicado', statusHttp: r.statusHttp, id: r.id, permalink: r.permalink });
      await RegistroPublicacao.create({
        artigo: artigo._id,
        slug,
        origem: 'bot',
        resultado: 'publicado',
        motivo: notaForcado(artigo, forcar),
        legenda,
        redes: { instagram: { id: r.id, permalink: r.permalink, tipo: 'carrossel', itens: r.itens } },
      });
    } catch (err) {
      registrar({ rede: 'instagram', peca: 'carrossel', status: 'falhou', codigo: err.codigo || null, erro: String(err.message).slice(0, 300) });
      if (err.codigo === 'INSTAGRAM_TOKEN_INVALIDO') {
        const m = err.erroMeta || {};
        await registrarTokenInvalido({ origem: `bot de mídias (${slug})`, codigo: m.code, subcodigo: m.error_subcode, mensagem: m.message });
      }
      return { slug, ok: false, motivo: `Instagram falhou: ${err.message}` };
    }
  }

  if (querLinkedin) {
    try {
      const texto = montarTextoLinkedin(linkedinPendente.texto, artigo);
      const faltas = faltasConformidade(texto, { sensivel: temaSensivel(artigo) });
      if (faltas.length) throw new Error(`LinkedIn reprovado na conformidade: ${faltas.join('; ')}`);
      const r = await publicarNoLinkedIn({ url: `${SITE}/artigo/${slug}`, titulo: artigo.titulo, legenda: texto });
      meta.publicacao.linkedin.push({ titulo: linkedinPendente.titulo, id: r.id, em: new Date() });
      registrar({ rede: 'linkedin', peca: linkedinPendente.titulo, status: 'publicado', id: r.id });
    } catch (err) {
      registrar({ rede: 'linkedin', peca: linkedinPendente.titulo, status: 'falhou', codigo: err.codigo || null, erro: String(err.message).slice(0, 300) });
    }
  }

  // Carrossel publicado: o aprovado vai para publicados/ (LinkedIn restante pode seguir de lá).
  let movido = false;
  if (meta.publicacao.instagram) {
    fs.mkdirSync(PUBLICADOS, { recursive: true });
    gravarMeta(arquivo, meta);
    for (const nome of [`${slug}.md`, `${slug}.json`]) fs.renameSync(path.join(APROVADOS, nome), path.join(PUBLICADOS, nome));
    fs.renameSync(pastaSlides, path.join(PUBLICADOS, `${slug}-slides`));
    movido = true;
  }
  return { slug, ok: true, instagram: meta.publicacao.instagram, linkedin: meta.publicacao.linkedin, manuais, movido, bloqueioFila };
}

/* ============================ Vídeos (Reels, YouTube) ============================ */

const PECA_PADRAO = { reel: 'reel-1', short: 'short-1', longo: 'longo' };

/** O aprovado pode estar em aprovados/ ou, depois do carrossel, em publicados/. */
function localizar(slug) {
  for (const pasta of [APROVADOS, PUBLICADOS]) {
    const md = path.join(pasta, `${slug}.md`);
    const json = path.join(pasta, `${slug}.json`);
    if (fs.existsSync(md) && fs.existsSync(json)) return { pasta, md, json };
  }
  return null;
}

/** Descrição final do YouTube: a aprovada + link, capítulos, apoio, identificação e aviso CFM. */
function montarDescricaoYoutube({ metadados, slug, sensivel, short }) {
  const partes = [metadados.descricao, `Artigo completo: ${SITE}/artigo/${slug}`];
  if (metadados.capitulos.length) partes.push(['Capítulos:', ...metadados.capitulos.map((c) => `${c.tempo} ${c.titulo}`)].join('\n'));
  partes.push(['Conteúdo educativo. Não substitui avaliação individual.', sensivel ? 'Se precisar de apoio: CVV 188 (ligação gratuita, 24h) · SAMU 192' : ''].filter(Boolean).join('\n'));
  partes.push(IDENTIFICACAO_COMPLETA, AVISO_CFM);
  if (short) partes.push('#Shorts');
  return partes.join('\n\n');
}

function checarTextoVideo(texto) {
  const falhas = [];
  for (const [re, motivo] of TERMOS_CFM) {
    const m = texto.match(re);
    if (m) falhas.push(`CFM: ${motivo} ("${m[0]}")`);
  }
  if (/\bAntonio\b/.test(texto)) falhas.push('"Antonio" sem acento');
  if (/#psiquiatria\b/i.test(texto)) falhas.push('#psiquiatria');
  const marca = texto.match(/#(?:dr|doutor|dra)[\p{L}\d_]*/iu);
  if (marca) falhas.push(`hashtag de marca "${marca[0]}"`);
  return falhas;
}

async function publicarVideo(slug, { tipo, peca, arquivo, confirmar, forcar = false }) {
  const local = localizar(slug);
  if (!local) return { slug, ok: false, motivo: 'aprovado não encontrado em aprovados/ nem em publicados/' };
  const meta = JSON.parse(fs.readFileSync(local.json, 'utf8'));
  if (!meta.aprovacao) return { slug, ok: false, motivo: 'sem aprovação médica do roteiro — rode npm run bot:aprovar' };

  const artigo = await Artigo.findOne({ slug }).lean();
  if (!artigo) return { slug, ok: false, motivo: 'artigo não existe mais no banco' };
  if (hashArtigo(artigo) !== meta.hashArtigo) return { slug, ok: false, motivo: 'o artigo mudou depois do rascunho — gere e aprove de novo' };

  // Aprovação do ARQUIVO de vídeo (bot-aprovar --midia): hash precisa bater.
  // Sem --arquivo: o vídeo no lugar padrão (<pasta>/<slug>-videos/<peça>.mp4, onde o bot:video-carrossel grava).
  if (!arquivo) {
    const padrao = path.join(local.pasta, `${slug}-videos`, `${peca}.mp4`);
    if (fs.existsSync(padrao)) arquivo = padrao;
  }
  if (!arquivo || !fs.existsSync(arquivo)) return { slug, ok: false, motivo: `informe o vídeo com --arquivo=<caminho do .mp4> (não há ${peca}.mp4 em ${slug}-videos/)` };
  // Dublagens (EN/ES, bot:elevenlabs --dublar) são estrutura de internacionalização:
  // publicar em outro idioma é decisão do dono da conta (Regra 17, identificação CFM).
  if (/[\\/]dublagens[\\/]/.test(path.resolve(arquivo))) {
    return { slug, ok: false, motivo: 'arquivo de dublagens/ — publicar em outro idioma exige decisão do dono da conta (Regra 17)' };
  }
  const hash = sha256Arquivo(arquivo);
  const aprovada = (meta.aprovacao.midias || []).find((m) => m.peca === peca && m.sha256 === hash);
  if (!aprovada) {
    return { slug, ok: false, motivo: `este arquivo não tem aprovação médica como ${peca} — rode npm run bot:aprovar -- --slug=${slug} --midia="${arquivo}" --peca=${peca}` };
  }
  const falhasVideo = validarVideo(inspecionarVideo(arquivo), tipo);
  if (falhasVideo.length) return { slug, ok: false, motivo: 'vídeo fora das especificações', falhas: falhasVideo };

  meta.publicacao = meta.publicacao || { instagram: null, linkedin: [], logs: [] };
  meta.publicacao.videos = meta.publicacao.videos || {};
  if (meta.publicacao.videos[peca]) return { slug, ok: false, motivo: `${peca} já publicado em ${meta.publicacao.videos[peca].em}` };

  const registrar = (log) => {
    meta.publicacao.logs.push({ em: new Date(), ...log });
    gravarMeta(local.json, meta);
  };
  const md = fs.readFileSync(local.md, 'utf8');

  if (tipo === 'reel') {
    // Reel também vai para o feed: mesma trava inversa da fila. YouTube não entra.
    const bloqueioFila = motivoJaPostadoPelaFila(artigo, { forcar });
    if (bloqueioFila) return { slug, ok: false, motivo: `Reel bloqueado: ${bloqueioFila}` };
    const legenda = montarLegenda(lerAprovado(md).legenda, { sensivel: temaSensivel(artigo) });
    const falhas = [...checarTextoVideo(legenda), ...faltasConformidade(legenda, { sensivel: temaSensivel(artigo) })];
    if ([...legenda].length > LIMITE_LEGENDA) falhas.push(`legenda com ${[...legenda].length} caracteres`);
    if (falhas.length) return { slug, ok: false, motivo: 'legenda reprovada', falhas };
    const aguardar = await motivoParaAguardar();
    const pausa = await estadoPausa();
    if (!confirmar) return { slug, ok: true, previa: true, plano: [`Instagram: Reel ${peca} (${path.basename(arquivo)})`], legenda, aguardar, pausa: pausa && pausa.motivo };
    if (pausa) return { slug, ok: false, motivo: `conta pausada: ${pausa.motivo}` };
    if (aguardar) return { slug, ok: false, motivo: `aguardando a cadência da conta: ${aguardar}` };
    try {
      // Instagram Login (IGAA): só video_url público — o MP4 aprovado vai antes para o Blob.
      const videoUrl = String(process.env.INSTAGRAM_ACCESS_TOKEN || '').startsWith('IGAA') ? await enviarVideoBlob(slug, peca, arquivo, hash) : null;
      const r = await publicarReelNoInstagram({ arquivo, videoUrl, legenda });
      meta.publicacao.videos[peca] = { rede: 'instagram', id: r.id, permalink: r.permalink, statusHttp: r.statusHttp, sha256: hash, em: new Date() };
      registrar({ rede: 'instagram', peca, status: 'publicado', statusHttp: r.statusHttp, id: r.id, permalink: r.permalink });
      await RegistroPublicacao.create({ artigo: artigo._id, slug, origem: 'bot', resultado: 'publicado', motivo: notaForcado(artigo, forcar), legenda, redes: { instagram: { id: r.id, permalink: r.permalink, tipo: 'reel' } } });
      return { slug, ok: true, video: meta.publicacao.videos[peca] };
    } catch (err) {
      registrar({ rede: 'instagram', peca, status: 'falhou', codigo: err.codigo || null, erro: String(err.message).slice(0, 300) });
      if (err.codigo === 'INSTAGRAM_TOKEN_INVALIDO') {
        const m = err.erroMeta || {};
        await registrarTokenInvalido({ origem: `bot de mídias (${slug}, ${peca})`, codigo: m.code, subcodigo: m.error_subcode, mensagem: m.message });
      }
      return { slug, ok: false, motivo: `Reel falhou: ${err.message}` };
    }
  }

  // YouTube: Short ou vídeo longo.
  const metadados = lerMetadadosVideo(md, peca);
  if (!metadados) return { slug, ok: false, motivo: `bloco metadados:${peca} não encontrado no aprovado` };
  const descricao = montarDescricaoYoutube({ metadados, slug, sensivel: temaSensivel(artigo), short: tipo === 'short' });
  const falhas = [
    ...checarTextoVideo(`${metadados.titulo}\n${descricao}\n${metadados.tags.join(' ')}`),
    ...validarMetadados({ titulo: metadados.titulo, descricao, tags: metadados.tags }),
    ...faltasConformidade(descricao, { sensivel: temaSensivel(artigo) }),
  ];
  const marcaTag = metadados.tags.find((t) => /^(dr|dra|doutor)\s?ant|ant[oô]nio\s?felipe/i.test(t));
  if (marcaTag) falhas.push(`tag de marca "${marcaTag}" (Regra 17)`);
  if (falhas.length) return { slug, ok: false, motivo: 'metadados reprovados', falhas };
  const privacidade = ['public', 'unlisted', 'private'].includes(process.env.YOUTUBE_PRIVACIDADE) ? process.env.YOUTUBE_PRIVACIDADE : 'public';
  if (!confirmar) {
    return { slug, ok: true, previa: true, plano: [`YouTube ${tipo === 'short' ? 'Short' : 'vídeo longo'} ${peca} (${path.basename(arquivo)}), ${privacidade}`], titulo: metadados.titulo, legenda: descricao, tags: metadados.tags, youtubeSemCredencial: !credenciaisYoutube() };
  }
  if (!credenciaisYoutube()) return { slug, ok: false, motivo: 'faltam YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN no .env (npm run youtube:autorizar)' };
  try {
    const r = await enviarVideo({ arquivo, titulo: metadados.titulo, descricao, tags: metadados.tags, privacidade, short: tipo === 'short' });
    meta.publicacao.videos[peca] = { rede: 'youtube', id: r.id, link: r.link, statusHttp: r.statusHttp, privacidade: r.privacidade, sha256: hash, em: new Date() };
    registrar({ rede: 'youtube', peca, status: 'publicado', statusHttp: r.statusHttp, id: r.id, link: r.link, privacidade: r.privacidade });
    await RegistroPublicacao.create({ artigo: artigo._id, slug, origem: 'bot', resultado: 'publicado', legenda: descricao, redes: { youtube: { id: r.id, link: r.link, tipo, privacidade: r.privacidade } } });
    return { slug, ok: true, video: meta.publicacao.videos[peca], avisoPrivacidade: r.privacidade !== privacidade ? `o YouTube aplicou "${r.privacidade}" (projeto de API não auditado?)` : null };
  } catch (err) {
    registrar({ rede: 'youtube', peca, status: 'falhou', codigo: err.codigo || null, erro: String(err.message).slice(0, 300) });
    return { slug, ok: false, motivo: `YouTube falhou: ${err.message}` };
  }
}

async function mainVideo(args) {
  const tipo = String(args.tipo);
  const peca = String(args.peca || PECA_PADRAO[tipo]);
  const confirmar = Boolean(args.confirmar);
  if (!args.slug) return console.log('\n  Use --slug=<slug> --tipo=reel|short|longo --arquivo=<.mp4> [--peca=reel-1] [--confirmar] [--forcar].\n');
  await db.connect();
  const r = await publicarVideo(String(args.slug), { tipo, peca, arquivo: args.arquivo && String(args.arquivo), confirmar, forcar: Boolean(args.forcar) });
  if (!r.ok) {
    console.log(`\n  ⏸  ${r.slug}: ${r.motivo}`);
    for (const f of r.falhas || []) console.log(`       - ${f}`);
  } else if (r.previa) {
    console.log(`\n  PRÉVIA (nada será publicado) · ${r.slug}\n     plano: ${r.plano.join(' · ')}`);
    if (r.titulo) console.log(`     título: ${r.titulo}\n     tags: ${r.tags.join(', ')}`);
    if (r.youtubeSemCredencial) console.log('     ⚠️  YouTube ainda sem credencial no .env (npm run youtube:autorizar)');
    if (r.aguardar) console.log(`     cadência da conta: aguardar — ${r.aguardar}`);
    console.log(`     ${tipo === 'reel' ? 'legenda' : 'descrição'}:\n       ${r.legenda.replace(/\n/g, '\n       ')}`);
  } else {
    console.log(`\n  ✅ ${r.slug}: ${peca} publicado → ${r.video.permalink || r.video.link} (HTTP ${r.video.statusHttp})${r.avisoPrivacidade ? `\n     ⚠️  ${r.avisoPrivacidade}` : ''}`);
  }
  console.log(`\n  ${AVISO_CFM}\n`);
  await db.mongoose.disconnect();
}

async function main() {
  const args = argumentos();
  if (['reel', 'short', 'longo'].includes(args.tipo)) return mainVideo(args);
  const confirmar = Boolean(args.confirmar);
  const disponiveis = [
    process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN && 'instagram',
    process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN && 'linkedin',
  ].filter(Boolean);
  const redes = args.redes ? String(args.redes).split(',').filter((r) => disponiveis.includes(r)) : disponiveis;

  let slugs;
  if (args.slug) slugs = [String(args.slug)];
  else if (args.todos) {
    slugs = fs.existsSync(APROVADOS) ? fs.readdirSync(APROVADOS).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : [];
  } else {
    console.log('\n  Use --slug=<slug> ou --todos [--confirmar] [--redes=instagram,linkedin] [--forcar].\n');
    return;
  }
  if (!slugs.length) return console.log('\n  Nenhum aprovado pendente de publicação.\n');

  await db.connect();
  console.log(`\n  ${confirmar ? 'PUBLICAÇÃO' : 'PRÉVIA (nada será publicado)'} · redes com credencial: ${disponiveis.join(', ') || 'nenhuma'} · usadas: ${redes.join(', ') || 'nenhuma'}\n`);
  for (const slug of slugs) {
    const r = await publicarAprovado(slug, { confirmar, redes, forcar: Boolean(args.forcar) });
    if (!r.ok) {
      console.log(`  ⏸  ${slug}: ${r.motivo}`);
      for (const f of r.falhas || []) console.log(`       - ${f}`);
      continue;
    }
    if (r.previa) {
      console.log(`  ${slug}:`);
      console.log(`     plano: ${r.plano.join(' · ') || 'nada a publicar (já publicado ou sem rede)'}`);
      console.log(`     slides desenhados em: ${path.relative(RAIZ, r.pastaSlides)}`);
      console.log(`     cadência da conta agora: ${r.aguardar ? `aguardar — ${r.aguardar}` : 'livre'}${r.pausa ? ` · PAUSADA: ${r.pausa}` : ''}`);
      if (r.bloqueioFila) console.log(`     ⚠️  Instagram bloqueado: ${r.bloqueioFila}`);
      console.log(`     manual: ${r.manuais.join('; ')}`);
      console.log(`     legenda (${[...r.legenda].length} car.):\n       ${r.legenda.replace(/\n/g, '\n       ')}\n`);
      continue;
    }
    console.log(`  ✅ ${slug}: ${r.instagram ? `Instagram ${r.instagram.permalink || r.instagram.id} (HTTP ${r.instagram.statusHttp})` : 'Instagram não publicado'}${r.linkedin.length ? ` · LinkedIn ${r.linkedin.length} post(s)` : ''}${r.movido ? ' · movido para publicados/' : ''}`);
    if (r.bloqueioFila) console.log(`     ⚠️  Instagram bloqueado: ${r.bloqueioFila}`);
    console.log(`     manual: ${r.manuais.join('; ')}`);
  }
  console.log(`\n  ${AVISO_CFM}\n`);
  await db.mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error('\n  Falha:', err.message, '\n');
    try {
      await db.mongoose.disconnect();
    } catch {
      // conexão já pode ter caído.
    }
    process.exit(1);
  });
}

module.exports = { montarLegenda, montarTextoLinkedin, checarTexto, montarDescricaoYoutube, checarTextoVideo, motivoJaPostadoPelaFila, notaForcado, gravarMeta };
