/* =========================================================================
   Botão "Solicitar narração em áudio" do fallback do player (ver
   backend/lib/renderizarArtigo.js e assets/js/artigo.js). Delegação de
   evento porque, no caminho sem SSR, o botão só entra no DOM depois do
   fetch do artigo — um listener direto na carga da página o perderia.
   ========================================================================= */
(function () {
  'use strict';

  const { api } = window.Site;

  document.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-solicitar-narracao]');
    if (!botao || botao.disabled) return;

    const slug = botao.dataset.solicitarNarracao;
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Enviando…';

    try {
      await api(`/artigos/${encodeURIComponent(slug)}/solicitar-narracao`, { method: 'POST' });
      botao.textContent = 'Pedido registrado ✓';
    } catch (err) {
      botao.disabled = false;
      botao.textContent = textoOriginal;
      console.warn('[narracao]', err.message);
    }
  });
})();
