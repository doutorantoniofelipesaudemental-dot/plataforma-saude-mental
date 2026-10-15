# Estado geral — Portal de Saúde Mental Dr. Antônio Felipe
Atualizado em 15/10/2026 (checagem geral; atualizar ao final de cada lote futuro). Repositório: `main` = último PR mergeado.

## Domínio
- **Principal único:** `https://www.drantoniofelipemedico.com.br` (canonical, og:url, sitemap, robots, links internos, capas das redes).
- `drantoniofelipemedico.com.br` (sem www) → 308 para o www (Vercel). `drsaudemental.vercel.app` → 301 para o www, **exceto `/api/`** (crons e scripts).
- App Next (`plataforma-saude-mental-steel.vercel.app`): projeto separado, sem domínio próprio; canonical dos textos duplicados e de `/mentoria` e `/links` aponta para o www. Não é linkado a partir do site principal.
- Search Console: pendente (passo a passo no relatório de 15/10).

## Textos
- Domínio principal (MongoDB): **251 publicados**, **475 não publicados** (451 no calendário de 19/10 a 17/12/2026; 24 rascunhos retidos, sem data no calendário).
- App Next: **89 `.mdx`** (77 em `/artigos`, 12 em `/blog`), 65 deles também existem no site principal (canonical para o www). Auditoria: 815 textos, 0 falhas.
- Publicador agendado: cron diário 11:00 UTC; 11 textos por dia útil.

## Instagram
- Fila: **60 posts** aprovados, de **26/10/2026 08:00 (Bahia)** a **20/01/2027**. Primeiro: `2026-10-26-saude-mental-cuidador`.
- **Token:** Instagram Login (IGAA), conta `@doutor.antoniofelipe.smental` (ID 17841415747425012). Validade gravada: **14/12/2026** (estimada). Renovação automática toda segunda 12:00 UTC; **primeira em 19/10**.
- **Freio `REDES_PUBLICACAO_ATIVA`: ATIVO** (`GET /api/admin/freio-redes` → `{"publicacaoAtiva":true}`).

## Narração (Edge-TTS gratuito, voz pt-BR-AntonioNeural)
- Ver `relatorios/narracao-progresso.md`. Em 15/10 (após o lote 3): **200 "ok", 526 faltam** (lotes de 50, custo zero, sem falhas de envio). `benzodiazepinicos-urgencia` (falhou no lote 2) foi gerado e enviado no lote 3. Laço em andamento (`backend/scripts/loop-narracao2.sh`, com pronúncia e limite de 5 min por áudio).
- Pronúncia (dicionário só no texto falado; hash sobre o original): ativa desde o lote 3 para UBS, RQE, SAMU, CAPS, CVV, APS, TCC e **NR-1 ("Norma Regulamentadora número 1", opção B aprovada)**. Áudios já enviados não são regenerados.

## Checagem geral de 15/10/2026 (do zero)
- **Auditoria** (`npm run auditoria`): 815 textos (726 Mongo + 89 `.mdx`), 0 falhas; segurança 0 pendências.
- **DOIs:** varredura de todos os 644 DOIs únicos no Crossref: todos existem; **2 retratados** (Panagioti 2018, em 8 textos; Kamal 2016, em 2) → proposta em `relatorios/referencias-retratadas-proposta.md`, **aguardando OK**.
- **Amostra de 15 textos lidos por inteiro** (5 publicados, 5 agendados, 5 Next): links/imagens/títulos ok; DOIs conferidos; linguagem acolhedora, sem promessa nem estigma; CVV/SAMU presentes nos temas sensíveis; 3 observações editoriais na proposta (portaria do MJSP sem fonte, links das leis, selo "Narrativa composta" em 1 abertura).
- **Testes:** 232 unitários e 31 E2E sem falhas.
- **Lighthouse mobile medido em produção (acessibilidade):** home 100 · /mentoria 100 · /links 100 · artigo `burnout-aps` 100 · relato `relato-paciente-invisivel` 100 · /privacidade 100 (SEO 92 → 100 após corrigir o canonical) · app Next 98 → 100 (`<main>` e erro de hidratação corrigidos no PR #74). Todas as 7 páginas: acessibilidade 100, boas práticas 100, SEO 100.
- **Produção:** www 200; apex 308→www; `vercel.app` 301→www (exceto `/api/`); sitemap-index (artigos 251 + páginas) e robots no www; canonical no www; autoavaliação com caixa de crise do item 9 testada no navegador (sem POST, sem erro de console); freio `{"publicacaoAtiva":true}`; token válido (`@doutor.antoniofelipe.smental`, vence 14/12/2026, 59 dias); fila 60 posts, primeiro `2026-10-26-saude-mental-cuidador` às 08:00 (Bahia).
- **Fila do Instagram, amostra de 5 posts:** capas sem marca d'água, assinatura curta de 3 linhas, CVV/SAMU, sem "psiquiatra" como título, sem #psiquiatria, acentos ok. Varredura das 60 legendas: 0 problemas.

<!-- ROTINA:INICIO -->
## Rotina semanal (última: 15/10/2026) — ATENÇÃO (1 problema(s))
- ⚠ links quebrados: 2
- Narração: 246 ok · faltam 480.
- Detalhe: `relatorios/rotina-20261015.md`. Rodar toda segunda-feira: `npm run rotina-semanal`.
<!-- ROTINA:FIM -->

## Pendências que dependem do Dr. Antônio
1. Decidir sobre a troca das 2 referências retratadas (`relatorios/referencias-retratadas-proposta.md`).
2. (Política de privacidade e pronúncia de NR-1: aprovadas em 15/10/2026.)
3. Cadastrar o www no Search Console e enviar `sitemap-index.xml`.
4. Trocar o link da bio do Instagram para `https://www.drantoniofelipemedico.com.br/links`.
5. Decidir sobre os 24 rascunhos retidos e sobre importar (ou não) os `.mdx` do Next para o site principal.
6. Em 19/10 e 26/10, pedir as conferências abaixo.

## Comandos de conferência
- **19/10 (depois das 12:00 UTC):** pedir "rodar conferência de 19/10" ou `node --env-file=.env scripts/conferirPosRenovacao.js` → `relatorios/conferencia-renovacao-AAAAMMDD.md`.
- **26/10 (depois das 08:00 Bahia):** pedir "rodar conferência de 26/10" ou `node --env-file=.env scripts/conferirPrimeiroPost.js` → `relatorios/conferencia-primeiro-post-AAAAMMDD.md`.
- Estado do token e da fila: `node --env-file=.env backend/scripts/redes/verificarToken.js`.
- Auditoria geral: `npm run auditoria` (somente leitura; `-- --corrigir` aplica só as correções automáticas permitidas).

## Rollback
- **Site principal:** `git revert -m 1 <merge do PR>` na `main` + redeploy (`npx vercel --prod`), ou, mais rápido, promover na Vercel o deploy anterior (projeto `drsaudemental` → Deployments → ⋯ → Promote).
- **App Next:** mesmo processo no projeto `plataforma-saude-mental` (pasta `apps/plataforma-saude-mental`).
- **Redes:** parar na hora = `REDES_PUBLICACAO_ATIVA=false` na Vercel (Production) + redeploy.
- **Dados:** backups em `backups/` (identificação única, assinatura TCC, referências, `redes-v2-urltexto-20261015`).
