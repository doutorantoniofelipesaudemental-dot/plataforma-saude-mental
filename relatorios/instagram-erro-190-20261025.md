# Erro 190 da Meta: "user has not authorized application" (25/10/2026)

Pesquisa só de leitura. Os nomes dos menus da Meta mudam: conferir na tela. Nenhum token foi impresso nem chamado.

## 1. O que o erro significa
- Código 190 = token de acesso OAuth inválido (Marketing API, tabela de erros). A mensagem "user has not authorized application" indica que o usuário não autorizou o app que o token diz usar.
- Fontes: https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference e https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling
- Subcódigos ligados ao 190 (Facebook Login): 458 (usuário desautorizou o app), 460 (sessão encerrada), 463 (sessão expirada). O verificador de 25/10 não imprimiu o subcódigo: confirmar.

## 2. Diferença para "API access deactivated"
- 190 = o token foi recusado. "Access deactivated" = a conta ou o acesso à API foi restringido. Os passos são diferentes: no 190 se gera token novo; no outro, a conta ou o app precisa ser liberado.

## 3. Causas, por probabilidade no meu caso (estimativa)
1. Usuário desautorizou o app ou a senha/sessão mudou (compatível com a mensagem).
2. Token não renovado e expirado (token de longa duração vale 60 dias; renovação só se ainda estiver válido).
3. Token gerado em outro app (o erro cita o app 2037156996934639; comparar com o app que o projeto usa).
4. App em modo de desenvolvimento e conta não cadastrada como testador, ou convite não aceito.
5. Permissões revogadas no Instagram.
6. Token de tipo antigo (Facebook Login em vez de Instagram Login).

## 4. Passos para corrigir (sem copiar segredos)
1. developers.facebook.com → Meus apps: abrir o app cujo ID é o do erro e o app configurado no projeto; confirmar se são o mesmo.
2. Se o app estiver em Desenvolvimento: Funções do app → Testadores do Instagram; no Instagram, aceitar o convite (Configurações → Sites e apps → Convites).
3. Gerar token novo pelo fluxo Instagram Login (Business Login) com este app, aceitando as permissões de publicação. Doc: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login (conferir os nomes das permissões de publicação na página).
4. Trocar o token curto por longa duração no servidor (doc acima) e colocar só na variável de ambiente. Atenção: com credencial cifrada no banco, o publicador usa o token do banco (ver registro fase 2, item 3). Para o token novo valer, rodar a renovação pelo cron ou pelo comando manual, que grava a credencial nova no banco.
5. Confirmar sem expor o token: Ferramenta de Depuração de Token do painel (mostra validade e escopos sem exibir o valor). Não usar o verificador enquanto a ordem proibir chamadas à Meta.

## 5. Fontes (uma linha cada)
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference: 190 = token OAuth inválido.
- https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling: subcódigos 458, 460, 463.
- https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login: fluxo de token do Instagram Login.
- https://smashballoon.com/doc/api-error-190-error-validating-access-token/: terceiro (plugin), só como contexto; fraco.

## 6. Limites da pesquisa
- Não achei página oficial que liste subcódigos do Instagram Login para o 190. A pesquisa não confirmou a causa; ela só ordena hipóteses.
