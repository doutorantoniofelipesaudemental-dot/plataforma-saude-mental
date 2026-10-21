const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../../backend/lib/revisaoMedica');
const { corpoDo, checarAviso } = require('../../scripts/revisao/revisao');

const RAIZ = path.resolve(__dirname, '../..');
const DATA = new Date('2026-10-21T12:00:00Z');

test('hash: CRLF e espaços das bordas não mudam o hash do corpo', () => {
  assert.equal(R.hashConteudo('Olá\r\nmundo\r\n'), R.hashConteudo('Olá\nmundo'));
  assert.notEqual(R.hashConteudo('Olá'), R.hashConteudo('Olá!'));
});

test('aviso pendente diz que a revisão médica está pendente e nunca que foi revisado', () => {
  const t = R.avisoPendente({ atualizadoEm: DATA });
  assert.match(t, /inteligência artificial/);
  assert.match(t, /Revisão médica individual: pendente/);
  assert.match(t, /Dr\. Antônio Felipe Garabito/);
  assert.match(t, /Atualizado em 21\/10\/2026/);
  assert.doesNotMatch(t, /revisad[oa] pel/i);
});

test('só aprovação com o hash do texto atual vale', () => {
  const hash = R.hashConteudo('texto aprovado');
  const reg = R.aprovar({ slug: 'a', hash, revisor: 'Dr. Antônio Felipe Garabito', data: DATA });
  assert.equal(R.estadoRevisao({ registro: reg, hashAtual: hash }).status, 'aprovada');
  assert.equal(R.estadoRevisao({ registro: reg, hashAtual: R.hashConteudo('texto mudou') }).status, 'pendente');
  assert.equal(R.estadoRevisao({ registro: undefined, hashAtual: hash }).status, 'pendente');
});

test('texto que muda depois da aprovação volta a pendente e o selo some', () => {
  const hash = R.hashConteudo('v1');
  const reg = R.aprovar({ slug: 'a', hash, revisor: 'x', data: DATA });
  const mudou = R.hashConteudo('v2');
  assert.equal(R.selo({ registro: reg, hashAtual: hash }), 'Revisado pelo Dr. Antônio Felipe Garabito em 21/10/2026');
  assert.equal(R.selo({ registro: reg, hashAtual: mudou }), null);
  assert.match(R.estadoRevisao({ registro: reg, hashAtual: mudou }).motivo, /mudou/);
});

test('reprovar nunca produz aprovada e exige motivo', () => {
  const r = R.reprovar({ slug: 'a', motivo: 'referência retratada', data: DATA });
  assert.equal(r.status, 'reprovada');
  assert.equal(R.estadoRevisao({ registro: r, hashAtual: R.hashConteudo('x') }).status, 'pendente');
  assert.throws(() => R.reprovar({ slug: 'a', data: DATA }), /motivo/);
});

test('aprovar exige slug, hash e quem aprovou', () => {
  assert.throws(() => R.aprovar({ slug: 'a', revisor: 'x', data: DATA }), /hash/);
  assert.throws(() => R.aprovar({ slug: 'a', hash: 'h', data: DATA }), /quem/);
});

test('checagem do aviso: aceita o texto oficial e reprova "revisado por" e "psiquiatra"', () => {
  assert.deepEqual(checarAviso(R.avisoPendente({ atualizadoEm: DATA })), []);
  assert.ok(checarAviso('Texto revisado por Dr. Antônio Felipe Garabito. inteligência artificial. Revisão médica individual: pendente. 21/10/2026').some((f) => /revisado/.test(f)));
  assert.ok(checarAviso('Dr. Antônio Felipe Garabito, psiquiatra. inteligência artificial. Revisão médica individual: pendente. 21/10/2026').some((f) => /psiquiatra/.test(f)));
  assert.ok(checarAviso('Dr. Antonio Felipe. inteligência artificial').some((f) => /acento|Garabito/.test(f)));
});

test('corpo do texto: o hash ignora o frontmatter (gravar metadados não muda o hash)', () => {
  const a = '---\ntitulo: X\n---\nCorpo do texto.';
  const b = '---\ntitulo: X\nrevisaoMedica: pendente\n---\nCorpo do texto.';
  assert.equal(R.hashConteudo(corpoDo(a)), R.hashConteudo(corpoDo(b)));
});

test('nenhum caminho novo grava "aprovada" fora da aprovação registrada (lista permitida explícita)', () => {
  const permitidos = new Set([
    'backend/lib/revisaoMedica.js', // a regra
    'scripts/revisao/revisao.js', // a decisão do Dr. Antônio
    'backend/scripts/ingestaoRascunhos.js', // PENDÊNCIA: fluxo antigo de rascunhos, a unificar com o registro
  ]);
  const achados = [];
  const andar = (dir) => {
    for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, n.name);
      if (n.isDirectory()) { if (n.name !== 'node_modules') andar(p); continue; }
      if (!/\.js$/.test(n.name)) continue;
      const rel = path.relative(RAIZ, p).replace(/\\/g, '/');
      if (/revisaoMedica:?\s*['"]?aprovada|status:\s*['"]aprovada['"]/i.test(fs.readFileSync(p, 'utf8')) && !permitidos.has(rel)) achados.push(rel);
    }
  };
  andar(path.join(RAIZ, 'backend'));
  andar(path.join(RAIZ, 'scripts'));
  assert.deepEqual(achados, []);
});
