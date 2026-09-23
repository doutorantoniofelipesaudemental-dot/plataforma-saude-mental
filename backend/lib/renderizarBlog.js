const fs = require('fs');
const path = require('path');
const { escapeHtml, formatarData } = require('./texto');

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'public', 'blog.html');

let templateCache = null;
function lerTemplate() {
  if (!templateCache || process.env.NODE_ENV !== 'production') {
    // CRLF → LF: com core.autocrlf no Windows o checkout grava CRLF e os
    // replaces exatos de skeleton deixam de bater, desligando o SSR em silêncio.
    templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8').replace(/\r\n/g, '\n');
  }
  return templateCache;
}

const ICONE_CAPA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14.5M4 19.5A2.5 2.5 0 0 0 6.5 22H19M4 19.5A2.5 2.5 0 0 1 6.5 17H19v5M8 7h7M8 11h7"/></svg>`;

/** Mesmo markup de assets/js/site.js#cartaoArtigo, gerado no servidor. */
function montarCartaoArtigo(artigo) {
  const capa = artigo.imagemCapa
    ? `<img src="${escapeHtml(artigo.imagemCapa)}" alt="Capa do artigo: ${escapeHtml(artigo.titulo)}" loading="lazy">`
    : ICONE_CAPA;

  return `
      <a class="artigo-cartao" href="/artigo/${escapeHtml(artigo.slug)}">
        <div class="artigo-cartao__capa">${capa}</div>
        <div class="artigo-cartao__corpo">
          <span class="selo">${escapeHtml(artigo.categoria)}</span>
          <h3 class="artigo-cartao__titulo">${escapeHtml(artigo.titulo)}</h3>
          <p class="artigo-cartao__resumo">${escapeHtml(artigo.resumo)}</p>
          <div class="artigo-cartao__rodape">
            <time datetime="${escapeHtml(new Date(artigo.publicadoEm).toISOString())}">${escapeHtml(formatarData(artigo.publicadoEm))}</time>
            <span aria-hidden="true">•</span>
            <span>${escapeHtml(artigo.tempoLeitura || 4)} min de leitura</span>
          </div>
        </div>
      </a>`;
}

function montarEstadoVazio(titulo, texto) {
  return `<div class="estado-vazio"><h3>${escapeHtml(titulo)}</h3><p>${escapeHtml(texto)}</p></div>`;
}

const SKELETON_LISTA = `<div class="grade grade--3" id="lista-artigos" aria-busy="true" aria-live="polite">
        <div class="esqueleto esqueleto--cartao"></div>
        <div class="esqueleto esqueleto--cartao"></div>
        <div class="esqueleto esqueleto--cartao"></div>
        <div class="esqueleto esqueleto--cartao"></div>
        <div class="esqueleto esqueleto--cartao"></div>
        <div class="esqueleto esqueleto--cartao"></div>
      </div>`;

const BOTAO_TODOS = '<button class="filtro" type="button" data-categoria="" aria-pressed="true">Todos</button>';

const CAMPO_BUSCA = '<input type="search" id="campo-busca" placeholder="Buscar por assunto…" autocomplete="off">';

const NAV_PAGINACAO = `<nav class="paginacao" id="paginacao" aria-label="Paginação" hidden>
        <button class="botao botao--vazado botao--pequeno" type="button" data-acao="anterior">Anterior</button>
        <span class="paginacao__info" id="paginacao-info"></span>
        <button class="botao botao--vazado botao--pequeno" type="button" data-acao="proxima">Próxima</button>
      </nav>`;

function montarFiltrosHtml(categorias, categoriaAtual) {
  const todosAtivo = categoriaAtual === '';
  const botaoTodos = `<button class="filtro" type="button" data-categoria="" aria-pressed="${todosAtivo}">Todos</button>`;
  const botoes = (categorias || [])
    .filter((c) => c.total > 0)
    .map(
      (c) =>
        `<button class="filtro" type="button" data-categoria="${escapeHtml(c.nome)}" aria-pressed="${c.nome === categoriaAtual}">${escapeHtml(c.nome)} <span style="opacity:.6;margin-left:.35rem;">${c.total}</span></button>`
    )
    .join('');
  return botaoTodos + botoes;
}

function montarPaginacaoHtml({ pagina, paginas, total }) {
  if (paginas <= 1) return NAV_PAGINACAO;
  const info = `Página ${pagina} de ${paginas} · ${total} artigo${total === 1 ? '' : 's'}`;
  const anteriorDisabled = pagina <= 1 ? ' disabled' : '';
  const proximaDisabled = pagina >= paginas ? ' disabled' : '';
  return `<nav class="paginacao" id="paginacao" aria-label="Paginação">
        <button class="botao botao--vazado botao--pequeno" type="button" data-acao="anterior"${anteriorDisabled}>Anterior</button>
        <span class="paginacao__info" id="paginacao-info">${escapeHtml(info)}</span>
        <button class="botao botao--vazado botao--pequeno" type="button" data-acao="proxima"${proximaDisabled}>Próxima</button>
      </nav>`;
}

/**
 * Pré-renderiza a primeira página da listagem do blog (cards, filtros de
 * categoria e paginação) respeitando ?categoria/?busca/?pagina da URL, para
 * que crawlers sem JS vejam os links reais dos artigos em vez de um grid de
 * skeleton vazio. `assets/js/blog.js` detecta `#lista-artigos[data-ssr="1"]`
 * e pula o fetch+render inicial, mas mantém toda a interatividade (filtro,
 * busca, paginação) client-side normalmente a partir daí.
 *
 * Só marca data-ssr se os três blocos estáticos (lista, campo de busca,
 * botão "Todos") baterem exatamente com o template — caso contrário, deixa
 * tudo como está e o client-side assume a renderização inteira, como sempre.
 */
function renderizarBlogHtml({ itens, paginacao, categoria, busca, categorias }) {
  let html = lerTemplate();

  const templateCompativel =
    html.includes(SKELETON_LISTA) && html.includes(BOTAO_TODOS) && html.includes(CAMPO_BUSCA) && html.includes(NAV_PAGINACAO);

  if (!templateCompativel) {
    console.warn('[renderizarBlog] template mudou — pulando SSR da listagem.');
    return html;
  }

  const listaHtml = itens.length
    ? itens.map(montarCartaoArtigo).join('')
    : busca
      ? montarEstadoVazio('Nenhum artigo encontrado', `Não achamos nada para "${busca}". Tente outro termo ou veja todas as categorias.`)
      : montarEstadoVazio('Nenhum artigo por aqui ainda', 'Em breve publicaremos conteúdo nesta categoria.');

  html = html.replace(
    SKELETON_LISTA,
    `<div class="grade grade--3" id="lista-artigos" aria-busy="false" aria-live="polite" data-ssr="1">${listaHtml}</div>`
  );
  html = html.replace(BOTAO_TODOS, montarFiltrosHtml(categorias, categoria));
  html = html.replace(
    CAMPO_BUSCA,
    busca
      ? `<input type="search" id="campo-busca" placeholder="Buscar por assunto…" autocomplete="off" value="${escapeHtml(busca)}">`
      : CAMPO_BUSCA
  );
  html = html.replace(NAV_PAGINACAO, montarPaginacaoHtml(paginacao));

  return html;
}

module.exports = { renderizarBlogHtml };
