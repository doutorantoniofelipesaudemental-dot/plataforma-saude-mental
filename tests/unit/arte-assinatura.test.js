const test = require('node:test');
const assert = require('node:assert/strict');
const { ASSINATURA, textoAlternativo } = require('../../backend/lib/redesV2/arte');

// Regressão (25/10/2026): o post de 26/10 saiu com a assinatura de 2 linhas; a checagem não conferia a arte.
test('a arte traz a assinatura de 3 linhas, na ordem do padrão de mídias sociais (CLAUDE.md §1.B)', () => {
  assert.equal(ASSINATURA.length, 3);
  assert.equal(ASSINATURA[0], 'Dr. Antônio Felipe · Médico · CRM-BA 41322');
  assert.equal(ASSINATURA[1], 'RQE 26638 – Medicina de Família e Comunidade');
  assert.equal(ASSINATURA[2], 'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)');
});

test('o texto alternativo descreve a assinatura completa (3 linhas)', () => {
  const alt = textoAlternativo({ tipo: 'final', titulo: 'Leia o texto completo', texto: 'Link na bio.' }, 4, 5);
  assert.match(alt, /CRM-BA 41322, RQE 26638, Medicina de Família e Comunidade/);
  assert.match(alt, /Atuo em Pronto Atendimento Psiquiátrico \(PAP\) e Atenção Primária à Saúde \(APS\)\.$/);
});
