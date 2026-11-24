/**
 * Reinício da fila (ordem do Dr. Antônio, 24/11/2026). Padrão = DRY-RUN (só lê, grava o relatório).
 *   --dry-run (padrão)        lista cada item de redes_v2 e de relatorios/youtube/fila.json com a ação proposta
 *                             (MANTER ou SUSPENDER) e grava relatorios/REINICIO-FILA-20261124.md com os comandos.
 *   --backup                  cópia completa das coleções redes_v2, redes_v2_img, redes_v2_log, redes_v2_relatorios,
 *                             redes_v2_config e youtube_publicados (EJSON) + fila.json do YouTube, com SHA-256 e manifesto.
 *   --aplicar --slugs=a,b,c   marca como 'suspenso' SÓ os ids listados que o dry-run classificou como SUSPENDER.
 *                             Recusa id fora da lista, recusa se não houver backup. Nada é apagado (guarda statusAnterior).
 *   --conferir                confere contagens e que os itens MANTER não mudaram.
 * Rodar na pasta principal (a fila vive lá):
 *   npm run redes:reinicio-fila -- --dry-run
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EJSON } = require('bson');
const db = require('../../lib/db');

const RAIZ = process.cwd();
const REL = path.join(RAIZ, 'relatorios', 'REINICIO-FILA-20261124.md');
const FILA_YT = path.join(RAIZ, 'relatorios', 'youtube', 'fila.json');
const BKP = path.join(RAIZ, '.tmp', 'backup-fila-20261124');
const COLECOES = ['redes_v2', 'redes_v2_img', 'redes_v2_log', 'redes_v2_relatorios', 'redes_v2_config', 'youtube_publicados'];
// ep2 do infográfico (publica hoje 20:15): mantido por ordem. Não tocar.
const MANTER_YT = new Set(['longo-ansiedade-filhos-pais-o-que-fazer']);
const SUSPENDER_YT = new Set(['reprovado', 'pausado-estatico', 'reserva']);
const MOTIVO = 'reinício da fila 24/11/2026 (conteúdo antigo não publicado)';

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const args = process.argv.slice(2);
const modo = args.includes('--backup') ? 'backup' : args.includes('--aplicar') ? 'aplicar' : args.includes('--conferir') ? 'conferir' : 'dry-run';
const slugs = (args.find((a) => a.startsWith('--slugs=')) || '').slice(8).split(',').map((s) => s.trim()).filter(Boolean);
const brt = (d) => (d ? new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '-');
const fim = (code, msg) => { console.log(msg); process.exit(code); };

function lerYT() { return JSON.parse(fs.readFileSync(FILA_YT, 'utf8')); }

function classificarYT(fila) {
  return fila.itens.map((i) => {
    let acao; let motivo;
    if (MANTER_YT.has(i.id)) { acao = 'MANTER'; motivo = 'infográfico: ep2 (publica hoje 20:15)'; }
    else if (i.status === 'publicado') { acao = 'MANTER'; motivo = 'já publicado no YouTube'; }
    else if (SUSPENDER_YT.has(i.status)) { acao = 'SUSPENDER'; motivo = `${i.status}, não publicado`; }
    else { acao = 'MANTER'; motivo = `status ${i.status}: fora do escopo, não tocado`; }
    return { rede: 'YouTube', id: i.id, data: brt(i.slot), formato: i.tipo, statusAtual: i.status, acao, motivo };
  });
}

function classificarIG(docs) {
  return docs.map((d) => {
    const suspender = d.status === 'aprovado-checagem';
    return {
      rede: 'Instagram', id: d._id, data: brt(d.dataSugerida), formato: d.formato || '-', statusAtual: d.status,
      acao: suspender ? 'SUSPENDER' : 'MANTER',
      motivo: suspender ? 'não publicado (fila de dezembro e demais)' : d.status === 'publicado' ? 'já publicado no Instagram' : `status ${d.status}: não tocado`,
    };
  });
}

async function lerIG() {
  return db.mongoose.connection.db.collection('redes_v2').find({}, { projection: { status: 1, dataSugerida: 1, formato: 1, tipo: 1 } }).sort({ dataSugerida: 1 }).toArray();
}

async function dryRun() {
  const ig = classificarIG(await lerIG());
  const yt = classificarYT(lerYT());
  const todos = [...ig, ...yt];
  const sus = todos.filter((x) => x.acao === 'SUSPENDER');
  const linhas = todos.map((x) => `| ${x.data} | ${x.rede} | \`${x.id}\` | ${x.formato} | ${x.statusAtual} | **${x.acao}** | ${x.motivo} |`);
  const script = path.join(__dirname, 'reinicioFila.js').replace(/\\/g, '/');
  const cmd = (extra) => `! cd ${RAIZ.replace(/\\/g, '/')} && node --env-file-if-exists=.env ${script} ${extra}`;
  const idsSus = sus.map((x) => x.id).join(',');
  const md = [
    '# Reinício da fila · dry-run · 24/11/2026',
    '',
    'Ordem do Dr. Antônio (24/11 19:47): reiniciar a fila desde zero conforme o plano mestre. Nada foi aplicado. Itens SUSPENSOS são recuperáveis (nunca delete).',
    '',
    `- Instagram (redes_v2): ${ig.length} itens · MANTER ${ig.length - ig.filter((x) => x.acao === 'SUSPENDER').length} (publicados e descartados) · SUSPENDER **${ig.filter((x) => x.acao === 'SUSPENDER').length}**`,
    `- YouTube (fila.json): ${yt.length} itens · MANTER ${yt.length - yt.filter((x) => x.acao === 'SUSPENDER').length} · SUSPENDER **${yt.filter((x) => x.acao === 'SUSPENDER').length}**`,
    '- Infográfico do YouTube já agendado mas AUSENTE do fila.json (ep3 e demais da série): não está nesta fila, portanto não é alterado. Conferir no Studio antes de qualquer decisão.',
    '',
    '**Atenção (urgente):** o publicador do Instagram roda às 11:00 (Bahia). O item de 25/11 (`2026-11-25-rotina-criancas`) seria publicado amanhã às 11:00 se o --aplicar não rodar antes. Alternativa imediata: `REDES_PUBLICACAO_ATIVA=false` na Vercel (freio), até o --aplicar.',
    '',
    '## Comandos para o Dr. (um por vez, nesta ordem)',
    '',
    '1. Backup (cópia completa, antes de tudo):',
    '```',
    cmd('--backup'),
    '```',
    '2. Aplicar (suspende somente os ids abaixo, com os slugs completos):',
    '```',
    cmd(`--aplicar --slugs=${idsSus}`),
    '```',
    '3. Conferir:',
    '```',
    cmd('--conferir'),
    '```',
    '',
    '## Itens (data BRT · rede · id · formato · status atual · ação · motivo)',
    '',
    '| Data (BRT) | Rede | Id | Formato | Status atual | Ação | Motivo |',
    '|---|---|---|---|---|---|---|',
    ...linhas,
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(REL), { recursive: true });
  fs.writeFileSync(REL, md);
  fim(0, `DRY-RUN: ${todos.length} itens · SUSPENDER ${sus.length} · MANTER ${todos.length - sus.length} · relatório: ${REL}`);
}

async function backup() {
  const dir = path.join(BKP, 'db');
  fs.mkdirSync(dir, { recursive: true });
  const resumo = {};
  for (const c of COLECOES) {
    const docs = await db.mongoose.connection.db.collection(c).find({}).toArray();
    const txt = EJSON.stringify(docs);
    fs.writeFileSync(path.join(dir, `${c}.ejson.json`), txt);
    resumo[c] = { documentos: docs.length, sha256: sha(Buffer.from(txt)) };
  }
  fs.mkdirSync(path.join(BKP, 'youtube'), { recursive: true });
  fs.copyFileSync(FILA_YT, path.join(BKP, 'youtube', 'fila.json'));
  resumo.youtube_fila_json = { sha256: sha(fs.readFileSync(FILA_YT)) };
  for (const c of COLECOES) {
    const volta = EJSON.parse(fs.readFileSync(path.join(dir, `${c}.ejson.json`), 'utf8'));
    if (volta.length !== resumo[c].documentos) fim(1, `backup de ${c} NÃO confere ao reabrir`);
  }
  fs.writeFileSync(path.join(BKP, 'MANIFESTO.json'), JSON.stringify({ geradoEm: new Date().toISOString(), colecoes: resumo }, null, 2));
  fim(0, `BACKUP OK em ${BKP} · ${COLECOES.map((c) => `${c}=${resumo[c].documentos}`).join(' · ')}`);
}

async function aplicar() {
  if (!slugs.length) fim(1, 'BLOQUEADO: informe --slugs=... (ids completos)');
  if (!fs.existsSync(path.join(BKP, 'MANIFESTO.json'))) fim(1, 'BLOQUEADO: rode --backup antes');
  const ig = classificarIG(await lerIG());
  const yt = classificarYT(lerYT());
  const permitidos = new Set([...ig, ...yt].filter((x) => x.acao === 'SUSPENDER').map((x) => x.id));
  const fora = slugs.filter((s) => !permitidos.has(s));
  if (fora.length) fim(1, `BLOQUEADO: ids fora da lista SUSPENDER (nada foi gravado): ${fora.join(', ')}`);
  const agora = new Date();
  const igIds = new Set(ig.map((x) => x.id));
  const idsIG = slugs.filter((s) => igIds.has(s));
  const r = await db.mongoose.connection.db.collection('redes_v2').updateMany(
    { _id: { $in: idsIG }, status: 'aprovado-checagem' },
    { $set: { status: 'suspenso', statusAnterior: 'aprovado-checagem', suspensoEm: agora, suspensoMotivo: MOTIVO } },
  );
  const fila = lerYT();
  const idsYT = new Set(slugs.filter((s) => !igIds.has(s)));
  let nYT = 0;
  for (const i of fila.itens) {
    if (idsYT.has(i.id) && i.status !== 'suspenso') { i.statusAnterior = i.status; i.status = 'suspenso'; i.suspensoEm = agora.toISOString(); i.suspensoMotivo = MOTIVO; nYT += 1; }
  }
  if (nYT) { const tmp = `${FILA_YT}.tmp`; fs.writeFileSync(tmp, JSON.stringify(fila, null, 2)); fs.renameSync(tmp, FILA_YT); }
  fim(0, `APLICADO: Instagram suspensos ${r.modifiedCount} (de ${idsIG.length}) · YouTube suspensos ${nYT}. Nada apagado.`);
}

async function conferir() {
  const colecao = db.mongoose.connection.db.collection('redes_v2');
  const cont = {};
  for (const d of await colecao.find({}, { projection: { status: 1 } }).toArray()) cont[d.status] = (cont[d.status] || 0) + 1;
  const fila = lerYT();
  const contYT = {};
  for (const i of fila.itens) contYT[i.status] = (contYT[i.status] || 0) + 1;
  const original = JSON.parse(fs.readFileSync(path.join(BKP, 'youtube', 'fila.json'), 'utf8'));
  const mudouMantido = [];
  const atual = new Map(fila.itens.map((i) => [i.id, i]));
  for (const o of original.itens) {
    const a = atual.get(o.id);
    const ehSuspender = SUSPENDER_YT.has(o.status) && !MANTER_YT.has(o.id) && o.status !== 'publicado';
    if (!ehSuspender && a && a.status !== o.status) mudouMantido.push(o.id);
  }
  console.log('Instagram (redes_v2) por status:', JSON.stringify(cont));
  console.log('YouTube (fila.json) por status:', JSON.stringify(contYT));
  fim(mudouMantido.length ? 1 : 0, mudouMantido.length ? `ALERTA: itens MANTER alterados: ${mudouMantido.join(', ')}` : 'CONFERIDO: nenhum item MANTER foi alterado.');
}

(async () => {
  if (!db.isConfigured()) fim(1, 'MONGODB_URI não configurada (rode com --env-file-if-exists=.env)');
  await db.connect();
  if (modo === 'backup') return backup();
  if (modo === 'aplicar') return aplicar();
  if (modo === 'conferir') return conferir();
  return dryRun();
})().catch((e) => fim(1, `ERRO: ${e.message}`));
