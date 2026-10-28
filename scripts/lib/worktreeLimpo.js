/**
 * Remoção segura de worktree de PR (ordem de 28/10/2026): só remove se a árvore estiver limpa e o HEAD igual ao do remoto.
 * Nunca usa --force. Função pura: quem executa o git é o chamador.
 */
function decidirRemoverWorktree({ caminho = null, arvoreLimpa = false, headLocal = '', headRemoto = '' }) {
  if (!caminho) return { remover: false, motivo: 'o branch não está aberto em outro worktree' };
  if (!arvoreLimpa) return { remover: false, motivo: `worktree ${caminho} tem alterações não commitadas: não removido. Commite ou guarde antes.` };
  if (!headRemoto || headLocal !== headRemoto) return { remover: false, motivo: `worktree ${caminho} tem commits que não estão no remoto: não removido. Envie-os com publicarBranch.` };
  return { remover: true, motivo: `worktree ${caminho} limpo e igual ao remoto: removido automaticamente` };
}

module.exports = { decidirRemoverWorktree };
