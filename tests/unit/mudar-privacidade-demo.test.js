// Regra de privacidade do vídeo de demonstração: só o id fixo, só private -> unlisted, nunca public.
const test = require('node:test');
const assert = require('node:assert/strict');
const { podeMudar, DEMO_ID } = require('../../scripts/youtube/mudarPrivacidadeDemo.js');

test('permite só private -> unlisted no vídeo de demonstração', () => {
  assert.equal(podeMudar({ id: DEMO_ID, atual: 'private', destino: 'unlisted' }).ok, true);
});

test('recusa public em qualquer caso', () => {
  assert.equal(podeMudar({ id: DEMO_ID, atual: 'private', destino: 'public' }).ok, false);
  assert.equal(podeMudar({ id: DEMO_ID, atual: 'unlisted', destino: 'public' }).ok, false);
});

test('recusa outro vídeo', () => {
  assert.equal(podeMudar({ id: '-Z0uPYiwJ7I', atual: 'private', destino: 'unlisted' }).ok, false);
});

test('recusa estado atual diferente de private e volta para private', () => {
  assert.equal(podeMudar({ id: DEMO_ID, atual: 'unlisted', destino: 'unlisted' }).ok, false);
  assert.equal(podeMudar({ id: DEMO_ID, atual: 'unlisted', destino: 'private' }).ok, false);
});
