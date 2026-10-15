/**
 * Registro central de Agent Skills (híbrido: Produtividade/Marketing + Redes
 * Sociais). Skills são funções puras e locais (custo zero); as que usam LLM
 * passam por ollamaAdapter e têm fallback determinístico.
 */
const ollama = require('../ollamaAdapter');

const EMAIL_CONSULTORIO = 'doutor.antoniofelipe.saudemental@gmail.com';
const RE_CRISE = /\b(me matar|suic[ií]d\w*|quero morrer|acabar com (?:tudo|a minha vida)|me machucar|automutila\w*|overdose|n[ãa]o aguento mais)\b/i;
const RE_CONSULTA = /\b(consulta|agendar|agendamento|marcar|hor[áa]rio|valor|pre[çc]o|mentoria|consultoria|parceria|institucional|empresa|palestra|suporte)\b/i;

/* ---------------------------- Pack Produtividade ---------------------------- */
const produtividade = {
  copywriter: async ({ tema, publico = 'pessoas em sofrimento emocional' }) => {
    const r = await ollama.gerar('redacao', {
      sistema: 'Você é redator de saúde mental em português do Brasil. Fale COM a pessoa, tom simples e acolhedor, sem culpa, medo ou promessa. Até 70 palavras.',
      usuario: `Tema: ${tema}. Público: ${publico}. Escreva o texto.`, maxTokens: 160, timeoutMs: 150_000,
    });
    return r.texto || `Você não está sozinho(a) com ${tema}. Conversar sobre isso é um primeiro passo, e o SUS (UBS e CAPS) pode acolher você.`;
  },
  croSeo: ({ titulo, descricao = '' }) => ({
    tituloOk: titulo.length >= 30 && titulo.length <= 60,
    descricaoOk: descricao.length >= 70 && descricao.length <= 160,
    sugestoes: [titulo.length > 60 && 'encurte o título para até 60 caracteres', !/\?|como|por que|o que/i.test(titulo) && 'use gancho de dúvida (como/por que/o que)'].filter(Boolean),
  }),
  analytics: (metricas = []) => {
    const total = metricas.reduce((s, m) => s + (m.alcance || 0), 0);
    const melhor = [...metricas].sort((a, b) => (b.engajamento || 0) - (a.engajamento || 0))[0];
    return { pecas: metricas.length, alcanceTotal: total, melhor: melhor?.id ?? null };
  },
  automacaoCrm: (lead) => ({ ...lead, etapa: RE_CONSULTA.test(lead.mensagem || '') ? 'agendamento-por-email' : 'conteudo-educativo', responsavel: 'Dr. Antônio Felipe' }),
};

/* ----------------------------- Pack Redes Sociais ---------------------------- */
const GANCHOS = [
  (t) => `Você já sentiu isso com ${t}?`,
  (t) => `3 sinais de que ${t} merece atenção (e o que fazer)`,
  (t) => `O que ninguém te explica sobre ${t}`,
  (t) => `${t}: por onde começar o cuidado no SUS`,
];
const CLICHES_IA = /\b(mergulhe|desvende|no mundo atual|em suma|vale ressaltar|jornada de autoconhecimento|desbloqueie|potencialize|revolucion\w+)\b/gi;

const redes = {
  pesquisaGanchos: (tema) => GANCHOS.map((g) => g(tema)),
  linterLegenda: (legenda) => {
    const achados = [...new Set((String(legenda).match(CLICHES_IA) || []).map((s) => s.toLowerCase()))];
    const longas = String(legenda).split(/[.!?]\s/).filter((f) => f.split(/\s+/).length > 28).length;
    return { ok: !achados.length && !longas, cliches: achados, frasesLongas: longas };
  },
  triagemDm: (mensagem) => {
    if (RE_CRISE.test(mensagem)) return { categoria: 'crise', acao: 'humanHandoff' };
    if (RE_CONSULTA.test(mensagem)) return { categoria: 'consulta', acao: 'humanHandoff' };
    return { categoria: 'geral', acao: 'resposta-educativa' };
  },
  /**
   * Encaminhamento a humano. ATENÇÃO: o pedido original citava WhatsApp, mas o
   * CLAUDE.md §3.B proíbe mensageria de terceiros. Crise → CVV 188/SAMU 192;
   * consulta → e-mail do consultório (único canal de agendamento).
   */
  humanHandoff: ({ categoria }) => categoria === 'crise'
    ? { canal: 'telefone', texto: 'Você importa. Ligue agora para o CVV 188 (24 h) ou SAMU 192.', urgente: true }
    : { canal: 'email', texto: `Para agendar, escreva para ${EMAIL_CONSULTORIO} (assunto: Agendamento de consulta).`, link: `mailto:${EMAIL_CONSULTORIO}?subject=Agendamento%20de%20consulta`, urgente: false },
};

const registro = new Map([
  ...Object.entries(produtividade).map(([n, f]) => [`produtividade.${n}`, f]),
  ...Object.entries(redes).map(([n, f]) => [`redes.${n}`, f]),
]);

function obter(nome) {
  const f = registro.get(nome);
  if (!f) throw new Error(`skill não registrada: ${nome}`);
  return f;
}

module.exports = { registro, obter, listar: () => [...registro.keys()], produtividade, redes };
