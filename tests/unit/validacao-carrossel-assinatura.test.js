// Regra da legenda no validador de carrossel (diagnóstico da Vercel): identificação completa de 5 linhas (ordem de 08/11/2026).
// Causa do alerta de 14/11: a regra antiga pedia a linha única "Dr. Antônio Felipe · Médico · CRM-BA 41322" (3 linhas).
const { test } = require('node:test');
const assert = require('node:assert');
const { falhasDaLegenda } = require('../../backend/lib/redesV2/validacaoCarrossel');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/identificacaoCfm');

const AVISOS = [
  'Conteúdo educativo produzido com apoio de inteligência artificial (Resolução CFM 2.454/2026).',
  'Em crise: CVV 188 · SAMU 192.',
  'Portal de Saúde Mental Doutor Antônio Felipe Garabito · https://www.drantoniofelipemedico.com.br/',
].join('\n');

test('legenda com a identificação de 5 linhas (padrão de 16/11) não reprova a assinatura', () => {
  const f = falhasDaLegenda(`Texto do post.\n\n${AVISOS}\n\n${IDENTIFICACAO_COMPLETA}\n\n#saudemental`);
  assert.deepStrictEqual(f.filter((x) => /identificação|assinatura/.test(x)), []);
});

test('legenda com a linha antiga "·" e sem as 5 linhas reprova', () => {
  const f = falhasDaLegenda(`Texto.\n\n${AVISOS}\n\nDr. Antônio Felipe · Médico · CRM-BA 41322`);
  assert.ok(f.some((x) => /identificação completa de 5 linhas/.test(x)), JSON.stringify(f));
});

test('legenda sem identificação reprova', () => {
  const f = falhasDaLegenda(`Texto.\n\n${AVISOS}`);
  assert.ok(f.some((x) => /identificação completa de 5 linhas/.test(x)), JSON.stringify(f));
});
