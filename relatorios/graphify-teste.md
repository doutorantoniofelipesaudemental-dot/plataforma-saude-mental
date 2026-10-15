# Graphify — instalação e teste (15/10/2026)

Auditoria: `relatorios/auditoria-graphify.md` (APROVADO COM RESTRIÇÕES). Instalado em `tools-graphify/venv` (fora do Git), versão fixa `graphifyy==0.9.91`. **Sem** `graphify install`, sem hooks, sem chave de LLM (extração `--code-only`, AST local). Exclusões em `.graphifyignore` (`.env*`, `backups/`, `relatorios/`, `scratchpad/`, `node_modules/`, `backend/data/`, mídia, textos .md/.mdx/.json, exportações). `graphify-out/` e `tools-graphify/` no `.gitignore`.

Grafo: 214 arquivos de código, 2 191 nós, 4 214 arestas. Para atualizar: `graphify update .` (com `GRAPHIFY_NO_TIPS=1 GRAPHIFY_NO_AUTO_REFRESH=1`, ambiente sem chaves).

## 3 perguntas (bytes devolvidos ao modelo)
| Pergunta | Ler os arquivos | grep -n | `graphify explain` |
|---|---|---|---|
| Quem usa `hashNarracao`? | 44 574 | 3 327 | ~330 (ambíguo: 2 nós) + ~800 com o id |
| Quem chama `publicarVencidos` e o que ela chama? | 9 807 | 781 | ~780 (7 conexões com arquivo:linha) |
| Onde se aplica `exigirRedesAtivas`? | 41 636 | 920 | ~420 (ambíguo) + resposta com id |

**Conclusão:** ganho grande contra ler arquivos inteiros (≈ 90%+), pequeno contra um `grep -n` bem feito, e o grafo acrescenta quem é chamado (callees). Mantido como **ferramenta opcional de consulta** (`graphify explain <id>`), sem hook automático (o hook injeta lembretes e não traz ganho adicional comprovado). Se não for usado em 2 semanas, remover `tools-graphify/`.
