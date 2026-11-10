// Piloto ES (ordem 09/11/2026, 23:35, item 5): desligado por padrão, noindex, hreflang, aviso de crise, sem oferta individual.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CRISE_ES, IDENTIFICACAO_ES, SLUGS, pilotoAtivo, carregar } = require('../../backend/lib/es/piloto');

test('piloto ES vem desligado por padrão (nada no ar)', () => {
  const antes = process.env.ES_PILOTO_ATIVO;
  delete process.env.ES_PILOTO_ATIVO;
  assert.equal(pilotoAtivo(), false);
  if (antes !== undefined) process.env.ES_PILOTO_ATIVO = antes;
});

test('os 10 artigos do piloto existem e têm título, resumo e corpo', () => {
  assert.equal(SLUGS.length, 10);
  for (const s of SLUGS) {
    const a = carregar(s);
    assert.ok(a, s);
    assert.ok(a.titulo.length > 10, `título de ${s}`);
    assert.ok(a.resumo.length > 20, `resumo de ${s}`);
    assert.ok(a.corpo.length > 500, `corpo de ${s}`);
    assert.ok(!/<!--/.test(a.corpo), `comentário vazado em ${s}`);
  }
});

test('nenhum texto do piloto oferece consulta, agendamento ou mensageria', () => {
  const RE = /tipo=particular|agendar uma avalia|agende uma|consulta particular|atendimento individual|mentoria individual|wa\.me|whatsapp/i;
  for (const s of SLUGS) {
    assert.ok(!RE.test(carregar(s).corpo), `oferta em ${s}`);
  }
});

test('aviso de crise e identificação ES estão isolados em constantes (pendentes)', () => {
  assert.match(CRISE_ES, /CVV 188 · SAMU 192/);
  assert.equal(IDENTIFICACAO_ES.length, 5);
  assert.equal(IDENTIFICACAO_ES[4], 'NO ESPECIALISTA');
});

test('rota /es/:slug: com a flag desligada devolve 404 e não renderiza', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'routes', 'es.js'), 'utf8');
  assert.match(src, /if \(!pilotoAtivo\(\)\) return res\.status\(404\)/);
  assert.match(src, /noindex, nofollow/);
});
