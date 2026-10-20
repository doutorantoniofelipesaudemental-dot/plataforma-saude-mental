const express = require('express');
const { exigirBanco, comparacaoSegura } = require('../middleware');
const { publicarProximoDaFila } = require('../lib/filaRedes');
const { renovarTokenInstagram } = require('../lib/tokenInstagram');
const { publicarVencidos } = require('../lib/publicarAgendados');
const { redesAtivas } = require('../lib/freioRedes');
const { publicarDevidos } = require('../lib/redesV2/fila');
const { gerarRelatorio } = require('../lib/redesV2/relatorio');
const { log } = require('../lib/log');
const { publicarDevidos: publicarLinkedin } = require('../lib/linkedinFila');

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
    if (!redesAtivas()) return res.json({ publicado: false, motivo: 'REDES_PUBLICACAO_ATIVA=false (freio de emergência)' });
    const resultado = await publicarProximoDaFila({ simular: req.query.simular === '1' });
    log.info('[fila-redes]', JSON.stringify(resultado));
    res.json(resultado);
  } catch (err) {
    log.erro('[fila-redes] erro inesperado:', err);
    res.status(500).json({ erro: 'Falha inesperada na fila de publicação.' });
  }
});

/**
 * GET /api/cron/publicar-agendados — a cada 30 min. Publica no SITE os itens agendados cujo horário chegou,
 * auditando cada um antes (ver backend/lib/publicarAgendados.js). Não toca nas redes sociais.
 */
router.get('/publicar-agendados', exigirCron, exigirBanco, async (req, res) => {
  try {
    const r = await publicarVencidos({ diario: process.env.AGENDADOS_MODO !== 'meia-hora' }); // Hobby: 1x/dia, publica o dia inteiro
    log.info('[agendados]', JSON.stringify({ publicados: r.publicados.length, barrados: r.barrados.length, pendentes: r.pendentes }));
    res.json(r);
  } catch (err) {
    log.erro('[agendados] erro inesperado:', err);
    res.status(500).json({ erro: 'Falha inesperada na publicação agendada.' });
  }
});

/**
 * GET /api/cron/publicar-redes-v2 — diário (seg a sex, 08:00 de Salvador). Publica 1 post da fila NOVA de redes,
 * somente se a conferência completa passar (backend/lib/redesV2/fila.js). Respeita REDES_PUBLICACAO_ATIVA.
 */
router.get('/publicar-redes-v2', exigirCron, exigirBanco, async (req, res) => {
  try {
    const r = await publicarDevidos({ simular: req.query.simular === '1' });
    log.info('[redes-v2]', JSON.stringify({ publicado: r.publicado, motivo: r.motivo, id: r.id }));
    res.json(r);
  } catch (err) {
    log.erro('[redes-v2] erro inesperado:', err);
    res.status(500).json({ erro: 'Falha inesperada na publicação das redes.' });
  }
});

/** GET /api/cron/publicar-linkedin — seg/qua/sex 19:30 (Salvador). 1 texto por execução, com freio próprio LINKEDIN_PUBLICACAO_ATIVA (ver backend/lib/linkedinFila.js). */
router.get('/publicar-linkedin', exigirCron, exigirBanco, async (req, res) => {
  try {
    const { mongoose } = require('../lib/db');
    const r = await publicarLinkedin({ db: mongoose.connection.db, simular: req.query.simular === '1' });
    log.info('[linkedin]', JSON.stringify({ publicado: r.publicado, motivo: r.motivo, id: r.id }));
    res.json(r);
  } catch (err) {
    log.erro('[linkedin] erro inesperado:', err);
    res.status(500).json({ erro: 'Falha inesperada na publicação do LinkedIn.' });
  }
});

/** GET /api/cron/relatorio-redes — toda segunda-feira. Grava o relatório semanal no banco (coleção redes_v2_relatorios). */
router.get('/relatorio-redes', exigirCron, exigirBanco, async (req, res) => {
  try {
    const { mongoose } = require('../lib/db');
    const r = await gerarRelatorio();
    await mongoose.connection.db.collection('redes_v2_relatorios').replaceOne({ _id: `${r.ano}-W${String(r.semana).padStart(2, '0')}` }, { _id: `${r.ano}-W${String(r.semana).padStart(2, '0')}`, md: r.md, geradoEm: new Date() }, { upsert: true });
    res.json({ ok: true, semana: r.semana, publicados: r.publicados });
  } catch (err) {
    log.erro('[relatorio-redes] erro:', err);
    res.status(500).json({ erro: 'Falha ao gerar o relatório semanal.' });
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
    log.erro('[token-instagram] erro inesperado na renovação:', err);
    res.status(500).json({ erro: 'Falha inesperada na renovação do token.' });
  }
});

/**
 * GET /api/cron/diagnostico-instagram — diário às 20:00 de Salvador (23:00 UTC). Valida o próximo post da fila SEM publicar
 * e guarda o resultado. Responde só { ok, postId, falhas } (sem token nem IDs). Nunca publica.
 */
router.get('/diagnostico-instagram', exigirCron, exigirBanco, async (req, res) => {
  try {
    const { executarDiagnostico, salvarNoBanco } = require('../lib/diagnosticoPublicacao');
    const r = await executarDiagnostico({ salvar: salvarNoBanco });
    res.json({ ok: r.ok, postId: r.postId, falhas: r.falhas });
  } catch (err) {
    log.erro('[diagnostico-instagram] erro inesperado:', err);
    res.status(500).json({ ok: false, erro: 'Falha inesperada no diagnóstico.' });
  }
});

module.exports = router;
