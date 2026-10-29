const test = require('node:test');
const assert = require('node:assert/strict');
const { checarCreditoFalado } = require('../../scripts/youtube/conferirVideo');
const { TEXTOS, MARCA } = require('../../backend/lib/vinheta');

// Crédito falado com "Doutor" por extenso (ordem de 28/10/2026). Transcrição de exemplo, sem pontuação do Whisper.
const OK = 'Você está ouvindo um conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.';

test('crédito completo com "Doutor" por extenso passa, no longo (início e fim) e no Short (só o fim)', () => {
  assert.deepEqual(checarCreditoFalado([OK, `Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.`], false), []);
  assert.deepEqual(checarCreditoFalado(['', `Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.`], true), []);
});

test('"Dr." (como o Whisper escreve "Doutor") passa na fala; a forma escrita é guardada pelo teste de TEXTOS', () => {
  assert.deepEqual(checarCreditoFalado(['', 'Conteúdo do portal de saúde mental Dr. Antônio Felipe Garabito.'], true), []);
});

test('transcrição com "do Dr." no meio (caso real do Short cuidador, 28/10) passa; sem Garabito não', () => {
  assert.deepEqual(checarCreditoFalado(['', 'conteúdo do portal de saúde mental do Dr. Antonio Felipe Garabito.'], true), []);
  assert.equal(checarCreditoFalado(['', 'conteúdo do portal de saúde mental do Dr. Antonio Felipe.'], true).length, 1);
});

test('sem "Garabito" reprova', () => {
  assert.equal(checarCreditoFalado(['', 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe.'], true).length, 1);
});

test('longo sem crédito no início reprova; Short não exige o início', () => {
  assert.equal(checarCreditoFalado(['Olá, hoje falamos de ansiedade.', OK], false).length, 1);
  assert.deepEqual(checarCreditoFalado(['Olá, hoje falamos de ansiedade.', OK], true), []);
});

test('textos da vinheta usam o nome completo com "Doutor" e nunca "Dr."', () => {
  assert.equal(MARCA, 'Portal de Saúde Mental Doutor Antônio Felipe Garabito');
  for (const [chave, texto] of Object.entries(TEXTOS)) {
    if (chave === 'assinaturaFalada') continue; // assinatura curta do médico, não é o crédito do Portal
    assert.ok(texto.includes(MARCA), `${chave} sem o nome completo do Portal`);
    assert.doesNotMatch(texto, /\bDr\.?\s+Antônio Felipe Garabito/, `${chave} usa "Dr." no crédito`);
  }
});
