# Mapa da automação — 18/10/2026

Fonte: CLAUDE.md, ESTADO-GERAL.md, PROMPT-ATUAL.md, vercel.json e tarefas DrSM-*. Rascunho inicial do gemma2:9b revisado pelo Claude Code (saída do modelo com erros de formato e colunas trocadas; descrições refeitas a partir dos arquivos). Itens sem fonte: "não verificado".

Legenda: 🔴 depende do Dr. Antônio.

| Tarefa | Automática / manual | Quem dispara | Frequência | O que acontece se falhar |
|---|---|---|---|---|
| **Site** (deploy do portal) | Automática | Vercel, a cada push na `main` (merge-seguro) | A cada merge | Deploy anterior segue no ar; rollback por Promote (ver `relatorios/rollback-*`). 🔴 merge é feito pelo Dr. Antônio (`npm run merge-seguro -- <PR>`, 1x por semana) |
| **Textos agendados do site** (publicação) | Automática | Cron Vercel `publicar-agendados`, diário 11:00 UTC | Diária | Texto não sai na data; sem freio próprio (pausar = remover agendamento do `vercel.json`) |
| **Narração dos áudios** (geração Edge-TTS) | Automática | Tarefa `DrSM-Narracao-Noite` (Windows) | Seg, ter, qua, sex, sáb 22:00; quinta e domingo 14:00 (plantão) | Narração não gerada; sai da fila e fica `pendente`. Só roda com o PC ligado. Envio ao site pela API |
| **Narração — vinheta de crédito** | Automática | Conferido em `precisaVinheta` (`narracao.js`) | Por lote | Estado atual: 726/726 com vinheta (verificado 18/10) |
| **YouTube — geração de mídia** | Automática (só gera arquivos locais) | Tarefa `DrSM-YouTube-Gera-Midia` (Windows) | Seg, ter, qua, sex, sáb 23:30; quinta e domingo 15:30 (plantão) | Sem publicação; arquivo não gerado. Só roda com o PC ligado |
| **YouTube — publicação** | Automática, com freio | Tarefa `DrSM-YouTube-Publica` (Windows), freio `YOUTUBE_PUBLICACAO_ATIVA` + `REDES_PUBLICACAO_ATIVA` no `.env` local | Seg, ter, qua, sex, sáb 20:15; qui e dom 17:15 (ordem de 19/10/2026) | Com freio `false` nada sai. 🔴 Ligar o freio só após aprovação da auditoria; 🔴 "Enviar" na auditoria do YouTube é manual |
| **Instagram — fila de posts** (imagem única pela Meta Graph) | Automática, com freio | Cron Vercel `publicar-redes-v2`, seg–sex 11:00 UTC; freio `REDES_PUBLICACAO_ATIVA` na Vercel | Dias úteis, 08:00 Bahia | Trava contra publicação dupla; adia 1 dia e alerta. Freio `false` bloqueia |
| **Instagram — carrossel** | Automática, liberada | Mesmo publicador; `carrosselLiberado=true` (verificado 18/10) | Conforme a fila | Valida containers antes do `media_publish`; falha adia 1 dia |
| **Instagram — Reels e Stories** | Manual (fora de escopo por ora) | Não produzidos; reavaliar em ~18/11 | — | — |
| **Instagram — conferência diária** | Automática, só leitura | Tarefa `DrSM-Conferencia-Diaria`, 09:30 | Diária | Relatório em `relatorios/conferencias/` e alerta no topo do ESTADO-GERAL |
| **Instagram — token** | Automática | Cron Vercel `renovar-token-instagram` | Renova antes de vencer (token válido até 14/12/2026) | Publicação para se o token vencer. 🔴 Login/OAuth, se a renovação automática falhar |
| **LinkedIn** (perfil pessoal) | Automática, só agenda (máx. 3/dia) | Tarefa `DrSM-LinkedIn-Agendar` (11:00, `scripts/linkedin/agendarDiario.js`); lembrete manual `DrSM-LinkedIn-Lembrete` DESATIVADO | Diária, 11:00 | Post não sai no dia. Cron antigo `publicar-linkedin` está com freio `LINKEDIN_PUBLICACAO_ATIVA` desligado e sem credenciais. 🔴 Login quando cair; 🔴 limite diário do LinkedIn; 🔴 PC ligado |
| **LinkedIn — agendamento em sessão** | Automática (skill `agendar-linkedin`, via `DrSM-LinkedIn-Agendar`; ou sob pedido) | Tarefa às 11:00 com Chrome logado; última linha `STATUS: OK / PARAR / DESATIVAR` | 1x por dia, máx. 3 posts | Para em CAPTCHA, login, verificação, limite ou aviso (aviso de atividade incomum desativa a tarefa). 🔴 Login quando cair |
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
- PC ligado nos horários fora dos plantões (narração 22:00, YouTube 23:30 e publicação 20:15 (qui e dom 17:15), conferências 19:30). Quintas e domingos, ver a seção de plantões abaixo.
- Ligar `YOUTUBE_PUBLICACAO_ATIVA` após aprovação da auditoria.
- Aprovar mudança de sentido clínico, novos módulos (Newsletter, Podcast, Kit NR-1) e uso de foto de rosto.
- Ativar crédito extra ou recarga, se for necessário.

## Estado do Windows (19/10/2026, após PR #114)
- Horários aplicados: YouTube Publica 20:15 e 17:15 (qui/dom); Gera-Midia 23:30 e 15:30; Narração 22:00 e 14:00 (qui/dom).
- Disabled: DrSM-LinkedIn-Agendar, DrSM-LinkedIn-Lembrete, DrSM-Blob-Rotina-Mensal. Ready: demais DrSM-*.
- DrSM-Conferencia-19-10: rodou com ATENÇÃO (token da Meta); não removida.

## Blob mensal (19/10/2026)
- DrSM-Blob-Rotina-Mensal: DESATIVADA (decisão C2 do Dr. Antônio). Primeira execução seria 01/11/2026, 03:00. Ativar só por ordem, após simulação. Código com condições (b) e (d) faltando: ver PENDENTES.md.

## Reativação e teto (19/10/2026, correção pós-plano)
- `scripts/agendar-tarefas-windows.ps1`: tarefa existente mantém o estado (ativa ou desativada); `-Simular` só mostra a ação. Novas DrSM-LinkedIn-Agendar e DrSM-Blob-Rotina-Mensal nascem desativadas.
- Formas de reativação: LinkedIn — `scripts/linkedin/pausar.js` só desativa a tarefa e grava `pausado` em relatorios/linkedin/agendar-diario-estado.json; para religar, apagar `pausado` e habilitar a tarefa (só por ordem). Blob — não há comando de retomar; só o agendador. Lembrete manual — o script o desativa a cada execução real.
- Teto do `claude -p`: `scripts/consumoClaude.js`, usado por `scripts/linkedin/agendarDiario.js`. 3 por dia e 15 por semana; registro em relatorios/CONSUMO.md.
- MCP: ElevenLabs removido de `.mcp.json`. `.claude/settings.json` e `.claude/settings.local.json` ainda citam o nome (não alterados).

## Plantões e tarefas DrSM-* (19/10/2026)
- Indisponível às QUINTAS e DOMINGOS das 17:30 até as 10:30 do dia seguinte; o PC pode estar desligado.
- Narração: 22:00 (seg, ter, qua, sex, sáb); 14:00 (qui, dom). YouTube gera-mídia: 23:30 / 15:30 (qui, dom). YouTube publica 20:15 (seg, ter, qua, sex, sáb) e 17:15 (qui, dom).
- Todas as tarefas DrSM-* têm StartWhenAvailable (rodam quando o PC voltar). Trava diária (`scripts/travaDiaria.js`) nas tarefas de script: uma vez por dia com sucesso. Blob mensal tem trava própria; LinkedIn tem a sua (`agendarDiario.js`).
- LinkedIn 11:00 e conferência 09:30: rodam quando o PC voltar.
- PR semanal na sexta às 11:00: **não automatizado ainda** (não há script de PR semanal; decisão pendente sobre o que o PR contém).
- Aplicar: `powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1` (recria as tarefas); conferir com `schtasks /query`.

## Lote 1 (18/10/2026, branch feat/automacao-lote1-20261018)
| Item | Onde | Estado |
|---|---|---|
| Resumo diário | scripts/conferencias/resumoDoDia.js (chamado por conferenciaDiaria.js) → relatorios/RESUMO-DO-DIA.md | pronto, testado |
| Rotina mensal do Blob | scripts/blob-rotina-mensal.js; tarefa DrSM-Blob-Rotina-Mensal (dia 1, 03:00) | DESATIVADA; só simulação |
| E-mail de alertas | scripts/alertas/enviarAlerta.js; docs/alertas-email.md | desligado até RESEND_API_KEY |
| Tarefa LinkedIn (DrSM-LinkedIn-Agendar) | — | NÃO criada: conflita com a regra de robô que agenda sozinho (CLAUDE.md) |

## Lote 1, fechamento (18/10/2026)
| Item | Estado |
|---|---|
| E2E com 5 falhas | não reproduzido: 3 rodadas seguidas com 31/31 passando; o servidor de teste (index.js) não importa os módulos novos |
| DrSM-LinkedIn-Agendar (11:00, agendarDiario.js) | código pronto e testado; tarefa a criar pelo Dr. Antônio (comando `!`, o classificador bloqueou a criação pelo Claude Code) |
| DrSM-Blob-Rotina-Mensal (dia 1, 03:00) | HABILITADA em 18/10/2026 por ordem escrita; apaga só c/d, com trava |
| Alerta por e-mail | código pronto; desligado sem RESEND_API_KEY; teste: `npm run alerta:teste` |
| Botão de desligar | `npm run linkedin:pausar` |
