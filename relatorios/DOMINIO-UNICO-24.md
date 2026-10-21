# Domínio único: 24 textos (etapas 1 e 2)

Atualizado em 21/10/2026. Cada linha é um texto com canonical no domínio antigo. Medido: 404 no www antes do rewrite.

## Etapa 1 (rewrite, PR próprio)
- Rewrite em vercel.json: /artigo/<slug> → app antigo /artigos/<slug>; /blog/<slug> → /blog/<slug>; /_next/ → app antigo. Só os 24 textos; nenhuma rota existente trocada.
- Antes do merge: conferir cada um no preview (200, conteúdo, CSS, imagens e áudio).
- Depois: canonical dos 24 para o www e sitemap único (mesmo PR, só após o preview OK).
- 308 do domínio antigo para o www: PR seguinte, só após 24 × 200 no www em produção.

## Etapa 2 (migração definitiva, só plano)
Trazer os 24 MDX para o site principal mantendo as URLs; existeConteudo.js com modo migração; desligar o rewrite e pausar o projeto antigo após 7 dias sem erros. Não executar sem ordem.

## Lista
| URL no www | Tipo | Antes | Hoje | Rewrite | Canonical | Sitemap | 308 |
|---|---|---|---|---|---|---|---|
| /artigo/afastamento-trabalho-laudo-aps | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/anorexia-bulimia-adolescencia | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/ansiedade-depressao-gestacional | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/benzodiazepinicos-uso-cronico-riscos | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/burnout-docente-sala-de-aula | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/colapso-do-cuidador-emergencia-pa | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/comparacao-redes-sociais-autoestima | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/luto-gestacional-e-neonatal | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/peso-psicologico-doenca-cronica | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/polifarmacia-idoso-delirium | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/tept-violencia-urbana-assalto | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /artigo/vape-nicotina-adolescentes | artigo | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/ansiedade-por-inteligencia-artificial | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/baby-blues-ou-depressao-pos-parto | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/esquecimento-normal-ou-alzheimer | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/exercicio-fisico-como-prescricao-medica | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/fadiga-por-compaixao-profissionais-saude | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/fome-emocional-compulsao-alimentar | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/luto-normal-ou-complicado | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/panico-ou-infarto-diagnostico-diferencial | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/sindrome-do-cuidador-sinais | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/tdah-ou-agitacao-infantil | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/vicio-em-apostas-bets-sinais-de-alerta | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
| /blog/violencia-domestica-sinais-na-consulta | blog | 200 no app antigo | 404 no www | em andamento (PR do rewrite) | pendente | pendente | pendente |
