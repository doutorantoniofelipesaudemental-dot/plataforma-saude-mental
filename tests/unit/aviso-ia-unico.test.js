// Redação única do aviso de IA (ordem de 20/11/2026): peças novas usam AVISO_IA_UNICO;
// as checagens aceitam também a redação antiga (AVISO_CFM), que o estoque já checado usa.
const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../../backend/lib/conformidadeCfm');

const UNICO = 'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';

test('redação única é exatamente a da ordem', () => {
  assert.equal(c.AVISO_IA_UNICO, UNICO);
});

test('temAvisoIA aceita a redação única e a antiga, e recusa ausência', () => {
  assert.equal(c.temAvisoIA(`texto\n\n${UNICO}`), true);
  assert.equal(c.temAvisoIA(`texto\n\n${c.AVISO_CFM}`), true);
  assert.equal(c.temAvisoIA('texto sem aviso'), false);
});

test('garantirConformidade acrescenta só a redação única quando falta o aviso', () => {
  const out = c.garantirConformidade('Corpo do texto.\n\n#saudemental');
  assert.ok(out.includes(UNICO));
  assert.ok(!out.includes(c.AVISO_CFM));
  assert.equal(out.split(UNICO).length - 1, 1);
});

test('garantirConformidade não duplica quando já existe a redação antiga', () => {
  const out = c.garantirConformidade(`Corpo.\n\n${c.AVISO_CFM}\n\n#saudemental`);
  assert.equal(out.split('2.454/2026').length - 1, 1);
  assert.ok(!out.includes(UNICO));
});

test('faltasConformidade aceita as duas redações', () => {
  const t = `${c.IDENTIFICACAO}\n${UNICO}`;
  assert.ok(!c.faltasConformidade(t).some((f) => f.includes('aviso')));
  assert.ok(c.faltasConformidade('sem nada').some((f) => f.includes('aviso')));
});
