// Roteamento por tipo de mídia no Instagram (decisão de 18/10/2026): imagem única pela Meta Graph; carrossel na fila manual até o
// teste supervisionado ser liberado; Reels e Stories SEMPRE na fila manual. Nada de Reel/Story automático.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { tipoDeMidia, rotaDaMidia, TIPOS_AUTOMATICOS } = require('../../backend/lib/redesV2/roteamento');
const { publicar } = require('../../backend/lib/operacional/instagram/postPublisher');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const post = (n, extra = {}) => ({ checagem: { hashes: Array.from({ length: n }, (_, i) => `h${i}`) }, ...extra });

test('tipo de mídia: 1 imagem = imagem única; 2 a 10 = carrossel; Reel e Story pelo tipo; fora disso, inválido', () => {
  assert.equal(tipoDeMidia(post(1)), 'imagem-unica');
  assert.equal(tipoDeMidia(post(2)), 'carrossel');
  assert.equal(tipoDeMidia(post(10)), 'carrossel');
  assert.equal(tipoDeMidia(post(0)), 'invalido');
  assert.equal(tipoDeMidia(post(11)), 'invalido');
  assert.equal(tipoDeMidia(post(5, { tipo: 'reel' })), 'reel');
  assert.equal(tipoDeMidia(post(1, { tipo: 'STORY' })), 'story');
});

test('imagem única vai pela Meta Graph; carrossel vai para a fila manual até ser liberado', () => {
  assert.equal(rotaDaMidia(post(1)).via, 'graph');
  assert.equal(rotaDaMidia(post(5)).via, 'manual');
  assert.equal(rotaDaMidia(post(5), {}).via, 'manual');
  assert.equal(rotaDaMidia(post(5), { carrosselLiberado: false }).via, 'manual');
  assert.equal(rotaDaMidia(post(5), { carrosselLiberado: 'true' }).via, 'manual', 'só o booleano true libera');
  assert.equal(rotaDaMidia(post(5), { carrosselLiberado: true }).via, 'graph');
});

test('Reel e Story: fila manual SEMPRE, mesmo com o carrossel liberado', () => {
  for (const tipo of ['reel', 'story']) {
    assert.equal(rotaDaMidia(post(1, { tipo }), { carrosselLiberado: true }).via, 'manual');
    assert.equal(rotaDaMidia(post(5, { tipo }), { carrosselLiberado: true }).via, 'manual');
  }
  assert.ok(!TIPOS_AUTOMATICOS.includes('reel') && !TIPOS_AUTOMATICOS.includes('story'));
});

test('quantidade de imagens inválida é bloqueada, não publicada', () => {
  assert.equal(rotaDaMidia(post(0)).via, 'bloqueado');
  assert.equal(rotaDaMidia(post(11), { carrosselLiberado: true }).via, 'bloqueado');
});

test('publicador operacional: Reel e Story nunca tocam a Meta Graph; carrossel só liberado', async () => {
  const env = { t: process.env.INSTAGRAM_ACCESS_TOKEN, c: process.env.INSTAGRAM_ACCOUNT_ID };
  process.env.INSTAGRAM_ACCESS_TOKEN = 'x'; process.env.INSTAGRAM_ACCOUNT_ID = 'y';
  const antes = global.fetch; let chamadas = 0; global.fetch = async () => { chamadas += 1; throw new Error('rede proibida neste teste'); };
  try {
    for (const tipo of ['reel', 'story']) {
      const r = await publicar({ tipo, legenda: 'x', videoUrl: 'https://x/v.mp4', imagemUrl: 'https://x/i.png' }, { simulado: false, carrosselLiberado: true });
      assert.equal(r.filaManual, true, tipo);
    }
    const c = await publicar({ tipo: 'carrossel', legenda: 'x', imagensUrls: ['a', 'b', 'c'] }, { simulado: false });
    assert.equal(c.filaManual, true);
    assert.equal(chamadas, 0, 'nenhuma chamada de rede');
  } finally { global.fetch = antes; process.env.INSTAGRAM_ACCESS_TOKEN = env.t; process.env.INSTAGRAM_ACCOUNT_ID = env.c; }
});

test('o publicador automático da fila usa o roteamento e não referencia Reel nem Story', () => {
  const fila = ler('backend/lib/redesV2/fila.js');
  assert.match(fila, /rotaDaMidia\(post, config\)/);
  assert.match(fila, /status: 'fila-manual'/);
  assert.doesNotMatch(fila, /publicarReelNoInstagram|STORIES|media_type: 'REELS'/);
  // os cron jobs não chamam o publicador de Reel
  assert.doesNotMatch(ler('backend/routes/cron.js'), /publicarReelNoInstagram/);
});

test('bot de mídias: Reel só pela fila manual (a chamada à Meta Graph fica inalcançável)', () => {
  const bot = ler('scripts/bot-publicar.js');
  const i = bot.indexOf("if (tipo === 'reel') {");
  assert.ok(i > 0);
  assert.match(bot.slice(i, i + 700), /Reels só na fila manual \(decisão de 18\/10\/2026\)/);
  assert.match(bot.slice(i, i + 700), /return \{ slug, ok: false/);
});

test('teste do carrossel: só com a ordem escrita; liberar só depois do teste; nenhum freio é alterado', () => {
  const t = ler('backend/scripts/redes/testeCarrossel.js');
  assert.match(t, /publicar teste de carrossel/);
  assert.match(t, /sem a ordem escrita do Dr\. Antônio/);
  assert.match(t, /o teste supervisionado ainda não foi publicado/);
  assert.doesNotMatch(t, /process\.env\.[A-Z_]*PUBLICACAO_ATIVA\s*=[^=]/);
  assert.doesNotMatch(t, /REDES_PUBLICACAO_ATIVA\s*=\s*['"]?true/);
});
