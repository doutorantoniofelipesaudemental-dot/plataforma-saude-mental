const express = require('express');
const { exigirBanco, comparacaoSegura } = require('../middleware');
const { publicarProximoDaFila } = require('../lib/filaRedes');

const router = express.Router();

/**
 * O Vercel Cron chama com `Authorization: Bearer <CRON_SECRET>`. Sem a
 * variável definida a rota fica fechada — é também o interruptor da fila:
 * remover CRON_SECRET na Vercel pausa todas as publicações agendadas.
 */
function exigirCron(req, res, next) {
  const segredo = process.env.CRON_SECRET;
  const header = req.get('authorization') || '';
  if (!segredo || !header.startsWith('Bearer ') || !comparacaoSegura(header.slice(7), segredo)) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }
  next();
}

/** GET /api/cron/publicar-fila — publica no máximo 1 artigo (ver backend/lib/filaRedes.js). */
router.get('/publicar-fila', exigirCron, exigirBanco, async (req, res) => {
  try {
    const resultado = await publicarProximoDaFila({ simular: req.query.simular === '1' });
    console.log('[fila-redes]', JSON.stringify(resultado));
    res.json(resultado);
  } catch (err) {
    console.error('[fila-redes] erro inesperado:', err);
    res.status(500).json({ erro: 'Falha inesperada na fila de publicação.' });
  }
});

module.exports = router;
