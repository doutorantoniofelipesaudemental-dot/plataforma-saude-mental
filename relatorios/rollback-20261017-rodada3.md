# Rollback — rodada 3 (17/10/2026)
- Código (site, app Next, caixa de violência, link do LinkedIn): Vercel → Deployments → deploy anterior → "Promote to Production" (ou `git revert -m 1 <merge do #93>` e novo deploy com OK do Dr. Antônio).
- Textos (5): restaurar de `backups/importacao-completa-20261018-0058/artigos.json` (726 documentos), só os campos conteudo, resumo, titulo e atualizadoEm dos slugs: catatonia-na-emergencia-medica-reconhecimento-e-manejo-inici, uso-problematico-de-telas-e-dependencia-digital-na-infancia, abandono-de-tratamento-psiquiatrico-estrategias-de-resgate-n, brasil-campeao-cirurgias-plasticas, querer-e-nao-poder-pagar-estetica-privilegio. O título antigo está em `historicoTitulos` de brasil-campeao-cirurgias-plasticas.
- Agendamento de catatonia e telas: backups/sem-agenda-20261018-0058 (2 documentos).
- Capa de brasil-campeao-cirurgias-plasticas: a capa antiga tinha o título "Brasil, campeão..."; regerar com `reels_automation/.venv/Scripts/python.exe -I backend/tools/gerar-capas.py` e enviar por PUT /api/artigos/<slug>/midia/capa-arquivo.
- Áudios: o hash muda com o texto; restaurar o texto antigo volta o hash antigo e o MP3 anterior (não foi apagado do Blob).
- Link do LinkedIn: `config/marca.json` (LINKEDIN_PERFIL_PERSONALIZADO=false) + `npm run marca:aplicar`.
