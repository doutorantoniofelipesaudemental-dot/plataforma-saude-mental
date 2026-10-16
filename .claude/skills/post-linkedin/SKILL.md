---
name: post-linkedin
description: Produz posts, carrosséis em PDF e artigos mensais do LinkedIn (profissionais de saúde, gestores e RH) com tom de autoridade e conformidade CFM.
---
Pipeline: `npm run linkedin:conteudo` (`scripts/linkedin/gerarConteudo.js`, dry-run por padrão; `--aplicar` grava a fila no Mongo e as pastas manuais), `scripts/linkedin/gerarPerfil.js` (perfil e proposta da /mentoria), publicação por cron da Vercel (`/api/cron/publicar-linkedin`, freio `LINKEDIN_PUBLICACAO_ATIVA`). Guia: `relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md`. Posts 1.300–2.000 caracteres: gancho, 3 a 5 pontos práticos, referência, link do texto, assinatura curta. Nunca: caso identificável, promessa, depoimento, antes/depois. Segunda, quarta e sexta, 19:30 (Bahia). Post da /mentoria é PROPOSTA e nunca entra na fila. Validar com `checarEticaCfm`.
