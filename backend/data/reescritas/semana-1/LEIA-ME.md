# Reescrita de artigos — Semana 1

Cada artigo reescrito tem:
- `<slug>.html` → novo texto do campo `conteudo` (somente a parte de texto).
- entrada em `lote.json` → slug, novo resumo, novo tempo de leitura e se o artigo tem ferramenta interativa a preservar.

Regras de importação (ver prompt no chat):
- Manter slug, título, categoria, capa, narração, visualizações, datas de publicação.
- Se `manter_ferramenta` = true: substituir apenas o texto antes de `<h2>Ferramenta interativa</h2>`; o bloco da ferramenta e o script continuam iguais.
- Backup do conteúdo anterior em backups/reescritas/.
- Atualizar `atualizadoEm` e exibir "Atualizado em" no artigo.
