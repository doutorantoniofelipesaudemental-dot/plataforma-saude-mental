/**
 * Cascata de RASCUNHO (IA de reserva local). Nível 1: Ollama local (papel "redacao"), só para rascunho técnico.
 * Nível 2 (direto): tudo que o Ollama não fizer ou reprovar vai ao Claude diretamente (quem chama decide).
 * Regras fixas (docs/cascata-local.md): NUNCA para conteúdo clínico, texto de artigo, roteiro, legenda, YouTube ou dado de paciente.
 * O rascunho NUNCA sai aprovado: aprovado: false sempre. Portão automático: checarEticaCfm (contexto portal, sem exigir identificação em tarefa técnica).
 */
const ollama = require('./ollamaAdapter');
const { checarEticaCfm } = require('./checagensAprovacao');

const CATEGORIAS_PERMITIDAS = ['css', 'script', 'formatacao', 'json', 'rascunho-tecnico'];
const CATEGORIAS_BLOQUEADAS = ['clinico', 'artigo', 'roteiro', 'legenda', 'youtube', 'paciente', 'social'];

async function gerarRascunho({ categoria, sistema, usuario }, { gerar = ollama.gerar, checar = checarEticaCfm } = {}) {
  if (CATEGORIAS_BLOQUEADAS.includes(categoria) || !CATEGORIAS_PERMITIDAS.includes(categoria)) {
    return { status: 'bloqueado', nivel: 'direto', motivo: `categoria "${categoria}" exige o Claude direto` };
  }
  const r = await gerar('redacao', { sistema, usuario, maxTokens: 600, temperatura: 0.2 });
  if (r.indisponivel) return { status: 'indisponivel', nivel: 'direto', motivo: r.erro || 'Ollama indisponível' };
  const g = checar(r.texto, { contexto: 'portal', exigirIdentificacao: false });
  if (!g.ok) return { status: 'reprovado', nivel: 'direto', motivo: 'portão automático reprovou', falhas: g.falhas, modelo: r.modelo };
  return { status: 'rascunho', nivel: 'local', texto: r.texto, modelo: r.modelo, aprovado: false };
}

module.exports = { gerarRascunho, CATEGORIAS_PERMITIDAS, CATEGORIAS_BLOQUEADAS };
