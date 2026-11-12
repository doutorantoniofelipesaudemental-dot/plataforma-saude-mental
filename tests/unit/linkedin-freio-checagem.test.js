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

test('D1: "dólar" não é proibido; valor monetário exige US$ com número e autor com ano', () => {
  const t = (valor) => `Chisholm et al., 2016, estimou ${valor}. Referência: X 2016.`;
  const falhasDolar = (texto) => checarPost({ tipo: 'social', texto }).filter((f) => /dólar|US\$|autor e ano/.test(f));
  assert.equal(falhasDolar(t('US$ 3,3 a 5,7 de retorno')).length, 0);
  assert.equal(falhasDolar(t('cerca de quatro dólares')).length > 0, true);
  assert.equal(falhasDolar('Estudo de 2016 estimou US$ 4 de retorno. Referência: X 2016.').some((f) => /autor e ano/.test(f)), true, 'sem autor, reprova');
});

test('D2: NR-1 exige "passou a vigorar em 26 de maio de 2026" e não aceita "fiscalização"', () => {
  const t = (frase) => `${frase} Referência: X 2026.`;
  assert.equal(checarPost({ tipo: 'social', texto: t('A NR-1 passou a vigorar em 26 de maio de 2026.') }).some((f) => /NR-1/.test(f)), false);
  assert.equal(checarPost({ tipo: 'social', texto: t('A NR-1 entrou em fiscalização.') }).some((f) => /NR-1/.test(f)), true);
});

test('D3: isolamento e morte exige a frase Holt-Lunstad (26% a 32%, conforme o tipo)', () => {
  const frase = 'aumento de 26% a 32% na probabilidade de morte, conforme o tipo: solidão, isolamento social ou morar sozinho';
  assert.equal(checarPost({ tipo: 'social', texto: `Isolamento social se associa a ${frase}. Referência: X 2015.` }).some((f) => /D3/.test(f)), false);
  assert.equal(checarPost({ tipo: 'social', texto: 'Isolamento social aumenta o risco de morte em 50%. Referência: X 2015.' }).some((f) => /D3/.test(f)), true);
});

test('selo da capa usa o nome do tema, não a categoria antiga', () => {
  assert.equal(textoDoSelo({ categoria: 'Médicos & Enfermeiros', titulo: 'x', tema: 'transtornos-mentais' }), 'Transtornos Mentais');
  assert.equal(textoDoSelo({ categoria: 'Residentes & Estudantes', titulo: 'x' }).includes('Residentes'), false);
});
