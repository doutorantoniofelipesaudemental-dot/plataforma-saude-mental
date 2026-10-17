/**
 * Mosaico dos quadros (1 s e final) dos vídeos aprovados da fila do YouTube, para o Dr. Antônio olhar.
 *   node scripts/youtube/mosaicoQuadros.js   → relatorios/youtube/mosaico-quadros.png
 * Usa os quadros que a conferência automática guarda em <pasta do vídeo>/conferencia/{ini,fim}.png.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const L = require('./lib');

const COLS = 5, CW = 460, CH = 270, ALT = 232, PAD = 10;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

(async () => {
  const itens = JSON.parse(fs.readFileSync(path.join(L.REL, 'fila.json'), 'utf8')).itens.filter((i) => i.status === 'aprovado-checagem');
  const linhas = Math.ceil(itens.length / COLS);
  const W = COLS * (CW + PAD) + PAD, H = linhas * (CH + PAD) + PAD;
  const comp = [];
  for (let k = 0; k < itens.length; k++) {
    const it = itens[k], x = PAD + (k % COLS) * (CW + PAD), y = PAD + Math.floor(k / COLS) * (CH + PAD);
    const q = path.join(L.RAIZ, it.pasta, 'conferencia');
    const quadros = [];
    for (const nome of ['ini', 'fim']) {
      const f = path.join(q, `${nome}.png`);
      if (fs.existsSync(f)) quadros.push(await sharp(f).resize({ width: Math.floor(CW / 2) - 4, height: ALT, fit: 'inside' }).png().toBuffer());
    }
    let left = x + 4;
    for (const b of quadros) { comp.push({ input: b, left, top: y + 4 }); left += (await sharp(b).metadata()).width + 6; }
    const rotulo = `${it.slot.slice(5, 10)} ${it.tipo === 'short' ? 'Short' : 'Longo'} · ${it.slug}`.slice(0, 62);
    comp.push({ input: Buffer.from(`<svg width="${CW}" height="30" xmlns="http://www.w3.org/2000/svg"><text x="4" y="20" font-family="Segoe UI, Arial" font-size="15" fill="#111">${esc(rotulo)}</text></svg>`), left: x, top: y + ALT + 10 });
  }
  const dest = path.join(L.REL, 'mosaico-quadros.png');
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f2f2f2' } }).composite(comp).png().toFile(dest);
  console.log(`${itens.length} vídeos aprovados → ${path.relative(L.RAIZ, dest)} (${W}x${H})`);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
