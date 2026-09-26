/**
 * Cliente de LLM dos scripts de automação (scripts/bot-gemini.js): Google
 * Gemini como provedor principal e Groq como reserva, ambos com camada
 * gratuita e sem depender do Claude Code. Roda só em scripts locais — nenhuma
 * rota nem a fila de publicação chamam LLM (a legenda e a capa da fila são
 * montadas a partir do artigo, sem IA, para a checagem provar a fidelidade).
 *
 * Variáveis (.env local): GEMINI_API_KEY, GROQ_API_KEY e, opcionais,
 * GEMINI_MODEL (padrão gemini-flash-latest) e GROQ_MODEL (padrão
 * openai/gpt-oss-120b). Sem nenhuma chave, lança um erro explicando.
 */
const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-flash-latest';
// Cada modelo do Gemini tem cota gratuita própria: esgotada a do principal, o
// flash-lite costuma seguir disponível antes de cair no Groq.
const MODELO_GEMINI_RESERVA = process.env.GEMINI_MODEL_RESERVA || 'gemini-flash-lite-latest';
const MODELO_GROQ = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const TENTATIVAS = 3;

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Erro temporário (sobrecarga, limite por minuto) vale nova tentativa; cota
 * gratuita esgotada ("exceeded your current quota") não volta em segundos —
 * passa direto ao próximo modelo/provedor.
 */
function ehTemporario(err) {
  const mensagem = String(err?.message);
  if (/exceeded your current quota|quota exceeded|daily limit/i.test(mensagem)) return false;
  // Groq em modo JSON às vezes gera JSON inválido em respostas longas (400
  // json_validate_failed): é intermitente, vale tentar de novo.
  if (/json_validate_failed|Failed to validate JSON/i.test(mensagem)) return true;
  const status = err?.status ?? err?.code ?? err?.error?.code;
  return status === 429 || status === 503 || status === 500 || /429|RESOURCE_EXHAUSTED|overloaded|UNAVAILABLE/i.test(mensagem);
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

async function viaGemini({ sistema, usuario, schema, temperatura = 0.6 }, modelo = MODELO_GEMINI) {
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const resposta = await ai.models.generateContent({
    model: modelo,
    contents: usuario,
    config: {
      systemInstruction: sistema,
      temperature: temperatura,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  });
  return JSON.parse(resposta.text);
}

async function viaGroq({ sistema, usuario, schema, temperatura = 0.6 }) {
  const Groq = require('groq-sdk');
  const cliente = new (Groq.default || Groq)({ apiKey: process.env.GROQ_API_KEY });
  // Groq não recebe o schema: vai no prompt, e o modo JSON garante JSON válido.
  const resposta = await cliente.chat.completions.create({
    model: MODELO_GROQ,
    temperature: temperatura,
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
async function gerarJson({ sistema, usuario, schema, preferir, temperatura }) {
  const provedores = [
    process.env.GEMINI_API_KEY && { nome: 'gemini', modelo: MODELO_GEMINI, fn: (p) => viaGemini(p, MODELO_GEMINI) },
    process.env.GEMINI_API_KEY && MODELO_GEMINI_RESERVA !== MODELO_GEMINI && { nome: 'gemini', modelo: MODELO_GEMINI_RESERVA, fn: (p) => viaGemini(p, MODELO_GEMINI_RESERVA) },
    process.env.GROQ_API_KEY && { nome: 'groq', modelo: MODELO_GROQ, fn: viaGroq },
  ].filter(Boolean);
  // `preferir` põe um provedor na frente (o revisor usa o outro modelo, para um olhar independente).
  if (preferir) provedores.sort((a, b) => (b.nome === preferir) - (a.nome === preferir));
  if (!provedores.length) throw new Error('Nenhuma chave de LLM: defina GEMINI_API_KEY e/ou GROQ_API_KEY no .env local.');

  const falhas = [];
  for (const p of provedores) {
    try {
      const dados = await comRepeticao(() => p.fn({ sistema, usuario, schema, ...(temperatura !== undefined && { temperatura }) }));
      return { dados, provedor: p.nome, modelo: p.modelo, falhas };
    } catch (err) {
      falhas.push(`${p.nome}/${p.modelo}: ${String(err?.message || err).slice(0, 200)}`);
    }
  }
  throw new Error(`Todos os provedores falharam — ${falhas.join(' | ')}`);
}

module.exports = { gerarJson, MODELO_GEMINI, MODELO_GEMINI_RESERVA, MODELO_GROQ };
