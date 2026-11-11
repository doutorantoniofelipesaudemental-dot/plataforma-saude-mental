/**
 * Remarcação da semana 11–17/11 (ordem de 10/11/2026, 21:15, item 8). NÃO RODAR sem o Dr. Antônio.
 * Pega as 5 peças RECHECADAS (REDES_ORIGEM, saída do rechecagem11a17.js com ok=true) e põe na fila (REDES_FILA)
 * em datas futuras, cada uma no dia do seu eixo (seg E4, ter E5, qua E1, qui E3, sex E6, sáb E7, dom Relato).
 * O robô publica tudo que está vencido: nenhuma peça fica com data passada.
 *
 *   node backend/scripts/redes/remarcarSemana11a17.js                 -> dry-run (padrão, não grava)
 *   node backend/scripts/redes/remarcarSemana11a17.js --backup        -> copia a fila atual para backups/ (conferido)
 *   node backend/scripts/redes/remarcarSemana11a17.js --aplicar       -> troca as pastas (exige --backup antes)
 *   node backend/scripts/redes/remarcarSemana11a17.js --conferir      -> confere data x eixo, status e 5 linhas
 *   node backend/scripts/redes/remarcarSemana11a17.js --reverter      -> devolve a fila do backup mais recente
 *
 * Variáveis: REDES_FILA (padrão: conteudo/redes-v2 da pasta principal), REDES_ORIGEM (peças rechecadas), REDES_BACKUPS.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../../..');
const FILA = process.env.REDES_FILA || 'C:/DRSAUDEMENTAL/conteudo/redes-v2';
const ORIGEM = process.env.REDES_ORIGEM || path.join(RAIZ, 'conteudo/redes-v2');
const BACKUPS = process.env.REDES_BACKUPS || 'C:/DRSAUDEMENTAL/backups';
const RE_PECA = /^2026-11-(1[1-7])-/;
const args = new Set(process.argv.slice(2));
const agora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Dia de cada peça: o eixo do dia (overrides-11-17.json) decide. Quinta 12 em diante, 1 por dia útil do eixo.
// Quarta 18 para a peça E1 (a quarta 11 já passou e nenhuma peça pode ter data passada).
const PLANO = {
  'saude-mental-idoso': '2026-11-12',            // qui E3
  'insonia-consulta-rotina': '2026-11-13',        // sex E6
  'acidente-trabalho-trauma-psicologico': '2026-11-16', // seg E4
  'relato-vinculo-perdido': '2026-11-17',         // ter E5
  'redes-sociais-criancas': '2026-11-18',         // qua E1
};
const { carregarOverrides } = require('../../lib/redesV2/zgGate');
const OVERRIDES = carregarOverrides(path.join(RAIZ, 'scripts/redes/overrides-11-17.json'));
const EIXO_DO_DIA = { 1: 'E4', 2: 'E5', 3: 'E1', 4: 'E3', 5: 'E6', 6: 'E7', 0: 'Relato' };
const eixoDe = (iso) => EIXO_DO_DIA[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const telasDe = (dir) => fs.readdirSync(dir).filter((f) => /^tela-\d+\.png$/.test(f));
const ARQUIVOS = ['legenda.txt', 'alt.txt', 'meta.json'];

function pecasOrigem() {
  if (!fs.existsSync(ORIGEM)) return [];
  return fs.readdirSync(ORIGEM).filter((d) => RE_PECA.test(d)).sort().map((d) => {
    const meta = JSON.parse(fs.readFileSync(path.join(ORIGEM, d, 'meta.json'), 'utf8'));
    const slug = meta.slug;
    const data = PLANO[slug];
    return { origem: path.join(ORIGEM, d), slug, data, novoNome: data ? `${data}-${slug}` : null, meta, eixoEsperado: data ? eixoDe(data) : null };
  });
}

function planejar() {
  const erros = [];
  const pecas = pecasOrigem();
  if (pecas.length !== 5) erros.push(`esperadas 5 peças na origem, achei ${pecas.length}`);
  // Exige o relatório da rechecagem (rechecagem11a17.js --relatorio=...) com as 5 peças aprovadas.
  const rec = process.env.REDES_RECHECAGEM;
  if (!rec || !fs.existsSync(rec)) erros.push('falta REDES_RECHECAGEM (relatório da rechecagem)');
  else {
    const r = JSON.parse(fs.readFileSync(rec, 'utf8'));
    const naoOk = (r.itens || []).filter((x) => !x.ok);
    if (r.pecas !== 5 || naoOk.length) erros.push(`rechecagem não passou: ${naoOk.map((x) => x.id).join(', ') || 'peças fora de 5'}`);
  }
  for (const p of pecas) {
    if (!p.data) erros.push(`${p.slug}: sem data no PLANO`);
    else if (p.data < '2026-11-11') erros.push(`${p.slug}: data passada`);
    else if (OVERRIDES.ovs[p.slug]?.eixo !== p.eixoEsperado) erros.push(`${p.slug}: eixo do override (${OVERRIDES.ovs[p.slug]?.eixo}) não confere com ${p.data} (${p.eixoEsperado})`);
  }
  return { pecas, erros };
}

function dryRun() {
  const { pecas, erros } = planejar();
  for (const p of pecas) console.log(`${p.slug}: ${p.data ? `→ ${p.novoNome} (eixo ${p.eixoEsperado})` : 'SEM DATA'} · status ${p.meta.status}`);
  if (erros.length) { console.log('erros:\n - ' + erros.join('\n - ')); process.exitCode = 1; return; }
  console.log(`dry-run: ${pecas.length} peça(s) prontas para remarcar. Nada gravado. Use --backup e depois --aplicar.`);
}

function backup() {
  const destino = path.join(BACKUPS, `redes-remarcacao-${agora}`);
  let n = 0;
  for (const d of fs.readdirSync(FILA).filter((x) => RE_PECA.test(x)).sort()) {
    const origem = path.join(FILA, d);
    const pasta = path.join(destino, d);
    fs.mkdirSync(pasta, { recursive: true });
    for (const f of fs.readdirSync(origem)) fs.copyFileSync(path.join(origem, f), path.join(pasta, f));
    n += 1;
  }
  console.log(`backup em ${destino}: ${n} pasta(s)`);
}

function aplicar() {
  const { pecas, erros } = planejar();
  if (erros.length) throw new Error(`não aplico: ${erros.join('; ')}`);
  const antigas = fs.readdirSync(FILA).filter((x) => RE_PECA.test(x));
  for (const p of pecas) {
    const destino = path.join(FILA, p.novoNome);
    fs.mkdirSync(destino, { recursive: true });
    for (const f of ARQUIVOS) {
      if (f === 'meta.json') {
        const m = { ...p.meta, id: p.novoNome, dataSugerida: `${p.data}T08:00:00-03:00` };
        fs.writeFileSync(path.join(destino, f), JSON.stringify(m, null, 2), 'utf8');
      } else fs.copyFileSync(path.join(p.origem, f), path.join(destino, f));
    }
    for (const t of telasDe(destino)) fs.rmSync(path.join(destino, t));
    for (const t of telasDe(p.origem)) fs.copyFileSync(path.join(p.origem, t), path.join(destino, t));
  }
  // Pastas antigas (com data passada ou fora do plano): saem da fila. Já estão no backup feito antes.
  const novas = new Set(pecas.map((p) => p.novoNome));
  for (const a of antigas) if (!novas.has(a)) fs.rmSync(path.join(FILA, a), { recursive: true, force: true });
  console.log(`aplicado: ${pecas.length} peça(s) remarcadas; ${antigas.filter((a) => !novas.has(a)).length} pasta(s) antiga(s) removidas (backup feito antes).`);
}

function conferir() {
  let falhas = 0;
  // Inclui 18/11 (a peça redes-sociais-criancas foi remarcada para essa data e não podia ficar de fora).
  const RE_CONFERIR = /^2026-11-(1[1-8])-/;
  for (const d of fs.readdirSync(FILA).filter((x) => RE_CONFERIR.test(x)).sort()) {
    const m = JSON.parse(fs.readFileSync(path.join(FILA, d, 'meta.json'), 'utf8'));
    const data = m.dataSugerida.slice(0, 10);
    const erros = [];
    if (data < '2026-11-11') erros.push('data passada');
    const esperado = PLANO[m.slug];
    if (esperado && esperado !== data) erros.push(`data ${data} diferente do plano ${esperado}`);
    if (!esperado) erros.push('slug fora do plano');
    if (eixoDe(data) !== (m.checagem && m.checagem.eixo) && m.checagem && m.checagem.eixo) erros.push('eixo não confere');
    if (m.status !== 'aprovado-checagem') erros.push(`status ${m.status}`);
    console.log(`${d}: ${erros.length ? 'FALHA — ' + erros.join('; ') : 'ok'}`);
    if (erros.length) falhas += 1;
  }
  console.log(falhas ? `${falhas} peça(s) com falha` : 'remarcação conferida');
  process.exitCode = falhas ? 1 : 0;
}

function reverter() {
  const todos = fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS).filter((n) => n.startsWith('redes-remarcacao-')).sort() : [];
  if (!todos.length) { console.log('nenhum backup encontrado'); return; }
  const ultimo = path.join(BACKUPS, todos[todos.length - 1]);
  for (const d of fs.readdirSync(FILA).filter((x) => RE_PECA.test(x))) fs.rmSync(path.join(FILA, d), { recursive: true, force: true });
  for (const d of fs.readdirSync(ultimo)) {
    fs.mkdirSync(path.join(FILA, d), { recursive: true });
    for (const f of fs.readdirSync(path.join(ultimo, d))) fs.copyFileSync(path.join(ultimo, d, f), path.join(FILA, d, f));
  }
  console.log(`revertido a partir de ${ultimo}`);
}

if (args.has('--reverter')) reverter();
else if (args.has('--conferir')) conferir();
else if (args.has('--backup')) backup();
else if (args.has('--aplicar')) aplicar();
else dryRun();
