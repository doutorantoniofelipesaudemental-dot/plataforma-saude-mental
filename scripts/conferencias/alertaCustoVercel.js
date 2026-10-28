/**
 * Alerta de custo da Vercel dentro da conferência diária (ordem de 28/10/2026).
 * Função pura: lê a saída do scripts/creditoVercel.js (última linha = JSON) e diz o que a conferência deve registrar.
 * Alerta real (cobrança ou crédito do painel) = falha com ação; API sem resposta (leitura indisponível) = aviso. Nunca lança exceção.
 */
function resultadoAlertaCusto(stdout) {
  let j = null;
  try { j = JSON.parse(String(stdout || '').trim().split('\n').pop()); } catch { /* sem JSON */ }
  if (!j || typeof j !== 'object') return { nivel: 'falha', texto: 'alerta de custo Vercel falhou (sem resultado): ver scripts/creditoVercel.js' };
  if (j.alerta) return { nivel: 'falha', texto: `alerta de custo Vercel: ${(j.motivos || []).join(', ') || 'ver vercel-credito.json'}` };
  if (j.status === 'indisponivel') return { nivel: 'aviso', texto: 'leitura da cobrança Vercel indisponível (API não respondeu): alerta só pelo crédito do painel; conferir no painel' };
  return { nivel: 'ok', texto: '' };
}

module.exports = { resultadoAlertaCusto };
