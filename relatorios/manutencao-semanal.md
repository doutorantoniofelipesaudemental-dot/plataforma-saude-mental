# Manutenção semanal — 2026-11-23 (worktree chore/manutencao-20261123)

Sem push, sem PR, sem merge. Nada de `.env` lido.

## Feito

- **Portão completo (`npm run portao`): APROVADO.** Relatório: `relatorios/portao-20261123-1854.md`.
  - Auditoria geral: 89 textos MDX, 0 falhas. MongoDB NÃO auditado (`MONGODB_URI` ausente neste worktree).
  - Lotes de reescrita HTML→MDX: 8 itens, 0 falhas.
  - Build Next.js: OK.
  - Testes unitários: 1112 passaram, 0 falhas.
  - E2E: 31 passaram.
- Árvore de trabalho: sem alterações em arquivos rastreados.

## Bloqueado

- **Rotina semanal (`npm run rotina-semanal`)**: falhou com exit 2. Causa: `.env` ausente neste worktree, então `MONGODB_URI` fica indefinida. Não copiei o `.env` (segredo; a pasta principal está fora das pastas permitidas nesta sessão).
- **Órfãs do Blob (grupos c/d)**: não executado. Depende do `.env` e da conexão com o Blob.
- **`youtube-reprovados`**: não executado. Depende do banco e do `.env`.
- **`lote-narracao`**: não executado. Depende do banco e do `.env`.
- **`agendar-linkedin`**: não executado. Depende do Chrome com o Dr. Antônio logado e do `.env`. Nenhuma verificação de login foi feita.
- **Conferências com data futura**: não verificadas; sem acesso a `relatorios/ESTADO-GERAL.md`, que fica na pasta principal.

## Aguardando

- Dr. Antônio: rodar a manutenção a partir da pasta principal (`C:\DRSAUDEMENTAL`), onde ficam `.env` e `ESTADO-GERAL.md`, ou autorizar o acesso a esses arquivos nesta sessão. Depois, repetir na ordem: `npm run rotina-semanal`, órfãs do Blob (c/d), `youtube-reprovados`, `lote-narracao`, `agendar-linkedin` (só com Chrome logado).
- Dependências do próprio Dr. Antônio, conforme `ESTADO-GERAL.md`: não verificadas (arquivo inacessível aqui).

## Checagem de sincronia

- Branch `chore/manutencao-20261123` em `516ef337`, igual ao ponto de partida. Nada foi enviado ao `origin`.

STATUS: PARAR rotina-semanal sem .env neste worktree (MONGODB_URI ausente); demais itens dependem do banco, do Blob, do Chrome ou da pasta principal. Portão completo aprovado.
