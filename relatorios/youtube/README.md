# YouTube — o que existe

- `canal/` identidade (nome e "Sobre", banner, perfil, trailer). `propostas/mentoria/` vídeo da /mentoria **(proposta; não entra na fila)**.
- `fila.json` calendário 27/10/2026–31/01/2027 (longos ter/qui/sáb 18h; Shorts seg/qua/sex/sáb/dom 12h, Bahia). Status: `aprovado-checagem`, `reprovado`, `sem-midia`, `bloqueado`, `publicado`.
- `fila-manual/semana-AAAA-MM-DD/<dia-hora-tipo-slug>/` vídeo, capa, título, descrição, tags e legenda `.srt` para subir à mão (mídia pesada fora do Git).
- Playlists (10): Ansiedade, Depressão, Saúde Mental na APS, Urgências, Trabalho e NR-1, Cuidados Paliativos, Violência, Migração, Corpo e Saúde Mental, Relatos da Prática.
- Scripts: `scripts/youtube/` (ver skill `video-youtube`). Mídia gerada em `carrosseis-instagram/youtube/` (fora do Git).
- Publicação automática: `PASSO-A-PASSO-YOUTUBE.md`. No `.env` local o `REDES_PUBLICACAO_ATIVA` precisa estar `true` para o publicador local enviar.
- Os vídeos longos usam a narração do próprio texto (mesma voz do site); a legenda `.srt` tem tempo proporcional: no Studio use "Sincronizar automaticamente" com o mesmo texto para ajuste fino.
