# DESIGN.md — Sistema de design do Portal de Saúde Mental Doutor Antônio Felipe

Documento único (ordem de 10/11/2026, item A1). Fonte dos valores: `docs/tokens.json`, gerado deste arquivo por
`scripts/design/gerarTokens.js` (o bloco JSON abaixo é a única fonte). Quem lê os tokens: `backend/lib/redesV2/arteEditorial.js`,
`backend/lib/redesV2/checagemArte.js` e o teste `tests/unit/design-tokens.test.js`.

Dois sistemas, de propósito, porque o visual já aprovado é diferente e unificar mudaria o que está no ar:

- **Site** (portal, blog, artigos, /links): tipografia Fraunces (títulos) e Inter (texto). Valores em `public/assets/css/style.css` (`:root`).
- **Arte das redes** (carrosséis, padrão editorial): tipografia Oswald (títulos, rótulos) e Raleway (corpo). Valores em `backend/lib/redesV2/arteEditorial.js`.

O `public/` não foi alterado por este documento (regra do CLAUDE.md). Os tokens do site ficam documentados e conferidos pelo teste; aplicá-los no CSS depende de ordem escrita do Dr.

## 1. Cores

### 1.1 Site
| Token | Valor | Uso |
|---|---|---|
| verde-900 | #0d3330 | fundo de destaque escuro |
| verde-700 | #185d58 | títulos de seção, botões |
| verde-600 | #1f7a72 | links, ícones |
| verde-100 | #dbeee8 | caixas claras |
| areia-50 | #faf7f2 | fundo da página |
| areia-100 | #f4efe6 | faixas |
| terracota | #c0714f | ênfase pontual, NUNCA texto de corpo (3,67:1 sobre papel, reprova AA para texto) |
| dourado | #c9a227 | filete e marca de destaque |
| tinta | #17211f | texto principal |
| tinta-media | #45564f | texto secundário |
| tinta-fraca | #5f736c | legendas. 4,73:1 sobre areia-50 (AA). REPROVA AA sobre areia-100 (4,41:1) e verde-100 (4,19:1): ver REVISAO-WCAG (achado aberto, correção depende de ordem para public/) |
| verde-800 / verde-500 / verde-300 / verde-50 | #114240 / #2b978d / #8cc4b8 / #eef7f4 | estados de hover, bordas, fundos claros |
| areia-200 | #e9e0d2 | bordas e divisórias |
| papel | #ffffff | cartões |

### 1.2 Arte das redes
| Token | Valor | Uso |
|---|---|---|
| fundo-1 a fundo-5 | #F7F1E3, #ECEEF0, #DDEFD9, #CFF1E4, #FBE0CF | fundo pastel com textura, um por post (rotação) |
| corpo | #1B1B1B | texto (contraste ≥ 4,5:1 sobre todos os fundos) |
| rodape | #1B1B1B, texto #FFFFFF | faixa de identificação |
| rodape-filete | #C9A227 | filete superior de 8 px |
| marca-texto | #FFE46B | marca-texto no ponto principal |

## 2. Tipografia

### 2.1 Site
- Títulos: Fraunces (peso 600–700). Texto: Inter (400–600). Fallbacks em `style.css`.

### 2.2 Arte
- Títulos e rótulos: Oswald (500–700, caixa alta nos títulos).
- Corpo: Raleway (400–600).
- Mínimos (checados por `checagemArte.js`): título ≥ 64 px; corpo ≥ 40 px. Rodapé: 22 px no bloco completo da última lâmina (primeira linha 28 px) e 26 px nas intermediárias (primeira linha 32 px), em `arteEditorial.js`.
- Máximo de 25 palavras por lâmina (sem contar a assinatura e os avisos).

## 3. Espaçamento e medidas
- Site: largura 1140 px; raio 14 px (cartões 24 px); sombras em três níveis (`--sombra-s/m/g`).
- Arte editorial das redes: 1080 × 1350 (4:5). Margem lateral 90 px; rodapé de 3 linhas nas lâminas intermediárias e bloco completo de 5 linhas na última. Reels e Stories (9:16, 1080 × 1920) seguem `docs/procedimentos-midia-design.md`; a arte editorial ainda não os produz.
- Área de toque: mínimo 44 × 44 px (AAA de alvo).

## 4. Ícones
- Arte: pacote 3dicons (CC0), um por tema, recebido por parâmetro (`ativos.icones`); ícone de encerramento `bubble.png`.
- Site: ícones SVG simples de traço, cor `verde-600`.
- Proibido: emoji como ícone funcional; mais de 1 emoji por texto.

## 5. Componentes

### 5.1 Site
- **Botão primário:** fundo verde-700, texto papel, altura mínima 44 px, foco visível (contorno 3 px dourado).
- **Cartão:** papel, raio 14 px, sombra-s, borda `--linha`.
- **Faixa CVV:** fundo areia-100, filete terracota, texto "Em crise: CVV 188 · SAMU 192" sempre visível no artigo e no relato.
- **Nota de ficção (relatos):** caixa com a frase exata de `backend/lib/relatos.js` no topo do relato.
- **Caixa "Para entender":** fundo verde-100, 1 a 3 referências, link para o artigo do tema.

### 5.2 Arte
- **Rótulos (fixos):** "Sinal de alerta", "Dado", "Passo", "Para refletir". "Dado" exige referência nomeada (autor e ano) na própria lâmina.
- **Marca-texto:** uma por lâmina, no ponto principal.
- **Faixa de identificação:** rodapé escuro com filete dourado.

## 6. Regras fixas (todo material)
1. Assinatura de 5 linhas (`IDENTIFICACAO_COMPLETA`, `backend/lib/conformidadeCfm.js`), com o nome "Dr. Antônio Felipe" (acento).
2. Aviso de IA da Resolução CFM 2.454/2026 (falado curto + crédito; texto completo na cartela final e na descrição).
3. "Em crise: CVV 188 · SAMU 192" em todo conteúdo sobre sofrimento, suicídio ou autolesão.
4. Suicídio e autolesão conforme a OMS 2023: sem método, sem local, sem detalhe de ato; a pergunta direta sobre pensamentos de morte é recomendada.
5. Linguagem centrada na pessoa ("pessoa com depressão", "morreu por suicídio"; nunca "cometeu").
6. Público adulto. Nada de visual infantil.
7. Sem promessa de cura, sem garantia de resultado, sem oferta de consulta (contato institucional só por e-mail de mentoria e consultoria).
8. Orientação geral: condutas e doses sempre com o aviso de que se respeitam os protocolos do PA, do hospital e da rede local.

## 7. Acessibilidade (WCAG 2.2 AA; alvos AAA quando possível)
- Contraste de texto normal ≥ 4,5:1; texto grande ≥ 3:1. Os tokens do site e da arte foram medidos (ver `tests/unit/design-tokens.test.js`).
- Foco visível em todo elemento interativo.
- `prefers-reduced-motion` respeitado. Sem animação que pisque.
- Texto alternativo em toda imagem (campo `alt` obrigatório na rede; `alt.txt` automático).
- Sem som automático. Áudio de artigo sempre com controle.

## 8. Padrões proibidos
- Gradiente roxo genérico.
- Cérebro com raios ou circuito (clichê de saúde mental).
- Pessoa segurando a cabeça, chorando ou em desespero como ilustração.
- Fotos geradas por IA de pessoas (sem foto aprovada do Dr.).
- Emoji em excesso; frase motivacional vazia.
- Promessa de cura ou de resultado.
- Visual infantil: desenho infantil, personagens fofos, música infantil.
- Fundo escuro na arte das redes (o modelo antigo é proibido: `checagemArte` reprova).
- Marca d'água sobre imagem de terceiro.

## 9. Bloco de tokens (fonte para `docs/tokens.json`)

```json
{
  "site": {
    "cores": {
      "verde-900": "#0d3330", "verde-800": "#114240", "verde-700": "#185d58", "verde-600": "#1f7a72", "verde-500": "#2b978d", "verde-300": "#8cc4b8", "verde-100": "#dbeee8", "verde-50": "#eef7f4", "areia-200": "#e9e0d2",
      "areia-100": "#f4efe6", "areia-50": "#faf7f2", "terracota": "#c0714f", "dourado": "#c9a227",
      "tinta": "#17211f", "tinta-media": "#45564f", "tinta-fraca": "#5f736c", "papel": "#ffffff"
    },
    "fontes": { "titulo": "Fraunces", "texto": "Inter" },
    "raio": 14, "raioGrande": 24, "larguraMax": 1140, "alvoMinimoPx": 44
  },
  "arte": {
    "fundos": ["#F7F1E3", "#ECEEF0", "#DDEFD9", "#CFF1E4", "#FBE0CF"],
    "corpo": "#1B1B1B",
    "rodape": "#1B1B1B",
    "rodapeTexto": "#FFFFFF",
    "rodapeFilete": "#C9A227",
    "marcaTexto": "#FFE46B",
    "fontes": { "titulo": "Oswald", "corpo": "Raleway" },
    "tamanhos": { "tituloMinPx": 64, "corpoMinPx": 40, "rodapeCompletoPx": 22, "rodapeIntermediarioPx": 26 },
    "palavrasMax": 25,
    "contrasteMin": 4.5,
    "fundoLuminanciaMin": 0.4,
    "telas": { "carrossel": [1080, 1350] },
    "rotulos": ["Sinal de alerta", "Dado", "Passo", "Para refletir"]
  }
}
```
