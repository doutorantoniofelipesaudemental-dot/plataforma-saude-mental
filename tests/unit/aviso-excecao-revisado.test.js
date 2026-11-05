// Exceção à palavra "revisado" (ordem de 04/11/2026, 21:22): vale SÓ para o selo legítimo (registro aprovado e hash atual)
// e para o texto exato de uma página institucional aprovada (mesma data e mesmo hash). Qualquer outro "revisado" reprova.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../../backend/lib/revisaoMedica');
const P = require('../../scripts/revisao/paginasInstitucionais');
const { checarAviso } = require('../../scripts/revisao/revisao');

const DATA = new Date('2026-11-04T12:00:00Z');
const BASE = 'Conteúdo educativo produzido com apoio de inteligência artificial, com checagem automatizada e aprovado para publicação pelo Dr. Antônio Felipe, responsável pelo conteúdo (Resolução CFM 2.454/2026). 04/11/2026';
const reprova = (texto, ctx) => checarAviso(texto, ctx).some((f) => /revisado/.test(f));

test('sem contexto de registro, "Revisado pelo Dr. Antônio Felipe em DD/MM/AAAA" reprova', () => {
  assert.equal(reprova(`${BASE} Revisado pelo Dr. Antônio Felipe em 04/11/2026.`), true);
});

test('selo legítimo: registro aprovado com o hash atual aceita o selo exato', () => {
  const corpo = 'corpo do texto';
  const hash = R.hashConteudo(corpo);
  const registro = { 'slug-a': R.aprovar({ slug: 'slug-a', hash, revisor: 'Dr. Antônio Felipe', data: DATA }) };
  const selo = R.selo({ registro: registro['slug-a'], hashAtual: hash });
  assert.ok(selo, 'selo deve existir com registro válido');
  assert.equal(reprova(`${BASE} ${selo}.`, { selo: { registro: registro['slug-a'], hashAtual: hash } }), false);
});

test('selo com hash diferente (texto mudou) reprova mesmo com registro', () => {
  const hash = R.hashConteudo('corpo original');
  const reg = R.aprovar({ slug: 'slug-a', hash, revisor: 'Dr. Antônio Felipe', data: DATA });
  const outroHash = R.hashConteudo('corpo alterado');
  assert.equal(reprova(`${BASE} Revisado pelo Dr. Antônio Felipe em 04/11/2026.`, { selo: { registro: reg, hashAtual: outroHash } }), true);
});

test('selo com registro reprovado (não aprovado) reprova', () => {
  const hash = R.hashConteudo('corpo');
  const reg = R.reprovar({ slug: 'slug-a', motivo: 'teste', data: DATA });
  assert.equal(reprova(`${BASE} Revisado pelo Dr. Antônio Felipe em 04/11/2026.`, { selo: { registro: reg, hashAtual: hash } }), true);
});

test('página aprovada: o texto exato, com a data e o hash registrados, passa', () => {
  const html = '<html><body><p>Conteúdo</p>' + P.AVISO_GERAL + '</body></html>';
  const registro = { 'mentoria.html': { hash: P.hashPagina(html), data: '04/11/2026' } };
  const texto = P.avisoRevisada('04/11/2026');
  const ctx = { pagina: { nome: 'mentoria.html', registro, hash: P.hashPagina(html) } };
  assert.equal(reprova(`Dr. Antônio Felipe. inteligência artificial. aprovado para publicação pelo Dr. Antônio Felipe ${texto} 04/11/2026`, ctx), false);
});

test('página aprovada com data diferente da registrada reprova', () => {
  const html = '<html><body>' + P.AVISO_GERAL + '</body></html>';
  const registro = { 'mentoria.html': { hash: P.hashPagina(html), data: '04/11/2026' } };
  const ctx = { pagina: { nome: 'mentoria.html', registro, hash: P.hashPagina(html) } };
  assert.equal(reprova(`${BASE} ${P.avisoRevisada('05/11/2026')}`, ctx), true);
});

test('página sem registro reprova, mesmo com o texto de página revisada', () => {
  const texto = P.avisoRevisada('04/11/2026');
  assert.equal(reprova(`${BASE} ${texto}`, { pagina: { nome: 'mentoria.html', registro: {}, hash: 'x' } }), true);
});

test('página com hash diferente do registrado reprova', () => {
  const registro = { 'mentoria.html': { hash: 'aaa', data: '04/11/2026' } };
  const texto = P.avisoRevisada('04/11/2026');
  assert.equal(reprova(`${BASE} ${texto}`, { pagina: { nome: 'mentoria.html', registro, hash: 'bbb' } }), true);
});

test('"revisado por" em qualquer forma reprova, com ou sem contexto válido', () => {
  const ctx = { selo: { registro: null, hashAtual: 'x' } };
  assert.equal(reprova(`${BASE} Texto revisado por Dr. Antônio Felipe.`, ctx), true);
  assert.equal(reprova(`${BASE} Texto revisado pelo médico.`, ctx), true);
});

test('o aviso do site (sem qualquer selo) não reprova', () => {
  assert.deepEqual(checarAviso(R.avisoPendente({ atualizadoEm: DATA })), []);
});
