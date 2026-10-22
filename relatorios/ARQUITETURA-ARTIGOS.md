# Arquitetura dos artigos nos dois sites (plano, 20/10/2026). Não executado.

## Estado atual (medido em 20/10/2026)

- **Banco (site Express):** 726 textos (todos com slug no domínio principal). Fonte do conteúdo: MongoDB.
- **App Next (MDX):** 89 textos (77 em `src/content/artigos` + 12 em `content/blog`).
- **Canonical do app Next** (`apps/plataforma-saude-mental/app/slugsDominioPrincipal.js`): se o slug está na lista do domínio principal, o canonical é `www.drantoniofelipemedico.com.br`; se não, o canonical é `plataforma-saude-mental-steel.vercel.app`, o domínio antigo.
  - 65 MDX têm slug no domínio principal: duplicam o banco, canonical correto.
  - **24 MDX apontam o canonical para o domínio antigo.** Isso é o principal risco de SEO: o Google pode indexar a versão antiga.
- **Plano de domínio único:** a ordem cita "PLANO-DOMINIO-UNICO", mas não encontrei esse arquivo em `docs/` nem em `relatorios/`. A decisão de domínio está registrada no CLAUDE.md (§3.C). Se existir um plano com outro nome, me passe o caminho e eu uno os dois.

## a) Fonte única e um domínio

Etapas propostas, cada uma com portão e dry-run:
1. Inventário: lista de todos os slugs de MDX e banco, com URL atual, URL nova e canonical atual. Só leitura.
2. Canonical único: os 24 MDX com canonical no domínio antigo passam a apontar para `www.drantoniofelipemedico.com.br/artigo/<slug>` (ou, se o texto só existir no app Next, para a URL do próprio app no domínio principal). Mudança técnica, sem tocar no texto.
3. Redirecionamento 308 de toda URL do domínio antigo para o domínio principal, mantendo o caminho. Configuração na Vercel (projeto `plataforma-saude-mental-steel`): precisa de OK seu, porque mexe em produção.
4. Sitemap único: um só sitemap com todas as URLs do domínio principal. Hoje há `sitemap-artigos.xml` (banco) e o do app Next. Unir no que já existe em `backend/index.js`.
5. Depois de 30 dias: confirmar no Search Console que as URLs antigas saíram do índice ou foram redirecionadas.

**Risco de SEO:** redirecionamento mal feito zera o histórico de links. Por isso a etapa 3 só vai com dry-run e seu OK. Se o domínio antigo ainda tiver links externos, eles precisam continuar apontando para o novo.

**Textos que mudam:** 24 (canonical) + os URLs antigos de todo o site, que são redirecionados sem mudar o conteúdo. Nenhum corpo de texto muda.

## b) Taxonomia

Eixos temáticos × públicos. Proposta:
- Públicos: pacientes e público geral; profissionais de saúde; empresas e RH.
- Eixos: ansiedade, depressão, sono, burnout e trabalho (NR-1), luto, álcool e outras drogas, telas e jovens, infância e família, crise e prevenção do suicídio.
- Cada texto tem **um** eixo e **um** público principal. Hoje há categorias repetidas no banco; a lista de duplicatas sai do inventário (etapa 1).

## c) Páginas pilar

Uma página pilar por eixo, com:
- introdução, lista dos satélites (artigos do eixo) e o aviso de orientação geral;
- links internos automáticos: cada satélite aponta para o pilar e para dois satélites relacionados;
- crise e prevenção do suicídio: pilar com CVV 188 e SAMU 192 em destaque, sem detalhar métodos.

Pilar novo é conteúdo novo: passa pela sua aprovação de sentido clínico antes de ir ao ar.

## d) Selo de qualidade (E-E-A-T)

Em cada texto: "Revisado por Dr. Antônio Felipe Garabito", data da última revisão, referências, bloco "quando procurar ajuda" e schema.org `MedicalWebPage` ou `Article` com `reviewedBy` e `lastReviewed`. Página de autor com a identificação padrão.

**Atenção:** "revisado por" só pode aparecer depois que a revisão de fato aconteceu. Por isso a data de revisão e o selo precisam vir do registro de revisão (`revisadoEm`), não de um texto fixo. Assim não se afirma revisão que não existiu.

## e) Revisão periódica

Textos com mais de 12 meses entram na fila de revisão de referências (verifica links, DOI e retratações). A revisão de sentido clínico continua sendo sua.

## f) Acessibilidade

- Leitura fácil: ver o benchmark (meta de leitura do NHS, 9 a 11 anos, quando possível).
- Áudio em cada texto: já é obrigatório (CLAUDE.md §1.C). Verificar cobertura no inventário.
- Contraste AAA e alt em imagens: já cobertos pela auditoria técnica. Confirmar que o alt não ficou vazio.

## Ordem de execução proposta

1. Inventário (só leitura) → 2. canonical dos 24 → 3. selo e schema (técnico, sem texto) → 4. sitemap único → 5. redirecionamento 308 (só com seu OK) → 6. revisão periódica → 7. pilares (com aprovação de cada pilar).

Nada disso executa sem sua ordem.
