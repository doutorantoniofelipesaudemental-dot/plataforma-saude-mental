const { mongoose } = require('../lib/db');

const Checagem = {
  ok: Boolean,
  falhas: [String],
};

/**
 * Um registro por tentativa de publicação nas redes — aprovada ou não — com o
 * resultado de cada uma das três checagens (backend/lib/checagemRedes.js).
 * É a trilha de auditoria: por que um post saiu, ou por que foi barrado.
 */
const RegistroPublicacaoSchema = new mongoose.Schema(
  {
    data: { type: Date, default: Date.now, index: true },
    artigo: { type: mongoose.Schema.Types.ObjectId, ref: 'Artigo', index: true },
    slug: { type: String, index: true },
    origem: { type: String, enum: ['cron', 'admin', 'cli', 'previa', 'bot'], default: 'cron' },
    // reprovado: barrado nas checagens; publicado: ao menos uma rede postou;
    // falha-rede: aprovado, mas todas as redes falharam; previa: só simulação.
    resultado: { type: String, enum: ['reprovado', 'publicado', 'falha-rede', 'previa'], required: true, index: true },
    motivo: { type: String, default: '' },
    checagens: {
      conteudo: Checagem,
      visual: Checagem,
      seguranca: Checagem,
    },
    // Não reprovam, mas ficam registradas (ex.: narração ausente/desatualizada).
    pendencias: [String],
    capa: { url: String, hash: String },
    legenda: String,
    redes: { type: mongoose.Schema.Types.Mixed },
  },
  { versionKey: false, collection: 'registrospublicacao' }
);

module.exports =
  mongoose.models.RegistroPublicacao || mongoose.model('RegistroPublicacao', RegistroPublicacaoSchema);
