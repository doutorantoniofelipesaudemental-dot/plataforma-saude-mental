/* =========================================================================
   Enquete de engajamento no fim do artigo (markup estático, presente no SSR
   e no shell — ver public/artigo.html). Cada pergunta vota de forma
   independente; qualquer resposta revela o agradecimento + CTA de contato.
   ========================================================================= */
(function () {
  'use strict';

  const { api } = window.Site;

  function obterSlug() {
    const partes = location.pathname.split('/').filter(Boolean);
    if (partes[0] === 'artigo' && partes[1]) return decodeURIComponent(partes[1]);
    return '';
  }

  const slug = obterSlug();
  const obrigado = document.getElementById('enquete-obrigado');
  const blocos = document.querySelectorAll('.enquete-bloco');
  if (!slug || !obrigado || !blocos.length) return;

  blocos.forEach((bloco) => {
    const campo = bloco.dataset.enqueteCampo;
    const botoes = Array.from(bloco.querySelectorAll('[data-enquete-valor]'));

    botoes.forEach((botao) => {
      botao.addEventListener('click', async () => {
        if (botao.disabled) return;
        const valor = botao.dataset.enqueteValor;
        botoes.forEach((b) => { b.disabled = true; });

        try {
          await api(`/artigos/${encodeURIComponent(slug)}/enquete`, {
            method: 'POST',
            body: JSON.stringify({ campo, valor }),
          });
          botao.setAttribute('aria-pressed', 'true');
          obrigado.hidden = false;
          obrigado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (err) {
          botoes.forEach((b) => { b.disabled = false; });
          console.warn('[enquete]', err.message);
        }
      });
    });
  });
})();
