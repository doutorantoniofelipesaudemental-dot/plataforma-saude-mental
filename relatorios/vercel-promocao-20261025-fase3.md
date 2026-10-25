# Vercel: fase 3 — alias revertido, candidato validado e decisão de promoção (25/10/2026)

Registro desta ordem (sem valores de variáveis). Worktree: `C:/DRS-promocao`. Hora de referência: 11:41 (Salvador) no início; alias revertido logo depois.

## Declarações registradas
- Painel: `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_ACCOUNT_ID` em produção, alterados em 20/10/2026, como "Segredo" (valor não visível). `REDES_PUBLICACAO_ATIVA` em produção, "Segredo", última alteração em 15/10/2026 (valor não visível).
- Tratado como POSSIVELMENTE LIGADA (pior caso). Nada concluído sobre o valor.
- Hipótese de token (confirmada por datas, Salvador): token alterado em 20/10/2026 03:45; deploy #147 criado em 22/10/2026 17:03; candidato criado em 25/10/2026 07:53. O #147 foi construído depois da troca do token. Isso não confirma o runtime; o erro da Meta "API access deactivated" é problema de app ou conta, separado.

## 1. Alias derivado (exceção cumprida)
- Antes: `drsaudemental-doutor-antonio-felipe-saude-mental.vercel.app` apontava para o candidato `dpl_GcikF9…`.
- Comando (sintaxe da documentação: `vercel alias set [deployment-url] [custom-domain]`): `vercel alias set drsaudemental-h2267q5t2-doutor-antonio-felipe-saude-mental.vercel.app drsaudemental-doutor-antonio-felipe-saude-mental.vercel.app --scope doutor-antonio-felipe-saude-mental` (exit 0).
- Depois, por leitura (`vercel inspect`): o alias aponta para `dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (#147), target production.
- Os 4 domínios principais (`www.drantoniofelipemedico.com.br`, `drantoniofelipemedico.com.br`, `drsaudemental.vercel.app`, alias git-main) seguem listados no #147. `www` confirmado no #147 por `vercel inspect`. `www /` = 200.
- Nenhum outro alias foi alterado. Nenhum deploy novo, nenhuma promoção, nenhum rollback.
- Observação: a API ainda lista o alias também no candidato (campo `alias`), o que pode ser estado antigo. `vercel alias ls` não mostrou os aliases de produção (lista paginada). Conferir de novo antes de promover.

## 2. Acesso autenticado ao candidato (documentado)
- Documentação oficial: `vercel curl` faz requisições a deploys com proteção ("automatically handles deployment protection"), sem bypass manual. Uso: `vercel curl <caminho> --deployment <url> --scope <equipe>`. Não usei `VERCEL_AUTOMATION_BYPASS_SECRET`.
- Obs. técnica: no Git Bash, prefixar `MSYS_NO_PATHCONV=1` (senão o `/caminho` vira caminho do Windows).

## 3. Smoke test do candidato (`dpl_GcikF9…`, via vercel curl, sem disparar crons)
| Rota | Código |
|---|---|
| `/` | 200 |
| `/privacidade` | 200 |
| `/links` | 200 |
| `/mentoria` | 200 |
| `/api/health` | 200 |
| `/artigo.html?slug=afastamento-transtorno-mental` | 200 |
| `/artigo/afastamento-transtorno-mental` | 200 |
| rota inexistente | 404 (esperado) |
- Headers do candidato: `Cache-Control: public, max-age=0, must-revalidate`; `Content-Type: text/html; charset=utf-8`; `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Redirecionamento 301 (`drsaudemental.vercel.app` → `www`): é do domínio, não do candidato (testado no #147).

## 4. Variáveis por nome (sem valores)
- Usadas no código (`backend/`): 50+ nomes. Presentes em production (nomes): `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, `REDES_PUBLICACAO_ATIVA`, `CRON_SECRET`, `MONGODB_URI`, `MONGODB_DB`, `ADMIN_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- Ausentes em production (nomes usados no código): `UPSTASH_REDIS_REST_URL/TOKEN` (rate limit só por instância, já assim no #147), `LINKEDIN_PUBLICACAO_ATIVA` (ausente = LinkedIn desligado), `YOUTUBE_PUBLICACAO_ATIVA` (ausente = YouTube desligado), `AUTO_PUBLICAR_REDES` (ausente = desligado), `AGENDADOS_MODO` (ausente = padrão diário), `AZURE_SPEECH_*`, `ELEVENLABS_*`, `OPENAI_*`, `GEMINI_*`, `GROQ_*` (pagas ou de geração; ausência é o desejado), `INSTAGRAM_APP_SECRET` (não aparece em `tokenInstagram.js`; outros usos não verificados).
- O candidato usa o mesmo conjunto de production que o #147 (mesmos nomes). Não há variável nova a criar.

## 5. Crons: o que a documentação diz, e a folha de decisão
- Documentação (Vercel, cron jobs): os crons são invocados por GET na URL de produção, ou seja, no deploy que detém os domínios. Hoje é o #147. Um deploy só recebe crons depois de promovido.
- Rollback: a documentação oficial diz que o Instant Rollback restaura as definições de cron do deploy de destino; uma fonte secundária diz o contrário. Conclusão: NÃO confirmado; tratar como pior caso.
- Ponto decisivo: o cron de segunda 08:00 já roda hoje no #147. A promoção do candidato NÃO cria esse risco; ele existe agora.
- Folha de decisão (uma linha por cron):
  - `publicar-redes-v2` (seg a sex, 08:00 Salvador): publica no Instagram (Meta). Gate: `REDES_PUBLICACAO_ATIVA` (ausente = LIGADO; valor não lido, tratar como possivelmente ligado) e post `aprovado-checagem` na fila do banco. Risco ALTO. Não muda com a promoção.
  - `publicar-agendados` (diário, 08:00 pelo `vercel.json`; comentário do código diz 30 min): publica artigos agendados NO SITE (visível ao visitante). Gate: auditoria por item; sem freio de variável no código. Risco MÉDIO (site). Não muda com a promoção.
  - `publicar-linkedin` (seg/qua/sex, 19:30 Salvador): gate `LINKEDIN_PUBLICACAO_ATIVA` ausente = desligado. Risco BAIXO.
  - `relatorio-redes` (seg 09:00): grava relatório semanal no banco. Sem publicação. Risco BAIXO.
  - `renovar-token-instagram` (seg 09:00): renova token e grava credencial cifrada no banco. Risco MÉDIO (credencial), sem publicação.
  - `diagnostico-instagram` (diário 20:00): NÃO lido nesta fase; pendente.
- Pergunta: "se este deploy virar o de produção, a publicação de segunda às 08:00 continua desligada?" → NÃO CONFIRMADO. A publicação de redes depende de `REDES_PUBLICACAO_ATIVA` (valor desconhecido) e da fila no banco; a promoção não altera nenhuma das duas. Hoje o #147 já executa o cron de segunda 08:00. Logo, a decisão necessária é do Dr. sobre o freio, antes de segunda 08:00.
- Pausa do Instagram: fica no banco (documento `Credencial`), não na variável; sobrevive a deploy novo. Resumo do dia (24/10): "publicado: nada; sai hoje: nada" (não é o estado atual).

## 6. #153 e CLS
- Portão de 23/10 23:10 (`relatorios/portao-20261023-2310.md`): REPROVADO na etapa E2E (código 1), sem detalhe de CLS no relatório.
- Log do E2E de 23/10 (`relatorios/logs/e2e-completo-portao-20261023.log`): 31 passed, exit 0, incluindo "Artigos — SSR, CLS e layout (mobile)" e "sem CLS em 4G lento". Não consigo ligar este log ao merge do #153 com certeza (mesmo dia; ordem não confirmada). Tratar como: CLS passou na execução registrada, sem prova do merge exato.
- Registro do merge do #153: `relatorios/rollback-pr153-20261023-2322.md` (mesclado 23:22; o texto menciona 404 e instrução de desfazer; a main ainda contém o commit `6a899fe`).
- Páginas afetadas (para conferência manual, sem reexecução):
  - `public/artigo.html` (+1 linha: preload de `fraunces-latin.woff2`): todas as páginas de artigo.
  - `public/assets/css/style.css` (+29 linhas, fonte Fraunces): páginas que carregam o CSS: `/` (index), `/blog`, `/artigo` (todos os artigos), `/privacidade`, `/instagram`. (`/admin` não é público.)
- Conferir manualmente depois de promover: `/`, um artigo, `/blog` e `/privacidade`, no celular e no desktop; observar mudança de fonte no título (h1).

## 7. Windows (14:00, 15:30 e 17:15)
- 14:00 `DrSM-Narracao-Noite` (plantão): `scripts/travaDiaria.js` + `scripts/cicloNarracao.js` → `backend/tools/narrar-artigos.js --provedor=edge`. Scripts idênticos à main. O `narrar-artigos.js` difere (5+/2-), mas a chamada passa `--provedor=edge` explicitamente.
- 15:30 `DrSM-YouTube-Gera-Midia`: `montarFila.js` e módulos locais; geração de voz via `edge_tts` (Python). Sem `tts.js`. Scripts idênticos à main.
- 17:15 `DrSM-YouTube-Publica`: `publicarYoutube.js` importa `backend/lib/freioRedes.js`, `freioYoutube.js`, `youtube.js` (idênticos à main). Sem diferença relevante.
- Diferença relevante: `backend/lib/tts.js`. Na pasta principal, o provedor padrão é **Azure** e não há a guarda `ordemAzure.js` / `ordemPaga.js` (a main usa Edge por padrão e exige ordem para Azure e para pagos). Não é usado pelas tarefas das 14:00, 15:30 e 17:15 sem `--provedor` explícito, mas é o risco de qualquer chamada futura que omita o provedor.
- Plano de alinhamento (NÃO executado): (1) mesclar o PR 156 pelo `merge-seguro`, rodado em `C:/DRS-docs`; (2) decidir o PR #151 (aberto, a11y); (3) tratar os 6 arquivos modificados de outras sessões (commit ou guarda, pelo dono); (4) só então trocar a pasta principal para `main`, com `git switch main` depois de conferir que não há perda.

## 8. Lição do incidente
- `--skip-domain` NÃO impediu a atribuição do alias derivado de produção (`drsaudemental-doutor-…vercel.app`). Antes de criar deploy de produção sem domínios, listar os aliases e prever o efeito, inclusive os derivados.
- Antes de criar qualquer deploy de produção, confirmar quais crons ele trará e qual deploy os invoca hoje (o que serve o domínio).
- Sugestão (não aplicada): acrescentar `.mcp.json` ao `.vercelignore`.

## 9. Recomendação
- NÃO promover hoje. Motivos: (a) o gate de publicação de segunda 08:00 não foi confirmado e depende de um valor que o Dr. precisa verificar; (b) o CLS não foi conferido manualmente no candidato; (c) o alias derivado foi revertido há pouco e precisa de nova leitura antes de qualquer mudança; (d) não há ganho urgente: o #147 está no ar e respondendo 200.
- Caminho: segunda-feira, depois das 10:00, com o freio de `REDES_PUBLICACAO_ATIVA` decidido pelo Dr. (pausa ou ligado, conforme a intenção), smoke e conferência de CLS.

## 10. Comandos (UMA linha cada)
- Promover o candidato (quando decidido): `vercel promote dpl_GcikF9T1qfyCggPrBpstoDopamMP --scope doutor-antonio-felipe-saude-mental`
- Conferir depois: `vercel inspect www.drantoniofelipemedico.com.br --scope doutor-antonio-felipe-saude-mental`
- Desfazer (voltar ao #147): `vercel rollback dpl_9pwS6LguSCW11r13XehkUFNgbhdy --scope doutor-antonio-felipe-saude-mental`
- Freio (decisão sua, no painel ou por comando): `REDES_PUBLICACAO_ATIVA` = `false` para desligar a publicação das redes.

## 11. Pendências
- Log de runtime do candidato (últimos minutos) não consultado.
- `diagnostico-instagram` (20:00) não lido.
- Aliases de produção: confirmar de novo no painel antes de promover.
- `C:/tmp-err.txt` (na raiz do `C:`, vazio): apagar manualmente (a remoção foi bloqueada).
- Remover depois: `git worktree remove C:/DRS-deploy-main`.
