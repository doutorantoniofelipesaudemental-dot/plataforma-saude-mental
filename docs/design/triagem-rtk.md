# Triagem RTK (17/11/2026, somente leitura, sem instalar)

Scan: `C:/DRS-tools/scans/rtk.json` (score 100, DO NOT INSTALL, cobertura 86,5%, 0 CRITICAL, 459 HIGH).

## 459 HIGH por categoria
Tool Misuse 345 · Privilege Escalation 41 · Agent Snooping 35 · Supply Chain 19 · Anti-Refusal 6 · YARA Match 5 · System Prompt Leakage 4 · Data Exfiltration 2 · Prompt Injection 1 · outras.

Maiores arquivos: `src/hooks/hook_cmd.rs` (78), `src/hooks/permissions.rs` (69), `src/discover/lexer.rs` (31), `tests/hook_decision_protocol_test.rs` (30), `scripts/benchmark/cloud-init.yaml` (19), `hooks/opencode/rtk.test.mjs` (17).

## Amostra e leitura
- Tool Misuse, Privilege Escalation, System Prompt Leakage, Anti-Refusal: são **texto de instrução e de testes** (`.claude/commands/*.md`, asserts em `src/`). Ex.: `.claude/commands/rtk-no-history-rewrite.md:7` descreve proibições de `git push --force`. **(a) falso positivo provável.**
- Data Exfiltration (Env Variable Harvesting): `hooks/opencode/rtk.ts:141` copia `process.env` para o próprio processo filho. **(a)** no contexto de execução local; sem envio para rede.
- Supply Chain (Concealed Executable Artifact): `.claude/hooks/rtk-rewrite.sh:1`, `pre-commit-format.sh:1`. **(c)** indeterminado: o scanner não mostrou o conteúdo ofuscado; o script de hook foi lido parcialmente (3,6 KB).
- YARA `backdoor_persistence`: `scripts/benchmark/cloud-init.yaml:51` (instalação de Node em VM de benchmark) e texto de `docs/…installation.md:37`. **(a)**.

## Mecanismo de `rtk init -g` (lido no código e no INSTALL.md)
1. Cria `~/.claude/RTK.md` (arquivo de aviso).
2. Adiciona `@RTK.md` ao **`~/.claude/CLAUDE.md` global** (INSTALL.md:116–117).
3. Pergunta "Patch settings.json? [y/N]"; se sim, altera `~/.claude/settings.json` (cria backup em `settings.json.bak`) (INSTALL.md:118–119).
4. O hook (`src/hooks/hook_cmd.rs`, linhas 40–61) recebe o comando do Bash e devolve `updatedInput`: **reescreve o comando antes de executar**.

## Classificação
**(b) comportamento real preocupante**, pelo mecanismo, não pelos achados do scan:
- Reescrita silenciosa de comandos do Bash (`hook_cmd.rs`, `updatedInput`). Pode alterar logs, saída e verificações (exatamente a sua preocupação). Não verifiquei, nesta rodada, quais comandos são reescritos nem o formato da saída.
- Altera configuração global do Claude Code (`~/.claude/CLAUDE.md` e `settings.json`), fora do repositório.

Recomendação: **continua DO NOT INSTALL**. Não é elegível para reavaliação sem aprovação escrita do Dr. e teste dos comandos reescritos.
