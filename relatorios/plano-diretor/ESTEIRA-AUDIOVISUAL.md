# Esteira audiovisual única (proposta, 08/11/2026; revisada na retomada das 14:50)

Ordem escrita do Dr. Antônio Felipe (08/11/2026): documentar a esteira. Este documento não implementa nada além da prévia 11–17/11 (PR #255). Freio `REDES_PUBLICACAO_ATIVA` e `YOUTUBE_PUBLICACAO_ATIVA` desligados; nada é publicado por esta proposta.

## 1. Princípio

Um artigo PUBLICADO é a única fonte. Dele saem todos os canais (1 artigo → pacote multicanal). Nada é escrito do zero para um canal.

Origem obrigatória: artigo publicado no portal, com slug e link `https://www.drantoniofelipemedico.com.br/artigo/<slug>` (regra "a-origem" do zero genérico).

## 2. Atomização por canal

| Canal | Formato | Peça | Texto |
|---|---|---|---|
| Instagram (carrossel) | 1080×1350 (4:5) | capa + pontos + "Leia o artigo completo" (lâminas) | curto, literal do artigo |
| LinkedIn (documento) | PDF, mesma arte | mesmas lâminas, em PDF | texto técnico, mais longo |
| Reels / Shorts | 1080×1920 (9:16), 30 fps | mesmo vídeo para os dois | roteiro curto derivado do artigo |
| YouTube longo | 16:9 | trecho semanal (1 vídeo longo por semana) | roteiro do trecho do artigo |

Regras comuns a todos os canais:
- Mesmo Estilo Portal (tipografia Oswald e Raleway, fundo claro, contraste AA, ícone 3D CC0 registrado).
- Mesmas checagens, nos três canais:
  - texto: zero genérico, literalidade, identificação de 5 linhas (no rodapé ou na legenda), aviso de IA, CVV 188 · SAMU 192 quando o tema for sensível;
  - arte: `checagemArte` (tamanhos, contraste, colisão, rótulos, acento "Antônio");
  - vídeo: T1 técnica determinística, T2 científica, T3 ética/humanizada;
  - CFM: oferta de consulta, agendamento ou atendimento individual REPROVA em texto, legenda e arte (regra de 08/11/2026, `backend/lib/checagensAprovacao.js`). Chamada para leitura do artigo: "Leia o artigo completo — link na bio."
- Crédito de marca em áudio e vídeo (`CLAUDE.md`, 16/10): menção discreta na fala e na tela ao Portal de Saúde Mental Doutor Antônio Felipe Garabito; nunca marca d'água.
- Aviso "Conteúdo educativo com apoio de IA, aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026)."

## 3. Cascata de ferramentas (cota × sem cota)

Ordem do Dr. (08/11). Divisão por custo e risco:

1. **Claude** (cota do `claude -p`, teto de 3 por dia e 15 por semana, `relatorios/CONSUMO.md`): roteiro, estilo e tradução de canal. Só quando o texto precisa de adaptação.
2. **Automação sem IA** (zero cota, local): render das lâminas (Playwright), render de vídeo (FFmpeg), legendas SRT, checagens determinísticas (zero genérico, arte, identificação, links, CFM).
3. **Narração**: Edge-TTS `pt-BR-AntonioNeural` é o único padrão permitido por `CLAUDE.md` (custo zero). A ordem cita narração Kokoro local (licença em `relatorios/voz-amostras/KOKORO-LICENCA-21102026.md`, não tracked). Kokoro só entra depois de ordem escrita do Dr. Antônio que altere o `CLAUDE.md`.
4. **Modelo local (Ollama)**: só para tarefas de baixo risco (listas, contagens, extração de campos, resumo curto). Nunca decide sozinho: "reprovado", "incerto" ou JSON inválido vão para correção (`CLAUDE.md`, uso do Ollama, O5).
5. **Estoque**: 14 dias de peças prontas e aprovadas por canal (redes e vídeos), antes de abrir nova fila. Artigos novos seguem 60 dias (Guia de Aprimoramento, §6.5).
6. **Pausa limpa**: se a cota acabar, a esteira para no ponto atual, registra em `relatorios/PENDENTES.md` e retoma sem perda. Com estoque, pausas de 2 a 3 semanas não afetam o Portal (Guia, §6.5).

## 4. Calendário e estoque

- Instagram: 1 post por dia (7 por semana).
- LinkedIn: segunda, quarta e sexta (3 por semana). Limite do agendador: no máximo 3 por dia (`CLAUDE.md`, carta de 18/10).
- YouTube: 3 a 5 Shorts e 1 vídeo longo por semana.
- Estoque: 14 dias de peças prontas e aprovadas, por canal (ver item 5 da cascata).
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
- Os PDFs dos guias (Roteiro v1.1 e Guia de Aprimoramento) são cópias locais do Dr.: não entram no Git nem em PR.

## 7. Pendências e próximos passos

1. **Seção 7A: não encontrada.** Verificado em 08/11 (tarde) no PDF `Roteiro-Producao-Audiovisual-09-11.pdf`: o documento tem seções 1 a 8; a seção 7 é "Riscos e cuidados"; não existe 7A. A cascata acima vem da ordem escrita de 08/11 e do Guia, §6.5. Conferir com o Dr. se a versão correta é outra.
2. Implementar a atomização por canal em PR próprio, com testes e portão.
3. Gerar a prévia de 14 dias por canal e submeter ao Dr. Antônio.
4. Piloto de vídeo (segunda, 17:30, sem instalar nada antes): Node v26.8.1, Python 3.12.10 e ffmpeg 9.0.1 já estão no computador (atendem Node 20+, Python 3.11+ e ffmpeg 7+).
