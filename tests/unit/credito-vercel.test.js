const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const c = require('../../scripts/creditoVercel');

// Dados de EXEMPLO (não são os valores reais da conta).
const janela = (ini, fim, efetivo, servicos, faturado = efetivo / 2) => ({
  summary: { periodStart: ini, periodEnd: fim, totalEffectiveCost: efetivo, totalBilledCost: faturado, recordCount: 10 },
  byService: servicos.map(([serviceName, effectiveCost]) => ({ serviceName, effectiveCost })),
});
const exemplo = () => [
  janela('2026-10-16T07:00:00.000Z', '2026-10-22T07:00:00.000Z', 4, [['Pro', 2], ['Build CPU Minutes', 2]]),
  janela('2026-10-22T07:00:00.000Z', '2026-10-29T07:00:00.000Z', 3, [['Build CPU Minutes', 2.5], ['Fast Origin Transfer', 0.5]]),
];
const registro = (extra = {}) => ({
  cicloInicio: '2026-10-16',
  cicloFim: '2026-11-16',
  creditoIncluidoUsd: 20,
  limiteAlertaPct: 70,
  limiteCobrancaUsd: 0.5,
  cobrancaCicloUsd: 0,
  creditoPainel: { usadoUsd: 4.19, incluidoUsd: 20, lidoEm: '2026-10-26' },
  fonte: 'manual',
  ...extra,
});
const tmp = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drs-credito-'));
  return { dir, arq: path.join(dir, 'vercel-credito.json'), res: path.join(dir, 'RESUMO-DO-DIA.md') };
};

test('janelas semanais são contíguas e cobrem [inicio, fim)', () => {
  const j = c.janelasSemanais('2026-10-16', '2026-11-16');
  assert.equal(j[0].from, '2026-10-16T00:00:00.000Z');
  assert.equal(j.at(-1).to, '2026-11-16T00:00:00.000Z');
  for (let i = 1; i < j.length; i++) assert.equal(j[i].from, j[i - 1].to);
  assert.ok(j.every((x) => Date.parse(x.to) - Date.parse(x.from) <= 7 * 864e5));
});

test('somarJanelas soma efetivo e cobrança, lista o maior gasto e confere a contiguidade', () => {
  const s = c.somarJanelas(exemplo());
  assert.equal(s.efetivoUsd, 7);
  assert.equal(s.faturadoUsd, 3.5);
  assert.equal(s.contiguo, true);
  assert.equal(s.topServicos[0].servico, 'Build CPU Minutes');
  assert.equal(s.topServicos[0].efetivoUsd, 4.5);
  assert.equal(s.registros, 20);
});

test('somarJanelas detecta lacuna entre janelas', () => {
  const r = exemplo();
  r[1].summary.periodStart = '2026-10-23T07:00:00.000Z';
  assert.equal(c.somarJanelas(r).contiguo, false);
});

test('billedCost zero não alerta (crédito do painel dentro do limite)', () => {
  const r = c.avaliarAlerta({ cobrancaUsd: 0, limiteCobrancaUsd: 0.5, creditoPainelUsd: 4.19, incluidoUsd: 20, alertaPct: 70, hoje: '2026-10-26', cicloFim: '2026-11-16' });
  assert.equal(r.alerta, false);
  assert.deepEqual(r.motivos, []);
});

test('billedCost acima de 0,50 alerta; exatamente 0,50 não', () => {
  const base = { limiteCobrancaUsd: 0.5, creditoPainelUsd: 0, incluidoUsd: 20, alertaPct: 70, hoje: '2026-10-26', cicloFim: '2026-11-16' };
  assert.equal(c.avaliarAlerta({ ...base, cobrancaUsd: 0.5 }).alerta, false);
  const r = c.avaliarAlerta({ ...base, cobrancaUsd: 0.51 });
  assert.equal(r.alerta, true);
  assert.deepEqual(r.motivos, ['cobrança sob demanda']);
});

test('crédito do painel acima de 70% (US$ 14) alerta; US$ 14 exatos não', () => {
  const base = { cobrancaUsd: 0, limiteCobrancaUsd: 0.5, incluidoUsd: 20, alertaPct: 70, hoje: '2026-10-26', cicloFim: '2026-11-16' };
  assert.equal(c.avaliarAlerta({ ...base, creditoPainelUsd: 14 }).alerta, false);
  const r = c.avaliarAlerta({ ...base, creditoPainelUsd: 14.01 });
  assert.equal(r.alerta, true);
  assert.deepEqual(r.motivos, ['crédito do painel']);
});

test('depois do fim do ciclo não alerta, mesmo com cobrança', () => {
  const r = c.avaliarAlerta({ cobrancaUsd: 5, limiteCobrancaUsd: 0.5, creditoPainelUsd: 15, incluidoUsd: 20, alertaPct: 70, hoje: '2026-11-16', cicloFim: '2026-11-16' });
  assert.equal(r.alerta, false);
});

test('CLI sem resposta: não lança, mantém os valores e avisa para atualizar manualmente', () => {
  const { dir, arq, res } = tmp();
  fs.writeFileSync(arq, JSON.stringify(registro()));
  const falsa = () => ({ status: 1, stdout: '' });
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar: falsa });
  assert.equal(r.status, 'manual');
  assert.match(r.motivo, /atualizar manualmente/);
  const reg = JSON.parse(fs.readFileSync(arq, 'utf8'));
  assert.equal(reg.creditoPainel.usadoUsd, 4.19);
  assert.equal(reg.cobrancaCicloUsd, 0);
  assert.match(fs.readFileSync(res, 'utf8'), /^PRECISA DE VOCÊ: SIM — Vercel: atualizar manualmente/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI responde com cobrança: grava cobrança e efetivo informativo, e alerta por cobrança', () => {
  const { dir, arq, res } = tmp();
  fs.writeFileSync(arq, JSON.stringify(registro()));
  // Cada janela (5 no ciclo) traz US$ 3,20 de efetivo e US$ 1,60 de cobrança: total US$ 16 e US$ 8.
  const executar = (_cmd, args) => {
    const [from, to] = args[1].match(/from=([^&]+)&to=([^&]+)/).slice(1);
    return { status: 0, stdout: JSON.stringify({ result: janela(from, to, 3.2, [['Build CPU Minutes', 3.2]]) }) };
  };
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar });
  assert.equal(r.status, 'lido');
  assert.equal(r.cobrancaUsd, 8);
  assert.equal(r.alerta, true);
  assert.deepEqual(r.motivos, ['cobrança sob demanda']);
  const reg = JSON.parse(fs.readFileSync(arq, 'utf8'));
  assert.equal(reg.cobrancaCicloUsd, 8);
  assert.equal(reg.custoEfetivoInformativoUsd, 16);
  assert.equal(reg.ultimaLeitura, 'lido');
  assert.match(fs.readFileSync(res, 'utf8'), /^PRECISA DE VOCÊ: SIM — Vercel: cobrança sob demanda de US\$ 8 no ciclo/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI responde sem cobrança: não alerta e o resumo não ganha linha de alerta', () => {
  const { dir, arq, res } = tmp();
  fs.writeFileSync(arq, JSON.stringify(registro({ creditoPainel: { usadoUsd: 4.19, incluidoUsd: 20, lidoEm: '2026-10-26' } })));
  const executar = (_cmd, args) => {
    const [from, to] = args[1].match(/from=([^&]+)&to=([^&]+)/).slice(1);
    return { status: 0, stdout: JSON.stringify({ result: janela(from, to, 3.2, [['Pro', 3.2]], 0) }) };
  };
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar });
  assert.equal(r.status, 'lido');
  assert.equal(r.alerta, false);
  assert.equal(JSON.parse(fs.readFileSync(arq, 'utf8')).cobrancaCicloUsd, 0);
  assert.equal(fs.existsSync(res), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('registro sem creditoPainel ou sem cobrança: sem-registro, nada gravado', () => {
  const { dir, arq, res } = tmp();
  fs.writeFileSync(arq, JSON.stringify({ cicloInicio: '2026-10-16', cicloFim: '2026-11-16' }));
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar: () => ({ status: 1, stdout: '' }) });
  assert.equal(r.status, 'sem-registro');
  assert.equal(JSON.parse(fs.readFileSync(arq, 'utf8')).cicloFim, '2026-11-16');
  fs.rmSync(dir, { recursive: true, force: true });
});
