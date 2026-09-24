const { mongoose } = require('../lib/db');

/**
 * Credenciais renovadas automaticamente em runtime (hoje só o token do
 * Instagram — ver backend/lib/tokenInstagram.js). O valor NUNCA fica em claro:
 * `cifrado` é AES-256-GCM (iv + tag + texto, em base64). `origemHash` é o
 * SHA-256 do token que estava na variável de ambiente quando esta cadeia de
 * renovações começou — se a variável mudar (troca manual), a cadeia é
 * descartada e o token da variável volta a valer.
 */
const CredencialSchema = new mongoose.Schema(
  {
    chave: { type: String, required: true, unique: true, index: true },
    cifrado: { type: String, default: '' },
    origemHash: { type: String, default: '' },
    renovadoEm: { type: Date, default: null },
    expiraEm: { type: Date, default: null },
    ultimaTentativaEm: { type: Date, default: null },
    ultimoErro: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' }, versionKey: false }
);

module.exports = mongoose.models.Credencial || mongoose.model('Credencial', CredencialSchema);
