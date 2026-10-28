/**
 * Alerta de crédito da Vercel (ordem de 26/10/2026, 23h): lê o custo efetivo do ciclo pela CLI oficial
 * (`vercel api /v1/billing/charges`, equipe do projeto) e avisa se passar de 70% do crédito antes do fim do ciclo.
 * Sem .env e sem token impresso. Se a CLI não conseguir ler (ex.: sem login, ou resposta em JSON Lines que ela não interpreta),
 * NÃO falha: mantém o último valor gravado e alerta "atualizar manualmente".
 * Registro: relatorios/vercel-credito.json. Alerta: primeira linha do relatorios/RESUMO-DO-DIA.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const REGISTRO = path.join(RAIZ, 'relatorios/vercel-credito.json');
const RESUMO = path.join(RAIZ, 'relatorios/RESUMO-DO-DIA.md');
const TEAM_ID = 'team_O3FHueRcQi1CDRuz64SmQPS7';

// Função pura: divide [inicio, fim) em janelas contíguas de 7 dias (a API recusa janelas maiores por tamanho).
function janelasSemanais(inicio, fim) {
  const janelas = [];
  let a = Date.parse(`${inicio}T00:00:00.000Z`);
  const b = Date.parse(`${fim}T00:00:00.000Z`);
  while (a < b) {
    const c = Math.min(a + 7 * 864e5, b);
    janelas.push({ from: new Date(a).toISOString(), to: new Date(c).toISOString() });
    a = c;
  }
  return janelas;
}

// Função pura: soma as janelas (cada uma é o `result` da API). Confere se são contíguas, para não contar nada em dobro nem deixar lacuna.
function somarJanelas(resultados) {
  const ordenadas = [...resultados].sort((x, y) => x.summary.periodStart.localeCompare(y.summary.periodStart));
  let efetivo = 0;
  let faturado = 0;
  let registros = 0;
  const porServico = {};
  for (const r of ordenadas) {
    efetivo += r.summary.totalEffectiveCost;
    faturado += r.summary.totalBilledCost;
    registros += r.summary.recordCount;
    for (const s of r.byService || []) porServico[s.serviceName] = (porServico[s.serviceName] || 0) + s.effectiveCost;
  }
  const contiguo = ordenadas.every((r, i) => i === 0 || r.summary.periodStart === ordenadas[i - 1].summary.periodEnd);
  const topServicos = Object.entries(porServico)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([servico, valor]) => ({ servico, efetivoUsd: +valor.toFixed(2) }));
  return { efetivoUsd: +efetivo.toFixed(2), faturadoUsd: +faturado.toFixed(2), registros, contiguo, topServicos };
}

// Função pura: alerta se o uso passar de alertaPct% do limite, e só enquanto o ciclo não acabou.
function avaliarCredito({ usadoUsd, limiteUsd, alertaPct, hoje, cicloFim }) {
  const limiteAlertaUsd = +(limiteUsd * alertaPct / 100).toFixed(2);
  const pct = +(usadoUsd / limiteUsd * 100).toFixed(1);
  const dentroDoCiclo = hoje < cicloFim;
  return { alerta: dentroDoCiclo && usadoUsd > limiteAlertaUsd, pct, limiteAlertaUsd };
}

// Tenta ler o ciclo pela CLI. Qualquer falha vira { ok: false, motivo } (nunca lança).
function lerPelaCli({ inicio, fim, executar = spawnSync }) {
  const resultados = [];
  for (const j of janelasSemanais(inicio, fim)) {
    const caminho = `/v1/billing/charges?teamId=${TEAM_ID}&from=${j.from}&to=${j.to}`;
    const r = executar('vercel', ['api', caminho, '--raw', '--non-interactive'], { encoding: 'utf8', timeout: 120000 });
    if (r.status !== 0) return { ok: false, motivo: `CLI sem resposta utilizável (código ${r.status})` };
    try { resultados.push(JSON.parse(r.stdout).result); } catch { return { ok: false, motivo: 'resposta da CLI não é JSON' }; }
  }
  return { ok: true, resultados };
}

function lerRegistro(arquivo) {
  try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { return null; }
}

// Passo da rotina semanal. Atualiza o registro se conseguir ler; avisa para atualizar à mão se não conseguir.
function atualizarCredito({ hoje, arquivo = REGISTRO, resumo = RESUMO, executar } = {}) {
  const reg = lerRegistro(arquivo);
  if (!reg) return { status: 'sem-registro', alerta: false, motivo: 'vercel-credito.json ausente' };
  const leitura = lerPelaCli({ inicio: reg.cicloInicio, fim: reg.cicloFim, executar });
  let usado = reg.creditoUsadoUsd;
  let fonte = reg.fonte;
  let topServicos = reg.topServicos || [];
  let status = 'manual';
  let motivo = 'atualizar manualmente (não foi possível ler pela CLI: ' + (leitura.ok ? '' : leitura.motivo) + ')';
  if (leitura.ok) {
    const soma = somarJanelas(leitura.resultados);
    if (soma.contiguo) {
      usado = soma.efetivoUsd;
      topServicos = soma.topServicos;
      fonte = 'vercel api /v1/billing/charges (CLI), soma das janelas semanais';
      status = 'lido';
      motivo = '';
      reg.faturadoUsd = soma.faturadoUsd;
    } else {
      motivo = 'janelas com lacuna ou sobreposição: atualizar manualmente';
    }
  }
  const aval = avaliarCredito({ usadoUsd: usado, limiteUsd: reg.creditoIncluidoUsd, alertaPct: reg.limiteAlertaPct, hoje, cicloFim: reg.cicloFim });
  const novo = { ...reg, atualizadoEm: new Date().toISOString(), fonte, creditoUsadoUsd: usado, topServicos, ultimaLeitura: status, ultimaLeituraMotivo: motivo, pctUsado: aval.pct };
  fs.writeFileSync(arquivo, JSON.stringify(novo, null, 1) + '\n', 'utf8');
  if (aval.alerta || status === 'manual') {
    const linha = aval.alerta
      ? `PRECISA DE VOCÊ: SIM — Vercel: crédito em ${aval.pct}% (US$ ${usado} de US$ ${reg.creditoIncluidoUsd}), acima de ${reg.limiteAlertaPct}% antes do fim do ciclo (${reg.cicloFim}). Maior gasto: ${topServicos.map((s) => `${s.servico} US$ ${s.efetivoUsd}`).join(', ') || 'sem dados'}.`
      : `PRECISA DE VOCÊ: SIM — Vercel: ${motivo}. Último valor: US$ ${usado} (${reg.atualizadoEm ? 'registro de ' + reg.atualizadoEm.slice(0, 10) : 'sem data'}).`;
    const atual = fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '';
    fs.writeFileSync(resumo, `${linha}\n${atual.replace(/^PRECISA DE VOCÊ: SIM — Vercel:.*\n?/, '')}`, 'utf8');
  }
  return { status, alerta: aval.alerta, pct: aval.pct, usadoUsd: usado, motivo };
}

module.exports = { janelasSemanais, somarJanelas, avaliarCredito, lerPelaCli, atualizarCredito, TEAM_ID };

if (require.main === module) {
  const r = atualizarCredito({ hoje: new Date().toISOString().slice(0, 10) });
  console.log(JSON.stringify(r));
}
