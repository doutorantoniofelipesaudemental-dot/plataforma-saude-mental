/* =========================================================================
   Comportamentos compartilhados por todas as páginas.
   Expõe utilitários em window.Site para os scripts de página.
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------ API ---------------------------------- */

  /**
   * Chama a API do site e normaliza o tratamento de erro.
   * Sempre rejeita com um Error que carrega `status` e `campos` quando houver.
   */
  async function api(caminho, opcoes = {}) {
    const resposta = await fetch(`/api${caminho}`, {
      headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) },
      ...opcoes,
    });

    let dados = null;
    const tipo = resposta.headers.get('content-type') || '';
    if (tipo.includes('application/json')) {
      dados = await resposta.json().catch(() => null);
    }

    if (!resposta.ok) {
      const erro = new Error((dados && dados.erro) || 'Não foi possível completar a solicitação.');
      erro.status = resposta.status;
      erro.campos = (dados && dados.campos) || null;
      erro.detalhe = dados && dados.detalhe;
      throw erro;
    }
    return dados;
  }

  /* --------------------------- Formatação ------------------------------ */

  const formatadorData = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  function formatarData(valor) {
    if (!valor) return '';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? '' : formatadorData.format(data);
  }

  /** Escapa texto antes de interpolar em HTML. */
  function esc(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  /* ----------------------------- Cabeçalho ------------------------------ */

  const cabecalho = document.getElementById('cabecalho');
  if (cabecalho) {
    const aoRolar = () => {
      cabecalho.dataset.rolado = window.scrollY > 8 ? 'true' : 'false';
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }

  /* ---------------------------- Menu mobile ----------------------------- */

  const menuBotao = document.getElementById('menu-botao');
  const navegacao = document.getElementById('navegacao');

  if (menuBotao && navegacao) {
    const consulta = window.matchMedia('(max-width: 880px)');

    const aplicarEstadoInicial = () => {
      if (consulta.matches) {
        navegacao.hidden = menuBotao.getAttribute('aria-expanded') !== 'true';
      } else {
        // No desktop a navegação é sempre visível e o botão volta a ficar fechado.
        navegacao.hidden = false;
        menuBotao.setAttribute('aria-expanded', 'false');
      }
    };

    const alternar = (abrir) => {
      const aberto = abrir ?? menuBotao.getAttribute('aria-expanded') !== 'true';
      menuBotao.setAttribute('aria-expanded', String(aberto));
      menuBotao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      navegacao.hidden = !aberto;
    };

    menuBotao.addEventListener('click', () => alternar());

    navegacao.addEventListener('click', (evento) => {
      if (evento.target.closest('a') && consulta.matches) alternar(false);
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && menuBotao.getAttribute('aria-expanded') === 'true') {
        alternar(false);
        menuBotao.focus();
      }
    });

    consulta.addEventListener('change', aplicarEstadoInicial);
    aplicarEstadoInicial();
  }

  /* -------------------------- Revelar ao rolar -------------------------- */

  const alvos = document.querySelectorAll('.revelar');
  if (alvos.length) {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduzir || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => { el.dataset.visivel = 'true'; });
    } else {
      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              entrada.target.dataset.visivel = 'true';
              observador.unobserve(entrada.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      alvos.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
        observador.observe(el);
      });
    }
  }

  /* ------------------------------- Ano ---------------------------------- */

  const ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ------------------------ Cartão de artigo (HTML) --------------------- */

  const ICONE_CAPA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14.5M4 19.5A2.5 2.5 0 0 0 6.5 22H19M4 19.5A2.5 2.5 0 0 1 6.5 17H19v5M8 7h7M8 11h7"/></svg>`;

  /** Monta o HTML de um cartão de artigo a partir do objeto da API. */
  function cartaoArtigo(artigo) {
    const capa = artigo.imagemCapa
      ? `<img src="${esc(artigo.imagemCapa)}" alt="" loading="lazy">`
      : ICONE_CAPA;

    return `
      <a class="artigo-cartao" href="/artigo/${esc(artigo.slug)}">
        <div class="artigo-cartao__capa">${capa}</div>
        <div class="artigo-cartao__corpo">
          <span class="selo">${esc(artigo.categoria)}</span>
          <h3 class="artigo-cartao__titulo">${esc(artigo.titulo)}</h3>
          <p class="artigo-cartao__resumo">${esc(artigo.resumo)}</p>
          <div class="artigo-cartao__rodape">
            <time datetime="${esc(artigo.publicadoEm)}">${esc(formatarData(artigo.publicadoEm))}</time>
            <span aria-hidden="true">•</span>
            <span>${esc(artigo.tempoLeitura || 4)} min de leitura</span>
          </div>
        </div>
      </a>`;
  }

  /** Bloco padrão para lista vazia ou erro de carregamento. */
  function estadoVazio(titulo, texto) {
    return `
      <div class="estado-vazio">
        <h3>${esc(titulo)}</h3>
        <p>${esc(texto)}</p>
      </div>`;
  }

  window.Site = { api, esc, formatarData, cartaoArtigo, estadoVazio };
})();
