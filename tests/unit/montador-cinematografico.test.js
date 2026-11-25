// Montador cinematográfico (PADRAO-CINEMATOGRAFICO-v1): validação do roteiro, tempos e filtros.
const { test } = require('node:test');
const assert = require('node:assert');
const { validarRoteiro, planoTempos, duracaoTotal, filtroVideo, filtroAudio, argsFfmpeg, loudnormArgs, argsCorte16x9, FORMATOS } =
  require('../../producao-audiovisual/montador/montar');

const CENA = { cena_id: 'c1', tipo: 'animacao', duracao_s: 9, fala: 'Tudo normal.', texto_tela: '07:00 · dia normal', fonte_pmid: null };
const ROTEIRO = {
  slug: 'e-se-24h-sem-dormir', fonteArtigo: 'sono-24h', formato: 'animacao-9x16', titulo: 'E se você ficasse 24h sem dormir?',
  identificacao: true, avisos: { ia: true, cvvSamu: true, orientacaoGeral: true }, cenas: [CENA],
};
const CENAS = [
  { cena_id: 'c1', tipo: 'animacao', duracao_s: 9 },
  { cena_id: 'c2', tipo: 'infografico', duracao_s: 11 },
  { cena_id: 'c3', tipo: 'cartela', duracao_s: 6 },
];

test('roteiro válido passa sem erros', () => {
  assert.deepStrictEqual(validarRoteiro(ROTEIRO), { ok: true, erros: [] });
});

test('sem CVV 188 · SAMU 192 o roteiro é bloqueado', () => {
  const r = { ...ROTEIRO, avisos: { ia: true, cvvSamu: false, orientacaoGeral: true } };
  const v = validarRoteiro(r);
  assert.equal(v.ok, false);
  assert.ok(v.erros.some((e) => /CVV/.test(e)));
});

test('sem aviso de IA ou sem orientação geral o roteiro é bloqueado', () => {
  assert.equal(validarRoteiro({ ...ROTEIRO, avisos: { ia: false, cvvSamu: true, orientacaoGeral: true } }).ok, false);
  assert.equal(validarRoteiro({ ...ROTEIRO, avisos: { ia: true, cvvSamu: true, orientacaoGeral: false } }).ok, false);
});

test('identificação diferente de true é bloqueada', () => {
  assert.equal(validarRoteiro({ ...ROTEIRO, identificacao: false }).ok, false);
});

test('PMID precisa ser numérico ou null', () => {
  const ok = validarRoteiro({ ...ROTEIRO, cenas: [{ ...CENA, fonte_pmid: '9230429' }] });
  assert.equal(ok.ok, true);
  const ruim = validarRoteiro({ ...ROTEIRO, cenas: [{ ...CENA, fonte_pmid: 'PMID 9230429' }] });
  assert.equal(ruim.ok, false);
});

test('slug fora do padrão é bloqueado; formato inválido é bloqueado', () => {
  assert.equal(validarRoteiro({ ...ROTEIRO, slug: 'Com Espaço' }).ok, false);
  assert.equal(validarRoteiro({ ...ROTEIRO, formato: 'desenho-plano' }).ok, false);
});

test('texto_tela acima de 200 caracteres é bloqueado', () => {
  const r = { ...ROTEIRO, cenas: [{ ...CENA, texto_tela: 'a'.repeat(201) }] };
  assert.equal(validarRoteiro(r).ok, false);
});

test('planoTempos encadeia as cenas sem buracos e soma a duração total', () => {
  const t = planoTempos(CENAS);
  assert.deepStrictEqual(t.map((x) => [x.ini, x.fim]), [[0, 9], [9, 20], [20, 26]]);
  assert.equal(duracaoTotal(CENAS), 26);
});

test('filtroVideo normaliza cada clipe ao formato e concatena', () => {
  const f = filtroVideo(CENAS, 'animacao-9x16');
  assert.ok(f.includes('scale=1080:1920'));
  assert.ok(f.includes('fps=30'));
  assert.ok(f.includes('concat=n=3:v=1:a=0[vid]'));
});

test('formato 16:9 usa 1920x1080', () => {
  assert.deepStrictEqual(FORMATOS['infografico-16x9'], { w: 1920, h: 1080 });
  assert.ok(filtroVideo(CENAS, 'infografico-16x9').includes('scale=1920:1080'));
});

test('filtroAudio aplica trilha −9 dB de base com sidechain (ducking) e amix', () => {
  const f = filtroAudio(3, 4, '26.000');
  assert.ok(f.includes('volume=-9dB'));
  assert.ok(f.includes('sidechaincompress'));
  assert.ok(f.includes('amix=inputs=2'));
  assert.ok(f.includes('asplit=2'));
});

test('argsFfmpeg: uma entrada por clipe, narração e trilha; duração final; mapas corretos', () => {
  const a = argsFfmpeg({ cenas: CENAS, clipes: ['a.mp4', 'b.mp4', 'c.mp4'], narracao: 'n.mp3', trilha: 't.wav', formato: 'animacao-9x16', saida: 's.mp4' });
  assert.equal(a.filter((x) => x === '-i').length, 5);
  assert.ok(a.includes('[vid]') && a.includes('[a]'));
  assert.equal(a[a.indexOf('-t') + 1], '26.000');
  assert.equal(a[a.length - 1], 's.mp4');
});

test('loudnorm: medição (passe 1) e aplicação linear (passe 2) com alvo −14 e TP −2', () => {
  const p1 = loudnormArgs('in.mp4', 'out.mp4', null);
  assert.ok(p1.join(' ').includes('print_format=json'));
  const med = { input_i: '-18.2', input_tp: '-3.1', input_lra: '6.0', input_thresh: '-28.1', target_offset: '0.4' };
  const p2 = loudnormArgs('in.mp4', 'out.mp4', med).join(' ');
  assert.ok(p2.includes('I=-14') && p2.includes('TP=-2') && p2.includes('linear=true') && p2.includes('alimiter=limit=0.75'));
});

test('corte 16:9 divide o vídeo (split) antes de usar o quadro duas vezes', () => {
  const a = argsCorte16x9('in.mp4', 'out.mp4').join(' ');
  assert.ok(a.includes('split=2'));
  assert.ok(a.includes('overlay='));
});

// --- Cartão final, textos de tela e narração dos clipes (ordem de 25/11, 06:00) ---
const { errosCartao, quebrar, argsCartao, argsOverlay, argsNarracaoDeClipes, CREDITO_LINHA, CVV_LINHA, IA_LINHA } =
  require('../../producao-audiovisual/montador/montar');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/identificacaoCfm');
const CARTAO_OK = [...IDENTIFICACAO_COMPLETA.split('\n'), CREDITO_LINHA, CVV_LINHA, IA_LINHA, 'Fontes: Dawson D, Reid K. Nature 1997;388:235 (PMID 9230429).'];
const fsFalso = { writeFileSync() {} };

test('cartão com identificação de 5 linhas, crédito, CVV e aviso de IA passa', () => {
  assert.deepStrictEqual(errosCartao(CARTAO_OK), []);
});

test('cartão sem o crédito do Portal é recusado', () => {
  const sem = CARTAO_OK.filter((l) => l !== CREDITO_LINHA);
  assert.ok(errosCartao(sem).some((e) => /crédito/.test(e)));
});

test('cartão com "TCC" abreviado (fora da assinatura de 5 linhas) é recusado', () => {
  const errado = CARTAO_OK.map((l) => (l.startsWith('Pós-graduação') ? 'Pós-graduações: Psiquiatria, TCC' : l));
  assert.ok(errosCartao(errado).some((e) => /identificação/.test(e)));
});

test('validarRoteiro aceita cena de cartão completa e recusa cartão incompleto', () => {
  const cenaCartao = { cena_id: 'cartao', tipo: 'cartela', duracao_s: 6, fala: '', texto_tela: '', fonte_pmid: null, cartao: CARTAO_OK };
  assert.equal(validarRoteiro({ ...ROTEIRO, cenas: [CENA, cenaCartao] }).ok, true);
  const ruim = { ...cenaCartao, cartao: CARTAO_OK.filter((l) => l !== IA_LINHA) };
  assert.equal(validarRoteiro({ ...ROTEIRO, cenas: [CENA, ruim] }).ok, false);
});

test('cena cartela sem cartão e sem clipe é recusada', () => {
  const r = { ...ROTEIRO, cenas: [{ cena_id: 'x', tipo: 'cartela', duracao_s: 5, fala: '', texto_tela: '', fonte_pmid: null }] };
  assert.equal(validarRoteiro(r).ok, false);
});

test('quebrar respeita o limite de caracteres por linha e preserva o texto', () => {
  const linhas = quebrar('um dois três quatro cinco seis sete oito nove dez', 12);
  assert.ok(linhas.every((l) => l.length <= 12));
  assert.equal(linhas.join(' '), 'um dois três quatro cinco seis sete oito nove dez');
});

test('argsCartao gera cor de fundo lavfi com drawtext e sem áudio', () => {
  const a = argsCartao({ linhas: CARTAO_OK, duracao: 6, formato: 'animacao-9x16', saida: 'c.mp4', pastaTextos: '.', fs_: fsFalso }).join(' ');
  assert.ok(a.includes('color=c=0x0B0F19:s=1080x1920'));
  assert.ok(a.includes('drawtext='));
  assert.ok(a.includes('-an'));
});

test('argsOverlay: cada linha de texto de tela tem janela between() e caixa escura de contraste', () => {
  const cenas = [{ cena_id: 'c1', tipo: 'animacao', duracao_s: 9, texto_tela: '24 horas\nsem dormir' }];
  const planos = planoTempos(cenas);
  const a = argsOverlay({ entrada: 'b.mp4', saida: 'o.mp4', cenas, planos, pastaTextos: '.', fs_: fsFalso }).join(' ');
  assert.ok(a.includes('between(t\\,0.000\\,9.000)'));
  assert.ok(a.includes('boxcolor=black@0.62'));
  assert.equal((a.match(/drawtext=/g) || []).length, 2);
});

test('argsOverlay sem textos de tela não aplica filtro de texto', () => {
  const cenas = [{ cena_id: 'c1', tipo: 'animacao', duracao_s: 9, texto_tela: '' }];
  const a = argsOverlay({ entrada: 'b.mp4', saida: 'o.mp4', cenas, planos: planoTempos(cenas), pastaTextos: '.', fs_: fsFalso });
  assert.equal(a[a.indexOf('-vf') + 1], 'null');
});

test('argsNarracaoDeClipes: clipe com áudio é cortado; cartão vira silêncio; tudo concatenado', () => {
  const cenas = [{ cena_id: 'p1', duracao_s: 12 }, { cena_id: 'cartao', duracao_s: 6 }];
  const a = argsNarracaoDeClipes({ cenas, clipes: ['p1.mp4', null], saida: 'n.wav' }).join(' ');
  assert.ok(a.includes('[0:a]atrim=0:12'));
  assert.ok(a.includes('anullsrc'));
  assert.ok(a.includes('concat=n=2:v=0:a=1'));
});
