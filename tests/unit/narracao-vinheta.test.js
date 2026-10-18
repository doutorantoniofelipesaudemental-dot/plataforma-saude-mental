// Narração "ok" sem a vinheta de crédito (áudio gerado antes da vinheta) não pode ficar de fora do lote noturno (18/10/2026: eram 16 textos).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao, precisaVinheta, textoParaNarracao, hashNarracao, vozDaNarracao } = require('../../backend/lib/narracao');
const { VINHETA_VERSAO } = require('../../backend/lib/vinheta');

const ler = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
const base = { slug: 'teste', titulo: 'Título de teste', resumo: 'Resumo.', conteudo: '<p>Um texto curto para narrar.</p>' };
const comAudio = (extra) => {
  const a = { ...base, ...extra };
  a.narracao = { url: 'https://x/a.mp3', hash: hashNarracao(textoParaNarracao(a), vozDaNarracao(a)), ...(extra && extra.narracao) };
  return a;
};

test('precisaVinheta: "ok" com vinheta atual = não; "ok" sem vinheta (versão 0 ou ausente) = sim', () => {
  assert.equal(estadoNarracao(comAudio({ narracao: { vinhetaVersao: VINHETA_VERSAO } })).estado, 'ok');
  assert.equal(precisaVinheta(comAudio({ narracao: { vinhetaVersao: VINHETA_VERSAO } })), false);
  assert.equal(precisaVinheta(comAudio({ narracao: { vinhetaVersao: 0 } })), true);
  assert.equal(precisaVinheta(comAudio({})), true);
});

test('precisaVinheta: só vale para estado "ok" (desatualizada e ausente seguem pelo caminho normal)', () => {
  assert.equal(precisaVinheta({ ...base }), false);
  const velha = comAudio({ narracao: { vinhetaVersao: 0, hash: 'hash-antigo' } });
  assert.equal(estadoNarracao(velha).estado, 'desatualizada');
  assert.equal(precisaVinheta(velha), false);
});

test('o lote noturno, o envio e o --pendentes usam precisaVinheta; o pré-gerado exige o marcador .vinheta', () => {
  assert.match(ler('backend/scripts/proximoLoteNarracao.js'), /precisaVinheta\(d\)/);
  assert.match(ler('backend/scripts/proximoLoteNarracao.js'), /comVinhetaLocal\(d\)/);
  assert.match(ler('backend/scripts/enviarNarracoesPublicadas.js'), /precisaVinheta\(d\)/);
  assert.match(ler('backend/tools/narrar-artigos.js'), /precisaVinheta\(x\.a\)/);
});
