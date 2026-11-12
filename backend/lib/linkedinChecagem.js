/** Checagem pré-publicação de um item do LinkedIn (lista de falhas; vazia = aprovado). */
const { checarEticaCfm } = require('./checagensAprovacao');
const { IDENTIFICACAO_COMPLETA } = require('./identificacaoCfm');

function checarPost(it) {
  const f = []; const t = it.texto || '';
  // Tamanho (decisão do Dr. Antônio, 28/10/2026): 1.000 a 2.200. O limite técnico do LinkedIn (3.000) fica no preAgendamento.
  if (it.tipo === 'texto' && (t.length < 1000 || t.length > 2200)) f.push(`tamanho ${t.length} caracteres (esperado 1000–2200)`);
  // Referência obrigatória e específica (decisão do Dr. Antônio, 28/10/2026): sem referência real, o post não é publicado.
  const ref = (t.match(/^Referência: (.+)$/m) || [])[1] || '';
  if (it.tipo === 'texto' && (!ref || !/\b(19|20)\d{2}\b/.test(ref) || /ver lista|principal do artigo|revis[aã]o sobre|gen[eé]ric/i.test(ref))) f.push('referência ausente ou genérica (exige referência específica conferida no PubMed ou pelo DOI)');
  // Conferência registrada (ordem de 28/10/2026, item 5): a referência precisa ter sido conferida pelo PMID ou pelo DOI, e a
  // conferência fica no próprio item. Sem o registro, o post não segue para agendamento e vai para a fila manual com este motivo.
  const rc = it.referenciaConferida || {};
  if (it.tipo === 'texto' && !(/^\d{5,9}$/.test(String(rc.pmid || '')) || /^10\.\d{4,}\//.test(String(rc.doi || '')))) f.push('referência sem conferência registrada (campo referenciaConferida com PMID ou DOI)');
  const n = (re) => (t.match(re) || []).length;
  if (n(/CRM-BA 41322/g) !== 1) f.push('CRM-BA 41322 deve aparecer 1 vez');
  if (n(/RQE 26638/g) !== 1 || !/Medicina de Família e Comunidade/.test(t)) f.push('RQE 26638 junto de Medicina de Família e Comunidade (1 vez)');
  if (!/Portal de Saúde Mental Doutor Antônio Felipe Garabito/.test(t)) f.push('sem o crédito do Portal de Saúde Mental Doutor Antônio Felipe Garabito');
  // Identificação de 5 linhas nas redes (ordem de 08/11/2026): bloco oficial exato, com a TCC e "NÃO ESPECIALISTA".
  if (!t.includes(IDENTIFICACAO_COMPLETA)) f.push('identificação de 5 linhas (ordem de 08/11/2026) ausente ou fora do padrão');
  if (!/CVV 188/.test(t) || !/SAMU 192/.test(t)) f.push('sem CVV 188 · SAMU 192');
  if (!/protocolos hospitalares/.test(t)) f.push('sem aviso de protocolos locais');
  if (!/2\.454\/2026/.test(t)) f.push('sem aviso de IA (Res. CFM 2.454/2026)');
  if (/Antonio Felipe/.test(t)) f.push('"Antonio" sem acento');
  // "psiquiatra" como nome da profissão é permitido (17/10/2026); vetado ligado ao autor e #psiquiatria
  if (/Antônio Felipe[^.\n]{0,80}\bpsiquiatra\b|\bm[eé]dico psiquiatra\b|\bsou (?:o |um )?psiquiatra\b|\bpsiquiatra (?:dr\.?|doutor)\s+ant[oô]nio|#psiquiatria/i.test(t)) f.push('autor apresentado como "psiquiatra" ou #psiquiatria');
  if (/wa\.me|whatsapp/i.test(t)) f.push('mensageria de terceiros');
  if (/(antes e depois|depoimento|garantid|100% eficaz|cura garantida)/i.test(t)) f.push('promessa/depoimento/antes-e-depois');
  // Valor monetário (ordem de 11/11/2026, caso do post de 11/11): "dólar" por extenso não; usar US$ com o ano do estudo.
  // D1 (ordem de 11/11/2026, 22:45): "dólar" não é proibido. Valor monetário exige "US$" com número e autor com ano do estudo.
  if (/\bd[óo]lares?\b|US\$/i.test(t)) {
    if (!/US\$\s?\d/.test(t)) f.push('valor em dólar sem "US$" e número');
    if (!/[A-ZÀ-Ú][\p{L}'-]+(?: et al\.?)?[,(]? ?(?:19|20)\d{2}/u.test(t)) f.push('valor monetário sem autor e ano do estudo');
  }
  // D2 (ordem de 11/11/2026, ajuste 23:25): reprova "fiscalização" como marco de início da NR-1 e qualquer data de início
  // diferente de 26/05/2026. Não exige a frase quando o post não fala de data.
  if (/NR-?1\b/.test(t)) {
    if (/fiscaliza[çc][ãa]o/i.test(t)) f.push('NR-1 com "fiscalização" como marco de início (usar 26 de maio de 2026)');
    const datas = [...t.matchAll(/(?:vigor\w*|come[çc]\w*|entr\w*|in[ií]cio|passou a valer)[^.\n]{0,40}?(\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/gi)].map((m) => m[1].replace(/\s+/g, ' ').toLowerCase());
    if (datas.some((d) => !/^26 de maio de 2026$|^26\/05\/2026$/.test(d))) f.push('NR-1 com data de início diferente de 26/05/2026');
  }
  // D3 (ordem de 11/11/2026, ajuste 23:25): reprova número de risco de morte por isolamento diferente de 26%–32% (Holt-Lunstad 2015),
  // ou número sem a distinção de tipos. Não exige a frase quando não há número.
  if (/isolamento|solid[ãa]o|morar sozinho/i.test(t) && /\bmorte\b/i.test(t)) {
    const nums = [...t.matchAll(/(\d{1,3})\s?%[^.\n]{0,60}?\bmorte\b|\bmorte\b[^.\n]{0,60}?(\d{1,3})\s?%/gi)].map((m) => +(m[1] || m[2]));
    if (nums.some((n) => n < 26 || n > 32)) f.push('risco de morte por isolamento fora de 26% a 32% (Holt-Lunstad 2015)');
    if (nums.length && !/solid[ãa]o/i.test(t) || nums.length && !/isolamento social/i.test(t) || nums.length && !/morar sozinho/i.test(t)) {
      f.push('número de risco de morte sem a distinção solidão, isolamento social ou morar sozinho');
    }
  }
  const OFICIAL = /^https?:\/\/(www\.drantoniofelipemedico\.com\.br|instagram\.com\/doutor\.antoniofelipe\.smental)/;
  for (const u of t.match(/https?:\/\/[^\s)]+/g) || []) if (!OFICIAL.test(u)) f.push(`link fora do domínio oficial: ${u.slice(0, 60)}`);
  for (const x of checarEticaCfm(t, { contexto: 'social', exigirIdentificacao: false }).falhas) f.push(`ética: ${x}`);
  return f;
}
module.exports = { checarPost };
