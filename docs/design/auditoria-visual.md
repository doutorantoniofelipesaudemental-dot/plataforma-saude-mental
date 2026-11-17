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

## Medições em navegador (17/11/2026, 06:17, Playwright + Edge, 375 px e 1280 px)

Servidor local em `127.0.0.1:3000`, encerrado após a medição (porta livre). Script e dados brutos em `C:/DRS-tools/medir.py` e `C:/DRS-tools/medicao-visual.json` (fora do repositório).

| Página | Largura | Alvos < 44 px | Total | Títulos com salto de nível | h1 | Imagens sem width/height | Rolagem horizontal |
|---|---|---|---|---|---|---|---|
| index.html | 375 | 66 | 90 | 0 | 1 | 0 | não |
| index.html | 1280 | 67 | 90 | 0 | 1 | 0 | não |
| privacidade.html | 375 | 6 | 12 | 0 | 1 | 0 | não |
| termos.html | 375 | 7 | 13 | 0 | 1 | 0 | não |
| mentoria.html | 375 | 1 | 17 | 0 | 1 | 0 | não |
| admin.html | 375 | 1 | 4 | 0 | 2 | 0 | não |

- Rolagem horizontal: nenhuma das 26 medições (13 páginas × 2 larguras).
- Títulos: nenhum salto de nível. `admin.html` tem 2 `h1` (documentado; não alterado).
- Imagens: todas com dimensões.
- Alvos pequenos: a maioria são links de navegação (16–19 px de altura) e um `input` de 13 px. Corrigir para 44 px mudaria o layout de forma perceptível. **Não aplicado, por regra.** Pendente de decisão visual do Dr.
- Foco visível: não medido (exige teclado simulado). Regra global `:focus-visible` presente (style.css:182).

Conclusão: não há commit de correção de alvos nesta rodada. Decisão do Dr.: aceitar links de navegação de 16–19 px com área de toque ampliada por padding invisível, ou manter.

## Técnica de toque no rodapé (17/11/2026, 06:52): medido, NÃO commitado

Técnica testada: `.rodape a { position: relative }` e `.rodape a::before` (área de toque expandida, sem alterar layout). Escopo: 17 links do rodapé de 19 px de altura.

| Medida | Antes | Depois (inset −8 px vertical, −6 px horizontal) |
|---|---|---|
| Alvos < 44 px (index, 375 px) | 66 de 90 | 66 de 90 (sem queda) |
| Alvos < 44 px (index, 1280 px) | 67 de 90 | 67 de 90 (sem queda) |
| Alvos < 44 px (mentoria, privacidade, termos) | 1/17, 6/12, 7/13 | iguais |
| Rolagem horizontal | não | não |
| Diferença de pixel (8 capturas, 375 e 1280 px) | — | 0 pixel diferente |

Motivo de não commitar: a contagem não caiu. Os links do rodapé estão empilhados com 16 px de folga; sem sobrepor vizinhos, a área máxima é 19 + 16 = 35 px de altura, abaixo de 44. Atingir 44 px exige aumentar o espaçamento (mudança de layout) ou aceitar sobreposição (proibido). Patch guardado em `C:/DRS-tools/toque-44.patch`, para decisão do Dr.

Demais alvos pequenos, fora do escopo de navegação/menu/rodapé/controle (não alterados):
- "Saiba mais" em cartões (41×45 px; largura 41): links de cartão.
- "CVV 188" / "SAMU 192" (26×19 px): faixa de crise.
- Caixas de opção (13×13 px) dentro de `<label>`: o alvo é o rótulo.
