const test = require('node:test');
const assert = require('node:assert/strict');
const { youtubeLigado, youtubeAtivo } = require('../../backend/lib/freioYoutube');

test('freio do YouTube nasce desligado: só "true" liga', () => {
  assert.equal(youtubeLigado({}), false);
  assert.equal(youtubeLigado({ YOUTUBE_PUBLICACAO_ATIVA: '' }), false);
  assert.equal(youtubeLigado({ YOUTUBE_PUBLICACAO_ATIVA: 'sim' }), false);
  assert.equal(youtubeLigado({ YOUTUBE_PUBLICACAO_ATIVA: 'false' }), false);
  assert.equal(youtubeLigado({ YOUTUBE_PUBLICACAO_ATIVA: ' TRUE ' }), true);
});

test('freio geral das redes também bloqueia o YouTube', () => {
  assert.equal(youtubeAtivo({ YOUTUBE_PUBLICACAO_ATIVA: 'true' }), true);
  assert.equal(youtubeAtivo({ YOUTUBE_PUBLICACAO_ATIVA: 'true', REDES_PUBLICACAO_ATIVA: 'false' }), false);
});

test('a conferência do vídeo longo exige a assinatura falada curta (texto aprovado) e não a de 5 linhas', () => {
  const { TEXTOS } = require('../../backend/lib/vinheta');
  assert.equal(TEXTOS.assinaturaFalada, 'Doutor Antônio Felipe, médico, CRM Bahia 41322, especialista em Medicina de Família e Comunidade, RQE 26638.');
  assert.doesNotMatch(TEXTOS.assinaturaFalada, /p[óo]s-gradua|n[ãa]o especialista/i);
});
