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

test('D2: NR-1 reprova "fiscalização" como início e data de início diferente de 26/05/2026; sem data, não exige a frase', () => {
  const nr1 = (frase) => checarPost({ tipo: 'social', texto: `${frase} Referência: X 2026.` }).filter((f) => /NR-1/.test(f));
  assert.equal(nr1('A NR-1 passou a vigorar em 26 de maio de 2026.').length, 0);
  assert.equal(nr1('A NR-1 trata dos riscos psicossociais no trabalho.').length, 0, 'post sem data não exige a frase');
  assert.equal(nr1('A NR-1 entrou em fiscalização em 2026.').length > 0, true, 'fiscalização como início reprova');
  assert.equal(nr1('A NR-1 passou a vigorar em 1 de julho de 2026.').length > 0, true, 'data diferente reprova');
});

test('D3: isolamento e morte reprovam número fora de 26%–32% ou sem os três tipos; sem número, não exige a frase', () => {
  const d3 = (texto) => checarPost({ tipo: 'social', texto: `${texto} Referência: X 2015.` }).filter((f) => /isolamento|morte/.test(f));
  assert.equal(d3('Isolamento e morte: o risco aumenta. Solidão, isolamento social ou morar sozinho são fatores.').length, 0, 'sem número não exige a frase');
  assert.equal(d3('Solidão, isolamento social ou morar sozinho se associam a aumento de 26% a 32% na probabilidade de morte.').length, 0);
  assert.equal(d3('Isolamento social aumenta em 50% o risco de morte.').length > 0, true, 'número fora da faixa reprova');
  assert.equal(d3('Solidão aumenta em 30% o risco de morte.').length > 0, true, 'número sem os três tipos reprova');
});

test('selo da capa usa o nome do tema, não a categoria antiga', () => {
  assert.equal(textoDoSelo({ categoria: 'Médicos & Enfermeiros', titulo: 'x', tema: 'transtornos-mentais' }), 'Transtornos Mentais');
  assert.equal(textoDoSelo({ categoria: 'Residentes & Estudantes', titulo: 'x' }).includes('Residentes'), false);
});
