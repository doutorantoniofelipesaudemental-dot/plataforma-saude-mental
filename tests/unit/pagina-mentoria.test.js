// Página /mentoria: identificação única, contato só por e-mail, sem mensageria de terceiros, CVV/SAMU visíveis, nas rotas e no sitemap.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { gerarSitemapPaginasXml } = require('../../backend/lib/sitemap');

const RAIZ = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(RAIZ, 'public', 'mentoria.html'), 'utf8');
const conta = (t, s) => t.split(s).length - 1;

test('identificação de 5 linhas aparece uma vez (rodapé), com RQE junto da especialidade', () => {
  for (const l of IDENTIFICACAO_COMPLETA.split('\n')) assert.equal(conta(html, l), 1, l);
  assert.equal(conta(html, 'CRM-BA 41322'), 1);
  assert.equal(conta(html, 'NÃO ESPECIALISTA'), 1);
});

test('contato só por e-mail; sem mensageria, formulário, chatbot nem "psiquiatra" como título do autor', () => {
  assert.doesNotMatch(html, /wa\.me|whatsapp|<form|<input|<textarea|chatbot/i);
  assert.match(html, /mailto:doutor\.antoniofelipe\.saudemental@gmail\.com/);
  assert.doesNotMatch(html, /Antonio Felipe/);
  assert.doesNotMatch(html, /Dr\. Antônio Felipe[^.\n]{0,80}psiquiatra/);
  assert.match(html, /CVV 188/);
  assert.match(html, /SAMU 192/);
});

test('rota, sitemap e links a partir da home e da /links', () => {
  assert.match(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8'), /"source": "\/mentoria\/"[\s\S]{0,60}"destination": "\/mentoria\.html"/);
  assert.match(gerarSitemapPaginasXml(), /\/mentoria<\/loc>/);
  for (const f of ['index.html', 'links.html']) assert.match(fs.readFileSync(path.join(RAIZ, 'public', f), 'utf8'), /href="\/mentoria"/);
});
