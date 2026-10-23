# Decisão: Opção A (domínio único no projeto drsaudemental)

**Data:** 23/10/2026 · **Ordem:** Dr. Antônio Felipe (ordem única, 23/10/2026, noite)

## Decisão
- O domínio `www.drantoniofelipemedico.com.br` (e o apex, com 308 para o `www`) fica 100% no projeto Vercel `drsaudemental` (`prj_uIQsuIIdKas1D6AHlGtHEwcdaFsG`).
- O projeto `plataforma-saude-mental` (`prj_1Y76anxudO71uxA3Hil9KsDmc7fQ`, app Next) é **somente ambiente de teste interno**. Não atende o domínio público.
- `/ferramentas` e `/artigos/*` seguem 404 no `www`. Não há redirecionamento para alias de teste.
- O app de teste fica fora do índice do Google (`robots: { index: false }` nos metadados raiz do `layout.js`).

## Efeitos
- PR #138 (rewrites `/artigo/*`, `/blog/*`, `/_next/*` para o alias de teste): **pausado (Opção A)**. Não mesclado, não fechado, branch `feat/dominio-unico-rewrite-20261021` preservado.
- Os arquivos de narração do app que estão no #138 ficam no branch pausado. Nenhum PR novo para eles.
- Os 24 textos passam a ir ao site oficial como fonte única (ver `relatorios/DOMINIO-UNICO-24.md`).

## Rotas verificadas no `www` (23/10/2026, HTTP)
`/` 200 · `/api/health` 200 · `/links` 200 · `/mentoria` 200 · `/linkedin` 200 · `/youtube` 200 · `/instagram` 200 · `/blog` 200 · `/podcast` 200 · `/podcast/feed.xml` 200 · `/privacidade` 200 · `/admin` 200 · `/sitemap-index.xml` 200 · `/sitemap-artigos.xml` 200 · `/robots.txt` 200 · `/favicon.svg` 200 · `/manifest.webmanifest` 200 · `/redes/previa` 401 (protegida, esperado) · `/ferramentas` 404 · `/artigos/vape-nicotina-adolescentes` 404 (esperado nesta opção).

## Produção
- Produção do domínio: `dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (projeto drsaudemental, main `db86c16`). Nenhuma alteração de alias feita.
