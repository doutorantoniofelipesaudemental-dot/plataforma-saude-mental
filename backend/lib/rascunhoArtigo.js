/**
 * Rascunho de artigo/crônica a partir de uma pauta APROVADA, com as 3 checagens automáticas
 * antes de gravar: humanização/empatia, ética médica/CFM e originalidade.
 *
 * O rascunho é Markdown em CONTEUDO_INSTAGRAM/pautas/rascunhos/<slug>.md, vinculado à pauta
 * por id e slug. Passar nas checagens NÃO é revisão médica: o cabeçalho registra
 * `revisaoMedica: pendente` e lista os trechos de conduta farmacológica e de emergência que o
 * Dr. Antônio Felipe precisa conferir. Nada é publicado nem entra no banco.
 *
 * Regras de redação (no prompt): sem dose, número ou estudo inventado ([DOSE A CONFIRMAR],
 * [DADO A CONFIRMAR]); referências = só as consultas PubMed da pauta, a confirmar.
 * O gerador (LLM) é injetado (`gerar`), então tudo é testável sem rede.
 */
const fs = require('fs');
const path = require('path');
const { IDENTIFICACAO_COMPLETA, AVISO_CFM, LINHA_CVV } = require('./conformidadeCfm');
const { RE_NARRATIVA_COMPOSTA } = require('./legendaInstagram');
const { checarHumanizacao, checarEticaCfm } = require('./checagensAprovacao');
const { checarOriginalidade } = require('./originalidade');
const { slugDe } = require('./ideacao');

const PASTA_RASCUNHOS = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM', 'pautas', 'rascunhos');

const AVISO_NARRATIVA_COMPOSTA =
  'Aviso legal: esta crônica é uma narrativa composta. Personagens, falas e situações são fictícios, inspirados em vivências comuns do cuidado em saúde, e não retratam nenhum paciente real identificável (sigilo médico e Res. CFM).';

const MIN_PALAVRAS = { cronica: 350, 'artigo-cientifico': 600 };

const SISTEMA_REDACAO = `Você redige rascunhos para o Portal de Saúde Mental Doutor Antônio Felipe Garabito, em português do Brasil, na voz do Dr. Antônio Felipe (médico de família e comunidade que atua na APS e no Pronto Atendimento Psiquiátrico). O texto é um RASCUNHO para revisão médica.

Regras inegociáveis:
1. Tom acolhedor, empático e terapêutico, falando COM a pessoa ("você", "sua", "vamos"). Frases curtas e claras (média abaixo de 25 palavras). Nunca voz de manual, de chatbot ou burocrática; nunca minimize o sofrimento.
2. Fidelidade: não invente estudos, autores, anos, números, prevalências nem doses. Quando a conduta exigir dose ou dado numérico, escreva [DOSE A CONFIRMAR] ou [DADO A CONFIRMAR]. Não cite referências no corpo: elas são acrescentadas depois a partir das consultas PubMed da pauta.
3. CFM: sem sensacionalismo, sem promessa de cura ou de resultado, sem superlativos, sem "antes e depois". Nunca apresente o autor como psiquiatra nem como especialista em psiquiatria ou saúde mental. Sem diagnóstico ou prescrição a distância: oriente avaliação presencial.
4. Suicídio, autolesão e crise: nunca descreva métodos; oriente procurar ajuda (CVV 188, SAMU 192).
5. Evite: "No mundo de hoje", "Em suma", "Vale ressaltar", "Desvendar", "Mergulhar", listas de três adjetivos e travessões em excesso.
6. Não escreva a assinatura do médico, o aviso do CFM nem a linha do CVV: são acrescentados por código.

Artigo científico: as três seções — Guia Prático, Fisiopatologia e Manejo Clínico — em Markdown (parágrafos curtos e listas), além de "introducao" e "pontosChave" (3 a 5). Base em consenso e diretrizes, sem inventar dados. Manejo Clínico: condutas de primeira linha, sinais de gravidade, quando e como encaminhar; medicamentos apenas por classe e princípio, com [DOSE A CONFIRMAR].
Crônica: narrativa composta (personagens e situações fictícios inspirados em vivências comuns), sem paciente real identificável, sem sensacionalismo, cena concreta, voz humana e sensível, com um fecho que acolhe. Declare "narrativa composta" no próprio texto, no início.`;

const t = { type: 'string' };
const SCHEMA_ARTIGO = {
  type: 'object',
  properties: {
    resumo: { ...t, description: 'até 200 caracteres, acolhedor, sem promessa' },
    introducao: t,
    guiaPratico: { ...t, description: 'Markdown: passos práticos, o que observar, o que fazer' },
    fisiopatologia: { ...t, description: 'Markdown: mecanismos explicados em linguagem clara' },
    manejoClinico: { ...t, description: 'Markdown: condutas, sinais de gravidade, quando encaminhar; fármacos por classe, com [DOSE A CONFIRMAR]' },
    pontosChave: { type: 'array', items: t },
  },
  required: ['resumo', 'introducao', 'guiaPratico', 'fisiopatologia', 'manejoClinico', 'pontosChave'],
};
const SCHEMA_CRONICA = {
  type: 'object',
  properties: {
    resumo: { ...t, description: 'até 200 caracteres' },
    texto: { ...t, description: 'Markdown: a crônica, em parágrafos, declarando "narrativa composta" no início' },
  },
  required: ['resumo', 'texto'],
};

const contarPalavras = (s) => String(s).split(/\s+/).filter((p) => /[\p{L}\d]/u.test(p)).length;

// Trechos que o médico precisa conferir: conduta farmacológica e protocolo de emergência.
const RE_FARMACO = /\b(medicament|f[aá]rmac|antidepressiv|ansiol[ií]tic|benzodiazep|antipsic[oó]tic|estabilizador|litio|l[ií]tio|isrs|isrsn|imao|haloperidol|prometazina|clonazepam|diazepam|sertralina|fluoxetina|dose|mg\b|prescri)/i;
const RE_EMERGENCIA = /\b(emerg[eê]ncia|urg[eê]ncia|samu|risco (?:imediato|de suic[ií]dio)|agita[cç][aã]o|s[ií]ndrome (?:serotonin|neurol[eé]ptica)|intoxica|contenç[aã]o|gravidade|encaminh)/i;

function trechosParaRevisaoMedica(md, tipo = 'artigo-cientifico') {
  return md
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && (RE_FARMACO.test(l) || (tipo !== 'cronica' && RE_EMERGENCIA.test(l))))
    .map((l) => (l.length > 160 ? `${l.slice(0, 157)}…` : l));
}

function montarCorpo(pauta, d) {
  if (pauta.tipo === 'cronica') {
    return [d.texto.trim()].join('\n');
  }
  const l = [d.introducao.trim(), '', '## Guia Prático', '', d.guiaPratico.trim(), '', '## Fisiopatologia', '', d.fisiopatologia.trim(), '', '## Manejo Clínico', '', d.manejoClinico.trim()];
  if (d.pontosChave?.length) l.push('', '## Pontos-chave', '', ...d.pontosChave.map((p) => `- ${p}`));
  return l.join('\n');
}

function montarReferencias(pauta) {
  const refs = pauta.referencias || [];
  if (!refs.length) return '';
  return [
    '## Referências (a confirmar)',
    '',
    '> Consultas PubMed/MEDLINE sugeridas na pauta. Nenhuma referência foi verificada: o médico confere e substitui pelas citações reais (PMID/DOI) antes de publicar.',
    '',
    ...refs.map((r, i) => `${i + 1}. \`${r.consultaPubMed}\` — ${r.tipoDeEstudo} — ${r.pmid || '[PMID A CONFIRMAR]'}`),
  ].join('\n');
}

/** Documento completo (o que vai para o arquivo e o que é checado). */
function montarDocumento(pauta, d, { slug, checagens = null, geradoEm = new Date() } = {}) {
  const corpo = montarCorpo(pauta, d);
  const rodape = [
    pauta.tipo === 'cronica' ? AVISO_NARRATIVA_COMPOSTA : null,
    LINHA_CVV,
    IDENTIFICACAO_COMPLETA,
    AVISO_CFM,
  ].filter(Boolean).join('\n\n');
  const revisar = trechosParaRevisaoMedica(corpo, pauta.tipo);
  const cab = [
    '---',
    `pautaId: ${pauta.id}`,
    `slug: ${slug}`,
    `titulo: ${JSON.stringify(pauta.titulo)}`,
    `categoria: ${JSON.stringify(pauta.categoria || '')}`,
    `tipo: ${pauta.tipo}`,
    `status: rascunho`,
    `geradoEm: ${geradoEm.toISOString()}`,
    `checagensAutomaticas: ${checagens ? (checagens.aprovado ? 'aprovado (humanização, ética/CFM, originalidade)' : `reprovado — ${checagens.motivo}`) : 'não executadas'}`,
    `revisaoMedica: pendente`,
    '---',
  ].join('\n');
  const aviso = [
    '> **RASCUNHO — não publicar sem revisão do Dr. Antônio Felipe.** Passar nas checagens automáticas não valida o conteúdo clínico.',
    revisar.length ? `> Trechos de conduta farmacológica e de emergência a conferir (${revisar.length}):` : null,
    ...revisar.map((x) => `> - ${x}`),
  ].filter(Boolean).join('\n');
  const partes = [cab, '', `# ${pauta.titulo}`, '', `*${d.resumo.trim()}*`, '', aviso, '', pauta.tipo === 'cronica' ? `> ${AVISO_NARRATIVA_COMPOSTA}\n` : '', corpo, '', montarReferencias(pauta), '', '---', '', rodape, ''];
  return partes.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n');
}

/** As 3 checagens sobre o documento montado. */
async function checarRascunho(pauta, d, doc, { acervo = [], outros = [] } = {}) {
  const falhas = [];
  const corpo = montarCorpo(pauta, d);

  // Estrutura mínima
  if (contarPalavras(corpo) < MIN_PALAVRAS[pauta.tipo]) falhas.push(`estrutura: texto curto (${contarPalavras(corpo)} palavras; mínimo ${MIN_PALAVRAS[pauta.tipo]})`);
  if (pauta.tipo === 'artigo-cientifico') {
    for (const s of ['## Guia Prático', '## Fisiopatologia', '## Manejo Clínico']) if (!doc.includes(s)) falhas.push(`estrutura: falta a seção "${s.slice(3)}"`);
  } else if (!RE_NARRATIVA_COMPOSTA.test(corpo)) {
    falhas.push('CFM: a crônica precisa declarar "narrativa composta" no próprio texto');
  }

  // 1) Humanização e empatia (sobre o corpo escrito pelo modelo)
  const humanizacao = checarHumanizacao(`${d.resumo}. ${corpo}`);
  // 2) Ética médica / CFM (documento completo: 5 linhas, CRM, RQE, CVV e aviso de narrativa composta)
  const etica = checarEticaCfm(doc, { contexto: 'portal', sensivel: pauta.sensivel ? true : undefined });
  if (pauta.tipo === 'cronica' && !doc.includes(AVISO_NARRATIVA_COMPOSTA)) etica.falhas.push('falta o aviso legal de narrativa composta');
  if (!doc.includes(AVISO_CFM)) etica.falhas.push('falta o aviso da Res. CFM 2.454/2026');
  // 3) Originalidade: título + resumo + texto contra o acervo do banco e os outros rascunhos
  const orig = checarOriginalidade({ titulo: pauta.titulo, resumo: `${d.resumo} ${corpo.slice(0, 600)}`, categoria: pauta.categoria }, [...acervo, ...outros]);

  const todas = [...falhas, ...humanizacao.falhas.map((f) => `humanização: ${f}`), ...etica.falhas.map((f) => `ética/CFM: ${f}`), ...(orig.ok ? [] : orig.motivos.map((f) => `originalidade: ${f}`))];
  return {
    aprovado: todas.length === 0,
    motivo: todas.join('; '),
    humanizacao: humanizacao.ok,
    etica: etica.ok && !etica.falhas.length,
    originalidade: orig.ok,
    maisProximo: orig.maisProximo,
    falhas: todas,
  };
}

/**
 * Gera o rascunho de uma pauta, com até `tentativas` rodadas: as falhas das checagens voltam ao modelo.
 * @param {object} pauta registro de PAUTAS
 * @param {{gerar: Function, acervo?: object[], outros?: object[], tentativas?: number, slugsUsados?: Set<string>}} o
 * @returns {Promise<{ok: boolean, slug: string, md: string, checagens: object, tentativas: number}>}
 */
async function gerarRascunho(pauta, { gerar, acervo = [], outros = [], tentativas = 3, slugsUsados = new Set(), agora = new Date() }) {
  let slug = slugDe(pauta.titulo);
  for (let n = 2; slugsUsados.has(slug); n++) slug = `${slugDe(pauta.titulo)}-${n}`;
  const schema = pauta.tipo === 'cronica' ? SCHEMA_CRONICA : SCHEMA_ARTIGO;
  let ultimo = null;
  let feedback = '';
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const usuario = [
      `Redija o rascunho ${pauta.tipo === 'cronica' ? 'da crônica' : 'do artigo'} "${pauta.titulo}".`,
      `Pauta: ${pauta.pauta}`,
      `Público: ${pauta.publicoAlvo}. Ângulo: ${pauta.angulo}.${pauta.sensivel ? ' Tema sensível: acolha e oriente ajuda (CVV 188, SAMU 192), sem descrever métodos.' : ''}`,
      pauta.tipo === 'cronica'
        ? `Extensão: 550 a 800 palavras (mínimo absoluto de 500). Categoria: ${pauta.categoria}.`
        : `Extensão: 900 a 1.300 palavras somando as três seções (mínimo absoluto de 800; textos mais curtos são reprovados). Categoria: ${pauta.categoria}.`,
      feedback ? `A tentativa anterior foi REPROVADA nas checagens automáticas. Corrija: ${feedback}` : '',
    ].filter(Boolean).join('\n');
    const d = await gerar({ sistema: SISTEMA_REDACAO, usuario, schema });
    const doc = montarDocumento(pauta, d, { slug, geradoEm: agora });
    const checagens = await checarRascunho(pauta, d, doc, { acervo, outros });
    const md = montarDocumento(pauta, d, { slug, checagens, geradoEm: agora });
    ultimo = { ok: checagens.aprovado, slug, md, checagens, tentativas: tentativa, resumo: d.resumo };
    if (checagens.aprovado) return ultimo;
    feedback = checagens.falhas.slice(0, 8).join(' | ');
  }
  return ultimo;
}

function gravarRascunho(slug, md, pasta = PASTA_RASCUNHOS) {
  fs.mkdirSync(pasta, { recursive: true });
  const arquivo = path.join(pasta, `${slug}.md`);
  fs.writeFileSync(arquivo, md);
  return arquivo;
}

module.exports = { gerarRascunho, gravarRascunho, checarRascunho, montarDocumento, montarCorpo, trechosParaRevisaoMedica, SISTEMA_REDACAO, SCHEMA_ARTIGO, SCHEMA_CRONICA, AVISO_NARRATIVA_COMPOSTA, PASTA_RASCUNHOS };
