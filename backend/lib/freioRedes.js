/**
 * Freio de emergência das redes sociais (PROMPT-MESTRE, Parte 3.4), padrão SEGURO desde 06/11/2026 (ordem do Dr. Antônio):
 * só REDES_PUBLICACAO_ATIVA="true" (sem diferença de maiúsculas e espaços) libera o envio a Instagram, LinkedIn ou YouTube.
 * Ausente, vazia ou qualquer outro valor = NÃO publica. Na Vercel: Project Settings → Environment Variables
 * → REDES_PUBLICACAO_ATIVA → true → Redeploy (ou `vercel env`). Quem religa é o Dr. Antônio, no painel.
 */
const redesAtivas = (env = process.env) => String(env.REDES_PUBLICACAO_ATIVA ?? '').trim().toLowerCase() === 'true';

function exigirRedesAtivas(contexto = 'publicação em rede social') {
  if (!redesAtivas()) {
    const err = new Error(`REDES_PUBLICACAO_ATIVA ausente ou diferente de "true": ${contexto} bloqueada pelo freio de emergência.`);
    err.codigo = 'REDES_PAUSADAS';
    throw err;
  }
}

module.exports = { redesAtivas, exigirRedesAtivas };
