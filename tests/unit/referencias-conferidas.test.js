const test = require('node:test');
const assert = require('node:assert/strict');
const { conferirReferencias, sobrenomeDoPrimeiroAutor, STATUS } = require('../../backend/lib/referenciasConferidas');

test('sobrenome do primeiro autor em formatos comuns', () => {
  assert.equal(sobrenomeDoPrimeiroAutor('Kessler RC, Berglund P, et al. Lifetime...'), 'Kessler');
  assert.equal(sobrenomeDoPrimeiroAutor('Walkup JT, Albano AM'), 'Walkup');
});

test('sem referências = pendente, nunca aprovado', () => {
  const r = conferirReferencias([]);
  assert.equal(r.ok, false);
  assert.equal(r.itens[0].status, STATUS.PENDENTE);
});

test('sem DOI nem PMID = pendente de conferência (não é erro)', () => {
  const r = conferirReferencias([{ texto: 'Kelly Y, et al. 2019.', conferida: true }]);
  assert.equal(r.ok, false);
  assert.equal(r.itens[0].status, STATUS.PENDENTE);
});

test('DOI conferido e frase com o primeiro autor = conferida', () => {
  const r = conferirReferencias([{ texto: 'Walkup JT, et al. 2008', doi: '10.1056/NEJMoa0804633', conferida: true, frase: 'Walkup e colaboradores mostraram que a combinação foi melhor.' }]);
  assert.equal(r.ok, true);
  assert.equal(r.itens[0].status, STATUS.CONFERIDA);
});

test('frase que não cita o primeiro autor = atribuição incompatível', () => {
  const r = conferirReferencias([{ texto: 'Walkup JT, et al. 2008', pmid: '18974308', conferida: true, frase: 'Um ensaio clínico mostrou o resultado.' }]);
  assert.equal(r.ok, false);
  assert.equal(r.itens[0].status, STATUS.INCOMPATIVEL);
});

test('uma pendência basta para não aprovar o conjunto', () => {
  const r = conferirReferencias([
    { texto: 'Kessler RC, et al.', doi: '10.1001/archpsyc.62.6.593', conferida: true },
    { texto: 'Kelly Y, et al.', conferida: false },
  ]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.itens.map((i) => i.status), [STATUS.CONFERIDA, STATUS.PENDENTE]);
});
