const test = require('node:test');
const assert = require('node:assert/strict');
const r = require('../../backend/lib/redesV2/reel');

test('container de Reel usa REELS, vídeo https e legenda', () => {
  const c = r.montarContainerReel({ videoUrl: 'https://cdn.exemplo/x.mp4', legenda: 'Texto' });
  assert.equal(c.media_type, 'REELS');
  assert.equal(c.caption, 'Texto');
  assert.equal(c.share_to_feed, true);
});

test('recusa vídeo sem https e legenda vazia', () => {
  assert.throws(() => r.montarContainerReel({ videoUrl: 'http://x/y.mp4', legenda: 'a' }), /https/);
  assert.throws(() => r.montarContainerReel({ videoUrl: 'https://x/y.mp4', legenda: '  ' }), /legenda/);
});

test('só FINISHED autoriza publicar; IN_PROGRESS aguarda; ERROR, EXPIRED e desconhecido param', () => {
  assert.deepEqual(r.interpretarStatusContainer('FINISHED'), { pronto: true, acao: 'publicar' });
  assert.equal(r.interpretarStatusContainer('IN_PROGRESS').acao, 'aguardar');
  assert.equal(r.interpretarStatusContainer('ERROR').acao, 'parar');
  assert.equal(r.interpretarStatusContainer('EXPIRED').acao, 'parar');
  assert.equal(r.interpretarStatusContainer('QUALQUER').pronto, false);
});

test('trava de duplicidade bloqueia post que já tem ID da Meta', () => {
  assert.equal(r.podePublicarPost({ 'p1': { metaId: '1' } }, 'p1').pode, false);
  assert.equal(r.podePublicarPost({}, 'p1').pode, true);
});

test('limite: falha fechada sem dado; bloqueia no teto; libera abaixo', () => {
  assert.equal(r.dentroDoLimite(undefined).ok, false);
  assert.equal(r.dentroDoLimite({ quota_usage: 100, config: { quota_total: 100 } }).ok, false);
  assert.deepEqual(r.dentroDoLimite({ quota_usage: 3, config: { quota_total: 100 } }), { ok: true, restantes: 97 });
});

test('calendário alterna carrossel e Reel', () => {
  assert.equal(r.proximoTipoAlternado('carrossel'), 'reel');
  assert.equal(r.proximoTipoAlternado('reel'), 'carrossel');
});
