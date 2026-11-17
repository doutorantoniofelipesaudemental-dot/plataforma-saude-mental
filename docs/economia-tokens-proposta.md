# Economia de tokens nativa — proposta (17/11/2026)

Nada ativado. Proposta em `.claude/settings.proposta.json` (nome inativo).

## Contexto medido (chars ÷ 4 ≈ tokens)

| Arquivo | Chars | ~Tokens |
|---|---|---|
| CLAUDE.md | 41.982 | ~10.500 |
| docs/GUIA-MESTRE-DRSM.md | 44.723 | ~11.200 |
| .claude/skills/agendar-linkedin/SKILL.md | 4.721 | ~1.180 |
| .claude/skills/guia-drsm/SKILL.md | 2.353 | ~590 |
| Demais SKILL.md | 0,8 a 3,5 mil cada | ~200 a 900 cada |

Pastas grandes que o Claude Code poderia ler sem necessidade: `relatorios/` (73 MB), `assets/` (5,3 MB), `public/assets/` (0,7 MB), `.tmp/`, `backups/`, `importacao-completa/`. `node_modules` não existe na raiz.

MCPs: o `.mcp.json` da raiz não tem servidores configurados. Não encontrei MCP de projeto ativo nesta leitura; MCPs do usuário não auditados.

## Medidas propostas

| # | Medida | Economia estimada | Risco | Como desfazer |
|---|---|---|---|---|
| 1 | `permissions.deny` com `Read` em `relatorios/**`, `backups/**`, `.tmp/**`, `node_modules/**`, `assets/**`, `importacao-completa/**` | Evita leitura acidental de até dezenas de MB; economia variável, não medida | Bloquear leitura de algo que o Dr. precise; afeta tarefas que leem relatórios | Remover as linhas do `permissions.deny` |
| 2 | Mover trechos do CLAUDE.md (seções de histórico datado, ex.: "Decisões de 2x/10", "Correções pós-plano") para docs/ carregados sob demanda | ~3.000 a 5.000 tokens por sessão (estimativa de seções) | Regra deixar de ser lida automaticamente; o CLAUDE.md é a fonte de regras. Só propor, sem editar | Voltar o trecho ao CLAUDE.md |
| 3 | Subagentes em modelo mais leve (já é `model: sonnet` em `.claude/agents/`) | Já aplicado; nenhuma economia nova | — | — |

## Não confirmado (não incluído)

- `claudeMdExcludes`: a pesquisa trouxe só espelhos da documentação. Não entrou.
- `effortLevel` (limite de raciocínio): valores citados por espelhos ("low", "medium", "high", "xhigh"). Não confirmei em code.claude.com/docs/en/settings. Não entrou.
- Regras de permissão: a sintaxe `Read(./pasta/**)` já está em uso no próprio `.claude/settings.json`, então é a usada aqui.

## Para ativar (decisão do Dr.)

Copiar apenas `permissions.deny` de `.claude/settings.proposta.json` para `.claude/settings.json`, mesclando com as 45 regras existentes. Não apagar nenhuma.

## Confirmado na documentação oficial (17/11/2026)

Fonte: https://code.claude.com/docs/en/settings-reference.md (lida diretamente, 17/11/2026).

- **`effortLevel`**: existe. Valores `low`, `medium`, `high`, `xhigh`. Padrão para modelos sem nível salvo. Sugestão `medium`: mais barato, menos raciocínio. Não recomendado para tarefas clínicas. Só como opção comentada.
- **`claudeMdExcludes`**: existe. Array de globs. Exemplo oficial `["**/vendor/**/CLAUDE.md"]`. **Risco:** pode tirar o CLAUDE.md do projeto do contexto carregado. Não usar para o CLAUDE.md da raiz. Só como opção comentada.
- Nada ativado. `.claude/settings.proposta.json` não é carregado pelo Claude Code.
