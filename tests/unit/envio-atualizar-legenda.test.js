const test = require('node:test');
const assert = require('node:assert/strict');
const { motivoRecusa, motivoAtualizacaoLegenda } = require('../../backend/lib/redesV2/envioSeguro');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/identificacaoCfm');
const { AVISO_IA_UNICO } = require('../../backend/lib/conformidadeCfm');

const LEGENDA_OK = `Corpo.\n\nEm crise: CVV 188 · SAMU 192\n\n${AVISO_IA_UNICO}\n\n${IDENTIFICACAO_COMPLETA}`;
const AGORA = new Date('2026-11-20T12:00:00Z');
const pasta = (extra = {}) => ({
  slug: '2027-02-01-relato-nao-saber-tudo',
  legenda: LEGENDA_OK,
  erroImagem: null,
  hashes: ['h1', 'h2'],
  meta: { status: 'aprovado-checagem', dataSugerida: '2027-02-01T08:00:00-03:00', checagem: { ok: true, hashes: ['h1', 'h2'] } },
  ...extra,
});
const banco = (extra = {}) => ({ status: 'aprovado-checagem', dataSugerida: '2027-02-01T11:00:00.000Z', hashes: ['h1', 'h2'], ...extra });

test('checagem parcial é recusada pelo envio', () => {
  const p = pasta({ meta: { status: 'aprovado-checagem', dataSugerida: '2027-02-01T08:00:00-03:00', checagem: { ok: true, hashes: ['h1', 'h2'], parcial: true } } });
  assert.match(motivoRecusa(p, AGORA), /checagem parcial/);
  assert.equal(motivoRecusa(pasta(), AGORA), null);
});

test('atualização de legenda: aceita só item não publicado, com imagens iguais', () => {
  assert.equal(motivoAtualizacaoLegenda({ banco: banco(), pasta: pasta(), agora: AGORA }), null);
});

test('atualização de legenda: recusa cada caso', () => {
  assert.match(motivoAtualizacaoLegenda({ banco: null, pasta: pasta(), agora: AGORA }), /ausente/);
  assert.match(motivoAtualizacaoLegenda({ banco: banco({ status: 'publicado' }), pasta: pasta(), agora: AGORA }), /status publicado/);
  assert.match(motivoAtualizacaoLegenda({ banco: banco({ publicadoEm: new Date() }), pasta: pasta(), agora: AGORA }), /publicada|agendada/);
  assert.match(motivoAtualizacaoLegenda({ banco: banco({ dataSugerida: '2026-11-01T11:00:00.000Z' }), pasta: pasta(), agora: AGORA }), /data passada/);
  assert.match(motivoAtualizacaoLegenda({ banco: banco({ hashes: ['h1', 'X'] }), pasta: pasta(), agora: AGORA }), /imagens diferentes/);
  const parcial = pasta({ meta: { status: 'aprovado-checagem', dataSugerida: '2027-02-01T08:00:00-03:00', checagem: { ok: true, hashes: ['h1', 'h2'], parcial: true } } });
  assert.match(motivoAtualizacaoLegenda({ banco: banco(), pasta: parcial, agora: AGORA }), /checagem parcial/);
});
