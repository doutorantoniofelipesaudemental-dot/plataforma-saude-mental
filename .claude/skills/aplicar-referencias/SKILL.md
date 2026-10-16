---
name: aplicar-referencias
description: Aplica lotes de referências científicas (referencias-140-prontas, importacao-extra-180) aos textos, sem mudar o sentido, com backup e dry-run.
---
`node --env-file=.env backend/scripts/aplicarReferencias140.js` (dry-run) → backup → `--aplicar --etapa X` após "aprovo a etapa X". Frases acrescentadas ficam em `FRASES-ACRESCENTADAS.md` e devem ser revisadas (sentido, ≥ 4 referências, `<sup>` com referência, DOI sem 404, sem retratação). Depois: `npm run auditoria` e `node --test tests/unit/`. Mudança de sentido = proposta (trecho atual → proposto → motivo), não aplicar sem OK.
