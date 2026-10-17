# Política de Privacidade — acréscimo aprovado: "Uso da API do YouTube" (16/10/2026)

**Aprovação:** o Dr. Antônio Felipe aprovou por escrito, em 16/10/2026, o acréscimo de uma seção curta sobre o uso da API do YouTube, exigida pelo Google para a auditoria da API ("APROVADO; exigido pelo Google"). Escopo aprovado: acrescentar a seção em `public/privacidade.html` e na `/privacidade` do app Next, atualizar a data "Última atualização", **sem mudar o restante do texto já aprovado**.

## O que mudou
Arquivos: `public/privacidade.html` e `apps/plataforma-saude-mental/app/privacidade/page.js`.

1. **Nova seção** (no site principal, "11. Uso da API do YouTube"; no app Next, um item da lista de resumo):
   > O Portal usa os Serviços de API do YouTube apenas para publicar e organizar os vídeos do próprio canal do Portal (envio dos vídeos, das miniaturas e das listas de reprodução). Por meio dessa API, não coletamos, não armazenamos e não compartilhamos dados de visitantes deste site nem de usuários do YouTube.
   >
   > O YouTube é um serviço do Google e está sujeito aos [Termos de Serviço do YouTube](https://www.youtube.com/t/terms) e à [Política de Privacidade do Google](https://policies.google.com/privacy). O acesso do Portal à conta do canal foi concedido pelo titular do canal, que pode revogá-lo a qualquer momento em [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
2. **Numeração:** a antiga seção "11. Alterações" passou a "12. Alterações" (só o número do título, por causa da seção nova). O texto dela mudou apenas na data.
3. **Data:** "Última atualização: 15/10/2026" → **16/10/2026** (cabeçalho do site, seção "Alterações" e texto do app Next).
4. Nenhuma outra frase foi alterada.

## LinkedIn (item 5.3)
Não foi acrescentada linha sobre o LinkedIn: o uso é só publicar na conta do próprio titular, sem coletar nem guardar dados de terceiros, e a política de privacidade já informa que o site não coleta dados de visitantes. A política do LinkedIn não exige menção específica para esse uso. Se o LinkedIn pedir isso na criação do app, a linha equivalente à do YouTube é: "O Portal usa a API do LinkedIn apenas para publicar conteúdo na conta do titular; não coleta, não armazena e não compartilha dados de visitantes nem de usuários do LinkedIn." (só entra com novo OK).

## Backup e rollback
- Backup dos dois arquivos antes da edição: `backups/privacidade-20261016-2320/` (`privacidade.html` e `page.js`), conferidos (abriram, 11 seções).
- Rollback: copiar de volta os dois arquivos do backup e publicar, ou reverter o commit do PR desta alteração.
- Conferência pós-deploy: página `/privacidade` do site principal no ar com a seção 11 e a data 16/10/2026 (registrada no relatório da etapa).
