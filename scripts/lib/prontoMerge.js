/**
 * Pronto para merge (ordem de 28/10/2026): função pura que junta as checagens do PR.
 * Só diz PRONTO se todas passarem. O merge-seguro e o comando npm run pronto-para-merge usam a mesma regra.
 */
// Função pura: aviso (não bloqueio) quando o branch do PR rastreia arquivo de estado que a main ignora.
// O merge-seguro protege esses arquivos (cópia antes e conferência depois), então é só informação.
function avisosArquivosIgnorados({ rastreadosNoPr = [], ignoradosNaMain = [] }) {
  return rastreadosNoPr
    .filter((f) => ignoradosNaMain.includes(f))
    .map((f) => `AVISO: o branch do PR rastreia ${f}, que a main ignora. O merge-seguro protege esse arquivo (cópia antes e conferência depois); se sumir, é restaurado.`);
}

function avaliarProntoParaMerge({ pr = {}, headRemoto = '', pre = { ok: true, bloqueios: [] }, worktree = { ok: true, motivo: '' }, avisos = [] }) {
  const motivos = [];
  if (pr.state !== 'OPEN') motivos.push(`PR não está aberto (estado: ${pr.state})`);
  if (pr.isDraft) motivos.push('PR é rascunho');
  if (pr.mergeable === 'CONFLICTING') motivos.push('PR tem conflitos com a main');
  if (pr.mergeable === 'UNKNOWN') motivos.push('o GitHub ainda calcula a mergeabilidade: rode de novo em alguns segundos');
  if (!headRemoto || pr.headRefOid !== headRemoto) motivos.push('o commit do PR não é o que está no remoto do branch');
  for (const b of pre.bloqueios || []) motivos.push(`pasta principal: ${b.arquivo} (${b.motivo})`);
  if (!worktree.ok) motivos.push(worktree.motivo);
  return { pronto: motivos.length === 0, motivos, avisos };
}

module.exports = { avaliarProntoParaMerge, avisosArquivosIgnorados };
