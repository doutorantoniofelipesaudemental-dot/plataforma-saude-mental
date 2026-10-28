# Fontes: migração do vercel.json (25/10/2026)

Critério: documentação oficial da Vercel primeiro; comunidade só como hipótese.

- https://vercel.com/docs/errors/error-list — Zero Config sem `api/` e sem `vercel.json` espera um script `build` que gere `public/`; saída ausente, vazia ou inválida gera erro. Não explica o aviso "no functions, static, or services" com as nossas condições.
- https://vercel.com/docs/project-configuration/vercel-json — `functions` não pode ser combinado com `builds` (legado); `buildCommand` e `outputDirectory` no vercel.json sobrescrevem o painel do projeto.
- https://vercel.com/docs/project-configuration/vercel-toml — `buildCommand`, `outputDirectory` e `cleanUrls` são chaves de topo do vercel.json (confirma o formato usado).
- https://innei.in/skills/vercel-build-output-routes — comunidade, HIPÓTESE: rotas do Build Output; não usada como base.
- https://tessl.io/registry/tessl/npm-vercel--static-build — comunidade, HIPÓTESE: build estático legado; não usada como base.

Lacuna: não achei na documentação oficial a condição exata do aviso "Build output contains no functions, static, or services".

## Root Directory e rollback (25/10/2026, pesquisa da ordem 80c1)
- https://vercel.com/docs/monorepos/monorepo-faq — opção "Include source files outside of the Root Directory" (projetos novos a partir de 2020 vêm ligados; exige CLI ≥ 20.1.0); só permite alcançar arquivos fora da pasta, não muda onde o vercel.json é lido.
- https://vercel.com/docs/instant-rollback — após rollback, pushes para a produção não publicam sozinhos até promover outro deploy (Undo Rollback ou `vercel promote`).
- https://vercel.com/docs/deployments/promoting-a-deployment — promover um deploy encerra o estado de rollback; a configuração antiga pode estar desatualizada.
- https://community.vercel.com/t/help-needed-configuring-root-directory/7436 — comunidade, HIPÓTESE: monorepo com config na raiz não encontrada quando o Root Directory aponta para subpasta; não usada como prova.
- Lacuna: a documentação consultada não confirma se vercel.json pode alterar um Root Directory inexistente; a conclusão vem dos próprios logs de deploy.

## Pesquisa da ordem de 25/10/2026 (bissecção e restauração)
- https://vercel.com/docs/cli/release-notes — índice das notas da CLI; a busca não trouxe entrada da 65.1.0 nem mudança para o formato `builds`. Lacuna: conferir a página diretamente.
- https://vercel.com/changelog/legacy-build-image-is-being-deprecated — imagem de build legada descontinuada (2025); não explica a saída vazia de 2026.
- https://community.vercel.com/t/deploying-outputs-fails-with-internal-error-zero-output-artifacts/45391 — comunidade, HIPÓTESE: build sem artefatos; não confirma a causa.
- https://community.vercel.com/t/fixing-serverless-functions-404-errors-in-vercel-monorepo-deployments/31936 — comunidade, HIPÓTESE: monorepo com funções fora da raiz; relevante ao Root Directory, não usada como prova.
- Não encontrado na documentação oficial: texto exato do aviso "Build output contains no functions, static, or services"; como fixar a versão do builder em `builds` (campo `use`); como fixar a versão da CLI.
- https://vercel.com/docs/instant-rollback e https://vercel.com/docs/deployments/promoting-a-deployment — promoção encerra o rollback; `vercel promote` aplica a promoção (já registrado).
- Não encontrado: fluxo oficial de deploy de produção sem atribuir domínio antes da validação.
- Não confirmado: se o "Redeploy" usa as configurações atuais do projeto. Fonte indireta: https://vercel.com/docs/projects/environment-variables/managing-environment-variables — variáveis alteradas valem só para deploys novos.
