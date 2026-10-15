/**
 * Biblioteca do canal do YouTube (Dr. Antônio Felipe): metadados, legendas .srt, checagem pré-publicação, FFmpeg/ffprobe e artes.
 * Tudo local e sem custo (FFmpeg, PIL, Edge-TTS). Nenhuma publicação acontece aqui.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { IDENTIFICACAO_3_LINHAS } = require('../../backend/lib/legendaInstagram');
const { textoParaNarracao, hashNarracao, vozDaNarracao } = require('../../backend/lib/narracao');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const RAIZ = path.resolve(__dirname, '../..');
const SITE = 'https://www.drantoniofelipemedico.com.br';
const PY = path.join(RAIZ, 'reels_automation/.venv/Scripts/python.exe');
const MIDIA = path.join(RAIZ, 'carrosseis-instagram', 'youtube'); // fora do Git
const NARR = path.join(RAIZ, 'narracoes-geradas');
const REL = path.join(RAIZ, 'relatorios', 'youtube');
const AVISO_IA = 'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';
const AVISO_PROTOCOLOS = 'Conteúdo educativo, não substitui consulta. Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const CRISE = 'Em crise: CVV 188 · SAMU 192';
const EXCECAO_PSIQUIATRA = ['quando-encaminhar-aps', 'quando-procurar-psiquiatra-psicologo'];

const PLAYLISTS = ['Ansiedade', 'Depressão', 'Saúde Mental na APS', 'Urgências', 'Trabalho e NR-1', 'Cuidados Paliativos', 'Violência', 'Migração', 'Corpo e Saúde Mental', 'Relatos da Prática'];

const ENT = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&ndash;': '–', '&mdash;': '—', '&hellip;': '…' };
const semTags = (h) => String(h).replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] ?? ' ').replace(/\s+/g, ' ').trim();
const sha256 = (arq) => crypto.createHash('sha256').update(fs.readFileSync(arq)).digest('hex');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} falhou: ${String(r.stderr || r.error || '').slice(-600)}`);
  return r.stdout;
}
const duracao = (arq) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arq]));
function sondar(arq) {
  const j = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', arq]));
  const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio');
  return { largura: v?.width, altura: v?.height, fps: v?.r_frame_rate, temAudio: !!a, duracao: parseFloat(j.format.duration), bytes: Number(j.format.size) };
}
function arte(spec) {
  const tmp = path.join(MIDIA, '_tmp'); fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, `spec-${crypto.randomBytes(4).toString('hex')}.json`);
  fs.writeFileSync(f, JSON.stringify(spec), 'utf8');
  try { run(PY, ['-I', path.join(__dirname, 'arte.py'), f]); } finally { fs.rmSync(f, { force: true }); }
}

/** Separa o HTML em seções por <h2>. */
function secoes(html) {
  const partes = String(html).split(/(?=<h2\b)/i);
  const out = [];
  for (const p of partes) {
    const m = p.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    out.push({ titulo: m ? semTags(m[1]) : '', html: p });
  }
  return out;
}

function referencias(html) {
  const m = String(html).match(/<h2[^>]*>\s*Refer[eê]ncias[^<]*<\/h2>\s*<(ol|ul)\b[\s\S]*?<\/\1>/i);
  if (!m) return [];
  return [...m[0].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => {
    const link = (x[1].match(/href=["']([^"']+)["']/) || [])[1] || '';
    const txt = semTags(x[1]).replace(/\s+(doi:|www\.|planalto\.gov\.br|bvsms)\S*$/i, '').slice(0, 230);
    return link ? `${txt} ${link}` : txt;
  });
}

function playlistDe(a) {
  const s = a.slug, c = a.categoria || '';
  if (/^paliativos/.test(s)) return 'Cuidados Paliativos';
  if (/^relato/.test(s)) return 'Relatos da Prática';
  if (/^violencia|^relato-violencia/.test(s)) return 'Violência';
  if (/^migra|migrante|refugiad|xenofobia|venezuelan/.test(s)) return 'Migração';
  if (/nr1|nr-1|trabalh|burnout|assedio|empresa|lideranca|rh-|equipe|ocupacional/.test(s) || c === 'Empresas & RH') return 'Trabalho e NR-1';
  if (/suicid|autolesao|crise|urgenc|emergenc|pronto|agita|surto|ideacao|benzodiaz/.test(s)) return 'Urgências';
  if (/ansied|panico|fobia/.test(s)) return 'Ansiedade';
  if (/depress|luto|bipolar/.test(s)) return 'Depressão';
  if (/corpo|caneta|imagem-corporal|dieta|obesidade|peso|anabol|cirurgia|gordofobia|emagrec|alimentar|vigorexia|dismorfi|estetic|harmoniza|bariatrica/.test(s)) return 'Corpo e Saúde Mental';
  return 'Saúde Mental na APS';
}

function tagsDe(a) {
  const base = ['saúde mental', 'atenção primária à saúde', 'medicina de família e comunidade', 'Dr. Antônio Felipe', a.categoria, ...(a.tags || [])];
  const vistos = new Set(); const out = [];
  for (const t of base) {
    const x = String(t || '').trim();
    if (!x || /psiquiatr/i.test(x) || vistos.has(x.toLowerCase())) continue;
    vistos.add(x.toLowerCase());
    if ((out.concat(x)).join(',').length > 440) break;
    out.push(x);
  }
  return out;
}

const mmss = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`; };

/** Capítulos pelos títulos das seções (proporcional ao texto narrado). Devolve [] se não houver ao menos 3 de ≥ 10 s. */
function capitulos(a, dur) {
  const ss = secoes(a.conteudo).filter((s) => !/^Refer[eê]ncias/i.test(s.titulo));
  const tam = ss.map((s, i) => textoParaNarracao({ ...a, titulo: i === 0 ? a.titulo : '', conteudo: s.html }).length);
  const total = tam.reduce((x, y) => x + y, 0) || 1;
  let acc = 0; const out = [];
  ss.forEach((s, i) => { out.push({ t: (acc / total) * dur, nome: s.titulo || 'Introdução' }); acc += tam[i]; });
  out[0].t = 0;
  const bons = out.filter((c, i) => i === 0 || c.t - out[i - 1].t >= 10);
  return bons.length >= 3 ? bons : [];
}

function descricaoLongo(a, dur) {
  const caps = capitulos(a, dur);
  const refs = referencias(a.conteudo).slice(0, 4);
  const L = [
    semTags(a.resumo || a.titulo), '',
    `Texto completo no site: ${SITE}/artigo/${a.slug}`,
  ];
  if (caps.length) L.push('', 'Capítulos:', ...caps.map((c) => `${mmss(c.t)} ${c.nome}`));
  if (refs.length) L.push('', 'Principais referências:', ...refs.map((r, i) => `${i + 1}. ${r}`));
  L.push('', AVISO_PROTOCOLOS, CRISE, '', IDENTIFICACAO_COMPLETA, '', AVISO_IA, '',
    `Mentoria para profissionais da APS e consultoria para empresas: ${SITE}/mentoria`, `Todos os links: ${SITE}/links`);
  return L.join('\n').replace(/[<>]/g, '');
}

function descricaoShort(a, extra = '') {
  return [semTags(a.resumo || a.titulo), '', `Texto completo no site: ${SITE}/artigo/${a.slug}`, extra, '', AVISO_PROTOCOLOS, CRISE, '', IDENTIFICACAO_COMPLETA, '', AVISO_IA, '',
    `Mentoria e consultoria: ${SITE}/mentoria`, '#saudemental #cuidado'].filter((x, i, arr) => !(x === '' && arr[i - 1] === '')).join('\n').replace(/[<>]/g, '');
}

/** Frases e legenda .srt a partir do texto narrado (tempo proporcional ao tamanho; no YouTube Studio use "Sincronizar automaticamente"). */
function srt(a, dur) {
  const linhas = textoParaNarracao(a).split('\n').filter(Boolean);
  const pedacos = [];
  for (const l of linhas) {
    for (const fr of l.split(/(?<=[.!?:;…])\s+/)) {
      const palavras = fr.split(/\s+/); let atual = [];
      for (const p of palavras) { atual.push(p); if (atual.join(' ').length >= 70) { pedacos.push(atual.join(' ')); atual = []; } }
      if (atual.length) pedacos.push(atual.join(' '));
    }
  }
  const total = pedacos.reduce((s, p) => s + p.length + 6, 0);
  const ts = (s) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), x = Math.floor((ms % 60000) / 1000), r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
  let t = 0; const out = [];
  pedacos.forEach((p, i) => {
    const d = ((p.length + 6) / total) * dur; const meio = p.length > 42 ? p.lastIndexOf(' ', Math.floor(p.length / 2) + 6) : -1;
    const txt = meio > 10 ? `${p.slice(0, meio)}\n${p.slice(meio + 1)}` : p;
    out.push(`${i + 1}\n${ts(t)} --> ${ts(t + d)}\n${txt}\n`); t += d;
  });
  return out.join('\n');
}

/** Checagem pré-publicação de um item da fila (texto). Mídia é checada em checarMidia. */
function checarTexto(item) {
  const f = [];
  const d = item.descricao || '', t = item.titulo || '';
  if (!t) f.push('sem título'); if ([...t].length > 100) f.push('título > 100 caracteres');
  if (/[<>]/.test(d + t)) f.push('"<" ou ">" no texto');
  if (Buffer.byteLength(d, 'utf8') > 5000) f.push('descrição > 5000 bytes');
  if ((item.tags || []).join(',').length > 500) f.push('tags > 500 caracteres');
  const conta = (re) => (d.match(re) || []).length;
  if (conta(/CRM-BA 41322/g) !== 1) f.push('CRM-BA 41322 deve aparecer exatamente 1 vez na descrição');
  if (conta(/RQE 26638/g) !== 1 || !/Medicina de Família e Comunidade/.test(d)) f.push('RQE 26638 junto de Medicina de Família e Comunidade (1 vez)');
  if (conta(/NÃO ESPECIALISTA/g) !== 1) f.push('"NÃO ESPECIALISTA" deve aparecer 1 vez');
  if (!/CVV 188/.test(d) || !/SAMU 192/.test(d)) f.push('sem CVV 188 · SAMU 192');
  if (!/protocolos hospitalares/.test(d)) f.push('sem aviso de protocolos locais');
  if (!/2\.454\/2026/.test(d)) f.push('sem aviso de IA (Res. CFM 2.454/2026)');
  if (!/não substitui consulta/i.test(d)) f.push('sem aviso "não substitui consulta"');
  if (/Antonio Felipe/.test(d + t)) f.push('"Antonio" sem acento');
  if (/psiquiatra|#psiquiatria/i.test(`${d} ${t} ${(item.tags || []).join(' ')}`) && !EXCECAO_PSIQUIATRA.includes(item.slug)) f.push('"psiquiatra"/#psiquiatria');
  if (/wa\.me|whatsapp/i.test(d)) f.push('mensageria de terceiros');
  for (const u of d.match(/https?:\/\/[^\s)]+/g) || []) {
    if (!/^https?:\/\/(www\.drantoniofelipemedico\.com\.br|instagram\.com\/doutor\.antoniofelipe\.smental)/.test(u) && !item.refsPermitidas?.some((r) => r.includes(u))) f.push(`link fora do domínio oficial (apenas referências): ${u.slice(0, 60)}`);
  }
  const eth = checarEticaCfm(d, { contexto: 'social', exigirIdentificacao: false });
  for (const x of eth.falhas) f.push(`ética: ${x}`);
  return f;
}

module.exports = { RAIZ, SITE, PY, MIDIA, NARR, REL, AVISO_IA, AVISO_PROTOCOLOS, CRISE, PLAYLISTS, IDENTIFICACAO_3_LINHAS, IDENTIFICACAO_COMPLETA, semTags, sha256, run, duracao, sondar, arte, secoes, referencias, playlistDe, tagsDe, capitulos, descricaoLongo, descricaoShort, srt, checarTexto, hashNarracao, textoParaNarracao, vozDaNarracao, mmss };
