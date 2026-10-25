# Vercel: promoção segura do site (25/10/2026)

Registro da ordem "retomar Passo 0 com decisões" (25/10/2026). Base: `origin/main` = `a40869f` (PR #154). Worktree: `C:/DRS-promocao`, branch `docs/vercel-promocao-20261025`. Hora local de registro: 10:55 (Salvador).

## 1. Declaração do painel
- Root Directory do projeto `drsaudemental` alterado para VAZIO em 25/10/2026, 08:00 (Salvador), pelo Dr. Antônio. Valor anterior: `apps/plataforma-saude-mental`.
- Confirmado por leitura (CLI `vercel api /v9/projects/...`, só campos escolhidos): `rootDirectory: null`, `framework: null`, `buildCommand: null`, `installCommand: null`, `outputDirectory: null`, `nodeVersion: 24.x`. Nome do projeto: `drsaudemental`.
- Nada promovido, sem rollback. Produção continua no deploy `dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (#147, commit `db86c16`), com os domínios `www.drantoniofelipemedico.com.br`, `drsaudemental.vercel.app` e a branch `main`.

## 2. Cronograma do dia (horários reais)
| Hora (Salvador) | Evento |
|---|---|
| 08:00 | Root Directory alterado (declarado). Cron `publicar-agendados` (11:00 UTC) e cron `publicar-redes-v2` (11:00 UTC, seg a sex). Não há evidência de execução no painel nesta sessão. |
| 09:00 | Cron `renovar-token-instagram` e `relatorio-redes` (12:00 UTC, segunda). |
| 09:30 | Conferência diária: NÃO há relatório de 25/10 em `relatorios/conferencias/` (o mais novo é 24/10). Pendente. |
| 10:55 | Registro desta ordem. Previews 1 e 2 prontos. Smoke de produção feito. Plano pronto, mas após as 10:30 previstas. |
| 11:00 a 12:00 | Janela de promoção (Dr. Antônio). Só com validação do candidato e sem cron a menos de 15 min. |
| 12:00 a 14:00 | Margem para desfazer (rollback para #147). |
| após 14:00 | NÃO promover. Plantão a partir das 17:30; narração 14:00; gera-mídia 15:30; YouTube 17:15. |
| Se não validar | Promoção fica para segunda-feira, 26/10, depois das 10:00. |

## 3. Estado e pendências desta ordem
- Painel: OK (Root Directory vazio).
- PR 156 (`docs/vercel-incidente-20261025` → `main`): mergeável (`MERGEABLE`, `CLEAN`), só documentação e relatórios, mais +4 linhas em `CLAUDE.md` (regras Root Directory e vercel.json, já previstas na ordem de 25/10). Merge NÃO feito (é do Dr. via merge-seguro).
- Previews: 2 de 3 consumidos (ver seção 5). Terceiro (migração `feat/migrar-vercel-json-20261025`) NÃO gerado: opcional e fora da janela.
- Smoke de produção: feito. Smoke de preview: bloqueado por SSO (sem bypass, conforme regra).
- Pendente do Dr.: decidir o candidato, promover, merge-seguro do PR 156 e os comandos de limpeza (seção 7).
- Pendente de consolidação: ver seção 8.

## 4. Lição do incidente
Ler o Root Directory do painel e comparar os deploys bons e ruins ANTES de migrar o `vercel.json`. Um Root Directory apontando para `apps/` faz o `vercel.json` da raiz ser ignorado (site 404 em 24/10). Antes de qualquer deploy: conferir `rootDirectory` (vazio = raiz) e, se houver divergência, parar.

## 5. Previews (sem bypass de SSO)
- Preview 1: `dpl_B9hwytUi21oMFzSbRntvUqhxMSCq`, branch `test/vercel-reprodutor-147-20261025`, commit `3ac645c` (formato legado, código do #147). Estado: READY. Functions: 1 lambda (`backend/index.js`, @vercel/node). Static: sim (`public/**`, @vercel/static). Crons: 6. Resultado: NÃO vazio, o deploy saiu com functions e static.
- Preview 2: `dpl_Dxp1UeAjhL3WwiYGQKwDn6yPFPfk`, commit `a40869f` (main atual), sem branch novo (SHA direto). Estado: READY. Functions: 1 lambda. Static: sim. Crons: 6.
- Causa do deploy vazio (de 24/10 ou das tentativas anteriores): o painel está correto (Root Directory vazio). A diferença observada hoje entre previews bons não aponta para a CLI. Causa do incidente: Root Directory antigo (`apps/`), conforme lição da seção 4.
- URLs de preview respondem 302 para SSO da Vercel (`ssoProtection: all_except_custom_domains`). Não contornado.

## 6. Smoke de produção (`#147`, em 10:5x)
| Rota | Código | Observação |
|---|---|---|
| `https://www.drantoniofelipemedico.com.br/` | 200 | OK |
| `/api/health` | 200 | OK |
| `/links` | 200 | OK |
| `/privacidade` | 200 | página real (`public/privacidade.html`); `/politica-de-privacidade` não existe (404) |
| `/mentoria` | 200 | OK |
| `drsaudemental.vercel.app/` | 301 | para `www` (esperado) |
- Headers: `Cache-Control: public, max-age=0, must-revalidate`, `Server: Vercel`. Headers de segurança extras não conferidos nesta rodada.
- Variáveis de produção (só nomes, sem valores): presentes `INSTAGRAM_ACCESS_TOKEN`, `REDES_PUBLICACAO_ATIVA`, `CRON_SECRET`, `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN`, `R2_*`, `ADMIN_TOKEN`.
- Não verificado: erros de runtime (`get_runtime_errors` não consultado nesta rodada).
- Crons (`vercel.json`, UTC): `publicar-agendados` 0 11 * * *; `publicar-redes-v2` 0 11 * * 1-5; `publicar-linkedin` 30 22 * * 1,3,5; `relatorio-redes` 0 12 * * 1; `renovar-token-instagram` 0 12 * * 1; `diagnostico-instagram` 0 23 * * *. Em Salvador (UTC-3): 08:00, 08:00, 19:30, 09:00, 09:00, 20:00. Cron `publicar-redes-v2` (seg a sex, 08:00) não estava na ordem: conferir.

## 7. Folha de decisão dos PRs não promovidos (main contra #147)
Commits em `main` ainda não no ar (16): PRs #146, #150, #153, #154 e commits soltos.
- **#146 (narração Edge padrão):** não visível ao visitante. Muda `backend/lib/tts.js`, `backend/tools/narrar-artigos.js`, `config/ordens-*.json`. Risco: padrão de voz de narração; sem conteúdo clínico. Pode esperar reversão.
- **#150 (contrato do funil, docs):** não visível. Só `docs/`. Sem risco no ar.
- **#153 (CLS):** VISÍVEL. `public/artigo.html` (preload de Fraunces) e `public/assets/css/style.css` (29 linhas de fonte). Conferir manualmente a tipografia depois de promover. Risco visual, não clínico.
- **#154 (merge-seguro):** não visível. Ferramenta de merge, sem rota nova.
- Extras: `tests/e2e` (teste de CLS e `auditoria-ferramentas.spec.js`), `scripts/`. Atenção: commit `64aa6e3` faz o e2e ler o `.env` da pasta principal. Não li o `.env`. Revisar.
- Rotas novas: nenhuma. `vercel.json`: sem diferença entre #147 e `main`. Crons: sem diferença.
- Recomendação: promover a `main` inteira (a cadeia é pequena e sem risco clínico). #153 merece conferência manual depois de promover.

## 8. Plano de promoção (5 passos, Dr. Antônio)
1. 11:00: criar deploy de produção de `a40869f` SEM ir ao ar: `vercel deploy --prod --skip-domain` a partir de `C:/DRS-promocao` (confirmar a flag com `vercel deploy --help` antes). Anotar a URL.
2. Validar a URL nova com SSO (login do Dr.): `/`, `/api/health`, `/links`, `/privacidade`, `/mentoria`, e o visual do #153.
3. Promover: `vercel promote <URL-do-deploy-novo>` (ou botão Promote no painel). Isso reativa a atribuição de domínio, que o rollback desligou.
4. Conferir após promover: os 4 domínios apontam para o deploy novo (`get_project`), `/api/health` 200, crons no painel.
5. Desfazer, se algo falhar (até 14:00): `vercel rollback dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (ou Instant Rollback no painel para o #147).
- Pesquisa oficial (ver `relatorios/vercel-fontes-20261025.md`): após rollback, deploys novos NÃO são promovidos sozinhos; `--skip-domain` só vale com `--prod`.
- Só vale depois: token Instagram novo, se houver rotação (`INSTAGRAM_ACCESS_TOKEN` existe; validade não testada); crons passam a rodar no código novo.

## 9. Consolidação pendente (copiar DEPOIS, pelo Dr. ou por ordem)
- `CLAUDE.md`: as 2 linhas de Root Directory e vercel.json já estão no PR 156. Não editar aqui.
- `relatorios/AUTORIZACOES.md`: registrar a declaração do painel (25/10, 08:00).
- `relatorios/ESTADO-GERAL.md` e `PROMPT-ATUAL.md`: estado real (produção #147, candidato `a40869f`).
- `relatorios/PENDENTES.md`: cronograma da seção 2; conferência 25/10 pendente; cron `publicar-redes-v2` a conferir.
- `relatorios/LICOES.md`: incluir a lição da seção 4.
- Seção 23/10 do LICOES (não é minha): cita `scripts/lib/branchSincronizado.js` como existente. Confirmado: NÃO existe em `origin/main` nem no PR 156; existe só no branch `chore/checagem-sincronizada-20261023`. Corrigir a referência ou o caminho.

## 10. Comandos para o Dr. Antônio (uma linha cada)
- `! git -C C:/DRS-promocao push -u origin docs/vercel-promocao-20261025`
- Merge do PR 156: NÃO executar ainda. Ver a seção de merge-seguro na resposta.
- `! git push origin --delete test/vercel-reprodutor-147-20261025` (só depois de confirmar a promoção)
- `! git push origin --delete test/vercel-discriminador-20261025` (só depois de confirmar a promoção)
- `test/vercel-controle-20261025`: não existe no remoto. `C:/DRS-controle` e `C:/DRS-vercel-migra` não existem. Nada a remover.
- `! git worktree remove C:/DRS-promocao` (só depois de promover e mesclar)

CHECKPOINT: relatório gravado; nenhuma promoção, merge ou rollback feito.
