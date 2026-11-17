# Visual do Portal — tokens travados (16/11/2026)

Fonte: `docs/tokens.json` (bloco `site`), gerado de `docs/DESIGN.md`. Valores **travados**: mudar exige ordem escrita do Dr. Antônio Felipe.

## Cores (site)

| Token | Hex | Uso |
|---|---|---|
| verde-900 | #0d3330 | fundo de cartão, cabeçalho, rodapé |
| verde-800 | #114240 | superfícies escuras |
| verde-700 | #185d58 | hover escuro |
| verde-600 | #1f7a72 | destaque, botão |
| verde-500 | #2b978d | destaque secundário |
| verde-300 | #8cc4b8 | rótulos sobre escuro (6,98:1 sobre verde-900: AA, não AAA; texto corrido use areia-50) |
| verde-100 | #dbeee8 | fundo claro de apoio |
| verde-50 | #eef7f4 | fundo claro |
| areia-200 | #e9e0d2 | bordas e divisórias |
| areia-100 | #f4efe6 | superfície clara |
| areia-50 | #faf7f2 | fundo da página (creme) |
| terracota | #c0714f | acento quente |
| dourado | #c9a227 | filete e destaque (5,66:1 sobre verde-900: só texto grande ou não textual) |
| tinta | #17211f | texto principal (carvão) |
| tinta-media | #45564f | texto secundário (7,29:1 sobre areia-50: AAA) |
| tinta-fraca | #5a6e66 | texto de apoio, só texto grande (5,10:1 sobre areia-50: AA, não AAA) |
| papel | #ffffff | fundo de formulário |

Alerta (aviso): fundo #fbf1d9, texto #4a3606.

## Tipografia (site)

- Títulos: **Fraunces** (serif). Texto: **Inter** (sans).
- Nota: o pedido de 16/11 citava "Source Sans 3". O repositório **não usa** Source Sans 3 (0 arquivos). Vale Inter, conforme `docs/DESIGN.md` seção 2.
- A arte das redes usa outra família (Oswald e Raleway, `backend/lib/redesV2/arteEditorial.js`). Não é o site.

## Forma e medidas

- Raio: 14 px (cartão 24 px). Largura máxima: 1140 px.
- Alvo de toque mínimo: 44 px. Contraste AAA em texto corrido (meta 7:1).
- Gutter lateral de 16 px no celular; sem rolagem horizontal.

## Regras para a skill UI UX Pro Max (se instalada)

Usar **somente** para: estrutura de página, hierarquia, acessibilidade (contraste, foco visível, teclado), responsividade, desempenho e anti-padrões.

Nunca usar para: trocar paleta, trocar fontes, criar degradê roxo genérico, mudar texto clínico ou bloco de identificação.

## Página de Mentoria e Consultoria

- Contato **somente por e-mail** (`mailto:` institucional). Sem número de WhatsApp e sem mensageria de terceiros (regra de 08/11).
- Verificado em 16/11: `public/mentoria.html` tem 7 links `mailto:` e nenhum WhatsApp.

## Stack

- Raiz do repositório: HTML estático + Tailwind (sem React/Next). Por isso o 21st.dev Magic MCP **não** é usado; se a stack mudar para React/Next, ele fica como opcional e desligado por padrão.
