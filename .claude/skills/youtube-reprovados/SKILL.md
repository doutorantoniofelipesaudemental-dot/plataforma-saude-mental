---
name: youtube-reprovados
description: Corrige os vídeos do YouTube reprovados na checagem (bloqueado/reprovado), passa pela conferência e devolve à fila, sem publicar.
---
1. Liste em `relatorios/youtube/fila.json` os itens com status `bloqueado`/`reprovado` e o `motivo`.
2. Para cada um (agente `produtor-youtube`): corrija a causa (texto, acento, crédito de marca, CVV/SAMU, hash) na pasta do item, gere de novo só o que mudou (FFmpeg local, voz Edge-TTS `pt-BR-AntonioNeural`), rode a checagem do item e volte o status para `aprovado-checagem` só se passar.
3. Item que falhar 2 vezes: deixe como está e relate (aguardando decisão).
4. NÃO publique e NÃO mude freios. A publicação segue pelo cron/tarefa ou `npm run publicar-seguro -- youtube <id>`.
Relate: corrigidos / ainda reprovados (motivo) / aguardando decisão.
