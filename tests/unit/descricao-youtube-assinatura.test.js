const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../scripts/youtube/lib');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');

const ATUACAO_NOVA = 'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)';
const ATUACAO_ANTIGA = 'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde';

test('bloco de vídeo do YouTube usa a atuação em PAP/APS e mantém as 5 linhas', () => {
  assert.ok(L.IDENTIFICACAO_VIDEO.includes(ATUACAO_NOVA));
  assert.ok(!L.IDENTIFICACAO_VIDEO.includes(ATUACAO_ANTIGA));
  assert.equal(L.IDENTIFICACAO_VIDEO.split('\n').length, IDENTIFICACAO_COMPLETA.split('\n').length);
});

test('a troca muda só a linha de atuação (CRM, RQE, NÃO ESPECIALISTA e TCC preservados)', () => {
  assert.equal(L.IDENTIFICACAO_VIDEO, IDENTIFICACAO_COMPLETA.replace(ATUACAO_ANTIGA, ATUACAO_NOVA));
  assert.equal((L.IDENTIFICACAO_VIDEO.match(/CRM-BA 41322/g) || []).length, 1);
  assert.equal((L.IDENTIFICACAO_VIDEO.match(/RQE 26638/g) || []).length, 1);
  assert.equal((L.IDENTIFICACAO_VIDEO.match(/NÃO ESPECIALISTA/g) || []).length, 1);
  assert.match(L.IDENTIFICACAO_VIDEO, /Terapia Cognitivo-Comportamental/);
});

test('a descrição longa e a curta trazem o bloco novo e passam na checagem de texto', () => {
  const a = { titulo: 'Tema', slug: 'tema', resumo: 'Resumo.', refs: [] };
  for (const descricao of [L.descricaoLongo(a, '10:00'), L.descricaoShort(a)]) {
    assert.ok(descricao.includes(ATUACAO_NOVA), 'traz a atuação nova');
    assert.ok(!descricao.includes(ATUACAO_ANTIGA), 'não traz a atuação antiga');
    const falhas = L.checarTexto({ titulo: 'Tema', descricao, tags: [] });
    assert.deepEqual(falhas.filter((f) => /CRM|RQE|NÃO ESPECIALISTA|Medicina/.test(f)), []);
  }
});
