const express = require('express');
const { exigirBanco, comparacaoSegura } = require('../middleware');
const { publicarProximoDaFila } = require('../lib/filaRedes');
const { renovarTokenInstagram } = require('../lib/tokenInstagram');

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

/**
 * GET /api/cron/renovar-token-instagram — semanal. Renova o token do
 * Instagram Login e guarda o novo cifrado (ver backend/lib/tokenInstagram.js).
 * Falha de renovação responde 200 de propósito: o motivo vai no corpo e no
 * log "[token-instagram] FALHA NA RENOVAÇÃO"; 500 fica para erro inesperado.
 */
router.get('/renovar-token-instagram', exigirCron, exigirBanco, async (req, res) => {
  try {
    res.json(await renovarTokenInstagram());
  } catch (err) {
    console.error('[token-instagram] erro inesperado na renovação:', err);
    res.status(500).json({ erro: 'Falha inesperada na renovação do token.' });
  }
});

module.exports = router;
