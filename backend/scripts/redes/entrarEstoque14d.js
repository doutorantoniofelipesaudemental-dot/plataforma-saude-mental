// Entrada do estoque de 14 dias na fila (conteudo/redes-v2). Padrão = dry-run (não grava).
//   node --env-file-if-exists=.env backend/scripts/redes/entrarEstoque14d.js                 -> dry-run
//   ... entrarEstoque14d.js --backup     -> cópia da fila para backups/ (confere contagem)
//   ... entrarEstoque14d.js --aplicar    -> copia as peças do estoque para a fila (exige --backup feito)
//   ... entrarEstoque14d.js --conferir   -> 1 peça aprovada por dia, sem data passada, sem falha
//   ... entrarEstoque14d.js --reverter   -> remove as pastas copiadas (só as do estoque) e restaura o backup
// Regras: não regera, não altera meta.json das peças da fila, não toca no freio REDES_PUBLICACAO_ATIVA.
// Um dia só fica bloqueado por peça já APROVADA nele (as pendentes não contam).
const fs = require('node:fs');
const path = require('node:path');

// Estado (fila, backups, estoque) fica na pasta principal, fora do Git; por isso o caminho é fixo, como nos outros scripts da fila.
const ESTADO = 'C:/DRSAUDEMENTAL';
const FILA = path.join(ESTADO, 'conteudo', 'redes-v2');
const BACKUPS = path.join(ESTADO, 'backups');
const ORIGEM_PADRAO = path.join(ESTADO, '.tmp', 'fila-redes-20261111', 'estoque-14d', 'pecas');
const RE_PECA = /^\d{4}-\d{2}-\d{2}-/;
const APROVADO = 'aprovado-checagem';

/**
 * Função pura: decide a entrada. `novas` e `existentes` são listas de { id, dataISO, status, erros }.
 * Devolve { ok, problemas, entram } sem gravar nada.
 */
function planejarEntrada({ novas, existentes, hoje }) {
  const problemas = [];
  const aprovadasNaFila = {};
  for (const e of existentes) if (e.status === APROVADO) (aprovadasNaFila[e.dataISO] ||= []).push(e.id);
  const idsExistentes = new Set(existentes.map((e) => e.id));
  const datasNovas = {};
  for (const n of novas) {
    if (idsExistentes.has(n.id)) problemas.push(`${n.id}: já existe na fila`);
    if (n.status !== APROVADO) problemas.push(`${n.id}: status "${n.status}" (só entra aprovado-checagem)`);
    if (n.erros && n.erros.length) problemas.push(`${n.id}: ${n.erros.length} falha(s) na rechecagem`);
    if (n.dataISO < hoje) problemas.push(`${n.id}: data passada (${n.dataISO})`);
    if (aprovadasNaFila[n.dataISO]) problemas.push(`${n.id}: dia ${n.dataISO} já tem peça aprovada (${aprovadasNaFila[n.dataISO].join(', ')})`);
    (datasNovas[n.dataISO] ||= []).push(n.id);
  }
  for (const [dia, ids] of Object.entries(datasNovas)) if (ids.length > 1) problemas.push(`dia ${dia} com ${ids.length} peças novas`);
  const entram = novas.map((n) => n.id);
  return { ok: problemas.length === 0, problemas, entram };
}

function lerPecas(dir) {
  return fs.readdirSync(dir).filter((d) => RE_PECA.test(d)).sort().map((id) => {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, id, 'meta.json'), 'utf8'));
    return { id, dataISO: String(meta.dataSugerida || '').slice(0, 10), status: meta.status, erros: (meta.recheckagem && !meta.recheckagem.ok) ? meta.recheckagem.erros : [] };
  });
}

function ultimoBackup() {
  if (!fs.existsSync(BACKUPS)) return null;
  const todos = fs.readdirSync(BACKUPS).filter((n) => n.startsWith('redes-entrada-14d-')).sort();
  return todos.length ? path.join(BACKUPS, todos[todos.length - 1]) : null;
}

function principal() {
  const args = new Set(process.argv.slice(2));
  const origem = (process.argv.find((a) => a.startsWith('--origem=')) || '').split('=')[1] || ORIGEM_PADRAO;
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

  if (args.has('--backup')) {
    const destino = path.join(BACKUPS, `redes-entrada-14d-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`);
    fs.cpSync(FILA, destino, { recursive: true });
    const n = lerPecas(FILA).length;
    const c = lerPecas(destino).length;
    if (n !== c) throw new Error(`backup incompleto: ${c} de ${n} pastas`);
    console.log(JSON.stringify({ backup: destino, pastas: c }, null, 2));
    return;
  }

  if (args.has('--reverter')) {
    const b = ultimoBackup();
    if (!b) throw new Error('nenhum backup redes-entrada-14d-* encontrado');
    const novas = lerPecas(origem).map((p) => p.id);
    let removidas = 0;
    for (const id of novas) {
      const dir = path.join(FILA, id);
      if (fs.existsSync(dir) && !fs.existsSync(path.join(b, id))) { fs.rmSync(dir, { recursive: true, force: true }); removidas += 1; }
    }
    console.log(JSON.stringify({ revertido: true, backup: b, removidas }, null, 2));
    return;
  }

  const novas = lerPecas(origem);
  const existentes = lerPecas(FILA);

  if (args.has('--conferir')) {
    const aprovadas = existentes.filter((e) => e.status === APROVADO);
    const porDia = {};
    for (const a of aprovadas) (porDia[a.dataISO] ||= []).push(a.id);
    const problemas = Object.entries(porDia).filter(([, ids]) => ids.length > 1).map(([d, ids]) => `dia ${d} com ${ids.length} aprovadas`);
    for (const a of aprovadas) if (a.dataISO < hoje) problemas.push(`${a.id}: aprovada com data passada`);
    console.log(JSON.stringify({ aprovadas: aprovadas.length, problemas }, null, 2));
    process.exitCode = problemas.length ? 1 : 0;
    return;
  }

  const plano = planejarEntrada({ novas, existentes, hoje });

  if (!args.has('--aplicar')) {
    console.log(JSON.stringify({ modo: 'dry-run (nada gravado)', entram: plano.entram.length, ok: plano.ok, problemas: plano.problemas }, null, 2));
    return;
  }

  if (!plano.ok) throw new Error(`não aplico: ${plano.problemas.length} problema(s). Rode sem --aplicar.`);
  if (!ultimoBackup()) throw new Error('faça --backup antes de --aplicar');
  for (const id of plano.entram) fs.cpSync(path.join(origem, id), path.join(FILA, id), { recursive: true });
  console.log(`copiadas: ${plano.entram.length} peças para a fila. Rode --conferir.`);
}

module.exports = { planejarEntrada };
if (require.main === module) {
  try { principal(); } catch (e) { console.error('[entrada14d] erro:', e.message); process.exitCode = 2; }
}
