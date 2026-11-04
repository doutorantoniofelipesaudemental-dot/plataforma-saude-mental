const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { itemPublicavel, itemDemoAuditoria, cenasDoItem } = require('../../scripts/youtube/itemPublicavel');

test('item reprovado nunca é publicável', () => {
  assert.equal(itemPublicavel({ status: 'reprovado', cenas: 4 }), false);
});

test('item sem o campo cenas (imagem fixa, legado) não é publicável', () => {
  assert.equal(cenasDoItem({ status: 'aprovado-checagem' }), 1);
  assert.equal(itemPublicavel({ status: 'aprovado-checagem' }), false);
});

test('item aprovado com 2 ou mais cenas é publicável', () => {
  assert.equal(itemPublicavel({ status: 'aprovado-checagem', cenas: 2 }), true);
});

test('demonstração da auditoria não é publicação normal', () => {
  assert.equal(itemPublicavel({ status: 'demo-auditoria', cenas: 4, privacidade: 'private' }), false);
});

test('demonstração só vale como privada e com cenas suficientes', () => {
  assert.equal(itemDemoAuditoria({ status: 'demo-auditoria', cenas: 4, privacidade: 'private', conteudoClinico: false }), true);
  assert.equal(itemDemoAuditoria({ status: 'demo-auditoria', cenas: 4, privacidade: 'public' }), false);
  assert.equal(itemDemoAuditoria({ status: 'demo-auditoria', cenas: 1, privacidade: 'private' }), false);
  assert.equal(itemDemoAuditoria({ status: 'aprovado-checagem', cenas: 4, privacidade: 'private' }), false);
});

test('publicador e teste usam a mesma checagem (não escolhem item por status sozinho)', () => {
  const pub = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'youtube', 'publicarYoutube.js'), 'utf8');
  const teste = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'youtube', 'testeUploadPrivado.js'), 'utf8');
  assert.match(pub, /itemPublicavel\(i\)/, 'publicarYoutube filtra com itemPublicavel');
  assert.match(teste, /itemPublicavel\(i\)/, 'testeUploadPrivado filtra com itemPublicavel');
  assert.match(teste, /itemDemoAuditoria\(i\)/, 'testeUploadPrivado usa a demo só com --id');
  assert.doesNotMatch(teste, /status === 'aprovado-checagem'/, 'testeUploadPrivado não escolhe por status sozinho');
});
