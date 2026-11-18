# Protótipo do novo visual: relatório (17/11/2026, ordem 12)

Branch feat/proto-novo-visual, sobre origin/main (311183c). public/ não foi tocado.
Portão (npm run portao): APROVADO em 23:16 (31 testes e2e, build e auditoria). Commits locais, sem push.

## Páginas
- index.html: início com busca, quatro trilhas, "Preciso de ajuda agora" (188 e 192), bloco de vídeo com aviso "disponível após aprovação" (sem vídeo publicado no YouTube; D4.5).
- blog.html: 317 artigos publicados (títulos do backup), filtro por tema (8 séries), capas reais só nos 8 de amostra; demais com cartão de texto.
- mentoria.html e pilares/eixo-1..7.html: conteúdo do <main> copiado de public/ sem reescrita; cabeçalho e rodapé novos com a identificação aprovada.
- artigos/<slug>.html (8 de amostra, um por série): HTML real do backup; capa nova; ler/diminuir/aumentar letra; modo escuro; modo calmo; "Ouvir este artigo" só ao clique (URL publicada do backup); schema MedicalWebPage com reviewedBy.
- Sem data de revisão (não há metadado de revisão no backup); sem link de mensageria; sem oferta de consulta.

## Medições (Edge, 375 px, CPU 4x, 4G 1,6 Mbps/150 ms)
| Página | Tema | LCP (ms) | CLS | Rolagem horizontal | Violações AA (WCAG 2.2) | Nós AAA (contraste) |
|---|---|---:|---:|---|---:|---:|
| index.html | light | 796 | 0 | não | 0 | 0 |
| index.html | dark | 812 | 0 | não | 0 | 0 |
| blog.html | light | 592 | 0 | não | 0 | 0 |
| blog.html | dark | 544 | 0 | não | 0 | 0 |
| mentoria.html | light | 592 | 0 | não | 0 | 0 |
| mentoria.html | dark | 592 | 0 | não | 0 | 0 |
| pilares/eixo-1.html | light | 572 | 0 | não | 0 | 0 |
| pilares/eixo-1.html | dark | 584 | 0 | não | 0 | 0 |
| artigos/relato-paciente-invisivel.html | light | 672 | 0 | não | 0 | 0 |
| artigos/relato-paciente-invisivel.html | dark | 652 | 0 | não | 0 | 0 |

Contraste calculado (WCAG): branco sobre cartão 13,70:1; dourado 9,56:1; verde-100 sobre verde-900 11,35:1; link escuro 9,51:1; botão de ajuda 8,49:1; dourado com preto 8,68:1. Pior caso do cartão de capa: branco 10,82:1; dourado 7,55:1.
Observação: o axe marca 0 nós AAA, mas não confirmei que a regra de contraste AAA rodou; a verificação dos pares acima é a referência.

## Pendências
1. Vídeo de boas-vindas: aguarda aprovação e publicação no YouTube (D4.5). Quando houver link, entra com youtube-nocookie só ao clique.
2. 309 artigos sem página de texto completo neste protótipo (só os 8 de amostra). Capas dos demais: no Blob, ver manifesto de C:/DRS-capas.
3. VLibras fora desta fase (D4.4).
4. Política de privacidade deve citar o YouTube se o vídeo for incorporado.
