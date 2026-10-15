# Auditoria de segurança: ponytail (DietrichGebert/ponytail v5.2.0)

Data: 2026-10-15. Pacote: `C:\DRSAUDEMENTAL\scratchpad\ext\ponytail\repo` (HEAD 84740e3). Somente leitura; nada instalado nem executado.

## Veredito: APROVADO COM RESTRIÇÕES

Restrições:
1. Instalar SÓ o skill (arquivo `skills/ponytail/SKILL.md` e, se quiser, os outros 5 skills), SEM o plugin e SEM hooks.
2. Não usar `/plugin install` (ativa os 3 hooks Node e escreve fora do projeto).
3. O texto do skill é "preguiçoso por design"; usar com a regra de precedência: CLAUDE.md do projeto vence (ver seção 9).

## Tabela dos 7 itens

| # | Item | Resultado | Evidência (arquivo:linha) |
|---|------|-----------|---------------------------|
| 1 | Lê .env / credenciais / chaves | NÃO nos hooks, skills, comandos, scripts e plugins. SIM só em benchmarks (não instalados) | Hooks: nenhum acesso a `.env`; só lêem `settings.json` do Claude para achar `statusLine` (`hooks/ponytail-activate.js:76-83`) e o próprio `config.json` (`hooks/ponytail-config.js:92-94`). Benchmark: `benchmarks/agentic/judge.py:43-48` lê `ROOT/.env` e `ANTHROPIC_API_KEY`; `benchmarks/.env.example:2`. `.gitignore:2-4` ignora `.env`. |
| 2 | Envia dados a terceiros | NÃO no código instalável. Grep por fetch/http/https/net/socket/curl/requests/telemetry em hooks/, scripts/, .opencode/, pi-extension/, skills/, commands/: zero ocorrências de rede | Única rede: `benchmarks/agentic/judge.py:83-85` (POST a `api.anthropic.com`), só em benchmark manual. `benchmarks/agentic/tasks.py:526-541` usa localhost (127.0.0.1) em teste de tarefa. `hooks/ponytail-map.js` só roda `git ls-files` local (`:39`). `scripts/publish-openclaw-skills.js:21,64` usa `spawnSync` (publicação do autor, não faz parte do uso). Workflows: `publish.yml:30` só `npm publish` no CI do autor. |
| 3 | Altera ANTHROPIC_BASE_URL / proxy / roteamento | NÃO | Grep por `ANTHROPIC`, `BASE_URL`, `HTTPS?_PROXY` em todo o repo: só `ANTHROPIC_API_KEY` em benchmarks. Hooks apenas LEEM `CLAUDE_PLUGIN_ROOT`, `CLAUDE_CONFIG_DIR`, `CLAUDE_PROJECT_DIR`, `PONYTAIL_*`, `XDG_CONFIG_HOME`, `APPDATA` (`hooks/ponytail-config.js:55-85`, `hooks/ponytail-runtime.js:20-51`); nenhuma gravação em variável de ambiente. Nenhum `settings.json` do projeto/usuário recebe `env`. |
| 4 | Usa API paga / chama modelos por conta própria | NÃO no uso normal | Hooks/skills não chamam modelo. Só benchmarks (`benchmarks/agentic/judge.py:83`, `complete.py:20`, `run.py:353-364` chama o CLI `claude`, `promptfooconfig*.yaml` Anthropic/Google/OpenAI) e exigem rodar manualmente com chave. Sem eles, custo zero. |
| 5 | O que os hooks fazem | 3 hooks Node, locais, sem rede (detalhe abaixo) | `hooks/claude-codex-hooks.json:3-39` e `.claude-plugin/plugin.json:9` |
| 6 | Instruções ocultas / prompt injection | NÃO encontradas | Varredura Unicode invisível (U+200B-200F, 202A-202E, 2060-2064, FEFF, tags E00xx) em md/toml/js/json: 0 ocorrências. Grep por "ignore previous", "disregard", "override project/CLAUDE.md", "skip tests", "without asking", "do not tell the user": nada. `skills/ponytail/SKILL.md:44`: "Never cut: validation at trust boundaries, error handling..., security, accessibility..., anything the user asked for". Uma ressalva: o hook injeta no contexto um texto "STATUSLINE SETUP NEEDED... Proactively offer to set this up" (`hooks/ponytail-activate.js:147-152`), que manda o agente oferecer editar `~/.claude/settings.json`. Só oferece; vale negar. |
| 7 | Licença | MIT, copyright 2026 DietrichGebert | `LICENSE:1-21`; `package.json:6`; `skills/ponytail/SKILL.md:10` (`license: MIT`). Uso comercial e modificação permitidos; manter o aviso de copyright. |

## 5. Hooks em detalhe (plugin Claude Code)

`hooks/claude-codex-hooks.json`:
- `SessionStart` (startup|resume|clear|compact), linha 3-15: `node -e require(.../hooks/ponytail-activate.js)`, timeout 5 s.
- `SubagentStart`, linha 16-27: `ponytail-subagent.js`.
- `UserPromptSubmit`, linha 28-39: `ponytail-mode-tracker.js`. Roda a CADA prompt, lê o texto digitado, reage a `/ponytail ...` e "stop ponytail" (`hooks/ponytail-mode-tracker.js:46-134`); não registra nem envia o prompt.

Arquivos que escrevem (alguns FORA do projeto):
- `~/.claude/.ponytail-active` (modo) e `~/.claude/ponytail-modes/<sha256 do projeto>` (`hooks/ponytail-runtime.js:44-66`).
- `~/.claude/.ponytail-statusline-nudged` e cópia de `ponytail-statusline.sh|ps1` em `~/.claude/` (`hooks/ponytail-activate.js:112-130`).
- `%APPDATA%\ponytail\config.json` só se o usuário rodar `/ponytail default <modo>` (`hooks/ponytail-config.js:141-156`).
- Não modifica `settings.json` sozinho (só sugere ao agente); o `scripts/uninstall.js:58-92` edita `settings.json` apenas ao desinstalar, se executado manualmente.
- `execFileSync` (só `process.execPath` + `git ls-files`) para montar "mapa do código" injetado no contexto (`ponytail-activate.js:65-70`, `ponytail-map.js:39`): lê até 64 KB por arquivo-fonte do projeto (nomes de funções/exports). Pode ser desligado com `PONYTAIL_MAP=0`. Ele lê arquivos `.js/.py/...` rastreados pelo git; `.env` não casa a extensão (`ponytail-map.js:18`).
- Statusline sugerida usa `powershell -ExecutionPolicy Bypass -File` (`ponytail-activate.js:143`): só roda 8 linhas locais de texto (`hooks/ponytail-statusline.ps1`), inofensivo, mas é bypass de política de execução; recusar.
- Efeito colateral no contexto: cada sessão e cada subagente recebe o texto do SKILL.md como contexto oculto (`ponytail-instructions.js:77-92`).

Outros arquivos lidos sem risco: `.opencode/plugins/ponytail.mjs` (grava `~/.config/opencode/.ponytail-active`, `:31-49`; não é Claude Code), `pi-extension/index.js` (importa só os módulos de hooks), `scripts/cursor-hooks.js` (edita `~/.cursor/hooks.json`, só se rodado), `scripts/uninstall.js`.

## 8. Arquivos mínimos para uso só no Claude Code deste projeto

Opção recomendada: SKILL puro, sem hooks e sem plugin (zero execução de código, zero escrita fora do projeto):
- `skills/ponytail/SKILL.md` (3,5 KB; modo "preguiçoso", níveis lite/full/ultra).
- Opcionais (somente relatório, não alteram código): `skills/ponytail-review/SKILL.md`, `skills/ponytail-audit/SKILL.md`. Não precisa de `ponytail-gain`, `ponytail-help`, `ponytail-debt`.
- Copiar para `C:\DRSAUDEMENTAL\.claude\skills\ponytail\SKILL.md` (projeto) ou `~/.claude/skills/ponytail/SKILL.md`. NÃO copiar `.claude-plugin/`, `hooks/`, `scripts/`, `.opencode/`, `pi-extension/`, `benchmarks/`, `assets/` (10 MB, quase todo imagem).
- Ressalvas do skill isolado: `description` faz o Claude acioná-lo sozinho em "qualquer tarefa de código" (`SKILL.md:3-8`); para evitar, apagar a linha de gatilho ou usar só quando chamado. Os níveis `/ponytail lite|full|ultra` e "stop ponytail" são só texto; sem hooks, não há "modo persistente" nem arquivo de estado. Como o `SKILL.md` diz "Active for the whole session" (`:17`), valerá enquanto estiver no contexto.
- Sem Node necessário. Sem rede.

Não usar: `/plugin marketplace add` + `/plugin install` (ativa os 3 hooks e as escritas em `~/.claude`).

## 9. Conflito com as regras do projeto

Não há instrução para pular testes, backup, dry-run, auditoria, acessibilidade ou CVV/SAMU; o skill não os menciona e protege "security, accessibility, validation, error handling that prevents data loss" (`SKILL.md:44`). Pontos de atrito (leitura do texto, não ordem expressa):
- Testes: exige "um teste pequeno" só para lógica não trivial (`SKILL.md:41`; "Trivial changes need none"). O projeto exige `npm run auditoria` e tripla checagem sempre: o skill NÃO dispensa, mas também não impõe. Vale o CLAUDE.md.
- Backup / dry-run / aprovação "aprovo a etapa X": o skill não trata; "finish every part the task needs" (`SKILL.md:34`) e "Skip features... nobody asked for" não autorizam gravar sem `--aplicar`. Sem conflito direto, mas a ênfase em "diff mínimo" não pode reduzir o backup nem o `--dry-run`.
- Conteúdo médico/CFM, CVV 188 · SAMU 192, avisos de IA, identificação 5 linhas, acessibilidade (44 px, AAA, `prefers-reduced-motion`): o skill pode levar a "omitir o que ninguém pediu" (`SKILL.md:27`, "Skip features, options... nobody asked for") e portanto cortar avisos obrigatórios em textos e artes gerados. Mitigação: o CLAUDE.md já diz que prevalece; incluir a linha abaixo no CLAUDE.md ao instalar.
- Acréscimo sugerido ao CLAUDE.md (se instalar): "Skill ponytail: vale só para código. Nunca omitir: backup, --dry-run, auditoria/tripla checagem, avisos CFM/IA/protocolos locais, CVV 188 · SAMU 192, acessibilidade e identificação do autor. Em conflito, o CLAUDE.md prevalece."
- Os relatórios dos skills de review/audit são em inglês simples (`ponytail-audit/SKILL.md:71`: "Very simple English"); o projeto exige português do Brasil nos textos ao usuário final, mas relatórios internos não são conteúdo publicado. Pedir "responda em português".
- Comentários `shortcut:` no código (`SKILL.md:42`) poluem o repositório; opcional.

## Arquivos lidos

Integral: `hooks/claude-codex-hooks.json`, `hooks/ponytail-activate.js`, `ponytail-config.js`, `ponytail-instructions.js`, `ponytail-map.js`, `ponytail-mode-tracker.js`, `ponytail-runtime.js`, `ponytail-subagent.js`, `ponytail-statusline.sh`, `ponytail-statusline.ps1`; `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `plugin.json`, `plugin.yaml`, `package.json`, `skills/plugin.json`; os 6 `skills/*/SKILL.md`; `AGENTS.md`, `after-install.md`, `LICENSE`; `scripts/uninstall.js`, `scripts/cursor-hooks.js`; `.opencode/plugins/ponytail.mjs`, `.opencode/plugins/index.js`; `.github/workflows/publish.yml`, `test.yml`; `INSTALL.md` (primeiras 60 linhas, mais grep do restante); `commands/ponytail.toml`, `ponytail-gain.toml` (e primeira linha de `ponytail-audit.toml`).

Lidos por grep / trechos: `benchmarks/agentic/judge.py` (:38-90), `run.py` (chamadas subprocess), `tasks.py`, `complete.py`, `promptfooconfig*.yaml`, `benchmarks/README.md`, `.env.example`; `pi-extension/index.js` (imports/escritas); `tests/*.js` (grep de spawn/rede); `README.md` e `INSTALL.md` (grep de curl/npx/pip/git clone/ExecutionPolicy); varredura em todo o repo (exceto assets e .git) de rede, env e Unicode invisível.

## O que não foi possível ler / verificar

- Não li linha a linha: `benchmarks/*` (Python/JS, 1.000+ linhas, só imports e chamadas de rede), `tests/*.test.js`, `pi-extension/test/*`, `examples/*`, `i18n/*`, `docs/*`, `.openclaw/`, `.cursor/`, `.kiro/`, `.windsurf/`, `.clinerules/`, `.devin-plugin/`, `.codex-plugin/`, `.github/plugin/`, `.grok-plugin/`, `.kimi-plugin/`, `.qoder*`, `hooks/copilot-hooks.json`, `qoder-hooks.json`, `cursor-hooks.json`, `scripts/build-openclaw-skills.js`, `check-*.js`, `publish-openclaw-skills.js` (só grep; as cópias de regras têm 30 linhas, equivalentes ao AGENTS.md pelo teste `check-rule-copies.js`, não confirmei diff completo).
- Binários (`assets/*.png|jpg`, 10 MB): não inspecionados (não são carregados pelo skill).
- Dependências transitivas: `package.json` não declara `dependencies`; benchmarks usam `npx promptfoo@latest` (não analisado, e não deve ser executado).
- Não executei nada, então o comportamento em tempo real (ex.: o que o Claude Code faz com o texto injetado) é inferido da leitura.
