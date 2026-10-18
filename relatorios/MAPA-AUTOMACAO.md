# Mapa da automação — 18/10/2026

Fonte: CLAUDE.md, ESTADO-GERAL.md, PROMPT-ATUAL.md, vercel.json e tarefas DrSM-*. Rascunho inicial do gemma2:9b revisado pelo Claude Code (saída do modelo com erros de formato e colunas trocadas; descrições refeitas a partir dos arquivos). Itens sem fonte: "não verificado".

Legenda: 🔴 depende do Dr. Antônio.

| Tarefa | Automática / manual | Quem dispara | Frequência | O que acontece se falhar |
|---|---|---|---|---|
| **Site** (deploy do portal) | Automática | Vercel, a cada push na `main` (merge-seguro) | A cada merge | Deploy anterior segue no ar; rollback por Promote (ver `relatorios/rollback-*`). 🔴 merge é feito pelo Dr. Antônio (`npm run merge-seguro -- <PR>`, 1x por semana) |
| **Textos agendados do site** (publicação) | Automática | Cron Vercel `publicar-agendados`, diário 11:00 UTC | Diária | Texto não sai na data; sem freio próprio (pausar = remover agendamento do `vercel.json`) |
| **Narração dos áudios** (geração Edge-TTS) | Automática | Tarefa `DrSM-Narracao-Noite` (Windows) | Diária, 22:00 | Narração não gerada; sai da fila e fica `pendente`. Só roda com o PC ligado. Envio ao site pela API |
| **Narração — vinheta de crédito** | Automática | Conferido em `precisaVinheta` (`narracao.js`) | Por lote | Estado atual: 726/726 com vinheta (verificado 18/10) |
| **YouTube — geração de mídia** | Automática (só gera arquivos locais) | Tarefa `DrSM-YouTube-Gera-Midia` (Windows) | Diária, 23:30 | Sem publicação; arquivo não gerado. Só roda com o PC ligado |
| **YouTube — publicação** | Automática, com freio | Tarefa `DrSM-YouTube-Publica` (Windows), freio `YOUTUBE_PUBLICACAO_ATIVA` + `REDES_PUBLICACAO_ATIVA` no `.env` local | Diária, 12:30 | Com freio `false` nada sai. 🔴 Ligar o freio só após aprovação da auditoria; 🔴 "Enviar" na auditoria do YouTube é manual |
| **Instagram — fila de posts** (imagem única pela Meta Graph) | Automática, com freio | Cron Vercel `publicar-redes-v2`, seg–sex 11:00 UTC; freio `REDES_PUBLICACAO_ATIVA` na Vercel | Dias úteis, 08:00 Bahia | Trava contra publicação dupla; adia 1 dia e alerta. Freio `false` bloqueia |
| **Instagram — carrossel** | Automática, liberada | Mesmo publicador; `carrosselLiberado=true` (verificado 18/10) | Conforme a fila | Valida containers antes do `media_publish`; falha adia 1 dia |
| **Instagram — Reels e Stories** | Manual (fora de escopo por ora) | Não produzidos; reavaliar em ~18/11 | — | — |
| **Instagram — conferência diária** | Automática, só leitura | Tarefa `DrSM-Conferencia-Diaria`, 09:30 | Diária | Relatório em `relatorios/conferencias/` e alerta no topo do ESTADO-GERAL |
| **Instagram — token** | Automática | Cron Vercel `renovar-token-instagram` | Renova antes de vencer (token válido até 14/12/2026) | Publicação para se o token vencer. 🔴 Login/OAuth, se a renovação automática falhar |
| **LinkedIn** (perfil pessoal) | Manual com ajuda | Você publica no agendador nativo; `DrSM-LinkedIn-Lembrete` (seg/qua/sex 19:25) só lembra | Seg/qua/sex, 19:30 | Post não sai no dia. Cron antigo `publicar-linkedin` está com freio `LINKEDIN_PUBLICACAO_ATIVA` desligado e sem credenciais. 🔴 Login quando cair; 🔴 limite diário do LinkedIn; 🔴 PC ligado |
| **LinkedIn — agendamento em sessão** | Manual (skill `agendar-linkedin`) | Você digita "rodar agendar-linkedin" | 1x por dia, com Chrome logado | Parar em CAPTCHA, login ou aviso; não há robô por tarefa agendada |
| **Blob** (armazenamento de capas, áudios e vídeos) | Automática (uploads pelos scripts) | Scripts de publicação e narração | Contínua | Upload falha e a peça não sai. Valor documentado: 1332 MB; o teto citado nas notas diverge (1 GB e 26%). **não verificado** |
| **Tokens e chaves** (Instagram, YouTube, Vercel) | Manual e semiautomática | Variáveis da Vercel e `.env` local; renovação do Instagram por cron | Conforme validade (YouTube reautorizado, em produção) | Publicações que dependem do token param. 🔴 Revogar e trocar se houver exposição |
| **Conferências** (`DrSM-Conferencia-19-10`, `26-10`) | Automática | Tarefas Windows, 19:30 nas datas indicadas | Pontual (19/10, 26/10) | Erro 1 da execução de teste de 16/10 registrado; rodam nas datas |
| **Rotina semanal** (`npm run rotina-semanal`) | Automática | Tarefa `DrSM-Rotina-Semanal`, segunda 07:30 | Semanal | Relatório incompleto; falta de auditoria da semana. 🔴 Se a rotina acusar falha, decisão é sua |
| **Landings** (`/mentoria`, `/linkedin`, `/links`) | Automática (deploy com o site) | Vercel, com o merge | A cada deploy | Página fora do ar até novo deploy. Conteúdo só muda com plano e ordem do Dr. Antônio |
| **SEO** (sitemap, canonical, robots) | Automática | Geração do sitemap no código (`backend/lib/sitemap.js`) | A cada deploy | **não verificado** (sem cron próprio conferido) |
| **Backups** (antes de gravar) | Manual | Claude Code, antes de cada `--aplicar` (regra do CLAUDE.md) | Antes de cada gravação | Gravação sem backup é proibida. Pasta `backups/` local. **não verificado** se há cópia automática fora do PC |
| **Auditoria geral** (`npm run auditoria`) | Manual | Claude Code, antes de gravar, deploy ou publicação | Por evento | Falha bloqueia o passo seguinte |

## O que continua sendo do Dr. Antônio 🔴
- `merge-seguro` (1x por semana).
- Clicar em "Enviar" na auditoria do YouTube.
- Login no LinkedIn quando cair; CAPTCHA e verificação.
- PC ligado à noite (narração 22:00, YouTube 23:30 e 12:30, conferências 19:30).
- Ligar `YOUTUBE_PUBLICACAO_ATIVA` após aprovação da auditoria.
- Aprovar mudança de sentido clínico, novos módulos (Newsletter, Podcast, Kit NR-1) e uso de foto de rosto.
- Ativar crédito extra ou recarga, se for necessário.
