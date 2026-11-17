# Protótipo do novo visual: relatório (17/11/2026)

Branch `feat/proto-novo-visual` a partir de `origin/main` (311183c). Só a pasta `prototipo/` foi criada. `public/` não foi alterado (0 linhas no diff).

## O que está no protótipo
- Início (`index.html`): busca, quatro trilhas (ansiedade, filho, profissional, gestor), vídeo de boas-vindas só ao clicar com legenda VTT, painel "Preciso de ajuda agora" (CVV 188 e SAMU 192), identificação de 5 linhas aprovada no rodapé.
- Busca: índice local `assets/indice.json` gerado de títulos reais de `public/` (17 páginas e 7 pilares), sem chamada à API. Admin, 404 e modelo de artigo ficam fora.
- Modelo de artigo (`artigo-modelo.html`): data de revisão, tempo de leitura, aumentar/diminuir letra, modo escuro, modo calmo (desliga animações), "Ouvir este artigo" só ao clicar, JSON-LD MedicalWebPage com revisor e migalhas.
- Respeita `prefers-reduced-motion`. Sem reprodução automática.

## Medições (Microsoft Edge, 375 px, CPU 4x, 4G 1,6 Mbps/150 ms)
| Página | Tema | LCP (ms) | CLS | Rolagem horizontal | Violações axe (WCAG 2.2 AA) |
|---|---|---:|---:|---|---:|
| index.html | claro | 804 | 0 | não | 0 |
| index.html | escuro | 772 | 0 | não | 0 |
| artigo-modelo.html | claro | 520 | 0 | não | 0 |
| artigo-modelo.html | escuro | 552 | 0 | não | 0 |

Brutos: `C:/DRS-tools/proto/resultado.json` (fora do repositório). Medição feita em servidor local na porta 3001 (ver pendências).

## Contraste (cálculo WCAG)
- Branco sobre cartão verde-900: 13,70:1. Verde-100 sobre verde-900: 11,35:1.
- Botão "Preciso de ajuda" (branco sobre terracota escura #7a3b1f): 8,49:1. A terracota clara anterior (#c0714f) dava 3,67:1 e foi trocada.
- Botão dourado com texto preto (#000 sobre #c9a227): 8,68:1.
- Link em modo escuro (#b5e0d5 sobre verde-900): 9,51:1.

## Testes de comportamento (Edge)
- Busca: "ansiedade" retorna 1 resultado. Busca por slug ("infancia") retorna 0, porque o índice busca no título.
- Vídeo e legenda: 0 requisições de mídia antes do clique, 2 depois.
- Áudio: 0 elementos antes do clique, 1 depois.
- Painel de ajuda, aumento de fonte, modo escuro e modo calmo: funcionam.
- Erros de console: 3 respostas 404. São o vídeo `assets/video/bv-16x9.mp4` (não copiado: limite de 3 MB) e o áudio `assets/narracao-placeholder.mp3` (placeholder), além de um recurso extra.

## Peso
- Binários: fundo-natureza-1.webp 19 KB e fundo-natureza-2.webp 31 KB (limite 150 KB cada). Total da pasta: 68 KB (limite 3 MB).

## Pendências (não feitas)
1. Processo do servidor antigo na porta 3000 (com o caminho de arquivo com erro) ainda ativo. Bloqueei a tentativa de encerrar `node.exe` em massa. Encerrar com `netstat -ano | findstr :3000` e `taskkill /PID <pid> /F`. Depois, `servidor.js` com PORTA=3001 segue ativo; encerrar do mesmo jeito.
2. Vídeo de boas-vindas e narração de artigo não estão no protótipo. Entram na próxima etapa, quando o peso e a licença forem decididos.
3. Lista de referências e corpo do artigo são placeholders.
4. VLibras não foi integrado (licença do widget hospedado não lida).
5. Pilotos B–D da minissérie e fundos da Fase 2 seguem pendentes.
