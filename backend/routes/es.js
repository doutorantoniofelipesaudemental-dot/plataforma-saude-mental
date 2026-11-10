/**
 * Rota do piloto ES (ordem 09/11/2026, 23:35, item 5). GET /es/:slug.
 * Desligada por padrão (ES_PILOTO_ATIVO). Mesmo quando ligada: noindex, canonical próprio, hreflang es-419 ↔ pt-BR.
 */
const express = require('express');
const { CRISE_ES, IDENTIFICACAO_ES, pilotoAtivo, carregar } = require('../lib/es/piloto');

const router = express.Router();
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BASE = 'https://www.drantoniofelipemedico.com.br';

function paginaEs(a) {
  return `<!doctype html>
<html lang="es-419"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(a.titulo)} · Portal de Salud Mental Doutor Antônio Felipe Garabito</title>
<meta name="description" content="${esc(a.resumo)}">
<link rel="canonical" href="${BASE}/es/${a.slug}">
<link rel="alternate" hreflang="es-419" href="${BASE}/es/${a.slug}">
<link rel="alternate" hreflang="pt-BR" href="${BASE}/artigo/${a.slug}">
</head><body><main><article lang="es-419">
<h1>${esc(a.titulo)}</h1>
${a.corpo}
<p class="crise">${esc(CRISE_ES)}</p>
<p class="identificacao">${IDENTIFICACAO_ES.map(esc).join('<br>')}</p>
</article></main></body></html>`;
}

router.get('/:slug', (req, res) => {
  if (!pilotoAtivo()) return res.status(404).type('html').send('<!doctype html><title>404</title><p>Não encontrado.</p>');
  const a = carregar(req.params.slug);
  if (!a) return res.status(404).type('html').send('<!doctype html><title>404</title><p>Não encontrado.</p>');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  return res.type('html').send(paginaEs(a));
});

module.exports = router;

module.exports.paginaEs = paginaEs;
