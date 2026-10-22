# LinkedIn na nuvem: comparação (fase 3, 20/10/2026). Só análise; nada implementado.

Fontes: pesquisa de 20/10/2026 em fornecedores de agendamento (OpenTweet, PostPeer, TimeToPost) e guias de desenvolvedor. **Não encontrei na documentação oficial do LinkedIn** a regra de automação de posts nem a política de token; por isso os pontos marcados "a confirmar" precisam de checagem em developer.linkedin.com e na User Agreement antes de qualquer implementação.

## (A) Continuar como hoje: Chrome do PC + agendador nativo do LinkedIn

- **Como funciona:** a tarefa `DrSM-LinkedIn-Agendar` (11:00) abre o Chrome com o perfil logado e usa o agendador nativo do LinkedIn. Até 3 posts por dia, com trava de duplicidade no banco.
- **Riscos para a conta:** a automação age numa sessão real de navegador. Se o LinkedIn pedir verificação, o sistema para (regra de PARAR), sem contornar.
- **O que você precisa fazer:** manter o PC ligado às 11:00 (ou aceitar que a tarefa roda ao ligar) e fazer login/CAPTCHA quando cair.
- **Limites:** o agendador nativo aceita datas à frente; o teto diário é nosso (3/dia). Risco de recusa de datas muito distantes, a confirmar no painel.
- **Agenda ou publica na hora?** Agenda, pelo próprio LinkedIn: o post sai no horário mesmo com o PC desligado depois do agendamento.
- **Termos:** a automação de navegador é o ponto de maior atrito com os termos do LinkedIn. **A confirmar.**

## (B) API oficial "Share on LinkedIn" (w_member_social) + cron da Vercel

- **Como funciona:** um cron da Vercel publica no horário, por chamada à API, com o token da sua conta.
- **Riscos para a conta:** baixo risco de bloqueio se usada só para publicar conteúdo próprio pela API oficial. O risco principal é operacional: o token.
- **O que você precisa fazer:** criar um app no LinkedIn Developer Portal, adicionar o produto "Share on LinkedIn" (sem revisão, segundo fornecedores), autorizar o login OAuth da sua conta e **renovar a autorização a cada 60 dias**, porque o app comum não recebe refresh token (só parceiros recebem). Isso é login seu, a cada 60 dias.
- **Limites:** a versão da API tem data de aposentadoria (cabeçalho de versão mensal); um fornecedor cita a versão 202510 aposentada em 15/10/2026. Precisa acompanhar a versão em uso.
- **Agenda ou publica na hora?** **Só publica na hora.** O endpoint de criação aceita apenas `PUBLISHED`. O agendamento passa a ser nosso (fila no banco + cron), o que dá controle total, mas exige que o cron rode no minuto certo.
- **Termos:** publicar pela API oficial é um uso previsto, mas a regra sobre agendamento automático e cadência **a confirmar** na política de desenvolvedor.

## Recomendação

**Manter (A) por enquanto**, e preparar (B) para depois da confirmação dos termos. Motivos:
1. (B) tira o PC do caminho, mas troca um risco conhecido (o agendador já funciona e tem trava) por um risco ainda não confirmado (termos da API para agendamento).
2. Em (B) você também faz login a cada 60 dias. Ou seja, não elimina o seu trabalho manual, só o muda de lugar.
3. A fila atual tem 26 posts aprovados; o agendador nativo cobre o período com as travas. Não há urgência para trocar.

Decisão de implementar (B) fica com você. Antes de decidir: confirmar na documentação do LinkedIn (a) se agendamento automático via API é permitido, (b) a versão vigente da API, (c) o procedimento de renovação do token do app comum.
