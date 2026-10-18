const test = require('node:test');
const assert = require('node:assert/strict');
const { classificarAviso } = require('../../scripts/linkedin/classificarAviso');

test('"Publicação agendada" é sucesso', () => {
  assert.equal(classificarAviso({ avisos: ['Publicação agendada. Ver publicações agendadas'], caminho: '/feed/' }).estado, 'sucesso');
});

test('feed com "Usuário verificado" não vira bloqueio (regressão de 17/10/2026)', () => {
  // o texto da página nunca entra: só avisos e URL; um aviso de sucesso vence qualquer outro
  const r = classificarAviso({ avisos: ['Publicação agendada.', 'Usuário verificado'], caminho: '/feed/' });
  assert.equal(r.estado, 'sucesso');
  assert.equal(classificarAviso({ avisos: [], caminho: '/feed/' }).estado, 'incerto');
});

test('limite diário é limite, não bloqueio', () => {
  const r = classificarAviso({ avisos: ['Você atingiu o limite de publicações de hoje.'], caminho: '/feed/' });
  assert.equal(r.estado, 'limite');
  assert.match(r.motivo, /limite/);
});

test('verificação, CAPTCHA, atividade incomum e páginas de checkpoint/login são bloqueio', () => {
  assert.equal(classificarAviso({ avisos: ['Detectamos atividade incomum na sua conta'] }).estado, 'bloqueio');
  assert.equal(classificarAviso({ avisos: ['Faça a verificação de segurança'] }).estado, 'bloqueio');
  assert.equal(classificarAviso({ avisos: [], caminho: '/checkpoint/challenge/abc' }).estado, 'bloqueio');
  assert.equal(classificarAviso({ avisos: [], caminho: '/uas/login' }).estado, 'bloqueio');
});

test('sem aviso conhecido: incerto (não conta como agendado)', () => {
  assert.equal(classificarAviso({ avisos: ['Algo aconteceu'], caminho: '/feed/' }).estado, 'incerto');
});
