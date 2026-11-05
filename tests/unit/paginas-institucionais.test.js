// Aviso das páginas institucionais (ordem de 04/11/2026): aviso geral por padrão; página revisada só com registro e hash iguais.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../../scripts/revisao/paginasInstitucionais');

const HTML = '<html><body><p class="legal">Texto de teste.\n      ' + P.AVISO_GERAL + '\n    </p></body></html>';

test('sem registro, toda página mostra o aviso geral', () => {
  assert.equal(P.avisoEsperado(HTML, 'mentoria.html', {}), P.AVISO_GERAL);
});

test('aprovação com o hash atual mostra a versão "página revisada" com a data', () => {
  const reg = { 'mentoria.html': { hash: P.hashPagina(HTML), data: '04/11/2026' } };
  assert.equal(P.avisoEsperado(HTML, 'mentoria.html', reg), P.avisoRevisada('04/11/2026'));
});

test('se o conteúdo mudou, o hash não bate e volta ao aviso geral', () => {
  const reg = { 'mentoria.html': { hash: P.hashPagina(HTML), data: '04/11/2026' } };
  const mudou = HTML.replace('Texto de teste.', 'Texto alterado.');
  assert.equal(P.avisoEsperado(mudou, 'mentoria.html', reg), P.AVISO_GERAL);
});

test('trocar o aviso não altera o hash da página', () => {
  const trocado = P.aplicarAviso(HTML, P.avisoRevisada('04/11/2026'));
  assert.equal(P.hashPagina(trocado), P.hashPagina(HTML));
});

test('o aviso geral diz que o conteúdo foi aprovado para publicação e cita a Resolução CFM 2.454/2026', () => {
  assert.match(P.AVISO_GERAL, /Resolução CFM 2\.454\/2026/);
  assert.match(P.AVISO_GERAL, /aprovado para publicação pelo Dr\. Antônio Felipe, responsável pelo conteúdo \(Resolução CFM 2\.454\/2026\)\./);
});

test('as quatro páginas institucionais estão no estado do registro (sem página marcada como revisada)', () => {
  const reg = P.lerRegistro();
  for (const nome of P.PAGINAS) {
    const html = fs.readFileSync(path.join(P.PUBLIC, nome), 'utf8');
    assert.equal(P.paginaEstaNoEstado(html, nome, reg), true, `${nome} fora do estado do registro`);
    assert.equal(reg[nome], undefined, `${nome} não deve estar marcada como revisada agora`);
  }
});

test('nenhuma página do site mostra o texto antigo "Revisão médica individual: pendente"', () => {
  const dir = P.PUBLIC;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
    assert.equal(fs.readFileSync(path.join(dir, f), 'utf8').includes('Revisão médica individual: pendente'), false, f);
  }
});
