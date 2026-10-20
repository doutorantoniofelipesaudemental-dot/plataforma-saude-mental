const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../../scripts/backupEstado');
const R = require('../../scripts/restaurarEstado');

const TOKEN = 'IGAAtesteFICTICIOabcdefghijklmnop1234567890'; // segredos:permitir (token fictício de teste)
const TMP = path.join(__dirname, '../../.tmp');

// Coleção em memória com os métodos usados pelo backup e pela restauração.
function colecaoFalsa() {
  const docs = [];
  const casa = (d, f) => Object.entries(f).every(([k, v]) => (typeof v === 'object' && v && '$lt' in v ? d[k] < v.$lt : d[k] === v));
  return {
    docs,
    async findOne(f) { return docs.find((d) => casa(d, f)) || null; },
    async insertOne(d) { docs.push(d); },
    async deleteMany(f) { const antes = docs.length; for (let i = docs.length - 1; i >= 0; i--) if (casa(docs[i], f)) docs.splice(i, 1); return { deletedCount: antes - docs.length }; },
    find(f) { return { toArray: async () => docs.filter((d) => casa(d, f)) }; },
  };
}

// Pasta temporária de teste DENTRO do projeto (.tmp/), com os arquivos da LISTA que o teste precisa.
function raizDeTeste(arquivos) {
  fs.mkdirSync(TMP, { recursive: true });
  const raiz = fs.mkdtempSync(path.join(TMP, 'bk-'));
  for (const [rel, texto] of Object.entries(arquivos)) {
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto, 'utf8');
  }
  return raiz;
}

test('segurança: .env, credenciais e conteúdo com token são recusados sem devolver o valor', () => {
  assert.equal(B.verificarSeguro('relatorios/.env', 'x').ok, false);
  assert.equal(B.verificarSeguro('relatorios/client_secret.json', '{}').ok, false);
  const r = B.verificarSeguro('relatorios/links-estado.json', `{"t":"${TOKEN}"}`);
  assert.equal(r.ok, false);
  assert.doesNotMatch(r.motivo, /IGAA|tokenteste|FICTICIO/);
  assert.equal(B.verificarSeguro('relatorios/x.json', 'mongodb+srv://usuario:senha@cluster.exemplo.net/db').ok, false);
  assert.equal(B.verificarSeguro('relatorios/x.json', 'CRON_SECRET=abcdef123456').ok, false);
  assert.equal(B.verificarSeguro('relatorios/narracao-progresso.md', '- lote 1 concluído\n- 12 artigos narrados').ok, true);
});

test('backup do dia: grava só o que é seguro, sem o segredo no banco, e não repete no mesmo dia', async () => {
  const raiz = raizDeTeste({
    'relatorios/narracao-progresso.md': '- lote 1 concluído\n',
    'relatorios/links-estado.json': `{"t":"${TOKEN}"}`,
  });
  const col = colecaoFalsa();
  const agora = new Date('2026-10-21T12:30:00Z');
  const r1 = await B.backupDoDia({ col, raiz, agora, lista: ['relatorios/narracao-progresso.md', 'relatorios/links-estado.json'] });
  assert.deepEqual(r1.gravados, ['relatorios/narracao-progresso.md']);
  assert.equal(r1.recusados.length, 1);
  assert.equal(col.docs.length, 1);
  assert.ok(!JSON.stringify(col.docs).includes(TOKEN), 'o token nunca vai para o banco');
  assert.match(col.docs[0].sha256, /^[0-9a-f]{64}$/);
  const r2 = await B.backupDoDia({ col, raiz, agora, lista: ['relatorios/narracao-progresso.md', 'relatorios/links-estado.json'] });
  assert.deepEqual(r2.ja, ['relatorios/narracao-progresso.md']);
  assert.equal(col.docs.length, 1, 'não duplica no mesmo dia');
});

test('limpeza: apaga só documentos com mais de 30 dias e nunca toca nos arquivos originais', async () => {
  const raiz = raizDeTeste({ 'relatorios/narracao-progresso.md': 'original que não pode sumir\n' });
  const col = colecaoFalsa();
  col.docs.push({ _id: '2026-08-01|a', data: '2026-08-01' }, { _id: '2026-10-20|b', data: '2026-10-20' });
  const r = await B.limparAntigos({ col, agora: new Date('2026-10-21T12:00:00Z') });
  assert.equal(r.apagados, 1);
  assert.deepEqual(col.docs.map((d) => d._id), ['2026-10-20|b']);
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'utf8'), 'original que não pode sumir\n');
});

test('restauração simulada não grava nada (nem no disco nem no banco)', async () => {
  const raiz = raizDeTeste({ 'relatorios/narracao-progresso.md': 'atual\n' });
  const col = colecaoFalsa();
  await B.backupDoDia({ col, raiz, agora: new Date('2026-10-21T12:30:00Z'), lista: ['relatorios/narracao-progresso.md'] });
  fs.writeFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'mudou depois do backup\n', 'utf8');
  const antes = JSON.stringify(col.docs);
  const plano = await R.planejar({ col, data: '2026-10-21', raiz, lista: ['relatorios/narracao-progresso.md'] });
  assert.equal(plano[0].pode, true);
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'utf8'), 'mudou depois do backup\n');
  assert.equal(JSON.stringify(col.docs), antes);
});

test('restauração aplicada exige a ordem exata e guarda a cópia do estado anterior', async () => {
  const raiz = raizDeTeste({ 'relatorios/narracao-progresso.md': 'versao do dia\n' });
  const col = colecaoFalsa();
  const lista = ['relatorios/narracao-progresso.md'];
  await B.backupDoDia({ col, raiz, agora: new Date('2026-10-21T12:30:00Z'), lista });
  fs.writeFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'versao nova\n', 'utf8');
  await assert.rejects(() => R.aplicar({ col, data: '2026-10-21', ordem: 'sim', raiz, lista }), /ordem/);
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'utf8'), 'versao nova\n');
  const r = await R.aplicar({ col, data: '2026-10-21', ordem: R.ORDEM('2026-10-21'), raiz, lista, agora: new Date('2026-10-22T10:00:00Z') });
  assert.deepEqual(r.feitos, ['relatorios/narracao-progresso.md']);
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios/narracao-progresso.md'), 'utf8'), 'versao do dia\n');
  assert.ok(r.guardadoEm && fs.existsSync(path.join(raiz, r.guardadoEm, 'relatorios/narracao-progresso.md')), 'cópia do estado anterior guardada');
});

test('restauração recusa arquivo fora da lista, mesmo que esteja no banco', async () => {
  const raiz = raizDeTeste({});
  const col = colecaoFalsa();
  col.docs.push({ _id: '2026-10-21|../fora.md', data: '2026-10-21', arquivo: '../fora.md', conteudo: 'x', sha256: B.sha256('x'), bytes: 1 });
  const plano = await R.planejar({ col, data: '2026-10-21', raiz, lista: ['relatorios/narracao-progresso.md'] });
  assert.equal(plano[0].pode, false);
});
