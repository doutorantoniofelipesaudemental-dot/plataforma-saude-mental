const test = require('node:test');
const assert = require('node:assert/strict');
const { ASSINATURA, textoAlternativo, renderizarTelas } = require('../../backend/lib/redesV2/arte');
const { checarPost } = require('../../backend/lib/redesV2/checagem');

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

test('a checagem reprova texto alternativo sem a 3ª linha da assinatura, e aceita o completo', async () => {
  const telas = [
    { tipo: 'capa', titulo: 'Tempo de tela', texto: 'O que a ciência mostra, perguntas mais úteis.' },
    { tipo: 'final', titulo: 'Leia o texto completo', texto: 'Link na bio.' },
  ];
  const { imagens } = await renderizarTelas(telas);
  const base = 'Descrição suficientemente longa da tela para passar do limite mínimo de caracteres.';
  const semTerceira = imagens.map(() => `${base} Assinatura: Dr. Antônio Felipe, RQE 26638.`);
  const completo = imagens.map((_, i) => textoAlternativo(telas[i], i, imagens.length));
  const comFalha = await checarPost({ legenda: 'x', telas, imagens, alts: semTerceira, glifosAusentes: [] });
  assert.ok(comFalha.falhas.some((f) => /3ª linha/.test(f.msg)));
  const comOk = await checarPost({ legenda: 'x', telas, imagens, alts: completo, glifosAusentes: [] });
  assert.ok(!comOk.falhas.some((f) => /3ª linha|linhas \(esperado 3\)/.test(f.msg)));
});
