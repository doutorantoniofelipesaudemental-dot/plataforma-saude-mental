// Caixa de canais de apoio nos textos de violência: regra única (backend, navegador e app Next), sem duplicar, fora do texto narrado.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { CAIXA_VIOLENCIA_ITENS, precisaCaixaViolencia } = require('../../backend/lib/caixaViolencia');
const { hashNarracao } = require('../../backend/lib/narracao');

const ler = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');

test('tema violência recebe a caixa; outros temas e textos que já trazem os três canais não', () => {
  const viol = '<p>Violência doméstica, violência psicológica e Maria da Penha.</p>';
  assert.equal(precisaCaixaViolencia({ titulo: 'x', texto: viol }), true);
  assert.equal(precisaCaixaViolencia({ titulo: 'Violência no namoro', texto: '<p>Há violência no namoro.</p>' }), true);
  assert.equal(precisaCaixaViolencia({ titulo: 'Sono', texto: '<p>Dormir bem. Uma menção a abuso sexual de passagem.</p>' }), false);
  assert.equal(precisaCaixaViolencia({ titulo: 'x', texto: `${viol} Ligue 180 · 190 · Disque 100` }), false);
});

test('a caixa traz os cinco canais e o app Next e o navegador usam os mesmos', () => {
  assert.equal(CAIXA_VIOLENCIA_ITENS.length, 5);
  for (const c of ['Ligue 180', '190', 'Disque 100', 'CVV 188', 'SAMU 192']) assert.ok(CAIXA_VIOLENCIA_ITENS.some((i) => i.startsWith(c)), c);
  const next = ler('apps/plataforma-saude-mental/app/caixaViolencia.js'), nav = ler('public/assets/js/artigo.js');
  for (const i of CAIXA_VIOLENCIA_ITENS) { assert.ok(next.includes(i), i); assert.ok(nav.includes(i), i); }
  assert.match(ler('apps/plataforma-saude-mental/app/artigos/[slug]/page.js'), /data-caixa-violencia/);
});

test('renderização no servidor: caixa uma vez; o hash da narração não muda', () => {
  const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');
  const base = { slug: 'violencia-x', titulo: 'Violência doméstica', resumo: 'R', conteudo: '<p>Violência doméstica.</p>', categoria: 'Pacientes & Famílias', autor: 'Dr. Antônio Felipe', publicadoEm: new Date('2026-10-01'), tempoLeitura: 3 };
  const conta = (h) => h.split('data-caixa-violencia').length - 1;
  assert.equal(conta(renderizarArtigoHtml(base)), 1);
  assert.equal(conta(renderizarArtigoHtml({ ...base, titulo: 'Sono', conteudo: '<p>Dormir.</p>' })), 0);
  assert.equal(hashNarracao(base), hashNarracao({ ...base }));
});
