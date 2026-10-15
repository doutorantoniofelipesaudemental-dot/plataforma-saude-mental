---
name: video-youtube
description: Produz vídeos longos e Shorts do canal do YouTube a partir das narrações e dos posts, com FFmpeg local e sem custo; fila automática por semana.
---
Pipeline em `scripts/youtube/` (ver `relatorios/youtube/README.md`): `node scripts/youtube/gerarVideosLongos.js --slugs=…`, `gerarShorts.js`, `montarFila.js`, `publicarYoutube.js` (cron; freio `YOUTUBE_PUBLICACAO_ATIVA`). Regras: 1920×1080 / 9:16 a 30 fps, capa 1280×720, legenda .srt com acentos, assinatura curta, descrição com assinatura de 5 linhas, aviso educativo, CVV/SAMU quando o tema exigir, link /mentoria no fim, tags sem "psiquiatra", sem marca d'água. Vídeo da /mentoria é PROPOSTA e nunca entra na fila. Nenhuma voz paga.
