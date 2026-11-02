/**
 * Formato dos posts do LinkedIn (ordem de 28/10/2026). Funções puras: sem rede, sem banco.
 * O gerador (gerarConteudo.js) e as amostras (modelo novo) usam estas funções. O modelo novo só entra com aprovação
 * do Dr. Antônio no domingo; até lá a fila segue com o modelo atual (só com as correções de rótulo e de referência).
 */

const LIMITE_CARACTERES = 3000;
const LIMITE_GANCHO = 210;

/** Referência curta: "Autor et al. Revista. Ano;vol(n):páginas", sem espaço antes de pontuação. Devolve o original se não reconhecer. */
function referenciaCurta(texto) {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim().replace(/\s+([.,;:)])/g, '$1').replace(/\(\s+/g, '(');
  const m = limpo.match(/^(.+?)\.\s+(?:.*?\.\s+)?([A-Za-zÀ-ÿ][\w .&-]*?)\.?\s+(\d{4});(\d+)(?:\((\d+)\))?:([\d-]+)\.?$/);
  if (!m) return limpo.replace(/\.\.$/, '.');
  const autores = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  const primeiro = autores[0].replace(/\s+et al$/, '');
  const autor = autores.length > 3 || /et al/.test(m[1]) ? `${primeiro} et al.` : `${autores.join(', ')}.`;
  const revista = m[2].trim().replace(/\s+/g, ' ');
  const vol = m[5] ? `${m[4]}(${m[5]})` : m[4];
  return `${autor} ${revista}. ${m[3]};${vol}:${m[6]}.`;
}

/** Remove espaço antes de pontuação em qualquer texto (ex.: "JAMA ." vira "JAMA."). */
const semEspacoAntesDePontuacao = (t) => String(t || '').replace(/\s+([.,;:!?])/g, '$1');

/** Rodapé compacto de 4 linhas (ordem de 28/10/2026). */
function montarRodape({ crise, avisoIA, identificacao, hashtags }) {
  return [
    identificacao,
    'Portal de Saúde Mental Doutor Antônio Felipe Garabito · educativo · CVV 188 · SAMU 192',
    avisoIA,
    hashtags.join(' '),
  ].join('\n');
}

/** Hashtags específicas do tema (3 a 5). Nunca #psiquiatria. Escritas com "Antônio" quando houver nome. */
function validarHashtags(tags) {
  const falhas = [];
  if (tags.length < 3 || tags.length > 5) falhas.push(`${tags.length} hashtags (esperado 3 a 5)`);
  if (tags.some((t) => /psiquiatria/i.test(t))) falhas.push('#psiquiatria é proibida');
  return falhas;
}

/** Pergunta aberta e respeitosa, sem pedir relato clínico nem dado de saúde. Escolha determinística pelo slug. */
const PERGUNTAS = [
  'Qual parte dessa rotina você sente que mais precisa de apoio hoje?',
  'Para quem está nessa fase: o que tem ajudado você a manter o equilíbrio?',
  'Se você pudesse mudar uma coisa no dia a dia de trabalho ou de estudo, o que seria?',
];
function perguntaDoSlug(slug) {
  const soma = [...String(slug)].reduce((s, c) => s + c.charCodeAt(0), 0);
  return PERGUNTAS[soma % PERGUNTAS.length];
}

/**
 * Corpo do modelo novo, na ordem: gancho (até 210 caracteres) · dado numérico verificado (só se houver) ·
 * "Sinais" · "O que ajuda, na prática" (2 ou 3 ações do próprio artigo) · pergunta · link do artigo ·
 * linha da mentoria (só na semana permitida) · referência · rodapé de 4 linhas.
 */
function montarPostNovo({ gancho, dado = null, sinais, ajuda, pergunta, linkArtigo, mentoria = false, referencia, rodape, conduta = false }) {
  if (!Array.isArray(sinais) || sinais.length < 2) throw new Error('"Sinais" exige pelo menos 2 itens');
  if (!Array.isArray(ajuda) || ajuda.length < 2 || ajuda.length > 3) throw new Error('"O que ajuda, na prática" exige 2 ou 3 ações');
  const partes = [
    gancho,
    dado ? dado : null,
    `Sinais\n${sinais.map((s) => `• ${s}`).join('\n')}`,
    `O que ajuda, na prática\n${ajuda.map((s) => `• ${s}`).join('\n')}`,
    pergunta,
    `Texto completo: ${linkArtigo}`,
    mentoria ? 'Mentoria e conteúdos para profissionais e equipes: https://www.drantoniofelipemedico.com.br/mentoria' : null,
    `Referência: ${referenciaCurta(referencia)}`,
    conduta ? 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.' : null,
    rodape,
  ].filter(Boolean);
  return partes.join('\n\n');
}

/** Validação do modelo novo. Devolve a lista de falhas (vazia = aprovado). */
function validarPostNovo(texto, { mentoria = false, hashtags = [] } = {}) {
  const f = [];
  const gancho = String(texto).split('\n')[0];
  if (gancho.length > LIMITE_GANCHO) f.push(`gancho com ${gancho.length} caracteres (máximo ${LIMITE_GANCHO})`);
  if (texto.length > LIMITE_CARACTERES) f.push(`texto com ${texto.length} caracteres (máximo ${LIMITE_CARACTERES})`);
  if (!/\nSinais\n/.test(texto) || !/\nO que ajuda, na prática\n/.test(texto)) f.push('falta "Sinais" seguido de "O que ajuda, na prática"');
  const links = texto.match(/https?:\/\/\S+/g) || [];
  const artigo = links.filter((u) => /\/artigo\//.test(u));
  if (artigo.length !== 1) f.push(`o link do artigo deve aparecer 1 vez no corpo (há ${artigo.length})`);
  const mentorias = links.filter((u) => /\/mentoria/.test(u)).length;
  if (mentorias > (mentoria ? 1 : 0)) f.push('link da mentoria fora da semana permitida');
  if (/(\?|\bme conte\b).*(relato|diagn[oó]stico|sintoma|medica[mç][aã]o)/i.test(texto)) f.push('pergunta pede relato ou dado clínico');
  if (!/CVV 188 · SAMU 192/.test(texto)) f.push('sem CVV 188 · SAMU 192');
  if (!/2\.454\/2026/.test(texto)) f.push('sem aviso de IA (Res. CFM 2.454/2026)');
  if (/Antonio Felipe/.test(texto)) f.push('"Antonio" sem acento');
  if (/Pontos práticos|\(Sinais de/.test(texto)) f.push('rótulo antigo vazado');
  f.push(...validarHashtags(hashtags.length ? hashtags : (texto.match(/#\w+/g) || [])));
  return f;
}

/** Dado numérico só com fonte verificada: a frase do resumo (PubMed) que contém o número. Sem o número no resumo, devolve null. */
function dadoVerificado(resumo, numero) {
  if (!resumo || !numero || !resumo.includes(numero)) return null;
  const frase = resumo.split(/(?<=[.!?])\s+/).find((f) => f.includes(numero));
  return frase ? frase.trim() : null;
}

module.exports = {
  LIMITE_CARACTERES, LIMITE_GANCHO, referenciaCurta, semEspacoAntesDePontuacao, montarRodape,
  validarHashtags, perguntaDoSlug, montarPostNovo, validarPostNovo, dadoVerificado,
};
