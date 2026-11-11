// Aplicação da regra final da fila (ordem de 11/11/2026, 07:10). Padrão = dry-run (não grava).
//   node --env-file-if-exists=C:/DRSAUDEMENTAL/.env C:/DRSAUDEMENTAL/.tmp/fila-redes-20261111/aplicarFilaCompleta.js            -> dry-run
//   ... aplicarFilaCompleta.js --backup     -> cópia de conteudo/redes-v2 para backups/ (confere contagem)
//   ... aplicarFilaCompleta.js --aplicar    -> grava status "pendente-rechecagem" nas peças que falham (exige --backup feito)
//   ... aplicarFilaCompleta.js --conferir   -> confere TODAS as datas: 1 peça/dia, sem data passada, aprovado-checagem sem erro
//   ... aplicarFilaCompleta.js --reverter   -> devolve os meta.json do backup mais recente
// Regras: não regera, não remarca sem eixo conhecido (override), não mexe nas 5 peças já remarcadas (são aprovadas e ficam),
// não toca no freio REDES_PUBLICACAO_ATIVA nem na publicação. Só altera o campo "status" do meta.json.
const fs = require('node:fs');
const path = require('node:path');
const { auditar } = require('./auditar.js');

const FILA = 'C:/DRSAUDEMENTAL/conteudo/redes-v2';
const BACKUPS = 'C:/DRSAUDEMENTAL/backups';
const SAIDA = process.env.FILA_SAIDA || 'C:/DRSAUDEMENTAL/.tmp/fila-redes-20261111';
const HOJE = '2026-11-11';
const PENDENTE = 'pendente-rechecagem';
const args = new Set(process.argv.slice(2));
const agora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const pastasFila = () => fs.readdirSync(FILA).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
const ultimoBackup = () => {
  const todos = fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS).filter((n) => n.startsWith('redes-fila-completa-')).sort() : [];
  return todos.length ? path.join(BACKUPS, todos[todos.length - 1]) : null;
};

// Decide sem contar a duplicata; depois, se ainda sobrar mais de uma peça no mesmo dia, só fica a primeira (ordem da fila).
function planejar(r) {
  const semDup = (i) => i.erros.filter((e) => !e.startsWith('mais de 1 peça'));
  const decisoes = r.itens.map((i) => ({ i, manter: semDup(i).length === 0 && i.status === 'aprovado-checagem' }));
  const ficaNoDia = new Set();
  for (const d of decisoes) {
    if (!d.manter) continue;
    if (ficaNoDia.has(d.i.dataISO)) d.manter = false; else ficaNoDia.add(d.i.dataISO);
  }
  return decisoes.map(({ i, manter }) => ({ id: i.id, data: i.dataISO, statusAtual: i.status, statusNovo: manter ? 'aprovado-checagem' : PENDENTE, motivos: (manter ? [] : semDup(i)).slice(0, 6) }));
}

async function principal() {
  if (args.has('--reverter')) {
    const b = ultimoBackup();
    if (!b) throw new Error('nenhum backup redes-fila-completa-* encontrado');
    let n = 0;
    for (const d of fs.readdirSync(b)) {
      const src = path.join(b, d, 'meta.json');
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(FILA, d, 'meta.json')); n++; }
    }
    console.log(`revertido: ${n} meta.json de ${b}`);
    return;
  }

  if (args.has('--backup')) {
    const destino = path.join(BACKUPS, `redes-fila-completa-${agora}`);
    fs.cpSync(FILA, destino, { recursive: true });
    const origem = pastasFila().length;
    const copia = fs.readdirSync(destino).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).length;
    if (origem !== copia) throw new Error(`backup incompleto: ${copia} de ${origem} pastas`);
    console.log(`backup OK: ${copia} pastas em ${destino}`);
    return;
  }

  if (args.has('--conferir')) {
    const r = await auditar();
    const erros = [];
    const porDia = {};
    const aprovadas = r.itens.filter((i) => i.status === 'aprovado-checagem');
    for (const i of aprovadas) (porDia[i.dataISO] ||= []).push(i.id);
    for (const [dia, ids] of Object.entries(porDia)) if (ids.length > 1) erros.push(`dia ${dia} com ${ids.length} peças aprovadas`);
    for (const i of aprovadas) {
      if (i.dataISO < HOJE) erros.push(`${i.id}: aprovado com data passada`);
      if (i.erros.some((e) => !e.startsWith('mais de 1 peça'))) erros.push(`${i.id}: aprovado com falhas`);
    }
    const porStatus = {};
    for (const i of r.itens) porStatus[i.status] = (porStatus[i.status] || 0) + 1;
    console.log(JSON.stringify({ pecas: r.itens.length, porStatus, aprovadasProntas: r.itens.filter((i) => i.status === 'aprovado-checagem' && !i.erros.length).map((i) => i.id), problemas: erros }, null, 2));
    process.exitCode = erros.length ? 1 : 0;
    return;
  }

  // dry-run (padrão) ou --aplicar: mesma decisão, --aplicar grava
  const r = await auditar();
  const plano = planejar(r);
  const mudam = plano.filter((p) => p.statusNovo !== p.statusAtual);
  fs.writeFileSync(path.join(SAIDA, 'plano-aplicacao.json'), JSON.stringify(plano, null, 2), 'utf8');
  if (!args.has('--aplicar')) {
    console.log(JSON.stringify({ modo: 'dry-run (nada gravado)', pecas: plano.length, mudarParaPendente: mudam.length, ficamAprovadas: plano.length - mudam.length, plano: SAIDA + '/plano-aplicacao.json' }, null, 2));
    return;
  }
  if (!ultimoBackup()) throw new Error('faça --backup antes de --aplicar');
  for (const p of mudam) {
    const f = path.join(FILA, p.id, 'meta.json');
    const meta = JSON.parse(fs.readFileSync(f, 'utf8'));
    meta.status = p.statusNovo;
    fs.writeFileSync(f, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  }
  console.log(`aplicado: ${mudam.length} peça(s) para ${PENDENTE}; ${plano.length - mudam.length} mantida(s). Rode --conferir.`);
}

if (require.main === module) {
  principal().catch((e) => { console.error('[fila] erro:', e.message); process.exitCode = 2; });
}
module.exports = { planejar, PENDENTE };
