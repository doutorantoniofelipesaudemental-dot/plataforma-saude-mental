// Cascata multimídia: conformidade CFM automática, matriz por artigo,
// trilhas de fundo e provedores de voz (azure/edge/openai) — sem rede.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { garantirConformidade, faltasConformidade, AVISO_CFM, IDENTIFICACAO, LINHA_CVV } = require('../../backend/lib/conformidadeCfm');
const { calcularMatriz, marcarExecutado, IDS } = require('../../backend/lib/matrizMidia');
const { listarTrilhas, escolherTrilha } = require('../../backend/lib/trilhas');
const tts = require('../../backend/lib/tts');

test('conformidade: acrescenta CVV (tema sensível), identificação e aviso CFM antes das hashtags, sem repetir', () => {
  const legenda = 'Gancho.\n\nParágrafo do artigo.\n\n#saudemental #burnout #aps';
  const final = garantirConformidade(legenda, { sensivel: true });
  const blocos = final.split('\n\n');
  assert.deepEqual(blocos.slice(2, 5), [LINHA_CVV, IDENTIFICACAO, AVISO_CFM]);
  assert.match(blocos.at(-1), /^#saudemental/);
  assert.equal(garantirConformidade(final, { sensivel: true }), final, 'idempotente');
  assert.deepEqual(faltasConformidade(final, { sensivel: true }), []);
  // Tema não sensível: sem CVV.
  assert.ok(!garantirConformidade('Texto.', { sensivel: false }).includes('CVV 188'));
});

test('conformidade: aponta o que falta, inclusive CVV só em tema sensível', () => {
  assert.deepEqual(faltasConformidade('Texto solto.', { sensivel: true }), [
    'sem a identificação do médico (CRM-BA 41322 · RQE 26638)',
    'sem o aviso da Res. CFM 2.454/2026',
    'tema sensível sem CVV 188',
  ]);
  assert.equal(faltasConformidade(`x\n\n${IDENTIFICACAO}\n\n${AVISO_CFM}`, { sensivel: false }).length, 0);
});

test('LinkedIn: post do bot sai com identificação, aviso CFM e CVV em tema sensível', () => {
  const { montarTextoLinkedin } = require('../../scripts/bot-publicar');
  const texto = montarTextoLinkedin('Post corporativo.\n\nLeia o artigo completo no site.', { titulo: 'Burnout em médicos', categoria: 'Burnout', conteudo: '' });
  assert.deepEqual(faltasConformidade(texto, { sensivel: true }), []);
  assert.match(texto, /Dr\. Antônio Felipe · Médico · CRM-BA 41322/);
});

test('matriz: pacote novo tem os seis formatos pendentes', () => {
  const m = calcularMatriz({});
  assert.deepEqual(Object.keys(m.formatos), IDS);
  assert.equal(m.pendentes.length, 6);
  assert.equal(m.totalmente_concluido, false);
  assert.equal(m.concluidoEm, null);
});

test('matriz: deriva do que foi publicado e só conclui com os seis formatos', () => {
  const meta = {
    aprovacao: { em: '2026-09-26' },
    publicacao: {
      instagram: { id: 'ig1', permalink: 'https://instagram.com/p/x', em: '2026-09-26' },
      linkedin: [{ titulo: 'Post 1', id: 'li1', em: '2026-09-26' }],
      videos: {
        'reel-carrossel': { rede: 'instagram', id: 'r1', em: '2026-09-27' },
        'short-2': { rede: 'youtube', id: 's2', link: 'https://youtu.be/s2', em: '2026-09-27' },
      },
    },
  };
  let m = calcularMatriz(meta);
  assert.equal(m.formatos['instagram.reel'].status, 'publicado', 'reel-carrossel conta como Reel');
  assert.equal(m.formatos['youtube.short'].ref, 'https://youtu.be/s2');
  assert.deepEqual(m.pendentes, ['instagram.stories', 'youtube.longo']);
  assert.equal(m.totalmente_concluido, false);

  meta.publicacao.videos.longo = { rede: 'youtube', id: 'l1', em: '2026-09-28' };
  marcarExecutado(meta, 'instagram.stories', { nota: '5 quadros com enquete', agora: new Date('2026-09-28T12:00:00Z') });
  m = meta.matriz;
  assert.equal(m.formatos['instagram.stories'].status, 'executado');
  assert.equal(m.totalmente_concluido, true);
  assert.equal(m.concluidoEm, '2026-09-28T12:00:00.000Z');
  // Recalcular depois não muda a data de conclusão.
  assert.equal(calcularMatriz(meta, new Date('2026-10-01')).concluidoEm, '2026-09-28T12:00:00.000Z');
});

test('matriz: marcar exige pacote aprovado e formato conhecido', () => {
  assert.throws(() => marcarExecutado({}, 'instagram.stories'), /sem aprovação médica/);
  assert.throws(() => marcarExecutado({ aprovacao: {} }, 'tiktok.video'), /formato desconhecido/);
});

test('trilhas: só .mp3, em ordem, e escolha fixa por slug', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'trilhas-'));
  try {
    for (const f of ['b-calma.mp3', 'a-piano.MP3', 'licenca.txt']) fs.writeFileSync(path.join(pasta, f), '');
    const trilhas = listarTrilhas(pasta);
    assert.deepEqual(trilhas.map((t) => path.basename(t)), ['a-piano.MP3', 'b-calma.mp3']);
    const escolhida = escolherTrilha('saude-mental-residencia', trilhas);
    assert.equal(escolherTrilha('saude-mental-residencia', trilhas), escolhida, 'determinística');
    assert.ok(trilhas.includes(escolhida));
    assert.equal(escolherTrilha('qualquer', []), null);
    assert.deepEqual(listarTrilhas(path.join(pasta, 'nao-existe')), []);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('voz: provedores e vozes liberados; OpenAI com instruções só no gpt-4o-mini-tts', async () => {
  assert.doesNotThrow(() => tts.validarProvedor('openai', 'onyx'));
  assert.doesNotThrow(() => tts.validarProvedor('openai', 'echo'));
  assert.throws(() => tts.validarProvedor('openai', 'alloy'), /não liberada/);
  assert.throws(() => tts.validarProvedor('polly', 'x'), /desconhecido/);
  assert.doesNotThrow(() => tts.validarProvedor('edge', 'pt-BR-AntonioNeural'));

  const corpo = tts.corpoOpenAI('Narração em voz sintética.', { voz: 'onyx', modelo: 'gpt-4o-mini-tts' });
  assert.equal(corpo.voice, 'onyx');
  assert.equal(corpo.response_format, 'mp3');
  assert.match(corpo.instructions, /português do Brasil/);
  assert.equal(tts.corpoOpenAI('Oi.', { voz: 'echo', modelo: 'tts-1-hd' }).instructions, undefined);
  assert.throws(() => tts.corpoOpenAI('x'.repeat(4097), { voz: 'onyx' }), /até 4096/);

  const chave = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(tts.sintetizar('Oi.', { provedor: 'openai', voz: 'onyx' }), /OPENAI_API_KEY precisa estar no \.env local/);
  } finally {
    if (chave !== undefined) process.env.OPENAI_API_KEY = chave;
  }
});

test('vídeo: trilha baixa sob a voz, cortada no fim com fade; --sem-trilha e --audio inexistente', () => {
  const { filtroTrilhaSobVoz, resolverTrilha } = require('../../scripts/bot-video-carrossel');
  const [bg, mix] = filtroTrilhaSobVoz(20, 45.5);
  assert.equal(bg, '[20:a]volume=0.12,atrim=0:45.50,afade=t=out:st=43.50:d=2[bg]');
  assert.equal(mix, '[voz][bg]amix=inputs=2:duration=first:normalize=0[outa]');
  assert.equal(resolverTrilha({ 'sem-trilha': true }, 'x'), null);
  assert.throws(() => resolverTrilha({ audio: 'nao/existe.mp3' }, 'x'), /faixa não encontrada/);
});

test('OpenAI: 429 de saldo aborta na hora; 429 de taxa e 5xx repetem', async () => {
  assert.equal(tts.classificarErroOpenAI(429, { code: 'insufficient_quota', message: 'You exceeded your current quota' }), 'sem-creditos');
  assert.equal(tts.classificarErroOpenAI(429, { message: 'You have no credits remaining. Add credits to continue.' }), 'sem-creditos');
  assert.equal(tts.classificarErroOpenAI(429, { code: 'rate_limit_exceeded', message: 'Rate limit reached' }), 'repetir');
  assert.equal(tts.classificarErroOpenAI(503, {}), 'repetir');
  assert.equal(tts.classificarErroOpenAI(401, { message: 'Incorrect API key' }), 'falha');

  const fetchOriginal = global.fetch;
  const chaveOriginal = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = ['chave', 'de', 'teste'].join('-'); // falsa — segredos:permitir
  const resposta = (status, erro) => ({ ok: false, status, json: async () => ({ error: erro }) });
  try {
    // Sem créditos: UMA chamada, sem espera, mensagem limpa sobre saldo.
    let chamadas = 0;
    global.fetch = async () => (chamadas++, resposta(429, { code: 'insufficient_quota', message: 'You have no credits remaining.' }));
    const inicio = Date.now();
    await assert.rejects(tts.sintetizarOpenAI('Oi.', 'onyx', { esperaMs: 5000 }), /sem créditos na conta .*--provedor=edge/);
    assert.equal(chamadas, 1);
    assert.ok(Date.now() - inicio < 1000, 'não esperou o retry');

    // Limite de taxa: tenta 4 vezes antes de desistir.
    chamadas = 0;
    global.fetch = async () => (chamadas++, resposta(429, { code: 'rate_limit_exceeded', message: 'Rate limit reached' }));
    await assert.rejects(tts.sintetizarOpenAI('Oi.', 'onyx', { esperaMs: 1 }), /HTTP 429 \(Rate limit reached\)/);
    assert.equal(chamadas, 4);
  } finally {
    global.fetch = fetchOriginal;
    if (chaveOriginal === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = chaveOriginal; // restaura a do ambiente — segredos:permitir
  }
});

test('Kokoro local: corpo no formato da OpenAI em pt-BR, voz pt obrigatória, servidor fora avisa', async () => {
  assert.deepEqual(tts.corpoKokoro('Narração em voz sintética.', { voz: 'pm_alex' }), {
    model: 'kokoro',
    input: 'Narração em voz sintética.',
    voice: 'pm_alex',
    response_format: 'mp3',
    speed: 1.0,
    lang_code: 'p',
  });
  assert.equal(tts.vozPadrao('kokoro'), process.env.KOKORO_VOZ || 'pm_alex');
  for (const voz of tts.VOZES_KOKORO) assert.doesNotThrow(() => tts.validarProvedor('kokoro', voz));
  assert.throws(() => tts.validarProvedor('kokoro', 'af_bella'), /não é pt-BR no Kokoro/);

  const fetchOriginal = global.fetch;
  const urlOriginal = process.env.KOKORO_URL;
  process.env.KOKORO_URL = 'http://kokoro.teste:8880/';
  try {
    let pedido;
    global.fetch = async (url, opcoes) => {
      pedido = { url, corpo: JSON.parse(opcoes.body) };
      return { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode('ID3mp3').buffer };
    };
    const audio = await tts.sintetizar('Oi.', { provedor: 'kokoro', voz: 'pm_santa' });
    assert.equal(pedido.url, 'http://kokoro.teste:8880/v1/audio/speech', 'barra final do KOKORO_URL não duplica');
    assert.equal(pedido.corpo.voice, 'pm_santa');
    assert.equal(audio.toString(), 'ID3mp3');

    // Conexão recusada: fetch (undici) lança TypeError com cause.code.
    global.fetch = async () => {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    };
    await assert.rejects(tts.sintetizar('Oi.', { provedor: 'kokoro', voz: 'pm_alex' }), /servidor Kokoro não está rodando em http:\/\/kokoro\.teste:8880 \(ECONNREFUSED\) — suba com: docker run/);

    global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ detail: { message: 'Voice not found' } }) });
    await assert.rejects(tts.sintetizar('Oi.', { provedor: 'kokoro', voz: 'pm_alex' }), /Kokoro respondeu HTTP 400 \(Voice not found\)/);
  } finally {
    global.fetch = fetchOriginal;
    if (urlOriginal === undefined) delete process.env.KOKORO_URL;
    else process.env.KOKORO_URL = urlOriginal;
  }
});

test('transparência: o vídeo narrado sempre abre com "Narração em voz sintética." e só uma vez', () => {
  const { textoNarradoDoSlide } = require('../../scripts/bot-video-carrossel');
  assert.equal(textoNarradoDoSlide('Saúde mental de professores · o adoecimento silencioso', 0), 'Narração em voz sintética. Saúde mental de professores, o adoecimento silencioso');
  assert.doesNotMatch(textoNarradoDoSlide('Segundo slide.', 1), /voz sintética/);
  assert.doesNotMatch(textoNarradoDoSlide('Último slide. Apoio agora: CVV 188 · SAMU 192', 9), /voz sintética/);
});
