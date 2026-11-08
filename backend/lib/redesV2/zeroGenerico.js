/**
 * Checagem "ZERO GENÉRICO" do portão das redes (ordem de 06/11/2026, item B3). Determinística, sem IA.
 * Reprova o post que:
 *   (a) não vem de artigo PUBLICADO, com slug e link do site;
 *   (b) traz frase clínica que não é literal do artigo;
 *   (c) não traz um ponto concreto (sinal, dado com fonte ou passo prático);
 *   (d) abre com gancho genérico da lista proibida (GANCHOS_PROIBIDOS);
 *   (e) se parece com post das últimas 8 semanas (similaridade de 3 palavras, acima de LIMITE_SIMILARIDADE);
 *   (f) foge do eixo do dia (seg E4, ter E5, qua E1, qui E3, sex E6, sáb E7, dom Relato);
 *   (g) não traz "Em crise: CVV 188 · SAMU 192" e o aviso da Res. CFM 2.454/2026.
 */
const { AVISO_CFM } = require('../conformidadeCfm');

const EIXO_DO_DIA = { 1: 'E4', 2: 'E5', 3: 'E1', 4: 'E3', 5: 'E6', 6: 'E7', 0: 'Relato' }; // getUTCDay(): 0 = domingo
const LIMITE_SIMILARIDADE = 0.3; // Jaccard sobre trigramas de palavras; acima disto = parecido demais
const JANELA_SEMANAS = 8;
const LINHA_CRISE_TRECHOS = ['CVV 188', 'SAMU 192'];
const PONTOS_CONCRETOS = ['sinal', 'dado', 'passo'];
// Textos padrão de segurança (ordem de 08/11, pendência 2): isentos da regra de literalidade. Nova lista = nova ordem do Dr. Antônio.
const TEXTOS_PADRAO_SEGURANCA = ['Se surgirem pensamentos de morte, procure ajuda: CVV 188 · SAMU 192.'];
const ehTextoPadrao = (t) => TEXTOS_PADRAO_SEGURANCA.some((p) => normalizar(p) === normalizar(t));
const SITE_ARTIGO = /^https:\/\/www\.drantoniofelipemedico\.com\.br\/artigo\/[a-z0-9-]+$/;
// Rodapé fixo das legendas (montarLegenda): tudo a partir daqui não é texto do post.
const { LINHA_CREDITO, ORIENTACAO } = require('./conteudo');
const MARCAS_RODAPE = [LINHA_CREDITO, ORIENTACAO, 'Em crise:', AVISO_CFM].filter(Boolean);
function corpoDaLegenda(legenda) {
  const s = String(legenda || '');
  const cortes = MARCAS_RODAPE.map((m) => s.indexOf(m)).filter((i) => i >= 0);
  return cortes.length ? s.slice(0, Math.min(...cortes)) : s;
}

// Lista proibida de ganchos (começo da primeira linha, sem acento e em minúsculas). Criada em 06/11/2026.
const GANCHOS_PROIBIDOS = [
  'voce sabia',
  'voce sabe que',
  'voce ja parou para pensar',
  'sabia que',
  'voce nao esta sozinho',
  'voce nao esta sozinha',
  'a saude mental e importante',
  'cuide da sua saude mental',
  'cuidar da saude mental e fundamental',
  'hoje vamos falar',
  'neste post',
  'neste carrossel',
  'em um mundo',
  'chegou a hora',
  'nao e segredo',
  'mindfulness e a solucao',
  'dica de ouro',
  'atencao:',
];

const normalizar = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^\p{L}\d\s]/gu, ' ').replace(/\s+/g, ' ').trim();

const trigramas = (s) => {
  const w = normalizar(s).split(' ').filter(Boolean);
  const out = new Set();
  for (let i = 0; i + 3 <= w.length; i++) out.add(w.slice(i, i + 3).join(' '));
  return out;
};

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

const diaDaSemana = (dataISO) => new Date(`${dataISO}T12:00:00Z`).getUTCDay();

/**
 * @param {object} p
 * @param {object} p.post  { legenda, eixo, artigo:{slug, link, publicado, corpo}, frasesClinicas:[], pontos:[{tipo, texto, fonte?}] }
 * @param {string} p.dataISO  data da publicação (AAAA-MM-DD)
 * @param {Array}  [p.historico=[]]  posts das últimas semanas: [{ slug, legenda, dataISO }]
 * @returns {{aprovado: boolean, falhas: Array<{regra: string, msg: string}>, similaridadeMax: number, limite: number}}
 */
function checarZeroGenerico({ post, dataISO, historico = [] }) {
  const falhas = [];
  const f = (regra, msg) => falhas.push({ regra, msg });
  const legenda = String(post.legenda || '');
  const art = post.artigo || {};

  // (a) origem: artigo publicado, com slug e link do site
  if (art.publicado !== true || !art.slug || !SITE_ARTIGO.test(String(art.link || ''))) {
    f('a-origem', 'o post não vem de artigo publicado com slug e link do site');
  }

  // (b) frases clínicas: cada uma tem de ser literal (normalizada) no corpo do artigo
  // corpo em HTML: tags inline (<strong>, <em>) não podem quebrar a comparação literal
  const corpo = normalizar(String(art.corpo || '').replace(/<[^>]+>/g, ' '));
  const frases = post.frasesClinicas || [];
  if (!frases.length) f('b-frase-clinica', 'nenhuma frase clínica declarada para conferir com o artigo');
  for (const frase of frases) {
    if (!corpo.includes(normalizar(frase))) f('b-frase-clinica', `frase clínica não literal do artigo: "${frase}"`);
  }

  // (c) ponto concreto: sinal, dado com fonte (https) ou passo prático
  const pontos = post.pontos || [];
  // Ponto concreto tem de ser frase LITERAL do artigo (regra h, 07/11/2026): paráfrase não conta.
  // Ordem de 08/11 (pendência 2): texto padrão de segurança é isento; trecho entre «aspas» é comparado sozinho.
  const literal = (p) => {
    const t = String(p.texto || '').trim();
    if (!t) return false;
    if (ehTextoPadrao(t)) return true;
    const trechos = [...t.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
    if (trechos.length) return trechos.every((x) => corpo.includes(normalizar(x)));
    return corpo.includes(normalizar(t));
  };
  const concreto = pontos.some((p) => PONTOS_CONCRETOS.includes(p.tipo) && literal(p)
    && (p.tipo !== 'dado' || /^https:\/\//.test(String(p.fonte || ''))));
  if (!concreto) f('c-ponto-concreto', 'sem ponto concreto literal do artigo (sinal, dado com fonte ou passo prático)');

  // (h) número ou percentual no post exige referência listada; gancho não pode repetir o resumo do artigo
  const corpoLegenda = corpoDaLegenda(legenda);
  const temRef = /Refer[êe]ncias:\s*\S/.test(legenda);
  const numeros = (corpoLegenda.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => !/^(19|20)\d\d$/.test(n));
  const porExtenso = /\bem cada (?:\w+ )?\w+\b|\bmetade\b|\bdobro\b|\bpela metade\b/i.test(corpoLegenda);
  if ((numeros.length || porExtenso) && !temRef) f('h-numero-sem-referencia', 'número ou percentual no post sem referência listada');
  const gancho = normalizar(legenda.split('\n')[0]);
  const resumo = normalizar(art.resumo || '');
  if (resumo && gancho.length > 20) {
    const pal = gancho.split(' ').filter(Boolean);
    const repetidas = pal.filter((w) => resumo.split(' ').includes(w)).length;
    if (resumo.includes(gancho) || repetidas / pal.length >= 0.8) f('h-gancho-repete-resumo', 'o gancho repete o resumo do artigo');
  }

  // (d) gancho: primeira linha não pode começar com item da lista proibida
  const primeira = normalizar(legenda.split('\n')[0]);
  const proibido = GANCHOS_PROIBIDOS.find((g) => primeira.startsWith(normalizar(g)));
  if (proibido) f('d-gancho-generico', `gancho genérico da lista proibida: "${proibido}"`);

  // (e) similaridade com posts das últimas 8 semanas. Compara só o CORPO da legenda (sem o rodapé fixo:
  // crédito, orientação, aviso CFM e assinatura são iguais em todos os posts e inflavam a medida: ~0,33 contra 0,05 do corpo).
  const alvo = trigramas(corpoDaLegenda(legenda));
  const limiteData = new Date(`${dataISO}T00:00:00Z`).getTime() - JANELA_SEMANAS * 7 * 86400e3;
  let similaridadeMax = 0;
  for (const h of historico) {
    const t = new Date(`${h.dataISO}T00:00:00Z`).getTime();
    if (t < limiteData || t >= new Date(`${dataISO}T00:00:00Z`).getTime()) continue;
    if (h.slug && h.slug === art.slug) continue;
    similaridadeMax = Math.max(similaridadeMax, jaccard(alvo, trigramas(corpoDaLegenda(h.legenda))));
  }
  if (similaridadeMax > LIMITE_SIMILARIDADE) {
    f('e-parecido', `parecido com post das últimas ${JANELA_SEMANAS} semanas: ${similaridadeMax.toFixed(2)} (limite ${LIMITE_SIMILARIDADE})`);
  }

  // (f) eixo do dia
  const esperado = EIXO_DO_DIA[diaDaSemana(dataISO)];
  if (post.eixo !== esperado) f('f-eixo-do-dia', `eixo "${post.eixo}" fora do eixo do dia (esperado ${esperado})`);

  // (g) crise e aviso de IA
  if (!LINHA_CRISE_TRECHOS.every((t) => legenda.includes(t))) f('g-crise', 'sem "Em crise: CVV 188 · SAMU 192"');
  if (!legenda.includes(AVISO_CFM)) f('g-aviso', 'sem o aviso da Res. CFM 2.454/2026');

  return {
    aprovado: falhas.length === 0,
    falhas,
    similaridadeMax: Number(similaridadeMax.toFixed(3)),
    limite: LIMITE_SIMILARIDADE,
  };
}

module.exports = { checarZeroGenerico, GANCHOS_PROIBIDOS, EIXO_DO_DIA, LIMITE_SIMILARIDADE, JANELA_SEMANAS, trigramas, jaccard, normalizar, TEXTOS_PADRAO_SEGURANCA, ehTextoPadrao };
