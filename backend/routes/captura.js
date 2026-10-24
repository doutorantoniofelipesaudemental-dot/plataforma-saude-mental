const express = require('express');
const { limitarTaxa } = require('../middleware');
const { lerConfigFunil, decidirCaptura } = require('../lib/funilEmail');
const { log } = require('../lib/log');

const router = express.Router();
const limiteCaptura = limitarTaxa({ nome: 'captura-email', janelaMs: 60_000, maximo: 5 });

/**
 * POST /api/captura-email — inscrição do miniaplicativo no funil. Corpo: {email, consentimento: true, website (honeypot)}.
 * 503 enquanto as chaves do Pocketsflow não existirem na Vercel. Nunca grava o e-mail aqui: só encaminha.
 */
router.post('/', limiteCaptura, async (req, res) => {
  const decisao = decidirCaptura({ corpo: req.body, config: lerConfigFunil() });
  if (!decisao.encaminhar) return res.status(decisao.status).json(decisao.corpo);

  const config = lerConfigFunil();
  try {
    const resp = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(decisao.encaminhar),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) throw new Error(`funil respondeu HTTP ${resp.status}`);
    return res.status(202).json(decisao.corpo);
  } catch (err) {
    log.erro('[captura-email] falha ao encaminhar ao funil:', err.message);
    return res.status(502).json({ erro: 'Não foi possível concluir a inscrição agora. Tente de novo em instantes.' });
  }
});

module.exports = router;
