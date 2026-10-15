/**
 * Adaptador do Ollama local (http://localhost:11434) com fallback automático.
 * Cada papel tem uma cadeia de modelos: se o primeiro não estiver instalado ou
 * falhar, tenta o próximo; se nenhum responder, devolve { indisponivel: true }
 * e quem chamou cai nas regras determinísticas (nunca aprova "às cegas").
 * Descarrega o modelo da RAM ao final de cada chamada (keep_alive: 0), pois a
 * esteira é sequencial (ver actionOrchestrator.js).
 */
const HOST = process.env.OLLAMA_HOST_URL || 'http://localhost:11434';

const MODELOS = {
  leve: ['llama3.2:3b', 'llama3.1:8b'],
  redacao: ['gemma2:9b', 'llama3.1:8b', 'llama3.2:3b'],
  codigo: ['qwen2.5-coder:14b', 'gemma2:9b', 'llama3.1:8b'],
};

// Pico estimado de RAM por modelo (GB), usado no mapa de alocação.
const RAM_GB = { 'llama3.2:3b': 2.5, 'gemma2:9b': 6.5, 'qwen2.5-coder:14b': 10, 'llama3.1:8b': 5.5, 'deepseek-r1:8b': 5.5 };

async function http(caminho, corpo, { timeoutMs = 120_000, metodo } = {}) {
  const r = await fetch(`${HOST}${caminho}`, {
    method: metodo || (corpo ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`Ollama ${caminho} HTTP ${r.status}`);
  return r.json();
}

async function modelosInstalados() {
  try {
    const { models = [] } = await http('/api/tags', null, { timeoutMs: 3000 });
    return models.map((m) => m.name);
  } catch {
    return null; // serviço fora do ar
  }
}

async function descarregar(modelo) {
  try {
    await http('/api/generate', { model: modelo, prompt: '', keep_alive: 0 }, { timeoutMs: 15_000 });
  } catch { /* já descarregado ou serviço fora */ }
}

/**
 * @param {'leve'|'redacao'|'codigo'} papel
 * @returns {Promise<{texto?: string, json?: any, modelo?: string, indisponivel?: boolean, erro?: string}>}
 */
async function gerar(papel, { sistema, usuario, json = false, maxTokens = 400, timeoutMs = 180_000, temperatura = 0.3 }) {
  const instalados = await modelosInstalados();
  if (!instalados) return { indisponivel: true, erro: 'Ollama fora do ar' };
  const cadeia = (MODELOS[papel] || []).filter((m) => instalados.includes(m));
  if (!cadeia.length) return { indisponivel: true, erro: `nenhum modelo de "${papel}" instalado` };
  let ultimoErro = '';
  for (const modelo of cadeia) {
    try {
      const resp = await http('/api/chat', {
        model: modelo,
        stream: false,
        keep_alive: 0,
        format: json ? 'json' : undefined,
        options: { temperature: temperatura, num_predict: maxTokens },
        messages: [
          ...(sistema ? [{ role: 'system', content: sistema }] : []),
          { role: 'user', content: usuario },
        ],
      }, { timeoutMs });
      const texto = resp.message?.content?.trim() || '';
      if (!json) return { texto, modelo };
      try {
        return { texto, json: JSON.parse(texto), modelo };
      } catch {
        ultimoErro = `${modelo}: JSON inválido`;
      }
    } catch (e) {
      ultimoErro = `${modelo}: ${e.message}`;
    } finally {
      await descarregar(modelo);
    }
  }
  return { indisponivel: true, erro: ultimoErro };
}

module.exports = { HOST, MODELOS, RAM_GB, modelosInstalados, descarregar, gerar };
