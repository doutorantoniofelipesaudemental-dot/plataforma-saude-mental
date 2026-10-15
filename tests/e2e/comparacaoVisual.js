// Comparação visual TOLERANTE para os miniapps (substitui o toHaveScreenshot exato).
// Por quê: o toHaveScreenshot exige tamanho idêntico e pixel quase idêntico; qualquer mudança de texto acima do miniapp desloca o elemento
// em posição fracionária (altura 1878 vs 1879, serrilhado diferente) e quebrava o teste sem defeito real (diferenças de 1,4% a 6% dos pixels).
// Como funciona: mesma largura; altura com diferença de até 2 px; as duas imagens são reduzidas a uma grade grossa (cada célula = média de
// ~5x5 px), o que apaga serrilhado e deslocamentos de 1 px; aprova se, no máximo, 1,5% das células mudar de cor de forma relevante (soma dos
// canais > 90). Defeito real (bloco movido, elemento sumido ou sobreposto, cor errada, quebra de linha diferente, altura +3 px) altera
// células inteiras e foge da janela. Calibração: ver tests/unit/comparacao-visual.test.js (casos sintéticos) e o relatório de 15/10/2026.
const TOLERANCIA = { alturaPx: 2, celulaPx: 5, limiarCelula: 90, razaoMax: 0.015 };

async function grade(entrada, larguraCelulas, alturaCelulas) {
  const sharp = require('sharp');
  const { data } = await sharp(entrada).removeAlpha().resize(larguraCelulas, alturaCelulas, { fit: 'fill', kernel: 'cubic' }).raw().toBuffer({ resolveWithObject: true });
  return data;
}

async function compararComTolerancia(bufAtual, caminhoBase) {
  const sharp = require('sharp');
  const ma = await sharp(bufAtual).metadata(), mb = await sharp(caminhoBase).metadata();
  if (ma.width !== mb.width) return { ok: false, motivo: `largura ${mb.width} -> ${ma.width}` };
  if (Math.abs(ma.height - mb.height) > TOLERANCIA.alturaPx) return { ok: false, motivo: `altura ${mb.height} -> ${ma.height} (tolerância ±${TOLERANCIA.alturaPx} px)` };
  const w = Math.max(1, Math.round(ma.width / TOLERANCIA.celulaPx)), h = Math.max(1, Math.round(Math.min(ma.height, mb.height) / TOLERANCIA.celulaPx));
  const [a, b] = await Promise.all([grade(bufAtual, w, h), grade(caminhoBase, w, h)]);
  let diferentes = 0;
  for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > TOLERANCIA.limiarCelula) diferentes += 1;
  const razao = diferentes / (w * h);
  return { ok: razao <= TOLERANCIA.razaoMax, razao, motivo: `${(razao * 100).toFixed(2)}% das células diferem (máx. ${(TOLERANCIA.razaoMax * 100).toFixed(1)}%)` };
}

module.exports = { compararComTolerancia, TOLERANCIA };
// Calibração (15/10/2026): capturas reais que quebravam o teste exato ficaram entre 0,02% e 0,81% das células; defeitos sintéticos
// (bloco 160x120 invertido, faixa de 200 px movida 10 px) deram 2,6%; altura +3 px é recusada pela regra de altura. Limite 1,5% = meio da folga.
