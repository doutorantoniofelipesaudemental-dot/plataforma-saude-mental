# Estado geral — Portal de Saúde Mental Dr. Antônio Felipe
Atualizado em 15/10/2026 (atualizar ao final de cada lote futuro). Repositório: `main` = último PR mergeado.

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
- Ver `relatorios/narracao-progresso.md`. Em 15/10: 101 "ok", 625 faltam, em lotes de 50. Custo zero.
- Pronúncia (dicionário só no texto falado; hash sobre o original): ativa nos próximos lotes para UBS, RQE, SAMU, CAPS, CVV, APS, TCC. **NR-1 fora** até a sua escolha.

## Pendências que dependem do Dr. Antônio
1. Ouvir `relatorios/teste-pronuncia/frase3-a.mp3` ("NR um") e `frase3-b.mp3` ("Norma Regulamentadora número 1") e escolher (recomendação: b).
2. Revisar `relatorios/politica-privacidade-revisar.md`.
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
