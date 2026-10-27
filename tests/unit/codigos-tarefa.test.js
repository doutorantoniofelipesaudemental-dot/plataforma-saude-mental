const test = require('node:test');
const assert = require('node:assert/strict');
const { interpretarResultado } = require('../../scripts/conferencias/codigosTarefa');

test('códigos conhecidos do Agendador do Windows', () => {
  assert.equal(interpretarResultado(0), 'executou com sucesso');
  assert.equal(interpretarResultado(0x41303), 'ainda não rodou desde a criação');
  assert.equal(interpretarResultado(0x41301), 'está rodando agora');
  assert.equal(interpretarResultado(0x41306), 'a última execução foi encerrada pelo usuário ou pelo sistema');
  assert.equal(interpretarResultado(-2147024894), 'arquivo não encontrado (caminho do script errado)');
});

test('código desconhecido e leitura vazia', () => {
  assert.equal(interpretarResultado(123), 'código 123 (ver o Agendador do Windows)');
  assert.equal(interpretarResultado(NaN), 'resultado não lido');
});
