/**
 * Capa automática dos artigos (ordem do Dr. Antônio Felipe, 11/11/2026, item 8). Formatos: OG 1200×630 e cartão do Blog 1200×800.
 *
 * Regras (docs/DESIGN.md e ordem de 11/11):
 * - cor própria por tema (7 tons claros; texto #1B1B1B, contraste ≥ 4,5:1 em todos — testado);
 * - título grande, etiqueta com o NOME NOVO do tema, ícone CC0 (3dicons) por tema; sem pessoas, sem cérebro com raios, sem gradiente;
 * - bloco "dado-chave" SÓ quando a frase com número traz o marcador de referência do próprio artigo (<sup>n</sup>):
 *   a fonte é a entrada n da lista "Referências" (autor e ano). Sem marcador, não há dado-chave;
 * - sem dado-chave, frase-chave LITERAL do artigo;
 * - selos "Com narração em áudio" e tempo de leitura;
 * - Relatos da Prática: papel, frase literal do relato, etiqueta "Relato literário";
 * - sem sensacionalismo (CFM 2.336/2023): palavras de alarme são reprovadas (PALAVRAS_PROIBIDAS).
 * Texto em contornos vetoriais (carrossel.js), para não depender de fonte do sistema nas funções da Vercel.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { FONTE_SERIF, FONTE_SANS, quebrarLinhas, caminhoLinhas, caminhoTexto } = require('./carrossel');
const { temaEfetivo, temaPorSlug, RELATOS } = require('./temas');

const PASTA_ICONES = path.join(__dirname, '..', 'assets', 'icones-cc0');
const CORPO = '#1B1B1B';
const PAPEL_RELATO = '#faf7f2';

/** 7 tons claros, um por tema (paleta do DESIGN.md). */
const PALETA_TEMA = Object.freeze({
  'infancia-familia': '#F7F1E3',
  'maternidade-perinatal': '#FBE0CF',
  'vida-adulta-envelhecimento': '#ECEEF0',
  'cuidar-de-quem-cuida': '#DDEFD9',
  'transtornos-mentais': '#dbeee8',
  'habitos-sono': '#CFF1E4',
  'sociedade-cultura': '#f4efe6',
});

/** Um ícone CC0 distinto por tema (nenhum repetido). */
const ICONE_TEMA = Object.freeze({
  'infancia-familia': 'heart-1.png',
  'maternidade-perinatal': 'heart-2.png',
  'vida-adulta-envelhecimento': 'notebook-dynamic-00.png',
  'cuidar-de-quem-cuida': 'setting.png',
  'transtornos-mentais': 'clay.png',
  'habitos-sono': 'dynamic.png',
  'sociedade-cultura': 'premium.png',
});

const PALAVRAS_PROIBIDAS = /chocante|alarmante|assustador|bomba|surpreendente|dramátic|epidemia|cura garantida|100%/i;
// Só resultado: percentual ou "X em cada Y". Tamanho de amostra ("10 mil adolescentes") não vira dado-chave.
const NUMERO = /\d+(?:[.,]\d+)?\s?%|\b(?:um|uma|\d+) em cada \d+\b/i;
const MARCADOR = /\[\[REF:([\d,\s]+)\]\]/;

const semTags = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const frases = (texto) => (texto.match(/[^.!?]+[.!?]/g) || []).map((s) => s.trim());
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Relato da Prática (categoria RELATOS, sem tema). */
function ehRelato(artigo) {
  return artigo.categoria === RELATOS;
}

/** Tema do artigo (slug e nome novo), ou null. */
function temaDoArtigo(artigo) {
  const t = temaPorSlug(temaEfetivo(artigo));
  return t ? { slug: t.slug, nome: t.nome } : null;
}

/** Autor e ano de uma entrada da lista de referências. */
function autorAno(entrada) {
  const autor = (entrada.split(',')[0] || '').replace(/(\s+[A-Z]{1,3})+$/, '').trim();
  const anos = entrada.match(/\b(?:19|20)\d{2}\b/g) || [];
  return autor && anos.length ? `${autor}, ${anos[anos.length - 1]}` : null;
}

/** Lista versionada de dados conferidos na fonte (PubMed). Sem entrada igual, não há dado-chave. */
const VERIFICADOS = require('./dadosChaveVerificados.json').verificados;
const normaliza = (t) => String(t || '').replace(/\s+/g, ' ').trim();

/** True só se slug, número, fonte e frase baterem exatamente com uma entrada verificada. */
function verificado(slug, dado) {
  if (!slug || !dado) return false;
  return VERIFICADOS.some((v) => v.slug === slug && v.numero === dado.numero
    && v.fonte === dado.fonte && normaliza(v.frase) === normaliza(dado.frase));
}

/**
 * Dado-chave: frase com número cujo marcador <sup>n</sup> do próprio artigo aponta para a entrada n da seção
 * "Referências" (autor e ano). Sem marcador, ou sem entrada identificável, não há dado-chave (retorna null).
 */
function dadoChave(artigo) {
  const html = String(artigo.conteudo || '');
  const iRef = html.search(/<h2>\s*Refer[êe]ncias\s*<\/h2>/i);
  if (iRef < 0) return null;
  const entradas = [...html.slice(iRef).matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => semTags(m[1])).filter(Boolean);
  const corpo = html.slice(0, iRef).replace(/<sup>\s*([\d,\s]+)<\/sup>/g, ' [[REF:$1]] ');
  for (const f of frases(semTags(corpo))) {
    const n = f.match(NUMERO);
    const r = f.match(MARCADOR);
    if (!n || !r || f.length > 260 || PALAVRAS_PROIBIDAS.test(f)) continue;
    const idx = parseInt(r[1].split(',')[0], 10);
    const fonte = entradas[idx - 1] ? autorAno(entradas[idx - 1]) : null;
    if (!fonte) continue;
    const limpa = f.replace(MARCADOR, '').replace(/\s+([.,;:])/g, '$1').replace(/\s+/g, ' ').trim();
    const dado = { numero: n[0].trim(), frase: limpa, fonte };
    if (verificado(artigo.slug, dado)) return dado;
  }
  return null;
}

/** Largura útil: se a frase não cabe no número de linhas, ela não é usada (nunca cortar com reticências). */
const LARG_BLOCO_DADO = 1200 - 80 * 2 - 64;
const LARG_FRASE = 1200 - 80 * 2;
function cabeEm(fonte, texto, larguraPx, tamanho, maxLinhas) {
  return quebrarLinhas(fonte, texto, larguraPx, tamanho, { maxLinhas: 99 }).length <= maxLinhas;
}

/** Frase-chave literal (sem número): primeira frase do resumo entre 30 e 140 caracteres que cabe em 3 linhas; senão do texto. */
function fraseChave(artigo) {
  const candidatas = [...frases(semTags(artigo.resumo)), ...frases(semTags(artigo.conteudo))];
  return candidatas.find((f) => f.length >= 30 && f.length <= 140 && !PALAVRAS_PROIBIDAS.test(f) && cabeEm(FONTE_SERIF, f, LARG_FRASE, 38, 3)) || null;
}

/** Relato: frase literal do próprio relato (sem paráfrase). */
function fraseRelato(artigo) {
  return frases(semTags(artigo.conteudo)).find((f) => f.length >= 40 && f.length <= 170 && !PALAVRAS_PROIBIDAS.test(f) && cabeEm(FONTE_SERIF, f, LARG_FRASE, 38, 3)) || null;
}

/** Escolha do visual: relato, tema com dado-chave, ou tema com frase-chave. */
function escolherVisual(artigo) {
  if (ehRelato(artigo)) {
    return { tipo: 'relato', frase: fraseRelato(artigo), cor: PAPEL_RELATO, rotulo: 'Relato literário' };
  }
  const tema = temaDoArtigo(artigo);
  if (!tema) return { tipo: 'sem-tema', frase: fraseChave(artigo), cor: '#ECEEF0', rotulo: '' };
  const dadoBruto = dadoChave(artigo);
  // dado-chave só entra se a frase inteira cabe em 2 linhas (sem reticências)
  const dado = dadoBruto && cabeEm(FONTE_SANS, dadoBruto.frase, LARG_BLOCO_DADO, 26, 2) ? dadoBruto : null;
  return {
    tipo: dado ? 'dado' : 'frase',
    tema: tema.slug,
    rotulo: tema.nome.toUpperCase(),
    cor: PALETA_TEMA[tema.slug],
    icone: ICONE_TEMA[tema.slug],
    dado,
    frase: dado ? null : fraseChave(artigo),
  };
}

function iconeDataUri(nome) {
  if (!nome) return '';
  const arquivo = path.join(PASTA_ICONES, nome);
  if (!fs.existsSync(arquivo)) return '';
  return `data:image/png;base64,${fs.readFileSync(arquivo).toString('base64')}`;
}

/** SVG da capa. formato: 'og' (1200×630) ou 'blog' (1200×800). */
function montarSvgCapaArtigo(artigo, { formato = 'og' } = {}) {
  const W = 1200;
  const H = formato === 'blog' ? 800 : 630;
  const M = 80;
  const LARG_ETIQUETA = W - M * 2 - 180; // deixa espaço para o ícone à direita
  const visual = escolherVisual(artigo);
  const titulo = String(artigo.titulo || '').trim();
  const tamTitulo = titulo.length > 90 ? 50 : titulo.length > 60 ? 58 : 66;

  const linhasEtiqueta = visual.rotulo ? quebrarLinhas(FONTE_SANS, visual.rotulo, LARG_ETIQUETA, 26, { maxLinhas: 2 }) : [];
  const yEtiqueta = 96;
  const yTitulo = yEtiqueta + 40 + (linhasEtiqueta.length > 1 ? 30 : 0) + 24;
  const linhasTitulo = quebrarLinhas(FONTE_SERIF, titulo, W - M * 2 - 180, tamTitulo, { maxLinhas: 3 });
  const altLinha = tamTitulo * 1.14;

  const yRodape = H - 40;
  // Tudo termina 18 px acima do filete dourado (yRodape - 62): nada cruza o filete nem o selo.
  const yFilete = yRodape - 62;
  const yLimiteBloco = yFilete - 18;
  let bloco = '';
  if (visual.tipo === 'dado') {
    const linhasDado = quebrarLinhas(FONTE_SANS, visual.dado.frase, W - M * 2 - 64, 26, { maxLinhas: 2 });
    const altBloco = 200;
    const yBlocoDado = yLimiteBloco - altBloco;
    bloco = `
    <rect x="${M}" y="${yBlocoDado}" width="${W - M * 2}" height="${altBloco}" rx="18" fill="#FFFFFF" opacity="0.92" />
    ${caminhoTexto(FONTE_SERIF, visual.dado.numero, M + 32, yBlocoDado + 78, 60, CORPO, { negrito: true })}
    ${caminhoLinhas(FONTE_SANS, linhasDado, M + 32, yBlocoDado + 116, 32, 26, CORPO)}
    ${caminhoTexto(FONTE_SANS, `Fonte: ${visual.dado.fonte}`, M + 32, yBlocoDado + altBloco - 22, 20, '#45564f')}`;
  } else if (visual.frase) {
    const linhasF = quebrarLinhas(FONTE_SERIF, visual.frase, W - M * 2, 38, { maxLinhas: 3 });
    // layout original da frase-chave (inalterado: as 397 capas já aprovadas não mudam)
    const yBloco = yRodape - 36 - (formato === 'blog' ? 230 : 190);
    bloco = caminhoLinhas(FONTE_SERIF, linhasF, M, yBloco + 40, 50, 38, CORPO);
  }

  const etiqueta = caminhoLinhas(FONTE_SANS, linhasEtiqueta, M, yEtiqueta, 32, 26, CORPO, { negrito: true });
  const icone = visual.icone
    ? `<image href="${iconeDataUri(visual.icone)}" x="${W - M - 150}" y="50" width="150" height="150" />`
    : '';
  const selo = artigo.tempoLeitura
    ? `Com narração em áudio · ${artigo.tempoLeitura} min de leitura`
    : 'Com narração em áudio';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="${visual.cor || '#F7F1E3'}" />
    ${etiqueta}
    ${icone}
    ${caminhoLinhas(FONTE_SERIF, linhasTitulo, M, yTitulo, altLinha, tamTitulo, CORPO, { negrito: true })}
    ${bloco}
    <rect x="${M}" y="${yRodape - 62}" width="${W - M * 2}" height="3" fill="#C9A227" />
    ${caminhoTexto(FONTE_SANS, selo, M, yRodape - 24, 22, CORPO, { negrito: true })}
    ${caminhoTexto(FONTE_SANS, 'Portal de Saúde Mental Doutor Antônio Felipe Garabito', M, yRodape + 6, 20, CORPO)}
  </svg>`;
}

/** Texto alternativo (campo alt obrigatório). */
function altCapa(artigo) {
  const v = escolherVisual(artigo);
  const rotulo = v.tipo === 'relato' ? 'Relato da prática' : v.rotulo ? `Tema ${v.rotulo.toLowerCase()}` : 'Artigo';
  return `Capa do artigo "${artigo.titulo}". ${rotulo}.`;
}

/** PNG da capa (buffer). */
async function renderizarCapaArtigo(artigo, opcoes = {}) {
  const svg = montarSvgCapaArtigo(artigo, opcoes);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = {
  PALETA_TEMA,
  ICONE_TEMA,
  PALAVRAS_PROIBIDAS,
  escolherVisual,
  dadoChave,
  fraseChave,
  montarSvgCapaArtigo,
  altCapa,
  renderizarCapaArtigo,
  esc,
};
