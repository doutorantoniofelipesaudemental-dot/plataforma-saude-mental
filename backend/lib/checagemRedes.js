/**
 * Tripla checagem editorial, BLOQUEANTE, de cada post do feed (CLAUDE.md,
 * Seção 20-quater). Roda depois das checagens técnicas do socialPublisher
 * (status aprovado, URL e capa no ar) e antes de qualquer chamada à Meta.
 * Qualquer falha em qualquer uma das três reprova o post; a fila registra o
 * motivo (RegistroPublicacao) e passa ao próximo artigo.
 *
 *   1. Conteúdo      — texto fiel ao artigo, português, formato da legenda.
 *   2. Visual        — capa 4:5 com o título atual, única, sem inglês.
 *   3. Segurança/CFM — CVV 188 em tema sensível, sem promessa nem autopromoção.
 *
 * Limites honestos: "português sem erros" é verificado por sinais objetivos
 * (texto copiado do próprio artigo revisado, sem caracteres corrompidos, sem
 * palavras em inglês de uma lista), não por um corretor ortográfico; "título
 * em destaque" é provado pelo hash — a imagem no endereço é exatamente a que
 * o gerador desenhou com o título atual —, não por OCR.
 */
const sharp = require('sharp');
const { hashBuffer, textoDoSelo, MODELO_CAPA, LARGURA_CAPA, ALTURA_CAPA } = require('./capaRedes');
const { reescritaPendente } = require('./reescritas');
const {
  textoLimpo,
  resumoSemAssinatura,
  temaSensivel,
  ehRelatoClinico,
  RE_NARRATIVA_COMPOSTA,
  IDENTIFICACAO,
  LINHA_BIO,
  CHAMADA_SALVAR,
  CHAMADA_COMPARTILHAR,
  MAX_GANCHO,
} = require('./legendaInstagram');

const LIMITE_LEGENDA_INSTAGRAM = 2200;

// Permitidas (Regra 17): "burnout", "online", "home office" e "feedback" — ficam fora da lista.
const PALAVRAS_EM_INGLES = [
  'the', 'and', 'for', 'with', 'your', 'you', 'how', 'what', 'why', 'tips', 'guide', 'free', 'click',
  'swipe', 'save', 'share', 'follow', 'link in bio', 'read more', 'mindset', 'wellness',
  'wellbeing', 'self-care', 'selfcare', 'coping', 'healthy', 'mental health', 'stress',
  'coaching',
];
const RE_INGLES = new RegExp(`(^|[^\\p{L}])(${PALAVRAS_EM_INGLES.map((p) => p.replace(/[-\s]/g, '[-\\s]')).join('|')})(?=$|[^\\p{L}])`, 'iu');

// Código de Ética Médica / publicidade médica (Res. CFM 2.336/2023).
const TERMOS_CFM = [
  [/\bcura(?:r|mos|do|da)?\b/i, 'promessa de cura'],
  [/\bgarant(?:ido|ida|idos|idas|imos|ia de)\b/i, 'promessa de resultado garantido'],
  [/\bmilagr/i, 'linguagem de milagre'],
  [/\binfal[ií]vel/i, 'promessa de infalibilidade'],
  [/\b100\s?%\s*(?:eficaz|garantid|seguro)/i, 'promessa de eficácia total'],
  [/\b(?:o|a) melhor (?:m[eé]dic[oa]|tratamento|cl[ií]nica|profissional)/i, 'superlativo de autopromoção'],
  [/\brefer[eê]ncia em\b/i, 'superlativo de autopromoção'],
  [/\bespecialista em (?:psiquiatria|sa[uú]de mental)\b/i, 'especialidade que o autor não tem'],
  [/\bpsiquiatra\s+(?:Dr|Ant)/i, 'autor apresentado como psiquiatra'],
  [/\bantes e depois\b/i, '"antes e depois" de pacientes'],
  [/\bdiagn[oó]stico (?:online|a dist[aâ]ncia|por mensagem)/i, 'diagnóstico a distância'],
];

const RE_URL_SOLTA = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|app|br|org|net|io)(?:\/|\b)/i;
const RE_MARCADOR = /\bSlide\s*\d|\bItem\s*\d+\s*:|\*\*|\[[^\]]*\]/i;
const RE_CORROMPIDO = /�|Ã[£¡©ª³µ§º]|Ã‡|â€/;

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFC')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function resultado(falhas) {
  return { ok: falhas.length === 0, falhas };
}

/* =============================== 1. Conteúdo ============================== */
function checarConteudo(artigo, legenda) {
  const falhas = [];
  const texto = legenda?.texto || '';
  const partes = legenda?.partes || {};

  const pendente = reescritaPendente(artigo);
  if (pendente) falhas.push(`reescrita aprovada (lote ${pendente.lote}) ainda não importada — o post sairia com a versão antiga`);

  const primeiraLinha = texto.split('\n')[0].trim();
  if (!partes.gancho || primeiraLinha !== partes.gancho) falhas.push('legenda sem gancho na primeira linha');
  else if (primeiraLinha.length > MAX_GANCHO) falhas.push(`gancho longo demais (${primeiraLinha.length} > ${MAX_GANCHO} caracteres)`);

  if ((partes.paragrafos || []).length < 2) falhas.push('menos de 2 parágrafos tirados do artigo');
  if (!texto.includes(CHAMADA_SALVAR) && !texto.includes(CHAMADA_COMPARTILHAR)) falhas.push('sem chamada para salvar ou compartilhar');
  if (!texto.includes(LINHA_BIO)) falhas.push('sem "🔗 Artigo completo no link da bio"');
  if (!texto.includes(IDENTIFICACAO)) falhas.push('sem a identificação resumida (CRM + especialidade com RQE)');

  const hashtags = texto.match(/#[\p{L}\d_]+/gu) || [];
  if (hashtags.length < 3 || hashtags.length > 5) falhas.push(`${hashtags.length} hashtags (precisa de 3 a 5)`);
  if (/#psiquiatria\b/i.test(texto)) falhas.push('usa #psiquiatria');
  if (/\bAntonio\b/.test(texto)) falhas.push('"Antonio" sem acento');
  if (RE_URL_SOLTA.test(texto)) falhas.push('URL solta na legenda (não é clicável no Instagram)');
  if (RE_MARCADOR.test(texto)) falhas.push('marcador estrutural na legenda ("Slide 1", "**", colchetes)');
  if (RE_CORROMPIDO.test(texto)) falhas.push('caracteres corrompidos (codificação)');
  const ingles = texto.match(RE_INGLES);
  if (ingles) falhas.push(`palavra em inglês na legenda: "${ingles[2]}"`);
  if (texto.length > LIMITE_LEGENDA_INSTAGRAM) falhas.push(`legenda com ${texto.length} caracteres (limite ${LIMITE_LEGENDA_INSTAGRAM})`);

  // Fidelidade: cada trecho do artigo usado na legenda tem de existir no artigo.
  const fonte = normalizar(`${artigo.titulo} ${artigo.resumo} ${resumoSemAssinatura(artigo.resumo)} ${textoLimpo(artigo.conteudo)}`);
  for (const trecho of [partes.gancho, ...(partes.paragrafos || []), partes.avisoComposta].filter(Boolean)) {
    if (!fonte.includes(normalizar(trecho))) falhas.push(`trecho que não está no artigo: "${trecho.slice(0, 60)}…"`);
  }
  return resultado(falhas);
}

/* ================================ 2. Visual =============================== */
/**
 * @param {object} artigo
 * @param {{ buffer?: Buffer, meta?: object, url?: string }} capa  na prévia, o PNG
 *        recém-desenhado e seus metadados; na fila, nada (usa `artigo.capaRedes`
 *        e baixa a imagem do endereço — o hash prova o que de fato sai).
 * @param {(hash: string) => Promise<number>} contarOutrosComHash  outros artigos com este hash
 */
async function checarVisual(artigo, capa, contarOutrosComHash) {
  const falhas = [];
  const meta = capa?.meta || artigo.capaRedes || {};

  let buffer = capa?.buffer;
  if (!buffer) {
    const url = capa?.url || meta.url;
    if (!url) return resultado(['artigo sem capa 4:5 gerada']);
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!resp.ok) return resultado([`capa respondeu HTTP ${resp.status}`]);
      buffer = Buffer.from(await resp.arrayBuffer());
    } catch (err) {
      return resultado([`não foi possível baixar a capa (${err.message})`]);
    }
  }

  const { width, height, format } = await sharp(buffer).metadata();
  if (width !== LARGURA_CAPA || height !== ALTURA_CAPA) falhas.push(`capa ${width}×${height} — não é 4:5 (${LARGURA_CAPA}×${ALTURA_CAPA})`);
  if (format !== 'png') falhas.push(`capa em ${format}, esperado png`);

  const hash = hashBuffer(buffer);
  if (!capa?.buffer && hash !== meta.hash) falhas.push('a imagem no endereço não é a capa gerada para este artigo');
  if (meta.modelo !== MODELO_CAPA) falhas.push(`capa de modelo antigo ou desconhecido (${meta.modelo || 'nenhum'})`);
  if (meta.titulo !== artigo.titulo) falhas.push('capa sem o título atual do artigo');
  if ((await contarOutrosComHash(hash)) > 0) falhas.push('capa repetida (mesmo hash de outro artigo)');

  const ingles = `${artigo.titulo} ${artigo.subtituloRedes || ''} ${textoDoSelo(artigo)}`.match(RE_INGLES);
  if (ingles) falhas.push(`texto em inglês na capa: "${ingles[2]}"`);

  return { ...resultado(falhas), hash };
}

/* ========================== 3. Segurança e ética ========================== */
function checarSeguranca(artigo, legenda) {
  const falhas = [];
  const texto = legenda?.texto || '';
  if (temaSensivel(artigo) && !texto.includes('CVV 188')) falhas.push('tema sensível sem "CVV 188"');
  if (ehRelatoClinico(artigo) && !RE_NARRATIVA_COMPOSTA.test(texto)) falhas.push('relato clínico sem a declaração de narrativa composta');

  const textoPost = `${texto} ${artigo.titulo} ${artigo.subtituloRedes || ''}`;
  for (const [re, motivo] of TERMOS_CFM) {
    const m = textoPost.match(re);
    if (m) falhas.push(`CFM: ${motivo} ("${m[0]}")`);
  }
  return resultado(falhas);
}

/** Roda as três e diz se o post pode sair. Nunca lança por conteúdo — só por erro inesperado. */
async function executarTriplaChecagem(artigo, { legenda, capa, contarOutrosComHash }) {
  const conteudo = checarConteudo(artigo, legenda);
  const visual = await checarVisual(artigo, capa, contarOutrosComHash);
  const seguranca = checarSeguranca(artigo, legenda);
  const aprovado = conteudo.ok && visual.ok && seguranca.ok;
  const motivo = aprovado
    ? null
    : [
        ...conteudo.falhas.map((f) => `conteúdo: ${f}`),
        ...visual.falhas.map((f) => `visual: ${f}`),
        ...seguranca.falhas.map((f) => `segurança: ${f}`),
      ].join('; ');
  return { aprovado, motivo, conteudo, visual, seguranca };
}

module.exports = { executarTriplaChecagem, checarConteudo, checarVisual, checarSeguranca, RE_INGLES };
