# Alertas por e-mail (Resend, gratuito)

Destinatário: doutor.antoniofelipe.saudemental@gmail.com
Código: `scripts/alertas/enviarAlerta.js` (usado pela conferência diária às 09:30). **Desligado** enquanto `RESEND_API_KEY` não existir no `.env`.

## Passo a passo (você faz, uma vez)

1. Crie uma conta gratuita em https://resend.com com o e-mail do consultório. Confira no site o limite do plano gratuito antes de usar.
2. No painel, vá em **API Keys → Create API Key**. Permissão: **Sending access**. Copie a chave (ela aparece uma vez só).
3. Abra o arquivo `.env` na raiz do projeto (o Claude Code não lê esse arquivo) e acrescente:
   ```
   RESEND_API_KEY=cole_a_chave_aqui
   ```
   Opcional: `ALERTA_EMAIL_REMETENTE="Portal DrSM <onboarding@resend.dev>"` (já é o padrão).
4. Sem domínio próprio, o remetente `onboarding@resend.dev` só entrega para o e-mail da própria conta Resend. Se a conta for o Gmail acima, funciona.
5. Pronto: a partir da próxima conferência com falha, o e-mail chega. Para desligar, apague a linha `RESEND_API_KEY` do `.env`.

## O que o e-mail traz

- Assunto: `[DrSM] N falha(s) na conferência AAAA-MM-DD`.
- Corpo: a lista das falhas e o caminho do relatório. Nada de dados de pacientes: o código recusa texto com CPF ou com a palavra CID.

## Teste

O teste de envio real só roda depois que você criar a variável e pedir ("testar alerta por e-mail"). Os testes automáticos (`tests/unit/alerta-email.test.js`) não enviam nada.
