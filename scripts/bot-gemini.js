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
10. Não escreva a identificação do médico (CRM, RQE): ela é acrescentada depois, automaticamente.`;

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
  const semTempos = todos.replace(/\b\d+\s?(?:s|seg|segundos|min|minutos)\b/gi, ' ').replace(/\bslide\s*\d+/gi, ' ');
  const inventados = [...new Set((semTempos.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => !permitidos.has(n)))];
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
  d.carrossel.forEach((s, i) => palavras(s.texto) > 25 && alertas.push(`slide ${i + 1} com ${palavras(s.texto)} palavras (máx. 25)`));
  if (d.carrossel.length < 7 || d.carrossel.length > 10) alertas.push(`carrossel com ${d.carrossel.length} slides (7 a 10)`);
  d.linkedin.forEach((p, i) => [...p.texto].length > 1300 && alertas.push(`LinkedIn ${i + 1} com ${[...p.texto].length} caracteres (máx. 1.300)`));
  d.youtube.titulos.forEach((t, i) => [...t].length > 60 && alertas.push(`título YouTube ${i + 1} com ${[...t].length} caracteres (máx. 60)`));
  d.reels.forEach((r, i) => (r.duracaoSegundos < 15 || r.duracaoSegundos > 45) && alertas.push(`Reel ${i + 1} com ${r.duracaoSegundos} s (15 a 45)`));

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

const celula = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function markdown(artigo, d, alertas, origem) {
  const l = [];
  l.push(`# RASCUNHO — ${artigo.titulo}`, '');
  l.push(`> Gerado por ${origem.provedor} (${origem.modelo}) em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC a partir do artigo \`${artigo.slug}\`. **Revisão humana obrigatória antes de publicar.** Nada foi publicado.`, '');
  l.push('## Verificação automática', '');
  l.push(...(alertas.length ? alertas.map((a) => `- ⚠️ ${a}`) : ['- ✅ nenhum alerta (a revisão humana continua obrigatória)']), '');
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
  const alertas = verificar(origem.dados, artigo, `${artigo.titulo} ${artigo.resumo} ${fonte}`);
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(destino, markdown(artigo, origem.dados, alertas, origem));
  return { slug: artigo.slug, destino, provedor: origem.provedor, alertas: alertas.length, reservas: origem.falhas };
}

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

  for (const slug of slugs) {
    const artigo = await Artigo.findOne({ slug, publicado: true }).lean();
    if (!artigo) {
      console.log(`  ${slug}: não encontrado ou não publicado`);
      continue;
    }
    try {
      const r = await gerarRascunho(artigo, { forcar: Boolean(args.forcar) });
      if (r.pulado) console.log(`  ${slug}: ${r.pulado}`);
      else console.log(`  ${slug}: rascunho por ${r.provedor} · ${r.alertas} alerta(s) · ${path.relative(RAIZ, r.destino)}${r.reservas.length ? ` · reserva usada (${r.reservas.join('; ')})` : ''}`);
    } catch (err) {
      console.log(`  ${slug}: FALHOU — ${err.message}`);
    }
  }
  await db.mongoose.disconnect();
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

module.exports = { verificar, SCHEMA, SISTEMA };
