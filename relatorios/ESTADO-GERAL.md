# Estado geral — Portal de Saúde Mental Dr. Antônio Felipe
Atualizado em 15/10/2026 (operação sem o Claude; checagem geral; atualizar ao final de cada lote futuro). Repositório: `main` = último PR mergeado.

## EM ANDAMENTO (16/10/2026) — ver relatorios/PROMPT-ATUAL.md
- Etapa 1: feita (abaixo). Etapa 2: rebase + auditoria 0 falhas + build + 247 unit + 31 e2e OK; **PR NÃO aberto: push bloqueado pelas permissões** (aguarda comando do Dr. Antônio).
- Etapas 3.3, 4.1, 4.3: aguardam merge/deploy da vinheta (2.4). 4.2: varredura sem promessas; 1 título do LinkedIn aguarda decisão. 6: tarefas registradas (Narração-Noite desativada). 5/7: ver relatório.

## Etapa 1 — produção do PR #77 (16/10/2026)
- PR #77 mergeado (d339b9f); deploy dpl_GsQtdoqZQa9f9xD6zWk7RaVrXBm4 Ready. Rollback: Promote de dpl_5T42Da4GYLjXEkJRJWh9wtiSLsQd (main do #76).
- OK em produção: home, /mentoria, /links (200), /api/health (banco conectado), artigo com <audio> e MP3 (206 audio/mpeg), capa no Blob (200), rotas cron e admin existem (401 sem token), cron publicar-linkedin registrado em vercel.json (seg/qua/sex 22:30 UTC).
- Freios: Instagram ativo (REDES_PUBLICACAO_ATIVA); LINKEDIN_PUBLICACAO_ATIVA e YOUTUBE_PUBLICACAO_ATIVA NÃO existem na Vercel = desligados.
- Trava B (parte "não acessível"): passa. Texto agendado imagem-corporal-o-que-e: página e API 404, fora da listagem, URL do Blob pelo selo 404; o MP3 fica só em narracoes-geradas/ até a publicação. Parte "passa a tocar ao publicar": só validada no dry-run (0 publicados sem áudio); teste real = 19/10 08h (Bahia).
- Blob: 1017 MB de 1024 MB; 288 narrações órfãs (314 MB). Lista completa depende de ajuste no endpoint (ver relatório).

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
- Ver `relatorios/narracao-progresso.md`. **Os 251 textos publicados estão com áudio "ok"** (inclusive os 5 refeitos após a troca das referências retratadas). Os 475 agendados só podem receber o áudio depois de publicados: os MP3 estão sendo **pré-gerados** (50 por lote, laço `backend/scripts/loop-narracao3.sh`, selo de hash por texto) e são enviados no dia da publicação com `node --env-file=.env backend/scripts/enviarNarracoesPublicadas.js --enviar` (rodar depois do cron das 11:00 UTC; texto editado depois de narrado não é enviado).
- Pronúncia (dicionário só no texto falado; hash sobre o original): ativa desde o lote 3 para UBS, RQE, SAMU, CAPS, CVV, APS, TCC e **NR-1 ("Norma Regulamentadora número 1", opção B aprovada)**. Áudios já enviados não são regenerados.

## ⚠ Incidente aberto (15/10/2026 20:40 UTC): Vercel Blob bloqueado
O store Blob do plano Hobby atingiu o limite de 1 GB ("Your store is blocked"): capas e áudios hospedados nele dão 403 no site. As narrações dos agendados NÃO foram enviadas (500 por cota). Ver `relatorios/SE-ALGO-DER-ERRADO.md` §3. **Depende do Dr. Antônio:** liberar espaço no painel (Storage) ou trocar de plano; depois `npm run ciclo-narracao`.

## Operação sem o Claude (atualizado em 15/10/2026)
**O que roda sozinho e quando**
| O quê | Onde | Quando |
|---|---|---|
| Publicar textos agendados | cron Vercel `/api/cron/publicar-agendados` | diário 11:00 UTC (8h Bahia), a partir de 19/10 |
| Instagram (fila de 60 posts) | cron Vercel `/api/cron/publicar-redes-v2` | seg–sex 11:00 UTC; **1º post 26/10 08:00 Bahia** |
| Relatório semanal das redes e renovação do token do Instagram | crons Vercel | segunda 12:00 UTC |
| LinkedIn (37 textos) | cron Vercel `/api/cron/publicar-linkedin` (**após o merge do PR #77**) | seg/qua/sex 22:30 UTC (19:30 Bahia); **1º post 28/10**; precisa da autorização (`relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md`) |
| YouTube (42 longos + 67 Shorts planejados; 15 longos e 22 Shorts já com vídeo pronto) | Agendador do Windows, `DrSM-YouTube-Publica` | diário 12:30; **1º longo 27/10 18:00, 1º Short 28/10 12:00**; precisa de OAuth (`relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md`) e do computador ligado |
| Rotina semanal (auditoria, links, token, freio, fila, narração) | Agendador do Windows | segunda 07:30 |
| Ciclo de narração (gera e envia MP3; agendados sobem antes e só tocam após publicar) | Agendador do Windows | diário 22:00 (bloqueado enquanto o Blob estiver cheio) |
| Geração de vídeos que faltam | Agendador do Windows | diário 23:30 |
| Conferências 19/10 e 26/10 | Agendador do Windows | 19:30 Bahia |
Registrar as tarefas do Windows (uma vez): `powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1`.

**Freios:** `REDES_PUBLICACAO_ATIVA` (geral, Vercel; no `.env` local está `false`, o que também bloqueia o publicador local do YouTube até você ligar) · `LINKEDIN_PUBLICACAO_ATIVA` (Vercel) · `YOUTUBE_PUBLICACAO_ATIVA` (`.env` local) · remover `CRON_SECRET` pausa todos os crons da Vercel.

**Filas manuais:** `relatorios/youtube/fila-manual/` e `relatorios/linkedin/fila-manual/` (uma pasta por semana), `relatorios/linkedin/newsletters/`. Propostas aguardando aprovação: `relatorios/youtube/propostas/mentoria/` e `relatorios/linkedin/propostas/post-mentoria-PROPOSTA.md`.

**Depende do Dr. Antônio:** (1) Blob (acima); (2) mesclar o PR #77 (deploy); (3) OAuth do YouTube e do LinkedIn; (4) registrar as tarefas do Windows; (5) aprovar ou não as 2 propostas da /mentoria; (6) decisão sobre a proposta pendente do `jogos-online-criancas` no app Next (`relatorios/parte-a-decisoes-20261015.md`).

## Checagem geral de 15/10/2026 (do zero)
- **Auditoria** (`npm run auditoria`): 815 textos (726 Mongo + 89 `.mdx`), 0 falhas; segurança 0 pendências.
- **DOIs:** varredura de todos os 644 DOIs únicos no Crossref: todos existem; **2 retratados** (Panagioti 2018, em 8 textos; Kamal 2016, em 2) → proposta em `relatorios/referencias-retratadas-proposta.md`, **aguardando OK**.
- **Amostra de 15 textos lidos por inteiro** (5 publicados, 5 agendados, 5 Next): links/imagens/títulos ok; DOIs conferidos; linguagem acolhedora, sem promessa nem estigma; CVV/SAMU presentes nos temas sensíveis; 3 observações editoriais na proposta (portaria do MJSP sem fonte, links das leis, selo "Narrativa composta" em 1 abertura).
- **Testes:** 232 unitários e 31 E2E sem falhas.
- **Lighthouse mobile medido em produção (acessibilidade):** home 100 · /mentoria 100 · /links 100 · artigo `burnout-aps` 100 · relato `relato-paciente-invisivel` 100 · /privacidade 100 (SEO 92 → 100 após corrigir o canonical) · app Next 98 → 100 (`<main>` e erro de hidratação corrigidos no PR #74). Todas as 7 páginas: acessibilidade 100, boas práticas 100, SEO 100.
- **Produção:** www 200; apex 308→www; `vercel.app` 301→www (exceto `/api/`); sitemap-index (artigos 251 + páginas) e robots no www; canonical no www; autoavaliação com caixa de crise do item 9 testada no navegador (sem POST, sem erro de console); freio `{"publicacaoAtiva":true}`; token válido (`@doutor.antoniofelipe.smental`, vence 14/12/2026, 59 dias); fila 60 posts, primeiro `2026-10-26-saude-mental-cuidador` às 08:00 (Bahia).
- **Fila do Instagram, amostra de 5 posts:** capas sem marca d'água, assinatura curta de 3 linhas, CVV/SAMU, sem "psiquiatra" como título, sem #psiquiatria, acentos ok. Varredura das 60 legendas: 0 problemas.

<!-- ROTINA:INICIO -->
## Rotina semanal (última: 16/10/2026) — TUDO OK
- Auditoria, retratações, links, token, freio e próximos 7 posts sem problemas.
- Narração: 329 ok · faltam 397.
- Detalhe: `relatorios/rotina-20261016.md`. Rodar toda segunda-feira: `npm run rotina-semanal`.
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
