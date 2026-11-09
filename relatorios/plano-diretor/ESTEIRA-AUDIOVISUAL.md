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

Fonte: seção 7A "Cascata de ferramentas: produção sem recesso" do Roteiro de Produção Audiovisual v1.1 (`relatorios/plano-diretor/guias/Roteiro-Producao-Audiovisual-v1.1.pdf`, cópia local, fora do Git), decisão do Dr. Antônio de 08/11/2026.

Níveis (a produção de vídeo, depois de pronto o Estilo Portal e os modelos, é código e narração local, sem gastar tokens):

1. **Claude** (assinatura; gasta cota do `claude -p`, teto de 3 por dia e 15 por semana, `relatorios/CONSUMO.md`): julgamento clínico e de linguagem: roteiro a partir do artigo, tradução, revisão independente, criação de estilos e modelos novos.
2. **Automação sem IA** (não gasta cota): render de vídeos a partir de roteiros aprovados, legendas, cartelas, miniaturas, checagens automáticas, agendamento e publicação.
3. **Narração local Kokoro** (Apache-2.0; não gasta cota). Autorizada pelo Dr. Antônio em 08/11/2026 para **vídeos novos** (a partir do piloto de segunda); narrações existentes não mudam. Edge-TTS `pt-BR-AntonioNeural` segue como padrão para o restante (`CLAUDE.md`, §F). Licença em `relatorios/voz-amostras/KOKORO-LICENCA-21102026.md` (não tracked).
4. **Modelo local aberto** (Ollama; não gasta cota): só tarefas de baixo risco e formato: sugerir capítulos, títulos alternativos, descrições, hashtags, ordenar fila. Passa sempre pela checagem zero genérico. Nunca texto clínico novo nem tradução. O nível 4 nunca gera conteúdo clínico. Só roda se a memória do computador aguentar (o Claude Code confere antes, só lendo).
5. **Estoque de 14 dias** de vídeos prontos (publicação continua pelo agendamento enquanto a cota se renova). Artigos novos seguem 60 dias (Guia de Aprimoramento, §6.5).
6. **Pausa limpa**: se os níveis acima se esgotarem, só a produção de vídeo pausa, sem erro; artigos e redes seguem (Guia, §6.5).

Regras da cascata (do v1.1):
- Sem API nova e sem IA gratuita que use o conteúdo para treino (ex.: Gemini grátis). Por isso Gemini, Groq e OpenAI estão desativados no código (ordem de 08/11/2026, `backend/lib/llm.js`).
- Sem troca silenciosa: cada peça registra qual nível a produziu.
- Opção extra só com ordem escrita do Dr.: plano de assinatura com mais cota. Nenhuma contratação automática.
- Prioridade quando a cota está baixa: 1º artigos novos, 2º redes, 3º roteiros de vídeo, 4º espanhol. A renderização (nível 2) continua sempre, porque não usa cota.

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

1. **Seção 7A: encontrada e incorporada (08/11).** Está no Roteiro v1.1 (`Roteiro-Producao-Audiovisual-v1.1.pdf`). A versão `Roteiro-Producao-Audiovisual-09-11.pdf` tem só as seções 1 a 8, sem 7A; use a v1.1.
2. Implementar a atomização por canal em PR próprio, com testes e portão.
3. Gerar a prévia de 14 dias por canal e submeter ao Dr. Antônio.
4. Piloto de vídeo (segunda, 17:30, sem instalar nada antes): Node v26.8.1, Python 3.12.10 e ffmpeg 9.0.1 já estão no computador (atendem Node 20+, Python 3.11+ e ffmpeg 7+).

## Dois fluxos (ordem de 09/11/2026)

**(A) Artigos médicos (7 temas)** continuam alimentando YouTube (vídeos educativos), Instagram, LinkedIn e podcast (narração), como hoje.

**(B) Relatos da Prática** alimentam:
- redes: carrossel e Reels com trechos; nota de ficção na legenda e no último slide;
- podcast "Relatos da Prática": nota de ficção lida no início e na descrição;
- fase futura, **minissérie animada**: temporada = tema, episódio = relato; nota de ficção na tela (início) e na descrição; aviso de IA (CFM 2.454/2026) sempre; animação NÃO realista; narração Kokoro; as regras de Relatos (CLAUDE.md, seção "Temas, Blog e Relatos") valem para o roteiro.

Status: o fluxo (B) começa só depois do piloto de vídeo de hoje ser aprovado. Nada de produção agora.
