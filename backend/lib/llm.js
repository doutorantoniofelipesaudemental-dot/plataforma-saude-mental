/**
 * Cliente de LLM dos scripts de automação (scripts/bot-gemini.js): Google
 * Gemini como provedor principal e Groq como reserva, ambos com camada
 * gratuita e sem depender do Claude Code. Roda só em scripts locais — nenhuma
 * rota nem a fila de publicação chamam LLM (a legenda e a capa da fila são
 * montadas a partir do artigo, sem IA, para a checagem provar a fidelidade).
 *
 * Variáveis (.env local): GEMINI_API_KEY, GROQ_API_KEY e, opcionais,
 * GEMINI_MODEL (padrão gemini-flash-latest) e GROQ_MODEL (padrão
 * llama-3.3-70b-versatile). Sem nenhuma chave, lança um erro explicando.
 */
const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MODELO_GROQ = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TENTATIVAS = 3;

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Erro temporário (limite de taxa, sobrecarga) vale nova tentativa; o resto não. */
function ehTemporario(err) {
  const status = err?.status ?? err?.code ?? err?.error?.code;
  return status === 429 || status === 503 || status === 500 || /429|RESOURCE_EXHAUSTED|overloaded|UNAVAILABLE/i.test(String(err?.message));
}

async function comRepeticao(fn) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await fn();
    } catch (err) {
      if (tentativa >= TENTATIVAS || !ehTemporario(err)) throw err;
      await esperar(tentativa * 10_000);
    }
  }
}

async function viaGemini({ sistema, usuario, schema }) {
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const resposta = await ai.models.generateContent({
    model: MODELO_GEMINI,
    contents: usuario,
    config: {
      systemInstruction: sistema,
      temperature: 0.6,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  });
  return JSON.parse(resposta.text);
}

async function viaGroq({ sistema, usuario, schema }) {
  const Groq = require('groq-sdk');
  const cliente = new (Groq.default || Groq)({ apiKey: process.env.GROQ_API_KEY });
  // Groq não recebe o schema: vai no prompt, e o modo JSON garante JSON válido.
  const resposta = await cliente.chat.completions.create({
    model: MODELO_GROQ,
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${sistema}\n\nResponda SOMENTE com um objeto JSON que siga este JSON Schema:\n${JSON.stringify(schema)}` },
      { role: 'user', content: usuario },
    ],
  });
  return JSON.parse(resposta.choices[0].message.content);
}

/**
 * Gera um objeto JSON. Tenta o Gemini; se não houver chave ou ele falhar,
 * tenta o Groq. Devolve também qual provedor e modelo responderam.
 */
async function gerarJson({ sistema, usuario, schema }) {
  const provedores = [
    process.env.GEMINI_API_KEY && { nome: 'gemini', modelo: MODELO_GEMINI, fn: viaGemini },
    process.env.GROQ_API_KEY && { nome: 'groq', modelo: MODELO_GROQ, fn: viaGroq },
  ].filter(Boolean);
  if (!provedores.length) throw new Error('Nenhuma chave de LLM: defina GEMINI_API_KEY e/ou GROQ_API_KEY no .env local.');

  const falhas = [];
  for (const p of provedores) {
    try {
      const dados = await comRepeticao(() => p.fn({ sistema, usuario, schema }));
      return { dados, provedor: p.nome, modelo: p.modelo, falhas };
    } catch (err) {
      falhas.push(`${p.nome}: ${String(err?.message || err).slice(0, 200)}`);
    }
  }
  throw new Error(`Todos os provedores falharam — ${falhas.join(' | ')}`);
}

module.exports = { gerarJson, MODELO_GEMINI, MODELO_GROQ };
