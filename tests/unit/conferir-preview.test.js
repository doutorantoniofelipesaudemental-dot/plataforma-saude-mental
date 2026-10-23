const test = require('node:test');
const assert = require('node:assert/strict');
const { paginaValida, recursosDoHtml, caminhosDoDominio } = require('../../scripts/conferirPreview');

const PAGINA = '<html><head></head><body><h1>Título</h1>' + 'x'.repeat(2100) + '</body></html>';

test('página válida: 200, HTML com título e corpo', () => {
  assert.deepEqual(paginaValida(200, PAGINA), { ok: true });
});

test('tela de proteção da Vercel e status diferente de 200 são reprovados', () => {
  assert.equal(paginaValida(307, PAGINA).ok, false);
  assert.match(paginaValida(200, '<html>vercel.com/sso ' + 'x'.repeat(2100) + '<h1>a</h1></html>').motivo, /proteção/);
});

test('página sem título (h1) é reprovada mesmo com 200 e HTML longo', () => {
  const semTitulo = '<html><body>' + 'x'.repeat(2100) + '</body></html>';
  assert.match(paginaValida(200, semTitulo).motivo, /h1/);
});

test('recursos: CSS, JS e imagens do app antigo são extraídos sem duplicar', () => {
  const html = '<link href="/_next/static/a.css"><script src="/_next/static/b.js"></script><script src="/_next/static/b.js"></script><img src="/img/x.png">';
  const r = recursosDoHtml(html);
  assert.deepEqual(r.css, ['/_next/static/a.css']);
  assert.deepEqual(r.js, ['/_next/static/b.js']);
  assert.deepEqual(r.imagens, ['/img/x.png']);
});

test('caminhos: 24 textos fora do domínio principal, separados em artigo e blog', () => {
  const caminhos = caminhosDoDominio();
  assert.equal(caminhos.length, 24);
  assert.equal(caminhos.filter((c) => c.tipo === 'artigo').length, 12);
  assert.equal(caminhos.filter((c) => c.tipo === 'blog').length, 12);
});
