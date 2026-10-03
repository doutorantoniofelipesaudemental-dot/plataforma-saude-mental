/**
 * Cliente de LLM dos scripts de automação (scripts/bot-gemini.js): Google
 * Gemini como provedor principal e Groq como reserva, ambos com camada
 * gratuita e sem depender do Claude Code. Roda só em scripts locais — nenhuma
 * rota nem a fila de publicação chamam LLM (a legenda e a capa da fila são
 * montadas a partir do artigo, sem IA, para a checagem provar a fidelidade).
 *
 * Variáveis (.env local): GEMINI_API_KEY, GROQ_API_KEY e, opcionais,
 * GEMINI_MODEL (padrão gemini-3.8-flash), GEMINI_MODEL_RESERVA (padrão
 * gemini-flash-latest), GEMINI_MODEL_LITE (padrão gemini-flash-lite-latest) e
 * GROQ_MODEL (padrão openai/gpt-oss-120b) e OPENAI_MODEL (padrão gpt-5-mini).
 * Ordem de tentativa: principal, reserva, lite, Groq e, por último (pago), OpenAI —
 * só entram os provedores com chave no .env. Todos recebem o MESMO prompt de
 * sistema (regras de fidelidade e CFM) e o mesmo schema. Sem nenhuma chave, lança um erro explicando.
 * (Os modelos gemini-1.5-pro, 2.0-flash e 2.5-* não estão mais disponíveis e os
 * "pro" não têm cota gratuita: conferido em out/2026.)
 */
const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// Cada modelo do Gemini tem cota gratuita própria: esgotada (ou sob alta demanda) a do principal,
// a reserva e depois o flash-lite costumam seguir disponíveis antes de cair no Groq.
const MODELO_GEMINI_RESERVA = process.env.GEMINI_MODEL_RESERVA || 'gemini-flash-latest';
const MODELO_GEMINI_LITE = process.env.GEMINI_MODEL_LITE || 'gemini-flash-lite-latest';
const MODELO_GROQ = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MODELO_OPENAI = process.env.OPENAI_MODEL || 'gpt-5-mini';
// Falha que passa IMEDIATAMENTE ao próximo degrau da cadeia (sem esperar nem repetir): cota ou créditos
// esgotados, limite de requisições (429), alta demanda/indisponibilidade (503, 500, overloaded). Cada degrau
// tem cota própria, então esperar no mesmo modelo só atrasa a geração.
const TENTATIVAS = 2;
const ESPERA_REPETICAO_MS = 3_000;

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Só vale repetir no MESMO degrau o que é intermitente e não depende de cota nem de capacidade do modelo:
 * JSON inválido do Groq em modo JSON (400 json_validate_failed) e queda de conexão. Todo o resto
 * (429, 503, cota, créditos) passa direto ao próximo modelo/provedor.
 */
function deveRepetir(err) {
  const mensagem = String(err?.message);
  if (/exceeded your current quota|quota exceeded|daily limit|insufficient_quota|no credits remaining/i.test(mensagem)) return false;
  if (/json_validate_failed|Failed to validate JSON/i.test(mensagem)) return true;
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|fetch failed|socket hang up|terminated/i.test(mensagem);
}

async function comRepeticao(fn, espera = ESPERA_REPETICAO_MS) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await fn();
    } catch (err) {
      if (tentativa >= TENTATIVAS || !deveRepetir(err)) throw err;
      await esperar(espera);
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
 * OpenAI (pago, último recurso): API REST direta, sem SDK. O schema vai no prompt, como no Groq, e o modo
 * JSON garante JSON válido. Os modelos gpt-5 só aceitam a temperatura padrão, por isso não a enviamos.
 */
async function viaOpenAI({ sistema, usuario, schema }) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 180_000);
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controle.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODELO_OPENAI,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${sistema}\n\nResponda SOMENTE com um objeto JSON que siga este JSON Schema:\n${JSON.stringify(schema)}` },
          { role: 'user', content: usuario },
        ],
      }),
    });
    const corpo = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const err = new Error(`OpenAI ${resp.status}: ${corpo?.error?.message || corpo?.error?.code || ''}`.slice(0, 300));
      err.status = resp.status;
      throw err;
    }
    return JSON.parse(corpo.choices[0].message.content);
  } finally {
    clearTimeout(limite);
  }
}

/**
 * Cadeia de provedores na ordem de tentativa, só com os que têm chave no ambiente:
 * Gemini principal -> Gemini reserva -> Gemini lite -> Groq -> OpenAI (paga, último recurso).
 */
function montarProvedores(env = process.env) {
  return [
    env.GEMINI_API_KEY && { nome: 'gemini', modelo: MODELO_GEMINI, fn: (p) => viaGemini(p, MODELO_GEMINI) },
    env.GEMINI_API_KEY && MODELO_GEMINI_RESERVA !== MODELO_GEMINI && { nome: 'gemini', modelo: MODELO_GEMINI_RESERVA, fn: (p) => viaGemini(p, MODELO_GEMINI_RESERVA) },
    env.GEMINI_API_KEY && MODELO_GEMINI_LITE !== MODELO_GEMINI && MODELO_GEMINI_LITE !== MODELO_GEMINI_RESERVA && { nome: 'gemini', modelo: MODELO_GEMINI_LITE, fn: (p) => viaGemini(p, MODELO_GEMINI_LITE) },
    env.GROQ_API_KEY && { nome: 'groq', modelo: MODELO_GROQ, fn: viaGroq },
    env.OPENAI_API_KEY && { nome: 'openai', modelo: MODELO_OPENAI, fn: viaOpenAI },
  ].filter(Boolean);
}

/**
 * Percorre os provedores em ordem e devolve o primeiro que responder. Falha de cota, crédito ou capacidade
 * (429, 503...) passa na hora ao próximo degrau; só JSON inválido e queda de conexão repetem uma vez.
 * `falhas` lista, na ordem, quem não respondeu e por quê.
 */
async function executarCadeia(provedores, parametros, { espera } = {}) {
  const falhas = [];
  for (const p of provedores) {
    try {
      const dados = await comRepeticao(() => p.fn(parametros), espera);
      return { dados, provedor: p.nome, modelo: p.modelo, falhas };
    } catch (err) {
      falhas.push(`${p.nome}/${p.modelo}: ${String(err?.message || err).slice(0, 200)}`);
    }
  }
  throw new Error(`Todos os provedores falharam — ${falhas.join(' | ')}`);
}

/**
 * Gera um objeto JSON percorrendo a cadeia de provedores. Devolve também qual provedor e modelo responderam.
 */
async function gerarJson({ sistema, usuario, schema, preferir, temperatura }) {
  const provedores = montarProvedores();
  // `preferir` põe um provedor na frente (o revisor usa o outro modelo, para um olhar independente).
  if (preferir) provedores.sort((a, b) => (b.nome === preferir) - (a.nome === preferir));
  if (!provedores.length) throw new Error('Nenhuma chave de LLM: defina GEMINI_API_KEY, GROQ_API_KEY e/ou OPENAI_API_KEY no .env local.');
  return executarCadeia(provedores, { sistema, usuario, schema, ...(temperatura !== undefined && { temperatura }) });
}

module.exports = { gerarJson, MODELO_GEMINI, MODELO_GEMINI_RESERVA, MODELO_GEMINI_LITE, MODELO_GROQ, MODELO_OPENAI, montarProvedores, executarCadeia, deveRepetir };
