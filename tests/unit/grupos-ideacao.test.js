// Grupos editoriais da ideação (GRUPOS em backend/lib/ideacao.js) × metas (METAS_EDITORIAL.json).
const { test } = require('node:test');
const assert = require('node:assert');

const { GRUPOS, TIPOS } = require('../../backend/lib/ideacao');
const { lerMetas } = require('../../backend/lib/metasEditoriais');

test('todo grupo de ideação existe nas metas editoriais e tem tipo e instrução válidos', () => {
  const nomesMetas = new Set(lerMetas().categorias.map((c) => c.nome));
  for (const [nome, g] of Object.entries(GRUPOS)) {
    assert.ok(nomesMetas.has(nome), `"${nome}" não existe em METAS_EDITORIAL.json`);
    assert.ok(TIPOS.includes(g.tipo), `${nome}: tipo inválido`);
    assert.ok(g.instrucao.length > 80, `${nome}: instrução curta`);
    if (g.tipo === 'artigo-cientifico') assert.match(g.instrucao, /PubMed/, `${nome}: artigo científico precisa pedir consultas PubMed`);
    if (g.tipo === 'cronica') assert.match(g.instrucao, /narrativa composta/, `${nome}: crônica precisa exigir narrativa composta`);
  }
});

test('categorias pendentes ganharam instrução: Condições Específicas e Empresas & RH', () => {
  assert.match(GRUPOS['Condições Específicas'].instrucao, /TDAH no adulto/);
  assert.match(GRUPOS['Empresas & RH'].instrucao, /nexo causal/);
  assert.match(GRUPOS['Empresas & RH'].instrucao, /CAT/);
});

test('cobertura: só Médicos & Enfermeiros e Pais & Famílias ficam sem grupo (metas já cumpridas)', () => {
  const semGrupo = lerMetas().categorias.map((c) => c.nome).filter((n) => !GRUPOS[n]);
  assert.deepStrictEqual(semGrupo.sort(), ['Médicos & Enfermeiros', 'Pais & Famílias']);
});
