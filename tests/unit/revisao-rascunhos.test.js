// Registro próprio de rascunhos (ordem de 21/10/2026): aprovação por `rascunho:<slug>` com hash do corpo do rascunho.
// Cobre: aprovado igual passa; aprovado e depois alterado bloqueia; sem aprovação bloqueia;
// aprovação do texto do app não vale para rascunho; registro corrompido para antes de gravar.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ing = require('../../backend/scripts/ingestaoRascunhos');
const R = require('../../backend/lib/revisaoMedica');
const { corpoDo } = require('../../scripts/revisao/revisao');
const { CATEGORIAS } = require('../../backend/models/Artigo');

const SLUG = 'rascunho-de-teste-revisao';
const rascunhoTexto = (corpo = 'Abertura **clara** do texto.\n\n## Seção\n\n- passo um\n- passo dois\n') => `---
pautaId: p-1
slug: ${SLUG}
titulo: "Rascunho de teste de revisão"
categoria: "Residentes & Estudantes"
tipo: artigo-cientifico
status: rascunho
checagensAutomaticas: aprovado (humanização, ética/CFM, originalidade)
revisaoMedica: aprovada
---

# Rascunho de teste de revisão

*Resumo acolhedor do rascunho.*

${corpo}
`;

const ler = (texto) => ({ arquivo: 'r.md', ...ing.lerFrontmatter(texto) });
const aprovadoNoRegistro = (texto, slug = SLUG) => ({
  [ing.chaveRascunho(slug)]: R.aprovar({ slug: ing.chaveRascunho(slug), hash: R.hashConteudo(corpoDo(texto)), revisor: 'teste', data: new Date() }),
});

test('chave do rascunho é própria e não coincide com a do texto do app', () => {
  assert.equal(ing.chaveRascunho('abc'), 'rascunho:abc');
  assert.notEqual(ing.chaveRascunho(SLUG), SLUG);
});

test('aprovado igual passa: o hash do aprovar (revisao.js) é o mesmo da ingestão', () => {
  const texto = rascunhoTexto();
  assert.equal(R.hashConteudo(corpoDo(texto)), R.hashConteudo(ler(texto).corpo), 'mesmo hash nos dois caminhos');
  assert.deepEqual(ing.validarRascunho(ler(texto), { categorias: CATEGORIAS, registro: aprovadoNoRegistro(texto) }), []);
});

test('aprovado e depois alterado bloqueia: a aprovação cai quando o corpo muda', () => {
  const aprovado = rascunhoTexto();
  const alterado = rascunhoTexto('Abertura **clara** do texto, com uma frase a mais.\n\n## Seção\n\n- passo um\n');
  const motivos = ing.validarRascunho(ler(alterado), { categorias: CATEGORIAS, registro: aprovadoNoRegistro(aprovado) });
  assert.ok(motivos.some((m) => /sem aprovação registrada.*texto mudou depois da aprovação/.test(m)), motivos.join(' | '));
});

test('sem aprovação bloqueia', () => {
  const motivos = ing.validarRascunho(ler(rascunhoTexto()), { categorias: CATEGORIAS, registro: {} });
  assert.ok(motivos.some((m) => /sem aprovação registrada/.test(m)));
});

test('aprovação do texto do app (chave = slug) não vale para o rascunho de mesmo slug', () => {
  const texto = rascunhoTexto();
  const registro = { [SLUG]: R.aprovar({ slug: SLUG, hash: R.hashConteudo(corpoDo(texto)), revisor: 'teste', data: new Date() }) };
  const motivos = ing.validarRascunho(ler(texto), { categorias: CATEGORIAS, registro });
  assert.ok(motivos.some((m) => /sem aprovação registrada/.test(m)));
});

test('registro corrompido para antes de gravar: lança erro e não altera o arquivo', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-rev-'));
  const arquivo = path.join(pasta, 'registro.json');
  const conteudo = '{ "rascunho:x": { status: ';
  fs.writeFileSync(arquivo, conteudo, 'utf8');
  assert.throws(() => ing.lerRegistroRevisao(arquivo), /registro de revisão corrompido.*Nada foi gravado/);
  assert.equal(fs.readFileSync(arquivo, 'utf8'), conteudo, 'arquivo intacto');
  fs.writeFileSync(arquivo, '[1, 2]', 'utf8');
  assert.throws(() => ing.lerRegistroRevisao(arquivo), /corrompido/);
});

test('registro ausente vale como vazio (nada aprovado), sem erro', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-rev-'));
  assert.deepEqual(ing.lerRegistroRevisao(path.join(pasta, 'nao-existe.json')), {});
});
