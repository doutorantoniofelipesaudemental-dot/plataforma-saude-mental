// IA externa desativada (ordem de 08/11/2026): backend/lib/llm.js não faz nenhuma chamada de API.
const { test } = require('node:test');
const assert = require('node:assert');
const llm = require('../../backend/lib/llm');

test('nenhum provedor de IA externa: a lista fica vazia mesmo com todas as chaves no ambiente', () => {
  assert.deepEqual(llm.montarProvedores({ GEMINI_API_KEY: 'x', GROQ_API_KEY: 'x', OPENAI_API_KEY: 'x' }), []);
  assert.deepEqual(llm.montarProvedores({}), []);
});

test('gerarJson recusa com mensagem clara e não lê chave nem faz chamada de rede', async () => {
  const antes = globalThis.fetch;
  let chamadas = 0;
  globalThis.fetch = async () => {
    chamadas += 1;
    throw new Error('nenhuma chamada deveria ocorrer');
  };
  try {
    await assert.rejects(llm.gerarJson({ sistema: 's', usuario: 'u', schema: {} }), (e) => {
      assert.ok(e instanceof llm.IaDesativadaError);
      assert.equal(e.codigo, 'IA_DESATIVADA');
      assert.match(e.message, /desativada por ordem de 08\/11\/2026/);
      return true;
    });
    assert.equal(chamadas, 0);
  } finally {
    globalThis.fetch = antes;
  }
});

test('a mensagem cita Gemini, Groq e OpenAI e a ordem de 08/11/2026', () => {
  assert.match(llm.MENSAGEM_DESATIVADA, /Gemini, Groq e OpenAI/);
  assert.match(llm.MENSAGEM_DESATIVADA, /08\/11\/2026/);
});

test('avisarBotDesativado escreve o aviso no console de erro sem encerrar o processo', () => {
  const antes = console.warn;
  const linhas = [];
  console.warn = (msg) => linhas.push(String(msg));
  try {
    llm.avisarBotDesativado('bot-teste');
  } finally {
    console.warn = antes;
  }
  assert.equal(linhas.length, 1);
  assert.match(linhas[0], /\[bot-teste\] IA externa desativada por ordem de 08\/11\/2026/);
});
