/**
 * Checagem AUTOMÁTICA DA ARTE e do TEXTO de aviso das redes (ordens de 08/11/2026, 00:12 e 00:50). Determinística, sem IA.
 * Reprova a peça que não cumprir:
 *   - título ≥ 64 px e corpo ≥ 40 px (tamanho realmente usado, depois do ajuste); ≤ 25 palavras por lâmina;
 *   - contraste WCAG AA (4,5:1); fundo claro (o modelo escuro antigo é proibido);
 *   - fonte e ícone carregados; nada transbordando;
 *   - COLISÃO entre linhas do título (tinta de uma linha encostando na vizinha) medida no render;
 *   - rodapé: 3 linhas nas intermediárias; bloco COMPLETO de 5 linhas na última lâmina;
 *   - aviso: "aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026)"; a palavra "revisado" só com selo válido (registro + hash do texto);
 *   - rótulo: "Sinal de alerta", "Dado" ou "Passo" (ou nenhum); "Dado" exige referência nomeada (autor et al. ou (ano));
 *   - CVV 188 · SAMU 192 na última lâmina.
 */
const crypto = require('node:crypto');

const TITULO_MIN_PX = 64;
const CORPO_MIN_PX = 40;
const PALAVRAS_MAX = 25;
const CONTRASTE_MIN = 4.5;
const FUNDO_LUM_MIN = 0.4;
const ROTULOS = ['Sinal de alerta', 'Dado', 'Passo', 'Para refletir']; // "Para refletir": relatos (ordem de 08/11, pendência 4)
const AVISO_APROVADO = 'aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026)';

function luminancia(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('cor inválida: ' + hex);
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contraste(a, b) {
  const [la, lb] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

/** Selo legítimo para a palavra "revisado": registro (não vazio) e hash SHA-256 do texto exato do aviso. */
function seloValido(texto, selo) {
  if (!selo || !selo.registro || !selo.hash) return false;
  return crypto.createHash('sha256').update(String(texto)).digest('hex') === selo.hash;
}

/** Texto do aviso: "revisado" sem selo legítimo reprova; sem o texto aprovado também reprova. */
function checarAvisoTexto(texto, selo) {
  const falhas = [];
  const t = String(texto || '');
  if (/revisad/i.test(t) && !seloValido(t, selo)) falhas.push({ regra: 'l-aviso-revisado', msg: 'aviso diz "revisado" sem selo legítimo (registro + hash)' });
  if (!t.includes(AVISO_APROVADO) && !seloValido(t, selo)) falhas.push({ regra: 'l-aviso-texto', msg: `aviso fora do texto aprovado: "${AVISO_APROVADO}"` });
  return falhas;
}

/** Texto de legenda/roteiro: a palavra "revisado" no aviso também reprova sem selo. */
function checarAvisoLegenda(legenda, selo) {
  const falhas = [];
  const m = String(legenda || '').match(/[^\n]*revisad[oa][^\n]*/gi) || [];
  for (const linha of m) if (!seloValido(linha, selo)) falhas.push({ regra: 'l-aviso-revisado', msg: `legenda diz "revisado" sem selo: "${linha.trim().slice(0, 80)}"` });
  return falhas;
}

/** Dado precisa de referência nomeada: "et al.", "(ano)" ou norma com número e ano, ex.: "NR-1 (Portaria MTE 1.419/2024)". */
const temReferenciaNomeada = (t) => /et al\.|\(\d{4}\)|Portaria[^()]*\d{4}/.test(String(t || ''));

/**
 * @param {object} lamina medidas: { n, tituloPx, corpoPx, palavras, corCorpo, fundo, transbordou, fonteOk, iconeOk, colisoes, pares,
 *   rodape: { crm, rqe, assinatura3, completo }, rodapeCompleto, final, cvv, aviso, rotulo, corpoTexto }
 */
function checarLamina(lamina) {
  const falhas = [];
  const f = (regra, msg) => falhas.push({ regra, msg });
  const n = lamina.n;
  if (lamina.tituloPx != null && !(lamina.tituloPx >= TITULO_MIN_PX)) f('a-titulo-px', `lâmina ${n}: título ${lamina.tituloPx} px (mínimo ${TITULO_MIN_PX})`);
  if (!(lamina.corpoPx >= CORPO_MIN_PX)) f('b-corpo-px', `lâmina ${n}: corpo ${lamina.corpoPx} px (mínimo ${CORPO_MIN_PX})`);
  if (lamina.palavras > PALAVRAS_MAX) f('c-palavras', `lâmina ${n}: ${lamina.palavras} palavras (máximo ${PALAVRAS_MAX})`);
  const cr = contraste(lamina.corCorpo, lamina.fundo);
  if (cr < CONTRASTE_MIN) f('d-contraste', `lâmina ${n}: contraste ${cr.toFixed(2)}:1 (mínimo ${CONTRASTE_MIN}:1)`);
  if (luminancia(lamina.fundo) < FUNDO_LUM_MIN) f('e-fundo-escuro', `lâmina ${n}: fundo escuro (${lamina.fundo}); o modelo antigo é proibido`);
  if (lamina.transbordou) f('f-transborda', `lâmina ${n}: texto não cabe na lâmina nos tamanhos mínimos`);
  if (lamina.fonteOk === false) f('j-fonte', `lâmina ${n}: fonte editorial (Oswald/Raleway) não carregou`);
  if (lamina.iconeOk === false) f('k-icone', `lâmina ${n}: ícone 3D não carregou`);
  if (lamina.colisoes > 0) f('m-colisao-linhas', `lâmina ${n}: ${lamina.colisoes} colisão(ões) entre linhas do título (${(lamina.pares || []).join(' | ').slice(0, 160)})`);
  if (lamina.rotulo != null && !ROTULOS.includes(lamina.rotulo)) f('o-rotulo', `lâmina ${n}: rótulo "${lamina.rotulo}" fora de Sinal de alerta / Dado / Passo`);
  if (lamina.rotulo === 'Dado' && !temReferenciaNomeada(lamina.corpoTexto)) f('n-dado-sem-referencia', `lâmina ${n}: rótulo "Dado" sem referência nomeada (autor et al. ou ano)`);
  if (!lamina.final && (!lamina.rodape || !lamina.rodape.crm || !lamina.rodape.rqe || !lamina.rodape.assinatura3)) f('g-rodape', `lâmina ${n}: rodapé de 3 linhas incompleto`);
  if (lamina.final) {
    if (!lamina.rodapeCompleto) f('g2-rodape-completo', `lâmina ${n}: última lâmina sem o bloco completo de 5 linhas (com pós-graduações e NÃO ESPECIALISTA)`);
    if (!lamina.cvv) f('h-cvv', 'última lâmina sem "CVV 188 · SAMU 192"');
    if (!lamina.aviso) f('i-aviso-ia', 'última lâmina sem o aviso de IA (Res. CFM 2.454/2026)');
    else for (const x of checarAvisoTexto(lamina.aviso, lamina.selo)) f('l-aviso', `lâmina ${n}: ${x.msg}`);
  }
  return { aprovado: falhas.length === 0, falhas, contraste: Number(cr.toFixed(2)) };
}

/** Peça inteira: todas as lâminas precisam passar. */
function checarArte(laminas) {
  const porLamina = laminas.map(checarLamina);
  const falhas = porLamina.flatMap((r) => r.falhas);
  return { aprovado: falhas.length === 0 && laminas.length > 0, falhas, porLamina };
}

module.exports = {
  checarArte, checarLamina, checarAvisoTexto, checarAvisoLegenda, seloValido, temReferenciaNomeada, luminancia, contraste,
  TITULO_MIN_PX, CORPO_MIN_PX, PALAVRAS_MAX, CONTRASTE_MIN, FUNDO_LUM_MIN, ROTULOS, AVISO_APROVADO,
};
