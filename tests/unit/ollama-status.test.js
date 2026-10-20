const test = require('node:test');
const assert = require('node:assert/strict');
const { statusOllama, podeDecidir, decidirComOllama, MODELOS_ESPERADOS } = require('../../scripts/ollamaStatus');

const resposta = (corpo, ok = true, status = 200) => async () => ({ ok, status, json: async () => corpo });

test('ok: os três modelos esperados presentes', async () => {
  const st = await statusOllama({ buscar: resposta({ models: MODELOS_ESPERADOS.map((name) => ({ name })) }) });
  assert.equal(st.status, 'ok');
  assert.deepEqual(st.modelos, MODELOS_ESPERADOS);
});

test('fora: conexão recusada não lança erro', async () => {
  const st = await statusOllama({ buscar: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(st.status, 'fora');
  assert.equal(podeDecidir(st), false);
});

test('fora: tempo esgotado', async () => {
  const st = await statusOllama({ buscar: async () => { const e = new Error('abort'); e.name = 'AbortError'; throw e; } });
  assert.equal(st.status, 'fora');
  assert.equal(st.motivo, 'tempo esgotado');
});

test('fora: resposta HTTP de erro', async () => {
  const st = await statusOllama({ buscar: resposta({}, false, 500) });
  assert.equal(st.status, 'fora');
});

test('sem-modelo: lista o que falta e só mostra os esperados', async () => {
  const st = await statusOllama({ buscar: resposta({ models: [{ name: 'gemma2:9b' }, { name: 'outro:1b' }] }) });
  assert.equal(st.status, 'sem-modelo');
  assert.deepEqual(st.modelos, ['gemma2:9b']);
  assert.deepEqual(st.faltando, ['llama3.2:3b', 'qwen2.5-coder:14b']);
});

test('Ollama fora nunca vira aprovado nem reprovado', () => {
  const fora = { status: 'fora' };
  assert.equal(decidirComOllama(fora, { aprovado: true, motivos: [] }), 'aguardando-ollama');
  assert.equal(decidirComOllama(fora, { aprovado: false, motivos: ['x'] }), 'aguardando-ollama');
});

test('com Ollama ok: veredito válido decide; JSON inválido vira incerto', () => {
  const ok = { status: 'ok' };
  assert.equal(decidirComOllama(ok, { aprovado: true, motivos: [] }), 'aprovado');
  assert.equal(decidirComOllama(ok, { aprovado: false, motivos: ['a'] }), 'reprovado');
  assert.equal(decidirComOllama(ok, undefined), 'incerto');
});
