/**
 * Planejamento da troca de branch do merge-seguro (função pura: não executa git).
 * Decide antes de qualquer `git switch`, para nunca perder trabalho nem forçar nada.
 *   - trocar:   o branch já existe localmente, está igual ao remoto (ou não tem commits exclusivos) e a árvore não conflita
 *   - criar:    o branch não existe localmente; cria a partir do remoto
 *   - alinhar:  o local está atrás do remoto e não tem commits exclusivos; avança com --ff-only
 *   - parar:    há alterações não commitadas nos arquivos que o destino muda, commits exclusivos no local, ou o branch aberto em outro worktree
 */

// Caminho do outro worktree onde o branch está aberto (ou null). Lê a saída de `git worktree list --porcelain`.
function worktreeDoBranch(porcelain, destino, raizAtual = '') {
  const norm = (p) => String(p).split(String.fromCharCode(92)).join('/').replace(/\/+$/, '').toLowerCase();
  for (const bloco of String(porcelain || '').split(/\n\s*\n/)) {
    const caminho = (bloco.match(/^worktree (.+)$/m) || [])[1];
    const ramo = (bloco.match(/^branch refs\/heads\/(.+)$/m) || [])[1];
    if (caminho && ramo === destino && norm(caminho) !== norm(raizAtual)) return caminho.trim();
  }
  return null;
}

function planejarTrocaBranch({
  branchAtual = '',
  destino,
  worktreeDoDestino = null,
  existeLocal = false,
  localAtrasadoDoRemoto = false,
  localAdiantadoDoRemoto = false,
  arquivosSujos = [],
  arquivosDoDestino = [],
}) {
  if (!destino) throw new Error('planejarTrocaBranch exige o branch de destino');
  const conflitos = arquivosSujos.filter((f) => arquivosDoDestino.includes(f));
  if (conflitos.length) {
    return { acao: 'parar', motivo: `alterações não commitadas em arquivos que o branch ${destino} muda: ${conflitos.join(', ')}. Guarde ou commite esses arquivos e rode de novo.` };
  }
  if (worktreeDoDestino) {
    return { acao: 'parar', motivo: `o branch ${destino} está aberto no worktree ${worktreeDoDestino}. Se esse worktree estiver limpo e enviado, remova-o com: git worktree remove "${worktreeDoDestino}" (o branch não é apagado) e rode o merge de novo.` };
  }
  if (existeLocal && localAdiantadoDoRemoto) {
    return { acao: 'parar', motivo: `o branch local ${destino} tem commits que não estão no remoto. Não será sobrescrito: envie-os (publicarBranch) ou mostre-os antes do merge.` };
  }
  if (!existeLocal) return { acao: 'criar', motivo: `branch ${destino} criado a partir de origin/${destino}` };
  if (localAtrasadoDoRemoto) return { acao: 'alinhar', motivo: `branch local ${destino} estava atrás do remoto; avançado com --ff-only` };
  return { acao: 'trocar', motivo: branchAtual === destino ? 'já está no branch do PR' : `trocando para ${destino}` };
}

module.exports = { planejarTrocaBranch, worktreeDoBranch };
