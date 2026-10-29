/**
 * PREPARO da publicação de Reels pela Meta Graph API (ordem de 28/10/2026). NÃO ATIVO: nada aqui é chamado pelo publicador.
 * Funções puras (sem rede): montam o container, interpretam o status, barram duplicidade e checam o limite da conta.
 * Ativação depende de decisão do Dr. Antônio depois de ver a amostra, e de a Meta liberar a janela de Reels (roteamento.js).
 * Fluxo oficial: POST /{ig-user-id}/media (media_type=REELS) → poll status_code até FINISHED → POST /{ig-user-id}/media_publish.
 */

const LIMITE_PADRAO_24H = 100; // teto de publicações por 24 h da conta (content_publishing_limit)
const TENTATIVAS_MAX = 20;     // poll: 20 × 30 s = 10 min, depois desiste e registra

/** Monta o corpo do container de Reel. Legenda já deve estar conferida (bloco de 3 linhas, aviso de IA, CVV 188 · SAMU 192). */
function montarContainerReel({ videoUrl, legenda, compartilharFeed = true }) {
  if (!/^https:\/\//.test(videoUrl || '')) throw new Error('video_url precisa ser https público');
  if (!legenda || !legenda.trim()) throw new Error('legenda vazia');
  return { media_type: 'REELS', video_url: videoUrl, caption: legenda, share_to_feed: compartilharFeed };
}

/** Interpreta o status do container. Só `pronto: true` autoriza o media_publish. */
function interpretarStatusContainer(status) {
  switch (status) {
    case 'FINISHED': return { pronto: true, acao: 'publicar' };
    case 'IN_PROGRESS': return { pronto: false, acao: 'aguardar' };
    case 'ERROR': return { pronto: false, acao: 'parar', motivo: 'container com erro na Meta' };
    case 'EXPIRED': return { pronto: false, acao: 'parar', motivo: 'container expirou; é preciso criar outro' };
    default: return { pronto: false, acao: 'parar', motivo: `status desconhecido: ${status}` };
  }
}

/** Trava de duplicidade: o post que já tem ID da Meta nunca é publicado de novo. `registro` é o mapa postId → { metaId }. */
function podePublicarPost(registro, postId) {
  const r = registro && registro[postId];
  if (r && r.metaId) return { pode: false, motivo: `já publicado (media ${r.metaId})` };
  return { pode: true };
}

/** Usa content_publishing_limit (quota_usage e config.quota_total). Sem dado, não publica (falha fechada). */
function dentroDoLimite(limite) {
  const usado = limite?.quota_usage;
  const total = limite?.config?.quota_total ?? LIMITE_PADRAO_24H;
  if (typeof usado !== 'number') return { ok: false, motivo: 'limite da conta indisponível: não publica' };
  if (usado >= total) return { ok: false, motivo: `limite de ${total} publicações em 24 h atingido (${usado})` };
  return { ok: true, restantes: total - usado };
}

/** Alterna carrossel e Reel na ordem da fila: devolve o próximo tipo a partir do último publicado. */
function proximoTipoAlternado(ultimoTipo) {
  return ultimoTipo === 'reel' ? 'carrossel' : 'reel';
}

module.exports = {
  montarContainerReel,
  interpretarStatusContainer,
  podePublicarPost,
  dentroDoLimite,
  proximoTipoAlternado,
  TENTATIVAS_MAX,
  LIMITE_PADRAO_24H,
};
