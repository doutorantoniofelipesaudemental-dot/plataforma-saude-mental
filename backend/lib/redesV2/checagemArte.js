/**
 * Checagem AUTOMÁTICA DA ARTE das redes (ordem de 08/11/2026, 00:12, item B2). Determinística, sem IA.
 * Mede a lâmina já renderizada (1080×1350) e reprova a peça que não cumprir:
 *   - título com no mínimo 64 px e texto de corpo com no mínimo 40 px (tamanho realmente usado, depois do ajuste);
 *   - no máximo 25 palavras por lâmina (rodapé de identificação não conta);
 *   - contraste WCAG AA: texto × fundo de no mínimo 4,5:1;
 *   - fundo claro: o modelo escuro antigo é reprovado (luminância do fundo ≥ 0,4);
 *   - nada transbordando a lâmina; rodapé com CRM e RQE; CVV 188 · SAMU 192 e aviso de IA na última lâmina.
 * A medição é feita por backend/lib/redesV2/arteEditorial.js (Playwright). Esta função só aplica as regras.
 */
const TITULO_MIN_PX = 64;
const CORPO_MIN_PX = 40;
const PALAVRAS_MAX = 25;
const CONTRASTE_MIN = 4.5;
const FUNDO_LUM_MIN = 0.4;

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

/**
 * @param {object} lamina medidas de uma lâmina: { n, tituloPx, corpoPx, palavras, corCorpo, fundo, transbordou, rodape: { crm, rqe, assinatura3 }, final, cvv, aviso }
 * @returns {{aprovado: boolean, falhas: {regra: string, msg: string}[], contraste: number}}
 */
function checarLamina(lamina) {
  const falhas = [];
  const f = (regra, msg) => falhas.push({ regra, msg });
  const n = lamina.n;
  if (!(lamina.tituloPx >= TITULO_MIN_PX)) f('a-titulo-px', `lâmina ${n}: título ${lamina.tituloPx} px (mínimo ${TITULO_MIN_PX})`);
  if (!(lamina.corpoPx >= CORPO_MIN_PX)) f('b-corpo-px', `lâmina ${n}: corpo ${lamina.corpoPx} px (mínimo ${CORPO_MIN_PX})`);
  if (lamina.palavras > PALAVRAS_MAX) f('c-palavras', `lâmina ${n}: ${lamina.palavras} palavras (máximo ${PALAVRAS_MAX})`);
  const cr = contraste(lamina.corCorpo, lamina.fundo);
  if (cr < CONTRASTE_MIN) f('d-contraste', `lâmina ${n}: contraste ${cr.toFixed(2)}:1 (mínimo ${CONTRASTE_MIN}:1)`);
  if (luminancia(lamina.fundo) < FUNDO_LUM_MIN) f('e-fundo-escuro', `lâmina ${n}: fundo escuro (${lamina.fundo}); o modelo antigo é proibido`);
  if (lamina.transbordou) f('f-transborda', `lâmina ${n}: texto não cabe na lâmina nos tamanhos mínimos`);
  if (lamina.fonteOk === false) f('j-fonte', `lâmina ${n}: fonte editorial (Oswald/Raleway) não carregou`);
  if (lamina.iconeOk === false) f('k-icone', `lâmina ${n}: ícone 3D não carregou`);
  if (!lamina.rodape || !lamina.rodape.crm || !lamina.rodape.rqe || !lamina.rodape.assinatura3) f('g-rodape', `lâmina ${n}: rodapé de identificação incompleto`);
  if (lamina.final) {
    if (!lamina.cvv) f('h-cvv', 'última lâmina sem "CVV 188 · SAMU 192"');
    if (!lamina.aviso) f('i-aviso-ia', 'última lâmina sem o aviso de IA (Res. CFM 2.454/2026)');
  }
  return { aprovado: falhas.length === 0, falhas, contraste: Number(cr.toFixed(2)) };
}

/** Peça inteira: todas as lâminas precisam passar. */
function checarArte(laminas) {
  const porLamina = laminas.map(checarLamina);
  const falhas = porLamina.flatMap((r) => r.falhas);
  return { aprovado: falhas.length === 0 && laminas.length > 0, falhas, porLamina };
}

module.exports = { checarArte, checarLamina, luminancia, contraste, TITULO_MIN_PX, CORPO_MIN_PX, PALAVRAS_MAX, CONTRASTE_MIN, FUNDO_LUM_MIN };
