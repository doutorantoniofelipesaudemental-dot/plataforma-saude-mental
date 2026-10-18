/**
 * Conferência automática de UM vídeo do YouTube (16/10/2026, a pedido do Dr. Antônio): quadro de 1 s, quadro intermediário e quadro final.
 *  - crédito do Portal visível no quadro de 1 s e no final;
 *  - assinatura legível e NÃO coberta pelo crédito (a região da assinatura é igual com e sem crédito na tela);
 *  - sem marca d'água/ruído (checarImagemSemMarcaDagua, com cantos);
 *  - legenda presente (longos: .srt; Shorts: legenda queimada cap.ass);
 *  - vinheta falada: longos no início e no fim; Shorts só no fim (crédito curto), conferida por transcrição (faster-whisper).
 * Guarda o resultado em <pasta>/conferencia.json (cache por hash do vídeo) e os quadros em <pasta>/conferencia/{ini,meio,fim}.png.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const sharp = require('sharp');
const { checarImagemSemMarcaDagua } = require('../../backend/lib/checagensAprovacao');
const L = require('./lib');
const VERSAO = 'v3';
const REG_FINAL_LONGO = [100, 320, 1700, 760]; // região das 5 linhas da assinatura na tela final do vídeo longo

const sem = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ff = (args) => spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
// regiões (x0,y0,x1,y1) por orientação
const REG = {
  vertical: { cred: [200, 1800, 890, 1905], assin: [30, 1560, 1000, 1700] },
  horizontal: { cred: [1400, 950, 1890, 1065], assin: [100, 870, 1085, 995] },
};
async function brilho(png, [x0, y0, x1, y1]) {
  const { data, info } = await sharp(png).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).raw().toBuffer({ resolveWithObject: true });
  let n = 0; const mask = new Uint8Array(data.length / info.channels);
  for (let i = 0, k = 0; i < data.length; i += info.channels, k++) if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) { mask[k] = 1; n++; }
  return { n, data: mask };
}
// IoU das máscaras de pixels claros (texto): 1 = a região da assinatura é idêntica com e sem o crédito na tela
const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };

async function conferirVideo(dir, meta) {
  const arqCache = path.join(dir, 'conferencia.json');
  try { const c = JSON.parse(fs.readFileSync(arqCache, 'utf8')); if (c.versao === VERSAO && c.hashVideo === meta.hashVideo) return c; } catch { /* confere de novo */ }
  const video = path.join(dir, meta.arquivos.video), q = path.join(dir, 'conferencia');
  fs.mkdirSync(q, { recursive: true });
  const dur = L.duracao(video);
  const meio = Math.min(10, dur / 2);
  const falhas = [];
  ff(['-ss', '1', '-i', video, '-frames:v', '1', path.join(q, 'ini.png')]);
  ff(['-ss', String(meio), '-i', video, '-frames:v', '1', path.join(q, 'meio.png')]);
  ff(['-sseof', '-1', '-i', video, '-frames:v', '1', path.join(q, 'fim.png')]);
  const png = Object.fromEntries(['ini', 'meio', 'fim'].map((k) => [k, fs.existsSync(path.join(q, `${k}.png`)) ? fs.readFileSync(path.join(q, `${k}.png`)) : null]));
  if (!png.ini || !png.meio || !png.fim) falhas.push('não consegui extrair os quadros (1 s, meio, final)');
  else {
    const info = await sharp(png.ini).metadata();
    const reg = info.height > info.width ? REG.vertical : REG.horizontal;
    const [ci, cf, ai, am, af] = await Promise.all([brilho(png.ini, reg.cred), brilho(png.fim, reg.cred), brilho(png.ini, reg.assin), brilho(png.meio, reg.assin), brilho(png.fim, reg.assin)]);
    if (ci.n < 300) falhas.push(`crédito do Portal não aparece no quadro de 1 s (${ci.n} px claros)`);
    if (cf.n < 300) falhas.push(`crédito do Portal não aparece no quadro final (${cf.n} px claros)`);
    if (am.n < 600) falhas.push(`assinatura ilegível ou ausente no quadro do meio (${am.n} px claros)`);
    const horizontal = reg === REG.horizontal;
    if (ai.n < 600) falhas.push(`assinatura ilegível ou ausente com o crédito na tela (${ai.n} px claros)`);
    if (!horizontal && af.n < 600) falhas.push(`assinatura ilegível ou ausente no quadro final (${af.n} px claros)`);
    // vídeo longo: a tela final traz a assinatura COMPLETA de 5 linhas (região própria)
    if (horizontal) { const fin = await brilho(png.fim, REG_FINAL_LONGO); if (fin.n < 1500) falhas.push(`tela final sem a assinatura completa de 5 linhas (${fin.n} px claros)`); }
    // horizontal: a assinatura é estática, então a máscara de texto tem de ser idêntica com e sem o crédito; vertical: o layout muda entre telas, vale a regra geométrica (crédito rente à borda, abaixo da assinatura)
    if (horizontal && iou(ai.data, am.data) < 0.85) falhas.push('crédito cobre a assinatura (a região da assinatura muda quando o crédito aparece)');
    for (const k of ['ini', 'fim']) { const r = await checarImagemSemMarcaDagua(png[k], { verificarCantos: true }); if (!r.ok) falhas.push(`quadro ${k}: ${r.falhas.join('; ')}`.slice(0, 220)); }
  }
  const legenda = meta.arquivos.legenda ? fs.existsSync(path.join(dir, meta.arquivos.legenda)) : fs.existsSync(path.join(dir, 'cap.ass'));
  if (!legenda) falhas.push(meta.arquivos.legenda ? 'sem legenda .srt' : 'sem legenda queimada (cap.ass)');
  // vinheta falada: início (16 s) e fim (últimos 34 s)
  const a1 = path.join(q, 'ini.wav'), a2 = path.join(q, 'fim.wav');
  ff(['-i', video, '-t', '16', '-ac', '1', '-ar', '16000', a1]);
  ff(['-sseof', '-46', '-i', video, '-ac', '1', '-ar', '16000', a2]);
  const t = spawnSync(L.PY, ['-I', path.join(__dirname, 'transcrever.py'), a1, a2], { encoding: 'utf8', timeout: 600000 });
  let fala = ['', ''];
  try { fala = JSON.parse(t.stdout.trim().split('\n').pop()); } catch { falhas.push('transcrição da vinheta falhou'); }
  // Shorts (até 60 s): só o crédito curto, no fim (decisão do gerador); vídeos longos: abertura e encerramento
  const ehShort = meta.tipo === 'short';
  if (!ehShort && !/portal de saude mental/.test(sem(fala[0]))) falhas.push(`vinheta falada ausente no início ("${fala[0].slice(0, 70)}")`);
  if (!/portal de saude mental/.test(sem(fala[1]))) falhas.push(`vinheta falada ausente no fim ("${fala[1].slice(0, 70)}")`);
  if (!ehShort) { // vídeo longo: assinatura falada curta (sem as 5 linhas: nada de pós-graduação nem "não especialista" na fala)
    const fim = sem(fala[1]);
    if (!/bahia|baia/.test(fim) || !/medicina de familia/.test(fim)) falhas.push(`assinatura falada curta ausente no fim ("${fala[1].slice(-90)}")`);
    if (/pos.?graduacao|nao especialista/.test(fim)) falhas.push('a fala do fim lê a assinatura de 5 linhas (pós-graduação / "não especialista")');
  }
  for (const f of [a1, a2]) fs.rmSync(f, { force: true });
  const res = { versao: VERSAO, hashVideo: meta.hashVideo, ok: falhas.length === 0, falhas, fala, em: new Date().toISOString() };
  fs.writeFileSync(arqCache, JSON.stringify(res, null, 1));
  return res;
}
module.exports = { conferirVideo };

if (require.main === module) { // node scripts/youtube/conferirVideo.js <pasta-do-video>
  (async () => { const d = path.resolve(process.argv[2]); const meta = JSON.parse(fs.readFileSync(path.join(d, 'meta.json'), 'utf8')); fs.rmSync(path.join(d, 'conferencia.json'), { force: true }); console.log(JSON.stringify(await conferirVideo(d, meta), null, 1)); })();
}
