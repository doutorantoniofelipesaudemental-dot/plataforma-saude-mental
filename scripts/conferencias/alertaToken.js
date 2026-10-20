/**
 * Alerta do token do Instagram no RESUMO-DO-DIA.md (ordem de 20/10/2026): 15 dias ou menos para vencer = alerta com ação.
 * Função pura (testável). Vencido também vira alerta com ação. Sem data conhecida: nenhum alerta.
 */
const DIA_MS = 24 * 3600e3;

function alertaTokenInstagram({ hoje, expiraEm }) {
  if (!expiraEm) return null;
  const venceISO = new Date(expiraEm).toISOString().slice(0, 10);
  const dias = Math.round((Date.parse(`${venceISO}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / DIA_MS);
  if (dias < 0) return { texto: 'Instagram: token VENCIDO — publicações param. Gerar token novo (npm run renovar-token-instagram)', acao: true, primeira: true };
  if (dias <= 15) return { texto: `PRECISA DE VOCÊ: token do Instagram vence em ${dias} dia(s) (${venceISO}). Renovar antes da próxima publicação`, acao: true, primeira: true };
  return null;
}

module.exports = { alertaTokenInstagram };

// Diagnóstico diário da Vercel (diagnosticos_publicacao): sem resultado recente ou com falha = alerta com ação.
function alertaDiagnostico({ agora, diag }) {
  if (!diag || !diag.executadoEm) return { texto: 'PRECISA DE VOCÊ: diagnóstico da Vercel (token e ID) não rodou ainda. Verificar o cron diagnostico-instagram', acao: true, primeira: true };
  const horas = (new Date(agora) - new Date(diag.executadoEm)) / 3600e3;
  if (horas > 30) return { texto: `PRECISA DE VOCÊ: diagnóstico da Vercel sem resultado há ${Math.round(horas)} h`, acao: true, primeira: true };
  if (!diag.ok) return { texto: `PRECISA DE VOCÊ: diagnóstico da Vercel reprovou o próximo post (${diag.postId || 'sem post'}): ${(diag.falhas || []).join(' | ').slice(0, 140)}`, acao: true, primeira: true };
  return null;
}

module.exports.alertaDiagnostico = alertaDiagnostico;

// Segunda-feira: o cron semanal (12:00 UTC) deve ter gravado renovadoEm e expiraEm antes da conferência (09:30 de Brasília).
function checagemRenovacaoSemanal({ hoje, renovadoEm, expiraEm }) {
  const agora = Date.parse(`${hoje}T12:00:00Z`);
  if (new Date(agora).getUTCDay() !== 1) return null;
  const gravou = renovadoEm && expiraEm && agora - new Date(renovadoEm).getTime() < 36 * 3600e3 && new Date(expiraEm).getTime() > agora;
  if (gravou) return { texto: `Renovação semanal do token OK: gravada em ${new Date(renovadoEm).toISOString().slice(0, 10)}, vence em ${new Date(expiraEm).toISOString().slice(0, 10)}`, acao: false };
  return { texto: 'PRECISA DE VOCÊ: renovação semanal do token NÃO gravou renovadoEm/expiraEm (cron de segunda 12:00 UTC). Verificar o cron renovar-token-instagram', acao: true, primeira: true };
}

module.exports.checagemRenovacaoSemanal = checagemRenovacaoSemanal;
