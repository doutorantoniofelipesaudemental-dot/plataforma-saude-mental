# Inventário das landings — 18/10/2026 (produção, Lighthouse mobile)

| Página | HTTP | Acess. | SEO | Boas práticas | Canonical www | Sitemap | Rodapé | /links |
|---|---|---|---|---|---|---|---|---|
| /linkedin | 200 | 100 | 100 | 100 | sim | sim | sim | sim |
| /links (bio) | 200 | 100 | 100 | 100 | sim | n/a (página de links) | n/a | n/a (destaque /instagram no topo) |
| /mentoria | 200 | 100 | 100 | 100 | sim | sim | sim | sim |
| /youtube (nova) | 200 | 100 | 100 | 100 | sim | sim | sim | sim |
| /instagram (reformulada) | 200 | 100 | 100 | 100 | sim | sim | sim | sim (destaque no topo) |

Sem erros de console. Sem iframe, sem script de terceiros e sem cookies de terceiros nas landings novas. Relatórios completos e prints em `relatorios/lighthouse-20261018/`.
Canal do YouTube: `YOUTUBE_CANAL_URL` em `config/marca.json` (ID lido pela API autorizada, sem expor token).
PRs: #101 (conferidor), #102 (landings), #103 (h2 da /instagram), todos por `merge-seguro`.
