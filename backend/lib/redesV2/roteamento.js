/**
 * Roteamento por tipo de mídia no Instagram (decisão do Dr. Antônio, 18/10/2026):
 *  - imagem única: Meta Graph (com o freio REDES_PUBLICACAO_ATIVA);
 *  - carrossel (2 a 10 imagens): fila manual até UM teste supervisionado ser concluído e liberado por ordem escrita
 *    (redes_v2_config/instagram.carrosselLiberado = true, gravado só por `backend/scripts/redes/testeCarrossel.js --liberar`);
 *  - Reels e Stories: SEMPRE fila manual (reavaliar após 30 dias). Nunca vão para a Meta Graph, nem com o carrossel liberado.
 * Funções puras: sem rede e sem banco.
 */
const MIN_CARROSSEL = 2;
const MAX_CARROSSEL = 10;
/** Tipos que o código pode mandar para a Meta Graph. Reel e Story nunca entram aqui. */
const TIPOS_AUTOMATICOS = Object.freeze(['imagem-unica', 'carrossel']);

/** @param {{tipo?:string, checagem?:{hashes?:string[]}, imagens?:number}} post */
function tipoDeMidia(post) {
  const t = String(post.tipo || '').toLowerCase();
  if (t === 'reel' || t === 'story') return t;
  const n = post.imagens ?? post.checagem?.hashes?.length ?? 0;
  if (n === 1) return 'imagem-unica';
  if (n >= MIN_CARROSSEL && n <= MAX_CARROSSEL) return 'carrossel';
  return 'invalido';
}

/** @returns {{tipo:string, via:'graph'|'manual'|'bloqueado', motivo:string}} */
function rotaDaMidia(post, config = {}) {
  const tipo = tipoDeMidia(post);
  if (tipo === 'reel' || tipo === 'story') return { tipo, via: 'manual', motivo: 'Reels e Stories só na fila manual (decisão de 18/10/2026; reavaliar após 30 dias)' };
  if (tipo === 'imagem-unica') return { tipo, via: 'graph', motivo: 'imagem única: publicação pela Meta Graph' };
  if (tipo === 'carrossel') {
    if (config && config.carrosselLiberado === true) return { tipo, via: 'graph', motivo: 'carrossel liberado após o teste supervisionado' };
    return { tipo, via: 'manual', motivo: 'carrossel na fila manual até o teste supervisionado ser concluído e liberado pelo Dr. Antônio' };
  }
  return { tipo, via: 'bloqueado', motivo: `quantidade de imagens inválida (${post.imagens ?? post.checagem?.hashes?.length ?? 0}); o carrossel aceita de ${MIN_CARROSSEL} a ${MAX_CARROSSEL}` };
}

module.exports = { tipoDeMidia, rotaDaMidia, TIPOS_AUTOMATICOS, MIN_CARROSSEL, MAX_CARROSSEL };
