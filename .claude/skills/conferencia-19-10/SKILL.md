---
name: conferencia-19-10
description: Conferência de 19/10/2026 às 19h30 (Bahia): primeira renovação automática do token do Instagram e primeira publicação automática de textos agendados.
---
Roda sozinha às 19:30 de 19/10/2026 pelo Agendador do Windows (`scripts/agendar-tarefas-windows.ps1`). Manual:
`node --env-file=.env scripts/conferirPosRenovacao.js` → `relatorios/conferencia-renovacao-AAAAMMDD.md`.
Conferir também: textos publicados em 19/10 (cron `publicar-agendados`, 11:00 UTC) tocam o áudio narrado (hash `ok`), `npm run auditoria` sem falhas e o freio `REDES_PUBLICACAO_ATIVA`. Divergência: não corrigir sozinho; relatar e, se for o token, usar `docs`/`relatorios/SE-ALGO-DER-ERRADO.md`.
