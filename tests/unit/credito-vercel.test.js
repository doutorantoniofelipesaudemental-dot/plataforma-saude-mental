const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const c = require('../../scripts/creditoVercel');

// Dados de EXEMPLO (não são os valores reais da conta).
const janela = (ini, fim, efetivo, servicos) => ({
  summary: { periodStart: ini, periodEnd: fim, totalEffectiveCost: efetivo, totalBilledCost: efetivo / 2, recordCount: 10 },
  byService: servicos.map(([serviceName, effectiveCost]) => ({ serviceName, effectiveCost })),
});
const exemplo = () => [
  janela('2026-10-16T07:00:00.000Z', '2026-10-22T07:00:00.000Z', 4, [['Pro', 2], ['Build CPU Minutes', 2]]),
  janela('2026-10-22T07:00:00.000Z', '2026-10-29T07:00:00.000Z', 3, [['Build CPU Minutes', 2.5], ['Fast Origin Transfer', 0.5]]),
];

test('janelas semanais são contíguas e cobrem [inicio, fim)', () => {
  const j = c.janelasSemanais('2026-10-16', '2026-11-16');
  assert.equal(j[0].from, '2026-10-16T00:00:00.000Z');
  assert.equal(j.at(-1).to, '2026-11-16T00:00:00.000Z');
  for (let i = 1; i < j.length; i++) assert.equal(j[i].from, j[i - 1].to);
  assert.ok(j.every((x) => Date.parse(x.to) - Date.parse(x.from) <= 7 * 864e5));
});

test('somarJanelas soma o efetivo, lista o maior gasto e confere a contiguidade', () => {
  const s = c.somarJanelas(exemplo());
  assert.equal(s.efetivoUsd, 7);
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

test('alerta só acima de 70% e só antes do fim do ciclo', () => {
  const base = { limiteUsd: 20, alertaPct: 70, cicloFim: '2026-11-16' };
  assert.equal(c.avaliarCredito({ ...base, usadoUsd: 14, hoje: '2026-10-26' }).alerta, false);
  assert.equal(c.avaliarCredito({ ...base, usadoUsd: 14.01, hoje: '2026-10-26' }).alerta, true);
  assert.equal(c.avaliarCredito({ ...base, usadoUsd: 15, hoje: '2026-11-16' }).alerta, false);
});

test('CLI sem resposta: não lança, devolve motivo, e a rotina avisa para atualizar manualmente', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drs-credito-'));
  const arq = path.join(dir, 'vercel-credito.json');
  const res = path.join(dir, 'RESUMO-DO-DIA.md');
  fs.writeFileSync(arq, JSON.stringify({ cicloInicio: '2026-10-16', cicloFim: '2026-11-16', creditoIncluidoUsd: 20, creditoUsadoUsd: 4.19, limiteAlertaPct: 70, fonte: 'manual' }));
  const falsa = () => ({ status: 1, stdout: '' });
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar: falsa });
  assert.equal(r.status, 'manual');
  assert.match(r.motivo, /atualizar manualmente/);
  assert.equal(JSON.parse(fs.readFileSync(arq, 'utf8')).creditoUsadoUsd, 4.19);
  assert.match(fs.readFileSync(res, 'utf8'), /^PRECISA DE VOCÊ: SIM — Vercel: atualizar manualmente/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI responde: grava a soma, o maior gasto e alerta acima de 70%', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drs-credito-'));
  const arq = path.join(dir, 'vercel-credito.json');
  const res = path.join(dir, 'RESUMO-DO-DIA.md');
  fs.writeFileSync(arq, JSON.stringify({ cicloInicio: '2026-10-16', cicloFim: '2026-11-16', creditoIncluidoUsd: 20, creditoUsadoUsd: 4.19, limiteAlertaPct: 70, fonte: 'manual' }));
  // Cada chamada devolve a janela pedida (from/to do argumento), com US$ 3,20 de efetivo: 5 janelas = US$ 16.
  const executar = (_cmd, args) => {
    const [from, to] = args[1].match(/from=([^&]+)&to=([^&]+)/).slice(1);
    return { status: 0, stdout: JSON.stringify({ result: janela(from, to, 3.2, [['Build CPU Minutes', 3.2]]) }) };
  };
  const r = c.atualizarCredito({ hoje: '2026-10-26', arquivo: arq, resumo: res, executar });
  assert.equal(r.status, 'lido');
  assert.equal(r.usadoUsd, 16);
  assert.equal(r.alerta, true);
  const reg = JSON.parse(fs.readFileSync(arq, 'utf8'));
  assert.equal(reg.creditoUsadoUsd, 16);
  assert.equal(reg.ultimaLeitura, 'lido');
  assert.match(fs.readFileSync(res, 'utf8'), /^PRECISA DE VOCÊ: SIM — Vercel: crédito em 80%/);
  fs.rmSync(dir, { recursive: true, force: true });
});
