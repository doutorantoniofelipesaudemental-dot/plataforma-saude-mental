// Freio próprio do LinkedIn (LINKEDIN_PUBLICACAO_ATIVA), regra de 5 linhas, regra do dólar e selo pelos 7 temas (ordem de 11/11/2026).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { linkedinAtivo } = require('../../backend/lib/freioRedes');
const { checarPost } = require('../../backend/lib/linkedinChecagem');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/identificacaoCfm');
const { textoDoSelo } = require('../../backend/lib/capaRedes');

test('freio LinkedIn: só "true" libera; ausente ou outro valor bloqueia', () => {
  assert.equal(linkedinAtivo({ LINKEDIN_PUBLICACAO_ATIVA: 'true' }), true);
  assert.equal(linkedinAtivo({ LINKEDIN_PUBLICACAO_ATIVA: ' TRUE ' }), true);
  assert.equal(linkedinAtivo({ LINKEDIN_PUBLICACAO_ATIVA: 'false' }), false);
  assert.equal(linkedinAtivo({ LINKEDIN_PUBLICACAO_ATIVA: '1' }), false);
  assert.equal(linkedinAtivo({}), false);
});

test('identificação de 5 linhas é obrigatória (3 linhas reprovam)', () => {
  const base = 'Texto. Referência: X 2020. CVV 188 · SAMU 192. protocolos hospitalares. 2.454/2026. Portal de Saúde Mental Doutor Antônio Felipe Garabito.';
  const curta = 'Dr. Antônio Felipe — Médico — CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade — RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)\n';
  assert.equal(checarPost({ tipo: 'social', texto: base + '\n' + curta }).some((f) => /5 linhas/.test(f)), true);
  assert.equal(checarPost({ tipo: 'social', texto: base + '\n' + IDENTIFICACAO_COMPLETA }).some((f) => /5 linhas/.test(f)), false);
});

test('valor monetário em "dólar" por extenso reprova; US$ com ano passa', () => {
  const t = (valor) => `Estudo de 2016 estimou ${valor}. Referência: X 2016.`;
  assert.equal(checarPost({ tipo: 'social', texto: t('cerca de quatro dólares') }).some((f) => /dólar/.test(f)), true);
  assert.equal(checarPost({ tipo: 'social', texto: t('cerca de US$ 4') }).some((f) => /dólar/.test(f)), false);
});

test('selo da capa usa o nome do tema, não a categoria antiga', () => {
  assert.equal(textoDoSelo({ categoria: 'Médicos & Enfermeiros', titulo: 'x', tema: 'transtornos-mentais' }), 'Transtornos Mentais');
  assert.equal(textoDoSelo({ categoria: 'Residentes & Estudantes', titulo: 'x' }).includes('Residentes'), false);
});
