// Evolução visual e audiovisual: quebra de linha do carrossel, prévia visual
// (dimensões), provedor ElevenLabs (corpos das requisições, sem rede) e .mcp.json.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('carrossel: "CVV 188", "SAMU 192", "CRM-BA 41322" e "RQE 26638" nunca se separam na quebra', () => {
  const { quebrarLinhas, FONTE_SANS } = require('../../backend/lib/carrossel');
  const linhas = quebrarLinhas(FONTE_SANS, 'Leia o artigo completo no link da bio para saber mais. Apoio agora: CVV 188 · SAMU 192', 912, 50);
  const texto = linhas.join('\n');
  assert.doesNotMatch(texto, /CVV\n|SAMU\n/);
  assert.match(texto, /CVV 188/);
  for (const largura of [300, 420, 560]) {
    const l = quebrarLinhas(FONTE_SANS, 'Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638', largura, 26);
    assert.doesNotMatch(l.join('\n'), /CRM-BA\n|RQE\n/, `largura ${largura}`);
  }
});

test('prévia visual: aponta slide ou vídeo fora da dimensão esperada', () => {
  const { conferirDimensoes } = require('../../scripts/bot-previa-visual');
  const esperado = { largura: 1080, altura: 1350 };
  assert.deepEqual(conferirDimensoes([{ nome: 'slide 1', largura: 1080, altura: 1350 }], esperado), []);
  assert.deepEqual(conferirDimensoes([{ nome: 'slide 2', largura: 1080, altura: 1080 }], esperado), ['slide 2: 1080×1080 (esperado 1080×1350)']);
});

test('ElevenLabs: síntese em pt com leitura estável; efeito com limites da API', () => {
  const el = require('../../backend/lib/elevenlabs');
  const corpo = el.corpoTts('Narração em voz sintética.', { modelo: 'eleven_multilingual_v2' });
  assert.equal(corpo.model_id, 'eleven_multilingual_v2');
  assert.equal(corpo.language_code, 'pt');
  assert.ok(corpo.voice_settings.stability >= 0.5, 'leitura clínica, não dramatizada');
  assert.deepEqual(el.corpoEfeito('chuva suave ao fundo', { duracao: 30, loop: true }), {
    text: 'chuva suave ao fundo',
    duration_seconds: 30,
    prompt_influence: 0.3,
    loop: true,
    model_id: 'eleven_text_to_sound_v2',
  });
  assert.throws(() => el.corpoEfeito('x', { duracao: 45 }), /fora do intervalo/);
  assert.throws(() => el.validarIdioma('fr'), /não liberado/);
  assert.doesNotThrow(() => el.validarIdioma('es'));
  const amostra = [...el.TEXTO_AMOSTRA_PADRAO].length;
  assert.ok(amostra >= 100 && amostra <= 1000, 'amostra do Voice Design entre 100 e 1000 caracteres');
  assert.match(el.TEXTO_AMOSTRA_PADRAO, /^Narração em voz sintética\./);
});

test('ElevenLabs: sem chave ou sem voz, falha com instrução — nunca com a chave na mensagem', async () => {
  const tts = require('../../backend/lib/tts');
  const el = require('../../backend/lib/elevenlabs');
  assert.throws(() => tts.validarProvedor('elevenlabs', ''), /ELEVENLABS_VOICE_ID ausente/);
  assert.doesNotThrow(() => tts.validarProvedor('elevenlabs', 'voz123'));
  const chave = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  try {
    await assert.rejects(el.sintetizar('Oi.', { vozId: 'voz123' }), /ELEVENLABS_API_KEY precisa estar no \.env local/);
  } finally {
    if (chave !== undefined) process.env.ELEVENLABS_API_KEY = chave;
  }
});

test('.mcp.json: MCP oficial da ElevenLabs por uvx, chave só por variável de ambiente', () => {
  const mcp = JSON.parse(fs.readFileSync(path.join(__dirname, '../../.mcp.json'), 'utf8'));
  const s = mcp.mcpServers.elevenlabs;
  assert.equal(s.command, 'uvx');
  assert.deepEqual(s.args, ['elevenlabs-mcp']);
  assert.equal(s.env.ELEVENLABS_API_KEY, '${ELEVENLABS_API_KEY}', 'nunca a chave literal no repositório público');
});

test('bot:elevenlabs: nome de arquivo do efeito sem acento nem símbolo', () => {
  const { nomeArquivo } = require('../../scripts/bot-elevenlabs');
  assert.equal(nomeArquivo('Chuva suave, piano calmo & ambiente'), 'chuva-suave-piano-calmo-ambiente');
});
