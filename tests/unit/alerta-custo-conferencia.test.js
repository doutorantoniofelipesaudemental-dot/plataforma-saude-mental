const test = require('node:test');
const assert = require('node:assert/strict');
const { resultadoAlertaCusto } = require('../../scripts/conferencias/alertaCustoVercel');

test('saída sem JSON vira falha com ação', () => {
  const r = resultadoAlertaCusto('erro qualquer\n');
  assert.equal(r.nivel, 'falha');
  assert.match(r.texto, /creditoVercel\.js/);
});

test('alerta de cobrança vira falha com os motivos', () => {
  const r = resultadoAlertaCusto('{"status":"lido","alerta":true,"motivos":["cobrança sob demanda"]}');
  assert.equal(r.nivel, 'falha');
  assert.match(r.texto, /cobrança sob demanda/);
});

test('leitura indisponível da API vira aviso, sem falha', () => {
  const r = resultadoAlertaCusto('{"status":"indisponivel","alerta":false,"motivos":[]}');
  assert.equal(r.nivel, 'aviso');
  assert.match(r.texto, /indisponível/);
});

test('alerta pelo crédito do painel continua falha, mesmo com leitura indisponível', () => {
  const r = resultadoAlertaCusto('{"status":"indisponivel","alerta":true,"motivos":["crédito do painel"]}');
  assert.equal(r.nivel, 'falha');
});

test('tudo certo não gera nada', () => {
  assert.deepEqual(resultadoAlertaCusto('{"status":"lido","alerta":false,"motivos":[]}'), { nivel: 'ok', texto: '' });
});
