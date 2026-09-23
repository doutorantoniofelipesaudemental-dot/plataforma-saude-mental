/* =========================================================================
   Painel administrativo: portão de token + listagem + geração de carrosséis.
   ========================================================================= */
(function () {
  'use strict';

  const { esc, formatarData } = window.Site;
  const CHAVE_TOKEN = 'dsm_admin_token';

  const portao = document.getElementById('portao');
  const painel = document.getElementById('painel');
  const botaoSair = document.getElementById('botao-sair');
  const formToken = document.getElementById('form-token');
  const campoToken = document.getElementById('campo-token');
  const erroToken = document.getElementById('erro-token');
  const botaoEntrar = document.getElementById('botao-entrar');

  const lista = document.getElementById('lista-artigos');
  const filtros = document.getElementById('filtros');
  const campoBusca = document.getElementById('campo-busca');
  const paginacao = document.getElementById('paginacao');
  const paginacaoInfo = document.getElementById('paginacao-info');

  const modalFundo = document.getElementById('modal-fundo');
  const modalCorpo = document.getElementById('modal-corpo');
  const modalTitulo = document.getElementById('modal-titulo');
  const modalFechar = document.getElementById('modal-fechar');

  const LIMITE = 12;
  const estado = { categoria: '', busca: '', pagina: 1, paginas: 1 };

  /* ------------------------------ Autenticação --------------------------- */

  function obterToken() {
    return sessionStorage.getItem(CHAVE_TOKEN) || '';
  }

  /** Chama a API do painel sempre com o header de administrador. */
  async function apiAdmin(caminho, opcoes = {}) {
    const resposta = await fetch(`/api${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${obterToken()}`,
        ...(opcoes.headers || {}),
      },
    });
    if (resposta.status === 401) {
      sessionStorage.removeItem(CHAVE_TOKEN);
      mostrarPortao();
      throw new Error('Token inválido ou expirado.');
    }
    return resposta;
  }

  function mostrarPortao() {
    portao.hidden = false;
    painel.hidden = true;
    botaoSair.hidden = true;
    campoToken.value = '';
    setTimeout(() => campoToken.focus(), 50);
  }

  function mostrarPainel() {
    portao.hidden = true;
    painel.hidden = false;
    botaoSair.hidden = false;
    carregarCategorias();
    carregarArtigos();
  }

  formToken.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroToken.textContent = '';
    const token = campoToken.value.trim();
    if (!token) return;

    botaoEntrar.disabled = true;
    botaoEntrar.textContent = 'Verificando…';
    try {
      // Usa uma rota protegida por exigirAdmin, barata, só para validar o token.
      const resposta = await fetch('/api/agendamentos?limite=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resposta.status === 401) {
        erroToken.textContent = 'Token incorreto.';
        return;
      }
      if (!resposta.ok) {
        erroToken.textContent = 'Não foi possível verificar o token agora. Tente novamente.';
        return;
      }
      sessionStorage.setItem(CHAVE_TOKEN, token);
      mostrarPainel();
    } catch (err) {
      erroToken.textContent = 'Falha de conexão. Tente novamente.';
    } finally {
      botaoEntrar.disabled = false;
      botaoEntrar.textContent = 'Entrar';
    }
  });

  botaoSair.addEventListener('click', () => {
    sessionStorage.removeItem(CHAVE_TOKEN);
    mostrarPortao();
  });

  /* ------------------------------ Categorias ----------------------------- */

  async function carregarCategorias() {
    try {
      const resposta = await fetch('/api/artigos/categorias');
      const dados = await resposta.json();
      const comArtigos = (dados.categorias || []).filter((c) => c.total > 0);
      filtros.querySelectorAll('.filtro[data-categoria]:not([data-categoria=""])').forEach((b) => b.remove());
      filtros.insertAdjacentHTML(
        'beforeend',
        comArtigos
          .map(
            (c) =>
              `<button class="filtro" type="button" data-categoria="${esc(c.nome)}" aria-pressed="false">${esc(c.nome)} <span style="opacity:.6;margin-left:.35rem;">${c.total}</span></button>`
          )
          .join('')
      );
    } catch {
      // Sem categorias o painel ainda funciona, só perde o filtro.
    }
  }

  function marcarFiltroAtivo() {
    filtros.querySelectorAll('.filtro').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.categoria || '') === estado.categoria));
    });
  }

  /* ------------------------------- Listagem ------------------------------- */

  /** Resumo curto da enquete de engajamento, só quando há pelo menos um voto. */
  function resumoEnquete(artigo) {
    const e = artigo.enquete;
    if (!e) return '';
    const util = (e.util && (e.util.sim || 0) + (e.util.nao || 0)) || 0;
    const perfil = (e.perfil && (e.perfil.gestorRh || 0) + (e.perfil.profissionalSaude || 0) + (e.perfil.usoPessoal || 0)) || 0;
    if (!util && !perfil) return '';
    return `<span style="font-size:0.85rem;color:var(--tinta-fraca);">👍 ${e.util?.sim || 0} · 👎 ${e.util?.nao || 0} · ${perfil} sobre o perfil</span>`;
  }

  function itemArtigo(artigo) {
    return `
      <li class="item-admin" data-slug="${esc(artigo.slug)}">
        <div class="item-admin__info">
          <p class="item-admin__titulo">${esc(artigo.titulo)}</p>
          <div class="item-admin__meta">
            <span class="selo">${esc(artigo.categoria)}</span>
            <span style="font-size:0.85rem;color:var(--tinta-fraca);">${esc(formatarData(artigo.publicadoEm))}</span>
            ${resumoEnquete(artigo)}
          </div>
        </div>
        <div class="item-admin__acoes">
          <button class="botao botao--vazado botao--pequeno" type="button" data-acao="previa">Pré-visualizar</button>
          <button class="botao botao--primario botao--pequeno" type="button" data-acao="zip">Baixar ZIP</button>
        </div>
      </li>`;
  }

  async function carregarArtigos() {
    lista.setAttribute('aria-busy', 'true');
    lista.innerHTML = Array.from({ length: 3 }, () => '<li class="esqueleto" style="height:4.5rem;"></li>').join('');

    const p = new URLSearchParams({ limite: String(LIMITE), pagina: String(estado.pagina) });
    if (estado.categoria) p.set('categoria', estado.categoria);
    if (estado.busca) p.set('busca', estado.busca);

    try {
      const resposta = await fetch(`/api/artigos?${p}`);
      const dados = await resposta.json();
      lista.setAttribute('aria-busy', 'false');
      estado.paginas = (dados.paginacao && dados.paginacao.paginas) || 1;

      if (!dados.itens || dados.itens.length === 0) {
        lista.innerHTML = '<li class="estado-vazio"><h3>Nenhum artigo encontrado</h3></li>';
      } else {
        lista.innerHTML = dados.itens.map(itemArtigo).join('');
      }
      atualizarPaginacao(dados.paginacao ? dados.paginacao.total : 0);
    } catch (err) {
      lista.setAttribute('aria-busy', 'false');
      lista.innerHTML = '<li class="estado-vazio"><h3>Erro ao carregar</h3><p>Tente recarregar a página.</p></li>';
    }
  }

  function atualizarPaginacao(total) {
    if (estado.paginas <= 1) { paginacao.hidden = true; return; }
    paginacao.hidden = false;
    paginacaoInfo.textContent = `Página ${estado.pagina} de ${estado.paginas} · ${total} artigo(s)`;
    paginacao.querySelector('[data-acao="anterior"]').disabled = estado.pagina <= 1;
    paginacao.querySelector('[data-acao="proxima"]').disabled = estado.pagina >= estado.paginas;
  }

  filtros.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.filtro');
    if (!botao) return;
    estado.categoria = botao.dataset.categoria || '';
    estado.pagina = 1;
    marcarFiltroAtivo();
    carregarArtigos();
  });

  let temporizadorBusca;
  campoBusca.addEventListener('input', () => {
    clearTimeout(temporizadorBusca);
    temporizadorBusca = setTimeout(() => {
      estado.busca = campoBusca.value.trim();
      estado.pagina = 1;
      carregarArtigos();
    }, 350);
  });

  paginacao.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao || botao.disabled) return;
    estado.pagina += botao.dataset.acao === 'proxima' ? 1 : -1;
    estado.pagina = Math.min(Math.max(1, estado.pagina), estado.paginas);
    carregarArtigos();
  });

  /* --------------------------- Ações por artigo --------------------------- */

  lista.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const item = botao.closest('[data-slug]');
    const slug = item.dataset.slug;
    const titulo = item.querySelector('.item-admin__titulo').textContent;

    if (botao.dataset.acao === 'previa') abrirPreVisualizacao(slug, titulo);
    if (botao.dataset.acao === 'zip') baixarZip(slug, botao);
  });

  async function baixarZip(slug, botaoOrigem) {
    const textoOriginal = botaoOrigem.textContent;
    botaoOrigem.disabled = true;
    botaoOrigem.textContent = 'Gerando…';
    try {
      const resposta = await apiAdmin(`/carrossel/${encodeURIComponent(slug)}/zip`);
      if (!resposta.ok) throw new Error('Falha ao gerar o carrossel.');
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrossel-${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Não foi possível baixar o carrossel.');
    } finally {
      botaoOrigem.disabled = false;
      botaoOrigem.textContent = textoOriginal;
    }
  }

  async function abrirPreVisualizacao(slug, titulo) {
    modalTitulo.textContent = titulo;
    modalCorpo.innerHTML = '<p class="texto-apoio">Gerando slides…</p>';
    modalFundo.hidden = false;

    try {
      const resposta = await apiAdmin(`/carrossel/${encodeURIComponent(slug)}`);
      if (!resposta.ok) throw new Error('Falha ao gerar a prévia.');
      const dados = await resposta.json();

      const miniaturas = dados.slides
        .map(
          (s) => `
            <div class="slide-miniatura">
              <img src="${s.imagemBase64}" alt="Slide ${s.indice + 1} (${esc(s.tipo)})" loading="lazy">
              <span class="slide-miniatura__rotulo">${s.indice + 1}/${dados.slides.length} · ${esc(s.tipo)}</span>
            </div>`
        )
        .join('');

      modalCorpo.innerHTML = `
        <div class="slides-grade">${miniaturas}</div>
        <div class="bloco-legenda">
          <pre id="texto-legenda">${esc(dados.legenda)}</pre>
          <p class="bloco-legenda__hashtags" id="texto-hashtags">${esc(dados.hashtags.join(' '))}</p>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--vazado botao--pequeno" type="button" id="botao-copiar-legenda">Copiar legenda + hashtags</button>
          <button class="botao botao--primario botao--pequeno" type="button" id="botao-baixar-do-modal">Baixar ZIP</button>
        </div>`;

      document.getElementById('botao-copiar-legenda').addEventListener('click', async (evento) => {
        const completo = `${dados.legenda}\n\n${dados.hashtags.join(' ')}`;
        try {
          await navigator.clipboard.writeText(completo);
          const alvo = evento.currentTarget;
          const original = alvo.textContent;
          alvo.textContent = 'Copiado!';
          setTimeout(() => { alvo.textContent = original; }, 1800);
        } catch {
          alert('Não foi possível copiar automaticamente. Selecione o texto manualmente.');
        }
      });

      document.getElementById('botao-baixar-do-modal').addEventListener('click', (evento) => {
        baixarZip(slug, evento.currentTarget);
      });
    } catch (err) {
      modalCorpo.innerHTML = `<p class="texto-apoio">Não foi possível gerar a prévia: ${esc(err.message)}</p>`;
    }
  }

  modalFechar.addEventListener('click', () => { modalFundo.hidden = true; });
  modalFundo.addEventListener('click', (evento) => {
    if (evento.target === modalFundo) modalFundo.hidden = true;
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modalFundo.hidden) modalFundo.hidden = true;
  });

  /* --------------------------------- Início -------------------------------- */

  if (obterToken()) {
    mostrarPainel();
  } else {
    mostrarPortao();
  }
})();
