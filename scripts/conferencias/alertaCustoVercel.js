/**
 * Alerta de custo da Vercel dentro da conferência diária (ordem de 28/10/2026).
 * Função pura: lê a saída do scripts/creditoVercel.js (última linha = JSON) e diz o que a conferência deve registrar.
 * Falha de leitura ou alerta de cobrança = falha com ação; leitura manual = aviso. Nunca lança exceção.
 */
function resultadoAlertaCusto(stdout) {
  let j = null;
  try { j = JSON.parse(String(stdout || '').trim().split('\n').pop()); } catch { /* sem JSON */ }
  if (!j || typeof j !== 'object') return { nivel: 'falha', texto: 'alerta de custo Vercel falhou (sem resultado): ver scripts/creditoVercel.js' };
  if (j.alerta) return { nivel: 'falha', texto: `alerta de custo Vercel: ${(j.motivos || []).join(', ') || 'ver vercel-credito.json'}` };
  if (j.status === 'manual') return { nivel: 'aviso', texto: 'custo Vercel sem leitura automática: conferir o painel e atualizar relatorios/vercel-credito.json' };
  return { nivel: 'ok', texto: '' };
}

module.exports = { resultadoAlertaCusto };
