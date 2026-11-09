/* =========================================================================
   Listagem do blog: busca, filtro por tema (7 temas + Relatos da Prática) e paginação.
   O estado vive na query string (?tema=<slug> ou ?formato=relatos), então links
   compartilhados e o botão voltar funcionam.
   ========================================================================= */
(function () {
  'use strict';

  const { api, esc, cartaoArtigo, estadoVazio } = window.Site;

  const lista = document.getElementById('lista-artigos');
  const filtros = document.getElementById('filtros');
  const campoBusca = document.getElementById('campo-busca');
  const paginacao = document.getElementById('paginacao');
  const paginacaoInfo = document.getElementById('paginacao-info');
  const tituloTema = document.getElementById('blog-tema-titulo');

  const LIMITE = 9;
  const FORMATO_RELATOS = 'relatos';

  const estado = {
    tema: '',
    formato: '',
    busca: '',
    pagina: 1,
    paginas: 1,
  };

  // Nomes dos temas e de Relatos para o título da página (preenchidos pela lista de /artigos/temas).
  const nomes = { temas: {}, relatos: 'Relatos da Prática' };
  const TITULO_BASE = document.title;

  /* --------------------------- Query string ---------------------------- */

  function lerUrl() {
    const p = new URLSearchParams(location.search);
    estado.formato = p.get('formato') === FORMATO_RELATOS ? FORMATO_RELATOS : '';
    estado.tema = estado.formato ? '' : p.get('tema') || '';
    estado.busca = p.get('busca') || '';
    estado.pagina = Math.max(1, parseInt(p.get('pagina'), 10) || 1);
    if (campoBusca) campoBusca.value = estado.busca;
  }

  function escreverUrl(substituir) {
    const p = new URLSearchParams();
    if (estado.formato) p.set('formato', estado.formato);
    else if (estado.tema) p.set('tema', estado.tema);
    if (estado.busca) p.set('busca', estado.busca);
    if (estado.pagina > 1) p.set('pagina', String(estado.pagina));

    const url = p.toString() ? `?${p}` : location.pathname;
    history[substituir ? 'replaceState' : 'pushState']({ ...estado }, '', url);
  }

  /* ------------------------------ Filtros ------------------------------ */

  // Mesma marcação que backend/lib/renderizarBlog.js (montarFiltrosHtml).
  function montarFiltros(dados) {
    const temas = (dados && dados.temas) || [];
    const relatos = (dados && dados.relatos) || { total: 0 };
    const botoes = [
      `<button class="filtro" type="button" data-tema="" aria-pressed="${!estado.tema && !estado.formato}">Todos</button>`,
      ...temas.map(
        (t) =>
          `<button class="filtro" type="button" data-tema="${esc(t.slug)}" title="${esc(t.nome)}" aria-label="${esc(t.nome)}" aria-pressed="${t.slug === estado.tema}">${esc(t.curto)} <span class="filtro__total">${t.total}</span></button>`
      ),
      '<span class="filtros__divisor" aria-hidden="true"></span>',
      `<button class="filtro" type="button" data-formato="relatos" title="${esc(relatos.nome || nomes.relatos)}" aria-label="${esc(relatos.nome || nomes.relatos)}" aria-pressed="${estado.formato === FORMATO_RELATOS}">${esc(relatos.nome || nomes.relatos)} <span class="filtro__total">${relatos.total}</span></button>`,
    ];
    return botoes.join('');
  }

  function guardarNomes(dados) {
    (dados.temas || []).forEach((t) => {
      nomes.temas[t.slug] = t.nome;
    });
    if (dados.relatos && dados.relatos.nome) nomes.relatos = dados.relatos.nome;
  }

  async function carregarFiltros() {
    if (!filtros) return;
    try {
      const dados = await api('/artigos/temas');
      guardarNomes(dados);
      filtros.innerHTML = montarFiltros(dados);
      marcarFiltroAtivo();
    } catch (err) {
      // Sem os temas o blog ainda lista os artigos — só perde o filtro.
      console.warn('[temas]', err.message);
    }
  }

  function marcarFiltroAtivo() {
    if (filtros) {
      filtros.querySelectorAll('.filtro').forEach((botao) => {
        let ativo;
        if (botao.dataset.formato) ativo = estado.formato === FORMATO_RELATOS;
        else ativo = !estado.formato && (botao.dataset.tema || '') === estado.tema;
        botao.setAttribute('aria-pressed', String(ativo));
      });
    }
    atualizarTituloTema();
  }

  function atualizarTituloTema() {
    let titulo = '';
    if (estado.formato === FORMATO_RELATOS) titulo = nomes.relatos;
    else if (estado.tema && nomes.temas[estado.tema]) titulo = nomes.temas[estado.tema];

    if (tituloTema) {
      tituloTema.textContent = titulo;
      tituloTema.hidden = !titulo;
    }
    document.title = titulo ? `${titulo} — ${TITULO_BASE}` : TITULO_BASE;
  }

  /* ------------------------------ Artigos ------------------------------ */

  function mostrarEsqueletos() {
    lista.setAttribute('aria-busy', 'true');
    lista.innerHTML = Array.from(
      { length: 3 },
      () => '<div class="esqueleto esqueleto--cartao"></div>'
    ).join('');
  }

  async function carregarArtigos({ rolar = false } = {}) {
    mostrarEsqueletos();

    const p = new URLSearchParams({ limite: String(LIMITE), pagina: String(estado.pagina) });
    if (estado.formato) p.set('formato', estado.formato);
    else if (estado.tema) p.set('tema', estado.tema);
    if (estado.busca) p.set('busca', estado.busca);

    try {
      const dados = await api(`/artigos?${p}`);
      lista.setAttribute('aria-busy', 'false');

      estado.paginas = (dados.paginacao && dados.paginacao.paginas) || 1;

      if (!dados.itens || dados.itens.length === 0) {
        lista.innerHTML = estado.busca
          ? estadoVazio(
              'Nenhum artigo encontrado',
              `Não achamos nada para "${estado.busca}". Tente outro termo ou veja todos os temas.`
            )
          : estadoVazio(
              'Nenhum artigo por aqui ainda',
              'Em breve publicaremos conteúdo neste tema.'
            );
        atualizarPaginacao(0);
        return;
      }

      lista.innerHTML = dados.itens.map(cartaoArtigo).join('');
      atualizarPaginacao(dados.paginacao ? dados.paginacao.total : dados.itens.length);

      if (rolar) {
        lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      lista.setAttribute('aria-busy', 'false');
      lista.innerHTML = estadoVazio(
        'Não foi possível carregar os artigos',
        err.status === 503
          ? 'O serviço está temporariamente indisponível. Tente novamente em instantes.'
          : 'Verifique sua conexão e tente recarregar a página.'
      );
      atualizarPaginacao(0);
      console.warn('[artigos]', err.message);
    }
  }

  function atualizarPaginacao(total) {
    if (!paginacao) return;
    if (estado.paginas <= 1) {
      paginacao.hidden = true;
      return;
    }
    paginacao.hidden = false;
    paginacaoInfo.textContent = `Página ${estado.pagina} de ${estado.paginas} · ${total} artigo${total === 1 ? '' : 's'}`;
    paginacao.querySelector('[data-acao="anterior"]').disabled = estado.pagina <= 1;
    paginacao.querySelector('[data-acao="proxima"]').disabled = estado.pagina >= estado.paginas;
  }

  /* ------------------------------ Eventos ------------------------------ */

  if (filtros) {
    filtros.addEventListener('click', (evento) => {
      const botao = evento.target.closest('.filtro');
      if (!botao) return;
      if (botao.dataset.formato) {
        estado.formato = FORMATO_RELATOS;
        estado.tema = '';
      } else {
        estado.formato = '';
        estado.tema = botao.dataset.tema || '';
      }
      estado.pagina = 1;
      marcarFiltroAtivo();
      escreverUrl();
      carregarArtigos();
    });
  }

  if (campoBusca) {
    let temporizador;
    campoBusca.addEventListener('input', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        estado.busca = campoBusca.value.trim();
        estado.pagina = 1;
        escreverUrl();
        carregarArtigos();
      }, 350);
    });

    // Enter não deve recarregar a página nem esperar o debounce.
    campoBusca.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        clearTimeout(temporizador);
        estado.busca = campoBusca.value.trim();
        estado.pagina = 1;
        escreverUrl();
        carregarArtigos();
      }
    });
  }

  if (paginacao) {
    paginacao.addEventListener('click', (evento) => {
      const botao = evento.target.closest('[data-acao]');
      if (!botao || botao.disabled) return;
      estado.pagina += botao.dataset.acao === 'proxima' ? 1 : -1;
      estado.pagina = Math.min(Math.max(1, estado.pagina), estado.paginas);
      escreverUrl();
      carregarArtigos({ rolar: true });
    });
  }

  window.addEventListener('popstate', () => {
    lerUrl();
    marcarFiltroAtivo();
    carregarArtigos();
  });

  /* ------------------------------- Início ------------------------------ */

  lerUrl();
  escreverUrl(true);
  marcarFiltroAtivo();

  // backend/lib/renderizarBlog.js já preenche a lista, os filtros e a
  // paginação para o estado atual da URL quando consegue consultar o banco
  // (marca #lista-artigos[data-ssr="1"]). Nesse caso não refazemos o fetch
  // inicial nem mostramos skeleton — só a partir da próxima interação
  // (filtro, busca, paginação) o client-side assume, normalmente.
  // Os nomes completos dos temas (title/aria-label) vêm do /artigos/temas.
  if (lista.dataset.ssr !== '1') {
    carregarFiltros();
    carregarArtigos();
  } else {
    carregarFiltros();
  }
})();
