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
const { lerAprovado, renderizarSlides } = require('../backend/lib/carrosselAprovado');
const { publicarCarrosselNoInstagram, publicarNoLinkedIn } = require('../backend/lib/socialPublisher');
const { estadoPausa, registrarTokenInvalido } = require('../backend/lib/tokenInstagram');
// Mesma regra de cadência da fila (contagem unificada fila + bot, filaRedes.js).
const { motivoParaAguardar } = require('../backend/lib/filaRedes');
const { IDENTIFICACAO, temaSensivel } = require('../backend/lib/legendaInstagram');
const { RE_INGLES, TERMOS_CFM, semNomesProprios } = require('../backend/lib/checagemRedes');
const { hashArtigo, hashTexto, AVISO_CFM } = require('./bot-gemini');

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

/** Legenda final: a aprovada + identificação + aviso CFM, antes das hashtags. */
function montarLegenda(legendaAprovada) {
  const blocos = legendaAprovada.split(/\n\s*\n/);
  const iHashtags = blocos.findIndex((b) => /^\s*#/.test(b));
  const fixos = [IDENTIFICACAO, AVISO_CFM].filter((f) => !legendaAprovada.includes(f));
  if (iHashtags < 0) return [...blocos, ...fixos].join('\n\n');
  return [...blocos.slice(0, iHashtags), ...fixos, ...blocos.slice(iHashtags)].join('\n\n');
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
  if (!legenda.includes(IDENTIFICACAO)) falhas.push('legenda sem a identificação do médico');
  if (temaSensivel(artigo) && !legenda.includes('CVV 188')) falhas.push('tema sensível sem CVV 188 na legenda');
  return falhas;
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

async function publicarAprovado(slug, { confirmar, redes }) {
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
  const legenda = montarLegenda(aprovado.legenda);
  const falhas = checarTexto({ aprovado, legenda, artigo });
  if (falhas.length) return { slug, ok: false, motivo: 'reprovado nas checagens de texto', falhas };

  const slides = await renderizarSlides(aprovado);
  const pastaSlides = path.join(APROVADOS, `${slug}-slides`);
  fs.mkdirSync(pastaSlides, { recursive: true });
  slides.forEach((s, i) => fs.writeFileSync(path.join(pastaSlides, `${String(i + 1).padStart(2, '0')}.png`), s.buffer));

  meta.publicacao = meta.publicacao || { instagram: null, linkedin: [], logs: [] };
  const manuais = ['Reels (roteiro — requer vídeo)', 'Stories (enquetes — a API não publica figurinhas)', 'YouTube Shorts (roteiro — requer vídeo)'];
  const plano = [];
  const querInstagram = redes.includes('instagram') && !meta.publicacao.instagram;
  const linkedinPendente = aprovado.linkedin.find((p) => !meta.publicacao.linkedin.some((x) => x.titulo === p.titulo));
  const querLinkedin = redes.includes('linkedin') && linkedinPendente;
  if (querInstagram) plano.push(`Instagram: carrossel com ${slides.length} slides`);
  if (querLinkedin) plano.push(`LinkedIn: ${linkedinPendente.titulo}`);

  const aguardar = await motivoParaAguardar();
  const pausa = await estadoPausa();
  if (!confirmar) {
    return { slug, ok: true, previa: true, plano, manuais, legenda, pastaSlides, aguardar, pausa: pausa && pausa.motivo };
  }

  // 5) Travas de envio.
  if (querInstagram && pausa) return { slug, ok: false, motivo: `fila/conta pausada: ${pausa.motivo}` };
  if (querInstagram && aguardar) return { slug, ok: false, motivo: `aguardando a cadência da conta: ${aguardar}` };
  if (!process.env.ADMIN_TOKEN) return { slug, ok: false, motivo: 'ADMIN_TOKEN ausente no .env (necessário para gravar os slides no Blob)' };

  const registrar = (log) => {
    meta.publicacao.logs.push({ em: new Date(), ...log });
    fs.writeFileSync(arquivo, JSON.stringify(meta, null, 2));
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
      const texto = linkedinPendente.texto.includes(AVISO_CFM) ? linkedinPendente.texto : `${linkedinPendente.texto}\n\n${AVISO_CFM}`;
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
    fs.writeFileSync(arquivo, JSON.stringify(meta, null, 2));
    for (const nome of [`${slug}.md`, `${slug}.json`]) fs.renameSync(path.join(APROVADOS, nome), path.join(PUBLICADOS, nome));
    fs.renameSync(pastaSlides, path.join(PUBLICADOS, `${slug}-slides`));
    movido = true;
  }
  return { slug, ok: true, instagram: meta.publicacao.instagram, linkedin: meta.publicacao.linkedin, manuais, movido };
}

async function main() {
  const args = argumentos();
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
    console.log('\n  Use --slug=<slug> ou --todos [--confirmar] [--redes=instagram,linkedin].\n');
    return;
  }
  if (!slugs.length) return console.log('\n  Nenhum aprovado pendente de publicação.\n');

  await db.connect();
  console.log(`\n  ${confirmar ? 'PUBLICAÇÃO' : 'PRÉVIA (nada será publicado)'} · redes com credencial: ${disponiveis.join(', ') || 'nenhuma'} · usadas: ${redes.join(', ') || 'nenhuma'}\n`);
  for (const slug of slugs) {
    const r = await publicarAprovado(slug, { confirmar, redes });
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
      console.log(`     manual: ${r.manuais.join('; ')}`);
      console.log(`     legenda (${[...r.legenda].length} car.):\n       ${r.legenda.replace(/\n/g, '\n       ')}\n`);
      continue;
    }
    console.log(`  ✅ ${slug}: ${r.instagram ? `Instagram ${r.instagram.permalink || r.instagram.id} (HTTP ${r.instagram.statusHttp})` : 'Instagram não publicado'}${r.linkedin.length ? ` · LinkedIn ${r.linkedin.length} post(s)` : ''}${r.movido ? ' · movido para publicados/' : ''}`);
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

module.exports = { montarLegenda, checarTexto };
