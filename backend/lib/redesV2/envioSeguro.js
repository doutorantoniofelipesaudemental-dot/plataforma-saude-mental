/**
 * Envio seguro à fila de redes (redes_v2). Só decisão, sem banco nem arquivo:
 * - envia só peça com status aprovado-checagem, checagem.ok = true, imagens iguais às checadas e data futura;
 * - --slugs: se um pedido for recusado, o envio inteiro é recusado (nada parcial);
 * - conferirPar compara banco x pasta (status, legenda, data, hashes).
 */

/** Data de uma peça. Data só com dia (AAAA-MM-DD) vale 00:00 de Brasília. */
function paraData(s) {
  if (s instanceof Date) return Number.isNaN(s.getTime()) ? null : s;
  if (typeof s !== 'string') return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00-03:00`) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function motivoRecusa(p, agora) {
  const m = p.meta || {};
  if (m.status !== 'aprovado-checagem') return `status ${m.status} (só aprovado-checagem é enviado)`;
  if (!m.checagem || m.checagem.ok !== true) return 'sem checagem.ok = true';
  if (p.erroImagem) return p.erroImagem;
  if (!p.legenda) return 'sem legenda.txt';
  if (!Array.isArray(m.checagem.hashes) || m.checagem.hashes.length === 0) return 'sem hashes de checagem';
  const d = paraData(m.dataSugerida);
  if (!d) return 'data inválida';
  if (d.getTime() <= agora.getTime()) return `data passada (${d.toISOString()})`;
  return null;
}

/**
 * @param {{pecas: object[], slugs?: string[]|null, agora?: Date}} o
 * @returns {{selecionadas: object[], recusadas: {slug: string, motivo: string}[]}}
 */
function planejarEnvio({ pecas, slugs = null, agora = new Date() }) {
  const selecionadas = [];
  const recusadas = [];
  const porSlug = new Map(pecas.map((p) => [p.slug, p]));
  let alvo = pecas;
  if (slugs) {
    alvo = [];
    for (const s of [...new Set(slugs)]) {
      if (porSlug.has(s)) alvo.push(porSlug.get(s));
      else recusadas.push({ slug: s, motivo: 'pasta não encontrada' });
    }
  }
  for (const p of alvo) {
    const motivo = motivoRecusa(p, agora);
    if (motivo) recusadas.push({ slug: p.slug, motivo });
    else selecionadas.push(p);
  }
  return { selecionadas, recusadas };
}

/**
 * @param {{banco: object|null, pasta: object}} o
 * @returns {string[]} divergências (vazio = igual)
 */
function conferirPar({ banco, pasta }) {
  if (!banco) return ['ausente no banco'];
  const d = [];
  if (banco.status !== pasta.status) d.push(`status banco=${banco.status} pasta=${pasta.status}`);
  if (banco.legenda !== pasta.legenda) d.push('legenda diferente da pasta');
  const db = paraData(banco.dataSugerida);
  const dp = paraData(pasta.dataSugerida);
  if (!db || !dp || db.getTime() !== dp.getTime()) d.push(`data banco=${banco.dataSugerida} pasta=${pasta.dataSugerida}`);
  const hb = banco.hashes || [];
  const hp = pasta.hashes || [];
  if (hb.length !== hp.length) d.push(`imagens banco=${hb.length} pasta=${hp.length}`);
  for (let i = 0; i < Math.min(hb.length, hp.length); i += 1) {
    if (hb[i] !== hp[i]) d.push(`imagem ${i + 1}: hash diferente do checado`);
  }
  return d;
}

module.exports = { paraData, motivoRecusa, planejarEnvio, conferirPar };
