# Esteira audiovisual única (proposta, 08/11/2026)

Ordem escrita do Dr. Antônio Felipe (08/11/2026, 08:40): documentar a esteira. Este documento não implementa nada além da prévia 11–17/11 (PR #255). Freio `REDES_PUBLICACAO_ATIVA` desligado; nada é publicado por esta proposta.

## 1. Princípio

Um artigo PUBLICADO é a única fonte. Dele saem todos os canais (1 artigo → pacote multicanal). Nada é escrito do zero para um canal.

Origem obrigatória: artigo publicado no portal, com slug e link `https://www.drantoniofelipemedico.com.br/artigo/<slug>` (regra "a-origem" do zero genérico).

## 2. Atomização por canal

| Canal | Formato | Peça | Texto |
|---|---|---|---|
| Instagram (carrossel) | 1080×1350 (4:5) | capa + pontos + "Em crise?" (lâminas) | curto, literal do artigo |
| LinkedIn (documento) | PDF, mesma arte | mesmas lâminas, em PDF | texto técnico, mais longo |
| Reels / Shorts | 1080×1920 (9:16), 30 fps | mesmo vídeo para os dois | roteiro curto derivado do artigo |
| YouTube longo | 16:9 | trecho semanal (1 vídeo longo por semana) | roteiro do trecho do artigo |

Regras comuns a todos os canais:
- Mesmo Estilo Portal (tipografia Oswald e Raleway, fundo claro, contraste AA, ícone 3D CC0 registrado).
- Mesmas checagens: texto (zero genérico, literalidade, identificação de 5 linhas, aviso de IA), arte (`checagemArte`: tamanhos, contraste, colisão, rótulos) e vídeo (T1 técnica determinística, T2 científica, T3 ética/humanizada).
- Identificação de 5 linhas na legenda e no rodapé. Aviso "Conteúdo educativo com apoio de IA, aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026)." Em crise: CVV 188 · SAMU 192.

## 3. Cascata de custo (cota × sem cota)

Separação para o orçamento de chamadas do `claude -p` (teto de 3 por dia e 15 por semana, `relatorios/CONSUMO.md`):

Gasta cota (passa pelo `claude -p`):
- roteiro e legenda (rascunho), quando o texto precisa de adaptação de canal;
- escolha de estilo de peça nova.

Não gasta cota:
- render das lâminas (Playwright, local);
- render de vídeo (FFmpeg, local);
- narração (ver ressalva de voz abaixo);
- checagens determinísticas (zero genérico, arte, identificação, links);
- publicação pelos freios (`scripts/publicarBranch.js`, `publicar-seguro`).

Ressalva de voz: `CLAUDE.md` permite somente Edge-TTS (`pt-BR-AntonioNeural`). A ordem cita narração Kokoro; há `relatorios/voz-amostras/KOKORO-LICENCA-21102026.md` (não tracked). Até o Dr. Antônio aprovar o Kokoro por escrito, a narração segue Edge-TTS.

Pendência: a ordem cita a "Cascata do Roteiro Audiovisual v1.1 (seção 7A)". O arquivo não foi encontrado no repositório nem no disco (busca em `*.md` e em nomes de arquivo, 08/11). A divisão acima é proposta nova e precisa ser conferida contra o documento que o Dr. tem.

## 4. Calendário e estoque

- Instagram: 1 post por dia (7 por semana).
- LinkedIn: segunda, quarta e sexta (3 por semana). Limite do agendador: no máximo 3 por dia (`CLAUDE.md`, carta de 18/10).
- YouTube: 3 a 5 Shorts e 1 vídeo longo por semana.
- Estoque: 14 dias de peças prontas e aprovadas, por canal, antes de abrir nova fila.
- Janelas: narração às 22:00 e YouTube às 23:30 nas noites comuns; às 14:00 e 15:30 nas quintas e domingos (plantões, `CLAUDE.md` 19/10).

## 5. Freios em padrão seguro

- `REDES_PUBLICACAO_ATIVA=false` por padrão. Só o Dr. Antônio liga (Vercel → Environment Variables → redeploy).
- `YOUTUBE_PUBLICACAO_ATIVA` desligado por padrão. Só por ordem do Dr. Antônio.
- Nenhuma peça vai ao ar sem aprovação do Dr. Antônio nesta fase (prévia, depois aprovação item a item).
- Antes de cada publicação futura: hash igual ao aprovado, renderização conferida, schema e links conferidos, CFM conferido. Se algo falhar, não publica e avisa.

## 6. Fora de escopo deste documento

- Newsletter, Podcast e Kit NR-1: módulos novos, só com ordem do Dr. Antônio (`CLAUDE.md`, classe 3).
- Foto de rosto em qualquer peça: só com foto aprovada pelo Dr. Antônio.
- Nenhuma mudança de texto já publicado ou agendado.

## 7. Próximos passos (depois da aprovação deste documento)

1. Conferir a cascata contra o Roteiro Audiovisual v1.1 (seção 7A) que o Dr. tem.
2. Implementar a atomização por canal em PR próprio, com testes e portão.
3. Gerar a prévia de 14 dias por canal e submeter ao Dr. Antônio.
