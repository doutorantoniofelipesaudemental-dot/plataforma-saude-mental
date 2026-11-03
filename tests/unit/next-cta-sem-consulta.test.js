const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Ordem de 02/11/2026: o app Next não oferece consulta individual. Os CTAs vão para mentoria/blog.
const RAIZ = path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental', 'app');
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

test('Header e LandingContent não têm mais "Agendar consulta"', () => {
  for (const arq of ['Header.jsx', 'LandingContent.jsx', 'blog/[slug]/page.js']) {
    assert.ok(!ler(arq).includes('Agendar consulta'), arq);
  }
});

test('Header aponta o CTA para /mentoria com o rótulo de mentoria', () => {
  const h = ler('Header.jsx');
  assert.equal(h.split('Mentoria, consultoria e formação').length - 1, 2);
  assert.equal(h.split('href="/mentoria"').length - 1, 2);
});

test('botão do artigo aponta para /blog com "Ler mais artigos"', () => {
  const b = ler('blog/[slug]/page.js');
  assert.ok(b.includes('Ler mais artigos'));
  assert.ok(b.includes('href="/blog"'));
});
