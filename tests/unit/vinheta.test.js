// Vinheta de crédito da marca (backend/lib/vinheta.js): textos, tema sensível e regra de legenda/arte, sem rede nem TTS.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { TEXTOS, MARCA, temaSensivel, VINHETA_VERSAO } = require('../../backend/lib/vinheta');
const { LINHA_CREDITO, montarLegenda } = require('../../backend/lib/redesV2/conteudo');
const { hashNarracao, textoParaNarracao } = require('../../backend/lib/narracao');

test('textos citam a marca completa, com acento', () => {
  assert.equal(MARCA, 'Portal de Saúde Mental Doutor Antônio Felipe Garabito');
  for (const k of ['abertura', 'encerramento', 'encerramentoSensivel', 'curta']) assert.ok(TEXTOS[k].includes(MARCA), k);
  assert.match(TEXTOS.encerramentoSensivel, /188.*CVV.*192.*SAMU/);
  assert.doesNotMatch(TEXTOS.encerramento, /188/);
});

test('tema sensível segue suicídio, autolesão, violência e crise', () => {
  assert.ok(temaSensivel({ titulo: 'Risco de suicídio na APS', conteudo: '' }));
  assert.ok(temaSensivel({ titulo: 'x', conteudo: '<p>violência doméstica</p>' }));
  assert.ok(!temaSensivel({ titulo: 'Sono e rotina', resumo: 'Higiene do sono', conteudo: '<p>dormir bem</p>' }));
});

test('a vinheta não muda o hash da narração (texto do artigo intacto)', () => {
  const a = { titulo: 'T', conteudo: '<p>Texto.</p>' };
  assert.equal(hashNarracao(textoParaNarracao(a)), hashNarracao(textoParaNarracao({ ...a })));
  assert.doesNotMatch(textoParaNarracao(a), /Garabito/);
  assert.equal(VINHETA_VERSAO, 1);
});

test('legenda do Instagram traz a linha de crédito; o cartão final desenha o crédito', () => {
  const l = montarLegenda({ legendaCorpo: 'Gancho?\n\nResumo.\n\nTexto completo no link da bio.', refs: [], hashtags: ['#a', '#b', '#c'], sensivel: false });
  assert.ok(l.includes(LINHA_CREDITO));
  assert.equal(LINHA_CREDITO, 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito');
  assert.match(fs.readFileSync(path.join(__dirname, '../../backend/lib/redesV2/arte.js'), 'utf8'), /CREDITO, MARGEM, ALTURA - 178/);
});
