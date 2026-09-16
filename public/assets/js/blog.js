/* =========================================================================
   Listagem do blog: busca, filtro por categoria e paginação.
   O estado vive na query string, então links e o botão voltar funcionam.
   ========================================================================= */
(function () {
  'use strict';

  const { api, esc, cartaoArtigo, estadoVazio } = window.Site;

  const lista = document.getElementById('lista-artigos');
  const filtros = document.getElementById('filtros');
  const campoBusca = document.getElementById('campo-busca');
  const paginacao = document.getElementById('paginacao');
  const paginacaoInfo = document.getElementById('paginacao-info');

  const LIMITE = 9;

  const estado = {
    categoria: '',
    busca: '',
    pagina: 1,
    paginas: 1,
  };

  /* --------------------------- Query string ---------------------------- */

  function lerUrl() {
    const p = new URLSearchParams(location.search);
    estado.categoria = p.get('categoria') || '';
    estado.busca = p.get('busca') || '';
    estado.pagina = Math.max(1, parseInt(p.get('pagina'), 10) || 1);
    if (campoBusca) campoBusca.value = estado.busca;
  }

  function escreverUrl(substituir) {
    const p = new URLSearchParams();
    if (estado.categoria) p.set('categoria', estado.categoria);
    if (estado.busca) p.set('busca', estado.busca);
    if (estado.pagina > 1) p.set('pagina', String(estado.pagina));

    const url = p.toString() ? `?${p}` : location.pathname;
    history[substituir ? 'replaceState' : 'pushState']({ ...estado }, '', url);
  }

  /* ---------------------------- Categorias ----------------------------- */

  async function carregarCategorias() {
    if (!filtros) return;
    try {
      const dados = await api('/artigos/categorias');
      const comArtigos = (dados.categorias || []).filter((c) => c.total > 0);

      filtros.insertAdjacentHTML(
        'beforeend',
        comArtigos
          .map(
            (c) =>
              `<button class="filtro" type="button" data-categoria="${esc(c.nome)}" aria-pressed="false">${esc(c.nome)} <span style="opacity:.6;margin-left:.35rem;">${c.total}</span></button>`
          )
          .join('')
      );
      marcarFiltroAtivo();
    } catch (err) {
      // Sem categorias o blog ainda funciona — só perde o filtro.
      console.warn('[categorias]', err.message);
    }
  }

  function marcarFiltroAtivo() {
    if (!filtros) return;
    filtros.querySelectorAll('.filtro').forEach((botao) => {
      botao.setAttribute(
        'aria-pressed',
        String((botao.dataset.categoria || '') === estado.categoria)
      );
    });
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
    if (estado.categoria) p.set('categoria', estado.categoria);
    if (estado.busca) p.set('busca', estado.busca);

    try {
      const dados = await api(`/artigos?${p}`);
      lista.setAttribute('aria-busy', 'false');

      estado.paginas = (dados.paginacao && dados.paginacao.paginas) || 1;

      if (!dados.itens || dados.itens.length === 0) {
        lista.innerHTML = estado.busca
          ? estadoVazio(
              'Nenhum artigo encontrado',
              `Não achamos nada para "${estado.busca}". Tente outro termo ou veja todas as categorias.`
            )
          : estadoVazio(
              'Nenhum artigo por aqui ainda',
              'Em breve publicaremos conteúdo nesta categoria.'
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
      estado.categoria = botao.dataset.categoria || '';
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
  carregarCategorias();
  carregarArtigos();
})();
