const test = require('node:test');
const assert = require('node:assert/strict');
const { PUBLICO_SELO, rotuloPublico, problemasDaCapa } = require('../../backend/lib/seloPublico');
const { textoDoSelo, problemasDaCapa: problemasNaCapa } = require('../../backend/lib/capaRedes');

test('todo selo de público começa com "Para" (decisão de 29/10/2026)', () => {
  for (const [categoria, selo] of Object.entries(PUBLICO_SELO)) {
    assert.ok(selo.startsWith('Para '), `${categoria} -> ${selo}`);
  }
});

test('o exemplo da decisão: "Médicos & Enfermeiros" vira "Para Médicos & Enfermeiros"', () => {
  assert.equal(rotuloPublico('Médicos & Enfermeiros'), 'Para Médicos & Enfermeiros');
  assert.equal(rotuloPublico('Pacientes & Famílias'), 'Para pacientes e famílias');
  assert.equal(rotuloPublico('Empresas & RH'), 'Para empresas e RH');
});

test('categoria sem público (ex.: "Geral" ou inventada) não tem selo', () => {
  assert.equal(rotuloPublico('Geral'), '');
  assert.equal(rotuloPublico('Qualquer coisa'), '');
});

test('toda capa tem título (o tema): capa sem título é reprovada', () => {
  assert.deepEqual(problemasDaCapa({ titulo: 'Primeiros episódios psicóticos', categoria: 'Médicos & Enfermeiros' }), []);
  assert.equal(problemasDaCapa({ titulo: '  ', categoria: 'Geral' }).length, 1);
});

test('o selo do texto real da capa nunca é o tema (regressão do erro de 29/10)', () => {
  const artigo = { titulo: 'Primeiros episódios psicóticos: reconhecimento precoce e conduta inicial', categoria: 'Médicos & Enfermeiros' };
  assert.equal(textoDoSelo(artigo), 'Para Médicos & Enfermeiros');
  assert.deepEqual(problemasNaCapa(artigo), []);
});
