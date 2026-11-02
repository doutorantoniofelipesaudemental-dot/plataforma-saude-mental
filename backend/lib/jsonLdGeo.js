/**
 * JSON-LD para GEO/E-E-A-T (frente 2, 30/10/2026). Funções puras: não leem nem gravam nada.
 * Regras: MedicalWebPage + Article sempre; FAQPage só se o texto tiver FAQ real;
 * reviewedBy só com revisão aprovada e com o hash atual (via revisaoMedica.estadoRevisao).
 * Não substitui o JSON-LD de backend/lib/renderizarArtigo.js (integração proposta em relatorios/geo).
 */
const { estadoRevisao } = require('./revisaoMedica');

const BASE_URL = 'https://www.drantoniofelipemedico.com.br';
const NOME_PORTAL = 'Portal de Saúde Mental Doutor Antônio Felipe Garabito';

function textoLimpo(trecho) {
  return String(trecho || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai pares pergunta/resposta só da seção "Perguntas frequentes" (h2), até o próximo h2.
// Pergunta = h3 terminado em "?"; resposta = primeiro <p> logo após. Sem seção = [].
function extrairFaq(html) {
  const src = String(html || '');
  const inicio = src.search(/<h2[^>]*>[^<]*perguntas frequentes[^<]*<\/h2>/i);
  if (inicio < 0) return [];
  let secao = src.slice(inicio);
  const fim = secao.slice(1).search(/<h2[\s>]/i);
  if (fim >= 0) secao = secao.slice(0, fim + 1);
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  const pares = [];
  let m;
  while ((m = re.exec(secao))) {
    const pergunta = textoLimpo(m[1]);
    const resposta = textoLimpo(m[2]);
    if (pergunta.endsWith('?') && resposta) pares.push({ pergunta, resposta });
  }
  return pares;
}

function montarNoFaq(pares, urlBase) {
  return {
    '@type': 'FAQPage',
    '@id': `${urlBase}#faq`,
    mainEntity: pares.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  };
}

// Monta o grafo. `registroRevisao` = registro de aprovarRevisao (ou null); `hashAtual` = hash do texto atual.
function montarJsonLdArtigo({ artigo, url, registroRevisao = null, hashAtual = null }) {
  if (!artigo || !artigo.titulo || !artigo.slug) throw new Error('montarJsonLdArtigo exige artigo com titulo e slug');
  const pagina = url || `${BASE_URL}/artigo/${encodeURIComponent(artigo.slug)}`;
  const idPagina = `${pagina}#webpage`;
  const idArtigo = `${pagina}#article`;
  const idAutor = `${BASE_URL}/sobre#autor`;
  const idOrg = `${BASE_URL}#organizacao`;
  const modificado = artigo.atualizadoEm || artigo.publicadoEm;
  const revisao = estadoRevisao({ registro: registroRevisao, hashAtual });

  const noPagina = {
    '@type': 'MedicalWebPage',
    '@id': idPagina,
    url: pagina,
    name: artigo.titulo,
    description: artigo.resumo,
    inLanguage: 'pt-BR',
    datePublished: artigo.publicadoEm,
    dateModified: modificado,
    about: { '@id': idArtigo },
    isPartOf: { '@id': idOrg },
  };
  if (revisao.valido) {
    noPagina.lastReviewed = registroRevisao.aprovadoEm;
    noPagina.reviewedBy = { '@type': 'Person', name: registroRevisao.revisor };
  }

  const artigoNo = {
    '@type': 'Article',
    '@id': idArtigo,
    headline: artigo.titulo,
    description: artigo.resumo,
    url: pagina,
    mainEntityOfPage: { '@id': idPagina },
    inLanguage: 'pt-BR',
    datePublished: artigo.publicadoEm,
    dateModified: modificado,
    author: { '@id': idAutor },
    publisher: { '@id': idOrg },
  };
  if (artigo.imagemCapa) artigoNo.image = artigo.imagemCapa;

  const grafo = [
    noPagina,
    artigoNo,
    {
      '@type': 'Person',
      '@id': idAutor,
      name: 'Dr. Antônio Felipe',
      jobTitle: 'Médico',
      url: `${BASE_URL}/sobre`,
      identifier: [
        { '@type': 'PropertyValue', name: 'CRM-BA', value: '41322' },
        { '@type': 'PropertyValue', name: 'RQE', value: '26638', description: 'Medicina de Família e Comunidade' },
      ],
      // Especialidade ligada ao RQE (credencial de especialista registrada no CRM-BA).
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: 'Medicina de Família e Comunidade',
        credentialCategory: 'Especialista (RQE)',
        identifier: '26638',
        recognizedBy: { '@type': 'Organization', name: 'Conselho Regional de Medicina da Bahia (CRM-BA)' },
      },
    },
    { '@type': 'Organization', '@id': idOrg, name: NOME_PORTAL, url: BASE_URL },
  ];

  const faq = extrairFaq(artigo.conteudo);
  if (faq.length) grafo.push(montarNoFaq(faq, pagina));

  return { '@context': 'https://schema.org', '@graph': grafo };
}

// Serializa para <script type="application/ld+json">: escapa "</" para o texto não fechar a tag.
function serializarJsonLd(obj) {
  return JSON.stringify(obj).replace(/<\//g, '<\\/');
}

// Validação de campos obrigatórios. Devolve lista de erros (vazia = válido).
function validarJsonLd(obj) {
  const erros = [];
  if (!obj || obj['@context'] !== 'https://schema.org') erros.push('@context deve ser https://schema.org');
  if (!obj || !Array.isArray(obj['@graph'])) return [...erros, '@graph ausente ou não é lista'];
  const porTipo = (t) => obj['@graph'].filter((n) => n['@type'] === t);
  const exigir = (no, campos, rotulo) => campos.forEach((c) => { if (no[c] === undefined || no[c] === '') erros.push(`${rotulo} sem ${c}`); });

  const paginas = porTipo('MedicalWebPage');
  const artigos = porTipo('Article');
  if (paginas.length !== 1) erros.push('deve haver exatamente 1 MedicalWebPage');
  if (artigos.length !== 1) erros.push('deve haver exatamente 1 Article');
  paginas.forEach((p) => exigir(p, ['url', 'name', 'datePublished', 'inLanguage'], 'MedicalWebPage'));
  artigos.forEach((a) => {
    exigir(a, ['headline', 'datePublished', 'author', 'publisher', 'mainEntityOfPage'], 'Article');
    if (a.author && !obj['@graph'].some((n) => n['@id'] === a.author['@id'])) erros.push('author aponta para nó inexistente');
  });
  porTipo('FAQPage').forEach((f) => {
    if (!Array.isArray(f.mainEntity) || f.mainEntity.length === 0) erros.push('FAQPage sem perguntas');
    (f.mainEntity || []).forEach((q) => {
      exigir(q, ['name'], 'Question');
      if (!q.acceptedAnswer || !q.acceptedAnswer.text) erros.push('Question sem acceptedAnswer.text');
    });
  });
  porTipo('MedicalWebPage').forEach((p) => {
    if (p.reviewedBy && !p.reviewedBy.name) erros.push('reviewedBy sem name');
  });
  porTipo('Person').forEach((pessoa) => {
    const temRqe = (pessoa.identifier || []).some((i) => i.name === 'RQE');
    const credenciais = [].concat(pessoa.hasCredential || []);
    if (temRqe && !credenciais.some((c) => c['@type'] === 'EducationalOccupationalCredential' && c.name && c.identifier)) {
      erros.push('Person com RQE sem hasCredential de especialidade');
    }
  });
  return erros;
}

module.exports = { montarJsonLdArtigo, serializarJsonLd, validarJsonLd, extrairFaq, BASE_URL };
