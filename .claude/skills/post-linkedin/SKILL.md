---
name: post-linkedin
description: Produz posts, carrosséis em PDF e artigos mensais do LinkedIn (profissionais de saúde, gestores e RH) com tom de autoridade e conformidade CFM.
---
Pipeline em `scripts/linkedin/` (ver `relatorios/linkedin/README.md`): `gerarPosts.js`, `gerarCarrosseis.js`, `montarFila.js`, `publicarLinkedin.js` (cron; freio `LINKEDIN_PUBLICACAO_ATIVA`). Posts 1.300–2.000 caracteres: gancho, 3 a 5 pontos práticos, referência, link do texto, assinatura curta. Nunca: caso identificável, promessa, depoimento, antes/depois. Segunda, quarta e sexta, 19:30 (Bahia). Post da /mentoria é PROPOSTA e nunca entra na fila. Validar com `checarEticaCfm`.
