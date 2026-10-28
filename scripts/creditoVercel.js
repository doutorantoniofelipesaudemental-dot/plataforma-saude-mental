/**
 * Alerta de custo da Vercel (ordem de 27/10/2026, 22h30, decisão única).
 * ALERTA = cobrança real do ciclo (`billedCost`, acima de US$ 0,50) OU crédito do painel informado à mão (`creditoPainel`, acima de 70% do incluído).
 * `effectiveCost` é SÓ INFORMATIVO (tendência por serviço): inclui o uso coberto pelas franquias do Pro, que não consome o crédito de US$ 20.
 * Lê pela CLI oficial (`vercel api /v1/billing/charges`, equipe do projeto). Sem .env e sem token impresso.
 * Se a CLI não conseguir ler (ex.: sem login, ou resposta em JSON Lines que ela não interpreta),
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

// Função pura: linhas do plano (assinatura Pro, assentos, taxas fixas). Não são cobrança sob demanda e ficam fora do alerta (ordem de 28/10/2026).
function ehAssinatura(s) {
  return s.serviceCategory === 'Subscription Licenses' || s.serviceName === 'Pro' || s.serviceName === 'Additional Team Seats';
}

// Função pura: soma as janelas (cada uma é o `result` da API). Confere se são contíguas, para não contar nada em dobro nem deixar lacuna.
function somarJanelas(resultados) {
  const ordenadas = [...resultados].sort((x, y) => x.summary.periodStart.localeCompare(y.summary.periodStart));
  let efetivo = 0;
  let faturado = 0;
  let registros = 0;
  let usoFaturado = 0;
  const porServico = {};
  for (const r of ordenadas) {
    efetivo += r.summary.totalEffectiveCost;
    faturado += r.summary.totalBilledCost;
    registros += r.summary.recordCount;
    for (const s of r.byService || []) {
      porServico[s.serviceName] = (porServico[s.serviceName] || 0) + s.effectiveCost;
      if (!ehAssinatura(s)) usoFaturado += s.billedCost || 0;
    }
  }
  const contiguo = ordenadas.every((r, i) => i === 0 || r.summary.periodStart === ordenadas[i - 1].summary.periodEnd);
  const topServicos = Object.entries(porServico)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([servico, valor]) => ({ servico, efetivoUsd: +valor.toFixed(2) }));
  // usoFaturadoUsd é o que alerta (cobrança sob demanda, sem a assinatura do plano). assinaturaFaturadaUsd é só informativo.
  return {
    efetivoUsd: +efetivo.toFixed(2),
    faturadoUsd: +faturado.toFixed(2),
    usoFaturadoUsd: +usoFaturado.toFixed(2),
    assinaturaFaturadaUsd: +(faturado - usoFaturado).toFixed(2),
    registros,
    contiguo,
    topServicos,
  };
}

// Função pura: alerta se há cobrança real acima do limite, ou se o crédito do painel passou de alertaPct% do incluído. Só enquanto o ciclo não acabou.
function avaliarAlerta({ cobrancaUsd, limiteCobrancaUsd, creditoPainelUsd, incluidoUsd, alertaPct, hoje, cicloFim }) {
  const motivos = [];
  if (cobrancaUsd > limiteCobrancaUsd) motivos.push('cobrança sob demanda');
  const limitePainelUsd = +(incluidoUsd * alertaPct / 100).toFixed(2);
  const pctPainel = +(creditoPainelUsd / incluidoUsd * 100).toFixed(1);
  if (creditoPainelUsd > limitePainelUsd) motivos.push('crédito do painel');
  const dentroDoCiclo = hoje < cicloFim;
  return { alerta: dentroDoCiclo && motivos.length > 0, motivos, pctPainel, limitePainelUsd };
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

// Passo da rotina semanal. Atualiza a cobrança se conseguir ler; avisa para atualizar à mão se não conseguir.
// O crédito do painel (creditoPainel) é sempre o informado à mão: a API não o mostra.
function atualizarCredito({ hoje, arquivo = REGISTRO, resumo = RESUMO, executar } = {}) {
  const reg = lerRegistro(arquivo);
  if (!reg || !reg.creditoPainel || typeof reg.cobrancaCicloUsd !== 'number') return { status: 'sem-registro', alerta: false, motivo: 'vercel-credito.json ausente ou incompleto' };
  const leitura = lerPelaCli({ inicio: reg.cicloInicio, fim: reg.cicloFim, executar });
  let novo = { ...reg };
  let status = 'manual';
  let motivo = 'atualizar manualmente (não foi possível ler pela CLI: ' + (leitura.ok ? '' : leitura.motivo) + ')';
  if (leitura.ok) {
    const soma = somarJanelas(leitura.resultados);
    if (soma.contiguo) {
      novo = { ...novo, cobrancaCicloUsd: soma.usoFaturadoUsd, assinaturaCicloUsd: soma.assinaturaFaturadaUsd, custoEfetivoInformativoUsd: soma.efetivoUsd, topServicos: soma.topServicos, fonte: 'vercel api /v1/billing/charges (CLI), soma das janelas semanais' };
      status = 'lido';
      motivo = '';
    } else {
      motivo = 'janelas com lacuna ou sobreposição: atualizar manualmente';
    }
  }
  const aval = avaliarAlerta({
    cobrancaUsd: novo.cobrancaCicloUsd,
    limiteCobrancaUsd: novo.limiteCobrancaUsd,
    creditoPainelUsd: novo.creditoPainel.usadoUsd,
    incluidoUsd: novo.creditoPainel.incluidoUsd,
    alertaPct: novo.limiteAlertaPct,
    hoje,
    cicloFim: novo.cicloFim,
  });
  novo = { ...novo, atualizadoEm: new Date().toISOString(), ultimaLeitura: status, ultimaLeituraMotivo: motivo, pctCreditoPainel: aval.pctPainel };
  fs.writeFileSync(arquivo, JSON.stringify(novo, null, 1) + '\n', 'utf8');
  if (aval.alerta || status === 'manual') {
    const partes = [];
    if (aval.motivos.includes('cobrança sob demanda')) partes.push(`cobrança sob demanda de US$ ${novo.cobrancaCicloUsd} no ciclo (acima de US$ ${novo.limiteCobrancaUsd})`);
    if (aval.motivos.includes('crédito do painel')) partes.push(`crédito do painel em ${aval.pctPainel}% (US$ ${novo.creditoPainel.usadoUsd} de US$ ${novo.creditoPainel.incluidoUsd}, acima de ${novo.limiteAlertaPct}%)`);
    const linha = aval.alerta
      ? `PRECISA DE VOCÊ: SIM — Vercel: ${partes.join('; ')}. Fim do ciclo: ${novo.cicloFim}. Custo efetivo do ciclo (só informativo): US$ ${novo.custoEfetivoInformativoUsd ?? 'sem dados'}.`
      : `PRECISA DE VOCÊ: SIM — Vercel: ${motivo}. Última cobrança registrada: US$ ${novo.cobrancaCicloUsd}.`;
    const atual = fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '';
    fs.writeFileSync(resumo, `${linha}\n${atual.replace(/^PRECISA DE VOCÊ: SIM — Vercel:.*\n?/, '')}`, 'utf8');
  }
  return { status, alerta: aval.alerta, motivos: aval.motivos, pctPainel: aval.pctPainel, cobrancaUsd: novo.cobrancaCicloUsd, motivo };
}

module.exports = { janelasSemanais, somarJanelas, avaliarAlerta, lerPelaCli, atualizarCredito, TEAM_ID };

if (require.main === module) {
  const r = atualizarCredito({ hoje: new Date().toISOString().slice(0, 10) });
  console.log(JSON.stringify(r));
}
