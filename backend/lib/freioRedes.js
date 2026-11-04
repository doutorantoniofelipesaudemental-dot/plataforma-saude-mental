/**
 * Freio de emergência das redes sociais (PROMPT-MESTRE, Parte 3.4): REDES_PUBLICACAO_ATIVA=false
 * (também "0"/"off"/"nao") impede QUALQUER envio a Instagram, LinkedIn ou YouTube. Qualquer outro valor
 * (inclusive ausente) mantém o comportamento anterior. Na Vercel: Project Settings → Environment Variables
 * → REDES_PUBLICACAO_ATIVA → true/false → Redeploy (ou `vercel env`).
 */
const redesAtivas = (env = process.env) => !/^(false|0|off|nao|não)$/i.test(String(env.REDES_PUBLICACAO_ATIVA ?? '').trim());

// `excecao: true` só é passado pelo envio de teste da demo de auditoria (ordem de 30/10/2026): nada mais libera o freio.
function exigirRedesAtivas(contexto = 'publicação em rede social', { excecao = false } = {}) {
  if (!redesAtivas() && excecao !== true) {
    const err = new Error(`REDES_PUBLICACAO_ATIVA=false: ${contexto} bloqueada pelo freio de emergência.`);
    err.codigo = 'REDES_PAUSADAS';
    throw err;
  }
}

module.exports = { redesAtivas, exigirRedesAtivas };
