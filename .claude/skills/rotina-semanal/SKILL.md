---
name: rotina-semanal
description: Rotina de segunda-feira do Portal: auditoria completa, retratações, links, token, freio das redes, próximos 7 posts e narração. Somente leitura.
---
Rode `npm run rotina-semanal` (também roda sozinha pelo Agendador do Windows, segunda 07:30 — ver `scripts/agendar-tarefas-windows.ps1`).
1. Leia `relatorios/rotina-AAAAMMDD.md` e o bloco "Rotina semanal" de `relatorios/ESTADO-GERAL.md`.
2. Link que falhou 2 semanas seguidas com alternativa oficial: `node --env-file=.env backend/scripts/trocarLinkAlternativo.js` (dry-run) e só então `--aplicar`.
3. 403/429 de editoras são ignorados; só 404/410/DNS/timeout (45 s, 2 tentativas) contam.
4. Retratação encontrada = texto reprovado: proponha a troca da referência (trecho atual → proposto → motivo) e espere o OK.
Relate em 5 linhas: encontrado / corrigido / aguardando decisão. Nunca imprima o `.env`.
