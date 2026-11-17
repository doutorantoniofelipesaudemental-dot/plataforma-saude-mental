# Auditoria visual estática — Portal (17/11/2026)

Escopo: `public/*.html` (14 páginas) e `public/assets/css/*.css` (3 arquivos). Tokens NÃO alterados. Medições: WCAG 2.x, cálculo de luminância relativa sobre os tokens de `docs/tokens.json`. Alvos de toque e foco em navegador NÃO medidos (exigem execução; não feito nesta rodada).

## Achados

| # | Achado | Arquivo | Gravidade | Situação |
|---|---|---|---|---|
| 1 | `tinta-fraca` (#5a6e66) como cor de texto pequeno em fundo claro: 4,75 a 5,44:1 (AA ok, AAA não). Projeto exige AAA. | style.css (9 ocorrências) | média | **CORRIGIDO** (commit c510d74): `tinta-media` (6,8 a 7,8:1). |
| 2 | `dourado` (#c9a227) sobre fundo claro: 2,11 a 2,42:1. Sobre verde-900: 5,66:1. | style.css | média | Documentado. Uso atual: borda e destaque não textual. Se algum texto usar dourado sobre claro, é falha. Não encontrado como cor de texto. |
| 3 | `terracota` (#c0714f) sobre fundo claro: 3,21 a 3,67:1 (falha AA para texto pequeno). | style.css | média | Documentado. Uso atual: borda de resultado (não textual). |
| 4 | `verde-300` (#8cc4b8) sobre fundo claro: 1,71 a 1,96:1. Sobre verde-900: 6,98:1. | style.css | alta, se houver texto claro | Verificado: usos em texto estão sobre verde-900 (`.secao--verde`, `.faixa-crise`), que passa. Usos sobre claro são borda (`border-color`). Sem correção. |
| 5 | `tinta-fraca` em ícone (`.busca svg`) | style.css:726 | baixa | Corrigido junto com o achado 1. |
| 6 | Foco visível | style.css:182 (`:focus-visible` global) e :975 | — | Presente. Regra global cobre links e botões. Não há remoção de outline encontrada (`outline: none` sem substituto não checado). |
| 7 | `prefers-reduced-motion` | style.css (2 ocorrências) | — | Presente. |
| 8 | Meta viewport | 13 de 14 páginas | baixa | `public/google79736b5242e37404.html` é o arquivo de verificação do Google: não altero. |
| 9 | `alt` em imagens | todas as páginas | — | 0 imagens sem `alt`. |
| 10 | Dimensões de imagem (`width`) | todas as páginas | — | 0 imagens sem `width`. |
| 11 | Alvos de toque 44 px | style.css | não medido | Exige navegador. Token `alvoMinimoPx: 44` existe. Pendente. |
| 12 | Ordem de títulos (h1 a h3) | páginas | não medido | Exige parser de DOM. Pendente. |
| 13 | Peso de CSS | style.css 39,9 KB; extras.css 5,4 KB; admin.css 3,2 KB | baixa | Dentro do razoável. Sem ação. |

## Decisão do Dr. (fonte)

O repositório usa **Inter** (texto) e **Fraunces** (títulos), conforme `docs/DESIGN.md` e `docs/tokens.json`. Source Sans 3 não existe no repositório (0 arquivos). Mantido Inter. Registrado como decisão do Dr.

## Pendências desta auditoria

- Alvos de toque, ordem de títulos e foco em execução real: exigem navegador (não rodado, para não manter servidor ativo além da janela).
- Página de Mentoria: sem WhatsApp (7 `mailto:`). Não alterada.
