// --carregar-banco (backend/lib/carregarBanco.js): só carrega o seed em banco VAZIO;
// nunca sobrescreve nem apaga. Sem banco real: modelo e conexão simulados.
const { test } = require('node:test');
const assert = require('node:assert');
const { carregarBancoSeVazio, pedido, FLAG } = require('../../backend/lib/carregarBanco');

const modeloFalso = (existentes) => {
  const criados = [];
  return { criados, countDocuments: async () => existentes, create: async (d) => criados.push(d) };
};
const base = (modelo, extra = {}) => ({ log: () => {}, modelo, conectar: async () => {}, configurado: () => true, seed: [{ slug: 'a' }, { slug: 'b' }], ...extra });

test('flag: reconhecida em argv', () => {
  assert.strictEqual(FLAG, '--carregar-banco');
  assert.strictEqual(pedido(['node', 'index.js', '--carregar-banco']), true);
  assert.strictEqual(pedido(['node', 'index.js']), false);
});

test('banco vazio: insere os artigos iniciais', async () => {
  const m = modeloFalso(0);
  const r = await carregarBancoSeVazio(base(m));
  assert.deepStrictEqual(r, { acao: 'carregado', criados: 2 });
  assert.deepStrictEqual(m.criados.map((x) => x.slug), ['a', 'b']);
});

test('banco com artigos: não toca em nada', async () => {
  const m = modeloFalso(251);
  const r = await carregarBancoSeVazio(base(m));
  assert.deepStrictEqual(r, { acao: 'ja-populado', existentes: 251 });
  assert.strictEqual(m.criados.length, 0);
});

test('sem MONGODB_URI: ignora sem conectar', async () => {
  let conectou = false;
  const r = await carregarBancoSeVazio(base(modeloFalso(0), { configurado: () => false, conectar: async () => { conectou = true; } }));
  assert.strictEqual(r.acao, 'ignorado');
  assert.strictEqual(conectou, false);
});

test('npm start passa a flag ao index.js', () => {
  const { scripts } = require('../../package.json');
  assert.match(scripts.start, /index\.js --carregar-banco/);
});
