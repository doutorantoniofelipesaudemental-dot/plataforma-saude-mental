# Pendências — atualizado em 27/10/2026 (3ª rodada: após merge de #170 e #171)

Estado de 27/10 (`gh pr list`, `origin/main` = f403524 com #171): abertos #138, #145, #151, #156, #159 a #169. Tarefas Windows: `DrSM-Blob-Rotina-Mensal`, `DrSM-Conferencia-19-10`, `DrSM-Conferencia-26-10`, `DrSM-LinkedIn-Agendar` e `DrSM-LinkedIn-Lembrete` desabilitadas; as demais `Ready`.

Fontes: `gh pr list`, `git log origin/main`, `git ls-remote`, `git worktree list`, Agendador do Windows (leitura), API da Vercel (leitura: projeto e nomes das variáveis, sem valores). Itens que não puderam ser verificados continuam marcados **não verificado**, com o motivo.

## Resolvido (verificado)
- [x] **PR #170 (termos de uso e dados do YouTube) e PR #171 (teste do anexo): MESCLADOS** pelo Dr. Antônio em 27/10/2026 (21:01 e 21:05 UTC).
- [x] Ollama respondendo em 127.0.0.1:11434 (26/10).
- [x] Token da Meta válido até 24/12/2026 (conferência de 26/10).
- [x] Erro do agendador do LinkedIn (`agendados is not defined`): corrigido na `main` (PR #158, mesclado).
- [x] Assinatura de 3 linhas nos carrosséis: PR #157 mesclado.
- [x] Post de 26/10 publicado; post de 27/10 (`2026-10-27-tempo-tela-criancas`) com `aprovado-checagem` (conferido no banco em 26/10).
- [x] Blob: correção 662b9eb está na `main`.
- [x] Crons da Vercel habilitados (informado pelo Dr. Antônio em 26/10).
- [x] Plano Pro confirmado pelo Dr. (26/10; ciclo 16/10 a 16/11).
- [x] Simulação do Blob: 0 arquivos apagáveis (26/10).
- [x] Links quebrados: são 9. Nenhum trocado; estão nos MDX, fora de `public/`.
- [x] **PR #115 (regeração dos 54 vídeos): MESCLADO em 20/10/2026.** O que falta é decidir o mecanismo (abaixo).
- [x] **Conferências 19-10 e 26-10: já estão DESABILITADAS** (leitura do Agendador em 27/10). Nenhuma ação.
- [x] **`DrSM-LinkedIn-Agendar`: DESABILITADA** (confirmado).
- [x] **`DrSM-Blob-Rotina-Mensal`: estava READY, contrariando a ordem registrada (manter desativada). Desabilitada em 27/10** (`Disable-ScheduledTask`, estado confirmado `Disabled`).
- [x] **Manutenção semanal (código 1 de segunda): corrigida no branch `fix/manutencao-arvore-limpa-20261026`, commit 2960ece** (worktree `C:/DRS-fix-manut`). A etapa de segunda passa a rodar numa worktree própria a partir de `origin/main`; a árvore suja da pasta principal não bloqueia mais. A sexta envia o branch `chore/manutencao-*` mais recente. Testes unitários 4/4 passam. **Portão completo NÃO rodado** (precisa de `npm ci`, feito pelo próprio script na worktree). Não enviado (push é Classe 2).

## Verificado como pendente (não é do Claude Code resolver)
- [ ] **Autorização do YouTube VENCIDA** em 23/10/2026 (`relatorios/youtube/validade.json`: `autorizacaoVenceEm: 2026-10-23`). Solução definitiva: aprovação da auditoria (sair do modo Testando). **Dr. Antônio.**
- [ ] **`REDES_PUBLICACAO_ATIVA`** existe em production na Vercel. O valor é "sensitive" e não pode ser lido pela API. Confirmar no painel se está `true`. **Dr. Antônio.**
- [ ] **Root Directory** do projeto `drsaudemental`: NÃO verificável pela API disponível (a resposta do projeto não traz o campo e o CLI de fallback falhou). Confirmar no painel (deve estar vazio, conforme a decisão de 25/10). **Dr. Antônio.**
- [ ] **Mecanismo de regeração dos 54 vídeos F**: PR #115 já mesclado; falta a decisão (flag por item ou manter parado) e a confirmação da causa da vinheta antes de regerar. **Dr. Antônio.**
- [ ] **Branches de teste no remoto**: existem `test/vercel-discriminador-20261025` (9f8f1fd) e `test/vercel-reprodutor-147-20261025` (3ac645c). Apagar só com ordem.
- [ ] **RESEND_API_KEY**: NÃO verificável sem ler o `.env` (bloqueado pela regra de segurança). Confirmar no próprio `.env` ou no `docs/alertas-email.md`. **Dr. Antônio.**
- [ ] **CLS no PageSpeed**: nenhuma fonte de dados nesta sessão. **Dr. Antônio** (conferir no PageSpeed).
- [ ] **Teto do `claude -p`**: `TETO = { dia: 3, semana: 15 }` em `scripts/consumoClaude.js`. Último registro em `relatorios/CONSUMO.md` é de 19/10. Comparar com o /usage depois de uma semana. **Dr. Antônio** (leitura do /usage).

## Aguardando ação do Dr. Antônio
- [ ] **Push e PR da manutenção**: `! git -C C:/DRS-fix-manut push -u origin fix/manutencao-arvore-limpa-20261026`, depois PR. Portão antes do merge (`npm run merge-seguro -- <PR>`).
- [ ] **Push dos demais branches locais**: a branch de trabalho da pasta principal está ~22 commits à frente do origin. Push é Classe 2.
- [ ] **Merge dos PRs abertos** (`npm run merge-seguro -- <PR>`, um por vez). Ordem de terça no topo do `relatorios/ESTADO-GERAL.md`:
  - #159 horários · #160 referência · #161 trava da validação · #162 checagem sincronizada · #163 baselines visuais · #164 noindex · #165 contador Meta · #156 docs (depois do #162).
  - #166 cron: remove o `publicar-linkedin` legado e publica as redes todos os dias.
  - #167 LinkedIn: máximo de 2 posts/dia. Pré-requisito para reativar `DrSM-LinkedIn-Agendar`.
  - #168 tarefas: rotina do Blob não é desligada ao recriar tarefas.
  - #169 alerta de crédito Vercel (até lá o dado é manual em `relatorios/vercel-credito.json`).
  - #151 (a11y): PAUSADO.
  - #138 (feat: domínio único etapa 1, rewrites dos 24 textos e assets do app antigo, branch `feat/dominio-unico-rewrite-20261021`): mexe em textos e assets. Decisão do Dr. Antônio antes de mesclar (não é só automação).
  - #145 (merge do origin/main no branch da reescrita de instagram-token): só mescla depois do #138 e da decisão sobre o token.
- [ ] **Reativar `DrSM-LinkedIn-Agendar`** só depois do merge do #167: `Enable-ScheduledTask -TaskName 'DrSM-LinkedIn-Agendar'` (PowerShell como administrador). Causa da desativação não encontrada nos logs.
- [ ] **Carrossel de 28/10 e Reel de amostra** (`C:/DRS-post-check/amostras/reel-amostra-28-10.mp4`): aprovar ou pedir ajuste. Reel: crédito completo "Portal de Saúde Mental Doutor Antônio Felipe Garabito" falta (o quadro mostra "Doutor Antônio Felipe · Saúde Mental"); LanguageTool e Whisper não rodados. Carrossel 28/10: amostra não gerada.
- [ ] **Horários (#159)**: escolher entre `--limite` menor nos dias úteis, publicação às 21:15 ou geração só nos fins de semana.
- [ ] **Links quebrados (9)**: decidir os casos de `relatorios/APROVACAO-ANTONIO.md` (forumseguranca, bvsms retestar, portaldeimigracao). Troca só com identidade comprovada.
- [ ] **Migração do vercel.json**: decisão (a), (b) ou (c). Formato legado funcionou na raiz até 22/10; não é necessária para publicar.
- [ ] **Promoção de deploys de produção**: não promover sem ordem (#153, #146, #150, #154). Produção atual #147.
- [ ] **Auditoria do YouTube**: "Enviar" e formulário (`relatorios/youtube/FALTA-DO-ANTONIO.md`; legendas em aberto).
- [ ] **Vídeo de teste z_JHmmpw880** (privado, "[TESTE PRIVADO]"): não apagado; falta a data de teste. Não há código de exclusão no YouTube.
- [ ] **Sexta 11:00, PR semanal**: `scripts/prSemanal.js` existe; tarefa `DrSM-PR-Semanal` DESABILITADA. Decidir se ativa.
- [ ] **Lote 2, autorizações b, d e f**: sem decisão registrada em `relatorios/AUTORIZACOES.md`.
- [ ] **`.gitignore`** para `relatorios/linkedin/agendamento-lote.json` e `.md`: só por ordem.
- [ ] **Código 1 de propósito** (`DrSM-Conferencia-Diaria`, `DrSM-Rotina-Semanal`): proposta de gravar o alerta e sair com 0. Não aplicada.

## Worktrees e limpeza (só com ordem)
- [ ] Worktrees a remover após merge ou decisão: `C:/DRS-post-check`, `C:/DRS-linkedin2`, `C:/DRS-manut-20261026`, `C:/DRS-promocao`, `C:/DRS-crons`, `C:/DRS-controle`, `C:/DRS-vercel-migra`, `C:/DRS-cand`, `C:/DRS-pr77`, `C:/DRS-deploy-main`, `C:/DRS-docs`, `C:/DRS-registro`, `C:/DRS-sync`, `C:/DRS-noindex`, `C:/DRS-meta`, `C:/DRS-horarios`, `C:/DRS-post`, `C:/DRS-baselines`.
- [ ] Branch atual da pasta principal (`feat/ux-acessibilidade-etapa-b-20261022`): ~56 alterações sem commit. Guardar o trabalho antes de qualquer merge.

## Não executado (aguardando ordem)
- [ ] Lote 2 item 2 (regra de a/b do Blob): correção já na `main`. Confirmar com simulação antes de 01/11.
- [ ] Lote 2 item 4 (fila de 60 posts, >= 20): sem trabalho, pulado.
- [ ] Publicador de LinkedIn: só pelo agendador nativo (regra permanente). Nenhum cron de API ativo após o #166.
