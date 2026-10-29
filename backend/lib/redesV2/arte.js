/**
 * Arte 1080×1350 (4:5) do fluxo novo de redes. Identidade única: azul-marinho + dourado + branco, alto contraste
 * (branco/dourado sobre marinho ≥ 12:1), letra grande, uma ideia por tela. Texto vira contorno vetorial
 * (opentype.js → <path>), como em carrossel.js, e é rasterizado pelo sharp.
 * Assinatura em TODA arte, com acento: "Dr. Antônio Felipe · Médico · CRM-BA 41322 · RQE 26638 – Medicina de Família e Comunidade".
 * O §F antigo ("Antonio" sem acento nas artes) foi revogado em 14/10/2026; as fontes Fraunces/Inter têm "ô":
 * `glifosAusentes` reprova qualquer arte cujo texto tenha caractere sem glifo (acento quebrado = tofu).
 */
const sharp = require('sharp');
const { FONTE_SERIF, FONTE_SANS, caminhoTexto, caminhoLinhas, quebrarLinhas, larguraTexto, LARGURA, ALTURA, MARGEM } = require('../carrossel');

const COR = { marinho: '#0b1f3a', marinhoClaro: '#13315c', dourado: '#d4af37', branco: '#ffffff', suave: 'rgba(255,255,255,0.82)' };
const LARGURA_UTIL = LARGURA - MARGEM * 2;
const CREDITO = 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito'; // crédito discreto no último cartão (16/10/2026)
// Assinatura de 3 linhas (padrão de mídias sociais, CLAUDE.md §1.B). A 3ª linha cabe em 22 px (853 de 912 px úteis).
const ASSINATURA = [
  'Dr. Antônio Felipe · Médico · CRM-BA 41322',
  'RQE 26638 – Medicina de Família e Comunidade',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
];

const fundo = (id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COR.marinho}"/><stop offset="1" stop-color="${COR.marinhoClaro}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#${id})"/>`;
const assinatura = () => `<rect x="${MARGEM}" y="${ALTURA - 150}" width="${LARGURA_UTIL}" height="2" fill="${COR.dourado}" opacity="0.7"/>
  ${caminhoTexto(FONTE_SANS, ASSINATURA[0], MARGEM, ALTURA - 110, 28, COR.branco, { negrito: true })}
  ${caminhoTexto(FONTE_SANS, ASSINATURA[1], MARGEM, ALTURA - 78, 26, COR.suave)}
  ${caminhoTexto(FONTE_SANS, ASSINATURA[2], MARGEM, ALTURA - 48, 22, COR.suave)}`;
const contador = (i, n) => caminhoTexto(FONTE_SANS, `${i + 1}/${n}`, LARGURA - MARGEM - larguraTexto(FONTE_SANS, `${i + 1}/${n}`, 26), 100, 26, COR.suave);
const barraOuro = (y) => `<rect x="${MARGEM}" y="${y}" width="96" height="6" rx="3" fill="${COR.dourado}"/>`;

/** Todos os caracteres desenhados precisam ter glifo na fonte (senão sairia um quadrado/ausente). */
function glifosAusentes(textos, fonte) {
  const ausentes = new Set();
  for (const t of textos) for (const c of String(t)) if (c.trim() && fonte.charToGlyph(c).index === 0) ausentes.add(c);
  return [...ausentes];
}

function blocoCentralizado(linhas, tamanho, alturaLinha, yTopo, yBase) {
  const h = linhas.length * alturaLinha;
  return Math.max(yTopo, yTopo + (yBase - yTopo - h) / 2) + tamanho * 0.85;
}

function svgTela(tela, i, total, padrao = 'A') {
  let miolo;
  if (tela.tipo === 'capa') {
    const tam = tela.texto.length <= 60 ? 84 : tela.texto.length <= 100 ? 72 : 60;
    const linhas = quebrarLinhas(FONTE_SERIF, tela.texto, LARGURA_UTIL, tam, { maxLinhas: 7 });
    const y = blocoCentralizado(linhas, tam, tam * 1.2, padrao === 'B' ? 700 : 180, ALTURA - 360);
    const sub = tela.titulo && tela.titulo !== tela.texto ? quebrarLinhas(FONTE_SANS, tela.titulo, LARGURA_UTIL, 32, { maxLinhas: 3 }) : [];
    const corpo = `${caminhoLinhas(FONTE_SERIF, linhas, MARGEM, y, tam * 1.2, tam, COR.branco, { negrito: true })}
      ${barraOuro(y + linhas.length * tam * 1.2 - tam * 0.4)}
      ${caminhoLinhas(FONTE_SANS, sub, MARGEM, y + linhas.length * tam * 1.2 + 60, 44, 32, COR.suave)}
      ${caminhoTexto(FONTE_SANS, 'Deslize para o lado', LARGURA - MARGEM - larguraTexto(FONTE_SANS, 'Deslize para o lado', 26), ALTURA - 190, 26, COR.dourado)}`;
    // No padrão B a faixa da foto (composta por renderizarTelas) cobre o topo: sem fundo nem contador por cima dela.
    miolo = padrao === 'B' ? corpo : `${fundo('g')}${contador(i, total)}${corpo}`;
  } else if (tela.tipo === 'final') {
    const linhas = quebrarLinhas(FONTE_SERIF, tela.titulo, LARGURA_UTIL, 76, { maxLinhas: 3 });
    miolo = `${fundo('g')}${contador(i, total)}${caminhoLinhas(FONTE_SERIF, linhas, MARGEM, 470, 92, 76, COR.branco, { negrito: true })}
      ${barraOuro(470 + linhas.length * 92 - 40)}
      ${caminhoTexto(FONTE_SANS, tela.texto, MARGEM, 470 + linhas.length * 92 + 50, 44, COR.dourado, { negrito: true })}
      ${tela.apoio ? caminhoTexto(FONTE_SANS, 'Em crise: CVV 188 · SAMU 192', MARGEM, ALTURA - 230, 38, COR.branco, { negrito: true }) : ''}
      ${caminhoTexto(FONTE_SANS, CREDITO, MARGEM, ALTURA - 178, 24, COR.suave)}`;
  } else {
    const tamT = 50, tamX = tela.tipo === 'trecho' ? 46 : 44;
    const lt = tela.titulo ? quebrarLinhas(FONTE_SERIF, tela.titulo, LARGURA_UTIL, tamT, { maxLinhas: 3 }) : [];
    const lx = quebrarLinhas(tela.tipo === 'trecho' ? FONTE_SERIF : FONTE_SANS, tela.texto, LARGURA_UTIL, tamX, { maxLinhas: 9 });
    const altT = lt.length * tamT * 1.22 + (lt.length ? 44 : 0), altX = lx.length * tamX * 1.5;
    const y0 = Math.max(210, 210 + (ALTURA - 220 - 210 - (altT + altX)) / 2);
    miolo = `${fundo('g')}${contador(i, total)}
      ${tela.tipo === 'trecho' ? caminhoTexto(FONTE_SERIF, '“', MARGEM, y0 + 20, 110, COR.dourado, { opacidade: 0.7 }) : ''}
      ${lt.length ? caminhoLinhas(FONTE_SERIF, lt, MARGEM, y0 + tamT * 0.9, tamT * 1.22, tamT, COR.dourado, { negrito: true }) : ''}
      ${caminhoLinhas(tela.tipo === 'trecho' ? FONTE_SERIF : FONTE_SANS, lx, MARGEM, y0 + altT + tamX * 0.95 + (tela.tipo === 'trecho' ? 40 : 0), tamX * 1.5, tamX, COR.branco)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">${miolo}${assinatura()}</svg>`;
}

// Padrão B (ordem de 28/10/2026, em teste): capa com a foto numa faixa no topo e o título numa faixa sólida embaixo;
// nas demais telas, uma tira fina da mesma foto no topo. Só vale com `padrao: 'B'` e a imagem da capa. O padrão A segue como default.
const FAIXA_CAPA_B = 567;
const TIRA_B = { y: 250, altura: 18 };

async function renderizarTelas(telas, { padrao = 'A', capa } = {}) {
  if (padrao === 'B' && !capa) throw new Error('padrão B exige a imagem da capa');
  const total = telas.length;
  const textos = [...ASSINATURA, CREDITO, 'Deslize para o lado', 'Em crise: CVV 188 · SAMU 192', ...telas.flatMap((t) => [t.titulo, t.texto].filter(Boolean))];
  const ausentes = [...glifosAusentes(textos, FONTE_SANS), ...glifosAusentes(textos, FONTE_SERIF)];
  const imagens = [];
  const faixaCapa = padrao === 'B' ? await sharp(capa).resize({ width: LARGURA, height: FAIXA_CAPA_B, fit: 'cover', position: 'centre' }).toBuffer() : null;
  for (const [i, t] of telas.entries()) {
    if (padrao !== 'B') { imagens.push(await sharp(Buffer.from(svgTela(t, i, total))).png().toBuffer()); continue; }
    if (i === 0) {
      const base = sharp({ create: { width: LARGURA, height: ALTURA, channels: 3, background: COR.marinho } });
      imagens.push(await base.composite([{ input: faixaCapa, top: 0, left: 0 }, { input: Buffer.from(svgTela(t, i, total, 'B')) }]).png().toBuffer());
    } else {
      const tira = await sharp(faixaCapa).extract({ left: 0, top: TIRA_B.y, width: LARGURA, height: TIRA_B.altura }).toBuffer();
      const png = await sharp(Buffer.from(svgTela(t, i, total))).composite([{ input: tira, top: 0, left: 0 }]).png().toBuffer();
      imagens.push(png);
    }
  }
  return { imagens, glifosAusentes: [...new Set(ausentes)] };
}

const textoAlternativo = (tela, i, total) => {
  const corpo = [tela.titulo, tela.texto].filter(Boolean).map((x) => String(x).replace(/[.\s]+$/, '')).join('. ');
  const credito = tela.tipo === 'final' ? ` ${CREDITO}.` : '';
  return `Tela ${i + 1} de ${total}, fundo azul-marinho com detalhes dourados: ${corpo}.${credito} Assinatura: Dr. Antônio Felipe, médico, CRM-BA 41322, RQE 26638, Medicina de Família e Comunidade. Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS).`;
};

module.exports = { renderizarTelas, textoAlternativo, glifosAusentes, ASSINATURA, COR, CREDITO };
