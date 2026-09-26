// Vídeos do bot de mídias (backend/lib/videoRedes.js, youtube.js,
// carrosselAprovado.lerMetadadosVideo) e a descrição do YouTube do
// publicador — sem rede e sem ffprobe: o JSON do ffprobe é montado à mão.
const { test } = require('node:test');
const assert = require('node:assert');
const { interpretarFfprobe, validarVideo } = require('../../backend/lib/videoRedes');
const { validarMetadados } = require('../../backend/lib/youtube');
const { lerMetadadosVideo } = require('../../backend/lib/carrosselAprovado');
const { montarDescricaoYoutube, checarTextoVideo } = require('../../scripts/bot-publicar');
const { blocoMetadados, AVISO_CFM, IDENTIFICACAO_COMPLETA } = require('../../scripts/bot-gemini');

const ffprobe = (largura, altura, duracao, { rotate, audio = 'aac', video = 'h264' } = {}) => ({
  format: { duration: String(duracao) },
  streams: [
    { codec_type: 'video', codec_name: video, width: largura, height: altura, tags: rotate ? { rotate: String(rotate) } : {} },
    ...(audio ? [{ codec_type: 'audio', codec_name: audio }] : []),
  ],
});

test('vídeo de celular gravado "de pé" (rotação 90°) conta como vertical', () => {
  const info = interpretarFfprobe(ffprobe(1920, 1080, 30, { rotate: 90 }), 10e6);
  assert.deepEqual([info.largura, info.altura], [1080, 1920]);
  assert.deepEqual(validarVideo(info, 'reel'), []);
});

test('regras por tipo: proporção, duração, codec e áudio', () => {
  const vertical = interpretarFfprobe(ffprobe(1080, 1920, 240), 50e6);
  assert.match(validarVideo(vertical, 'short').join('\n'), /duração 240 s fora de 1 s a 180 s/);
  assert.match(validarVideo(vertical, 'longo').join('\n'), /não é 16:9/);
  const semAudio = interpretarFfprobe(ffprobe(1920, 1080, 600, { audio: null, video: 'vp9' }), 200e6);
  const falhas = validarVideo(semAudio, 'longo').join('\n');
  assert.match(falhas, /vp9 \(use H\.264\)/);
  assert.match(falhas, /sem áudio/);
  assert.deepEqual(validarVideo(interpretarFfprobe(ffprobe(1920, 1080, 600), 200e6), 'longo'), []);
});

test('metadados do .md aprovado e descrição final do YouTube', () => {
  const md = [
    '## YouTube — vídeo longo (16:9)',
    '',
    blocoMetadados('longo', { titulo: 'Burnout na APS: sinais e cuidado', tags: ['burnout', 'aps', 'saúde mental'], descricao: 'Burnout na APS tem sinais claros.' }),
    '',
    '### Capítulos',
    '',
    '- 0:00 Abertura',
    '- 1:30 Sinais',
    '- 6:00 Cuidado',
    '',
  ].join('\n');
  const meta = lerMetadadosVideo(md, 'longo');
  assert.equal(meta.titulo, 'Burnout na APS: sinais e cuidado');
  assert.deepEqual(meta.tags, ['burnout', 'aps', 'saúde mental']);
  assert.equal(meta.capitulos.length, 3);

  const longo = montarDescricaoYoutube({ metadados: meta, slug: 'burnout-aps', sensivel: true, short: false });
  assert.ok(longo.startsWith('Burnout na APS tem sinais claros.'));
  assert.match(longo, /Artigo completo: https:\/\/drsaudemental\.vercel\.app\/artigo\/burnout-aps/);
  assert.match(longo, /Capítulos:\n0:00 Abertura\n1:30 Sinais\n6:00 Cuidado/);
  assert.match(longo, /CVV 188/);
  assert.ok(longo.includes(IDENTIFICACAO_COMPLETA) && longo.includes(AVISO_CFM));
  assert.ok(!/#Shorts/.test(longo));

  const short = montarDescricaoYoutube({ metadados: { ...meta, capitulos: [] }, slug: 'x', sensivel: false, short: true });
  assert.match(short, /#Shorts$/);
  assert.ok(!/CVV 188/.test(short), 'CVV só em tema sensível');
  assert.deepEqual(validarMetadados({ titulo: meta.titulo, descricao: longo, tags: meta.tags }), []);
});

test('metadados reprovados: limites do YouTube, CFM e hashtag de marca', () => {
  assert.match(validarMetadados({ titulo: 'x'.repeat(101), descricao: 'a <b>', tags: ['x'.repeat(501)] }).join('\n'), /mais de 100[\s\S]*"<"[\s\S]*500 caracteres/);
  assert.match(checarTextoVideo('Tratamento que garante a cura. #DrAntonio').join('\n'), /promessa de cura[\s\S]*hashtag de marca/);
});

test('vídeo do carrossel: faixas na cor do slide e texto falado sem separadores', () => {
  const { textoFalado, filtroSlide } = require('../../scripts/bot-video-carrossel');
  assert.match(filtroSlide(0, 10), /pad=1080:1920.*color=0x0d3330/, 'capa escura');
  assert.match(filtroSlide(4, 10), /color=0xfaf7f2/, 'miolo claro');
  assert.match(filtroSlide(9, 10), /color=0x0d3330/, 'último escuro');
  assert.equal(textoFalado('Apoio agora: CVV 188 · SAMU 192'), 'Apoio agora: CVV 188, SAMU 192');
});

test('síntese do Azure: texto escapado no SSML', () => {
  const { escaparXml } = require('../../backend/lib/azureTts');
  assert.equal(escaparXml('Sono & ansiedade <alerta>'), 'Sono &amp; ansiedade &lt;alerta&gt;');
});
