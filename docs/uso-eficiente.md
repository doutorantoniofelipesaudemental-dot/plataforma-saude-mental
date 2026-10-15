# Uso eficiente do Claude Code (1 página)

- **`/clear`** ao terminar uma parte (depois de commitar). Contexto limpo = menos consumo. Antes, peça o handoff: concluídos / arquivos modificados / próximo passo exato.
- **`/compact`** quando a conversa estiver longa mas ainda precisar do histórico.
- **`/model`**: use o modelo menor (Sonnet) para tarefas repetitivas; reserve o maior para revisão científica e ética.
- **Skills pelo nome**: `/rotina-semanal`, `/lote-narracao`, `/auditoria-tripla-checagem`, `/importar-agendar-textos`, `/aplicar-referencias`, `/video-youtube`, `/post-linkedin`, `/conferencia-19-10`, `/conferencia-26-10`. Cada uma já traz o procedimento; não precisa explicar de novo.
- **Subagentes** (`.claude/agents/`, todos Sonnet): narrador, conferente, varredor, produtor-youtube, produtor-linkedin. Peça "use o subagente varredor" para tarefas repetitivas.
- **Lotes**: peça um lote por vez (ex.: "lote de 50 narrações", "próxima semana da fila do YouTube"), commit ao fim de cada um.
- **Indique os arquivos**: "olhe só `backend/scripts/x.js`" evita varredura do repositório.
- **Sem o Claude**: o Agendador do Windows (`scripts/agendar-tarefas-windows.ps1`) e os crons da Vercel fazem o recorrente; veja `relatorios/ESTADO-GERAL.md` e `relatorios/SE-ALGO-DER-ERRADO.md`.
- **Grafo do código (opcional)**: `graphify explain <id-do-nó>` mostra quem chama e quem é chamado, com arquivo:linha (ver `relatorios/graphify-teste.md`). Prefira `grep -n` direcionado para perguntas simples.
