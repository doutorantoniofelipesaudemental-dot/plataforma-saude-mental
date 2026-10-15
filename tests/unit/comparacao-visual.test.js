// Comparação visual tolerante dos miniapps (tests/e2e/comparacaoVisual.js): absorve ±1 px, recusa defeito real.
const { test } = require('node:test');
const assert = require('node:assert');
const sharp = require('sharp');
const { compararComTolerancia } = require('../e2e/comparacaoVisual');

const W = 350, H = 900;
// imagem sintética: fundo claro com "linhas de texto" (barras escuras) e um botão
async function base(deslocarDeY = 0, extraAltura = 0) {
  const barras = [];
  for (let i = 0; i < 14; i += 1) barras.push(`<rect x="24" y="${40 + i * 52 + deslocarDeY}" width="${180 + (i % 4) * 30}" height="14" rx="3" fill="#17211f"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + extraAltura}"><rect width="100%" height="100%" fill="#faf7f2"/>${barras.join('')}<rect x="24" y="${800 + deslocarDeY}" width="302" height="56" rx="14" fill="#185d58"/></svg>`;
  return sharp(Buffer.from(svg)).blur(1.2).png().toBuffer(); // blur simula o serrilhado do texto real
}
const comparar = async (atual) => { const f = `${require('node:os').tmpdir()}/base-visual-${process.pid}.png`; require('node:fs').writeFileSync(f, await base()); return compararComTolerancia(atual, f); };

test('igual e deslocamento de 1 px (com altura ±1) passam', async () => {
  assert.equal((await comparar(await base())).ok, true);
  assert.equal((await comparar(await base(1, 1))).ok, true);
});

test('altura +3 px é recusada', async () => {
  const r = await comparar(await base(0, 3));
  assert.equal(r.ok, false);
  assert.match(r.motivo, /altura/);
});

test('bloco movido 12 px e área alterada são recusados', async () => {
  const movido = await sharp(await base()).composite([{ input: await sharp({ create: { width: 350, height: 260, channels: 3, background: '#faf7f2' } }).png().toBuffer(), top: 300, left: 0 }, { input: await sharp(await base()).extract({ left: 0, top: 300, width: 350, height: 240 }).png().toBuffer(), top: 312, left: 0 }]).png().toBuffer();
  assert.equal((await comparar(movido)).ok, false);
  const alterado = await sharp(await base()).composite([{ input: await sharp({ create: { width: 200, height: 160, channels: 3, background: '#c0392b' } }).png().toBuffer(), top: 120, left: 60 }]).png().toBuffer();
  assert.equal((await comparar(alterado)).ok, false);
});
