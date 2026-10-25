# Vercel: fase 2 (deploy de produção sem domínios) — 25/10/2026, 11:10–11:20 (Salvador)

## Estado: PARADO por condição de parada (domínio atribuído ao deploy novo)

- Base: `origin/main` = `a40869f`. Worktree de deploy: `C:/DRS-deploy-main` (branch `deploy/main-sem-dominio-20261025`, a partir de `a40869f`).
- Pré-condições: `rootDirectory: null`; produção = `dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (#147), com 4 domínios principais e 2 aliases derivados.
- Checagem de arquivos do worktree: sem `.env` real (só `.env.example`, rastreado); sem `.vercel` prévio; sem `node_modules`. O `.vercelignore` exclui `.env*`, `relatorios/`, `apps/`. NÃO excluía `.mcp.json`: a cópia desse arquivo no worktree de deploy foi removida (não lida, não alterada no git).
- Vínculo: `.vercel/project.json` gerado com `projectId` = `prj_uIQsuIIdKas1D6AHlGtHEwcdaFsG` (projeto existente; nenhum projeto novo criado).
- Comando executado: `vercel --prod --skip-domain --yes --scope doutor-antonio-felipe-saude-mental` (exit 0).
- Deploy criado: `dpl_GcikF9T1qfyCggPrBpstoDopamMP`, URL `drsaudemental-94iv1q4nq-doutor-antonio-felipe-saude-mental.vercel.app`, target `production`, state READY.

## Incidente da flag --skip-domain

- A saída da CLI listou `▲ Aliased https://drsaudemental-doutor-antonio-felipe-saude-mental.vercel.app`, apesar de `--skip-domain`.
- Leitura da API: o alias derivado aparece no deploy novo. O #147 ainda lista o mesmo alias (estado ambíguo). Os 4 domínios principais continuam listados só no #147.
- Comunidade Vercel relata o mesmo comportamento (não confirmado pela documentação oficial).
- Nenhuma ação de correção foi feita (sem rollback, sem alias, sem promoção).

## Smoke test

- NÃO executado no deploy novo: o alias derivado já foi atribuído, e a condição de parada exige retorno antes de novas ações. Checks dos domínios principais feitos na fase 1 (200 em /, /api/health, /links, /mentoria; /privacidade 200).
- O conteúdo do deploy novo não foi verificado (`vercel curl` retornou 0 bytes; não investigado por parada).

## Comandos para o Dr. Antônio (UMA linha cada)

- Voltar o alias derivado ao #147 (recomendado, reverte só o alias): `! vercel alias set dpl_9pwS6LguSCW11r13XehkUFNgbhdy drsaudemental-doutor-antonio-felipe-saude-mental.vercel.app --scope doutor-antonio-felipe-saude-mental`
- Alternativa, reverter toda a produção ao #147 (entra em estado de rollback): `! vercel rollback dpl_9pwS6LguSCW11r13XehkUFNgbhdy --scope doutor-antonio-felipe-saude-mental`
- Conferir depois: `! vercel api /v13/deployments/dpl_9pwS6LguSCW11r13XehkUFNgbhdy --method GET` (campo `alias`)

## Pendências

- Decidir o comando de retorno acima; conferir o alias derivado após o retorno.
- Crons, variáveis por nome e folha de decisão (Passo 2c) NÃO levantados nesta rodada.
- #153/CLS (Passo 2d) NÃO reexaminado nesta rodada.
- Promoção: não feita. Não promover até o alias derivado estar de volta ao #147 e o deploy `dpl_GcikF9…` ser validado.
- Limpeza: arquivo `C:/tmp-err.txt` criado por engano na raiz do `C:` (vazio); a remoção foi bloqueada pela checagem de segurança. Remover manualmente.
