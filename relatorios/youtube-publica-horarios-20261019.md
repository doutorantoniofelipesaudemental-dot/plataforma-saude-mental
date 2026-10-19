# Horários do YouTube publica — relatório de leitura (19/10/2026, somente leitura)

1. **Duração da geração de mídia** (`relatorios/logs-agendador/DrSM-YouTube-Gera-Midia.log`): 50 itens registrados, média de 125 s por item, máximo 426 s, soma de ~104 min no conjunto. O log não tem início e fim por execução, então não dá para afirmar a duração da noite inteira. Na quinta e no domingo a publicação (17:15) vem 1h45 após a gera-mídia (15:30): folga curta se a geração passar disso.
2. **Tarefas a menos de 60 min dos novos horários:**
   - 20:15 (seg, ter, qua, sex, sáb): `DrSM-Conferencia-19-10` (19/10 19:30, 45 min antes) e `DrSM-Conferencia-26-10` (26/10 19:30, 45 min antes). São pontuais; a de 19/10 é hoje.
   - 17:15 (qui, dom): nenhuma. A gera-mídia (15:30) está 1h45 antes.
3. **Estado inicial definido pelo script:**
   - Tarefas criadas com `Register-ScheduledTask` nascem ATIVADAS, inclusive `DrSM-LinkedIn-Agendar`, que o script não desativa.
   - `DrSM-Blob-Rotina-Mensal` é desativada pelo script a cada execução.
   - `DrSM-LinkedIn-Lembrete` é desativada pelo script.
   - Tarefas que já existem são reescritas com `-Force`; não verifiquei se uma tarefa desativada volta ativa. Tratar como risco.
   - **Risco:** rodar o script depois de `npm run linkedin:pausar` reativa `DrSM-LinkedIn-Agendar`, porque o script não respeita o `pausado` do estado. Corrigir só por ordem.
4. **Freio do YouTube:** `scripts/youtube/publicarYoutube.js:43` só publica se `youtubeLigado()` for verdadeiro, ou seja, `YOUTUBE_PUBLICACAO_ATIVA` igual a `true`. Com outro valor ou ausente, a tarefa registra "nada publicado" e sai. O `.env` não foi lido. `relatorios/youtube/DECISAO-FREIO.md` cita `YOUTUBE_PUBLICACAO_ATIVA=true` em data anterior; o valor atual não foi conferido.
