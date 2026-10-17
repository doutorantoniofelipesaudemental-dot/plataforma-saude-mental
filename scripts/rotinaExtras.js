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

/** LinkedIn: fila MANUAL do perfil pessoal (sem API). Atualiza FILA-MANUAL.md e o bloco do ESTADO-GERAL.md; avisa se houver post atrasado. */
function passoLinkedinManual({ sec, problemas }) {
  const { spawnSync } = require('node:child_process');
  const r = spawnSync(process.execPath, ['--env-file=.env', 'scripts/linkedin/filaManual.js', 'estado'], { cwd: RAIZ, encoding: 'utf8', timeout: 90000 });
  const linha = String(r.stdout || '').trim().split('\n').pop() || 'não consegui ler a fila manual';
  const agend = Number((linha.match(/agendados no LinkedIn (\d+)/) || [])[1] || 0);
  // a linha traz "(até dd/mm)" (sem o ano): usa o próximo dd/mm a partir de hoje
  const mAte = linha.match(/agendados no LinkedIn \d+ \(até (\d{2})\/(\d{2})\)/);
  const hoje = new Date(); let ano = hoje.getUTCFullYear();
  if (mAte && new Date(`${ano}-${mAte[2]}-${mAte[1]}T12:00:00Z`) < hoje - 30 * 864e5) ano += 1;
  const ate = mAte ? [mAte[0], mAte[1], mAte[2], String(ano)] : [];
  const abertos = Number((linha.match(/abertos (\d+)/) || [])[1] || 0);
  sec.push(`## 12. LinkedIn — fila manual e posts agendados (perfil pessoal, seg/qua/sex 19:30)\n- ${linha}\n- **Lembrete da semana (sem robô):** abra o LinkedIn → "Posts agendados" e confira data, hora e texto dos posts da semana. Se algo sumiu ou está errado, me avise.`);
  if (agend > 0 && ate.length) {
    const dias = Math.round((new Date(`${ate[3]}-${ate[2]}-${ate[1]}T12:00:00Z`) - Date.now()) / 864e5);
    if (dias <= 14) problemas.push(`LinkedIn: o último post agendado é de ${ate[1]}/${ate[2]}/${ate[3]} (${dias} dia(s)) e faltam ${abertos} na fila: digite "rodar agendar-linkedin" (skill agendar-linkedin)`);
    sec.push(`- **Agendamento:** último post agendado em ${ate[1]}/${ate[2]}/${ate[3]}; faltam agendar ${abertos} (inclui os carrosséis manuais). Uma sessão por dia: "rodar agendar-linkedin".`);
  }
  const atrasados = Number((linha.match(/atrasados (\d+)/) || [])[1] || 0);
  if (r.status !== 0) problemas.push(`fila manual do LinkedIn: não consegui atualizar (${String(r.stderr || '').trim().slice(0, 80)})`);
  else if (atrasados > 0) problemas.push(`LinkedIn: ${atrasados} post(s) da fila manual com a data vencida e sem marcar como publicado (relatorios/linkedin/FILA-MANUAL.md)`);
}

/**
 * Interrupções do PC (17/10/2026): resumo do que ficou para trás e do que a tarefa seguinte recuperou ao religar.
 * `tar` = resultado de rotinaTarefas.conferir(). Textos do site, vídeos do YouTube e posts do LinkedIn com data vencida são listados.
 */
async function passoAtrasos({ sec, problemas }, col, tar) {
  const linhas = [];
  const tarefas = (tar && tar.tarefas) || [];
  const perdidas = tarefas.filter((t) => t.perdidas > 0);
  const recuperadas = tarefas.filter((t) => t.ultima && t.perdidas === 0 && /rodou \d+ min depois/.test(String((tar.md.split('\n').find((l) => l.startsWith(`| ${t.nome} `)) || ''))));
  linhas.push(`- Tarefas com horário PERDIDO (PC desligado e sem recuperar): ${perdidas.length ? perdidas.map((t) => `${t.nome} (${t.perdidas})`).join(', ') : 'nenhuma'}`);
  linhas.push(`- Tarefas RECUPERADAS ao religar (rodaram atrasadas, "assim que possível"): ${recuperadas.length ? recuperadas.map((t) => t.nome).join(', ') : 'nenhuma'}`);
  if (tar && tar.energia) linhas.push(`- Reinícios/quedas do PC nos últimos 7 dias: ${tar.energia.desligamentos} · suspensões: ${tar.energia.suspensoes}`);
  const agora = new Date();
  // textos do site: data vencida e ainda não publicados (o cron diário das 11:00 UTC recupera na execução seguinte)
  const atrasadosSite = await col.find({ publicado: false, 'agendamento.agendado': true, 'agendamento.slot': { $lt: new Date(agora.getTime() - 3600e3) } }).project({ slug: 1, 'agendamento.slot': 1 }).sort({ 'agendamento.slot': 1 }).toArray();
  linhas.push(`- Textos do site com data vencida e ainda não publicados: ${atrasadosSite.length ? `${atrasadosSite.length} (${atrasadosSite.slice(0, 5).map((d) => d.slug).join(', ')}); o cron das 11:00 UTC publica na próxima execução` : 'nenhum'}`);
  if (atrasadosSite.length) problemas.push(`${atrasadosSite.length} texto(s) do site com data vencida e ainda não publicados (cron diário atrasado?)`);
  // vídeos do YouTube: data vencida e não publicados nem enviados à mão (a fila manual segue valendo)
  let atrasadosYt = 0;
  try { const f = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios/youtube/fila.json'), 'utf8')).itens; atrasadosYt = f.filter((i) => i.status === 'aprovado-checagem' && new Date(i.slot) < agora).length; } catch { /* sem fila */ }
  linhas.push(`- Vídeos do YouTube com data vencida e ainda não publicados: ${atrasadosYt}${atrasadosYt ? ' (publicar à mão pela pasta fila-manual enquanto o publicador estiver desligado)' : ''}`);
  if (atrasadosYt) problemas.push(`${atrasadosYt} vídeo(s) do YouTube com data vencida e sem publicar`);
  // lembretes/posts do LinkedIn: data vencida sem marcar como publicado/agendado
  try {
    const li = await col.db.collection('linkedin_fila').find({ status: { $in: ['aprovado-checagem', 'manual'] }, slot: { $lt: new Date(agora.getTime() - 3600e3).toISOString() } }).project({ id: 1 }).toArray();
    linhas.push(`- Posts do LinkedIn com data vencida e sem marcar como publicados/agendados: ${li.length}${li.length ? ` (${li.slice(0, 5).map((x) => x.id).join(', ')})` : ''}`);
    if (li.length) problemas.push(`${li.length} post(s) do LinkedIn com data vencida e sem marcar (relatorios/linkedin/FILA-MANUAL.md)`);
  } catch { /* sem fila */ }
  sec.push(`## 13. Interrupções do PC: o que ficou para trás e o que foi recuperado\n${linhas.join('\n')}\n- A tarefa seguinte recupera sozinha o que ficou para trás: as tarefas do Windows usam "rodar assim que possível" e o ciclo de narração recomeça pelo que estava pronto.`);
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

module.exports = { passoAtrasos, passoLinkedinManual, passoAutorizacaoYoutube, passoBlob, passoVinheta, passoYoutube, passoPdfCfm, textoDoPdf, TETO_BLOB_MB };
