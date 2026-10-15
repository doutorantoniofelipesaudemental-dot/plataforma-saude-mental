/**
 * Checagem 1 — Técnica/Sanitização (llama3.2:3b).
 * Regras determinísticas são a autoridade; o LLM leve só acrescenta um aviso
 * de linter quando disponível. Também remove marcas temporárias (corrige).
 */
const ollama = require('../ollamaAdapter');

const RE_TEMPORARIA = /\b(TODO|FIXME|XXX|LOREM IPSUM|PLACEHOLDER|RASCUNHO|TESTE)\b|\[(?:INSERIR|PREENCHER)[^\]]*\]/gi;
const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sanitizarTexto(t) {
  return String(t || '').replace(RE_TEMPORARIA, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function slugificar(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** @param {{slug?:string, titulo?:string, legenda?:string, frontmatter?:object}} peca */
async function checar(peca, { usarLlm = true } = {}) {
  const falhas = [];
  const fm = peca.frontmatter || {};
  for (const campo of ['titulo', 'slug']) if (!(peca[campo] || fm[campo])) falhas.push(`frontmatter: campo "${campo}" ausente`);
  const slug = peca.slug || fm.slug;
  if (slug && !RE_SLUG.test(slug)) falhas.push(`slug inválido: "${slug}"`);
  RE_TEMPORARIA.lastIndex = 0;
  if (RE_TEMPORARIA.test(`${peca.legenda || ''} ${peca.titulo || ''}`)) falhas.push('marca temporária no texto (TODO/placeholder/rascunho)');
  if (/�|undefined|\[object Object\]/.test(peca.legenda || '')) falhas.push('texto corrompido (undefined/caractere inválido)');
  if (!String(peca.legenda || '').trim()) falhas.push('legenda vazia');

  let modelo = null;
  if (usarLlm && !falhas.length) {
    const r = await ollama.gerar('leve', {
      sistema: 'Você é um linter. Responda só JSON: {"problemas":["..."]} listando erros de digitação ou sintaxe evidentes; [] se não houver.',
      usuario: peca.legenda.slice(0, 1500),
      json: true, maxTokens: 120, timeoutMs: 60_000,
    });
    modelo = r.modelo || null;
    if (r.json?.problemas?.length) falhas.push(...r.json.problemas.slice(0, 3).map((p) => `linter: ${p}`));
  }
  return { ok: !falhas.length, falhas, modelo };
}

module.exports = { nome: 'sanitizerActionAgent', checar, sanitizarTexto, slugificar };
