const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { renderizarTelas } = require('../../backend/lib/redesV2/arte');

// Foto de exemplo (ruído), só para medir a faixa do topo. Não é imagem do acervo.
const capa = () => sharp({ create: { width: 1200, height: 900, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 40 } } }).png().toBuffer();
const telas = [
  { tipo: 'capa', texto: 'Saúde mental do cuidador: quem cuida de quem cuida?', titulo: 'Sinais de sobrecarga' },
  { tipo: 'texto', titulo: 'Sinais', texto: 'Cansaço constante, irritação e culpa.' },
  { tipo: 'final', titulo: 'Quer ler o texto completo?', texto: 'Link na descrição.', apoio: true },
];
const desvioTopo = async (buf) => {
  const { data, info } = await sharp(buf).extract({ left: 0, top: 0, width: 1080, height: 60 }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const media = data.reduce((s, v) => s + v, 0) / data.length;
  return Math.sqrt(data.reduce((s, v) => s + (v - media) ** 2, 0) / data.length);
};

test('padrão A (default) não muda: três telas 1080x1350', async () => {
  const { imagens } = await renderizarTelas(telas);
  assert.equal(imagens.length, 3);
  for (const img of imagens) assert.deepEqual([(await sharp(img).metadata()).width, (await sharp(img).metadata()).height], [1080, 1350]);
});

test('padrão B exige a imagem da capa', async () => {
  await assert.rejects(renderizarTelas(telas, { padrao: 'B' }), /exige a imagem da capa/);
});

test('padrão B põe a foto no topo da capa; o padrão A não tem foto ali', async () => {
  const foto = await capa();
  const a = await renderizarTelas(telas);
  const b = await renderizarTelas(telas, { padrao: 'B', capa: foto });
  assert.equal(b.imagens.length, 3);
  assert.ok((await desvioTopo(b.imagens[0])) > 20, 'faixa da foto no topo da capa B');
  assert.ok((await desvioTopo(a.imagens[0])) < 10, 'capa A sem foto no topo');
  assert.ok((await desvioTopo(b.imagens[1])) > 5, 'tira fina da foto nas telas seguintes');
});
