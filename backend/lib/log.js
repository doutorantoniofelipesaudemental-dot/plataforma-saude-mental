/**
 * Log único do backend de redes/cron/token/admin (seção "Segredos" do
 * CLAUDE.md): todo texto passa por `mascarar()` antes de chegar ao console —
 * e daí aos logs da Vercel. Mascara:
 *
 *   - o valor EXATO de cada variável de ambiente sensível (SEGREDOS_DO_AMBIENTE);
 *   - qualquer coisa com cara de token: IGAA…, EAA…, "Bearer …"/"OAuth …",
 *     mongodb://usuario:senha@, ?access_token=/client_secret= em URLs,
 *     chaves sk-/sk-ant-/r8_/vercel_blob_rw_/gh*_.
 *
 * Objetos e erros são serializados e mascarados também (inclusive stack).
 */
const SEGREDOS_DO_AMBIENTE = [
  'INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_APP_SECRET', 'FACEBOOK_APP_SECRET',
  'CRON_SECRET', 'ADMIN_TOKEN', 'MONGODB_URI', 'MONGO_URL',
  'LINKEDIN_ACCESS_TOKEN', 'BLOB_READ_WRITE_TOKEN', 'ANTHROPIC_API_KEY',
  'COMPOSIO_API_KEY', 'REPLICATE_API_TOKEN', 'VERCEL_OIDC_TOKEN',
];

const PADROES = [
  // Bearer primeiro: cobre o token inteiro antes dos padrões por prefixo.
  [/\b(Bearer|OAuth)\s+[A-Za-z0-9._~+/=-]{6,}/gi, '$1 ***'],
  [/\bIGAA[A-Za-z0-9_-]{8,}/g, 'IGAA***'],
  [/\bEAA[A-Za-z0-9]{8,}/g, 'EAA***'],
  [/(mongodb(?:\+srv)?:\/\/)[^\s"'@/]+@/g, '$1***@'],
  [/([?&](?:access_token|client_secret|fb_exchange_token|input_token)=)[^&\s"'<>]+/gi, '$1***'],
  [/\b(sk-ant-|sk-proj-|sk-|r8_|vercel_blob_rw_|gh[pousr]_)[A-Za-z0-9_-]{8,}/g, '$1***'],
];

function mascarar(texto) {
  let s = String(texto);
  for (const nome of SEGREDOS_DO_AMBIENTE) {
    const valor = (process.env[nome] || '').trim().replace(/^"|"$/g, '');
    if (valor.length >= 8) s = s.split(valor).join(`***${nome}***`);
  }
  for (const [padrao, troca] of PADROES) s = s.replace(padrao, troca);
  return s;
}

function formatar(arg) {
  if (arg instanceof Error) return mascarar(arg.stack || arg.message);
  if (typeof arg === 'string') return mascarar(arg);
  try {
    return mascarar(JSON.stringify(arg));
  } catch {
    return mascarar(String(arg));
  }
}

const log = {
  info: (...args) => console.log(...args.map(formatar)),
  aviso: (...args) => console.warn(...args.map(formatar)),
  erro: (...args) => console.error(...args.map(formatar)),
};

module.exports = { log, mascarar };
