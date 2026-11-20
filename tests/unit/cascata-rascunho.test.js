// Cascata de rascunho: categorias clínicas nunca vão ao modelo local; rascunho nunca sai aprovado; falhas caem no nível direto.
const { test } = require('node:test');
const assert = require('node:assert');
const { gerarRascunho } = require('../../backend/lib/cascataRascunho');

const okChecar = () => ({ ok: true, falhas: [] });
const reprovaChecar = () => ({ ok: false, falhas: ['oferta de consulta'] });
const gerarOk = async () => ({ texto: 'a { color: red }', modelo: 'gemma2:9b' });

test('categoria clínica nunca chama o modelo local', async () => {
  let chamou = false;
  const r = await gerarRascunho({ categoria: 'clinico', usuario: 'x' }, { gerar: async () => { chamou = true; return {}; }, checar: okChecar });
  assert.equal(r.status, 'bloqueado'); assert.equal(chamou, false);
});

test('categoria fora da lista permitida também é bloqueada', async () => {
  const r = await gerarRascunho({ categoria: 'desconhecida', usuario: 'x' }, { gerar: gerarOk, checar: okChecar });
  assert.equal(r.status, 'bloqueado');
});

test('Ollama indisponível cai no nível direto', async () => {
  const r = await gerarRascunho({ categoria: 'css', usuario: 'x' }, { gerar: async () => ({ indisponivel: true, erro: 'fora do ar' }), checar: okChecar });
  assert.equal(r.status, 'indisponivel'); assert.equal(r.nivel, 'direto');
});

test('portão reprova e não entrega texto', async () => {
  const r = await gerarRascunho({ categoria: 'css', usuario: 'x' }, { gerar: gerarOk, checar: reprovaChecar });
  assert.equal(r.status, 'reprovado'); assert.equal(r.texto, undefined); assert.deepEqual(r.falhas, ['oferta de consulta']);
});

test('rascunho aprovado no portão sai sempre com aprovado: false', async () => {
  const r = await gerarRascunho({ categoria: 'css', usuario: 'x' }, { gerar: gerarOk, checar: okChecar });
  assert.equal(r.status, 'rascunho-cascata'); assert.equal(r.aprovado, false); assert.equal(r.nivel, 'local');
});
