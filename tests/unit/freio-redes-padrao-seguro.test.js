/** Freio das redes em padrão seguro (06/11/2026): só "true" publica. Ausente, vazio ou qualquer outro valor = não publica. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { redesAtivas, exigirRedesAtivas } = require('../../backend/lib/freioRedes');
const { youtubeAtivo } = require('../../backend/lib/freioYoutube');

test('ausente e vazia = NÃO publica', () => {
  assert.equal(redesAtivas({}), false);
  assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: '' }), false);
  assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: '   ' }), false);
});

test('"false", "0", "off", "nao" e valores desconhecidos = NÃO publica', () => {
  for (const v of ['false', '0', 'off', 'nao', 'sim', 'yes', '1']) assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: v }), false, v);
});

test('"true" e "TRUE" (com espaços) = publica', () => {
  assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: 'true' }), true);
  assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: 'TRUE' }), true);
  assert.equal(redesAtivas({ REDES_PUBLICACAO_ATIVA: ' True ' }), true);
});

test('exigirRedesAtivas lança com código REDES_PAUSADAS quando desligado', () => {
  const antes = process.env.REDES_PUBLICACAO_ATIVA;
  try {
    delete process.env.REDES_PUBLICACAO_ATIVA;
    assert.throws(() => exigirRedesAtivas('teste'), (e) => e.codigo === 'REDES_PAUSADAS');
    process.env.REDES_PUBLICACAO_ATIVA = 'true';
    assert.doesNotThrow(() => exigirRedesAtivas('teste'));
  } finally {
    if (antes === undefined) delete process.env.REDES_PUBLICACAO_ATIVA; else process.env.REDES_PUBLICACAO_ATIVA = antes;
  }
});

test('YouTube continua exigindo as duas travas (YOUTUBE=true e REDES=true)', () => {
  assert.equal(youtubeAtivo({ YOUTUBE_PUBLICACAO_ATIVA: 'true' }), false);
  assert.equal(youtubeAtivo({ YOUTUBE_PUBLICACAO_ATIVA: 'true', REDES_PUBLICACAO_ATIVA: 'true' }), true);
});
