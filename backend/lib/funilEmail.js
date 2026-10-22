/**
 * Captura de e-mail do miniaplicativo e encaminhamento ao funil (Pocketsflow). Funções puras: a rota só lê a decisão.
 *
 * Santuário digital: o payload leva SOMENTE e-mail, consentimento, origem e produto. Respostas de humor, diário e
 * autoavaliação nunca entram aqui (ficam no navegador).
 *
 * Variáveis: POCKETSFLOW_API_KEY e POCKETSFLOW_WEBHOOK_URL ativam o envio. EMAIL_SERVICE_API_KEY fica reservada para um
 * provedor de e-mail direto, caso o funil saia do Pocketsflow. Sem as chaves, a rota responde 503 e não quebra.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MENSAGEM_DESATIVADO = 'Serviço de envio temporariamente desativado por ausência de chaves de serviço.';

/** Configuração do funil lida do ambiente (sem valores em log). */
function lerConfigFunil(env = process.env) {
  const ativo = Boolean(env.POCKETSFLOW_API_KEY && env.POCKETSFLOW_WEBHOOK_URL);
  return { ativo, url: env.POCKETSFLOW_WEBHOOK_URL || '', chave: env.POCKETSFLOW_API_KEY || '' };
}

/** Valida o pedido. Honeypot preenchido = robô: finge sucesso sem encaminhar. */
function validarCaptura(corpo = {}) {
  if (typeof corpo.website === 'string' && corpo.website.trim() !== '') return { robo: true };
  const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return { erro: 'Informe um e-mail válido.' };
  if (corpo.consentimento !== true) return { erro: 'Para receber a rotina, confirme o consentimento de privacidade (LGPD).' };
  return { email };
}

/** Payload enviado ao funil: só o necessário. */
function montarPayloadFunil({ email }, agora = new Date()) {
  return {
    email,
    origem: 'miniaplicativo',
    produto: 'guia-pensamentos-ansiosos-21-dias',
    consentimentoEm: agora.toISOString(),
  };
}

/** Decide a resposta da rota, sem I/O: {status, corpo, encaminhar?}. */
function decidirCaptura({ corpo, config }) {
  if (!config.ativo) return { status: 503, corpo: { erro: MENSAGEM_DESATIVADO } };
  const v = validarCaptura(corpo);
  if (v.robo) return { status: 202, corpo: { ok: true } };
  if (v.erro) return { status: 400, corpo: { erro: v.erro } };
  return { status: 202, corpo: { ok: true }, encaminhar: montarPayloadFunil(v) };
}

module.exports = { lerConfigFunil, validarCaptura, montarPayloadFunil, decidirCaptura, MENSAGEM_DESATIVADO };
