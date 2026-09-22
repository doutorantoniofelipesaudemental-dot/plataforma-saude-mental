const express = require('express');
const Contato = require('../models/Contato');
const {
  exigirBanco,
  exigirAdmin,
  limitarTaxa,
  tratarErroValidacao,
} = require('../middleware');

const router = express.Router();

// Mesmo limite do formulário de agendamento.
const limiteEnvio = limitarTaxa({ janelaMs: 60_000, maximo: 5 });

/** Campos que o público pode enviar. Qualquer outro é descartado. */
const CAMPOS_PERMITIDOS = ['nome', 'email', 'telefone', 'tipoAtendimento', 'mensagem', 'consentimentoLGPD'];

/**
 * POST /api/contato
 * Cria uma solicitação de contato (Mentoria Individual / Consultoria
 * Institucional) a partir da seção de Serviços da home.
 */
router.post('/', limiteEnvio, exigirBanco, async (req, res) => {
  const corpo = req.body || {};

  // Honeypot: campo invisível no formulário. Se veio preenchido, é bot.
  if (typeof corpo.website === 'string' && corpo.website.trim() !== '') {
    return res.status(200).json({ ok: true, mensagem: 'Solicitação recebida.' });
  }

  const dados = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (corpo[campo] !== undefined) dados[campo] = corpo[campo];
  }

  try {
    // Mesmo e-mail nos últimos 10 minutos devolve a solicitação já existente
    // em vez de criar outra (clique duplo, reenvio).
    if (dados.email) {
      const limite = new Date(Date.now() - 10 * 60 * 1000);
      const recente = await Contato.findOne({
        email: String(dados.email).toLowerCase().trim(),
        criadoEm: { $gte: limite },
      }).lean();

      if (recente) {
        return res.status(200).json({
          ok: true,
          duplicado: true,
          mensagem: 'Já recebemos sua mensagem. Entraremos em contato em breve.',
          contato: { id: String(recente._id), status: recente.status },
        });
      }
    }

    const contato = await Contato.create({
      ...dados,
      userAgent: (req.get('user-agent') || '').slice(0, 300),
    });

    return res.status(201).json({
      ok: true,
      mensagem: 'Mensagem recebida. Entraremos em contato em breve.',
      contato: { id: String(contato._id), nome: contato.nome, tipoAtendimento: contato.tipoAtendimento, status: contato.status },
    });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[contato] erro ao criar:', err);
    return res.status(500).json({ erro: 'Não foi possível registrar sua mensagem.' });
  }
});

/**
 * GET /api/contato  (administrativo)
 * Lista solicitações com filtro por status/tipoAtendimento e paginação.
 */
router.get('/', exigirAdmin, exigirBanco, async (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite, 10) || 20));
  const filtro = {};

  if (req.query.status) filtro.status = String(req.query.status);
  if (req.query.tipoAtendimento) filtro.tipoAtendimento = String(req.query.tipoAtendimento);

  try {
    const [itens, total] = await Promise.all([
      Contato.find(filtro)
        .sort({ criadoEm: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .lean(),
      Contato.countDocuments(filtro),
    ]);

    res.json({
      itens,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  } catch (err) {
    console.error('[contato] erro ao listar:', err);
    res.status(500).json({ erro: 'Não foi possível listar as solicitações.' });
  }
});

/**
 * PATCH /api/contato/:id  (administrativo)
 * Atualiza apenas o status da solicitação.
 */
router.patch('/:id', exigirAdmin, exigirBanco, async (req, res) => {
  const { status } = req.body || {};
  const permitidos = ['novo', 'em-contato', 'concluido'];

  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.', permitidos });
  }

  try {
    const atualizado = await Contato.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!atualizado) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    res.json({ ok: true, contato: atualizado });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ erro: 'Identificador inválido.' });
    }
    console.error('[contato] erro ao atualizar:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar a solicitação.' });
  }
});

module.exports = router;
