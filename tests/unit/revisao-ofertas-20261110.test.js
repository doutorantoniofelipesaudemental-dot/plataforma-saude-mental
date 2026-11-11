const test = require('node:test');
const assert = require('node:assert/strict');
const { transformarOferta } = require('../../backend/scripts/portal/aplicarRevisao20261110');

test('remove "Agendar uma avaliação" e "Solicitar consulta de orientação"', () => {
  const html = '<p>x</p><a class="botao" href="/#agendar">Agendar uma avaliação</a><a class="botao--primario" href="/?tipo=particular#contato-servicos">Solicitar consulta de orientação</a><a href="/?tipo=consultoria-empresa#contato-servicos">Conheça a consultoria</a>';
  const r = transformarOferta(html);
  assert.equal(r.contagem.avaliacao, 1);
  assert.equal(r.contagem.orientacao, 1);
  assert.equal(r.restou, false);
  assert.ok(r.novo.includes('Conheça a consultoria'));
  assert.ok(!/Agendar uma avalia|Solicitar consulta/.test(r.novo));
});

test('"Falar sobre mentoria individual" vira "Mentoria, consultoria e formação" em /mentoria', () => {
  const html = '<a class="botao botao--vazado" href="/?tipo=particular#contato-servicos">Falar sobre mentoria individual</a>';
  const r = transformarOferta(html);
  assert.equal(r.contagem.mentoria, 1);
  assert.equal(r.novo, '<a class="botao botao--vazado" href="/mentoria">Mentoria, consultoria e formação</a>');
  assert.equal(r.restou, false);
});

test('"Falar sobre mentoria médica" recebe a mesma troca', () => {
  const r = transformarOferta('<a href="/?tipo=particular#contato-servicos">Falar sobre mentoria médica</a>');
  assert.equal(r.contagem.mentoria, 1);
  assert.equal(r.restou, false);
});

test('texto sem oferta fica igual e sem contagem', () => {
  const html = '<p>Texto comum com <a href="/mentoria">link</a>.</p>';
  const r = transformarOferta(html);
  assert.equal(r.novo, html);
  assert.deepEqual(r.contagem, { avaliacao: 0, orientacao: 0, mentoria: 0 });
});

test('padrão que escapa da regra é sinalizado (restou)', () => {
  const r = transformarOferta('<a href="/?tipo=particular#contato-servicos">Outro texto</a>');
  assert.equal(r.restou, true);
});
