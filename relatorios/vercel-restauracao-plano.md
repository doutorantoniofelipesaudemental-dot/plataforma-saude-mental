# Plano de restauração do Root Directory (25/10/2026)

**1. Causa provável.** H1: o painel de drsaudemental aponta para `apps/plataforma-saude-mental`. Sustentação: o erro do controle v1 (`Root Directory ... does not exist`); o controle v2 dentro de `apps/` builda sem aviso de saída vazia; o código do #147, reproduzido hoje (`e38876f`, mesma árvore), sai vazio. Bissecção: nenhum arquivo de configuração mudou entre o #147 e o DpkaG; entre o DpkaG e o 5RDS mudaram 11 arquivos, todos de `apps/…` de tela. Falta provar: quando o painel mudou (a API não mostra histórico) e se, com Root vazio, o formato legado volta a gerar `functions` e `static` na CLI 65.1.0.

**2. Restauração (você aplica).**
- Caminho: Project Settings > General > Root Directory.
- Valor atual a anotar: `apps/plataforma-saude-mental`.
- Valor novo: vazio (raiz do repositório).
- Desfazer: colar de volta o valor anotado.
- Não alterar "Include source files outside of the Root Directory" (só importa para raiz diferente).
- Nada mais do painel precisa mudar para o formato legado. Build/Install/Output do painel são ignorados quando há `builds` (o log avisa). Configuração zero só importa se o `vercel.json` for removido.

**3. Validação antes de ir ao ar (num preview, depois do ajuste).**
- Log: sem `WARNING ... no "functions", "static"`; resumo com functions e static.
- `/` (home) e uma página interna (`/artigo/migracao-saude-mental`) respondem 200.
- `/privacidade` 200 (não há `/politica-de-privacidade` na main).
- `/api/health` 200.
- Redirecionamentos: `drsaudemental.vercel.app/x` → `www` com 301; `/blog/migracao` → `/artigo/migracao-saude-mental` 301.
- Headers: `/sw.js` com `Service-Worker-Allowed: /`; `/podcast/feed.xml` com content-type RSS.
- Crons: os 6 de `vercel.json` aparecem no resumo do deploy.
- Nomes (não valores) das variáveis de produção presentes.
- Preview tem SSO: a checagem é feita pelo painel ou pela ferramenta autenticada. Não contornar a proteção.

**4. Promoção (só você).**
- Escolha o deploy validado pelo link do inspector.
- Painel: Deployments > o deploy > Promote to Production. Ou CLI: `vercel promote <url>`.
- Não usar rollback. Não promover antes da validação do item 3.

**5. Variáveis.** O novo `INSTAGRAM_ACCESS_TOKEN` só vale em deploy novo. A retomada do Instagram começa só depois da promoção.

**6. PRs mesclados que não estão no ar (desde o #147):**
- #146: narração padrão Edge-TTS e Azure só com ordem. Para o visitante: nenhuma mudança visível.
- #150: documentação do contrato do funil. Nenhuma mudança visível.
- #153: correção do CLS no título dos artigos (fallback da fonte). Visível: título estável ao carregar.
- #154: merge-seguro com worktree. Nenhuma mudança visível.
