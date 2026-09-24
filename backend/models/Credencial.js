const { mongoose } = require('../lib/db');

/**
 * Credenciais renovadas automaticamente em runtime (hoje só o token do
 * Instagram — ver backend/lib/tokenInstagram.js). O valor NUNCA fica em claro:
 * `cifrado` é AES-256-GCM (iv + tag + texto, em base64). `origemHash` é o
 * SHA-256 do token que estava na variável de ambiente quando esta cadeia de
 * renovações começou (truncado em 16 hex) — se a variável mudar (troca
 * manual), a cadeia é descartada e o token da variável volta a valer.
 * A chave de cifra é derivada do CRON_SECRET e NUNCA é gravada aqui.
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
    // Impressão digital (SHA-256 truncado, 16 hex) do token renovado — só
    // para identificá-lo em logs e no /admin, nunca para reconstruí-lo.
    impressaoDigital: { type: String, default: '' },
    // Pausa automática da fila quando a Meta recusa o token (revogado,
    // inválido, sem permissão). Vale enquanto o token em uso tiver a mesma
    // impressão digital de `impressaoPausada` — um token novo retoma a fila.
    pausadoEm: { type: Date, default: null },
    motivoPausa: { type: String, default: '' },
    impressaoPausada: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' }, versionKey: false }
);

module.exports = mongoose.models.Credencial || mongoose.model('Credencial', CredencialSchema);
