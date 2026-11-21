/**
 * Envio seguro à fila de redes (redes_v2). Só decisão, sem banco nem arquivo:
 * - envia só peça com status aprovado-checagem, checagem.ok = true, imagens iguais às checadas e data futura;
 * - --slugs: se um pedido for recusado, o envio inteiro é recusado (nada parcial);
 * - conferirPar compara banco x pasta (status, legenda, data, hashes).
 */

const { IDENTIFICACAO_COMPLETA } = require('../identificacaoCfm');
const { temAvisoIA } = require('../conformidadeCfm');

/** Data de uma peça. Data só com dia (AAAA-MM-DD) vale 00:00 de Brasília. */
function paraData(s) {
  if (s instanceof Date) return Number.isNaN(s.getTime()) ? null : s;
  if (typeof s !== 'string') return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00-03:00`) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Trava de legenda (ordem de 20/11/2026): identificação de 5 linhas, CVV 188 e SAMU 192,
 * aviso de IA (uma das 2 redações) e no máximo 2.200 caracteres. Vale no dry-run e no --aplicar.
 */
function motivoLegenda(t) {
  if (!t) return 'sem legenda.txt';
  const norm = (x) => x.replace(/\s+/g, ' ').trim();
  const txt = norm(t);
  if (IDENTIFICACAO_COMPLETA.split('\n').some((l) => !txt.includes(norm(l)))) return 'legenda sem a identificação de 5 linhas';
  if (!t.includes('CVV 188') || !t.includes('SAMU 192')) return 'legenda sem "CVV 188" e "SAMU 192"';
  if (!temAvisoIA(t)) return 'legenda sem o aviso de IA (Res. CFM 2.454/2026)';
  if ([...t].length > 2200) return 'legenda acima de 2.200 caracteres';
  return null;
}

function motivoRecusa(p, agora) {
  const m = p.meta || {};
  if (m.status !== 'aprovado-checagem') return `status ${m.status} (só aprovado-checagem é enviado)`;
  if (!m.checagem || m.checagem.ok !== true) return 'sem checagem.ok = true';
  if (m.checagem.parcial === true) return 'checagem parcial (sem telas.json): completar a checagem oficial';
  if (p.erroImagem) return p.erroImagem;
  const motivoTexto = motivoLegenda(p.legenda);
  if (motivoTexto) return motivoTexto;
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

/**
 * Atualização SÓ de legenda (--atualizar-legenda) de peça já no banco como aprovado-checagem.
 * Recusa: fora de aprovado-checagem, já publicada/agendada, data passada, pasta recusada pelo envio
 * (inclui checagem parcial) e imagens diferentes do banco (nesse caso só envio completo).
 * @param {{banco: object|null, pasta: object, agora?: Date}} o
 * @returns {string|null} motivo da recusa (null = pode atualizar)
 */
function motivoAtualizacaoLegenda({ banco, pasta, agora = new Date() }) {
  if (!banco) return 'ausente no banco (use o envio completo)';
  if (banco.status !== 'aprovado-checagem') return `status ${banco.status}: atualização só para aprovado-checagem`;
  if (banco.publicadoEm || /publicad|agendad/.test(String(banco.status))) return 'já publicada ou agendada';
  const dBanco = paraData(banco.dataSugerida);
  if (!dBanco || dBanco.getTime() <= agora.getTime()) return 'data passada ou inválida no banco';
  const motivo = motivoRecusa(pasta, agora);
  if (motivo) return motivo;
  const hb = banco.hashes || [];
  const hp = pasta.hashes || [];
  if (hb.length !== hp.length || hb.some((h, i) => h !== hp[i])) return 'imagens diferentes do banco (use o envio completo)';
  return null;
}

module.exports = { paraData, motivoLegenda, motivoRecusa, planejarEnvio, conferirPar, motivoAtualizacaoLegenda };
