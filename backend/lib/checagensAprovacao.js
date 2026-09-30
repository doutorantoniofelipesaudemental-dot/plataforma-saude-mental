/**
 * Três checagens automáticas ANTES de aprovar qualquer conteúdo (arte, legenda,
 * narração, artigo). Funções puras: sem banco, sem rede, sem LLM.
 *
 *   1. checarImagemSemMarcaDagua — marca d'água, logo/selo de IA, ruído visual.
 *   2. checarHumanizacao         — tom acolhedor e empático; reprova o frio/robótico.
 *   3. checarEticaCfm            — sem promessa de cura/sensacionalismo; identificação
 *                                  do CFM (5 linhas no portal, 3 nas mídias sociais),
 *                                  CRM-BA 41322, RQE 26638 e CVV 188 em tema sensível.
 *
 * `executarChecagensAprovacao` roda as três e devolve { aprovado, motivo, ... }.
 * Heurísticas: reprovam o que é inequívoco e nunca substituem a revisão médica.
 */
const sharp = require('sharp');
const { IDENTIFICACAO_COMPLETA } = require('./conformidadeCfm');
const { TERMOS_CFM } = require('./checagemRedes');
const { IDENTIFICACAO } = require('./legendaInstagram');
const { checarOriginalidade } = require('./originalidade');

const resultado = (falhas) => ({ ok: falhas.length === 0, falhas });

/* ==================== 1. Imagem sem marca d'água / ruído ==================== */

// Marcas de proveniência que geradores de IA gravam no arquivo (C2PA/JUMBF, XMP, EXIF, chunks PNG).
const RE_PROVENIENCIA_IA = new RegExp(
  [
    'c2pa', 'synthid', 'trainedAlgorithmicMedia', 'Made with (?:Google )?AI', 'AI[- ]generated',
    'Generated (?:by|with) (?:AI|Gemini|DALL|Midjourney)', 'Midjourney', 'DALL[-·\\s]?E', 'Stable Diffusion',
    'Adobe Firefly', 'Imagen', 'OpenAI', 'Leonardo\\.?Ai', 'Ideogram', 'Higgsfield', 'Kairogen',
  ].join('|'),
  'i'
);

const LARGURA_ANALISE = 512;
const LIMITE_RUIDO = 6; // mediana do resíduo (0–255); arte limpa fica < 1, foto natural < 4
const FRACAO_CANTO = { w: 0.16, h: 0.1 };
const FATOR_CANTO = 5; // canto com 5× a energia de detalhe do resto da imagem = selo/logo

async function residuoDeDetalhe(buffer) {
  const base = sharp(buffer).greyscale().resize({ width: LARGURA_ANALISE, withoutEnlargement: true });
  const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
  const suave = await base.clone().blur(1.5).raw().toBuffer();
  const res = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) res[i] = Math.abs(data[i] - suave[i]);
  return { res, w: info.width, h: info.height };
}

function mediana(res) {
  const h = new Uint32Array(256);
  for (let i = 0; i < res.length; i++) h[res[i]]++;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += h[v];
    if (acc >= res.length / 2) return v;
  }
  return 0;
}

function energiaRegiao(res, w, x0, y0, x1, y1) {
  let soma = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { soma += res[y * w + x]; n++; }
  return n ? soma / n : 0;
}

/**
 * @param {Buffer} buffer imagem (PNG/JPEG/WebP)
 * @param {{verificarCantos?: boolean}} [opcoes] `verificarCantos` só para capas/fotos:
 *   nos slides de carrossel os cantos têm texto legítimo (indicador de página, rodapé).
 */
async function checarImagemSemMarcaDagua(buffer, { verificarCantos = false } = {}) {
  const falhas = [];
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return resultado(['imagem ausente ou vazia']);

  const marca = buffer.toString('latin1').match(RE_PROVENIENCIA_IA);
  if (marca) falhas.push(`metadado de IA/marca d'água no arquivo ("${marca[0]}")`);

  let analise;
  try {
    analise = await residuoDeDetalhe(buffer);
  } catch (e) {
    return resultado([...falhas, `imagem ilegível (${e.message})`]);
  }
  const { res, w, h } = analise;

  const ruido = mediana(res);
  if (ruido > LIMITE_RUIDO) falhas.push(`ruído visual excessivo (resíduo mediano ${ruido} > ${LIMITE_RUIDO})`);

  if (verificarCantos) {
    const global = energiaRegiao(res, w, 0, 0, w, h);
    const cw = Math.round(w * FRACAO_CANTO.w);
    const ch = Math.round(h * FRACAO_CANTO.h);
    const cantos = {
      'superior esquerdo': [0, 0, cw, ch],
      'superior direito': [w - cw, 0, w, ch],
      'inferior esquerdo': [0, h - ch, cw, h],
      'inferior direito': [w - cw, h - ch, w, h],
    };
    for (const [nome, [x0, y0, x1, y1]] of Object.entries(cantos)) {
      const e = energiaRegiao(res, w, x0, y0, x1, y1);
      if (e > global * FATOR_CANTO + 3) falhas.push(`possível marca d'água ou logo no canto ${nome}`);
    }
  }
  return resultado(falhas);
}

/* ======================= 2. Humanização e empatia ========================== */

// Voz de máquina / burocrática / de chatbot.
const FRIO_ROBOTICO = [
  [/\bprezado\(?a?\)?\s+(?:usu[aá]rio|paciente|cliente)\b/i, 'saudação burocrática ("prezado usuário/paciente")'],
  [/\bcomo (?:um|uma) (?:modelo de linguagem|IA|intelig[eê]ncia artificial|assistente virtual)\b/i, 'voz de chatbot ("como um modelo/IA")'],
  [/\b(?:aqui est[aá]|segue abaixo|conforme solicitado|certamente!|claro!|espero que (?:isso|isto) ajude|n[aã]o hesite em)\b/i, 'fórmula de assistente virtual'],
  [/\b(?:outrossim|ademais|destarte|mister)\b/i, 'jargão burocrático'],
  [/\bem (?:suma|conclus[aã]o),? (?:o|a) (?:paciente|indiv[ií]duo|sujeito)\b/i, 'fechamento impessoal ("o paciente/indivíduo")'],
  [/\b(?:o|os) (?:indiv[ií]duo|sujeito)s? (?:acometido|portador)s?\b/i, 'objetifica a pessoa ("indivíduo acometido")'],
];

// Linguagem que invalida, culpa ou minimiza o sofrimento.
const INVALIDANTE = [
  [/\b(?:é|e) s[oó] (?:pensar positivo|for[cç]a de vontade|querer)\b/i, 'minimiza ("é só pensar positivo/querer")'],
  [/\bfor[cç]a de vontade (?:resolve|basta|é tudo)\b/i, 'culpabiliza ("força de vontade resolve")'],
  [/\b(?:frescura|mimimi|drama|exagero)\b/i, 'invalida o sofrimento'],
  [/\b(?:pare de (?:reclamar|se vitimizar|chorar)|levante e (?:anda|ande)|supere logo)\b/i, 'ordem fria e culpabilizante'],
  [/\b(?:fraco|fraqueza) de car[aá]ter\b/i, 'estigmatiza'],
];

// Contexto de negação/combate imediatamente antes do termo invalidante.
const RE_NEGACAO_ANTES = /(?:evit|jamais|nunca (?:diga|fale)|n[aã]o (?:diga|fale|use)|frases? como|express[oõ]es? como|n[aã]o (?:uma?|se trata)|desmistific|desconstru|combat|mito|preconceito|estigma|n[aã]o [ée]|nunca [ée]|n[aã]o significa|sem cobran|longe de ser|(?:n[aã]o|nem) [ée] (?:s[oó] )?)[^.!?]*$/i;

// Marcas de acolhimento (radicais, sem acento obrigatório).
const ACOLHEDOR = [
  /\bvoc[eê]\b/i, /\b(?:sua|seu|suas|seus)\b/i, /\bacolh/i, /\bescuta/i, /n[aã]o est[aá] sozinh/i,
  /\bcuidad/i, /\bcuidar/i, /\bapoio\b/i, /\bajuda\b/i, /\bentend/i, /\bcompreens/i, /\brespeit/i,
  /\btudo bem\b/i, /\b(?:é|e) normal\b/i, /\baos poucos\b/i, /\bno seu (?:tempo|ritmo)\b/i,
  /\bmerece/i, /\bsinto\b/i, /\bsentir\b/i, /\bsofrimento\b/i, /\bnós\b|\bjuntos?\b/i,
];

const MIN_CARACTERES_TOM = 160; // abaixo disso não há texto para avaliar tom
const MIN_MARCAS = 2;
const MAX_PALAVRAS_POR_FRASE = 32; // média maior = texto denso e burocrático

function checarHumanizacao(texto) {
  const falhas = [];
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return resultado(['texto ausente']);

  for (const [re, motivo] of FRIO_ROBOTICO) {
    const m = t.match(re);
    if (m) falhas.push(`tom frio/robótico: ${motivo} ("${m[0]}")`);
  }
  for (const [re, motivo] of INVALIDANTE) {
    const m = t.match(re);
    // Termo citado para ser combatido ("desmistificar o preconceito de que…", "não é frescura") não é invalidação.
    const antes = m ? t.slice(Math.max(0, m.index - 70), m.index) : '';
    if (m && !RE_NEGACAO_ANTES.test(antes)) falhas.push(`linguagem invalidante: ${motivo} ("${m[0]}")`);
  }

  if (t.length >= MIN_CARACTERES_TOM) {
    const marcas = ACOLHEDOR.filter((re) => re.test(t)).length;
    if (marcas < MIN_MARCAS) falhas.push(`pouco acolhimento: ${marcas} marca(s) de tom empático (mínimo ${MIN_MARCAS}) — fale COM a pessoa ("você", "sua", apoio, escuta)`);
    const frases = t.split(/[.!?…]+\s/).filter((f) => f.trim().length > 0);
    const media = t.split(/\s+/).length / Math.max(1, frases.length);
    if (media > MAX_PALAVRAS_POR_FRASE) falhas.push(`frases longas demais (média ${media.toFixed(0)} palavras) — soa denso e impessoal`);
  }
  return resultado(falhas);
}

/* ========================== 3. Ética médica e CFM ========================== */

// Promessa de cura, garantia de resultado e sensacionalismo (soma-se a TERMOS_CFM).
const PROMESSA_OU_SENSACIONALISMO = [
  [/\bcura (?:garantida|definitiva|total|certa|r[aá]pida)\b/i, 'promessa de cura'],
  [/\b(?:cure|curar|curamos|curei)\s+(?:sua|seu|a|o)?\s*(?:depress[aã]o|ansiedade|burnout|transtorno|doen[cç]a)/i, 'promessa de cura'],
  [/\b(?:acabe|elimine|livre-se)\s+(?:de\s+|com\s+)?(?:a |o |sua |seu )?(?:depress[aã]o|ansiedade|p[aâ]nico|ins[oô]nia)[^.]{0,30}(?:para sempre|de vez|definitivamente)/i, 'promessa de eliminar o transtorno'],
  [/\b(?:resultado|sucesso|efic[aá]cia) (?:garantid[oa]|assegurad[oa])\b/i, 'garantia de resultado'],
  [/\b100\s?% (?:eficaz|seguro|garantido|de sucesso)\b/i, 'garantia absoluta'],
  [/\bsem (?:nenhum )?efeito(?:s)? colateral(?:is)?\b/i, 'promessa de ausência de efeitos colaterais'],
  [/\b(?:milagre|milagroso|infal[ií]vel|revolucion[aá]ri[oa])\b/i, 'sensacionalismo'],
  [/\b(?:chocante|voc[eê] n[aã]o vai acreditar|o segredo que os m[eé]dicos)\b/i, 'sensacionalismo (isca de clique)'],
  [/\b(?:atenç[aã]o|urgente|alerta)!{2,}/i, 'alarmismo'],
];

const SIGLAS_PERMITIDAS = new Set(['CRM', 'CRM-BA', 'RQE', 'CVV', 'SAMU', 'CFM', 'APS', 'PAP', 'OMS', 'LGPD', 'TDAH', 'TEA', 'TOC', 'TAG', 'IA', 'BA', 'CID', 'DSM', 'SUS', 'ISRS', 'NÃO', 'ESPECIALISTA', 'PMID', 'DOI', 'MEDLINE', 'PUBMED', 'ISRSN', 'RASCUNHO', 'CONFIRMAR']);

const RE_SENSIVEL = /suic[ií]d|autoextermin|tirar (?:a )?(?:minha |a própria )?vida|automutila|(?:me|se) machuc|pensamentos? de morte|overdose|desejo de morrer|n[aã]o (?:quero|queria) mais viver|ideac[aã]o/i;

// As linhas fixas de cada padrão (CFM): 5 no portal/blog/artigo, 3 em Instagram e mídias sociais.
const LINHAS_PORTAL = IDENTIFICACAO_COMPLETA.split('\n');
const LINHAS_SOCIAL = LINHAS_PORTAL.slice(0, 3);

const RE_APRESENTA_COMO_PSIQUIATRA =
  /\b(?:dr\.?|doutor)\s+ant[oô]nio\s+felipe[^.\n]{0,60}\bpsiquiatra\b|\bespecialista em (?:psiquiatria|sa[uú]de mental)\b|\bpsiquiatra (?:dr\.?|doutor)\s+ant[oô]nio/i;

/**
 * @param {string} texto
 * @param {{contexto?: 'portal'|'social', sensivel?: boolean, exigirIdentificacao?: boolean}} [opcoes]
 *   contexto 'portal' (padrão): artigo/blog/página — exige as 5 linhas do CFM.
 *   contexto 'social': legenda/carrossel/vídeo — exige as 3 linhas do padrão sintético.
 *   sensivel: força (true) ou dispensa (false) o CVV; se ausente, detecta pelo texto.
 */
function checarEticaCfm(texto, { contexto = 'portal', sensivel, exigirIdentificacao = true } = {}) {
  const falhas = [];
  const t = String(texto || '');
  if (!t.trim()) return resultado(['texto ausente']);

  for (const [re, motivo] of [...TERMOS_CFM, ...PROMESSA_OU_SENSACIONALISMO]) {
    const m = t.match(re);
    if (m) falhas.push(`CFM: ${motivo} ("${m[0]}")`);
  }

  // Caixa alta de 6+ letras (URGENTE, ATENÇÃO); siglas clínicas curtas (UBS, CAPS, TCC, ECG, ISRS…) não contam.
  const gritado = (t.match(/\b[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ]{6,}\b/g) || []).filter((p) => !SIGLAS_PERMITIDAS.has(p));
  if (gritado.length >= 3) falhas.push(`sensacionalismo: caixa alta em excesso (${gritado.slice(0, 3).join(', ')}…)`);
  if ((t.match(/!/g) || []).length > 3) falhas.push('sensacionalismo: excesso de exclamações');

  if (RE_APRESENTA_COMO_PSIQUIATRA.test(t)) falhas.push('veto: apresenta o Dr. Antônio Felipe como psiquiatra/especialista em psiquiatria ou saúde mental');

  if (exigirIdentificacao) {
    const linhas = contexto === 'social' ? LINHAS_SOCIAL : LINHAS_PORTAL;
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const corpo = norm(t);
    // Conteúdo legado (social) traz a identificação de uma linha: continua válido.
    const legado = contexto === 'social' && corpo.includes(norm(IDENTIFICACAO));
    const ausentes = legado ? [] : linhas.filter((l) => !corpo.includes(norm(l)));
    if (ausentes.length) falhas.push(`identificação CFM incompleta (${contexto === 'social' ? '3' : '5'} linhas): falta "${ausentes.map((l) => l.slice(0, 40)).join('", "')}…"`);
    if (!/CRM-BA 41322/.test(t)) falhas.push('sem CRM-BA 41322');
    if (!/RQE 26638/.test(t)) falhas.push('sem RQE 26638');
  }

  const ehSensivel = sensivel ?? RE_SENSIVEL.test(t);
  if (ehSensivel && !/CVV 188/.test(t)) falhas.push('tema sensível sem o alerta do CVV 188');

  return resultado(falhas);
}

/* ============================ Fluxo de aprovação =========================== */

/**
 * Roda as três checagens. Entradas opcionais: só o que existe é checado.
 * @param {{texto?: string, imagens?: Buffer[], contexto?: 'portal'|'social', sensivel?: boolean,
 *          verificarCantos?: boolean, exigirIdentificacao?: boolean}} peca
 */
async function executarChecagensAprovacao({ texto, imagens = [], contexto = 'portal', sensivel, verificarCantos = false, exigirIdentificacao = true, originalidade: dadosOriginalidade } = {}) {
  const falhasImagem = [];
  for (const [i, img] of imagens.entries()) {
    const r = await checarImagemSemMarcaDagua(img, { verificarCantos });
    falhasImagem.push(...r.falhas.map((f) => `imagem ${i + 1}: ${f}`));
  }
  const imagem = resultado(falhasImagem);
  const humanizacao = texto === undefined ? resultado([]) : checarHumanizacao(texto);
  const etica = texto === undefined ? resultado([]) : checarEticaCfm(texto, { contexto, sensivel, exigirIdentificacao });
  // Opcional: { candidato, acervo, ignorar } — cópia/paráfrase/redundância contra os artigos já publicados.
  const originalidade = dadosOriginalidade
    ? (({ ok, motivos }) => resultado(ok ? [] : motivos))(checarOriginalidade(dadosOriginalidade.candidato, dadosOriginalidade.acervo, { ignorar: dadosOriginalidade.ignorar }))
    : resultado([]);
  const aprovado = imagem.ok && humanizacao.ok && etica.ok && originalidade.ok;
  const motivo = aprovado
    ? null
    : [
        ...imagem.falhas.map((f) => `imagem: ${f}`),
        ...humanizacao.falhas.map((f) => `humanização: ${f}`),
        ...etica.falhas.map((f) => `ética/CFM: ${f}`),
        ...originalidade.falhas.map((f) => `originalidade: ${f}`),
      ].join('; ');
  return { aprovado, motivo, imagem, humanizacao, etica, originalidade };
}

module.exports = {
  checarImagemSemMarcaDagua,
  checarHumanizacao,
  checarEticaCfm,
  executarChecagensAprovacao,
  LINHAS_PORTAL,
  LINHAS_SOCIAL,
};
