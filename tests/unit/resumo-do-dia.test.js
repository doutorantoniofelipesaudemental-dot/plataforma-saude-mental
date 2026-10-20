const test = require('node:test');
const assert = require('node:assert/strict');
const { montarResumo, MAX_LINHAS } = require('../../scripts/conferencias/resumoDoDia');

test('sem alertas: PRECISA DE VOCÊ = NÃO e 4 linhas', () => {
  const l = montarResumo({ hoje: '2026-10-19', publicadosOntem: ['Instagram x'], saiHoje: [] });
  assert.equal(l[0], 'PRECISA DO DR. ANTÔNIO: NÃO');
  assert.equal(l[2], 'Publicado ontem: Instagram x');
  assert.equal(l[3], 'Sai hoje: nada agendado');
  assert.equal(l.at(-1), 'Alertas: nenhum');
});

test('alerta com ação: SIM na primeira linha, com o texto da ação', () => {
  const l = montarResumo({ hoje: '2026-10-19', alertas: [{ texto: 'token vence em 3 dias', acao: true }, { texto: 'narração pendente', acao: false }] });
  assert.equal(l[0], 'PRECISA DO DR. ANTÔNIO: SIM — token vence em 3 dias');
  assert.ok(l.includes('[aviso] narração pendente'));
});

test('aviso sem ação não exige o Dr. Antônio', () => {
  const l = montarResumo({ hoje: '2026-10-19', alertas: [{ texto: 'LinkedIn com 1 atrasado', acao: false }] });
  assert.equal(l[0], 'PRECISA DO DR. ANTÔNIO: NÃO');
});

test('nunca passa de 15 linhas e avisa o corte', () => {
  const alertas = Array.from({ length: 30 }, (_, i) => ({ texto: `alerta ${i}`, acao: false }));
  const l = montarResumo({ hoje: '2026-10-19', alertas });
  assert.equal(l.length, MAX_LINHAS);
  assert.match(l.at(-1), /\+\d+ linha\(s\) omitida\(s\)/);
});
