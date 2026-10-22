/**
 * Narração dos textos do app Next (domínio único, etapa A, 22/10/2026).
 * Lê o MDX de src/content/artigos e content/blog, prepara o texto falado (sem identificação do médico, com o aviso
 * de protocolos locais), narra com Edge-TTS (pt-BR-AntonioNeural, dicionário de pronúncia, vinheta v1 do Portal),
 * confere o áudio e, só se passar, envia ao Blob (narracoes/app/<slug>.mp3) e grava src/content/narracoes.json.
 *
 *   node scripts/narrar-app.js                        dry-run: prepara o texto, mostra o hash e a auditoria (não gera áudio)
 *   node scripts/narrar-app.js --slug=a,b --aplicar   gera, confere, envia e grava o manifesto (só com --aplicar)
 *   node scripts/narrar-app.js --conferir             só leitura: marca como "renarrar" as narrações cujo MDX mudou
 *
 * Quem reprova em qualquer conferência não é enviado: vai para o relatório (relatorios/narracao-app-AAAAMMDD.md).
 * O MP3 antigo nunca é apagado do Blob; o item só deixa de tocar quando o MDX muda (hash da fonte no manifesto).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { carregarEnv } = require('./carregarEnv');
const { caminhosDoDominio } = require('./conferirPreview');
const { textoParaNarracao, hashNarracao, VOZ_NARRACAO, AVISO_REFERENCIAS } = require('../backend/lib/narracao');
const vinheta = require('../backend/lib/vinheta');
const { aplicarPronuncia } = require('../backend/lib/pronunciaTts');

const RAIZ = path.resolve(__dirname, '..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const MANIFESTO = path.join(APP, 'src/content/narracoes.json');
const PASTA_GERADA = path.join(RAIZ, 'narracoes-geradas', 'app');
const RELATORIOS = path.join(RAIZ, 'relatorios');
const EDGE_TTS = process.env.EDGE_TTS_BIN || path.join(RAIZ, 'reels_automation', '.venv', process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts');
const PYTHON = path.join(RAIZ, 'reels_automation', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const TRANSCREVER = path.join(RAIZ, 'scripts', 'youtube', 'transcrever.py');
const PROTOCOLOS = 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento e da rede de saúde locais.';

// Limites da conferência do áudio (acima disso, reprova).
const LIMITES = { werMax: 0.25, toleranciaDuracaoSeg: 2, picoMaxDb: -0.2, medioMinDb: -32, medioMaxDb: -12, silencioMaxSeg: 2 };

/** Caminho do MDX de cada um dos 24 textos (artigo ou blog). */
function arquivoDoTexto(item) {
  return item.tipo === 'artigo'
    ? path.join(APP, 'src/content/artigos', `${item.slug}.mdx`)
    : path.join(APP, 'content/blog', `${item.slug}.mdx`);
}

/** Hash da fonte (MDX bruto). A página do app compara com este valor: se o MDX mudar, a narração deixa de tocar. */
function hashFonte(mdx) {
  return crypto.createHash('sha256').update(mdx).digest('hex');
}

/** Metadados do bloco `export const metadata = {...}` (objeto literal dos próprios arquivos do repositório). */
function lerMetadata(mdx) {
  const m = mdx.match(/export const metadata = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error('MDX sem bloco metadata');
  return new Function(`return ${m[1]}`)();
}

// Linha que abre um bloco novo (título, item, citação, componente ou tag de bloco) e linha que fecha o bloco anterior.
const ABRE_BLOCO = /^(#{1,6}\s|[-*]\s|>\s?|<\/?(p|h[1-6]|li|ul|ol|lead|callout|refsnote|calltotool|blockquote|div|table|tr|section)\b|<[A-Z]\w*\b)/i;
const FECHA_BLOCO = /(<\/(p|h[1-6]|li|ul|ol|div|blockquote|table|section|callout|lead|refsnote)>|>)\s*$/i;

/**
 * Junta as quebras de linha do MDX dentro de um parágrafo. Sem isso, cada quebra no arquivo vira uma frase e ganha
 * ponto final ("...sala de aula que."), o que pausa a voz no meio da frase.
 */
function juntarLinhas(mdx) {
  const saida = [];
  let atual = null;
  for (const bruta of mdx.split('\n')) {
    const linha = bruta.trim();
    if (!linha) {
      if (atual !== null) saida.push(atual);
      atual = null;
      continue;
    }
    if (atual !== null && !ABRE_BLOCO.test(linha) && !FECHA_BLOCO.test(atual) && !/^(#{1,6}\s|[-*]\s|>\s?)/.test(atual)) {
      atual += ` ${linha}`;
      continue;
    }
    if (atual !== null) saida.push(atual);
    atual = linha;
  }
  if (atual !== null) saida.push(atual);
  return saida.join('\n');
}

/** Corpo do MDX em HTML simples, para a função que já prepara a narração (sem componentes, sem código). */
function corpoDoMdx(mdx) {
  return juntarLinhas(mdx
    .replace(/export const metadata = \{[\s\S]*?\n\};?/, ' ')
    .replace(/^import .*$/gm, ' '))
    .replace(/<RefsNote\b[\s\S]*?<\/RefsNote>/g, `<p>${AVISO_REFERENCIAS}</p>`)
    .replace(/^#{1,6}\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
    .replace(/^>\s?(.*)$/gm, '<p>$1</p>')
    .replace(/\{[^{}]*\}/g, ' ');
}

/** Texto narrado (o que o hash cobre) e texto falado (com o dicionário de pronúncia). Lança erro se houver identificação no corpo. */
function prepararTexto({ titulo, mdx }) {
  const base = textoParaNarracao({ titulo, conteudo: corpoDoMdx(mdx) });
  if (/CRM-?\s?BA|RQE\s*\d|n[ãa]o especialista/i.test(base)) {
    throw new Error('identificação do médico no corpo do texto (CRM, RQE ou NÃO ESPECIALISTA): remover do MDX antes de narrar');
  }
  // Um só aviso de referências por texto (o corpo pode trazer o aviso do RefsNote e o da seção "Referências").
  const linhas = base.split('\n').filter((l, i, todas) => l !== AVISO_REFERENCIAS || todas.indexOf(l) === i);
  const texto = `${linhas.join('\n')}\n${PROTOCOLOS}`;
  return { texto, textoFalado: aplicarPronuncia(texto) };
}

/** Auditoria determinística (T1) do que vai ao áudio. Devolve a lista de achados; vazia = passou. */
function auditarTexto({ titulo, mdx, texto }) {
  const achados = [];
  if (/#psiquiatria/i.test(mdx)) achados.push('hashtag #psiquiatria no texto');
  if (/Dr\.?\s*Ant[oô]nio Felipe[^.\n]{0,80}psiquiatra|psiquiatra[^.\n]{0,40}Ant[oô]nio Felipe/i.test(mdx)) achados.push('"psiquiatra" junto da identificação do Dr. Antônio Felipe');
  if (/\bAntonio\b/.test(texto)) achados.push('"Antonio" sem acento no texto narrado');
  if (/\{\{|�/.test(texto) || /Ã.Ã|Â©/.test(texto)) achados.push('marcador de template ou encoding quebrado');
  if (/https?:\/\//.test(texto)) achados.push('link não removido do texto narrado');
  if (!titulo) achados.push('título vazio');
  return achados;
}

/** Palavras normalizadas, para comparar a transcrição com o texto. */
function normalizarPalavras(t) {
  return String(t).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

/** Taxa de erro de palavras (distância de edição em palavras / palavras da referência). */
function werDe(referencia, hipotese) {
  const r = normalizarPalavras(referencia);
  const h = normalizarPalavras(hipotese);
  if (!r.length) return 1;
  let prev = Array.from({ length: h.length + 1 }, (_, j) => j);
  for (let i = 1; i <= r.length; i++) {
    const cur = [i];
    for (let j = 1; j <= h.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return Math.round((prev[h.length] / r.length) * 1000) / 1000;
}

/** Lê a saída do ffmpeg (volumedetect e silencedetect). */
function medirAudio(saida) {
  const medio = /mean_volume:\s*(-?[\d.]+) dB/.exec(saida);
  const pico = /max_volume:\s*(-?[\d.]+) dB/.exec(saida);
  const silencios = [...String(saida).matchAll(/silence_duration:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  return { medioDb: parseFloat(medio?.[1]), picoDb: parseFloat(pico?.[1]), silencioMaxSeg: silencios.length ? Math.max(...silencios) : 0 };
}

function analisarAudio(mp3) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mp3, '-af', 'volumedetect,silencedetect=noise=-45dB:d=2', '-f', 'null', '-'], { encoding: 'utf8' });
  return medirAudio(r.stderr || '');
}

/** Transcrição com faster-whisper (mesmo script da conferência de vídeos). */
function transcrever(mp3) {
  const r = spawnSync(PYTHON, ['-I', TRANSCREVER, mp3], { encoding: 'utf8', timeout: 900_000, maxBuffer: 50 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`whisper falhou: ${String(r.stderr || r.error?.message || '').slice(0, 300)}`);
  const linha = String(r.stdout).trim().split('\n').pop();
  return JSON.parse(linha)[0] || '';
}

/** Decide se o áudio passa: lista só os motivos de reprovação. */
function julgarAudio({ duracaoSeg, esperadaSeg, analise, wer }) {
  const motivos = [];
  if (Math.abs(duracaoSeg - esperadaSeg) > LIMITES.toleranciaDuracaoSeg) motivos.push(`duração ${duracaoSeg}s, esperado ${esperadaSeg}s`);
  if (!(analise.picoDb <= LIMITES.picoMaxDb)) motivos.push(`pico ${analise.picoDb} dB (corte/clipping)`);
  if (!(analise.medioDb >= LIMITES.medioMinDb && analise.medioDb <= LIMITES.medioMaxDb)) motivos.push(`volume médio ${analise.medioDb} dB fora de ${LIMITES.medioMinDb}..${LIMITES.medioMaxDb}`);
  if (analise.silencioMaxSeg >= LIMITES.silencioMaxSeg) motivos.push(`silêncio de ${analise.silencioMaxSeg}s (corte)`);
  if (!(wer <= LIMITES.werMax)) motivos.push(`WER ${wer} acima de ${LIMITES.werMax} (Whisper não bate com o texto)`);
  return motivos;
}

/** Gera o MP3 com Edge-TTS e aplica a vinheta de crédito. Devolve o caminho e os dados para a conferência. */
function gerarMp3(item, fonte, prep) {
  fs.mkdirSync(PASTA_GERADA, { recursive: true });
  for (const ext of ['.base.mp3', '.vinheta', '.mp3']) fs.rmSync(path.join(PASTA_GERADA, item.slug + ext), { force: true });
  const arquivoTxt = path.join(PASTA_GERADA, `${item.slug}.txt`);
  const arquivoMp3 = path.join(PASTA_GERADA, `${item.slug}.mp3`);
  fs.writeFileSync(arquivoTxt, prep.textoFalado);
  const r = spawnSync(EDGE_TTS, ['--voice', VOZ_NARRACAO, '--file', arquivoTxt, '--write-media', arquivoMp3], { encoding: 'utf8', timeout: 300_000, killSignal: 'SIGKILL' });
  if (r.status !== 0) throw new Error(`edge-tts falhou: ${(r.stderr || r.error?.message || '').slice(0, 300)}`);
  fs.rmSync(arquivoTxt, { force: true });
  const v = vinheta.aplicarAoMp3({ slug: item.slug, titulo: fonte.titulo, resumo: fonte.resumo, conteudo: corpoDoMdx(fonte.mdx) }, PASTA_GERADA, vinheta.garantirVinhetas());
  return { mp3: arquivoMp3, esperadaSeg: Math.round(v.esperada * 10) / 10, sensivel: v.sensivel };
}

/** Conferência guardada ao lado do MP3 local (só vale para o mesmo texto e a mesma fonte). */
function caminhoConferido(slug) {
  return path.join(PASTA_GERADA, `${slug}.conferido.json`);
}

function lerConferido(slug, p) {
  if (!fs.existsSync(caminhoConferido(slug))) return null;
  const c = JSON.parse(fs.readFileSync(caminhoConferido(slug), 'utf8'));
  return c.hash === p.hash && c.fonteHash === p.fonteHash && fs.existsSync(c.mp3) && !c.motivos.length ? c : null;
}

function gravarConferido(slug, conf) {
  fs.mkdirSync(PASTA_GERADA, { recursive: true });
  fs.writeFileSync(caminhoConferido(slug), JSON.stringify(conf, null, 2) + '\n');
}

function lerManifesto() {
  if (!fs.existsSync(MANIFESTO)) return {};
  return JSON.parse(fs.readFileSync(MANIFESTO, 'utf8'));
}

function gravarManifesto(manifesto) {
  const ordenado = Object.fromEntries(Object.keys(manifesto).sort().map((k) => [k, manifesto[k]]));
  fs.writeFileSync(MANIFESTO, JSON.stringify(ordenado, null, 2) + '\n');
}

const BASE_API = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';

/** Envio pela rota de narrações do app (mesma autenticação de narrar-artigos: ADMIN_TOKEN). Quem grava no Blob é o servidor. */
async function enviarPelaApi(slug, buffer, { hash, renarrar }) {
  const headers = { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'audio/mpeg', 'X-Narracao-Hash': hash };
  if (renarrar) headers['X-Narracao-Renarrar'] = '1';
  const resp = await fetch(`${BASE_API}/api/artigos/${encodeURIComponent(slug)}/midia/narracao-app`, { method: 'PUT', headers, body: buffer });
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`envio HTTP ${resp.status}: ${corpo.erro || ''}`.slice(0, 300));
  return corpo.url;
}

/** Confere a URL publicada: HTTP 200 e o mesmo tamanho e SHA-256 do MP3 que passou na conferência. */
async function conferirUrl(url, arquivo) {
  const resp = await fetch(url, { cache: 'no-store' });
  if (resp.status !== 200) throw new Error(`URL publicada respondeu HTTP ${resp.status}`);
  const publicado = Buffer.from(await resp.arrayBuffer());
  const local = fs.readFileSync(arquivo);
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
  if (publicado.length !== local.length || sha(publicado) !== sha(local)) throw new Error('conteúdo publicado difere do MP3 conferido');
  return sha(publicado);
}

/** Carrega a fonte de um item e tudo o que se calcula dela (sem gerar áudio). */
function preparar(item) {
  const arquivo = arquivoDoTexto(item);
  const mdx = fs.readFileSync(arquivo, 'utf8');
  const meta = lerMetadata(mdx);
  const fonte = { titulo: meta.titulo, resumo: meta.resumo, mdx };
  const prep = prepararTexto(fonte);
  return { item, fonte, prep, hash: hashNarracao(prep.texto, VOZ_NARRACAO), fonteHash: hashFonte(mdx), achados: auditarTexto({ ...fonte, texto: prep.texto }) };
}

function linhaDoRelatorio(r) {
  return `| ${r.item.slug} | ${r.item.tipo} | ${r.resultado} | ${r.detalhe} |`;
}

function escreverRelatorio(linhas, data) {
  fs.mkdirSync(RELATORIOS, { recursive: true });
  const arq = path.join(RELATORIOS, `narracao-app-${data}.md`);
  fs.writeFileSync(arq, linhas.join('\n') + '\n');
  return arq;
}

async function main() {
  carregarEnv();
  const args = process.argv.slice(2);
  const aplicar = args.includes('--aplicar');
  const conferir = args.includes('--conferir');
  const sel = args.find((a) => a.startsWith('--slug='));
  const todos = caminhosDoDominio();
  let alvo = todos;
  if (sel) {
    const lista = sel.slice('--slug='.length).split(',');
    alvo = todos.filter((t) => lista.includes(t.slug));
    if (alvo.length !== lista.length) throw new Error('algum slug não está nos 24 textos do domínio único');
  }
  const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const manifesto = lerManifesto();
  const linhas = [`# Narração do app (domínio único) — ${data}`, '', `Modo: ${aplicar ? 'APLICAR' : conferir ? 'CONFERIR' : 'DRY-RUN'}`, '', '| Slug | Tipo | Resultado | Detalhe |', '|---|---|---|---|'];
  const resultados = [];

  for (const item of alvo) {
    try {
      const p = preparar(item);
      if (conferir) {
        const e = manifesto[item.slug];
        const r = !e ? 'sem narração' : e.fonteHash === p.fonteHash ? 'em dia' : 'RENARRAR (MDX mudou)';
        if (e && e.fonteHash !== p.fonteHash) manifesto[item.slug] = { ...e, renarrar: true };
        resultados.push({ item, resultado: r, detalhe: `hash ${p.hash.slice(0, 12)}` });
        continue;
      }
      if (p.achados.length) {
        resultados.push({ item, resultado: 'REPROVADO (auditoria)', detalhe: p.achados.join('; ') });
        continue;
      }
      if (!aplicar) {
        resultados.push({ item, resultado: 'dry-run ok', detalhe: `${p.prep.texto.split(/\s+/).length} palavras, hash ${p.hash.slice(0, 12)}` });
        continue;
      }
      const atual = manifesto[item.slug];
      if (atual && atual.hash === p.hash && atual.fonteHash === p.fonteHash && atual.vinhetaVersao === vinheta.VINHETA_VERSAO && !atual.renarrar) {
        resultados.push({ item, resultado: 'já narrado', detalhe: `hash ${p.hash.slice(0, 12)}` });
        continue;
      }
      // Áudio já gerado e conferido para este mesmo texto: reutiliza (não gasta nova geração nem nova transcrição).
      let conf = lerConferido(item.slug, p);
      if (!conf) {
        const g = gerarMp3(item, p.fonte, p.prep);
        const analise = analisarAudio(g.mp3);
        const duracaoSeg = Math.round(vinheta.duracao(g.mp3) * 10) / 10;
        const referencia = [vinheta.TEXTOS.abertura, p.prep.texto, g.sensivel ? vinheta.TEXTOS.encerramentoSensivel : vinheta.TEXTOS.encerramento].join(' ');
        const wer = werDe(referencia, transcrever(g.mp3));
        const motivos = julgarAudio({ duracaoSeg, esperadaSeg: g.esperadaSeg, analise, wer });
        conf = { hash: p.hash, fonteHash: p.fonteHash, mp3: g.mp3, bytes: fs.statSync(g.mp3).size, duracaoSeg, wer, picoDb: analise.picoDb, medioDb: analise.medioDb, silencioMaxSeg: analise.silencioMaxSeg, esperadaSeg: g.esperadaSeg, motivos, geradaEm: new Date().toISOString() };
        gravarConferido(item.slug, conf);
      }
      const metricas = `dur ${conf.duracaoSeg}s (esp. ${conf.esperadaSeg}s), pico ${conf.picoDb} dB, médio ${conf.medioDb} dB, silêncio máx ${conf.silencioMaxSeg}s, WER ${conf.wer}`;
      if (conf.motivos.length) {
        resultados.push({ item, resultado: 'REPROVADO (áudio)', detalhe: `${conf.motivos.join('; ')} | ${metricas}` });
        continue;
      }
      if (args.includes('--sem-envio') || !process.env.ADMIN_TOKEN) {
        resultados.push({ item, resultado: 'CONFERIDO (aguardando envio)', detalhe: metricas });
        continue;
      }
      // Hash diferente do que já está publicado: é renarração, e a rota exige a ordem (X-Narracao-Renarrar).
      const renarrar = Boolean(atual && atual.hash !== p.hash);
      const url = await enviarPelaApi(item.slug, fs.readFileSync(conf.mp3), { hash: p.hash, renarrar });
      const sha256 = await conferirUrl(url, conf.mp3);
      manifesto[item.slug] = {
        url,
        hash: p.hash,
        sha256,
        fonteHash: p.fonteHash,
        vinhetaVersao: vinheta.VINHETA_VERSAO,
        voz: VOZ_NARRACAO,
        bytes: conf.bytes,
        duracaoSeg: conf.duracaoSeg,
        geradaEm: conf.geradaEm,
        renarrar: false,
        conferencia: { wer: conf.wer, picoDb: conf.picoDb, medioDb: conf.medioDb, silencioMaxSeg: conf.silencioMaxSeg, esperadaSeg: conf.esperadaSeg },
      };
      gravarManifesto(manifesto);
      resultados.push({ item, resultado: 'NARRADO e enviado', detalhe: metricas });
    } catch (erro) {
      resultados.push({ item, resultado: 'ERRO', detalhe: String(erro.message).slice(0, 300) });
    }
  }

  if (conferir) gravarManifesto(manifesto);
  linhas.push(...resultados.map(linhaDoRelatorio));
  const arq = escreverRelatorio(linhas, data);
  const resumo = resultados.reduce((acc, r) => ((acc[r.resultado.split(' ')[0]] = (acc[r.resultado.split(' ')[0]] || 0) + 1), acc), {});
  console.log(`Relatório: ${arq}`);
  console.log(JSON.stringify(resumo));
  if (!conferir && !aplicar) console.log('Dry-run: nada foi gerado, enviado nem gravado. Use --aplicar para narrar.');
}

module.exports = { juntarLinhas, corpoDoMdx, prepararTexto, auditarTexto, werDe, medirAudio, julgarAudio, hashFonte, lerMetadata, LIMITES, PROTOCOLOS };

if (require.main === module) {
  main().catch((erro) => {
    console.error(`narrar-app: ${erro.message}`);
    process.exitCode = 1;
  });
}
