/**
 * Lotes de reescritas aprovadas (backend/data/reescritas/<lote>/).
 *
 * Cada lote tem `lote.json` (slug, resumo, tempoLeitura, arquivo_conteudo,
 * manter_ferramenta) e um .html por artigo com o novo `conteudo`. O import é
 * feito por backend/tools/importar-reescritas.js, que grava em
 * `artigo.reescrita` o lote e o hash do HTML importado. A checagem de conteúdo
 * da fila usa `reescritaPendente` para nunca publicar a versão antiga de um
 * artigo que já tem reescrita aprovada.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PASTA = path.join(__dirname, '..', 'data', 'reescritas');
const MARCA_FERRAMENTA = '<h2>Ferramenta interativa</h2>';

let cache = null;

function hashTexto(texto) {
  return crypto.createHash('sha256').update(texto.replace(/\r\n/g, '\n')).digest('hex');
}

/** Todos os lotes, com o HTML de cada item já lido e o hash calculado. */
function listarLotes() {
  if (cache) return cache;
  let nomes = [];
  try {
    nomes = fs.readdirSync(PASTA, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    nomes = [];
  }
  cache = nomes.map((lote) => {
    const itens = JSON.parse(fs.readFileSync(path.join(PASTA, lote, 'lote.json'), 'utf8'));
    return {
      lote,
      itens: itens.map((item) => {
        const html = fs.readFileSync(path.join(PASTA, lote, item.arquivo_conteudo), 'utf8').replace(/\r\n/g, '\n');
        return { ...item, html, hash: hashTexto(html) };
      }),
    };
  });
  return cache;
}

/** Última reescrita aprovada de um slug (o lote mais recente vence), ou null. */
function reescritaAprovada(slug) {
  let achada = null;
  for (const { lote, itens } of listarLotes()) {
    const item = itens.find((i) => i.slug === slug);
    if (item) achada = { lote, ...item };
  }
  return achada;
}

/** Reescrita aprovada que ainda não foi importada para este artigo, ou null. */
function reescritaPendente(artigo) {
  const aprovada = reescritaAprovada(artigo.slug);
  if (!aprovada) return null;
  const importada = artigo.reescrita || {};
  if (importada.lote === aprovada.lote && importada.hash === aprovada.hash) return null;
  return { lote: aprovada.lote, arquivo: aprovada.arquivo_conteudo };
}

/**
 * Novo `conteudo`: com `manter_ferramenta`, troca só o texto antes de
 * "<h2>Ferramenta interativa</h2>" e mantém o bloco da ferramenta e o script.
 */
function montarNovoConteudo(conteudoAtual, item) {
  if (!item.manter_ferramenta) return item.html.trim();
  const i = String(conteudoAtual || '').indexOf(MARCA_FERRAMENTA);
  if (i < 0) {
    throw new Error(`"${item.slug}" deveria manter a ferramenta, mas o conteúdo atual não tem "${MARCA_FERRAMENTA}".`);
  }
  return `${item.html.trim()}\n\n${conteudoAtual.slice(i)}`;
}

module.exports = { listarLotes, reescritaAprovada, reescritaPendente, montarNovoConteudo, hashTexto, MARCA_FERRAMENTA };
