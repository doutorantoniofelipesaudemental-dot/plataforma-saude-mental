/**
 * Classifica o resultado do clique em "Agendar" no LinkedIn (função pura, sem DOM; o gerador embute o código desta função
 * no script que roda na página, por isso ela não pode usar nada de fora).
 *   avisos   textos dos avisos da tela (role=alert / toast); NUNCA o texto inteiro do feed ("Usuário verificado" não é bloqueio)
 *   caminho  location.pathname depois do clique
 * Devolve { estado: 'sucesso' | 'limite' | 'bloqueio' | 'incerto', motivo }.
 *   sucesso   aviso "Publicação agendada" (vale mesmo que haja outros avisos);
 *   limite    "Você atingiu o limite de publicações de hoje": parar, deixar o resto para amanhã;
 *   bloqueio  verificação, CAPTCHA, login ou atividade incomum (aviso ou página de checkpoint/login): parar e chamar o Dr. Antônio;
 *   incerto   nenhum aviso conhecido: não conta como agendado.
 */
function classificarAviso({ avisos = [], caminho = '' } = {}) {
  const texto = avisos.join(' | ');
  if (/Publicação agendada/i.test(texto)) return { estado: 'sucesso', motivo: '' };
  if (/atingiu o limite|limite de publica/i.test(texto)) return { estado: 'limite', motivo: (texto.match(/Você atingiu[^.|]*/) || ['limite de publicações'])[0] };
  if (/\/(checkpoint|uas\/login|authwall)/i.test(caminho) || /verifica[çc][ãa]o|captcha|atividade incomum|confirme que (é|e) voc[êe]|restri[çc][ãa]o/i.test(texto)) {
    return { estado: 'bloqueio', motivo: texto.slice(0, 120) || `página ${caminho}` };
  }
  return { estado: 'incerto', motivo: texto.slice(0, 120) };
}

module.exports = { classificarAviso };
