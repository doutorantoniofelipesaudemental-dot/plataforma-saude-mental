/**
 * Classificação do token e ID da conta (ordem 20/10/2026). Função pura, testável.
 *  - IGAA = Instagram Login: o cron semanal de renovação SE APLICA; o ID da conta é user_id do /me (graph.instagram.com).
 *  - EAA  = via Página do Facebook: o cron não se aplica; o ID vem de /me/accounts.
 * O ID do campo `id` do /me no Instagram Login é do app, NÃO é o ID da conta: nunca usar como ID da conta.
 */
function tipoDoToken(token = '') {
  if (!token) return null;
  return token.startsWith('IGAA') ? 'Instagram Login (IGAA) — o cron semanal de renovação SE APLICA' : 'via Página do Facebook (EAA) — o cron de renovação NÃO se aplica';
}

function idDaConta(dados = {}, token = '') {
  if (token.startsWith('IGAA')) return dados.user_id ? String(dados.user_id) : null;
  return dados.id ? String(dados.id) : null;
}

module.exports = { tipoDoToken, idDaConta };
