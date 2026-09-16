const { mongoose } = require('../lib/db');

/**
 * Solicitação de agendamento vinda do formulário público.
 *
 * Importante (LGPD): este formulário é uma *solicitação de contato*, não um
 * prontuário. Por isso não coletamos CPF, documentos, histórico clínico ou
 * qualquer dado sensível de saúde. O campo `mensagem` é livre e limitado, e a
 * orientação ao paciente no front-end é para não descrever sintomas ali.
 */
const AgendamentoSchema = new mongoose.Schema(
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
    modalidade: {
      type: String,
      required: true,
      enum: {
        values: ['online', 'presencial'],
        message: 'Modalidade inválida.',
      },
      default: 'online',
    },
    tipoConsulta: {
      type: String,
      required: true,
      enum: {
        values: ['primeira-consulta', 'retorno'],
        message: 'Tipo de consulta inválido.',
      },
      default: 'primeira-consulta',
    },
    dataPreferida: {
      type: Date,
      required: [true, 'Escolha uma data de preferência.'],
    },
    periodoPreferido: {
      type: String,
      required: true,
      enum: {
        values: ['manha', 'tarde', 'noite'],
        message: 'Período inválido.',
      },
      default: 'manha',
    },
    mensagem: {
      type: String,
      trim: true,
      maxlength: [600, 'Mensagem muito longa (máx. 600 caracteres).'],
      default: '',
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
      enum: ['novo', 'em-contato', 'confirmado', 'realizado', 'cancelado'],
      default: 'novo',
      index: true,
    },
    origem: { type: String, default: 'site', maxlength: 60 },
    // Metadados mínimos para investigar abuso do formulário. Sem IP bruto.
    userAgent: { type: String, maxlength: 300, select: false },
  },
  {
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
    versionKey: false,
  }
);

AgendamentoSchema.index({ criadoEm: -1 });
AgendamentoSchema.index({ email: 1, criadoEm: -1 });

module.exports =
  mongoose.models.Agendamento || mongoose.model('Agendamento', AgendamentoSchema);
