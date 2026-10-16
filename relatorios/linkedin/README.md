# LinkedIn — o que existe

- `perfil/perfil-linkedin.md` título, "Sobre", destaques; `banner-1584x396.png`, `foto-perfil.png`. `propostas/post-mentoria-PROPOSTA.md` **(proposta; não entra na fila)**.
- `fila.json` 41 itens (3/semana, seg/qua/sex 19:30 Bahia, 28/10/2026 a 29/01/2027; mistura 25 educativo · 10 trabalho/NR-1 · 6 bastidores). A fila publicável fica na coleção `linkedin_fila` do Mongo.
- `fila-manual/semana-AAAA-MM-DD/` texto para copiar e colar (e `carrossel.pdf` nos 6 carrosséis; PDFs fora do Git em `carrosseis-instagram/linkedin/`).
- `newsletters/` 3 edições (16/11, 14/12, 18/01) para publicar à mão.
- Publicação: cron `/api/cron/publicar-linkedin` (seg/qua/sex 22:30 UTC) com freio `LINKEDIN_PUBLICACAO_ATIVA`. Guia: `PASSO-A-PASSO-LINKEDIN.md`.
