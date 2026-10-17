/** Checagem pré-publicação de um item do LinkedIn (lista de falhas; vazia = aprovado). */
const { checarEticaCfm } = require('./checagensAprovacao');

function checarPost(it) {
  const f = []; const t = it.texto || '';
  if (it.tipo === 'texto' && (t.length < 1300 || t.length > 2000)) f.push(`tamanho ${t.length} caracteres (esperado 1300–2000)`);
  const n = (re) => (t.match(re) || []).length;
  if (n(/CRM-BA 41322/g) !== 1) f.push('CRM-BA 41322 deve aparecer 1 vez');
  if (n(/RQE 26638/g) !== 1 || !/Medicina de Família e Comunidade/.test(t)) f.push('RQE 26638 junto de Medicina de Família e Comunidade (1 vez)');
  if (!/Portal de Saúde Mental Doutor Antônio Felipe Garabito/.test(t)) f.push('sem o crédito do Portal de Saúde Mental Doutor Antônio Felipe Garabito');
  if (/NÃO ESPECIALISTA/.test(t)) f.push('assinatura curta não leva "NÃO ESPECIALISTA"');
  if (!/CVV 188/.test(t) || !/SAMU 192/.test(t)) f.push('sem CVV 188 · SAMU 192');
  if (!/protocolos hospitalares/.test(t)) f.push('sem aviso de protocolos locais');
  if (!/2\.454\/2026/.test(t)) f.push('sem aviso de IA (Res. CFM 2.454/2026)');
  if (/Antonio Felipe/.test(t)) f.push('"Antonio" sem acento');
  // "psiquiatra" como nome da profissão é permitido (17/10/2026); vetado ligado ao autor e #psiquiatria
  if (/Antônio Felipe[^.\n]{0,80}\bpsiquiatra\b|\bm[eé]dico psiquiatra\b|\bsou (?:o |um )?psiquiatra\b|\bpsiquiatra (?:dr\.?|doutor)\s+ant[oô]nio|#psiquiatria/i.test(t)) f.push('autor apresentado como "psiquiatra" ou #psiquiatria');
  if (/wa\.me|whatsapp/i.test(t)) f.push('mensageria de terceiros');
  if (/(antes e depois|depoimento|garantid|100% eficaz|cura garantida)/i.test(t)) f.push('promessa/depoimento/antes-e-depois');
  const OFICIAL = /^https?:\/\/(www\.drantoniofelipemedico\.com\.br|instagram\.com\/doutor\.antoniofelipe\.smental)/;
  for (const u of t.match(/https?:\/\/[^\s)]+/g) || []) if (!OFICIAL.test(u)) f.push(`link fora do domínio oficial: ${u.slice(0, 60)}`);
  for (const x of checarEticaCfm(t, { contexto: 'social', exigirIdentificacao: false }).falhas) f.push(`ética: ${x}`);
  return f;
}
module.exports = { checarPost };
