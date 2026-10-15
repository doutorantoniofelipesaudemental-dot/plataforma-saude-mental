/**
 * Acrescenta o circunflexo ao "o" de "Antonio" nas placas de marca (assets/marca/*.png), preservando todo o resto
 * do desenho (emblema, moldura, gradiente dourado, sombra). Decisão de 15/10/2026: "Dr. Antônio Felipe" COM acento
 * também no material de marca. Idempotente por checagem: roda sobre o arquivo ORIGINAL em git (git show HEAD~ ...) —
 * por isso lê de --origem=<pasta com os originais> e grava em assets/marca/.
 *   node backend/scripts/marca/acentuarPlacas.js --origem=<pasta> [--so-medir]
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const RAIZ = path.resolve(__dirname, '../../..');
const DEST = path.join(RAIZ, 'assets/marca');
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
const ORIGEM = arg('origem') || DEST;
const SO_MEDIR = process.argv.includes('--so-medir');

// Linhas (y0..y1, x0..x1) onde aparece "Antonio", em coordenadas do arquivo.
const k = (v, s) => Math.round(v * s);
const PLACAS = {
  'placa-dr-antonio-felipe-1080.png': [{ y: [325, 395], x: [150, 930] }, { y: [926, 960], x: [300, 790] }],
  'placa-dr-antonio-felipe-2400.png': [{ y: [k(325, 2.2222), k(395, 2.2222)], x: [k(150, 2.2222), k(930, 2.2222)] }, { y: [k(926, 2.2222), k(960, 2.2222)], x: [k(300, 2.2222), k(790, 2.2222)] }],
  'placa-dr-antonio-felipe-horizontal-2500x500.png': [{ y: [118, 210], x: [430, 1340] }, { y: [352, 385], x: [1400, 2020] }],
};

const ehDourado = (r, g, b) => r > 150 && g > 105 && b < 135 && r - b > 55;

async function colunas(buf, info, y0, y1, x0, x1) {
  const cols = [];
  for (let x = x0; x < x1; x += 1) {
    let n = 0;
    for (let y = y0; y < y1; y += 1) { const i = (y * info.width + x) * info.channels; if (ehDourado(buf[i], buf[i + 1], buf[i + 2])) n += 1; }
    cols.push(n >= 1);
  }
  const seg = []; let s = null;
  cols.forEach((c, i) => { if (c && s === null) s = i; if (!c && s !== null) { seg.push([x0 + s, x0 + i - 1]); s = null; } });
  if (s !== null) seg.push([x0 + s, x1 - 1]);
  return seg;
}

function palavras(seg, alturaLinha) {
  const limite = alturaLinha * 0.28;
  const out = [[seg[0]]];
  for (let i = 1; i < seg.length; i += 1) (seg[i][0] - seg[i - 1][1] > limite ? out.push([seg[i]]) : out.at(-1).push(seg[i]));
  return out;
}

async function localizarO(buf, info, { y, x }) {
  const seg = await colunas(buf, info, y[0], y[1], x[0], x[1]);
  // altura real da linha de texto
  let top = 1e9, bot = -1;
  for (let yy = y[0]; yy < y[1]; yy += 1) for (let xx = x[0]; xx < x[1]; xx += 1) { const i = (yy * info.width + xx) * info.channels; if (ehDourado(buf[i], buf[i + 1], buf[i + 2])) { top = Math.min(top, yy); bot = Math.max(bot, yy); } }
  const ws = palavras(seg, bot - top);
  const antonio = ws.at(-2); // ... "Antonio" "Felipe" (a última palavra é Felipe)
  if (!antonio || antonio.length < 5) throw new Error(`palavra "Antonio" não localizada (${ws.map((w) => w.length).join(',')})`);
  const o = antonio.at(-4); // A n t [o] n i o  →  4ª letra de trás para frente
  // topo do 'o' (altura-x) e base
  let oTop = 1e9, oBot = -1;
  for (let yy = y[0]; yy < y[1]; yy += 1) for (let xx = o[0]; xx <= o[1]; xx += 1) { const i = (yy * info.width + xx) * info.channels; if (ehDourado(buf[i], buf[i + 1], buf[i + 2])) { oTop = Math.min(oTop, yy); oBot = Math.max(oBot, yy); } }
  return { x0: o[0], x1: o[1], top: oTop, bot: oBot, ow: o[1] - o[0] + 1, oh: oBot - oTop + 1 };
}

function svgCircunflexo(w, h, o) {
  const s = o.ow / 40; // referência: 'o' de 40 px na placa de 1080
  const W = 0.80 * o.ow, H = 0.42 * o.ow, t = 0.25 * o.ow;
  const cx = (o.x0 + o.x1) / 2, yb = o.top - 0.06 * o.ow;
  const pts = [[cx - W / 2, yb], [cx, yb - H], [cx + W / 2, yb], [cx + W / 2 - t, yb], [cx, yb - H + t * 1.15], [cx - W / 2 + t, yb]];
  const d = (dx = 0, dy = 0) => pts.map(([px, py], i) => `${i ? 'L' : 'M'}${(px + dx).toFixed(2)},${(py + dy).toFixed(2)}`).join(' ') + ' Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="ouro" gradientUnits="userSpaceOnUse" x1="0" y1="${yb - H}" x2="0" y2="${yb}"><stop offset="0" stop-color="#ecd070"/><stop offset="0.45" stop-color="#d4a62c"/><stop offset="1" stop-color="#a87a12"/></linearGradient>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="${(1.3 * s).toFixed(2)}"/></filter>
  </defs>
  <path d="${d(1.6 * s, 2.4 * s)}" fill="#050c1e" opacity="0.78" filter="url(#sombra)"/>
  <path d="${d()}" fill="url(#ouro)" stroke="#8a600a" stroke-width="${(0.9 * s).toFixed(2)}" stroke-linejoin="round" opacity="1"/>
</svg>`;
}

(async () => {
  for (const [nome, linhas] of Object.entries(PLACAS)) {
    const origem = path.join(ORIGEM, nome);
    const { data, info } = await sharp(origem).raw().toBuffer({ resolveWithObject: true });
    const camadas = [];
    for (const l of linhas) {
      const o = await localizarO(data, info, l);
      console.log(nome, JSON.stringify(o));
      if (!SO_MEDIR) camadas.push({ input: Buffer.from(svgCircunflexo(info.width, info.height, o)), top: 0, left: 0 });
    }
    if (SO_MEDIR) continue;
    await sharp(origem).composite(camadas).png({ compressionLevel: 9 }).toFile(path.join(DEST, `__tmp-${nome}`));
    fs.renameSync(path.join(DEST, `__tmp-${nome}`), path.join(DEST, nome));
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
