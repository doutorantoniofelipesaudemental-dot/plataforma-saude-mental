# Fontes: promoção e rollback na Vercel (consultadas em 25/10/2026)

Arquivo novo (não existia em `main`). Uma linha por fonte.

- (a) Deploy de produção sem ir ao ar, antes de validar: https://vercel.com/docs/cli/deploy — `--skip-domain` só com `--prod`; desativa a promoção automática dos domínios do novo deploy e sobrescreve a configuração de auto-atribuição do projeto. Promoção depois com `vercel promote`.
- (a) Staging e promoção manual: https://vercel.com/changelog/stage-and-manually-promote-deployments-to-production — mesmo fluxo (criar sem domínio, promover depois).
- (a) Relato não confirmado: https://community.vercel.com/t/create-a-manual-preview-deployment-without-changing-existing-alias-mappings/50332 — `--skip-domain` pode manter aliases derivados de time/autor. Validar no próprio projeto.
- (b) Depois de rollback, deploys novos NÃO são promovidos sozinhos: https://vercel.com/docs/instant-rollback — a atribuição automática de domínios de produção é desligada após o rollback; volta com promoção (botão "Undo Rollback" no painel ou `vercel promote`).
- (b) Mesmo ponto, na documentação de rollback: https://vercel.com/docs/deployments/rollback-production-deployment
- (c) Como promover: https://vercel.com/docs/deployments/promoting-a-deployment — `vercel promote [deployment-id ou URL]`; reativa os domínios.
- (c) Como voltar: https://vercel.com/docs/cli/rollback — `vercel rollback [deployment-id ou URL]`; no plano Hobby só para o deploy imediatamente anterior; em Pro e Enterprise para qualquer deploy elegível.
- (c) Rolling releases (não usado aqui): https://vercel.com/docs/rolling-releases

Nota: a pesquisa não confirmou o comportamento de variáveis de ambiente e crons em deploy criado com `--skip-domain`. Verificar após o primeiro deploy de teste.
