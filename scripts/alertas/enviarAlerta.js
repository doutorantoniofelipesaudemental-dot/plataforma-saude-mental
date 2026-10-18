/**
 * Alerta por e-mail (Resend, plano gratuito). DESLIGADO até a variável RESEND_API_KEY existir no .env.
 * Passo a passo para ligar: docs/alertas-email.md. Nunca imprime a chave.
 * Só envia alertas de sistema (falhas de conferência, token, fila). Nada de dados de pacientes ou de saúde no texto.
 */
const DESTINO = 'doutor.antoniofelipe.saudemental@gmail.com';
const URL_API = 'https://api.resend.com/emails';
const MAX_TEXTO = 2000;

// Recusa texto com cara de dado pessoal de saúde (CPF, e-mail de paciente, CID): alerta de sistema não precisa disso.
function textoSeguro(texto) {
  if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(texto)) return false;
  if (/\bCID\b|\bCID-?10\b/i.test(texto)) return false;
  return true;
}

// Função com dependências injetadas (fetch e env) para teste sem rede.
async function enviarAlerta({ assunto, texto }, { env = process.env, fetchFn = fetch } = {}) {
  if (!env.RESEND_API_KEY) return { enviado: false, motivo: 'desligado: RESEND_API_KEY ausente' };
  if (!assunto || !texto) return { enviado: false, motivo: 'assunto ou texto vazio' };
  if (!textoSeguro(`${assunto}\n${texto}`)) return { enviado: false, motivo: 'texto recusado (possível dado pessoal de saúde)' };
  const corpo = texto.slice(0, MAX_TEXTO);
  try {
    const r = await fetchFn(URL_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.ALERTA_EMAIL_REMETENTE || 'Portal DrSM <onboarding@resend.dev>',
        to: [DESTINO],
        subject: `[DrSM] ${assunto}`.slice(0, 150),
        text: corpo,
      }),
      signal: AbortSignal.timeout(20000),
    });
    return r.ok ? { enviado: true } : { enviado: false, motivo: `API respondeu HTTP ${r.status}` };
  } catch (e) {
    return { enviado: false, motivo: `falha de rede: ${e.message.slice(0, 80)}` };
  }
}

module.exports = { enviarAlerta, textoSeguro, DESTINO };
