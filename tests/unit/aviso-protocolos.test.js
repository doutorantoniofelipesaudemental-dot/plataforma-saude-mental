// Aviso de protocolos locais no template dos textos clínicos: regra única (backend, navegador e app Next), sem duplicar, fora do texto narrado.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { AVISO_PROTOCOLOS, precisaAviso, CATEGORIAS_PROFISSIONAIS } = require('../../backend/lib/avisoProtocolos');
const { hashNarracao } = require('../../backend/lib/narracao');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');

test('texto clínico recebe o aviso; relato, texto leigo e texto que já traz o aviso não', () => {
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Médicos & Enfermeiros', texto: 'Texto' }), true);
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Geral', texto: '<h2>Manejo Clínico</h2>' }), true);
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Geral', texto: 'Dose de 50 mg ao dia' }), true);
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Pacientes & Famílias', texto: 'Converse com quem você confia.' }), false);
  assert.equal(precisaAviso({ slug: 'relato-x', categoria: 'Médicos & Enfermeiros', texto: 'Dose de 50 mg' }), false);
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Relatos da Prática', texto: 'Manejo Clínico' }), false);
  assert.equal(precisaAviso({ slug: 'x', categoria: 'Médicos & Enfermeiros', texto: `Fim. ${AVISO_PROTOCOLOS}` }), false);
});

test('o app Next e o navegador usam a mesma frase e as mesmas categorias', () => {
  const next = ler('apps/plataforma-saude-mental/app/avisoProtocolos.js');
  assert.ok(next.includes(AVISO_PROTOCOLOS));
  for (const c of CATEGORIAS_PROFISSIONAIS) { assert.ok(next.includes(`'${c}'`), c); assert.ok(ler('public/assets/js/artigo.js').includes(`'${c}'`), c); }
  assert.ok(ler('public/assets/js/artigo.js').includes(AVISO_PROTOCOLOS));
  assert.match(ler('apps/plataforma-saude-mental/app/artigos/[slug]/page.js'), /data-aviso-protocolos/);
});

test('renderização no servidor: aviso uma vez nos clínicos, nenhum nos relatos; o hash da narração não muda', () => {
  const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');
  const base = { slug: 'delirium-x', titulo: 'T', resumo: 'R', conteudo: '<p>Texto clínico.</p>', categoria: 'Residentes & Estudantes', autor: 'Dr. Antônio Felipe', publicadoEm: new Date('2026-10-01'), tempoLeitura: 3 };
  const conta = (h) => h.split('data-aviso-protocolos').length - 1;
  assert.equal(conta(renderizarArtigoHtml(base)), 1);
  assert.equal(conta(renderizarArtigoHtml({ ...base, slug: 'relato-x', categoria: 'Relatos da Prática' })), 0);
  assert.equal(conta(renderizarArtigoHtml({ ...base, conteudo: `<p>${AVISO_PROTOCOLOS}</p>` })), 0);
  assert.equal(hashNarracao(base), hashNarracao({ ...base }));
});
