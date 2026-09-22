const { mongoose } = require('../lib/db');

/**
 * Solicitação de contato institucional (Mentoria Individual ou Consultoria em
 * Saúde Mental Institucional), vinda da seção de Serviços da home. Separado
 * de `Agendamento` de propósito: não é uma marcação de consulta clínica com
 * data/período/modalidade, é o primeiro contato de um lead — pessoa física
 * interessada em mentoria ou empresa interessada em consultoria.
 *
 * LGPD: mesma política do Agendamento — só dados de contato, sem CPF,
 * documentos ou dado sensível de saúde.
 */
const ContatoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Informe seu nome.'],
      trim: true,
      minlength: [2, 'Nome muito curto.'],
      maxlength: [120, 'Nome muito longo.'],
    },
    email: {
      type: String,
      required: [true, 'Informe seu e-mail.'],
      trim: true,
      lowercase: true,
      maxlength: [160, 'E-mail muito longo.'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'E-mail inválido.'],
    },
    telefone: {
      type: String,
      required: [true, 'Informe um telefone para contato.'],
      trim: true,
      maxlength: [25, 'Telefone muito longo.'],
    },
    tipoAtendimento: {
      type: String,
      required: true,
      enum: {
        values: ['particular', 'consultoria-empresa'],
        message: 'Tipo de atendimento inválido.',
      },
      default: 'particular',
      index: true,
    },
    mensagem: {
      type: String,
      required: [true, 'Conte um pouco sobre o que você procura.'],
      trim: true,
      minlength: [10, 'Escreva um pouco mais (mínimo 10 caracteres).'],
      maxlength: [800, 'Mensagem muito longa (máx. 800 caracteres).'],
    },
    consentimentoLGPD: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v) => v === true,
        message: 'É necessário aceitar a política de privacidade.',
      },
    },
    status: {
      type: String,
      enum: ['novo', 'em-contato', 'concluido'],
      default: 'novo',
      index: true,
    },
    origem: { type: String, default: 'site-servicos', maxlength: 60 },
    userAgent: { type: String, maxlength: 300, select: false },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
    versionKey: false,
  }
);

ContatoSchema.index({ criadoEm: -1 });
ContatoSchema.index({ email: 1, criadoEm: -1 });

module.exports = mongoose.models.Contato || mongoose.model('Contato', ContatoSchema);
