/**
 * Carrossel a partir de um rascunho APROVADO pelo médico
 * (CONTEUDO_INSTAGRAM/aprovados/<slug>.md, ver scripts/bot-aprovar.js).
 *
 * `lerAprovado` extrai do Markdown os slides (texto + sugestão visual), a
 * legenda e os posts de LinkedIn; `renderizarSlides` desenha cada slide em
 * PNG 1080×1350 com as fontes e a paleta do site (mesma técnica da capa 4:5,
 * capaRedes.js). O texto do slide é exatamente o aprovado — nada é reescrito.
 * Um `Rodapé pequeno: "..."` na coluna de sugestão visual vira a linha de
 * rodapé do slide (ex.: a fonte de um dado).
 */
const sharp = require('sharp');
const { FONTE_SERIF, FONTE_SANS, COR, MARGEM, quebrarLinhas, caminhoTexto, caminhoLinhas } = require('./carrossel');
const { IDENTIFICACAO } = require('./legendaInstagram');

const LARGURA = 1080;
const ALTURA = 1350;
const LARGURA_UTIL = LARGURA - MARGEM * 2;
const MARCA = 'Dr. Antônio Felipe · Saúde Mental';

/** Divide uma linha de tabela Markdown respeitando "\|" escapado. */
function celulas(linha) {
  return linha
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());
}

function secao(md, titulo) {
  const i = md.search(new RegExp(`^#{2,3} ${titulo}`, 'm'));
  if (i < 0) return '';
  const resto = md.slice(i).split('\n').slice(1).join('\n');
  const fim = resto.search(/^#{2,3} /m);
  return fim < 0 ? resto : resto.slice(0, fim);
}

const citacao = (bloco) =>
  bloco
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => l.replace(/^> ?/, ''))
    .join('\n')
    .trim();

function lerAprovado(md) {
  const tituloArtigo = (md.match(/^# (?:APROVADO|RASCUNHO) — (.+)$/m) || [])[1] || '';
  const slides = secao(md, 'Carrossel')
    .split('\n')
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => {
      const [numero, texto, visual = ''] = celulas(l);
      const rodape = (visual.match(/Rodapé pequeno:\s*"([^"]+)"/i) || [])[1] || '';
      return { numero: Number(numero), texto, visual, rodape };
    });
  const rodapeUltimo = (md.match(/^Rodapé do último slide:\s*(.+)$/m) || [])[1] || IDENTIFICACAO;
  const legenda = citacao(secao(md, 'Legenda'));
  const linkedin = [...md.matchAll(/^## (LinkedIn \d+: .+)$/gm)].map((m) => ({ titulo: m[1], texto: citacao(secao(md, m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) }));
  return { tituloArtigo, slides, rodapeUltimo, legenda, linkedin };
}

function tamanhoPara(texto, faixas) {
  return faixas.find((f) => texto.length <= f.ate).tamanho;
}

function svgSlide(slide, indice, total, { rodapeUltimo }) {
  const capa = indice === 0;
  const ultimo = indice === total - 1;
  const escuro = capa || ultimo;
  const fundo = escuro ? COR.verdeEscuro : COR.areia;
  const corTexto = escuro ? COR.branco : COR.verdeEscuro;
  const corSuave = escuro ? 'rgba(255,255,255,0.72)' : COR.tintaMedia;

  const fonte = capa ? FONTE_SERIF : FONTE_SANS;
  const tamanho = capa
    ? tamanhoPara(slide.texto, [{ ate: 60, tamanho: 84 }, { ate: 110, tamanho: 70 }, { ate: Infinity, tamanho: 60 }])
    : tamanhoPara(slide.texto, [{ ate: 90, tamanho: 50 }, { ate: 150, tamanho: 44 }, { ate: Infinity, tamanho: 40 }]);
  const linhas = quebrarLinhas(fonte, slide.texto, LARGURA_UTIL, tamanho, { maxLinhas: 10 });
  const alturaLinha = tamanho * (capa ? 1.14 : 1.42);
  const topo = 200;
  const base = ALTURA - (ultimo ? 300 : 200);
  const yBloco = Math.max(topo, topo + (base - topo - linhas.length * alturaLinha) / 2);

  const rodapes = [];
  if (slide.rodape) rodapes.push(slide.rodape);
  // Identificação em duas linhas fixas (CRM numa, especialidade + RQE na outra): nunca separa "RQE" do número.
  if (ultimo) {
    const i = rodapeUltimo.indexOf(' · Medicina');
    rodapes.push(...(i > 0 ? [rodapeUltimo.slice(0, i), rodapeUltimo.slice(i + 3)] : quebrarLinhas(FONTE_SANS, rodapeUltimo, LARGURA_UTIL, 22, { maxLinhas: 3 })));
  }
  const yRodape = ALTURA - 150 - (rodapes.length - 1) * 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
    <rect width="100%" height="100%" fill="${fundo}" />
    ${caminhoTexto(FONTE_SANS, `${indice + 1}/${total}`, LARGURA - MARGEM - 60, MARGEM + 20, 26, corSuave)}
    ${caminhoLinhas(fonte, linhas, MARGEM, yBloco + tamanho * 0.9, alturaLinha, tamanho, corTexto, { negrito: capa })}
    ${capa ? `<rect x="${MARGEM}" y="${(yBloco + linhas.length * alturaLinha + 20).toFixed(1)}" width="96" height="6" rx="3" fill="${COR.dourado}" />` : ''}
    ${rodapes.map((r, i) => caminhoTexto(FONTE_SANS, r, MARGEM, yRodape + i * 30, 22, corSuave)).join('')}
    <circle cx="${MARGEM + 10}" cy="${ALTURA - 76 - 8}" r="10" fill="${COR.dourado}" />
    ${caminhoTexto(FONTE_SANS, MARCA, MARGEM + 32, ALTURA - 76, 26, corTexto, { negrito: true })}
  </svg>`;
}

/** PNG de cada slide, na ordem. */
async function renderizarSlides(aprovado) {
  const total = aprovado.slides.length;
  return Promise.all(
    aprovado.slides.map(async (slide, i) => ({
      numero: slide.numero,
      buffer: await sharp(Buffer.from(svgSlide(slide, i, total, aprovado))).png().toBuffer(),
    }))
  );
}

module.exports = { lerAprovado, renderizarSlides, celulas };
