const test = require('node:test');
const assert = require('node:assert/strict');
const { classificarSaida, jaRodouHoje, limitarPosts, MAX_POSTS, INTERVALO_MS } = require('../../scripts/linkedin/agendarDiario');

test('limites: máximo 3 posts por dia e 2 min entre eles', () => {
  assert.equal(MAX_POSTS, 3);
  assert.equal(INTERVALO_MS, 120000);
  assert.equal(limitarPosts(10), 3);
  assert.equal(limitarPosts(2), 2);
  assert.equal(limitarPosts(-1), 0);
});

test('STATUS: OK continua, mesmo com "verificação" e "limite diário" no texto da auditoria', () => {
  const t = 'Auditoria: verificação concluída, 0 falhas.\nPost dentro do limite diário.\nSTATUS: OK';
  assert.equal(classificarSaida(t, 0).parar, false);
});

test('STATUS: PARAR para sem desativar', () => {
  const c = classificarSaida('Sessão deslogada.\nSTATUS: PARAR deslogado', 0);
  assert.equal(c.parar, true);
  assert.equal(c.desativar, false);
  assert.equal(c.motivo, 'deslogado');
});

test('STATUS: DESATIVAR para e desativa a tarefa', () => {
  const c = classificarSaida('STATUS: DESATIVAR atividade incomum na conta', 0);
  assert.equal(c.parar, true);
  assert.equal(c.desativar, true);
});

test('a última linha STATUS vence: STATUS: OK final não é parada', () => {
  assert.equal(classificarSaida('STATUS: PARAR captcha\nSTATUS: OK', 0).parar, false);
});

test('saída sem linha de status para', () => {
  const c = classificarSaida('Post agendado com sucesso.', 0);
  assert.equal(c.parar, true);
  assert.equal(c.desativar, false);
});

test('código de saída diferente de 0 ou timeout (null) para, mesmo com STATUS: OK', () => {
  assert.equal(classificarSaida('STATUS: OK', 1).parar, true);
  assert.equal(classificarSaida('STATUS: OK', null).parar, true);
});

test('uma execução por dia: não repete após concluída ou parada', () => {
  assert.equal(jaRodouHoje({ ultimoDia: '2026-10-19', status: 'concluido' }, '2026-10-19'), true);
  assert.equal(jaRodouHoje({ ultimoDia: '2026-10-19', status: 'parado' }, '2026-10-19'), true);
  assert.equal(jaRodouHoje({ ultimoDia: '2026-10-18', status: 'concluido' }, '2026-10-19'), false);
  assert.equal(jaRodouHoje({}, '2026-10-19'), false);
});
