/**
 * Do "T1 ok" para a fila (Item 7). Sem chamar o Claude: T2 e T3 pelo gemma2:9b (triagem em JSON), com Ollama ok.
 *  - Ollama fora/sem modelo: "aguardando-ollama" (pendente). Nunca aprovado nem reprovado por omissão.
 *  - Veredito inválido (JSON fora do formato): "incerto". Não entra.
 *  - Reprovado: "reprovado-T2T3". Se o motivo aponta sentido clínico: "aprovacao-antonio" (APROVACAO-ANTONIO.md), não aplica.
 *  - Aprovado: os 12 primeiros ficam "aguardando-calibracao" (revisão do Claude Code libera); a partir do 13º, "liberado".
 * Só "liberado" vira aprovado-checagem na fila (portão em regeracao.statusComGate).
 */
const fs = require('node:fs');
const { statusOllama, podeDecidir, decidirComOllama } = require('../ollamaStatus');

const CALIBRACAO = 12;
const MODELO = 'gemma2:9b';
const PEDIDO = (meta) => [
  'Você faz a triagem de um vídeo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.',
  'Avalie T2 (científica) e T3 (ética e humanizada) segundo CFM 2.336/2023 e 2.454/2026: sem promessa de cura, sem sensacionalismo, sem estigma, sem "psiquiatra" como título do médico, sem #psiquiatria.',
  'Responda SOMENTE um JSON: {"aprovado": true|false, "motivos": []}. Sem tabelas, sem texto fora do JSON.',
  `Título: ${meta.titulo || ''}`,
  `Descrição: ${String(meta.descricao || '').slice(0, 2000)}`,
].join('\n');

// Chamada local ao Ollama (sem nuvem). Devolve o veredito já convertido, ou undefined se o JSON for inválido.
async function chamarGemma(meta, { url = 'http://127.0.0.1:11434', buscar = fetch, timeoutMs = 120000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await buscar(`${url}/api/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: MODELO, prompt: PEDIDO(meta), format: 'json', stream: false }), signal: ctl.signal });
    if (!r.ok) return undefined;
    const txt = (await r.json()).response || '';
    const v = JSON.parse(txt.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, ''));
    return typeof v.aprovado === 'boolean' ? { aprovado: v.aprovado, motivos: Array.isArray(v.motivos) ? v.motivos : [] } : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

// T2/T3 de um item. st = statusOllama(). chamar(meta) = veredito do gemma.
async function avaliarT2T3({ meta, st, chamar }) {
  if (!podeDecidir(st)) return 'aguardando-ollama';
  const veredito = await chamar(meta);
  return decidirComOllama(st, veredito);
}

// Calibração: quantos já passaram antes deste (ordinal). Até 12 = aguardando calibração; depois, liberado.
function promoverCalibracao(itens, { limiar = CALIBRACAO } = {}) {
  const passaram = itens.filter((i) => i.estado === 'aguardando-calibracao' || i.estado === 'liberado').length;
  return passaram < limiar ? 'aguardando-calibracao' : 'liberado';
}

// Executa sobre o estado (somente itens em regerado-T1-ok). Idempotente: quem já tem estado final não muda.
async function executar({ estadoArq, metaDe, st, chamar, hoje }) {
  const reg = require('../youtube/regeracao');
  const estado = reg.lerEstado(estadoArq);
  const resultado = [];
  for (const it of estado.itens.filter((i) => i.estado === 'regerado-T1-ok' || i.estado === 'aguardando-ollama')) {
    const meta = metaDe(it.id);
    if (!meta) { it.estado = 'incerto'; it.motivo = 'meta.json ausente'; continue; }
    const dec = await avaliarT2T3({ meta, st, chamar });
    if (dec === 'aguardando-ollama') it.estado = 'aguardando-ollama';
    else if (dec === 'aprovado') it.estado = promoverCalibracao(estado.itens);
    else if (dec === 'reprovado') it.estado = 'reprovado-T2T3';
    else it.estado = 'incerto';
    it.atualizadoEm = hoje;
    resultado.push(`${it.id}: ${it.estado}`);
  }
  reg.gravarEstado(estado, estadoArq);
  return resultado;
}

// Libera (depois da revisão do Claude Code) quem está aguardando calibração. Mudança só por ordem explícita.
function liberarCalibrados(estadoArq, ids) {
  const reg = require('../youtube/regeracao');
  const estado = reg.lerEstado(estadoArq);
  for (const it of estado.itens) if (ids.includes(it.id) && it.estado === 'aguardando-calibracao') it.estado = 'liberado';
  reg.gravarEstado(estado, estadoArq);
}

// Anexa o bloco de decisão para o Dr. Antônio (máx. 6 linhas por vídeo, com as caixas).
function registrarParaAprovacao(arquivo, { id, motivo, trecho = '' }) {
  const bloco = `\n### ${id}\n- Motivo: ${String(motivo).slice(0, 240)}\n- Trecho: ${trecho.slice(0, 200) || '(ver meta.json)'}\n- Recomendação: revisar o sentido antes de regerar ou publicar.\n- [ ] APROVAR  [ ] RECUSAR  [ ] AJUSTAR: ___\n`;
  fs.appendFileSync(arquivo, bloco, 'utf8');
}

module.exports = { chamarGemma, avaliarT2T3, promoverCalibracao, executar, liberarCalibrados, registrarParaAprovacao, CALIBRACAO, MODELO, PEDIDO };
