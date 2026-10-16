/**
 * Plano de conteúdo de um post do fluxo novo de redes (PROMPT-MESTRE Parte 3.2): extrai do texto do site o
 * gancho, as telas (uma ideia por tela, frases curtas) e a legenda. Nada é inventado: tudo vem do texto.
 */
const { LINHAS_SOCIAL } = require('../checagensAprovacao');
const { AVISO_CFM } = require('../conformidadeCfm');

const MAX_PALAVRAS_TELA = 25;
const ORIENTACAO = 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const LINHA_CRISE = 'Em crise: CVV 188 · SAMU 192';
const LINHA_CREDITO = 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito';
const RE_SENSIVEL = /\b(suic[ií]d\w*|autoles\w*|autom?utila\w*|desejo de morrer|quer(?:er)? morrer|tirar a (?:pr[óo]pria )?vida|viol[êe]ncia|abuso|trauma)\b/i;
const ENTIDADES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&mdash;': '—', '&ndash;': '–', '&hellip;': '…' };
const SUBSTITUICOES_INGLES = [[/\bonline\b/gi, 'na internet'], [/\bfeedback\b/gi, 'retorno'], [/\bhome office\b/gi, 'trabalho em casa'], [/\bstress\b/gi, 'estresse'], [/\bbullying\b/gi, 'bullying']];

const HASHTAGS_CATEGORIA = {
  'Pacientes & Famílias': ['#saudemental', '#cuidado', '#familia'],
  'Pais & Famílias': ['#saudemental', '#paternidade', '#infancia'],
  'Infância & Adolescência': ['#saudemental', '#adolescencia', '#infancia'],
  'Educadores & Professores': ['#saudemental', '#educacao', '#escola'],
  'Médicos & Enfermeiros': ['#saudemental', '#saudedoprofissional', '#aps'],
  'Residentes & Estudantes': ['#saudemental', '#medicina', '#residencia'],
  'Empresas & RH': ['#saudemental', '#saudenotrabalho', '#rh'],
  'Relatos da Prática': ['#saudemental', '#relato', '#cuidado'],
  'Cuidadores & Famílias': ['#saudemental', '#cuidadores', '#familia'],
  'Luto & Divórcio': ['#saudemental', '#luto', '#acolhimento'],
  'Maternidade, Puerpério & Lactação': ['#saudemental', '#puerperio', '#maternidade'],
  'Saúde Mental na Terceira Idade': ['#saudemental', '#envelhecimento', '#cuidado'],
  'Dependências & Adições': ['#saudemental', '#dependencia', '#cuidado'],
};

const textoPuro = (html) => String(html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<sup[\s\S]*?<\/sup>/gi, '').replace(/<\/(p|li|h[1-6]|div|blockquote)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e] ?? ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim();
const palavras = (t) => String(t).trim().split(/\s+/).filter(Boolean);
const semIngles = (t) => SUBSTITUICOES_INGLES.reduce((x, [re, novo]) => x.replace(re, novo), t);

const maiuscula = (t) => String(t || '').replace(/^[\s“"'—-]*([a-zà-ú])/, (m, c) => m.slice(0, -1) + c.toUpperCase());

/** Encurta a `max` palavras cortando num limite de oração (; , :) quando possível, nunca no meio de uma lista. */
function encurtar(texto, max) {
  const p = palavras(texto);
  if (p.length <= max) return texto;
  const corte = p.slice(0, max).join(' ');
  const i = Math.max(corte.lastIndexOf(';'), corte.lastIndexOf(','), corte.lastIndexOf(':'));
  const base = i >= corte.length * 0.45 ? corte.slice(0, i) : corte;
  return `${limparFim(base)}.`;
}

const SOLTAS = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'que', 'por', 'aos', 'ao', 'um', 'uma', 'ou', 'se', 'sobre']);
/** Tira pontuação e preposições/artigos soltos do fim ("…apoio aos" → "…apoio"). */
function limparFim(t) {
  let p = String(t).replace(/[,;:\s.]+$/, '').split(/\s+/);
  while (p.length > 3 && SOLTAS.has(p.at(-1).toLowerCase().replace(/[^a-zà-ú]/g, ''))) p = p.slice(0, -1);
  return p.join(' ').replace(/[,;:\s.]+$/, '');
}

/** Junta as duas primeiras frases se couberem em `max` palavras (dá contexto a um trecho literário). */
function trecho(texto, max = 24) {
  const ss = String(texto).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  if (ss.length >= 2 && palavras(`${ss[0]} ${ss[1]}`).length <= max) return `${ss[0]} ${ss[1]}`;
  return frase(texto, max);
}

/** Primeira frase completa com até `max` palavras; se for longa demais, corta na última vírgula/ponto e vírgula que couber. */
function frase(texto, max = 20) {
  const sentencas = String(texto).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (const s of sentencas) {
    if (palavras(s).length >= 4 && palavras(s).length <= max) return s;
  }
  const s = sentencas[0] || '';
  if (palavras(s).length <= max) return s;
  const corte = palavras(s).slice(0, max).join(' ');
  const i = Math.max(corte.lastIndexOf(','), corte.lastIndexOf(';'), corte.lastIndexOf(' — '));
  const base = i > corte.length * 0.5 ? corte.slice(0, i) : corte;
  return `${base.replace(/[,;:\s]+$/, '')}.`;
}

function secoes(html) {
  const corpo = html.replace(/<h2[^>]*>\s*Refer[êe]ncias[\s\S]*$/i, '');
  const partes = corpo.split(/<h2[^>]*>/i).slice(1).map((p) => {
    const [titulo, ...resto] = p.split(/<\/h2>/i);
    return { titulo: textoPuro(titulo), texto: textoPuro(resto.join(' ')) };
  });
  return partes.filter((s) => s.titulo && s.texto && !/ferramenta|apoio agora|precisa de apoio|para saber mais/i.test(s.titulo));
}

function referencias(html) {
  const i = html.search(/<h[2-4][^>]*>\s*Refer[êe]ncias/i);
  if (i < 0) return [];
  return [...html.slice(i).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textoPuro(m[1]).replace(/\s+/g, ' '));
}

function refResumida(ref) {
  const limpa = ref.replace(/https?:\/\/\S+/g, '').replace(/\bdoi:\S+/gi, '').trim();
  const partes = limpa.split('. ').filter(Boolean);
  const autor = (partes[0] || '').split(',')[0].replace(/\bet al\.?/i, '').trim();
  const ano = (limpa.match(/\b(19|20)\d{2}\b/) || [''])[0];
  const fonte = partes.find((p, k) => k >= 1 && /[A-Za-zÀ-ú]/.test(p) && p.length < 90) || '';
  return [autor && `${autor} et al.`, fonte && fonte.replace(/\.$/, ''), ano].filter(Boolean).join(', ').slice(0, 150);
}

/**
 * @param {{slug,titulo,resumo,conteudo,categoria}} artigo
 * @param {{tipo:'artigo'|'relato'}} opcoes
 * @returns {{telas: Array<{tipo, titulo?, texto}>, legendaCorpo: string, refs: string[], hashtags: string[], sensivel: boolean, gancho: string}}
 */
function planejarPost(artigo, { tipo = 'artigo' } = {}) {
  const html = artigo.conteudo;
  const sensivel = RE_SENSIVEL.test(`${artigo.titulo} ${textoPuro(html).slice(0, 4000)}`) || /\b188\b/.test(html);
  const resumoLimpo = semIngles(textoPuro(artigo.resumo));
  const titulo = semIngles(artigo.titulo);

  // Gancho: pergunta do título, ou primeira frase do resumo (situação do dia a dia), ou o título.
  let gancho;
  if (/\?\s*$/.test(titulo) && palavras(titulo).length <= 16) gancho = titulo;
  else if (/\?/.test(resumoLimpo)) gancho = (resumoLimpo.match(/[^.!?]*\?/) || [titulo])[0].trim();
  else gancho = frase(resumoLimpo, 16);
  if (palavras(gancho).length < 4 || palavras(gancho).length > 22) gancho = titulo;
  gancho = gancho.replace(/[.]$/, gancho.includes('?') ? '' : '.');

  const telas = [{ tipo: 'capa', texto: gancho, titulo: palavras(titulo).length <= 22 ? titulo : '' }];

  if (tipo === 'relato') {
    const paragrafos = textoPuro(html.replace(/<div[^>]*reflection-box[\s\S]*$/i, '')).split('\n').map((p) => p.trim()).filter((p) => palavras(p).length >= 8 && !/narrativa composta/i.test(p));
    for (const p of paragrafos.slice(0, 3)) telas.push({ tipo: 'trecho', texto: trecho(p, 24) });
    const caixa = html.match(/reflection-box[\s\S]*$/i);
    const reflexao = caixa ? textoPuro(caixa[0]).split('\n').map((x) => x.trim()).filter((x) => palavras(x).length >= 6 && !/ensinou/i.test(x)) : [];
    telas.push({ tipo: 'reflexao', titulo: 'O que esse encontro ensina', texto: frase(reflexao[0] || paragrafos.at(-1) || resumoLimpo, 24) });
  } else {
    const sec = secoes(html);
    for (const s of sec.slice(0, 5)) {
      const t = palavras(s.titulo).length <= 9 ? semIngles(s.titulo) : '';
      telas.push({ tipo: 'ideia', titulo: t, texto: semIngles(frase(s.texto, t ? 20 : 24)) });
    }
    if (telas.length < 4) {
      const paragrafos = textoPuro(html).split('\n').map((p) => p.trim()).filter((p) => palavras(p).length >= 10);
      for (const p of paragrafos.slice(1, 5 - telas.length + 1)) telas.push({ tipo: 'ideia', texto: semIngles(frase(p, 24)) });
    }
  }
  for (const t of telas) t.texto = maiuscula(t.texto);
  telas.splice(7); // capa + até 6 + final = 8
  telas.push({ tipo: 'final', titulo: 'Leia o texto completo', texto: 'Link na bio.', apoio: sensivel });
  const totalPalavras = (t) => palavras(`${t.titulo || ''} ${t.texto || ''}`).length;
  for (const t of telas) if (totalPalavras(t) > MAX_PALAVRAS_TELA) t.texto = encurtar(t.texto, Math.max(6, MAX_PALAVRAS_TELA - palavras(t.titulo || '').length));

  const refs = referencias(html).slice(0, 2).map(refResumida).filter(Boolean);
  const resumoCurto = frase(resumoLimpo, 38);
  const pontos = telas.filter((t) => t.tipo === 'ideia').slice(0, 2).map((t) => t.texto);
  const legendaCorpo = [gancho, '', resumoCurto, ...(pontos.length ? ['', pontos.map((p) => `• ${p}`).join('\n')] : []), '', 'Texto completo no link da bio.'].join('\n');
  const hashtags = (HASHTAGS_CATEGORIA[artigo.categoria] || ['#saudemental', '#cuidado', '#bemestar']).slice(0, 4);
  return { telas, legendaCorpo: semIngles(legendaCorpo), refs, hashtags, sensivel, gancho };
}

/** Legenda final: corpo + referências + avisos obrigatórios + assinatura de 3 linhas + hashtags (≤ 1500 caracteres). */
function montarLegenda(plano, { limite = 1500 } = {}) {
  const fixos = [LINHA_CREDITO, ORIENTACAO, plano.sensivel ? LINHA_CRISE : LINHA_CRISE, AVISO_CFM, LINHAS_SOCIAL.join('\n')].join('\n\n');
  const tags = plano.hashtags.join(' ');
  const refs = plano.refs.length ? `Referências: ${plano.refs.join(' | ')}` : '';
  const montar = (corpo) => [corpo, refs, fixos, tags].filter(Boolean).join('\n\n');
  let corpo = plano.legendaCorpo;
  let legenda = montar(corpo);
  // se estourar: tira primeiro as referências detalhadas, depois encurta o corpo por parágrafos
  const linhas = corpo.split('\n');
  while (legenda.length > limite && linhas.length > 3) { linhas.splice(linhas.length - 3, 1); corpo = linhas.join('\n'); legenda = montar(corpo); }
  return legenda;
}

module.exports = { planejarPost, montarLegenda, textoPuro, palavras, encurtar, MAX_PALAVRAS_TELA, ORIENTACAO, LINHA_CRISE, LINHA_CREDITO };
