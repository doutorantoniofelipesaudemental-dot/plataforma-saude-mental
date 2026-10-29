# Proposta: merge automático de baixo risco (para aprovação no domingo, 01/11/2026)

**Status:** PROPOSTA. Nada disto está implementado. Só se implementa depois de aprovação do Dr. Antônio.

## O que entraria no automático
Somente PRs que mexam APENAS em:
- documentação (`docs/**`, `*.md` fora de `CLAUDE.md`, `relatorios/**`, `LICOES.md`);
- testes (`tests/**`), sem tocar em código de produção (`backend/**`, `app/**`, `apps/**`, `public/**`, `scripts/**`, `playwright.config.js`, `package*.json`);
- o que nunca entra: `CLAUDE.md`, `DECIDIDO.md`, `config/**`, `.github/**`, `vercel.json`, qualquer arquivo de freio ou de trava, qualquer `backend/data/**`.

## Condições (todas)
1. Portão completo verde no próprio PR (auditoria, tripla checagem, build, unitários e e2e).
2. Lista de arquivos do PR dentro do conjunto permitido (conferida pelo GitHub Actions, não pelo autor).
3. Sem alteração de texto publicado, sem alteração de hash de narração.
4. Mergeable e sem conflito; checks obrigatórios verdes.
5. Log do merge em `relatorios/merges-automaticos.md` (PR, arquivos, commit).

## Como (desenho, para revisão)
- GitHub Actions: workflow `auto-merge-docs.yml` disparado em `pull_request` com `paths` restritos; roda o portão; se passar e a lista de arquivos estiver no conjunto permitido, ativa `gh pr merge --auto --squash`.
- Não usa token com permissão de administrador. Sem `--admin`.
- Proteção de branch continua exigindo as checagens.

## Riscos e mitigação
- Documentação pode ter erro factual: o portão já faz tripla checagem científica e de links; ainda assim, a revisão semanal do domingo continua.
- Teste que enfraquece verificação: lista de arquivos proíbe mexer em `scripts/**` e em testes de conformidade (`assinatura-cfm`, `identificacao-unica`, `credito-*`). Mudança em teste existente exige revisão humana.
- Falso verde: o workflow só confia no resultado do portão rodado no runner, com o commit do PR.

## Pedido ao Dr. Antônio no domingo
- Aprovar (sim/não) o desenho acima.
- Escolher: (a) só documentação; ou (b) documentação e testes novos (sem alterar os existentes).
- Recomendação: (a) nas primeiras 4 semanas, depois avaliar (b).

## Fora do automático, sempre
Merge de código de produção, de `CLAUDE.md`, de `DECIDIDO.md`, de freios e de qualquer PR com `publicar`/`deploy`.
