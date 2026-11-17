# Triagem dos scans SkillSpector (17/11/2026, ~06:15)

Somente leitura. Nada instalado. Scans `--no-llm --format json`, um processo por vez, em `C:/DRS-tools/scans/`. Trechos lidos das linhas em volta dos achados, sem execução.

## 1. Calibração (o scanner é ruidoso?)

| Alvo | Veredito | Achados | Cobertura |
|---|---|---|---|
| `.claude/skills/guia-drsm` (minha skill) | SAFE, score 0 | 0 | 100% |
| `.claude/skills/ponytail` (cópia local) | SAFE, score 0 | 0 | 100% |

Conclusão: em skill pequena, o scanner não gera ruído. Os vereditos DO NOT INSTALL anteriores vieram de **repositórios inteiros** (código, testes, benchmarks), com cobertura parcial de 28% a 86%. Leia-os como "há código de rede/credencial no repositório", não como "a skill é perigosa".

Não foi possível rodar os DrSM-* (são tarefas do Agendador do Windows, não arquivos de skill).

## 2. Triagem dos CRITICAL

| Ferramenta | CRITICAL | Arquivo:linha | O que faz | Classe |
|---|---|---|---|---|
| Caveman | 2 (mesmo arquivo, duas cópias) | `skills/caveman-compress/scripts/compress.py:817` | Envia `Authorization: Bearer <chave>` (variável de ambiente) para um endpoint configurável por variável de ambiente, opcional, só se o usuário ativar a compressão por API. | **(b)** credencial enviada a endpoint configurável |
| UI UX Pro Max | 5 | `.claude/skills/design/scripts/logo/generate.py:240` e `:273` (cópia em `cli/assets/`) | Gera logo/imagem por API externa usando chave de variável de ambiente. | **(b)** credencial a serviço externo |
| UI UX Pro Max | (incluído) | `scripts/refresh-google-fonts.py:95` | Lê `GOOGLE_FONTS_API_KEY` e consulta a API do Google. Só com `--live`. | **(b) leve**: serviço esperado, mas é rede com chave |
| Graphify | 3 | `tests/test_hooks.py:469, 486, 537` | `exec`/`compile` em testes unitários. | **(a)** falso positivo provável (código de teste) |
| Ponytail (upstream) | 1 | `benchmarks/agentic/judge.py:85` | Chama `api.anthropic.com` com a chave, em benchmark. Não faz parte da skill instalada. | **(c)** indeterminado: fora do conteúdo da skill; chamada à API oficial |
| RTK | 0 | — | Sem CRITICAL. HIGH (459) não triado nesta rodada. | — |

Nenhum achado indica exfiltração para domínio não declarado nem leitura do `.env`. Mesmo assim, a classe (b) impede a recomendação de instalação: qualquer ferramenta que mande chave para um endpoint configurável exige decisão do Dr.

## 3. Recomendação

- Caveman, UI UX Pro Max, Graphify, RTK: **continuam DO NOT INSTALL**. Não há (b) ausente para liberar.
- Ponytail (cópia local): **mantida**, scan SAFE em 100% da própria skill. O upstream não é o que está instalado.
- Nenhuma recomendação foi alterada. Elegível para reavaliação: **nenhuma** nesta rodada.

## 4. Divergência do Ponytail

| Item | Local (`.claude/skills/ponytail/SKILL.md`) | Upstream (`skills/ponytail/SKILL.md`) |
|---|---|---|
| `argument-hint` | `[lite\|full\|ultra]` | `[lite\|full\|ultra\|off]` (falta `off` no local) |
| Outras skills do repositório | só `ponytail` | também `ponytail-audit`, `-debt`, `-gain`, `-help`, `-review` (não instaladas) |
| Auditoria anterior | `relatorios/auditoria-ponytail.md`: "APROVADO COM RESTRIÇÕES" (74 linhas) | — |

Não alterado. Decisão para o Dr.: atualizar o `argument-hint` (um texto) ou manter a cópia como está.

## 5. RTK (17/11/2026, somente leitura)

Scan: score 100, DO NOT INSTALL, cobertura 86,5%, 0 CRITICAL, 459 HIGH. Detalhe completo em `docs/design/triagem-rtk.md`.

- **(a) falso positivo para a maioria dos 459 HIGH:** Tool Misuse (345), Privilege Escalation (41), System Prompt Leakage, Anti-Refusal e YARA em texto de instrução e de testes (ex.: `.claude/commands/rtk-no-history-rewrite.md:7`).
- **(b) comportamento real preocupante, pelo mecanismo:**
  - `rtk init -g` cria `~/.claude/RTK.md` e acrescenta `@RTK.md` ao `~/.claude/CLAUDE.md` global (INSTALL.md:116–117).
  - Oferece patch do `~/.claude/settings.json`, com backup (INSTALL.md:118–119).
  - O hook (`src/hooks/hook_cmd.rs`, linhas 40–61) devolve `updatedInput` e **reescreve o comando antes da execução**. Pode alterar logs e verificações.
- **(c)** `.claude/hooks/rtk-rewrite.sh:1` (Concealed Executable Artifact): não confirmado por completo.

**Conclusão:** NÃO instalar. Elegível para reavaliação somente com aprovação escrita do Dr. e teste dos comandos reescritos.
