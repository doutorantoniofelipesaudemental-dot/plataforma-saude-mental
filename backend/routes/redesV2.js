const express = require('express');
const { exigirBanco, comparacaoSegura } = require('../middleware');
const { imagemPublica, previaHtml } = require('../lib/redesV2/fila');

/** /api/redes-v2/img/:id/:n.png — imagem do post (o Instagram busca daqui; o hash é conferido na publicação). */
const api = express.Router();
api.get('/img/:id/:n.png', exigirBanco, async (req, res) => {
  const img = await imagemPublica(req.params.id, req.params.n);
  if (!img) return res.status(404).json({ erro: 'Imagem não encontrada.' });
  res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, immutable', ETag: `"${img.hash}"` });
  res.send(img.buffer);
});

/** /redes/previa — só para acompanhar (não aprova nada). Local: aberta. Produção: exige ?token=ADMIN_TOKEN. */
async function pagina(req, res) {
  if (process.env.NODE_ENV === 'production') {
    const esperado = process.env.ADMIN_TOKEN;
    const recebido = String(req.query.token || req.get('x-admin-token') || '');
    if (!esperado || !recebido || !comparacaoSegura(recebido, esperado)) return res.status(401).type('text').send('Não autorizado.');
  }
  res.set('Cache-Control', 'no-store').type('html').send(await previaHtml());
}

module.exports = { api, pagina: [exigirBanco, pagina] };
