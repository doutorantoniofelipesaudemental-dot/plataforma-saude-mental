---
name: importar-agendar-textos
description: Importa lotes de textos novos (importacao-completa/importacao) e agenda a publicação, com backup, dry-run e auditoria antes de gravar.
---
1. `npm run auditoria` (só leitura). 2. `node --env-file=.env backend/scripts/importarTudo.js` (dry-run; mostra o plano). 3. Backup único em `backups/importacao-completa-AAAAMMDD-HHMM/` e conferência da contagem. 4. Só com "aprovo a etapa X": `--aplicar --etapa X`. 5. Reagendar com `backend/scripts/reagendar.js` (dry-run primeiro). 6. Auditoria de novo.
Regras: não reescrever texto fornecido; identificação só no rodapé do template; "Narrativa composta" só onde há personagem/cena/caso; nunca "psiquiatra"; deploy do site exige OK.
