#!/usr/bin/env node
/**
 * Bot de mídias: gera o RASCUNHO do pacote de conteúdo (Modo Essencial) de um
 * artigo com LLM gratuito — Gemini (principal) ou Groq (reserva), ver
 * backend/lib/llm.js — sem usar o Claude Code. 100% autônomo em Node.
 *
 *   npm run bot:gerar-posts -- --slug=professores-saude-mental
 *   npm run bot:gerar-posts -- --proximos=3        os 3 próximos da fila
 *   ... --forcar                                   refaz rascunho que já existe
 *
 * O que NÃO faz, de propósito:
 *   - não publica nada e não mexe na fila (Regra 5 / CLAUDE.md 20-sexies);
 *   - não substitui a legenda nem a capa da fila, que continuam montadas a
 *     partir do artigo (sem IA) para a tripla checagem provar a fidelidade.
 *
 * Saída: CONTEUDO_INSTAGRAM/rascunhos/<slug>.md (fora do git — repositório
 * público), marcado como rascunho, com a lista de alertas da verificação
 * automática (números que não estão no artigo, termos proibidos pelo CFM,
 * inglês nas artes, limites de tamanho, CVV em tema sensível). A revisão
 * humana continua obrigatória antes de publicar qualquer peça.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}

const db = require('../backend/lib/db');
const Artigo = require('../backend/models/Artigo');
const { listarFila } = require('../backend/lib/filaRedes');
const { gerarJson } = require('../backend/lib/llm');
const { textoParaNarracao } = require('../backend/lib/narracao');
const { temaSensivel, ehRelatoClinico, IDENTIFICACAO } = require('../backend/lib/legendaInstagram');
const { RE_INGLES, TERMOS_CFM, semNomesProprios } = require('../backend/lib/checagemRedes');

const PASTA = path.join(RAIZ, 'CONTEUDO_INSTAGRAM', 'rascunhos');
const IDENTIFICACAO_COMPLETA = [
  'Dr. Antônio Felipe · Médico · CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade · RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
].join('\n');

const SISTEMA = `Você é a equipe editorial da Plataforma Integrada de Saúde Mental Doutor Antônio Felipe (Instagram @doutor.antoniofelipe.smental). Escreva em português do Brasil, a partir SOMENTE do artigo fornecido.

Regras inegociáveis:
1. Fidelidade: não invente dados, números, estudos, casos nem falas. Use só o que está no artigo. Se precisar de um número que não está nele, escreva [DADO A CONFIRMAR].
2. CFM: sem sensacionalismo, sem promessa de cura ou de resultado, sem superlativos sobre o médico, sem antes e depois, sem identificar pacientes. Nunca apresente o autor como "psiquiatra" nem "especialista em psiquiatria/saúde mental". Escreva o nome como "Dr. Antônio Felipe", com acento.
3. Caso clínico só como narrativa composta, dito explicitamente.
4. Suicídio, autolesão e crise: nunca descreva métodos; inclua CVV 188 e SAMU 192.
5. Conteúdo educativo: sem diagnóstico ou prescrição a distância; oriente a buscar avaliação.
6. Textos das artes (slides, texto na tela, ganchos) 100% em português. Únicas exceções permitidas: "burnout", "online", "home office", "feedback" e o nome "Free Fire".
7. Hashtags: 3 a 5, em português, de tema. Nunca #psiquiatria nem hashtag de marca.
8. Escrita humana: proibido "No mundo de hoje", "Em suma", "Vale ressaltar", "Desvendar", "Mergulhar", "Jornada" em excesso, "Não é apenas X, é Y", listas de três adjetivos, travessões em excesso, emoji em toda linha. Frases de tamanhos variados, exemplos concretos do consultório e do trabalho, sem inventar casos reais.
9. Limites: ganchos com até 10 palavras; slide com até 25 palavras; post de LinkedIn com até 1.300 caracteres; título do YouTube com até 60 caracteres, palavra-chave no início; Reels de 15 a 45 s; Shorts até 60 s.
10. Não escreva a identificação do médico (CRM, RQE) nem a linha do CVV/SAMU: elas são acrescentadas depois, automaticamente.
11. Números: cite faixas inteiras e com as ressalvas do artigo (ex.: "de 25% a 74%, em quadros moderados a graves, em estudos de vários países"). Nunca destaque só o limite de cima ("até 74%").
12. Use os termos do próprio artigo para serviços, públicos e efeitos (ex.: "serviço de saúde do trabalhador da rede de ensino", "proteger crianças e adolescentes"); não acrescente conclusões que ele não tira.
13. Quantidades exatas: 5 ganchos, 7 a 10 slides, 2 Reels, 5 Stories, 2 posts de LinkedIn (cada um terminando com uma chamada para ler o artigo completo no site), 5 títulos e 2 Shorts.`;

const texto = { type: 'string' };
const SCHEMA = {
  type: 'object',
  properties: {
    ganchos: { type: 'array', items: texto, description: '5 ganchos para Reels, até 10 palavras cada' },
    carrossel: {
      type: 'array',
      description: '7 a 10 slides: capa com gancho, desenvolvimento, slide de salvar/compartilhar e CTA final',
      items: { type: 'object', properties: { texto, visual: texto }, required: ['texto', 'visual'] },
    },
    legenda: { ...texto, description: 'legenda do carrossel: gancho na 1ª linha, 2 a 4 parágrafos curtos, CTA, "🔗 Artigo completo no link da bio", 3 a 5 hashtags' },
    reels: {
      type: 'array',
      description: '2 roteiros de Reels',
      items: {
        type: 'object',
        properties: {
          titulo: texto,
          duracaoSegundos: { type: 'number' },
          cenas: {
            type: 'array',
            items: { type: 'object', properties: { tempo: texto, cena: texto, textoTela: texto, fala: texto }, required: ['tempo', 'cena', 'textoTela', 'fala'] },
          },
        },
        required: ['titulo', 'duracaoSegundos', 'cenas'],
      },
    },
    stories: {
      type: 'array',
      description: '5 Stories em sequência, com enquete ou teste quando fizer sentido (evite caixa de pergunta)',
      items: { type: 'object', properties: { texto, recurso: texto }, required: ['texto', 'recurso'] },
    },
    linkedin: {
      type: 'array',
      description: '2 posts: um de autoridade (gestores/RH) e um educativo',
      items: { type: 'object', properties: { tipo: texto, texto }, required: ['tipo', 'texto'] },
    },
    youtube: {
      type: 'object',
      properties: {
        titulos: { type: 'array', items: texto, description: '5 títulos até 60 caracteres' },
        shorts: {
          type: 'array',
          items: { type: 'object', properties: { titulo: texto, gancho: texto, desenvolvimento: texto, cta: texto }, required: ['titulo', 'gancho', 'desenvolvimento', 'cta'] },
        },
      },
      required: ['titulos', 'shorts'],
    },
  },
  required: ['ganchos', 'carrossel', 'legenda', 'reels', 'stories', 'linkedin', 'youtube'],
};

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

const palavras = (s) => String(s).split(/\s+/).filter((p) => /[\p{L}\d]/u.test(p)).length;

/** Verificação automática — alertas vão no topo do rascunho; nada é descartado em silêncio. */
function verificar(d, artigo, fonte) {
  const alertas = [];
  const todos = [
    ...d.ganchos,
    ...d.carrossel.map((s) => s.texto),
    d.legenda,
    ...d.reels.flatMap((r) => r.cenas.flatMap((c) => [c.textoTela, c.fala])),
    ...d.stories.map((s) => s.texto),
    ...d.linkedin.map((p) => p.texto),
    ...d.youtube.titulos,
    ...d.youtube.shorts.flatMap((s) => [s.titulo, s.gancho, s.desenvolvimento, s.cta]),
  ].join('\n');

  // Números fora do artigo (exceto telefones de apoio e registros profissionais).
  const permitidos = new Set(['188', '192', '41322', '26638', ...(fonte.match(/\d+(?:[.,]\d+)?/g) || [])]);
  // Linhas de apoio ("CVV 188 (ligação gratuita, 24h) · SAMU 192") são fixas: fora da contagem.
  const semTempos = todos
    .replace(/[^\n]*CVV 188[^\n]*/g, ' ')
    .replace(/\b\d+\s?(?:s|seg|segundos|min|minutos)\b/gi, ' ').replace(/\bslide\s*\d+/gi, ' ');
  // Contagem de estrutura ("6 sinais", "3 atitudes") não é dado; qualquer outro
  // número ("8 horas de sono", "40%") precisa estar no artigo.
  const semContagens = semTempos.replace(
    /\b\d{1,2}\s+(?:sinais|atitudes|dicas|passos|perguntas|formas|motivos|pontos|mitos|fatos|etapas|perfis|conceitos|práticas|ações|limites|fatores|coisas|minutos de leitura)\b/gi,
    ' '
  );
  const inventados = [
    ...new Set(
      (semContagens.match(/\d+(?:[.,]\d+)?(?:\s?%)?/g) || [])
        .map((n) => n.replace(/\s?%$/, ''))
        .filter((n) => !permitidos.has(n))
    ),
  ];
  if (inventados.length) alertas.push(`números que não estão no artigo: ${inventados.join(', ')} — conferir`);
  if (/\[DADO A CONFIRMAR\]/.test(todos)) alertas.push('há [DADO A CONFIRMAR] no texto');

  for (const [re, motivo] of TERMOS_CFM) {
    const m = todos.match(re);
    if (m) alertas.push(`CFM: ${motivo} ("${m[0]}")`);
  }
  if (/\bAntonio\b/.test(todos)) alertas.push('"Antonio" sem acento');
  if (/#psiquiatria\b/i.test(todos)) alertas.push('#psiquiatria');

  const artes = [...d.ganchos, ...d.carrossel.map((s) => s.texto), ...d.reels.flatMap((r) => r.cenas.map((c) => c.textoTela))].join('\n');
  const ingles = semNomesProprios(artes).match(RE_INGLES);
  if (ingles) alertas.push(`inglês nas artes: "${ingles[2]}"`);

  d.ganchos.forEach((g, i) => palavras(g) > 10 && alertas.push(`gancho ${i + 1} com ${palavras(g)} palavras (máx. 10)`));
  // A linha de apoio acrescentada pelo código (garantirLinhasFixas) não conta no limite.
  const semApoio = (s) => s.replace(' Apoio agora: CVV 188 · SAMU 192', '');
  d.carrossel.forEach((s, i) => palavras(semApoio(s.texto)) > 25 && alertas.push(`slide ${i + 1} com ${palavras(semApoio(s.texto))} palavras (máx. 25)`));
  if (d.carrossel.length < 7 || d.carrossel.length > 10) alertas.push(`carrossel com ${d.carrossel.length} slides (7 a 10)`);
  d.linkedin.forEach((p, i) => [...p.texto].length > 1300 && alertas.push(`LinkedIn ${i + 1} com ${[...p.texto].length} caracteres (máx. 1.300)`));
  d.youtube.titulos.forEach((t, i) => [...t].length > 60 && alertas.push(`título YouTube ${i + 1} com ${[...t].length} caracteres (máx. 60)`));
  d.reels.forEach((r, i) => (r.duracaoSegundos < 15 || r.duracaoSegundos > 45) && alertas.push(`Reel ${i + 1} com ${r.duracaoSegundos} s (15 a 45)`));

  const esperado = { ganchos: [d.ganchos, 5], reels: [d.reels, 2], stories: [d.stories, 5], linkedin: [d.linkedin, 2], títulos: [d.youtube.titulos, 5], shorts: [d.youtube.shorts, 2] };
  for (const [nome, [lista, n]] of Object.entries(esperado)) if (lista.length !== n) alertas.push(`${lista.length} ${nome} (esperado ${n})`);
  const teto = todos.match(/\baté\s+\d+(?:[.,]\d+)?\s?%/i);
  if (teto) alertas.push(`faixa citada só pelo limite de cima ("${teto[0]}") — use a faixa inteira, com as ressalvas do artigo`);
  d.linkedin.forEach((p, i) => !/artigo|drsaudemental\.vercel\.app|link/i.test(p.texto.split('\n').slice(-3).join(' ')) && alertas.push(`LinkedIn ${i + 1} sem chamada para o artigo`));

  if (temaSensivel(artigo)) {
    if (!d.legenda.includes('CVV 188')) alertas.push('tema sensível: legenda sem CVV 188');
    if (!/CVV 188/.test(d.carrossel.at(-1)?.texto || '')) alertas.push('tema sensível: último slide sem CVV 188');
  }
  if (ehRelatoClinico(artigo) && !/narrativa composta|composi[cç][aã]o/i.test(todos)) alertas.push('relato clínico sem dizer que é narrativa composta');
  const hashtags = d.legenda.match(/#[\p{L}\d_]+/gu) || [];
  if (hashtags.length < 3 || hashtags.length > 5) alertas.push(`legenda com ${hashtags.length} hashtags (3 a 5)`);
  if (!d.legenda.includes('link da bio')) alertas.push('legenda sem "link da bio"');
  return alertas;
}

/**
 * O modelo às vezes omite um campo (sobretudo o Groq, que não recebe o schema
 * como restrição). Campo ausente vira lista vazia — a verificação acusa a
 * quantidade errada em vez de o bot quebrar.
 */
function normalizar(d = {}) {
  const lista = (v) => (Array.isArray(v) ? v : []);
  const str = (v) => (typeof v === 'string' ? v : '');
  return {
    ganchos: lista(d.ganchos).map(str),
    carrossel: lista(d.carrossel).map((s) => ({ texto: str(s?.texto), visual: str(s?.visual) })),
    legenda: str(d.legenda),
    reels: lista(d.reels).map((r) => ({
      titulo: str(r?.titulo),
      duracaoSegundos: Number(r?.duracaoSegundos) || 0,
      cenas: lista(r?.cenas).map((c) => ({ tempo: str(c?.tempo), cena: str(c?.cena), textoTela: str(c?.textoTela), fala: str(c?.fala) })),
    })),
    stories: lista(d.stories).map((s) => ({ texto: str(s?.texto), recurso: str(s?.recurso) })),
    linkedin: lista(d.linkedin).map((p) => ({ tipo: str(p?.tipo), texto: str(p?.texto) })),
    youtube: {
      titulos: lista(d.youtube?.titulos).map(str),
      shorts: lista(d.youtube?.shorts).map((s) => ({ titulo: str(s?.titulo), gancho: str(s?.gancho), desenvolvimento: str(s?.desenvolvimento), cta: str(s?.cta) })),
    },
  };
}

/**
 * Linhas que não dependem do modelo: em tema sensível, o apoio (CVV 188 /
 * SAMU 192) entra na legenda e no último slide — como a identificação, é
 * acrescentado pelo código, para nunca faltar.
 */
const LINHA_APOIO = 'Se precisar de apoio: CVV 188 (ligação gratuita, 24h) · SAMU 192';
function garantirLinhasFixas(d, artigo) {
  if (!temaSensivel(artigo)) return;
  if (!d.legenda.includes('CVV 188')) {
    const i = d.legenda.search(/\n+\s*#/);
    d.legenda = i < 0 ? `${d.legenda}\n\n${LINHA_APOIO}` : `${d.legenda.slice(0, i)}\n\n${LINHA_APOIO}${d.legenda.slice(i)}`;
  }
  const ultimo = d.carrossel.at(-1);
  if (ultimo && !ultimo.texto.includes('CVV 188')) ultimo.texto = `${ultimo.texto} Apoio agora: CVV 188 · SAMU 192`;
}

/* ===================== 2º passe: revisor semântico ===================== */

/**
 * Cada frase do rascunho, identificada pela peça de onde veio. Linhas fixas
 * (CVV, identificação, link da bio, hashtags) ficam de fora: não vêm do modelo.
 */
function pecasDoRascunho(d) {
  const p = [];
  const add = (id, texto) => {
    const t = String(texto || '')
      .split('\n')
      .filter((l) => l.trim() && !/CVV 188|CRM-BA|link da bio|^\s*#/.test(l))
      .join(' ')
      .trim();
    if (t) p.push({ id, texto: t });
  };
  d.ganchos.forEach((t, i) => add(`gancho ${i + 1}`, t));
  d.carrossel.forEach((s, i) => add(`slide ${i + 1}`, s.texto));
  d.legenda.split(/\n\s*\n/).forEach((t, i) => add(`legenda §${i + 1}`, t));
  d.reels.forEach((r, i) => r.cenas.forEach((c, j) => add(`Reel ${i + 1}, cena ${j + 1}`, `${c.textoTela}. ${c.fala}`)));
  d.stories.forEach((s, i) => add(`story ${i + 1}`, s.texto));
  d.linkedin.forEach((post, i) => post.texto.split(/\n\s*\n/).forEach((t, j) => add(`LinkedIn ${i + 1}, §${j + 1}`, t)));
  d.youtube.titulos.forEach((t, i) => add(`título YouTube ${i + 1}`, t));
  d.youtube.shorts.forEach((s, i) => add(`Short ${i + 1}`, `${s.gancho} ${s.desenvolvimento} ${s.cta}`));
  return p;
}

const SISTEMA_REVISOR = `Você é revisor de FIDELIDADE de conteúdo médico. Compare cada peça do rascunho com o ARTIGO, que é a única fonte válida.

Aponte somente problemas de sentido:
- afirmação que o artigo não faz;
- atribuição incorreta: conceito, dado ou efeito ligado ao público, etapa, estudo ou contexto errado (ex.: o artigo apresenta um conceito como geral e o rascunho o prende a um grupo);
- número ou faixa distorcidos, sem a ressalva que o artigo dá, ou só pelo limite de cima;
- generalização, exagero ou mudança de sentido (inclusive tom alarmista);
- orientação clínica que o artigo não dá.

Não aponte estilo, tamanho, ortografia nem escolhas de formato. Para cada problema, cite o trecho do rascunho e o trecho do artigo que mostra o desvio. Se a peça estiver fiel, não a mencione. Se tudo estiver fiel, devolva a lista vazia. Responda em português do Brasil.`;

const SCHEMA_REVISOR = {
  type: 'object',
  properties: {
    desvios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          peca: { type: 'string', description: 'identificador da peça, como veio na lista' },
          trecho: { type: 'string', description: 'trecho do rascunho com o problema' },
          problema: { type: 'string', description: 'o que está errado, em uma frase' },
          artigo: { type: 'string', description: 'trecho do artigo que mostra o desvio' },
          gravidade: { type: 'string', enum: ['alta', 'media', 'baixa'] },
        },
        required: ['peca', 'trecho', 'problema', 'artigo', 'gravidade'],
      },
    },
  },
  required: ['desvios'],
};

/**
 * Revisor semântico: um 2º passe de LLM, de preferência com o OUTRO provedor
 * (o Groq revisa o que o Gemini escreveu e vice-versa). Nunca lança: se não
 * houver revisor disponível, isso é registrado e a aprovação exige revisão
 * integral pelo médico.
 */
async function revisarFidelidade(d, fonte, provedorQueGerou) {
  const pecas = pecasDoRascunho(d);
  const usuario = `ARTIGO:\n${fonte}\n\nPEÇAS DO RASCUNHO:\n${pecas.map((p) => `[${p.id}] ${p.texto}`).join('\n')}`;
  try {
    const r = await gerarJson({
      sistema: SISTEMA_REVISOR,
      usuario,
      schema: SCHEMA_REVISOR,
      preferir: provedorQueGerou === 'gemini' ? 'groq' : 'gemini',
    });
    const desvios = (Array.isArray(r.dados?.desvios) ? r.dados.desvios : []).map((x) => ({
      peca: String(x.peca || ''),
      trecho: String(x.trecho || ''),
      problema: String(x.problema || ''),
      artigo: String(x.artigo || ''),
      gravidade: ['alta', 'media', 'baixa'].includes(x.gravidade) ? x.gravidade : 'media',
    }));
    return { disponivel: true, provedor: r.provedor, modelo: r.modelo, independente: r.provedor !== provedorQueGerou, desvios, pecas: pecas.length };
  } catch (err) {
    return { disponivel: false, erro: String(err.message).slice(0, 300), desvios: [], pecas: pecas.length };
  }
}

const celula = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const AVISO_CFM =
  'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';

function markdown(artigo, d, alertas, origem, revisao) {
  const l = [];
  const icone = { alta: '🔴', media: '🟠', baixa: '🟡' };
  l.push(`# RASCUNHO — ${artigo.titulo}`, '');
  l.push(`> Gerado por ${origem.provedor} (${origem.modelo}) em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC a partir do artigo \`${artigo.slug}\`. Nada foi publicado.`);
  l.push(`> ${AVISO_CFM}`);
  l.push(`> **Aprovar depois de revisar:** \`npm run bot:aprovar -- --slug=${artigo.slug}\``, '');
  l.push('## 1º passe — verificação estrutural (código)', '');
  l.push(...(alertas.length ? alertas.map((a) => `- ⚠️ ${a}`) : ['- ✅ nenhum alerta']), '');
  l.push('## 2º passe — revisor semântico de fidelidade (LLM)', '');
  if (!revisao.disponivel) {
    l.push(`- ⚠️ **Revisor indisponível** (${revisao.erro}). A revisão de sentido fica inteira com o médico.`, '');
  } else {
    l.push(`> ${revisao.provedor} (${revisao.modelo})${revisao.independente ? ', modelo diferente do que escreveu' : ', mesmo modelo que escreveu (só uma chave disponível)'} · ${revisao.pecas} peças comparadas com o artigo.`, '');
    l.push(
      ...(revisao.desvios.length
        ? revisao.desvios.map((x) => `- ${icone[x.gravidade]} **${x.peca}** — ${x.problema}\n  - Rascunho: "${x.trecho}"\n  - Artigo: "${x.artigo}"`)
        : ['- ✅ nenhum desvio de sentido apontado']),
      ''
    );
  }
  l.push('> Os dois passes reduzem o trabalho da revisão, mas não a substituem: um revisor automático também erra.', '');
  l.push('## Ganchos para Reels', '', ...d.ganchos.map((g, i) => `${i + 1}. ${g}`), '');
  l.push('## Carrossel (4:5, 1080 × 1350)', '', '| Slide | Texto | Sugestão visual |', '|---|---|---|');
  d.carrossel.forEach((s, i) => l.push(`| ${i + 1} | ${celula(s.texto)} | ${celula(s.visual)} |`));
  l.push('', `Rodapé do último slide: ${IDENTIFICACAO}`, '');
  l.push('### Legenda', '', ...d.legenda.split('\n').map((x) => `> ${x}`), '');
  d.reels.forEach((r, i) => {
    l.push(`## Reel ${i + 1}: ${r.titulo} (${r.duracaoSegundos} s)`, '', '| Tempo | Cena | Texto na tela | Fala |', '|---|---|---|---|');
    r.cenas.forEach((c) => l.push(`| ${celula(c.tempo)} | ${celula(c.cena)} | ${celula(c.textoTela)} | ${celula(c.fala)} |`));
    l.push('');
  });
  l.push('## Stories', '', '| # | Texto | Recurso |', '|---|---|---|');
  d.stories.forEach((s, i) => l.push(`| ${i + 1} | ${celula(s.texto)} | ${celula(s.recurso)} |`));
  l.push('');
  d.linkedin.forEach((p, i) => l.push(`## LinkedIn ${i + 1}: ${p.tipo}`, '', ...p.texto.split('\n').map((x) => `> ${x}`), '>', `> ${IDENTIFICACAO}`, ''));
  l.push('## YouTube', '', '### Títulos', '', ...d.youtube.titulos.map((t, i) => `${i + 1}. ${t}`), '');
  d.youtube.shorts.forEach((s, i) => l.push(`### Short ${i + 1}: ${s.titulo}`, '', `- **Gancho:** ${s.gancho}`, `- **Desenvolvimento:** ${s.desenvolvimento}`, `- **CTA:** ${s.cta}`, ''));
  l.push('**Descrição dos Shorts:**', '```', 'Artigo completo: https://drsaudemental.vercel.app/artigo/' + artigo.slug, 'Conteúdo educativo. Não substitui avaliação individual.', 'Apoio agora: CVV 188 (24h, gratuito) · SAMU 192', '', IDENTIFICACAO_COMPLETA, '```', '');
  return l.join('\n');
}

async function gerarRascunho(artigo, { forcar }) {
  const destino = path.join(PASTA, `${artigo.slug}.md`);
  if (fs.existsSync(destino) && !forcar) return { slug: artigo.slug, pulado: 'rascunho já existe (use --forcar)' };
  // Mesmo texto limpo da narração: sem ferramentas, código, links nem lista de referências.
  const fonte = textoParaNarracao(artigo).split('\n').filter((linha, i) => i !== 1).join('\n');
  const usuario = `ARTIGO APROVADO (única fonte permitida):\n\nTítulo: ${artigo.titulo}\nCategoria: ${artigo.categoria}\nResumo: ${artigo.resumo}\n\n${fonte}`;
  const origem = await gerarJson({ sistema: SISTEMA, usuario, schema: SCHEMA });
  origem.dados = normalizar(origem.dados);
  garantirLinhasFixas(origem.dados, artigo);
  const alertas = verificar(origem.dados, artigo, `${artigo.titulo} ${artigo.resumo} ${fonte}`);
  const revisao = await revisarFidelidade(origem.dados, usuario, origem.provedor);
  fs.mkdirSync(PASTA, { recursive: true });
  const md = markdown(artigo, origem.dados, alertas, origem, revisao);
  fs.writeFileSync(destino, md);
  // Metadados para a aprovação (bot-aprovar.js): o que foi verificado e sobre qual versão do artigo.
  fs.writeFileSync(
    path.join(PASTA, `${artigo.slug}.json`),
    JSON.stringify(
      {
        slug: artigo.slug,
        geradoEm: new Date(),
        provedor: origem.provedor,
        modelo: origem.modelo,
        hashArtigo: hashArtigo(artigo),
        hashRascunhoGerado: hashTexto(md),
        alertas,
        revisor: revisao,
        aprovacao: null,
      },
      null,
      2
    )
  );
  return { slug: artigo.slug, destino, provedor: origem.provedor, alertas: alertas.length, revisao, reservas: origem.falhas };
}

const crypto = require('crypto');
const hashTexto = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
/** Versão do artigo que o rascunho usou: mudou o texto, o rascunho precisa ser refeito. */
const hashArtigo = (a) => hashTexto(`${a.titulo}\n${a.resumo}\n${a.conteudo}`);

async function main() {
  const args = argumentos();
  await db.connect();
  let slugs;
  if (args.slug) slugs = [String(args.slug)];
  else if (args.proximos) slugs = (await listarFila(Number(args.proximos) || 1)).map((a) => a.slug);
  else {
    console.log('\n  Use --slug=<slug> ou --proximos=N [--forcar].\n');
    return db.mongoose.disconnect();
  }

  const gerados = [];
  for (const slug of slugs) {
    const artigo = await Artigo.findOne({ slug, publicado: true }).lean();
    if (!artigo) {
      console.log(`  ${slug}: não encontrado ou não publicado`);
      continue;
    }
    try {
      const r = await gerarRascunho(artigo, { forcar: Boolean(args.forcar) });
      if (r.pulado) console.log(`  ${slug}: ${r.pulado}`);
      else {
        const rev = r.revisao.disponivel
          ? `${r.revisao.desvios.length} desvio(s) de sentido (revisor ${r.revisao.provedor})`
          : 'revisor indisponível';
        console.log(`  ${slug}: rascunho por ${r.provedor} · ${r.alertas} alerta(s) estruturais · ${rev}${r.reservas.length ? ` · reserva usada` : ''}`);
        gerados.push({ slug, alertas: r.alertas, revisao: r.revisao });
      }
    } catch (err) {
      console.log(`  ${slug}: FALHOU — ${err.message}`);
    }
  }
  await db.mongoose.disconnect();

  if (gerados.length) {
    console.log('\n  Resumo do lote — revise cada rascunho em CONTEUDO_INSTAGRAM/rascunhos/ e aprove:\n');
    for (const g of gerados) {
      const altos = g.revisao.desvios.filter((x) => x.gravidade === 'alta').length;
      const situacao =
        g.alertas || g.revisao.desvios.length || !g.revisao.disponivel
          ? `⚠️  ${g.alertas} alerta(s), ${g.revisao.desvios.length} desvio(s)${altos ? ` (${altos} de gravidade alta)` : ''}${g.revisao.disponivel ? '' : ', sem revisor'}`
          : '✅ sem alertas nem desvios';
      console.log(`  ${situacao.padEnd(46)}  npm run bot:aprovar -- --slug=${g.slug}`);
    }
    console.log(`\n  Aprovar o lote inteiro de uma vez: npm run bot:aprovar -- --lote\n  ${AVISO_CFM}\n`);
  }
}

if (require.main === module) main().catch(async (err) => {
  console.error('\n  Falha:', err.message, '\n');
  try {
    await db.mongoose.disconnect();
  } catch {
    // conexão já pode ter caído.
  }
  process.exit(1);
});

module.exports = { verificar, garantirLinhasFixas, normalizar, pecasDoRascunho, hashArtigo, hashTexto, AVISO_CFM, SCHEMA, SISTEMA };
