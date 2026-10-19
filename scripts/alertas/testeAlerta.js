/**
 * Teste do alerta por e-mail: npm run alerta:teste. Só envia se RESEND_API_KEY existir. Imprime só o resultado, nunca a chave.
 */
const { enviarAlerta } = require('./enviarAlerta');

enviarAlerta({ assunto: 'teste do alerta (lote 1)', texto: 'Teste de envio do Portal DrSM. Se você recebeu, o alerta por e-mail está ligado.' })
  .then((r) => {
    console.log(r.enviado ? 'e-mail de teste: ENVIADO' : `e-mail de teste: NÃO enviado (${r.motivo})`);
    process.exit(r.enviado ? 0 : 1);
  });
