const { test } = require('node:test');
const assert = require('node:assert/strict');
const n = require('../../backend/lib/narracaoApp.js');

const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2000, 1)]);
const HASH = 'a'.repeat(64);

test('caminhos: narracoes/app/<slug>.mp3 e o hash ao lado', () => {
  assert.equal(n.caminhoNarracaoApp('vape-nicotina-adolescentes'), 'narracoes/app/vape-nicotina-adolescentes.mp3');
  assert.equal(n.caminhoHashNarracaoApp('vape-nicotina-adolescentes'), 'narracoes/app/vape-nicotina-adolescentes.hash.json');
});

test('validar: aceita MP3 com hash SHA-256', () => {
  assert.equal(n.validarEnvioNarracaoApp({ slug: 'vape-nicotina-adolescentes', audio: MP3, hash: HASH }), null);
});

test('validar: recusa slug fora do padrão, corpo que não é MP3, hash inválido e tamanho acima do limite', () => {
  assert.equal(n.validarEnvioNarracaoApp({ slug: '../x', audio: MP3, hash: HASH }).status, 400);
  assert.equal(n.validarEnvioNarracaoApp({ slug: 'ab-cd', audio: Buffer.from('<html>' + 'x'.repeat(2000)), hash: HASH }).status, 400);
  assert.equal(n.validarEnvioNarracaoApp({ slug: 'ab-cd', audio: MP3, hash: 'zz' }).status, 400);
  assert.equal(n.validarEnvioNarracaoApp({ slug: 'ab-cd', audio: Buffer.alloc(n.LIMITE_BYTES + 1, 0xff), hash: HASH }).status, 413);
  assert.equal(n.validarEnvioNarracaoApp({ slug: 'ab-cd', audio: undefined, hash: HASH }).status, 400);
});

test('decidir: grava sem áudio anterior, com o mesmo hash ou com ordem de renarrar', () => {
  assert.equal(n.decidirGravacaoNarracaoApp({ existente: null, hash: HASH, renarrar: false }).gravar, true);
  assert.equal(n.decidirGravacaoNarracaoApp({ existente: { hash: HASH }, hash: HASH, renarrar: false }).gravar, true);
  assert.equal(n.decidirGravacaoNarracaoApp({ existente: { hash: 'b'.repeat(64) }, hash: HASH, renarrar: true }).gravar, true);
});

test('decidir: não troca áudio de hash diferente sem ordem de renarrar (409)', () => {
  const d = n.decidirGravacaoNarracaoApp({ existente: { hash: 'b'.repeat(64) }, hash: HASH, renarrar: false });
  assert.equal(d.gravar, false);
  assert.equal(d.status, 409);
});
