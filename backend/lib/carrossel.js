/**
 * Gera carrosséis de Instagram (imagens 1080x1350 + legenda com hashtags) a
 * partir de um artigo do blog.
 *
 * Arquitetura: este módulo é a única fonte de verdade da geração. Tanto a
 * rota administrativa (backend/routes/carrossel.js) quanto o script de linha
 * de comando (backend/tools/gerar-carrosseis.js) chamam as funções daqui —
 * nenhuma lógica de layout/legenda é duplicada entre os dois.
 *
 * Texto vira contorno vetorial (<path>), não <text>: o ambiente de funções
 * da Vercel roda o sharp/librsvg sem motor de texto (Pango/HarfBuzz) —
 * qualquer <text>, com ou sem fonte embutida via @font-face, sai como
 * caixas vazias ("tofu"). Convertendo cada linha para os contornos reais da
 * fonte com opentype.js (puro JS, sem binário nativo), a saída não depende
 * de o ambiente saber desenhar texto — só de saber desenhar <path>, que
 * funciona em qualquer build do libvips.
 *
 * Limitações conhecidas:
 *  - A quebra de linha é estimada por largura média de caractere, não
 *    medida de verdade. Títulos muito atípicos podem truncar com "…".
 *  - Fraunces/Inter são fontes variáveis; opentype.js não faz instanciamento
 *    de eixo de peso, então tudo usa a instância padrão (mais leve). Onde o
 *    design original pedia negrito, aplicamos um contorno (stroke) fino
 *    sobre o preenchimento para simular peso maior.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

/**
 * Fontes (Fraunces e Inter, licença OFL — as mesmas do site) carregadas uma
 * única vez, na carga do módulo, e usadas para gerar os contornos de cada
 * trecho de texto sob demanda.
 */
const PASTA_FONTES = path.join(__dirname, '..', 'assets', 'fonts');

function carregarFonte(nomeArquivo) {
  const buffer = fs.readFileSync(path.join(PASTA_FONTES, nomeArquivo));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return opentype.parse(arrayBuffer);
}

// Instâncias ESTÁTICAS (sem eixos de variação), geradas com fonttools a
// partir das variáveis originais. As variáveis "[wght]"/"[opsz]" causavam
// coordenadas NaN em alguns glifos ao gerar o contorno via opentype.js
// (suporte a variable font incompleto na lib) — instanciar um peso fixo
// resolve na raiz, sem depender do motor de texto do ambiente de runtime.
const FONTE_SERIF = carregarFonte('fraunces-static.ttf');
const FONTE_SANS = carregarFonte('inter-static.ttf');

// archiver@8 é publicado como ESM puro ("type": "module"). O runtime de
// funções da Vercel não aceita require() de ESM (ERR_REQUIRE_ESM) mesmo
// quando o Node local aceita — por isso o import é dinâmico, feito uma vez
// e cacheado, em vez de um require() no topo do arquivo.
let promessaZipArchive;
function carregarZipArchive() {
  if (!promessaZipArchive) {
    promessaZipArchive = import('archiver').then((mod) => mod.ZipArchive);
  }
  return promessaZipArchive;
}

/* ------------------------------- Paleta ---------------------------------- */
const COR = {
  verdeEscuro: '#0d3330',
  verde: '#185d58',
  verdeClaro: '#8cc4b8',
  areia: '#faf7f2',
  tinta: '#17211f',
  tintaMedia: '#45564f',
  dourado: '#c9a227',
  branco: '#ffffff',
};

const LARGURA = 1080;
const ALTURA = 1350;
const MARGEM = 84;
const LARGURA_UTIL = LARGURA - MARGEM * 2;

/* ------------------------------ Emojis/tags ------------------------------ */

const EMOJI_CATEGORIA = {
  'Relatos da Prática': '📖',
  'Pacientes & Famílias': '💬',
  'Pais & Famílias': '👨‍👩‍👧',
  'Médicos & Enfermeiros': '🩺',
  'Residentes & Estudantes': '🎓',
  'Empresas & RH': '🏢',
  Geral: '🧠',
};

const HASHTAGS_BASE = ['saude mental', 'saude mental brasil', 'psiquiatria', 'doutor saude mental'];

const HASHTAGS_CATEGORIA = {
  'Relatos da Prática': ['relatos da clinica', 'medicina de familia', 'atencao primaria', 'humanizacao em saude'],
  'Pacientes & Famílias': ['pacientes', 'familia', 'cuidado em saude', 'bem estar emocional'],
  'Pais & Famílias': ['maternidade', 'paternidade', 'saude mental infantil', 'criancas e adolescentes'],
  'Médicos & Enfermeiros': ['medicos', 'enfermagem', 'educacao medica', 'pratica clinica'],
  'Residentes & Estudantes': ['residencia medica', 'estudantes de medicina', 'formacao medica'],
  'Empresas & RH': ['saude mental no trabalho', 'rh', 'gestao de pessoas', 'qualidade de vida'],
  Geral: ['saude do trabalhador', 'burnout', 'bem estar'],
};

/* -------------------------------- Texto ----------------------------------- */

/** Remove tags HTML e normaliza espaços, devolvendo texto puro. */
function paraTextoPuro(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Corta o texto em `max` caracteres, respeitando fronteira de palavra. */
function truncar(texto, max) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return `${corte.slice(0, ultimoEspaco > max * 0.6 ? ultimoEspaco : max)}…`;
}

/**
 * Quebra um texto em linhas para desenhar em um SVG, medindo a largura real
 * de cada candidata na fonte (via larguraTexto) em vez de estimar por
 * contagem de caracteres — uma estimativa errada faz a linha ficar mais
 * larga que a área visível, e o excesso é cortado silenciosamente pelo
 * viewBox do SVG, em vez de quebrar para a linha seguinte.
 */
function quebrarLinhas(fonte, texto, larguraMaxPx, tamanhoFonte, { maxLinhas = 8 } = {}) {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas = [];
  let atual = '';

  for (const palavra of palavras) {
    const candidato = atual ? `${atual} ${palavra}` : palavra;
    if (larguraTexto(fonte, candidato, tamanhoFonte) > larguraMaxPx && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = candidato;
    }
  }
  if (atual) linhas.push(atual);

  if (linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas);
    let ultima = cortadas[maxLinhas - 1];
    while (ultima.length > 1 && larguraTexto(fonte, `${ultima}…`, tamanhoFonte) > larguraMaxPx) {
      ultima = ultima.slice(0, -1);
    }
    cortadas[maxLinhas - 1] = `${ultima}…`;
    return cortadas;
  }
  return linhas;
}

/** Escolhe um tamanho de fonte menor conforme o texto fica mais longo. */
function tamanhoAdaptativo(texto, tamanhos) {
  for (const { ate, tamanho } of tamanhos) {
    if (texto.length <= ate) return tamanho;
  }
  return tamanhos[tamanhos.length - 1].tamanho;
}

function hashtagify(texto) {
  return (
    '#' +
    String(texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
  );
}

/* --------------------------- Extração de blocos --------------------------- */

/** Extrai h2/h3/p/blockquote em ordem, como texto puro, do HTML do artigo. */
function extrairBlocos(conteudoHtml) {
  const re = /<h2>([\s\S]*?)<\/h2>|<h3>([\s\S]*?)<\/h3>|<p(?:\s[^>]*)?>([\s\S]*?)<\/p>|<blockquote>([\s\S]*?)<\/blockquote>/g;
  const blocos = [];
  let m;
  while ((m = re.exec(conteudoHtml))) {
    if (m[1] !== undefined) blocos.push({ tag: 'h2', texto: paraTextoPuro(m[1]) });
    else if (m[2] !== undefined) blocos.push({ tag: 'h3', texto: paraTextoPuro(m[2]) });
    else if (m[3] !== undefined) blocos.push({ tag: 'p', texto: paraTextoPuro(m[3]) });
    else if (m[4] !== undefined) blocos.push({ tag: 'blockquote', texto: paraTextoPuro(m[4]) });
  }
  return blocos.filter((b) => b.texto);
}

/**
 * Monta os slides do carrossel: capa, de 3 a 5 slides de conteúdo e uma
 * chamada final para ação. Usa os títulos H2 do artigo quando existem;
 * cai para parágrafos sequenciais em textos majoritariamente narrativos
 * (a maioria dos "Relatos da Prática").
 */
const MINIMO_SLIDES_CONTEUDO = 3;

function montarSlides(artigo) {
  const blocos = extrairBlocos(artigo.conteudo);
  const indicePrimeiroH2 = blocos.findIndex((b) => b.tag === 'h2');
  const secoesH2 = [];

  blocos.forEach((bloco, i) => {
    if (bloco.tag !== 'h2') return;
    let corpo = '';
    for (let j = i + 1; j < blocos.length && blocos[j].tag !== 'h2'; j++) {
      if (blocos[j].tag === 'p' || blocos[j].tag === 'blockquote') {
        corpo += (corpo ? ' ' : '') + blocos[j].texto;
      }
    }
    secoesH2.push({ titulo: bloco.texto, corpo });
  });

  const conteudoSlides = [];

  if (secoesH2.length === 0) {
    // Texto majoritariamente narrativo (a maioria dos "Relatos da Prática"
    // sem nenhum H2): usa os primeiros parágrafos em sequência.
    const paragrafos = blocos.filter((b) => b.tag === 'p').slice(0, 4);
    for (const p of paragrafos) {
      conteudoSlides.push({ tipo: 'conteudo', titulo: null, texto: truncar(p.texto, 280) });
    }
  } else {
    // Narrativas com só 1-2 H2 (comum nos relatos, que têm uma abertura longa
    // antes do único título) ficariam curtas demais só com as seções H2 — usa
    // os parágrafos de abertura (antes do primeiro H2) como slides extras.
    if (secoesH2.length < MINIMO_SLIDES_CONTEUDO && indicePrimeiroH2 > 0) {
      const abertura = blocos.slice(0, indicePrimeiroH2).filter((b) => b.tag === 'p');
      const faltam = MINIMO_SLIDES_CONTEUDO - secoesH2.length;
      for (const p of abertura.slice(0, faltam)) {
        conteudoSlides.push({ tipo: 'conteudo', titulo: null, texto: truncar(p.texto, 280) });
      }
    }
    for (const secao of secoesH2.slice(0, 5)) {
      conteudoSlides.push({
        tipo: 'conteudo',
        titulo: secao.titulo,
        texto: truncar(secao.corpo || secao.titulo, 260),
      });
    }
  }

  return [
    { tipo: 'capa', titulo: artigo.titulo, categoria: artigo.categoria },
    ...conteudoSlides,
    { tipo: 'cta', categoria: artigo.categoria },
  ];
}

/* --------------------------------- SVG ------------------------------------ */

/**
 * Soma da largura de cada glifo (sem kerning) — evita font.getAdvanceWidth,
 * que passa pelo mesmo pipeline de shaping problemático descrito abaixo.
 */
function larguraTexto(fonte, texto, tamanhoFonte) {
  const escala = tamanhoFonte / fonte.unitsPerEm;
  let largura = 0;
  for (const caractere of texto) {
    largura += (fonte.charToGlyph(caractere).advanceWidth || 0) * escala;
  }
  return largura;
}

/**
 * Converte um trecho de texto no contorno vetorial da fonte, como <path>.
 *
 * Não usa `fonte.getPath(texto, ...)` (a conveniência de alto nível do
 * opentype.js): para certas fontes variáveis ela aciona um pipeline de
 * shaping (ligaduras/GSUB) que lança "substFormat: 2 is not yet supported".
 * Em vez disso, cada caractere vira um glifo e um avanço horizontal próprio
 * — sem ligaduras nem kerning, dispensáveis para títulos/legendas em
 * português nestes tamanhos.
 *
 * Duas peculiaridades do opentype.js, contornadas aqui:
 *  1. `glyph.getPath(x, y, …)` produz coordenadas "NaN" quando x fica grande
 *     — por isso cada glifo é calculado em (0,0) e só depois deslocado por
 *     `transform`, nunca pedindo o contorno já na coordenada final.
 *  2. Abaixo de ~78px de tamanho de fonte, o achatamento de curvas de
 *     alguns glifos (ex.: "a") sai corrompido — por isso o contorno é
 *     sempre calculado no tamanho de referência `TAMANHO_BASE_GLIFO`
 *     (bem acima desse limiar) e a fonte final é obtida só por um
 *     `scale()` no grupo, nunca reduzindo o tamanho pedido ao opentype.js.
 */
const TAMANHO_BASE_GLIFO = 200;

function caminhoTexto(fonte, texto, x, y, tamanhoFonte, cor, { negrito = false, opacidade } = {}) {
  if (!texto) return '';
  const escalaBase = TAMANHO_BASE_GLIFO / fonte.unitsPerEm;
  const fatorFinal = tamanhoFonte / TAMANHO_BASE_GLIFO;
  let xAtual = 0;
  const glifos = [];
  for (const caractere of texto) {
    const glyph = fonte.charToGlyph(caractere);
    const trecho = glyph.getPath(0, 0, TAMANHO_BASE_GLIFO).toPathData(1);
    if (trecho) glifos.push(`<path d="${trecho}" transform="translate(${xAtual.toFixed(2)},0)"/>`);
    xAtual += (glyph.advanceWidth || 0) * escalaBase;
  }
  if (!glifos.length) return '';
  // stroke-width é definido no espaço PRÉ-escala, por isso não multiplica
  // por tamanhoFonte aqui — o scale() do grupo já cuida da proporção final.
  const traco = negrito ? ` stroke="${cor}" stroke-width="5.6" stroke-linejoin="round"` : '';
  const opacidadeAttr = opacidade !== undefined ? ` opacity="${opacidade}"` : '';
  return `<g transform="translate(${x},${y}) scale(${fatorFinal.toFixed(5)})" fill="${cor}"${traco}${opacidadeAttr}>${glifos.join('')}</g>`;
}

/** Mesma coisa, para várias linhas já quebradas (uma abaixo da outra). */
function caminhoLinhas(fonte, linhas, x, yInicial, alturaLinha, tamanhoFonte, cor, opcoes) {
  return linhas.map((linha, i) => caminhoTexto(fonte, linha, x, yInicial + i * alturaLinha, tamanhoFonte, cor, opcoes)).join('');
}

/** opentype.js não tem text-anchor — calcula a largura real e desloca x. */
function caminhoTextoDireita(fonte, texto, xDireita, y, tamanhoFonte, cor, opcoes) {
  const largura = larguraTexto(fonte, texto, tamanhoFonte);
  return caminhoTexto(fonte, texto, xDireita - largura, y, tamanhoFonte, cor, opcoes);
}

function pillCategoria(categoria, x, y, escura) {
  const texto = categoria.toUpperCase();
  const tamanhoFonte = 22;
  const corFundo = escura ? 'rgba(255,255,255,0.12)' : COR.verde;
  const largura = larguraTexto(FONTE_SANS, texto, tamanhoFonte) + 56;
  return `
    <rect x="${x}" y="${y}" width="${largura}" height="52" rx="26" fill="${corFundo}" />
    ${caminhoTexto(FONTE_SANS, texto, x + 28, y + 34, tamanhoFonte, COR.branco, { negrito: true })}`;
}

function rodapeMarca(escura) {
  const y = ALTURA - 76;
  const cor = escura ? 'rgba(255,255,255,0.75)' : COR.tintaMedia;
  const corForte = escura ? COR.branco : COR.verdeEscuro;
  return `
    <circle cx="${MARGEM + 14}" cy="${y}" r="14" fill="${COR.dourado}" />
    ${caminhoTexto(FONTE_SANS, 'Dr. Antônio Felipe', MARGEM + 40, y + 7, 24, corForte, { negrito: true })}
    ${caminhoTexto(FONTE_SANS, '@doutor.antoniofelipe.smental', MARGEM + 40, y + 32, 20, cor)}`;
}

function indicadorPagina(indice, total, escura) {
  const cor = escura ? 'rgba(255,255,255,0.6)' : COR.tintaMedia;
  return caminhoTextoDireita(FONTE_SANS, `${indice + 1}/${total}`, LARGURA - MARGEM, MARGEM + 8, 24, cor);
}

function renderizarSlideCapa(slide, indice, total) {
  const tamanho = tamanhoAdaptativo(slide.titulo, [
    { ate: 45, tamanho: 78 },
    { ate: 75, tamanho: 64 },
    { ate: 110, tamanho: 54 },
    { ate: 999, tamanho: 46 },
  ]);
  const linhas = quebrarLinhas(FONTE_SERIF, slide.titulo, LARGURA_UTIL, tamanho, { maxLinhas: 7 });
  const alturaLinha = tamanho * 1.18;
  const blocoAltura = linhas.length * alturaLinha;
  const yInicio = (ALTURA - blocoAltura) / 2 - 40;

  return `
    <rect width="100%" height="100%" fill="${COR.verdeEscuro}" />
    ${pillCategoria(slide.categoria, MARGEM, 90, true)}
    ${indicadorPagina(indice, total, true)}
    ${caminhoLinhas(FONTE_SERIF, linhas, MARGEM, yInicio, alturaLinha, tamanho, COR.branco, { negrito: true })}
    <rect x="${MARGEM}" y="${yInicio + blocoAltura + 36}" width="90" height="5" rx="2.5" fill="${COR.dourado}" />
    ${rodapeMarca(true)}
    ${caminhoTextoDireita(FONTE_SANS, 'deslize →', LARGURA - MARGEM, ALTURA - 68, 22, 'rgba(255,255,255,0.55)')}`;
}

function renderizarSlideConteudo(slide, indice, total, categoria) {
  const temTitulo = Boolean(slide.titulo);
  const tamanhoTitulo = temTitulo
    ? tamanhoAdaptativo(slide.titulo, [
        { ate: 35, tamanho: 54 },
        { ate: 60, tamanho: 46 },
        { ate: 999, tamanho: 40 },
      ])
    : 0;
  const linhasTitulo = temTitulo ? quebrarLinhas(FONTE_SERIF, slide.titulo, LARGURA_UTIL, tamanhoTitulo, { maxLinhas: 3 }) : [];
  const alturaLinhaTitulo = tamanhoTitulo * 1.22;

  const tamanhoTexto = 38;
  const linhasTexto = quebrarLinhas(FONTE_SANS, slide.texto, LARGURA_UTIL, tamanhoTexto, { maxLinhas: temTitulo ? 8 : 11 });
  const alturaLinhaTexto = tamanhoTexto * 1.5;

  const espacoTituloTexto = 50;
  const alturaTitulo = temTitulo ? linhasTitulo.length * alturaLinhaTitulo + espacoTituloTexto : 90;
  const alturaTexto = linhasTexto.length * alturaLinhaTexto;
  const alturaBloco = alturaTitulo + alturaTexto;

  // Centraliza o bloco (título+texto) na área útil entre o selo do topo e o rodapé.
  const topoAreaUtil = 210;
  const baseAreaUtil = ALTURA - 180;
  const yBloco = Math.max(topoAreaUtil, topoAreaUtil + (baseAreaUtil - topoAreaUtil - alturaBloco) / 2);
  const yTitulo = yBloco + (temTitulo ? tamanhoTitulo * 0.9 : 70);
  const yTexto = yBloco + alturaTitulo + tamanhoTexto * 0.9;

  return `
    <rect width="100%" height="100%" fill="${COR.areia}" />
    ${pillCategoria(categoria, MARGEM, 90, false)}
    ${indicadorPagina(indice, total, false)}
    ${
      temTitulo
        ? caminhoLinhas(FONTE_SERIF, linhasTitulo, MARGEM, yTitulo, alturaLinhaTitulo, tamanhoTitulo, COR.verdeEscuro, { negrito: true })
        : caminhoTexto(FONTE_SERIF, '“', MARGEM, yBloco + 60, 90, COR.dourado, { opacidade: 0.5 })
    }
    ${caminhoLinhas(FONTE_SANS, linhasTexto, MARGEM, yTexto, alturaLinhaTexto, tamanhoTexto, COR.tintaMedia)}
    ${rodapeMarca(false)}`;
}

function renderizarSlideCta(slide, indice, total) {
  const linhas1 = quebrarLinhas(FONTE_SERIF, 'Quer conversar sobre isso?', LARGURA_UTIL, 62, { maxLinhas: 2 });
  const linhas2 = quebrarLinhas(
    FONTE_SANS,
    'Agende uma consulta ou tire suas dúvidas — link na bio.',
    LARGURA_UTIL,
    34,
    { maxLinhas: 3 }
  );

  return `
    <rect width="100%" height="100%" fill="${COR.verdeEscuro}" />
    ${pillCategoria(slide.categoria, MARGEM, 90, true)}
    ${indicadorPagina(indice, total, true)}
    ${caminhoLinhas(FONTE_SERIF, linhas1, MARGEM, 560, 74, 62, COR.branco, { negrito: true })}
    ${caminhoLinhas(FONTE_SANS, linhas2, MARGEM, 560 + linhas1.length * 74 + 50, 46, 34, 'rgba(255,255,255,0.82)')}
    <rect x="${MARGEM}" y="${ALTURA - 260}" width="90" height="5" rx="2.5" fill="${COR.dourado}" />
    ${caminhoTexto(FONTE_SANS, 'doutor.antoniofelipe.saudemental@gmail.com', MARGEM, ALTURA - 210, 28, 'rgba(255,255,255,0.75)')}
    ${rodapeMarca(true)}`;
}

function renderizarSlideSVG(slide, indice, total, categoria) {
  let miolo;
  if (slide.tipo === 'capa') miolo = renderizarSlideCapa(slide, indice, total);
  else if (slide.tipo === 'cta') miolo = renderizarSlideCta(slide, indice, total);
  else miolo = renderizarSlideConteudo(slide, indice, total, categoria);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">${miolo}</svg>`;
}

/* -------------------------------- Legenda ---------------------------------- */

function montarLegenda(artigo, slides) {
  const emoji = EMOJI_CATEGORIA[artigo.categoria] || '🧠';
  const topicos = slides
    .filter((s) => s.tipo === 'conteudo' && s.titulo)
    .map((s) => `→ ${s.titulo}`);

  const linhas = [
    `${emoji} ${artigo.titulo}`,
    '',
    artigo.resumo,
  ];

  if (topicos.length > 0) {
    linhas.push('', 'Neste carrossel:', ...topicos);
  }

  linhas.push('', 'Quer conversar sobre isso? Agende uma consulta — link na bio.');

  const nomesHashtag = [
    ...HASHTAGS_BASE,
    ...(HASHTAGS_CATEGORIA[artigo.categoria] || []),
    ...(artigo.tags || []),
  ];
  const vistos = new Set();
  const hashtags = [];
  for (const nome of nomesHashtag) {
    const tag = hashtagify(nome);
    if (tag.length > 1 && !vistos.has(tag)) {
      vistos.add(tag);
      hashtags.push(tag);
    }
    if (hashtags.length >= 20) break;
  }

  return { texto: linhas.join('\n'), hashtags };
}

/* ---------------------------- Geração de saída ------------------------------ */

/** Gera os buffers PNG (um por slide) e a legenda de um artigo. */
async function gerarCarrossel(artigo) {
  const slides = montarSlides(artigo);
  const { texto: legenda, hashtags } = montarLegenda(artigo, slides);

  const imagens = await Promise.all(
    slides.map(async (slide, indice) => {
      const svg = renderizarSlideSVG(slide, indice, slides.length, artigo.categoria);
      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      return { indice, tipo: slide.tipo, tituloSlide: slide.titulo || null, buffer };
    })
  );

  return { slug: artigo.slug, titulo: artigo.titulo, legenda, hashtags, imagens };
}

/** Empacota o resultado de gerarCarrossel em um .zip (Buffer). */
async function empacotarZip({ slug, legenda, hashtags, imagens }) {
  const ZipArchive = await carregarZipArchive();
  return new Promise((resolve, reject) => {
    const arquivo = new ZipArchive({ zlib: { level: 9 } });
    const partes = [];
    arquivo.on('data', (d) => partes.push(d));
    arquivo.on('end', () => resolve(Buffer.concat(partes)));
    arquivo.on('error', reject);

    imagens.forEach((img) => {
      const nome = `${String(img.indice + 1).padStart(2, '0')}-${img.tipo}.png`;
      arquivo.append(img.buffer, { name: nome });
    });
    arquivo.append(`${legenda}\n\n${hashtags.join(' ')}\n`, { name: 'legenda.txt' });
    arquivo.append(`slug: ${slug}\ngerado em: ${new Date().toISOString()}\n`, { name: 'info.txt' });

    arquivo.finalize();
  });
}

module.exports = {
  montarSlides,
  montarLegenda,
  renderizarSlideSVG,
  gerarCarrossel,
  empacotarZip,
  LARGURA,
  ALTURA,
};
