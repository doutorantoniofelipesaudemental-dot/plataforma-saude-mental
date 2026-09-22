/* =========================================================================
   Página de artigo. O slug vem do caminho (/artigo/<slug>) ou de ?slug=.
   ========================================================================= */
(function () {
  'use strict';

  const { api, esc, formatarData, cartaoArtigo } = window.Site;

  const BASE_URL = 'https://drsaudemental.vercel.app';

  const cabecalho = document.getElementById('artigo-cabecalho');
  const conteudo = document.getElementById('artigo-conteudo');
  const secaoRelacionados = document.getElementById('secao-relacionados');
  const listaRelacionados = document.getElementById('relacionados');

  /** Atualiza meta tags OpenGraph, canonical e o card JSON-LD com os dados reais do artigo. */
  function atualizarMetadados(artigo, slug) {
    const url = `${BASE_URL}/artigo/${encodeURIComponent(slug)}`;

    const ogTitle = document.getElementById('meta-og-title');
    if (ogTitle) ogTitle.setAttribute('content', artigo.titulo);

    const ogDescription = document.getElementById('meta-og-description');
    if (ogDescription) ogDescription.setAttribute('content', artigo.resumo);

    const ogUrl = document.getElementById('meta-og-url');
    if (ogUrl) ogUrl.setAttribute('content', url);

    const canonical = document.getElementById('link-canonical');
    if (canonical) canonical.setAttribute('href', url);

    if (artigo.imagemCapa) {
      const ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      ogImage.setAttribute('content', artigo.imagemCapa);
      document.head.appendChild(ogImage);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': ['MedicalWebPage', 'Article'],
      headline: artigo.titulo,
      description: artigo.resumo,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      inLanguage: 'pt-BR',
      datePublished: artigo.publicadoEm,
      dateModified: artigo.atualizadoEm || artigo.publicadoEm,
      image: artigo.imagemCapa || undefined,
      author: {
        '@type': 'Person',
        name: artigo.autor || 'Dr. Antônio Felipe',
        jobTitle: 'Médico — Especialista em Medicina de Família e Comunidade',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Doutor Saúde Mental',
        url: BASE_URL,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  function obterSlug() {
    const partes = location.pathname.split('/').filter(Boolean);
    if (partes[0] === 'artigo' && partes[1]) return decodeURIComponent(partes[1]);
    return new URLSearchParams(location.search).get('slug') || '';
  }

  function mostrarErro(titulo, texto) {
    cabecalho.innerHTML = `<h1>${esc(titulo)}</h1>`;
    conteudo.setAttribute('aria-busy', 'false');
    conteudo.innerHTML = `
      <p>${esc(texto)}</p>
      <p><a class="botao botao--primario" href="/blog">Ver todos os artigos</a></p>`;
  }

  /** Links externos dentro do corpo do artigo abrem em nova aba com rel seguro. */
  function endurecerLinksExternos() {
    conteudo.querySelectorAll('a[href^="http"]').forEach((link) => {
      if (link.hostname !== location.hostname) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  }

  function exibirRelacionados(relacionados) {
    if (relacionados && relacionados.length > 0) {
      listaRelacionados.innerHTML = relacionados.map(cartaoArtigo).join('');
      secaoRelacionados.hidden = false;
    }
  }

  async function carregar() {
    const slug = obterSlug();

    if (!slug) {
      mostrarErro('Artigo não encontrado', 'O endereço acessado não aponta para um artigo válido.');
      return;
    }

    // O servidor (backend/lib/renderizarArtigo.js) já preenche cabeçalho e
    // corpo quando consegue consultar o banco — marca <article data-ssr="1">
    // nesse caso. Aqui só reforçamos o hardening de links e buscamos os
    // relacionados (que não vêm pré-renderizados), sem re-montar nada nem
    // mostrar skeleton — evita o layout shift de trocar o HTML inteiro.
    const artigoEl = document.querySelector('article');
    if (artigoEl?.dataset.ssr === '1') {
      endurecerLinksExternos();
      try {
        const { relacionados } = await api(`/artigos/${encodeURIComponent(slug)}`);
        exibirRelacionados(relacionados);
      } catch (err) {
        console.warn('[artigo] falha ao carregar relacionados:', err.message);
      }
      return;
    }

    try {
      const { artigo, relacionados } = await api(`/artigos/${encodeURIComponent(slug)}`);

      document.title = `${artigo.titulo} — Doutor Saúde Mental`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', artigo.resumo);
      atualizarMetadados(artigo, slug);

      // Capa gerada (Vercel Blob) — só renderiza quando o artigo tiver uma.
      const capaHtml = artigo.imagemCapa
        ? `<div class="artigo-capa">
             <img src="${esc(artigo.imagemCapa)}" alt="Capa do artigo: ${esc(artigo.titulo)}" width="1200" height="630" loading="eager">
           </div>`
        : '';

      // Narração TTS do artigo completo — idem, some quando não houver áudio.
      const narracaoHtml = artigo.audioNarracaoUrl
        ? `<div class="artigo-narracao">
             <p class="artigo-narracao__rotulo">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M16 8.2a4.2 4.2 0 0 1 0 7.6"/><path d="M18.6 5.6a7.8 7.8 0 0 1 0 12.8"/></svg>
               Ouvir o artigo completo
             </p>
             <audio controls preload="none" src="${esc(artigo.audioNarracaoUrl)}">
               Seu navegador não suporta áudio incorporado.
               <a href="${esc(artigo.audioNarracaoUrl)}">Baixar o áudio da narração</a>.
             </audio>
           </div>`
        : '';

      cabecalho.innerHTML = `
        <a href="/blog" style="display:inline-flex;align-items:center;gap:.4rem;font-size:.9rem;text-decoration:none;color:var(--tinta-fraca);margin-bottom:.5rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
          Todos os artigos
        </a>
        <div><span class="selo">${esc(artigo.categoria)}</span></div>
        <h1>${esc(artigo.titulo)}</h1>
        <p class="texto-apoio" style="font-size:1.12rem;">${esc(artigo.resumo)}</p>
        <div class="artigo-meta" style="margin-top:1.25rem;">
          <span>${esc(artigo.autor || 'Dr. Antônio Felipe')}</span>
          <span aria-hidden="true">•</span>
          <time datetime="${esc(artigo.publicadoEm)}">${esc(formatarData(artigo.publicadoEm))}</time>
          <span aria-hidden="true">•</span>
          <span>${esc(artigo.tempoLeitura || 4)} min de leitura</span>
        </div>
        ${capaHtml}
        ${narracaoHtml}`;

      conteudo.setAttribute('aria-busy', 'false');
      // O conteúdo é HTML escrito pela clínica pelas rotas administrativas
      // autenticadas — não é entrada de usuário anônimo.
      conteudo.innerHTML = artigo.conteudo;

      endurecerLinksExternos();
      exibirRelacionados(relacionados);
    } catch (err) {
      if (err.status === 404) {
        mostrarErro(
          'Artigo não encontrado',
          'Este artigo pode ter sido removido ou o endereço está incorreto.'
        );
      } else if (err.status === 503) {
        mostrarErro(
          'Serviço indisponível',
          'Não conseguimos carregar o artigo agora. Tente novamente em alguns instantes.'
        );
      } else {
        mostrarErro(
          'Não foi possível carregar o artigo',
          'Verifique sua conexão e tente recarregar a página.'
        );
      }
      console.warn('[artigo]', err.message);
    }
  }

  carregar();
})();
