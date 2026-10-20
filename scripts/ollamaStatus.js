/**
 * Estado do Ollama local (127.0.0.1:11434). Só consulta /api/tags; não baixa nem altera nada.
 * status: 'ok' | 'fora' | 'sem-modelo'.
 * Regra: Ollama fora ou sem modelo = item "aguardando Ollama" (pendente). Nunca aprovado por omissão, nunca reprovado.
 */
const fs = require('node:fs');

const MODELOS_ESPERADOS = ['llama3.2:3b', 'gemma2:9b', 'qwen2.5-coder:14b'];

async function statusOllama({ url = 'http://127.0.0.1:11434', timeoutMs = 1500, buscar = fetch } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let nomes;
  try {
    const r = await buscar(`${url}/api/tags`, { signal: ctl.signal });
    if (!r.ok) return { status: 'fora', motivo: `HTTP ${r.status}`, modelos: [] };
    const j = await r.json();
    nomes = (j.models || []).map((m) => m.name);
  } catch (e) {
    return { status: 'fora', motivo: e.name === 'AbortError' ? 'tempo esgotado' : 'sem conexão', modelos: [] };
  } finally {
    clearTimeout(timer);
  }
  const modelos = MODELOS_ESPERADOS.filter((m) => nomes.includes(m));
  const faltando = MODELOS_ESPERADOS.filter((m) => !nomes.includes(m));
  if (faltando.length) return { status: 'sem-modelo', faltando, modelos };
  return { status: 'ok', modelos };
}

// Só o status 'ok' autoriza decisão de T2/T3 pelo modelo local.
function podeDecidir(st) {
  return st.status === 'ok';
}

// veredito: { aprovado: true|false, motivos: [] } vindo do gemma2:9b (JSON válido). Qualquer outra coisa = incerto.
function decidirComOllama(st, veredito) {
  if (!podeDecidir(st)) return 'aguardando-ollama';
  if (veredito && veredito.aprovado === true) return 'aprovado';
  if (veredito && veredito.aprovado === false) return 'reprovado';
  return 'incerto';
}

// Conta itens marcados "aguardando-ollama" no estado da regeração (arquivo ausente = zero).
function contarPendentes(arquivo) {
  try {
    const itens = JSON.parse(fs.readFileSync(arquivo, 'utf8')).itens || [];
    return itens.filter((i) => i.estado === 'aguardando-ollama').length;
  } catch {
    return 0;
  }
}

module.exports = { statusOllama, podeDecidir, decidirComOllama, contarPendentes, MODELOS_ESPERADOS };
