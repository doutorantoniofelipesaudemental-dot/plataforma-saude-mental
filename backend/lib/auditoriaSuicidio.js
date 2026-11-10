/**
 * Triagem de relatos que tocam em suicídio/autolesão (ordem de 09/11/2026, item 3). Determinística, sem IA externa.
 * Critérios de risco de sugestão (OMS 2023, "Preventing suicide"): evitar método, local e detalhe do meio;
 * foco em quem atravessou a crise e encontrou ajuda. Esta triagem é só SUGESTÃO: quem decide é o Dr. Antônio.
 *
 *  a) método descrito            b) local descrito         c) detalhe do meio/quantidade
 *  d) desfecho sem esperança ou sem caminho de ajuda        e) linguagem "cometeu"
 * Nível: ALTO = a, b ou c · MÉDIO = d ou e · BAIXO = toca no tema sem nenhum critério acima.
 */
const { RE_SUICIDIO } = require('./relatos');

const CRITERIOS = {
  a: /(enforc|corda (?:no|ao|em volta|de|ao redor)|laço no|veneno|overdose|tom(?:ou|ar|aram) (?:todos|todas|\d+|um frasco|uma caixa)|comprimidos|pílulas|pilulas|lâmina|lamina|navalha|gilete|cortou|cortes? (?:nos|no|nas|na) (?:pulsos?|bra[çc]o|pele)|arma de fogo|revólver|revolver|pistola|se jogou|pulou|afogar|afogou|monóxido|sufoc)/i,
  b: /(ponte|viaduto|telhado|sacada|trilho|represa|(?:no|ao|do|pelo|para o) rio\b|prédio|edifício|andar de cima|banheiro|garagem|cobertura|janela aberta|no alto de)/i,
  c: /(\d+\s*(?:comprimidos|pílulas|pilulas|caixas|frascos|cartelas|mg|gotas)|todos os comprimidos|todas as pílulas|dose letal|quantidade de)/i,
  d: /(não (?:havia|tinha) (?:mais )?saída|sem saída|sem esperança|não (?:havia|tinha) (?:mais )?(?:ajuda|jeito)|ninguém (?:percebeu|viu|ajudou|soube)|morreu|\bmorte\b|\bmorto\b|desistiu|suicidou)/i,
  e: /cometeu/i,
};

/** Trecho de no máximo uma linha, em torno do primeiro trigger encontrado. */
function evidencia(texto, re) {
  const m = re.exec(texto);
  if (!m) return '';
  const ini = Math.max(0, m.index - 70);
  const fim = Math.min(texto.length, m.index + m[0].length + 70);
  return `${ini > 0 ? '…' : ''}${texto.slice(ini, fim).replace(/\s+/g, ' ').trim()}${fim < texto.length ? '…' : ''}`.slice(0, 180);
}

/**
 * Classifica um relato. `texto` é o corpo (HTML é removido aqui).
 * Retorna { toca, nivel, criterios: [a..e marcados], evidencia }. Relatos que não tocam em suicídio saem com nivel ''.
 */
function classificarRelatoSuicidio(texto) {
  const puro = String(texto || '').replace(/<[^>]+>/g, ' ');
  if (!RE_SUICIDIO.test(puro)) return { toca: false, nivel: '', criterios: [], evidencia: '' };
  // a, b e c só contam perto de uma menção a suicídio/autolesão (300 caracteres): "banheiro" ou "prédio" numa cena
  // cotidiana não é local de método. d e e valem pelo próprio texto.
  const posicoes = [];
  const reSui = new RegExp(RE_SUICIDIO.source, 'gi');
  let m;
  while ((m = reSui.exec(puro))) posicoes.push(m.index);
  const perto = (re) => {
    const g = new RegExp(re.source, 'gi');
    let x;
    while ((x = g.exec(puro))) if (posicoes.some((p) => Math.abs(p - x.index) <= 300)) return true;
    return false;
  };
  const criterios = Object.keys(CRITERIOS).filter((k) => (k === 'a' || k === 'b' || k === 'c' ? perto(CRITERIOS[k]) : CRITERIOS[k].test(puro)));
  const nivel = criterios.some((k) => 'abc'.includes(k)) ? 'ALTO' : criterios.length ? 'MÉDIO' : 'BAIXO';
  const primeiro = criterios[0];
  const trecho = evidencia(puro, primeiro ? CRITERIOS[primeiro] : RE_SUICIDIO);
  return { toca: true, nivel, criterios, evidencia: trecho };
}

module.exports = { classificarRelatoSuicidio, CRITERIOS };
