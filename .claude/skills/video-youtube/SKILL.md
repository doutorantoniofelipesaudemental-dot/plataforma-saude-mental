---
name: video-youtube
description: Produz vídeos longos e Shorts do canal do YouTube a partir das narrações e dos posts, com FFmpeg local e sem custo; fila automática por semana.
---
Pipeline em `scripts/youtube/`: `gerarVideosLongos.js --slugs=…`, `gerarShorts.js --post=<id>|--slug=…`, `montarFila.js [--aplicar --gerar]` (calendário 3 longos + 5 Shorts por semana), `gerarCanal.js`, `criarPlaylists.js`, `publicarYoutube.js` (Agendador do Windows, freio `YOUTUBE_PUBLICACAO_ATIVA`). Guia: `relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md`. Regras: 1920×1080 / 9:16 a 30 fps, capa 1280×720, legenda .srt com acentos, assinatura curta, descrição com assinatura de 5 linhas, aviso educativo, CVV/SAMU quando o tema exigir, link /mentoria no fim, tags sem "psiquiatra", sem marca d'água. Vídeo da /mentoria é PROPOSTA e nunca entra na fila. Nenhuma voz paga.

- Crédito de marca (16/10/2026): toda narração/vídeo cita, na fala e na tela, o "Portal de Saúde Mental Doutor Antônio Felipe Garabito" (`backend/lib/vinheta.js`; vinheta nos MP3 via `backend/tools/vinheta-narracoes.js`; hash da narração não muda; campo `vinhetaVersao`). Descrição/legenda: 1ª linha "Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito" + link. Crédito de tela discreto, nunca marca d'água.
