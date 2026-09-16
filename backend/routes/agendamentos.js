const express = require('express');
const Agendamento = require('../models/Agendamento');
const {
  exigirBanco,
  exigirAdmin,
  limitarTaxa,
  tratarErroValidacao,
} = require('../middleware');

const router = express.Router();

// Até 5 envios por minuto por IP na criação (ver ressalva em middleware/index.js).
const limiteEnvio = limitarTaxa({ janelaMs: 60_000, maximo: 5 });

/** Campos que o público pode enviar. Qualquer outro é descartado. */
const CAMPOS_PERMITIDOS = [
  'nome',
  'email',
  'telefone',
  'modalidade',
  'tipoConsulta',
  'dataPreferida',
  'periodoPreferido',
  'mensagem',
  'consentimentoLGPD',
];

/**
 * POST /api/agendamentos
 * Cria uma solicitação de agendamento a partir do formulário público.
 */
router.post('/', limiteEnvio, exigirBanco, async (req, res) => {
  const corpo = req.body || {};

  // Honeypot: campo invisível no formulário. Se veio preenchido, é bot.
  // Respondemos 200 de propósito para o bot não descobrir a regra.
  if (typeof corpo.website === 'string' && corpo.website.trim() !== '') {
    return res.status(200).json({ ok: true, mensagem: 'Solicitação recebida.' });
  }

  const dados = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (corpo[campo] !== undefined) dados[campo] = corpo[campo];
  }

  // A data precisa ser futura — validamos aqui para dar uma mensagem melhor
  // do que a do cast do Mongoose.
  const data = new Date(dados.dataPreferida);
  if (Number.isNaN(data.getTime())) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      campos: { dataPreferida: 'Escolha uma data válida.' },
    });
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (data < hoje) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      campos: { dataPreferida: 'A data precisa ser hoje ou no futuro.' },
    });
  }

  try {
    // Evita duplicidade por clique duplo ou reenvio: mesmo e-mail nos últimos
    // 10 minutos devolve a solicitação já existente em vez de criar outra.
    if (dados.email) {
      const limite = new Date(Date.now() - 10 * 60 * 1000);
      const recente = await Agendamento.findOne({
        email: String(dados.email).toLowerCase().trim(),
        criadoEm: { $gte: limite },
      }).lean();

      if (recente) {
        return res.status(200).json({
          ok: true,
          duplicado: true,
          mensagem: 'Já recebemos sua solicitação. Entraremos em contato em breve.',
          agendamento: { id: String(recente._id), status: recente.status },
        });
      }
    }

    const agendamento = await Agendamento.create({
      ...dados,
      dataPreferida: data,
      userAgent: (req.get('user-agent') || '').slice(0, 300),
    });

    return res.status(201).json({
      ok: true,
      mensagem: 'Solicitação recebida. Entraremos em contato para confirmar.',
      agendamento: {
        id: String(agendamento._id),
        nome: agendamento.nome,
        dataPreferida: agendamento.dataPreferida,
        periodoPreferido: agendamento.periodoPreferido,
        modalidade: agendamento.modalidade,
        status: agendamento.status,
      },
    });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[agendamentos] erro ao criar:', err);
    return res.status(500).json({ erro: 'Não foi possível registrar a solicitação.' });
  }
});

/**
 * GET /api/agendamentos  (administrativo)
 * Lista solicitações com filtro por status e paginação.
 */
router.get('/', exigirAdmin, exigirBanco, async (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, parseInt(req.query.limite, 10) || 20));
  const filtro = {};

  if (req.query.status) filtro.status = String(req.query.status);

  try {
    const [itens, total] = await Promise.all([
      Agendamento.find(filtro)
        .sort({ criadoEm: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .lean(),
      Agendamento.countDocuments(filtro),
    ]);

    res.json({
      itens,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  } catch (err) {
    console.error('[agendamentos] erro ao listar:', err);
    res.status(500).json({ erro: 'Não foi possível listar as solicitações.' });
  }
});

/**
 * PATCH /api/agendamentos/:id  (administrativo)
 * Atualiza apenas o status da solicitação.
 */
router.patch('/:id', exigirAdmin, exigirBanco, async (req, res) => {
  const { status } = req.body || {};
  const permitidos = ['novo', 'em-contato', 'confirmado', 'realizado', 'cancelado'];

  if (!permitidos.includes(status)) {
    return res.status(400).json({
      erro: 'Status inválido.',
      permitidos,
    });
  }

  try {
    const atualizado = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!atualizado) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    res.json({ ok: true, agendamento: atualizado });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ erro: 'Identificador inválido.' });
    }
    console.error('[agendamentos] erro ao atualizar:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar a solicitação.' });
  }
});

module.exports = router;
