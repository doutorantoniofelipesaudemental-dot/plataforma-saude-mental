/**
 * Checagem automática de UM texto (usada por `npm run auditoria` e pelo agendador de publicação).
 * Técnica + ética + humanizada (heurística). A checagem científica é manual (amostra no relatório).
 * Cada falha: { grupo, msg }. Mensagens com "(decisão do autor)" são de SENTIDO: nunca se corrigem sozinhas.
 */
const L = '[A-Za-z\\u00c0-\\u00ff]'; // letra (inclui acentuadas), para limites de palavra corretos

const RE_SENSIVEL = /\b(suic[ií]d\w*|autoles\w*|autom?utila\w*|desejo de morrer|quer(?:er)? morrer|tirar a (?:pr[oó]pria )?vida)\b/i;
// "suicida" só como rótulo de pessoa ("um suicida"); "ideação/comportamento suicida" é termo clínico.
const RE_ESTIGMA = new RegExp(`\\b(louc[oa]s?|doentes? mentais?|(?<!${L})(?:um|uma|o|a|os|as)\\s+suicidas?|retardad[oa]s?|insano|demente)\\b`, 'i');
const RE_PROMESSA = /\b(cura garantida|resultado garantido|100% eficaz|(?:totalmente|completamente|absolutamente) sem riscos?|milagr\w+)\b/i;
const RE_CULPA = new RegExp('\\b(a culpa \\u00e9 sua|falta de for\\u00e7a de vontade|pregui\\u00e7a|frescura|\\u00e9 s\\u00f3 querer)\\b', 'i');
const RE_MOJIBAKE = /Ã[©¡£§³ª´µ¢]|â€|Â\s/;
const RE_PSIQ_AUTOR = /Antônio Felipe[^.\n]{0,80}\bpsiquiatra\b|#psiquiatria/i;
const PROFISSAO_PSIQUIATRA_OK = new Set(['quando-encaminhar-aps', 'quando-procurar-psiquiatra-psicologo']);

// Uma ocorrência só conta se não vier negada ("não é preguiça"), citada ("evitar 'frescura'") ou em lista de exemplos.
const RE_CONTEXTO_OK = new RegExp(
  `(?<!${L})(n(?:\\u00e3|a)o|nem|evit\\w*|jamais|nunca|mito|mitos|estigma\\w*|express(?:\\u00f5|o)es|termos|frases?|linguagem|substitu\\w*|trocar)(?!${L})|["\\u201c\\u201d]|&#39;|'`,
  'i'
);
function ocorrenciaReal(texto, re) {
  const g = new RegExp(re.source, 'gi');
  const limpo = String(texto).normalize('NFC').replace(/<[^>]+>/g, ' ');
  for (const m of limpo.matchAll(g)) {
    const antes = limpo.slice(Math.max(0, m.index - 70), m.index);
    if (!RE_CONTEXTO_OK.test(antes)) return m[0];
  }
  return null;
}

const contar = (t, re) => (t.match(re) || []).length;

function checarTexto({ origem, slug, titulo, corpo, resumo, tempoLeitura }) {
  corpo = String(corpo || '').normalize('NFC');
  const falhas = [];
  const f = (grupo, msg) => falhas.push({ grupo, msg });
  if (!titulo) f('técnica', 'sem título');
  if (!resumo) f('técnica', 'sem resumo');
  if (!tempoLeitura) f('técnica', 'sem tempoLeitura');
  if (/\{\{|\}\}(?!\s*;?\s*$)/.test(corpo.replace(/style=\{\{[^}]*\}\}/g, ''))) f('técnica', 'marcador "{{" sobrando');
  if (RE_MOJIBAKE.test(corpo)) f('técnica', 'caracteres corrompidos (encoding)');
  const sups = [...corpo.matchAll(/<sup>\s*\[?(\d+)\]?\s*<\/sup>/g)].map((m) => +m[1]);
  const iRef = corpo.search(/<h[2-4][^>]*>\s*(?:Refer[ê e]ncias|Fontes)/i);
  const refs = iRef >= 0 ? contar(corpo.slice(iRef), /<li[ >]/g) : 0;
  if (refs < 4) f('técnica', `menos de 4 referências (${refs})`);
  for (const n of new Set(sups)) if (n > refs) f('técnica', `citação <sup>${n}</sup> sem referência`);
  // No MongoDB a identificação entra na renderização/HTML do lote: contagem exata só vale para MDX.
  if (origem === 'mdx' && contar(corpo, /CRM-BA 41322/g) !== 1) f('técnica', `"CRM-BA 41322" ${contar(corpo, /CRM-BA 41322/g)}x (esperado 1)`);
  if (origem === 'mdx' && contar(corpo, /RQE 26638/g) !== 1) f('técnica', `"RQE 26638" ${contar(corpo, /RQE 26638/g)}x (esperado 1)`);
  if (contar(corpo, /N[ÃA]O ESPECIALISTA/g) > 1) f('técnica', '"NÃO ESPECIALISTA" duplicado');
  if (/RQE 26638/.test(corpo) && !/Medicina de Fam[ií]lia e Comunidade/.test(corpo)) f('ética', 'RQE sem "Medicina de Família e Comunidade"');
  if (/Antonio Felipe/.test(corpo)) f('ética', '"Antonio" sem acento (corrigível)');
  if (RE_PSIQ_AUTOR.test(corpo)) f('ética', 'autor apresentado como psiquiatra / #psiquiatria');
  else if (/#psiq/i.test(corpo)) f('ética', '#psiquiatria');
  if (/\bpsiquiatra\b/i.test(corpo) && !PROFISSAO_PSIQUIATRA_OK.has(slug) && /Antônio Felipe[^]{0,200}psiquiatra/i.test(corpo)) f('ética', 'verificar uso de "psiquiatra" junto ao autor');
  if (RE_SENSIVEL.test(corpo) && !/\b188\b/.test(corpo)) f('ética', 'tema de suicídio/autolesão sem CVV 188 (corrigível)');
  const est = ocorrenciaReal(corpo, RE_ESTIGMA);
  if (est) f('ética', `termo estigmatizante: "${est}" (decisão do autor)`);
  const pro = ocorrenciaReal(corpo, RE_PROMESSA);
  if (pro) f('ética', `promessa/sensacionalismo: "${pro}" (decisão do autor)`);
  const cul = ocorrenciaReal(corpo, RE_CULPA);
  if (cul) f('humanizada', `linguagem de culpa/pressão: "${cul}" (decisão do autor)`);
  return falhas;
}

module.exports = { checarTexto };
