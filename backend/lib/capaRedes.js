/**
 * Capa 4:5 (1080×1350) de cada artigo para o feed do Instagram.
 *
 * A `imagemCapa` do artigo continua sendo a capa do SITE (1200×630, og:image,
 * com aspect-ratio fixo no CSS — ver Seção 19.3): trocá-la por 4:5 quebraria
 * o layout e o CLS das páginas. A capa das redes fica num campo próprio,
 * `capaRedes`, gerada aqui a partir do título, com as mesmas fontes (Fraunces
 * e Inter) e a mesma técnica de desenho do carrossel (texto → contorno
 * vetorial via opentype.js, rasterizado pelo sharp), que funciona nas funções
 * da Vercel sem motor de texto do sistema.
 *
 * `capaRedes.hash` (SHA-256 do PNG) é o que a checagem visual usa para provar
 * que a imagem publicada é esta — com o título deste artigo — e que não é
 * repetida de outro artigo.
 */
const crypto = require('crypto');
const sharp = require('sharp');
const {
  FONTE_SERIF,
  FONTE_SANS,
  COR,
  MARGEM,
  quebrarLinhas,
  caminhoTexto,
  caminhoLinhas,
  larguraTexto,
} = require('./carrossel');

const LARGURA = 1080;
const ALTURA = 1350;
const LARGURA_UTIL = LARGURA - MARGEM * 2;
// Muda sempre que o desenho mudar: capas de um modelo anterior são refeitas
// pela fila antes de publicar (garantirCapaRedes).
const MODELO = 'capa-4x5-v2';
const MARCA = 'Dr. Antônio Felipe · Saúde Mental';

const TAMANHOS_TITULO = [
  { ate: 40, tamanho: 104 },
  { ate: 70, tamanho: 88 },
  { ate: 100, tamanho: 76 },
  { ate: 140, tamanho: 66 },
  { ate: Infinity, tamanho: 58 },
];

function tamanhoTitulo(titulo) {
  return TAMANHOS_TITULO.find((t) => titulo.length <= t.ate).tamanho;
}

// "Geral" não diz nada no selo: nessa categoria o selo mostra o tema tirado
// do título (o primeiro que casar) ou some.
const TEMAS_SELO = [
  [/professor|docente|escola/i, 'Professores'],
  [/m[eé]dic[oa]s?|enfermeir/i, 'Médicos & Enfermeiros'],
  [/resid[eê]ncia|residentes/i, 'Residência médica'],
  [/crian[cç]a|infantil|infância/i, 'Infância'],
  [/adolescen/i, 'Adolescência'],
  [/idos[oa]|envelhec|terceira idade/i, 'Terceira idade'],
  [/cuidador/i, 'Cuidadores'],
  [/gesta[cç]|puerp|materni|amamenta/i, 'Maternidade'],
  [/trabalh|empresa|gestor|lideran|RH/i, 'Saúde no trabalho'],
  [/aten[cç][aã]o prim[aá]ria|APS/i, 'Atenção primária'],
  [/luto/i, 'Luto'],
  [/ansiedade/i, 'Ansiedade'],
  [/depress/i, 'Depressão'],
];

function textoDoSelo(artigo) {
  if (artigo.categoria && artigo.categoria !== 'Geral') return artigo.categoria;
  const tema = TEMAS_SELO.find(([re]) => re.test(artigo.titulo || ''));
  return tema ? tema[1] : '';
}

function seloCategoria(textoSelo) {
  const texto = String(textoSelo || '').toUpperCase();
  if (!texto) return '';
  const tamanho = 24;
  const largura = larguraTexto(FONTE_SANS, texto, tamanho) + 60;
  return `
    <rect x="${MARGEM}" y="96" width="${largura.toFixed(1)}" height="56" rx="28" fill="rgba(255,255,255,0.12)" />
    ${caminhoTexto(FONTE_SANS, texto, MARGEM + 30, 133, tamanho, COR.branco, { negrito: true })}`;
}

/** SVG da capa: selo da categoria, título grande, subtítulo opcional e marca. */
function montarSvgCapaRedes(artigo) {
  const titulo = String(artigo.titulo || '').trim();
  const subtitulo = String(artigo.subtituloRedes || '').trim();

  const tamanho = tamanhoTitulo(titulo);
  const linhas = quebrarLinhas(FONTE_SERIF, titulo, LARGURA_UTIL, tamanho, { maxLinhas: 8 });
  const alturaLinha = tamanho * 1.14;

  const tamanhoSub = 38;
  const linhasSub = subtitulo ? quebrarLinhas(FONTE_SANS, subtitulo, LARGURA_UTIL, tamanhoSub, { maxLinhas: 3 }) : [];
  const alturaLinhaSub = tamanhoSub * 1.4;

  // Bloco (título + filete + subtítulo) centralizado entre o selo e a marca.
  const alturaBloco =
    linhas.length * alturaLinha + 56 + (linhasSub.length ? linhasSub.length * alturaLinhaSub + 16 : 0);
  const topo = 200;
  const base = ALTURA - 190;
  const yBloco = Math.max(topo, topo + (base - topo - alturaBloco) / 2);
  const yTitulo = yBloco + tamanho * 0.88;
  const yFilete = yBloco + linhas.length * alturaLinha + 18;
  const ySub = yFilete + 38 + tamanhoSub * 0.9;

  const yMarca = ALTURA - 104;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
    <rect width="100%" height="100%" fill="${COR.verdeEscuro}" />
    ${seloCategoria(textoDoSelo(artigo))}
    ${caminhoLinhas(FONTE_SERIF, linhas, MARGEM, yTitulo, alturaLinha, tamanho, COR.branco, { negrito: true })}
    <rect x="${MARGEM}" y="${yFilete.toFixed(1)}" width="96" height="6" rx="3" fill="${COR.dourado}" />
    ${linhasSub.length ? caminhoLinhas(FONTE_SANS, linhasSub, MARGEM, ySub, alturaLinhaSub, tamanhoSub, 'rgba(255,255,255,0.82)') : ''}
    <circle cx="${MARGEM + 12}" cy="${yMarca - 10}" r="12" fill="${COR.dourado}" />
    ${caminhoTexto(FONTE_SANS, MARCA, MARGEM + 38, yMarca, 32, COR.branco, { negrito: true })}
    ${caminhoTexto(FONTE_SANS, '@doutor.antoniofelipe.smental', MARGEM + 38, yMarca + 42, 24, 'rgba(255,255,255,0.7)')}
  </svg>`;
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Rasteriza a capa. Não grava nada — só devolve o PNG e os metadados. */
async function renderizarCapaRedes(artigo) {
  const buffer = await sharp(Buffer.from(montarSvgCapaRedes(artigo))).png().toBuffer();
  return {
    buffer,
    hash: hashBuffer(buffer),
    largura: LARGURA,
    altura: ALTURA,
    modelo: MODELO,
    titulo: artigo.titulo,
    subtitulo: artigo.subtituloRedes || '',
    marca: MARCA,
  };
}

class ErroCapaRedes extends Error {
  constructor(mensagem, codigo) {
    super(mensagem);
    this.name = 'ErroCapaRedes';
    this.codigo = codigo;
  }
}

/**
 * Gera, envia ao Vercel Blob e grava `capaRedes` no artigo. O nome do arquivo
 * leva o início do hash: uma capa nova nunca é servida do cache da antiga.
 * Não mexe em `atualizadoEm` — trocar a capa das redes não é atualizar o artigo.
 */
async function publicarCapaRedes(artigo) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ErroCapaRedes('BLOB_READ_WRITE_TOKEN não configurado — não dá para gravar a capa 4:5.', 'BLOB_SEM_TOKEN');
  }
  const capa = await renderizarCapaRedes(artigo);
  const { put } = require('@vercel/blob');
  let enviado;
  try {
    enviado = await put(`artigos/${artigo.slug}/instagram-4x5-${capa.hash.slice(0, 12)}.png`, capa.buffer, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    throw new ErroCapaRedes(`Falha ao gravar a capa no Blob: ${err.message}`, 'BLOB_FALHOU');
  }

  const capaRedes = {
    url: enviado.url,
    hash: capa.hash,
    largura: capa.largura,
    altura: capa.altura,
    modelo: capa.modelo,
    titulo: capa.titulo,
    subtitulo: capa.subtitulo,
    geradaEm: new Date(),
  };
  const Artigo = require('../models/Artigo');
  await Artigo.updateOne({ _id: artigo._id }, { $set: { capaRedes } }, { timestamps: false });
  return capaRedes;
}

/** A capa gravada ainda corresponde ao artigo (mesmo título, subtítulo e modelo)? */
function capaAtualizada(artigo) {
  const c = artigo.capaRedes;
  return Boolean(
    c && c.url && c.hash && c.modelo === MODELO && c.titulo === artigo.titulo && (c.subtitulo || '') === (artigo.subtituloRedes || '')
  );
}

/** Garante uma capa atual: reaproveita a gravada ou gera outra. */
async function garantirCapaRedes(artigo) {
  if (capaAtualizada(artigo)) return artigo.capaRedes;
  return publicarCapaRedes(artigo);
}

module.exports = {
  montarSvgCapaRedes,
  renderizarCapaRedes,
  publicarCapaRedes,
  garantirCapaRedes,
  capaAtualizada,
  textoDoSelo,
  hashBuffer,
  ErroCapaRedes,
  MODELO_CAPA: MODELO,
  MARCA_CAPA: MARCA,
  LARGURA_CAPA: LARGURA,
  ALTURA_CAPA: ALTURA,
};
