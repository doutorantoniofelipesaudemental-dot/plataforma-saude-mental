// Ordem de 10/11/2026, 07:35 (item 4): toda página /es/ renderizada traz o aviso de crise pelo template. Não edita os textos.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CRISE_ES, SLUGS, carregar } = require('../../backend/lib/es/piloto');
const { paginaEs } = require('../../backend/routes/es');

test('toda página ES renderizada traz o aviso de crise, uma vez, no bloco crise', () => {
  assert.ok(SLUGS.length >= 10, 'piloto com 10 páginas');
  for (const s of SLUGS) {
    const html = paginaEs(carregar(s));
    assert.equal(html.split(CRISE_ES).length - 1, 1, `aviso ausente ou repetido em ${s}`);
    assert.ok(html.includes(`<p class="crise">${CRISE_ES}</p>`), `aviso fora do bloco crise em ${s}`);
  }
});

test('o aviso de crise em espanhol cita o CVV e o SAMU do Brasil', () => {
  assert.match(CRISE_ES, /CVV 188/);
  assert.match(CRISE_ES, /SAMU 192/);
});
