/**
 * Ideação editorial: o assistente PROPÕE títulos e pautas (artigos médicos
 * "scientific-grade" baseados em PubMed/MEDLINE e crônicas literárias) e o Dr.
 * Antônio Felipe APROVA ou rejeita antes de qualquer redação. Também registra
 * demandas diretas do médico. Nada aqui publica ou escreve artigo: só guarda
 * propostas em CONTEUDO_INSTAGRAM/pautas/*.json (status: proposta → aprovada|rejeitada).
 *
 * A partir do artigo aprovado e publicado, `npm run bot:gerar-posts` deriva o
 * ecossistema omnichannel (carrossel 4:5, legenda de 3 linhas, Reels/vídeo
 * narrado com trilha a -22 dB, áudio-podcast, miniapp, newsletter); o PWA é o
 * próprio site (public/manifest.webmanifest + sw.js).
 *
 * Funções puras (sem rede/LLM) para o teste; o LLM entra só em scripts/bot-ideacao.js.
 */
const fs = require('fs');
const path = require('path');
const { checarHumanizacao, checarEticaCfm } = require('./checagensAprovacao');
const { checarOriginalidade } = require('./originalidade');

const PASTA_PAUTAS = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM', 'pautas');

const TIPOS = ['artigo-cientifico', 'cronica'];
// Estrutura obrigatória do artigo médico scientific-grade.
const SECOES_ARTIGO = ['Guia Prático', 'Fisiopatologia', 'Manejo Clínico', 'Referências'];

const SISTEMA_IDEACAO = `Você é o assistente editorial do Portal de Saúde Mental Doutor Antônio Felipe Garabito. Você PROPÕE pautas; quem decide é o Dr. Antônio Felipe (médico de família e comunidade, CRM-BA 41322, RQE 26638). Nada é escrito antes da aprovação dele. Português do Brasil.

Dois tipos de pauta:
1. "artigo-cientifico": artigo médico de nível científico, com as seções Guia Prático, Fisiopatologia, Manejo Clínico e Referências, fundamentado em literatura indexada no PubMed/MEDLINE (revisões sistemáticas, metanálises, ensaios clínicos, diretrizes). Para cada pauta traga de 3 a 6 "referencias": a consulta de busca no PubMed (com termos MeSH quando houver) e o tipo de estudo esperado. NUNCA invente PMID, DOI, autor, ano nem número: se não tiver certeza, escreva "[PMID A CONFIRMAR]". O médico confere cada referência antes de publicar.
2. "cronica": crônica literária humanizada (narrativa composta, sem paciente real identificável, declarada como tal), com o aviso legal do CFM. Sem referências obrigatórias.

Regras: sem sensacionalismo nem promessa de cura; nunca apresente o médico como psiquiatra nem como especialista em psiquiatria/saúde mental; tema de suicídio, autolesão e crise leva CVV 188 e SAMU 192 e nunca descreve métodos; tom acolhedor, empático e terapêutico, falando com a pessoa; título honesto, com até 90 caracteres, sem caça-clique; evite repetir pautas já publicadas (lista fornecida). Cada pauta traz: titulo, tipo, pauta (2 a 4 frases: o que o texto entrega e por que importa agora), publicoAlvo, angulo (o diferencial em relação ao que já existe), sensivel (true/false) e, no artigo científico, referencias.`;

const t = { type: 'string' };
const SCHEMA_IDEACAO = {
  type: 'object',
  properties: {
    propostas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: TIPOS },
          titulo: t,
          pauta: t,
          publicoAlvo: t,
          angulo: t,
          sensivel: { type: 'boolean' },
          referencias: {
            type: 'array',
            items: { type: 'object', properties: { consultaPubMed: t, tipoDeEstudo: t, pmid: { ...t, description: 'só se tiver certeza; senão "[PMID A CONFIRMAR]"' } }, required: ['consultaPubMed', 'tipoDeEstudo'] },
          },
        },
        required: ['tipo', 'titulo', 'pauta', 'publicoAlvo', 'angulo', 'sensivel'],
      },
    },
  },
  required: ['propostas'],
};

// Grupos editoriais (nomes iguais aos de METAS_EDITORIAL.json) e como cada um é pedido ao LLM.
const GRUPOS = {
  'Relatos da Prática': {
    tipo: 'cronica',
    instrucao: 'crônicas e relatos de experiência do dia a dia na Atenção Primária (APS) e no Pronto Atendimento Psiquiátrico (PA). TODAS em narrativa composta: personagens e situações fictícios inspirados em vivências comuns, sem paciente real identificável — diga isso explicitamente em "pauta" (a expressão "narrativa composta" deve aparecer) e informe que o texto final leva o aviso legal do CFM. Voz humana, sensível, sem sensacionalismo; tipo "cronica", sem referências.',
  },
  'Residentes & Estudantes': {
    tipo: 'artigo-cientifico',
    instrucao: 'guias de conduta e raciocínio clínico para residentes e estudantes na UBS e no Pronto Atendimento (avaliação inicial, diagnóstico diferencial, sinais de gravidade, manejo na primeira linha, quando e como encaminhar). Tipo "artigo-cientifico", com 3 a 6 consultas PubMed em "referencias".',
  },
  'Linhas de Cuidado (Cuidadores & Professores)': {
    tipo: 'artigo-cientifico',
    instrucao: 'suporte a cuidadores familiares (de idosos, de pessoas com transtorno mental ou deficiência) e a professores (sobrecarga, sinais de esgotamento, como acolher e onde buscar ajuda). Psicoeducação em linguagem acessível, com base em literatura; tipo "artigo-cientifico", com 3 a 6 consultas PubMed em "referencias". Deixe claro no "publicoAlvo" se a pauta é para cuidadores ou para professores.',
  },
  'Condições Específicas': {
    tipo: 'artigo-cientifico',
    instrucao: 'artigos científicos e guias clínicos focados no diagnóstico, estadiamento e manejo prático de transtornos psiquiátricos específicos (ex.: TDAH no adulto, transtornos de ansiedade, depressão resistente, somatizações, transtornos de humor) na Atenção Primária e no ambulatório, com condutas baseadas em evidências. Tipo "artigo-cientifico", com 3 a 6 consultas PubMed em "referencias".',
  },
  'Empresas & RH': {
    tipo: 'artigo-cientifico',
    instrucao: 'artigos orientados à saúde mental ocupacional e à medicina do trabalho: prevenção de burnout, gestão do estresse corporativo, nexo causal, emissão de CAT, readaptação de funções e estratégias de bem-estar psíquico no ambiente de trabalho. Tipo "artigo-cientifico", com 3 a 6 consultas PubMed em "referencias" (e, quando couber, a base normativa, sem inventar número de lei ou norma).',
  },
  'Pacientes & Famílias': {
    tipo: 'artigo-cientifico',
    instrucao: 'psicoeducação em saúde mental para pacientes e famílias (o que é, sinais, o que ajuda, quando procurar atendimento), em linguagem acolhedora e acessível, sem diagnóstico a distância. Tipo "artigo-cientifico", com 3 a 6 consultas PubMed em "referencias".',
  },
};

// Lotes prontos. Cada grupo tem `quantidade` de pautas VÁLIDAS (originais) e, opcionalmente,
// `temas`: assuntos pedidos pelo médico, cada um gerado por uma chamada dirigida (e reposto se a
// trava de originalidade rejeitar). Forma antiga [grupo, quantidade] também é aceita.
const TEMA_RELATO_MIGRANTES = 'Saúde mental de migrantes e expatriados: crônica reflexiva em narrativa composta sobre o acolhimento na APS e a barreira do idioma e da cultura';
const TEMA_GUIA_ULISSES = 'Saúde mental de migrantes e expatriados: guia psicoeducativo sobre a Síndrome de Ulisses e o Luto Migratório';
const TEMA_CUIDADOR_IDOSOS = 'Prevenção da Sobrecarga e Burnout do Cuidador Familiar de Idosos na APS';
const TEMA_PROFESSORES = 'Gestão de Conflitos com Famílias na Inclusão Escolar e Saúde Mental Docente';
const LOTES = {
  1: [
    { grupo: 'Relatos da Prática', quantidade: 11, temas: [TEMA_RELATO_MIGRANTES] },
    { grupo: 'Residentes & Estudantes', quantidade: 5 },
    { grupo: 'Linhas de Cuidado (Cuidadores & Professores)', quantidade: 4, temas: [TEMA_CUIDADOR_IDOSOS, TEMA_PROFESSORES] },
    { grupo: 'Pacientes & Famílias', quantidade: 3, temas: [TEMA_GUIA_ULISSES] },
  ],
  // Lote 2 (20 pautas): reforça as metas mais distantes (Residentes & Estudantes) e abre Condições Específicas.
  2: [
    { grupo: 'Residentes & Estudantes', quantidade: 8 },
    { grupo: 'Relatos da Prática', quantidade: 6 },
    { grupo: 'Condições Específicas', quantidade: 3 },
    { grupo: 'Pacientes & Famílias', quantidade: 3 },
  ],
};

/** Normaliza o plano de um lote para [{ grupo, quantidade, temas }]. */
const normalizarPlano = (plano) => plano.map((x) => (Array.isArray(x) ? { grupo: x[0], quantidade: x[1], temas: [] } : { temas: [], ...x }));

const slugDe = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** O que reprova uma proposta antes de chegar ao médico (estrutura, CFM, tom). */
function problemasDaProposta(p) {
  const falhas = [];
  if (!TIPOS.includes(p.tipo)) falhas.push(`tipo inválido "${p.tipo}"`);
  // Limite de 90 caracteres; o médico pode autorizar um título mais longo numa pauta (tituloLongoAutorizado), até 180 (limite do modelo Artigo).
  if (!p.titulo || p.titulo.length > (p.tituloLongoAutorizado ? 180 : 90)) falhas.push(`título ausente ou com mais de ${p.tituloLongoAutorizado ? 180 : 90} caracteres`);
  if (!p.pauta || p.pauta.length < 60) falhas.push('pauta curta demais (mínimo 60 caracteres)');
  if (p.tipo === 'artigo-cientifico') {
    const refs = p.referencias || [];
    if (refs.length < 3) falhas.push('artigo científico exige de 3 a 6 referências (consultas PubMed)');
    if (refs.some((r) => r.pmid && !/^\d{6,9}$|A CONFIRMAR/.test(String(r.pmid).trim()))) falhas.push('PMID em formato inválido (use o número ou "[PMID A CONFIRMAR]")');
  }
  if (p.tipo === 'cronica' && !/narrativa composta/i.test(`${p.pauta} ${p.angulo || ''}`)) {
    falhas.push('crônica sem o aviso de narrativa composta na pauta (personagens fictícios, sem paciente real identificável)');
  }
  const texto = `${p.titulo}. ${p.pauta} ${p.angulo || ''}`;
  falhas.push(...checarEticaCfm(texto, { contexto: 'portal', sensivel: false, exigirIdentificacao: false }).falhas);
  // Pautas são curtas: só reprova voz fria/invalidante; o mínimo de acolhimento vale para o texto final.
  falhas.push(...checarHumanizacao(texto).falhas.filter((f) => /^(tom frio|linguagem invalidante)/.test(f)));
  return falhas;
}

/** Normaliza a saída do LLM em registros de pauta com id, origem e status. */
function criarPropostas(propostas, { origem = 'assistente', publicados = [], acervo = [], existentes = [], acervoIndisponivel = false, agora = new Date(), categoria = null, lote = null, deslocamento = 0, extra = {} } = {}) {
  const jaTem = new Set(publicados.map((x) => slugDe(x)));
  const data = agora.toISOString().slice(0, 10);
  // Base de comparação: artigos publicados (com resumo/categoria/tags), títulos avulsos, pautas já registradas
  // (as rejeitadas pelo médico ficam de fora) e as pautas anteriores deste mesmo lote.
  const base = [...acervo, ...publicados.map((titulo) => ({ titulo })), ...existentes.filter((r) => r.status !== 'rejeitada')];
  const criadas = [];
  propostas.forEach((p, i) => {
    const problemas = problemasDaProposta(p);
    if (jaTem.has(slugDe(p.titulo))) problemas.push('título já publicado');
    // Originalidade: título, pauta/resumo, categoria e temas contra o acervo.
    const candidato = { titulo: p.titulo, pauta: p.pauta, categoria: categoria || p.categoria };
    const orig = checarOriginalidade(candidato, [...base, ...criadas]);
    if (!orig.ok) problemas.push(`originalidade: ${orig.motivos[0]}`);
    if (acervoIndisponivel) problemas.push('originalidade NÃO verificada (acervo do banco indisponível) — refaça a checagem antes de aprovar');
    criadas.push({
      id: `${data}-${String(i + 1 + deslocamento).padStart(2, '0')}-${slugDe(p.titulo).slice(0, 30)}`,
      ...p,
      ...(categoria && { categoria }),
      ...(lote && { lote }),
      ...extra,
      secoes: p.tipo === 'artigo-cientifico' ? SECOES_ARTIGO : undefined,
      origem,
      // Cópia, paráfrase ou redundância: rejeitada automaticamente (fica registrada, mas não pode ser aprovada).
      status: orig.ok ? 'proposta' : 'rejeitada',
      ...(orig.ok ? {} : { rejeicaoAutomatica: 'originalidade' }),
      originalidade: { veredito: orig.veredito, maisProximo: orig.maisProximo },
      problemas,
      criadaEm: agora.toISOString(),
    });
  });
  return criadas;
}

/** Demanda direta do médico: vira uma pauta com o pedido dele preservado. */
function criarDemanda(pedido, { tipo = 'artigo-cientifico', agora = new Date() } = {}) {
  const titulo = String(pedido).trim().replace(/\s+/g, ' ').slice(0, 90);
  return criarPropostas([{ tipo, titulo, pauta: `Demanda do Dr. Antônio Felipe: ${String(pedido).trim()}`, publicoAlvo: 'a definir com o médico', angulo: 'a definir com o médico', sensivel: false }], { origem: 'demanda-medico', agora })[0];
}

/**
 * Refaz a checagem de originalidade das pautas ainda em "proposta" contra o acervo e as pautas
 * anteriores (não rejeitadas). Cópia/paráfrase/redundância → rejeitada automaticamente.
 * Devolve as pautas alteradas.
 */
function reverificarOriginalidade(registros, acervo) {
  const alteradas = [];
  const vistas = [];
  for (const r of registros) {
    if (r.status === 'proposta') {
      const orig = checarOriginalidade({ titulo: r.titulo, pauta: r.pauta, categoria: r.categoria }, [...acervo, ...vistas]);
      r.originalidade = { veredito: orig.veredito, maisProximo: orig.maisProximo };
      const semAntiga = (r.problemas || []).filter((x) => !/^originalidade/.test(x));
      if (!orig.ok) {
        r.status = 'rejeitada';
        r.rejeicaoAutomatica = 'originalidade';
        semAntiga.push(`originalidade: ${orig.motivos[0]}`);
        alteradas.push(r);
      }
      r.problemas = semAntiga;
    }
    if (r.status !== 'rejeitada') vistas.push({ titulo: r.titulo, pauta: r.pauta, categoria: r.categoria });
  }
  return alteradas;
}

/**
 * Marca a pauta APROVADA como "redigida": existe rascunho em Markdown, vinculado ao id/slug, que passou
 * nas 3 checagens automáticas. Não significa revisão médica: `revisaoMedica` fica "pendente".
 */
function marcarRedigida(registros, id, { arquivo, slug, checagens, agora = new Date() }) {
  const r = registros.find((x) => x.id === id);
  if (!r) throw new Error(`pauta "${id}" não encontrada`);
  if (r.status !== 'aprovada') throw new Error(`só pauta aprovada vira redigida (status atual: ${r.status})`);
  if (!checagens?.aprovado) throw new Error('o rascunho não passou nas checagens automáticas');
  r.status = 'redigida';
  r.rascunho = { arquivo, slug, geradoEm: agora.toISOString(), revisaoMedica: 'pendente', checagens: { humanizacao: checagens.humanizacao, etica: checagens.etica, originalidade: checagens.originalidade } };
  r.redigidaEm = agora.toISOString();
  return r;
}

const SISTEMA_REFERENCIAS = 'Você é bibliotecário científico de um portal de saúde mental. Para a pauta dada, proponha de 3 a 6 CONSULTAS DE BUSCA no PubMed/MEDLINE (termos MeSH quando houver, em inglês) e o tipo de estudo esperado (revisão sistemática, metanálise, ensaio clínico randomizado, diretriz). NUNCA invente PMID, DOI, autor, ano nem número: devolva só as consultas.';
const SCHEMA_REFERENCIAS = {
  type: 'object',
  properties: { referencias: { type: 'array', items: { type: 'object', properties: { consultaPubMed: { type: 'string' }, tipoDeEstudo: { type: 'string' } }, required: ['consultaPubMed', 'tipoDeEstudo'] } } },
  required: ['referencias'],
};

/**
 * Artigos científicos sem as 3 consultas PubMed mínimas (o modelo às vezes as omite quando gera muitas pautas
 * de uma vez) recebem uma chamada curta só para as referências; depois os problemas são recalculados.
 * `gerar({sistema, usuario, schema})` devolve o JSON. Devolve as pautas corrigidas.
 */
async function completarReferencias(registros, gerar) {
  const corrigidas = [];
  for (const r of registros) {
    if (r.tipo !== 'artigo-cientifico' || !['proposta', 'aprovada'].includes(r.status) || (r.referencias || []).length >= 3) continue;
    const d = await gerar({ sistema: SISTEMA_REFERENCIAS, usuario: `Pauta: "${r.titulo}". ${r.pauta}
Público: ${r.publicoAlvo}. Ângulo: ${r.angulo}.`, schema: SCHEMA_REFERENCIAS });
    const refs = (d.referencias || []).filter((x) => x.consultaPubMed && x.tipoDeEstudo).slice(0, 6);
    if (refs.length < 3) continue;
    r.referencias = refs;
    // Mantém os problemas de originalidade; refaz os demais (estrutura, CFM, tom).
    const mantidos = (r.problemas || []).filter((x) => /^originalidade|^título já publicado/.test(x));
    r.problemas = [...problemasDaProposta(r), ...mantidos];
    corrigidas.push(r);
  }
  return corrigidas;
}

function mudarStatus(registros, id, status, { agora = new Date(), por = 'Dr. Antônio Felipe' } = {}) {
  const r = registros.find((x) => x.id === id);
  if (!r) throw new Error(`pauta "${id}" não encontrada`);
  if (status === 'aprovada' && r.problemas?.length) throw new Error(`pauta com ${r.problemas.length} problema(s) — corrija antes de aprovar: ${r.problemas.join('; ')}`);
  r.status = status;
  r[status === 'aprovada' ? 'aprovadaEm' : 'rejeitadaEm'] = agora.toISOString();
  r.decididaPor = por;
  return r;
}

function renderizarMd(registros) {
  const l = ['# Pautas para aprovação do Dr. Antônio Felipe', '', '> Nada é redigido antes da aprovação. `npm run bot:ideacao -- --aprovar=<id>` ou `--rejeitar=<id>`.', ''];
  // Resumo por categoria e status, para conferir o lote de relance.
  const cats = [...new Set(registros.map((r) => r.categoria || 'Sem categoria'))];
  l.push('| Categoria | Propostas | Aprovadas | Redigidas | Rejeitadas | Com problemas |', '|---|---:|---:|---:|---:|---:|');
  for (const c of cats) {
    const g = registros.filter((r) => (r.categoria || 'Sem categoria') === c);
    const n = (s) => g.filter((r) => r.status === s).length;
    l.push(`| ${c} | ${n('proposta')} | ${n('aprovada')} | ${n('redigida')} | ${n('rejeitada')} | ${g.filter((r) => r.problemas?.length).length} |`);
  }
  l.push(`| **Total** | ${registros.filter((r) => r.status === 'proposta').length} | ${registros.filter((r) => r.status === 'aprovada').length} | ${registros.filter((r) => r.status === 'redigida').length} | ${registros.filter((r) => r.status === 'rejeitada').length} | ${registros.filter((r) => r.problemas?.length).length} |`, '');
  for (const r of registros) {
    l.push(`## [${r.status}] ${r.titulo}`, '', `- **id:** ${r.id}`, ...(r.categoria ? [`- **categoria:** ${r.categoria}${r.lote ? ` · lote ${r.lote}` : ''}`] : []), `- **tipo:** ${r.tipo === 'cronica' ? 'crônica literária' : 'artigo médico (PubMed/MEDLINE)'} · **origem:** ${r.origem}`, `- **pauta:** ${r.pauta}`, `- **público:** ${r.publicoAlvo} · **ângulo:** ${r.angulo}`, `- **tema sensível:** ${r.sensivel ? 'sim (CVV 188 obrigatório)' : 'não'}`);
    if (r.secoes) l.push(`- **seções:** ${r.secoes.join(' · ')}`);
    (r.referencias || []).forEach((x) => l.push(`  - PubMed: \`${x.consultaPubMed}\` (${x.tipoDeEstudo}) ${x.pmid || '[PMID A CONFIRMAR]'}`));
    if (r.rascunho) l.push(`- **rascunho:** \`${r.rascunho.arquivo}\` · slug: \`${r.rascunho.slug}\` · pauta: \`${r.id}\``, `- **checagens automáticas:** humanização ${r.rascunho.checagens.humanizacao ? '✓' : '✗'} · ética/CFM ${r.rascunho.checagens.etica ? '✓' : '✗'} · originalidade ${r.rascunho.checagens.originalidade ? '✓' : '✗'} · **revisão médica: ${r.rascunho.revisaoMedica}**`);
    if (r.originalidade?.maisProximo) l.push(`- **originalidade:** ${r.originalidade.veredito} · mais próximo: "${r.originalidade.maisProximo.titulo}" (similaridade ${r.originalidade.maisProximo.score})`);
    if (r.problemas?.length) l.push(`- ⚠️ **problemas:** ${r.problemas.join('; ')}`);
    l.push('');
  }
  return l.join('\n');
}

function lerRegistros(pasta = PASTA_PAUTAS) {
  const arquivo = path.join(pasta, 'pautas.json');
  return fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : [];
}

function gravarRegistros(registros, pasta = PASTA_PAUTAS) {
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'pautas.json'), JSON.stringify(registros, null, 2));
  fs.writeFileSync(path.join(pasta, 'PAUTAS.md'), renderizarMd(registros));
}

module.exports = { completarReferencias, marcarRedigida, normalizarPlano, reverificarOriginalidade, GRUPOS, LOTES, SISTEMA_IDEACAO, SCHEMA_IDEACAO, SECOES_ARTIGO, TIPOS, problemasDaProposta, criarPropostas, criarDemanda, mudarStatus, renderizarMd, lerRegistros, gravarRegistros, slugDe };
