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

/** HTML da reescrita → corpo MDX com os componentes do app (Lead, Callout, RefsNote). */
function htmlParaMdx(html) {
  return html
    .replace(/<p class="lead-para">([\s\S]*?)<\/p>/g, '<Lead>\n$1\n</Lead>')
    .replace(/<p class="refs-note">([\s\S]*?)<\/p>/g, '<RefsNote>\n$1\n</RefsNote>')
    .replace(/<div class="callout"><strong>([\s\S]*?)<\/strong>\s*([\s\S]*?)<\/div>/g, (_, titulo, corpo) => {
      const t = titulo.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<Callout titulo={'${t}'}>\n${corpo.trim()}\n</Callout>`;
    })
    .replace(/ class="/g, ' className="')
    .replace(/<br>/g, '<br />')
    .trim();
}

/**
 * Compila o MDX de cada item de cada lote (mesma conversão do importador).
 * Retorna as falhas; lista vazia = todos os lotes compilam antes do merge.
 */
async function validarMdxDosLotes(raiz) {
  const { pathToFileURL } = require('url');
  const compilador = path.join(raiz, 'apps', 'plataforma-saude-mental', 'node_modules', '@mdx-js', 'mdx', 'index.js');
  const { compile } = await import(pathToFileURL(compilador).href);
  const falhas = [];
  let total = 0;
  for (const l of listarLotes()) {
    for (const item of l.itens) {
      total++;
      try {
        await compile(htmlParaMdx(item.html));
      } catch (e) {
        falhas.push({ lote: l.lote, slug: item.slug, erro: String(e.message || e).split('\n')[0] });
      }
    }
  }
  return { total, falhas };
}

/**
 * Destino dos .mdx do import. Sem `saida`: a pasta padrão (pasta principal, rastreada pelo Git).
 * Com `saida` (--mdx-saida=<pasta>): grava na pasta informada, normalmente o worktree do PR.
 */
function destinoMdx({ pastaPadrao, saida }) {
  if (saida === true) throw new Error('--mdx-saida exige um caminho: --mdx-saida=<pasta>');
  return saida ? path.resolve(saida) : pastaPadrao;
}

/**
 * Aviso para o Dr.: sem --mdx-saida, os .mdx rastreados mudam na pasta principal.
 * Retorna null quando não há mudança na pasta principal (ou quando a saída é outra).
 */
function avisoMdxRastreado(arquivos, { saida }) {
  if (saida || !arquivos.length) return null;
  return `ATENÇÃO: ${arquivos.length} .mdx rastreado(s) vão mudar na pasta principal (${arquivos.join(', ')}). ` +
    'Para não sujar a pasta principal, rode com --mdx-saida=<worktree>/apps/plataforma-saude-mental/src/content/artigos e publique um PR com esses arquivos.';
}

module.exports = { listarLotes, reescritaAprovada, reescritaPendente, montarNovoConteudo, hashTexto, MARCA_FERRAMENTA, htmlParaMdx, validarMdxDosLotes, destinoMdx, avisoMdxRastreado };
