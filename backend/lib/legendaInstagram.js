/**
 * Legenda do feed do Instagram montada a partir do próprio artigo.
 *
 * Todo trecho de texto vem do artigo em frases inteiras — nada é reescrito
 * nem inventado. Isso é o que permite à checagem de conteúdo (checagemRedes.js)
 * provar a fidelidade: cada frase da legenda precisa existir no artigo.
 *
 * Formato (CLAUDE.md, Seção 20-quater):
 *   gancho (1ª linha curta)
 *   2 parágrafos curtos do artigo
 *   chamada (salvar ou compartilhar)
 *   🔗 Artigo completo no link da bio
 *   identificação resumida (Regra 17)
 *   3 a 5 hashtags em português
 *   linha do CVV 188 em tema sensível
 */
const { paraTextoPuro } = require('./carrossel');

const IDENTIFICACAO = 'Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638';
const LINHA_BIO = '🔗 Artigo completo no link da bio';
const LINHA_CVV = 'Se precisar de apoio: CVV 188 (ligação gratuita, 24h) · SAMU 192';
const CHAMADA_SALVAR = 'Salve para ler depois.';
const CHAMADA_COMPARTILHAR = 'Compartilhe com quem precisa.';
const MAX_GANCHO = 125;
const MAX_PARAGRAFO = 320;
// As duas redações usadas nos relatos do site para declarar o caso composto.
const RE_NARRATIVA_COMPOSTA = /narrativa composta|composi[cç][aã]o constru[ií]da a partir de padr[oõ]es/i;

// Tema sensível exige CVV 188 (comunicação segura — OMS/OPAS). Lista ampla de
// propósito: na dúvida, a linha de apoio entra.
const RE_TEMA_SENSIVEL =
  /ansiedad|ansios|depress|burnout|esgotament|\bluto\b|enlutad|suic[ií]d|autoles|automutila|\bcrises?\b|p[aâ]nico|trauma|transtorno/i;

const HASHTAGS_CATEGORIA = {
  'Relatos da Prática': ['#medicinadefamilia', '#atencaoprimaria', '#relatosdaclinica'],
  'Pacientes & Famílias': ['#cuidadoemsaude', '#familia', '#bemestaremocional'],
  'Pais & Famílias': ['#saudementalinfantil', '#maternidade', '#paternidade'],
  'Médicos & Enfermeiros': ['#medicos', '#enfermagem', '#saudedotrabalhador'],
  'Residentes & Estudantes': ['#residenciamedica', '#estudantesdemedicina', '#formacaomedica'],
  'Empresas & RH': ['#saudementalnotrabalho', '#gestaodepessoas', '#saudedotrabalhador'],
  Geral: ['#saudedotrabalhador', '#bemestar', '#atencaoprimaria'],
  'Educadores & Professores': ['#professores', '#saudementaldocente', '#educacao'],
  'Cuidadores & Famílias': ['#cuidadores', '#familia', '#cuidadoemsaude'],
  'Migrantes & Expatriados': ['#migrantes', '#brasileirosnoexterior', '#adaptacao'],
  'Infância & Adolescência': ['#saudementalinfantil', '#adolescencia', '#criancas'],
  'Luto & Divórcio': ['#luto', '#divorcio', '#acolhimento'],
  'Maternidade, Puerpério & Lactação': ['#maternidade', '#puerperio', '#amamentacao'],
  'Saúde Mental na Terceira Idade': ['#terceiraidade', '#envelhecimento', '#saudedoidoso'],
  'Trabalho Doméstico & Cuidados do Lar': ['#trabalhodomestico', '#cargamental', '#cuidadoemsaude'],
  'Neurodivergência na Vida Adulta': ['#neurodivergencia', '#tdahadulto', '#tea'],
  'Pós-Graduação & Concursos': ['#posgraduacao', '#concursos', '#estudos'],
  'Ansiedade Social & Timidez': ['#ansiedadesocial', '#timidez', '#ansiedade'],
  'Terceiro Setor & Causas Sociais': ['#terceirosetor', '#causassociais', '#voluntariado'],
  'Transição de Carreira & Aposentadoria': ['#aposentadoria', '#transicaodecarreira', '#saudedotrabalhador'],
  'Dependências & Adições': ['#dependenciaquimica', '#adicao', '#recuperacao'],
  'Compulsões & Transtornos Alimentares': ['#transtornosalimentares', '#compulsaoalimentar', '#alimentacao'],
};

/** HTML → texto, sem as chamadas numéricas de referência (<sup>1</sup>). */
function textoLimpo(html) {
  return paraTextoPuro(String(html || '').replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ''));
}

/** Parágrafos do corpo, na ordem, sem referências, notas nem identificação. */
function paragrafosDoArtigo(conteudoHtml) {
  const html = String(conteudoHtml || '').split(/<h2>\s*(?:Referências|Ferramenta interativa)\s*<\/h2>/i)[0];
  const paragrafos = [];
  const re = /<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/class="[^"]*(refs-note|identificacao-medico|ferramenta)/i.test(m[1] || '')) continue;
    const texto = textoLimpo(m[2]);
    if (texto && !/https?:\/\/|www\./i.test(texto)) paragrafos.push(texto);
  }
  return paragrafos;
}

/** Frases inteiras (ponto, exclamação ou interrogação seguidos de maiúscula). */
function frases(texto) {
  return String(texto || '')
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“(])/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/** Junta frases inteiras até o limite, sem cortar no meio. */
function juntarAte(lista, max) {
  let texto = '';
  for (const f of lista) {
    const candidato = texto ? `${texto} ${f}` : f;
    if (candidato.length > max) break;
    texto = candidato;
  }
  return texto;
}

/** Resumo sem a assinatura antiga ", por Dr. Antônio Felipe." (a identificação já vai no fim). */
function resumoSemAssinatura(resumo) {
  return String(resumo || '')
    .trim()
    .replace(/,?\s*(?:elaborad[oa]\s+)?(?:por|pelo)\s+Dr\.?\s+Ant[oô]nio\s+Felipe\.?$/i, '.')
    .replace(/\.\.$/, '.');
}

function temaSensivel(artigo) {
  const texto = `${artigo.titulo} ${artigo.resumo} ${textoLimpo(artigo.conteudo)}`;
  return RE_TEMA_SENSIVEL.test(texto);
}

// Tema pelo título: vem antes da categoria, que em "Geral" diz pouco.
const HASHTAGS_TEMA = [
  [/professor|docente|escola/i, ['#professores', '#saudementaldocente']],
  [/m[eé]dic[oa]s?\b|enfermeir/i, ['#medicos', '#enfermagem']],
  [/resid[eê]ncia|residentes/i, ['#residenciamedica']],
  [/crian[cç]a|infantil|infância/i, ['#saudementalinfantil']],
  [/adolescen/i, ['#adolescencia']],
  [/idos[oa]|envelhec|terceira idade/i, ['#saudedoidoso']],
  [/trabalh|empresa|gestor|lideran|\bRH\b/i, ['#saudementalnotrabalho']],
  [/cuidador/i, ['#cuidadores']],
  [/gesta[cç]|puerp|materni|amamenta/i, ['#maternidade']],
  [/aten[cç][aã]o prim[aá]ria|\bAPS\b/i, ['#atencaoprimaria']],
  [/ansiedade/i, ['#ansiedade']],
  [/depress/i, ['#depressao']],
  [/\bluto\b/i, ['#luto']],
];

/** Relato de caso: precisa ser apresentado como narrativa composta (regra de ética do projeto). */
function ehRelatoClinico(artigo) {
  return artigo.categoria === 'Relatos da Prática' || RE_NARRATIVA_COMPOSTA.test(textoLimpo(artigo.conteudo));
}

function hashtagsDoArtigo(artigo) {
  const tema = HASHTAGS_TEMA.filter(([re]) => re.test(artigo.titulo || '')).flatMap(([, tags]) => tags);
  const lista = ['#saudemental', ...tema, '#medicinadefamilia', ...(HASHTAGS_CATEGORIA[artigo.categoria] || [])];
  return [...new Set(lista)].slice(0, 5);
}

/**
 * Monta a legenda e devolve também as partes, que a checagem e a prévia usam.
 * Nunca lança: se o artigo não tiver texto para um gancho, a parte fica vazia
 * e a checagem de conteúdo reprova.
 */
function montarLegendaInstagram(artigo) {
  const paragrafos = paragrafosDoArtigo(artigo.conteudo);
  const frasesAbertura = frases(paragrafos[0]);
  const resumo = resumoSemAssinatura(artigo.resumo);
  const frasesResumo = frases(resumo);

  // Gancho: a 1ª frase do parágrafo de abertura, se curta; senão a 1ª do
  // resumo; senão o título.
  const candidatos = [frasesAbertura[0], frasesResumo[0], artigo.titulo].filter(Boolean);
  const gancho = candidatos.find((c) => c.length <= MAX_GANCHO) || '';

  // Dois parágrafos, sempre INTEIROS, na ordem: resumo (sem a frase que
  // virou gancho), resto da abertura, parágrafos do corpo que caibam. Nunca um
  // recorte no meio de um parágrafo — cortar pode separar uma frase do
  // contraste que lhe dá sentido ("No discurso…" / "Na prática…"). Frases
  // soltas do início de um parágrafo longo só entram em último caso.
  const ganchoDaAbertura = frasesAbertura[0] === gancho;
  const candidatosParagrafo = [
    frasesResumo.filter((f) => f !== gancho).join(' '),
    ganchoDaAbertura ? frasesAbertura.slice(1).join(' ') : '',
    ...paragrafos.slice(ganchoDaAbertura ? 1 : 0),
  ].filter((p) => p && p.length <= MAX_PARAGRAFO && !RE_NARRATIVA_COMPOSTA.test(p));
  const escolhidos = [...new Set(candidatosParagrafo)].slice(0, 2);
  if (escolhidos.length < 2) {
    const longo = paragrafos.find((p) => p.length > MAX_PARAGRAFO && !escolhidos.includes(p));
    const trecho = longo ? juntarAte(frases(longo), MAX_PARAGRAFO) : '';
    if (trecho) escolhidos.push(trecho);
  }
  const [paragrafo1, paragrafo2] = escolhidos;

  // Relato clínico: a frase do próprio artigo que o declara narrativa composta.
  const avisoComposta = frases(textoLimpo(artigo.conteudo)).find((f) => RE_NARRATIVA_COMPOSTA.test(f)) || '';

  const sensivel = temaSensivel(artigo);
  const chamada = sensivel ? CHAMADA_COMPARTILHAR : CHAMADA_SALVAR;
  const hashtags = hashtagsDoArtigo(artigo);

  const blocos = [gancho, paragrafo1, paragrafo2, avisoComposta, chamada, LINHA_BIO];
  if (sensivel) blocos.push(LINHA_CVV);
  blocos.push(IDENTIFICACAO, hashtags.join(' '));

  return {
    texto: blocos.filter(Boolean).join('\n\n'),
    partes: { gancho, paragrafos: [paragrafo1, paragrafo2].filter(Boolean), avisoComposta, chamada, sensivel, hashtags },
  };
}

module.exports = {
  montarLegendaInstagram,
  paragrafosDoArtigo,
  resumoSemAssinatura,
  textoLimpo,
  temaSensivel,
  ehRelatoClinico,
  RE_NARRATIVA_COMPOSTA,
  IDENTIFICACAO,
  LINHA_BIO,
  LINHA_CVV,
  CHAMADA_SALVAR,
  CHAMADA_COMPARTILHAR,
  MAX_GANCHO,
};
