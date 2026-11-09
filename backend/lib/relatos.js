/**
 * Regra dos "Relatos da Prática" (ordem de 09/11/2026, item 7). Só checagem e texto fixo:
 * nenhum texto é alterado aqui. A nota de ficção é o texto aprovado pelo Dr. Antônio Felipe.
 */

const NOTA_FICCAO_TEXTO =
  'Relato literário inspirado na prática clínica. Personagens, nomes, lugares e detalhes foram criados para proteger a identidade das pessoas. Qualquer semelhança é coincidência.';

const NOTA_FICCAO = `${NOTA_FICCAO_TEXTO} (Código de Ética Médica, art. 75).`;

const RE_REFERENCIAS = /^\s*#{0,6}\s*\**\s*Refer[êe]ncias\b/im;
const RE_CLINICO = /\b(sintomas?|diagn[óo]sticos?|tratamentos?|medicamentos?|doses?|sinais?)\b|\b\d+\s?mg\b/i;
const RE_SUICIDIO = /suic[íi]dio|autoles[ãa]o|tirar a pr[óo]pria vida|se matou/i;
const RE_CAIXA_ENTENDER = /Para entender/;

/**
 * Lista os problemas de um relato (array vazio = conforme).
 * `texto` é o corpo em Markdown/texto do relato, sem metadados.
 */
function checarRelato(texto) {
  const corpo = String(texto || '');
  const problemas = [];

  if (!corpo.includes(NOTA_FICCAO_TEXTO)) problemas.push('nota-ficcao-ausente');
  if (RE_REFERENCIAS.test(corpo)) problemas.push('lista-de-referencias-na-narrativa');
  if (RE_CLINICO.test(corpo) && !RE_CAIXA_ENTENDER.test(corpo)) problemas.push('informacao-clinica-sem-caixa-para-entender');
  if (RE_SUICIDIO.test(corpo)) {
    if (!/CVV 188/.test(corpo) || !/SAMU 192/.test(corpo)) problemas.push('suicidio-sem-CVV-SAMU');
    if (/cometeu suic[íi]dio/i.test(corpo)) problemas.push('linguagem-cometeu-suicidio');
  }

  return problemas;
}

module.exports = { NOTA_FICCAO, NOTA_FICCAO_TEXTO, checarRelato };
