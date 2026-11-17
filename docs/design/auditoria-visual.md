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

## Correção de registro (17/11/2026, 06:54)

- **`da652f2` (verde-700 em `.etapa__numero`) não tem efeito visual.** A classe `.etapa__numero` existe só em `public/assets/css/style.css`; nenhum HTML do repositório a usa (`git grep` em origin/main). A medição "1,84:1 → 7,16:1" descrevia uma regra que nenhuma página renderiza. O commit foi mantido no histórico; não há ação visual.
- **`c510d74` (tinta-fraca → tinta-media): confirmado em produção.** O `style.css` publicado em www.drantoniofelipemedico.com.br tem 25 usos de `color: var(--tinta-media)` e 0 de `color: var(--tinta-fraca)`, igual ao origin/main.

## Contraste renderizado (17/11/2026, 07:10): páginas, seletores, pares e razões

Método: Playwright (Edge) lendo `getComputedStyle` de cada elemento com texto, em 375 px e 1280 px, para as 13 páginas de `public/` (exceto o arquivo de verificação do Google). Fundo efetivo = primeiro `background-color` opaco subindo pelos ancestrais. Registros: 1.969. Dados brutos em `C:/DRS-tools/contraste/antes.json`.
Limite conhecido: fundos em gradiente e imagem não entram no cálculo (aparecem como falso positivo; ver o avatar abaixo).
Metas: AA = 4,5:1 (texto pequeno) ou 3:1 (grande: ≥ 24 px, ou ≥ 18,66 px em negrito). AAA do projeto = 7:1 (texto pequeno) ou 4,5:1 (grande).

**Falhas de AA: 1 par (2 registros).** `index.html` `div.sobre-avatar` ("AF", branco sobre `#eef7f4`, 1,09:1). **Falso positivo:** o fundo é `linear-gradient(140deg, verde-600, verde-800)` (style.css:563-566), que o cálculo não lê. Sobre verde-600 o branco dá cerca de 5:1, o que passa em AA para texto grande.

**Pares abaixo da meta AAA: 33 pares únicos (110 registros).** Por página: index 11, blog 5, instagram 5, artigo 4, privacidade 3, termos 3, linkedin 1, mentoria 1, youtube 1.

| Página | Seletor | Par (texto/fundo) | Razão | Tamanho | Onde está a regra | Situação |
|---|---|---|---|---|---|---|
| mentoria, linkedin, youtube | `a.botao` | `#0d3330` / `#c9a227` | 5,66 | 16 px | `<style>` inline | **Passa AA. AAA inalcançável com tokens:** o melhor token sobre dourado é `tinta` (6,82). Não alterado. |
| todas (rodapé) | `span`, `p`, `.aviso-legal` | branco / `#0d3330` | 4,58 a 6,21 | 13,6 a 14,7 px | style.css (rodapé) | Fora do escopo (estilo compartilhado) |
| todas | `summary` ("Preciso de ajuda agora") | branco / `#a85d3c` | 4,89 | 15,2 px | extras.css:48 | Fora do escopo. `#a85d3c` **não é token** (escolha documentada: "terracota escurecida") |
| blog, index, instagram, privacidade, termos | `p.etiqueta` | `#1f7a72` / `#faf7f2` ou branco | 4,81 a 5,14 | 12,5 px | style.css:216 | Fora do escopo |
| index | `.etiqueta` no `.secao--verde` | `#8cc4b8` / `#0d3330` | 6,98 | 12,5 px | style.css | Fora do escopo (0,02 abaixo) |
| index | `p` "Médico — CRM-BA 41322" | `#5a6e66` / `#eef7f4` | 4,99 | 15,2 px | bloco de identificação | **Não alterado** (bloco de identificação) |
| index | links "CVV 188" | `#8cc4b8` / `#0d3330` | 6,98 | 15 a 17 px | `<style>` / style.css | Fora do escopo (0,02 abaixo) |

**Etapas numeradas da mentoria:** `.etapas li::before` (branco sobre `var(--verde-escuro)` = `#0d3330`) dá 13,7:1, acima da meta. Passa.

**Escopo desta rodada:** a sua regra limita as trocas a `<style>` inline e a `style=""`. Dentro desse escopo, não há falha de AA, e o único desvio de AAA (`a.botao` dourado) não tem solução com tokens travados. Por isso não há commit de contraste nesta rodada. Os pares fora do escopo estão listados acima para decisão.

**Registro corrigido:** `da652f2` não tem efeito visual (`.etapa__numero` não é usada em página). Ver a correção de 06:54.

## Atualização (17/11/2026, 07:05): correção e resultados das Etapas 2, 3 e 5

**Correção do parágrafo "Escopo desta rodada" acima:** houve troca de cor. Commits em `feat/drsm-contraste-inline` (C:/DRS-toque): `4096d43` (mentoria), `11828fd` (linkedin), `6a76cc6` (youtube). Cada um troca `.cta a.botao` de `var(--verde-escuro)` para `var(--tinta)` (token travado, `#17211f`). Razão sobre dourado: 5,66:1 → 6,82:1. **AA já passava** (5,66 ≥ 4,5); **AAA (7:1) continua não atingido**, porque nenhum token travado chega a 7:1 sobre `#c9a227`. A troca é a melhor possível sem criar cor nova.
Prova antes/depois: capturas de página inteira em 375 e 1280 px (Playwright, Edge), com `prefers-reduced-motion`. Em cada página e largura há **uma única região** diferente (571 pixels), e ela cai dentro da caixa do botão medida no DOM: mentoria 375 (41–134, 9887–9899) dentro de (16–159, 9866–9919); 1280 (313–406, 7533–7545) dentro de (288–431, 7512–7566). Linkedin e youtube: mesma prova, mesma forma. Nenhum outro pixel mudou.
Não corrigido nesta rodada, fora do escopo de `<style>` inline e `style=""`: rodapé (`style.css`), `summary` terracota (`extras.css`, `#a85d3c` não é token), etiquetas `#1f7a72` sobre `#faf7f2` (4,81:1), `#8cc4b8` sobre `#0d3330` (6,98:1, 0,02 abaixo de 7). Ver a tabela acima.

**Etapa 3: critérios de tamanho de alvo (W3C, WCAG 2.2, Understanding).**
- 2.5.8 Target Size (Minimum), **nível AA**: alvo de **24 × 24 CSS px**, ou espaçamento suficiente: um círculo de 24 px de diâmetro centrado em cada alvo menor não pode tocar outro alvo. Fonte: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- 2.5.5 Target Size (Enhanced), **nível AAA**: alvo de **44 × 44 CSS px**. Fonte: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- Conclusão para o rodapé atual: os links têm cerca de 19 px de altura, então estão abaixo de 24 px. Cumprem o AA **pela exceção de espaçamento**: a distância entre centros é de cerca de 35 px (19 px de altura + 16 px de espaço), e um círculo de 24 px não toca o vizinho. Os **44 px são meta AAA do projeto**, não exigência AA.
- Medição (`C:/DRS-tools/rodape-cap.py`, altura < 44 px, 18 links em `index.html`): antes 17 (375 px) e 16 (1280 px); variante de layout 0 e 0 (patch em `C:/DRS-tools/toque-44-layout.patch`, 14 linhas, não commitado). Capturas em `C:/DRS-tools/capturas-rodape/` (`antes2-375.png`, `antes2-1280.png`, `depois-375.png`, `depois-1280.png`).
- Mudança de layout da variante: `.rodape ul` com `gap: 0` e `.rodape ul li a` com `display: flex; align-items: center; min-height: 44px`. O rodapé fica mais alto. Decisão do Dr.

**Etapa 5: verificação estática de links (somente leitura, `C:/DRS-tools/links-estatico.py`).** 14 páginas em `public/`.
- Href/src internos inexistentes: **0**. Verificados como arquivo, `.html`, pasta com `index.html` ou rota de `vercel.json` com destino explícito.
- Âncoras sem alvo: **0** (inclui `/#sobre` e `/#contato-servicos` contra `index.html`).
- Imagens sem `alt`: **0**.
- Limite: 25 links `/artigo/<slug>` são roteados para o backend (`vercel.json`, `/artigo/[^/]+`) e **não foram confirmados contra o banco**. Confirmar o slug exige consulta ao banco (não feita).
- Nada foi corrigido nesta etapa.

**Achados de conformidade fora do escopo de contraste (para o Dr).** Código morto em `public/assets/js/home.js`: a lógica dos formulários de agendamento (`tipoAtendimento: 'particular'`) e de contato segue no JS, mas os formulários não existem mais no HTML, e os endpoints do backend respondem 410. Ver o rascunho da política, ponto 3 e ponto 4.
