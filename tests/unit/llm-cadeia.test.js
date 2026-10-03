// Cadeia de provedores de LLM (backend/lib/llm.js) com provedores simulados: nenhuma chamada de API.
const { test } = require('node:test');
const assert = require('node:assert');
const { montarProvedores, executarCadeia, deveRepetir } = require('../../backend/lib/llm');

const erro = (mensagem, status) => Object.assign(new Error(mensagem), status ? { status } : {});
const falha = (mensagem, status) => async () => {
  throw erro(mensagem, status);
};

test('ordem dos 5 degraus: Gemini 3.8 flash, flash-latest, flash-lite, Groq gpt-oss-120b e OpenAI gpt-5-mini', () => {
  const nomes = montarProvedores({ GEMINI_API_KEY: 'x', GROQ_API_KEY: 'x', OPENAI_API_KEY: 'x' }).map((p) => `${p.nome}/${p.modelo}`);
  assert.deepEqual(nomes, [
    'gemini/gemini-3.8-flash',
    'gemini/gemini-flash-latest',
    'gemini/gemini-flash-lite-latest',
    'groq/openai/gpt-oss-120b',
    'openai/gpt-5-mini',
  ]);
});

test('só entram os provedores que têm chave no ambiente', () => {
  assert.deepEqual(montarProvedores({}).length, 0);
  assert.deepEqual(montarProvedores({ GROQ_API_KEY: 'x' }).map((p) => p.nome), ['groq']);
  assert.deepEqual(montarProvedores({ GEMINI_API_KEY: 'x', OPENAI_API_KEY: 'x' }).map((p) => p.nome), ['gemini', 'gemini', 'gemini', 'openai']);
});

test('503, 429 e cota esgotada passam NA HORA ao próximo degrau, sem repetir nem esperar', async () => {
  const chamadas = [];
  const provedores = [
    { nome: 'gemini', modelo: 'a', fn: async () => { chamadas.push('a'); throw erro('This model is currently experiencing high demand', 503); } },
    { nome: 'gemini', modelo: 'b', fn: async () => { chamadas.push('b'); throw erro('You exceeded your current quota', 429); } },
    { nome: 'gemini', modelo: 'c', fn: async () => { chamadas.push('c'); throw erro('Rate limit reached for requests', 429); } },
    { nome: 'groq', modelo: 'd', fn: async () => { chamadas.push('d'); return { ok: true }; } },
  ];
  const inicio = Date.now();
  const r = await executarCadeia(provedores, {}, { espera: 5_000 });
  assert.ok(Date.now() - inicio < 1_000, 'não pode esperar entre degraus');
  assert.deepEqual(chamadas, ['a', 'b', 'c', 'd']);
  assert.equal(r.provedor, 'groq');
  assert.equal(r.falhas.length, 3);
  assert.match(r.falhas[0], /^gemini\/a: .*high demand/);
});

test('500 (erro interno) também passa na hora ao próximo degrau, sem repetir', async () => {
  let n = 0;
  const provedores = [
    { nome: 'gemini', modelo: 'a', fn: async () => { n++; throw erro('Internal error encountered.', 500); } },
    { nome: 'groq', modelo: 'b', fn: async () => ({ ok: true }) },
  ];
  const r = await executarCadeia(provedores, {}, { espera: 5_000 });
  assert.equal(n, 1);
  assert.equal(r.provedor, 'groq');
});

test('"no credits remaining" (OpenAI) é permanente: não repete e a falha final lista todos os degraus', async () => {
  let chamadasOpenai = 0;
  const provedores = [
    { nome: 'gemini', modelo: 'a', fn: falha('You exceeded your current quota', 429) },
    { nome: 'groq', modelo: 'b', fn: falha('Rate limit reached', 429) },
    { nome: 'openai', modelo: 'c', fn: async () => { chamadasOpenai++; throw erro('OpenAI 429: You have no credits remaining.', 429); } },
  ];
  await assert.rejects(executarCadeia(provedores, {}, { espera: 1 }), (e) => {
    assert.match(e.message, /Todos os provedores falharam/);
    assert.match(e.message, /gemini\/a.*quota.*groq\/b.*Rate limit.*openai\/c.*no credits remaining/s);
    return true;
  });
  assert.equal(chamadasOpenai, 1);
});

test('JSON inválido do Groq repete uma vez no mesmo degrau; se persistir, passa ao próximo', async () => {
  let n = 0;
  const intermitente = { nome: 'groq', modelo: 'g', fn: async () => { n++; if (n === 1) throw erro('400 json_validate_failed'); return { ok: 1 }; } };
  const r1 = await executarCadeia([intermitente], {}, { espera: 1 });
  assert.equal(n, 2);
  assert.equal(r1.provedor, 'groq');

  let m = 0;
  const quebrado = { nome: 'groq', modelo: 'g', fn: async () => { m++; throw erro('400 json_validate_failed'); } };
  const reserva = { nome: 'openai', modelo: 'o', fn: async () => ({ ok: 2 }) };
  const r2 = await executarCadeia([quebrado, reserva], {}, { espera: 1 });
  assert.equal(m, 2, 'uma repetição, não três');
  assert.equal(r2.provedor, 'openai');
});

test('os parâmetros (prompt de sistema com as regras de fidelidade e CFM, e o schema) chegam iguais a todos os degraus', async () => {
  const recebidos = [];
  const registra = (nome) => async (p) => { recebidos.push([nome, p.sistema, JSON.stringify(p.schema)]); throw erro('capacidade', 503); };
  const provedores = [
    { nome: 'gemini', modelo: 'a', fn: registra('a') },
    { nome: 'groq', modelo: 'b', fn: registra('b') },
    { nome: 'openai', modelo: 'c', fn: async (p) => { recebidos.push(['c', p.sistema, JSON.stringify(p.schema)]); return {}; } },
  ];
  await executarCadeia(provedores, { sistema: 'REGRAS DE FIDELIDADE E CFM', usuario: 'u', schema: { type: 'object' } });
  assert.equal(recebidos.length, 3);
  assert.ok(recebidos.every((r) => r[1] === 'REGRAS DE FIDELIDADE E CFM' && r[2] === '{"type":"object"}'));
});

test('deveRepetir: só falha intermitente repete; cota, crédito e capacidade não', () => {
  assert.equal(deveRepetir(erro('400 json_validate_failed')), true);
  assert.equal(deveRepetir(erro('fetch failed')), true);
  assert.equal(deveRepetir(erro('read ECONNRESET')), true);
  assert.equal(deveRepetir(erro('high demand', 503)), false);
  assert.equal(deveRepetir(erro('Internal error encountered.', 500)), false);
  assert.equal(deveRepetir(erro('Rate limit reached', 429)), false);
  assert.equal(deveRepetir(erro('You exceeded your current quota', 429)), false);
  assert.equal(deveRepetir(erro('insufficient_quota', 429)), false);
  assert.equal(deveRepetir(erro('You have no credits remaining', 429)), false);
});
