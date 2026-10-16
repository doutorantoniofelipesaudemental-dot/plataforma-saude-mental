# Conferência pós-renovação do token — 2026-10-16

**Resultado: ATENÇÃO**

- Última renovação: —
- Nova validade (expiraEm): 2026-12-14 05:00 UTC (58 dias)
- Impressão digital do token renovado: —
- Produção (/api/admin/fila-redes): origem do token "variavel", pausa não, podePublicarAgora true
- Freio das redes (REDES_PUBLICACAO_ATIVA): ativo (true)
- Trava B (imagem-corporal-o-que-e): publicado NÃO · página/API 404 · player toca NÃO · MP3 HTTP 0 · vinheta v— (FALTA)

## Problemas
- nenhuma renovação registrada (renovadoEm vazio): o cron não rodou ou falhou
- origem do token em produção é "variavel" (esperado "renovado")
- trava B: imagem-corporal-o-que-e não foi publicado às 08:00
- trava B: página/API de imagem-corporal-o-que-e respondeu 404 (esperado 200)
- trava B: o player de imagem-corporal-o-que-e não tem áudio para tocar após publicar
- trava B: URL do MP3 de imagem-corporal-o-que-e respondeu 0 (esperado 200)
- trava B: o áudio de imagem-corporal-o-que-e não tem a vinheta (versão 1)
