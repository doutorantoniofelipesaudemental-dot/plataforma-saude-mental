# Decisão de segunda 08:00: fase 3 (domingo 25/10/2026, 13:42 Salvador)

Faltam 8 h 18 min até 22:00. Parte 2 sem execução.

## Correção de premissas
- Plano da conta: PRO (leitura da API). Os registros fase 1 e 2 assumiram Hobby: errado. No Pro, logs ficam 1 dia (não 1 h). A precisão do cron no Pro não foi verificada.
- `productionBranch = main`; `autoAssignCustomDomains = false` (leitura). Merge na main cria deploy de produção, mas não move o domínio.

## Parte 1: post de 26/10
1.1 O publicador NÃO lê `checagem-tripla.md`. Publica do banco (`redes_v2`, `redes_v2_img`). Conteúdo vem de `conteudo/redes-v2/` (ignorada pelo Git) via `enviarFila.js`, que faz `replaceOne`. Alterar arquivos do repositório não muda a publicação; a promoção também não.

1.2 Revisão:
- T1: 5 telas, 5 alt, 5 hashes iguais ao `meta.json`. "Antônio" com acento nas 5 telas (visto) e na legenda. Crédito do Portal na tela 5 e na legenda. Sem "psiquiatra" nem #psiquiatria. 3 hashtags; legenda 1.214 caracteres. Links 200 (artigo e home). IA, orientação geral e CVV 188 · SAMU 192 presentes.
- FALHA: as telas trazem 2 linhas de assinatura. Falta "Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)" (padrão de 3 linhas). A legenda tem as 3.
- T2: meta-análise = Pinquart e Sörensen (2003, Psychology and Aging, 84 estudos). Referências completas no artigo publicado (Brodaty e Donkin, 2009, incluído). Legenda só abrevia; erro de formatação "Psychol Aging ,". Ressalva formal.
- T3: sem promessa, sem diagnóstico, linguagem acolhedora. OK.
- Triagem gemma2:9b: {"aprovado": true, "motivos": []}. Só triagem.
- Conteúdo clínico novo: nenhum.

1.3 Decisão: RECOMENDAR [B]. A arte falta a terceira linha de identificação (falha de identificação). Corrigir exige nova arte, novos hashes, `enviarFila` e nova checagem: não dá antes das 08:00 de segunda.
- [B], passos (você): hoje, `Vercel → drsaudemental → Settings → Cron Jobs → Disable Cron Jobs`. Religar: mesma tela, `Enable`, depois das 17:30 de segunda.
- Efeitos: site faz catch-up ao religar (publica tudo vencido). Redes não fazem catch-up: 1 por dia útil; "mais lidos primeiro" pode inverter a ordem por data. Token: renovação pulada enquanto desligado.
- Recomendo [B] só se você aceitar parar também os textos agendados do site.

1.4 Registro corrigido: worktree `C:/DRS-registro`, branch `fix/registro-tripla-cuidador-20261025`, commit `3f0ea6d`, arquivo `registros/tripla/2026-10-26-saude-mental-cuidador.md` (revisão de 13:36). Portão leve aprovado. O `checagem-tripla.md` original (ignorado pelo Git, pasta principal) NÃO foi alterado: para substituir, `cp C:/DRS-registro/registros/tripla/2026-10-26-saude-mental-cuidador.md C:/DRSAUDEMENTAL/carrosseis-instagram/saude-mental-cuidador/checagem-tripla.md`. Não afeta a publicação.

1.5 Outros 6 posts: checagem automática sem discrepância (telas x hashes, acento, crédito, psiquiatra, CVV). Não conferi visualmente a 3ª linha da assinatura. Revalidar na terça às 17:30: 27/10 (5 telas), 28/10 (7), 29/10 (6), 30/10 (5), 03/11 (7), 04/11 (6).

## Parte 2: cronograma
2.1 A pasta principal (`feat/ux…`) tem os scripts antigos (idênticos a `origin/main`). As tarefas apontam para `C:\DRSAUDEMENTAL` (caminhos absolutos). O script calcula `$raiz` a partir de `$PSScriptRoot`: rodar de um worktree re-aponta as tarefas. Nunca rodar de `C:/DRS-horarios`.

2.2 (a) Os 6 arquivos não diferem entre HEAD e `origin/main`; suas modificações são só locais. Entre os 55 caminhos alterados, nenhum muda entre HEAD e a main: `git checkout main` não é bloqueado pelo Git. (b) PR 156 toca CLAUDE.md e LICOES, que têm modificações locais: o `pull` daria conflito; guardar antes (passo c). (c) `fila.json` e `FILA-MANUAL.md` são regravados por `DrSM-LinkedIn-Agendar` (11:00): não trocar de branch durante a execução. (d) Tarefas agora: nenhuma rodando. Próximas: Narração (14:00, antigo), Gera-Mídia (15:30, antigo), YouTube Publica (17:15, antigo), Conferência (26/10 09:30, antigo), LinkedIn-Agendar (26/10 11:00, Ready; a ordem pede desativada), Manutenção (26/10 11:00), Rotina (26/10 07:30, antigo), Blob (01/11 03:00, Ready; a ordem pede desativada), LinkedIn-Lembrete (desativada). (e) Microsoft Learn: `IgnoreNew` não inicia nova instância com uma rodando; `StartWhenAvailable` roda a tarefa perdida assim que possível. Não achei confirmação de que `Register-ScheduledTask -Force` interrompe execução em curso: usar `Stop-ScheduledTask` antes por segurança.

2.3 Sequência (hoje, 19:00 a 21:30; você executa). Antes: merge do PR horários na main.
- a) Backup: `mkdir -p C:/DRSAUDEMENTAL/backups/pre-alinhamento-20261025 && cp C:/DRSAUDEMENTAL/CLAUDE.md C:/DRSAUDEMENTAL/relatorios/AUTORIZACOES.md C:/DRSAUDEMENTAL/relatorios/LICOES.md C:/DRSAUDEMENTAL/relatorios/PENDENTES.md C:/DRSAUDEMENTAL/relatorios/linkedin/FILA-MANUAL.md C:/DRSAUDEMENTAL/relatorios/linkedin/fila.json C:/DRSAUDEMENTAL/backups/pre-alinhamento-20261025/` (confirmar `backups/` no `.gitignore`)
- b) `git -C C:/DRSAUDEMENTAL branch backup/feat-ux-20261025`
- c) `git -C C:/DRSAUDEMENTAL switch -c estado/pasta-principal-20261025` e depois `git -C C:/DRSAUDEMENTAL commit -am "estado: registros locais antes do alinhamento"` (confirmar a lista de arquivos; decisão sua)
- d) `git -C C:/DRSAUDEMENTAL checkout main && git -C C:/DRSAUDEMENTAL pull --ff-only`
- e) `grep -c "17:35" C:/DRSAUDEMENTAL/scripts/agendar-tarefas-windows.ps1` (e o mesmo para 19:45, 20:15, 20:45; esperado ≥ 1)
- f) `powershell -ExecutionPolicy Bypass -File C:/DRSAUDEMENTAL/scripts/agendar-tarefas-windows.ps1 -Simular`
- g) `powershell -ExecutionPolicy Bypass -File C:/DRSAUDEMENTAL/scripts/agendar-tarefas-windows.ps1`
- h) `powershell -NoProfile -Command "Get-ScheduledTask -TaskName 'DrSM-*' | ForEach-Object { $_.TaskName + ' ' + $_.State }"`
- Desfazer: `git -C C:/DRSAUDEMENTAL checkout feat/ux-acessibilidade-etapa-b-20261022` e rodar o script antigo a partir dele.

2.4 Comandos corrigidos (na ordem):
1. `git -C C:/DRS-promocao push -u origin docs/vercel-promocao-20261025` (já feito; inclui os commits novos)
2. `git -C C:/DRS-horarios push origin feat/horarios-presenca-20261025` (commit `f6e0f6c`)
3. `git -C C:/DRS-registro push -u origin fix/registro-tripla-cuidador-20261025`
4. `cd C:/DRS-horarios && gh pr create --base main --head feat/horarios-presenca-20261025 --fill`
5. `cd C:/DRS-registro && gh pr create --base main --head fix/registro-tripla-cuidador-20261025 --fill`
6. `cd C:/DRS-promocao && gh pr create --base main --head docs/vercel-promocao-20261025 --fill`
7. `cd C:/DRS-horarios && npm run merge-seguro -- <N_horarios>`
8. `cd C:/DRS-docs && npm run merge-seguro -- 156`
9. `cd C:/DRS-registro && npm run merge-seguro -- <N_registro>`
10. `cd C:/DRS-promocao && npm run merge-seguro -- <N_promocao>`
- Cada `merge-seguro` roda no worktree limpo do próprio branch, porque troca de branch na sua raiz e recusa branch aberto noutro worktree sujo.
- Promoção: merges não dependem dela. Como `autoAssignCustomDomains = false`, o merge cria deploy sem mover domínio. Horário e registro podem entrar antes (código e documentação). PR 156 deve entrar antes de qualquer promoção, para o rollback apontar para uma main conhecida.

2.5 Conferência do branch `feat/horarios-presenca-20261025`:
- Erro corrigido (commit `f6e0f6c`): a narração leva ~2 h (logs de 17/10: 22:03 no 1º lote, 00:01 no 4º). Havia sobreposição de sábado e domingo. Agora: narração seg a sex 17:35 e sáb 20:30; gera-mídia seg a sex 19:45 e dom 10:00; conferência seg a sex 18:15, sáb 21:00, dom 09:00.
- Gera-mídia: mediana 47 s/item, p90 307 s. Com 25 itens: mediana ~20 min; pior caso > 2 h. Decisão sua: manter `--limite=25` ou reduzir.
- YouTube Publica seg a sex 20:15 pode pegar itens não prontos; a trava diária impede repetir no dia. Alternativa: 21:15.
- Fora das janelas: LinkedIn-Agendar e Blob estão Ready (a ordem pede desativadas). Manutenção (11:00) não está no `ps1`; proposta 18:00 seg e sex, a confirmar onde é registrada.
- Quinta: ordem diz até 22:00; CLAUDE.md diz plantão a partir de 17:30 (confirmar). Conferência saiu das 09:30.
- Portão aprovado após a correção (31 e2e). Testes de horário 14/14.

## Parte 3
3.1 Erro 190, hoje:
1. developers.facebook.com → Meus apps: confira o ID do app do erro (2037156996934639) com o app do projeto (só compare IDs).
2. Se o app estiver em Desenvolvimento: Funções do app → Testadores do Instagram; conta listada.
3. Instagram (celular): Configurações → Sites e apps (ou convites de testador); aceite o convite pendente.
4. Ferramenta de depuração de token: validade e escopos, sem exibir o valor.
5. Se inválido: gerar novo pelo Instagram Login do mesmo app, com permissões de publicação (conferir nomes na doc do Business Login).
6. Trocar por token de longa duração no servidor e pôr no ambiente da Vercel. A credencial cifrada no banco tem prioridade: a renovação a substitui.
7. Confirmar depois pela depuração de token (não pelo verificador).
- Não colar token, app secret, senha ou código. Detalhes: `relatorios/instagram-erro-190-20261025.md`.

3.2 Manutenção-Semanal: `--sexta` recusa branch fora de `chore/manutencao`; `--segunda` recusa árvore suja. Correção mínima (não aplicada): worktree dedicado no branch de manutenção, log em caminho fixo. Não afeta publicações.
3.3 Consolidação: `relatorios/consolidacao-registros-20261025.md` (arquivo novo).
3.4 Plano: Pro. O Hobby é restrito a uso pessoal/não comercial (https://vercel.com/docs/limits/fair-use-guidelines).

## Lições
- `date` do Git Bash é UTC: horários em Salvador via PowerShell `Get-Date`.
- "Mais lidos primeiro" fura a ordem por data.
- Confirmar o plano pela API antes de escrever limites de cron e logs (errei: Hobby).
- Medir a duração antes de montar cronograma; `merge-seguro` só em worktree limpo.

## Commits
- docs (C:/DRS-promocao): 8363441, 1f12916, cf6f22f, bc3c925, 8d2c466 e o desta fase.
- horários (C:/DRS-horarios): 3a61d11, f6e0f6c.
- registro (C:/DRS-registro): 3f0ea6d.
