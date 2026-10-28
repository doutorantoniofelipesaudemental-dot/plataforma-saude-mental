const test = require('node:test');
const assert = require('node:assert/strict');
const { classificarSaida, jaRodouHoje, limitarPosts, montarRegistroDesativacao, registrarDesativacao, MAX_POSTS, INTERVALO_MS } = require('../../scripts/linkedin/agendarDiario');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('limites: máximo 2 posts por dia e 2 min entre eles', () => {
  assert.equal(MAX_POSTS, 2);
  assert.equal(INTERVALO_MS, 120000);
  assert.equal(limitarPosts(10), 2);
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

test('registro de desativação: traz data, motivo, mensagem curta e código', () => {
  const r = montarRegistroDesativacao({ data: '2026-10-27', motivo: 'atividade incomum', mensagem: 'Aviso:\n  atividade   incomum na conta', codigoSaida: 0 });
  assert.equal(r.tarefa, 'DrSM-LinkedIn-Agendar');
  assert.equal(r.data, '2026-10-27');
  assert.equal(r.motivo, 'atividade incomum');
  assert.equal(r.mensagem, 'Aviso: atividade incomum na conta');
  assert.equal(r.codigoSaida, 0);
  assert.ok(!Number.isNaN(Date.parse(r.registradoEm)));
});

test('registro de desativação: corta a mensagem em 300 caracteres e aceita motivo vazio', () => {
  const r = montarRegistroDesativacao({ data: '2026-10-27', motivo: '', mensagem: 'x'.repeat(900) });
  assert.equal(r.mensagem.length, 300);
  assert.equal(r.motivo, 'sem motivo informado');
  assert.equal(r.codigoSaida, null);
});

test('registro de desativação: grava uma linha JSON por desativação e nunca lança', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drs-desativacao-'));
  const arquivo = path.join(dir, 'desativacoes.jsonl');
  const r1 = registrarDesativacao(montarRegistroDesativacao({ data: '2026-10-27', motivo: 'a', mensagem: 'm1' }), arquivo);
  const r2 = registrarDesativacao(montarRegistroDesativacao({ data: '2026-10-28', motivo: 'b', mensagem: 'm2' }), arquivo);
  assert.deepEqual([r1.gravado, r2.gravado], [true, true]);
  const linhas = fs.readFileSync(arquivo, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(linhas.map((l) => l.motivo), ['a', 'b']);
  // caminho impossível (o próprio arquivo como pasta): não lança, devolve gravado=false com motivo
  const falha = registrarDesativacao(montarRegistroDesativacao({ data: '2026-10-29', motivo: 'c', mensagem: '' }), arquivo + '/impossivel');
  assert.equal(falha.gravado, false);
  assert.ok(falha.motivo.length > 0);
  fs.rmSync(dir, { recursive: true, force: true });
});
