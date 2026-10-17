/**
 * Passos extras da rotina semanal (17/10/2026): Blob (teto próprio 5 GB, aviso a partir de 80%), narração com vinheta,
 * YouTube (reprovados na conferência automática) e nova tentativa de ler o PDF oficial da Resolução CFM 2.454/2026.
 * Cada função recebe { sec, problemas } (as listas da rotina) e só acrescenta linhas. Somente leitura (a única escrita é uma
 * linha em docs/fonte-resolucao-cfm-2454-2026.md quando o PDF finalmente for lido).
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const RAIZ = path.resolve(__dirname, '..');
const BASE_API = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const TETO_BLOB_MB = 5120;

async function passoBlob({ sec, problemas }) {
  try {
    const j = await fetch(`${BASE_API}/api/admin/blob-narracoes`, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } }).then((r) => r.json());
    const pct = Math.round((j.totalMB / TETO_BLOB_MB) * 100);
    const orf = j.grupos.c.arquivos + j.grupos.d.arquivos;
    sec.push(`## 6. Blob (plano Pro, teto próprio de 5 GB)\n- uso: ${j.totalMB} MB (${pct}% do teto) · narrações ${j.narracoes} (publicadas ${j.grupos.a.arquivos} · agendadas ${j.grupos.b.arquivos} · órfãs ${orf})`);
    if (pct >= 80) problemas.push(`Blob em ${pct}% do teto de 5 GB (${j.totalMB} MB)`);
    if (orf > 0) problemas.push(`${orf} narração(ões) órfã(s) no Blob: ver relatorios/blob-orfaos-*.md`);
  } catch (e) { problemas.push(`não consegui consultar o Blob: ${e.message.slice(0, 80)}`); sec.push('## 6. Blob\n- NÃO VERIFICADO'); }
}

async function passoVinheta({ sec, problemas }, col) {
  const { estadoNarracao } = require('../backend/lib/narracao');
  const docs = await col.find({}).toArray();
  let com = 0; const sem7 = [];
  const limite = Date.now() + 7 * 864e5;
  for (const d of docs) {
    if (estadoNarracao(d).estado === 'ok' && d.narracao && d.narracao.vinhetaVersao === 1) { com++; continue; }
    const slot = d.publicado === true ? 0 : new Date((d.agendamento && d.agendamento.slot) || '2099-01-01').getTime();
    if (d.publicado === true || (d.agendamento && d.agendamento.agendado && slot <= limite)) sem7.push(d.slug);
  }
  sec.push(`## 7. Narração com vinheta\n- com vinheta: ${com} · faltam: ${docs.length - com} de ${docs.length}\n- publicados ou dos próximos 7 dias sem áudio com vinheta: ${sem7.length ? sem7.slice(0, 15).join(', ') : 'nenhum'}`);
  if (sem7.length) problemas.push(`${sem7.length} texto(s) publicado(s) ou dos próximos 7 dias sem áudio com vinheta (prioridade no lote da noite): ${sem7.slice(0, 6).join(', ')}`);
}

function passoYoutube({ sec, problemas }) {
  try {
    const f = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios/youtube/fila.json'), 'utf8')).itens;
    const c = (st) => f.filter((i) => i.status === st).length;
    sec.push(`## 8. YouTube\n- aprovados: ${c('aprovado-checagem')} · reprovados: ${c('reprovado')} (relatorios/youtube/reprovados/) · sem mídia: ${c('sem-midia')} · publicados: ${c('publicado')}`);
    if (c('reprovado')) problemas.push(`${c('reprovado')} vídeo(s) do YouTube reprovado(s) na conferência: relatorios/youtube/reprovados/`);
  } catch { sec.push('## 8. YouTube\n- fila não encontrada'); }
}

/** YouTube: validade da autorização (app em modo "Testando" vence em 7 dias). A rotina é semanal, então avisa já quando vence antes da próxima. */
async function passoAutorizacaoYoutube({ sec, problemas }) {
  try {
    const au = await require('./youtube/avisoAutorizacao').conferir();
    const quando = au.venceEm ? `vence em ${au.venceEm} (${au.dias} dia(s))` : (au.modo === 'producao' ? 'app publicado: não vence em 7 dias' : 'sem data registrada');
    sec.push(`## 10. Autorização do YouTube\n- autorizada em ${au.autorizadoEm || '—'} · modo do app: ${au.modo || '—'} · ${quando}${au.problema ? ' · ⚠ ' + au.problema : ''}`);
    if (au.problema) problemas.push(`YouTube: ${au.problema}. Passo a passo: relatorios/youtube/AVISO-REAUTORIZAR.md`);
    else if (au.modo === 'testando' && au.dias !== null && au.dias <= 7) problemas.push(`YouTube: a autorização vence em ${au.venceEm} (antes da próxima rotina); reautorize ou publique o app: relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md`);
  } catch (e) { sec.push(`## 10. Autorização do YouTube\n- não consegui conferir (${e.message.slice(0, 60)})`); }
}

/** Leitor mínimo só com o Node: descomprime os fluxos FlateDecode e junta o texto dos operadores Tj/TJ. */
function textoDoPdf(buf) {
  const bin = buf.toString('latin1'); let texto = ''; let ini = 0;
  for (;;) {
    const s = bin.indexOf('stream', ini); if (s < 0) break;
    const comeco = bin.startsWith('\r\n', s + 6) ? s + 8 : s + 7;
    const fim = bin.indexOf('endstream', comeco); if (fim < 0) break;
    ini = fim + 9;
    try {
      const d = zlib.inflateSync(buf.subarray(comeco, fim)).toString('latin1');
      for (const m of d.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) texto += ` ${m[1]}`;
      for (const m of d.matchAll(/\[([^\]]*)\]\s*TJ/g)) texto += ` ${(m[1].match(/\(((?:\\.|[^\\)])*)\)/g) || []).map((x) => x.slice(1, -1)).join('')}`;
    } catch { /* fluxo sem compressão ou outro filtro */ }
  }
  return texto;
}

async function passoPdfCfm({ sec }) {
  const url = 'https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2026/2454_2026.pdf';
  const doc = path.join(RAIZ, 'docs', 'fonte-resolucao-cfm-2454-2026.md');
  try {
    const r = await fetch(url);
    const t = textoDoPdf(Buffer.from(await r.arrayBuffer()));
    const legivel = /2\.?454/.test(t) && /intelig.ncia artificial/i.test(t);
    sec.push(`## 9. PDF oficial da Resolução CFM 2.454/2026\n- ${legivel ? 'LEGÍVEL: número e tema conferidos no texto oficial' : 'ainda ilegível (fonte codificada); vale a notícia oficial citada em docs/fonte-resolucao-cfm-2454-2026.md'}`);
    if (legivel && fs.existsSync(doc) && !fs.readFileSync(doc, 'utf8').includes('PDF oficial lido')) fs.appendFileSync(doc, `\n- ${new Date().toISOString().slice(0, 10)}: PDF oficial lido pela rotina semanal; número e tema (IA na medicina) confirmados no texto.\n`);
  } catch (e) { sec.push(`## 9. PDF oficial da Resolução CFM 2.454/2026\n- não consegui baixar o PDF (${e.message.slice(0, 60)})`); }
}

module.exports = { passoAutorizacaoYoutube, passoBlob, passoVinheta, passoYoutube, passoPdfCfm, textoDoPdf, TETO_BLOB_MB };
