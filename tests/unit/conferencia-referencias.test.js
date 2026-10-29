const test = require('node:test');
const assert = require('node:assert/strict');
const { validarResultados, planejar, conferirDepois } = require('../../scripts/linkedin/conferenciaReferencias');

const aprovado = { post: 'li-1', status: 'aprovado', pmid: '25455248', doi: '10.1016/S0140-6736(14)61276-9', motivo: 'ok' };
const reprovado = { post: 'li-2', status: 'reprovado', motivo: 'sem referência' };

test('validar: aprovado precisa de PMID ou DOI válido; reprovado precisa de motivo', () => {
  assert.deepEqual(validarResultados([aprovado, reprovado]), []);
  assert.equal(validarResultados([{ post: 'x', status: 'aprovado', pmid: 'abc' }]).length, 1);
  assert.equal(validarResultados([{ post: 'x', status: 'reprovado', motivo: '  ' }]).length, 1);
  assert.equal(validarResultados([{ post: 'x', status: 'talvez' }]).length, 1);
});

test('validar: item repetido e resultado vazio são recusados', () => {
  assert.equal(validarResultados([aprovado, aprovado]).some((p) => /mais de uma vez/.test(p)), true);
  assert.equal(validarResultados([]).length, 1);
});

test('planejar: aprovado grava referenciaConferida; reprovado vai para manual com o motivo', () => {
  const docs = [
    { _id: 'li-1', tipo: 'texto', status: 'aprovado-checagem' },
    { _id: 'li-2', tipo: 'texto', status: 'aprovado-checagem' },
  ];
  const [a, r] = planejar(docs, [aprovado, reprovado], 'agora');
  assert.equal(a.acao, 'aprovar');
  assert.deepEqual(a.set.referenciaConferida, { pmid: '25455248', fonte: 'PubMed', conferidoEm: 'agora' });
  assert.equal(r.acao, 'manual');
  assert.equal(r.set.status, 'manual');
  assert.equal(r.set.motivoManual, 'sem referência');
});

test('planejar: agendado e carrossel não são tocados; item inexistente é registrado', () => {
  const docs = [
    { _id: 'li-1', tipo: 'texto', status: 'agendado-linkedin' },
    { _id: 'li-2', tipo: 'carrossel', status: 'aprovado-checagem' },
  ];
  const plano = planejar(docs, [aprovado, reprovado, { post: 'li-9', status: 'reprovado', motivo: 'x' }], 'agora');
  assert.deepEqual(plano.map((p) => p.acao), ['pular', 'pular', 'pular']);
});

test('conferirDepois: aponta aprovado sem referência e reprovado que não foi para manual', () => {
  const depois = [
    { _id: 'li-1', status: 'aprovado-checagem' },
    { _id: 'li-2', status: 'aprovado-checagem' },
  ];
  const falhas = conferirDepois(depois, [aprovado, reprovado]);
  assert.equal(falhas.length, 2);
  const ok = conferirDepois([
    { _id: 'li-1', status: 'aprovado-checagem', referenciaConferida: { pmid: '25455248' } },
    { _id: 'li-2', status: 'manual' },
  ], [aprovado, reprovado]);
  assert.deepEqual(ok, []);
});
