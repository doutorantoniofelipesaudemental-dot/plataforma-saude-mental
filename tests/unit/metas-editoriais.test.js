// Metas editoriais (backend/lib/metasEditoriais.js + METAS_EDITORIAL.json): sem banco.
const { test } = require('node:test');
const assert = require('node:assert');
const { lerMetas, calcularProgresso, renderizarProgresso } = require('../../backend/lib/metasEditoriais');

test('planejamento: 372 no total, +121 novos, e as metas por categoria do plano', () => {
  const m = lerMetas();
  assert.strictEqual(m.metaTotal, 372);
  assert.strictEqual(m.baseAtual + m.novosPlanejados, 372);
  const p = calcularProgresso(m, null);
  assert.strictEqual(p.somaNovos, 121);
  assert.strictEqual(p.somaMetas + m.naoAlocados, 372);
  assert.deepStrictEqual(p.avisos, []);
  const meta = Object.fromEntries(m.categorias.map((c) => [c.nome, [c.meta, c.novos]]));
  assert.deepStrictEqual(meta['Relatos da Prática'], [80, 30]);
  assert.deepStrictEqual(meta['Residentes & Estudantes'], [30, 28]);
  assert.deepStrictEqual(meta['Médicos & Enfermeiros'], [50, 0]);
  assert.deepStrictEqual(meta['Pais & Famílias'], [40, 0]);
});

test('progresso: atual × meta por categoria, com grupos que somam categorias do banco', () => {
  const m = lerMetas();
  const p = calcularProgresso(m, { 'Relatos da Prática': 50, 'Cuidadores & Famílias': 1, 'Educadores & Professores': 1, 'Geral': 4, 'Luto & Divórcio': 1 });
  const linha = (n) => p.linhas.find((l) => l.nome.startsWith(n));
  assert.deepStrictEqual([linha('Relatos').atual, linha('Relatos').faltam, linha('Relatos').pct], [50, 30, 63]);
  assert.strictEqual(linha('Linhas de Cuidado').atual, 2);
  assert.strictEqual(linha('Condições').atual, 1);
  assert.strictEqual(p.foraDoPlano, 4);
  assert.match(renderizarProgresso(m, p), /Relatos da Prática\s+50\s+80\s+30\s+\+30/);
});

test('progresso: banco indisponível mostra n/d em vez de quebrar', () => {
  const m = lerMetas();
  assert.match(renderizarProgresso(m, calcularProgresso(m, null)), /n\/d/);
});
