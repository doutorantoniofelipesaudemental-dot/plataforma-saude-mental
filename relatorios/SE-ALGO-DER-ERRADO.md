# Se algo der errado (1 página)

**Regra de ouro:** na dúvida, desligue a rede e investigue depois. Desligar não apaga nada; a fila continua guardada.

## 1. Como desligar cada rede
| Rede | Como desligar | Onde |
|---|---|---|
| **Tudo (Instagram, LinkedIn, YouTube)** | `REDES_PUBLICACAO_ATIVA` = `false` | Vercel → projeto `drsaudemental` → Settings → Environment Variables → **Redeploy** |
| **Instagram** | o freio geral acima (ou remover `CRON_SECRET`, que pausa todos os crons) | Vercel, idem |
| **LinkedIn** | `LINKEDIN_PUBLICACAO_ATIVA` = `false` | Vercel, idem + Redeploy |
| **YouTube** | `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apagar a linha) | arquivo `.env` deste computador (o publicador roda aqui). Para parar já: Agendador de Tarefas → `DrSM-YouTube-Publica` → Desativar |
| **Publicação de textos no site** | remover `CRON_SECRET` na Vercel (pausa todos os crons) | Vercel |
| **Tarefas do computador** | `powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover` | terminal |

## 2. Como ver se um post saiu
- **Instagram:** perfil @doutor.antoniofelipe.smental; `node --env-file=.env backend/scripts/redes/verificarToken.js`; relatório `relatorios/conferencia-primeiro-post-*.md`.
- **LinkedIn:** seu perfil → Atividade; no banco, coleção `linkedin_fila` (campo `status`: publicado / bloqueado / expirado); Vercel → Logs → `[linkedin]`.
- **YouTube:** `relatorios/youtube/publicacao-log.md` (cada linha diz PUBLICADO, BLOQUEADO ou ERRO) e o YouTube Studio. Se o vídeo aparecer **privado**, é o projeto do Google ainda não verificado (ver `youtube/PASSO-A-PASSO-YOUTUBE.md`).
- **Site/áudios:** `npm run auditoria`; `npm run rotina-semanal` (segunda-feira roda sozinha às 07:30).

## 3. Problemas conhecidos
- **Vercel Blob bloqueado** ("Your store is blocked", capas e áudios dão 403): a cota de 1 GB do plano Hobby foi atingida em 15/10/2026. Solução: no painel Vercel → Storage → o store Blob: apagar arquivos antigos (as narrações antigas de textos refeitos, `artigos/<slug>/narracao-<hash>.mp3` que não são mais usadas) ou trocar de plano. Depois que o store for liberado, `GET /api/admin/blob-narracoes` (com o token de admin) mostra o que é órfão e `DELETE` no mesmo endereço apaga **só** o órfão. Retomar as narrações: `npm run ciclo-narracao`.
- **Rollback do site:** Vercel → Deployments → deploy anterior → ⋯ → **Promote to Production**. Antes do PR #77 o deploy de produção era `dpl_5T42Da4GYLjXEkJRJWh9wtiSLsQd`.
- **Token do Instagram:** renova sozinho toda segunda; vence em 14/12/2026 se falhar. **LinkedIn:** vence a cada ~60 dias (a rotina avisa).

## 4. Quem chamar
- **Vercel** (site, crons, Blob): vercel.com/help. **Meta/Instagram:** Central de Ajuda do Meta Business. **YouTube/Google Cloud:** suporte do YouTube Studio e formulário de auditoria da API. **LinkedIn:** linkedin.com/help.
- **Comentário ou mensagem com risco de vida:** não responder com orientação clínica; indicar **CVV 188** (24 h) ou **SAMU 192**.
- **Vazamento de chave/segredo:** revogar a chave no painel do provedor na hora e avisar o Dr. Antônio.

## Tarefas agendadas do Windows (registradas em 16/10/2026)
Rodam como o seu usuário (sem administrador), só scripts do repositório; log em `relatorios/logs-agendador/<tarefa>.log`.
| Tarefa | Quando | O que faz |
|---|---|---|
| DrSM-Rotina-Semanal | segunda 07:30 | `scripts/rotinaSemanal.js` (somente leitura) |
| DrSM-Narracao-Noite | diária 22:00 — **DESATIVADA** até a vinheta estar em produção | `scripts/cicloNarracao.js --lotes=4` |
| DrSM-YouTube-Gera-Midia | diária 23:30 | gera mídia local (limite 25) |
| DrSM-YouTube-Publica | diária 12:30 | só publica com `YOUTUBE_PUBLICACAO_ATIVA=true` (hoje nada) |
| DrSM-Conferencia-19-10 / 26-10 | 19:30 nas datas | relatórios de conferência |

Desativar uma: `Disable-ScheduledTask -TaskName 'DrSM-NOME'` · reativar: `Enable-ScheduledTask -TaskName 'DrSM-NOME'`
Remover todas: `powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover`
Reativar a narração após a vinheta em produção: `Enable-ScheduledTask -TaskName 'DrSM-Narracao-Noite'`

## Freios das publicações automáticas: onde está cada um (conferido em 16/10/2026)
Regra de ouro: **cada publicação tem o freio no lugar onde ela roda.** O que roda na **Vercel** lê as variáveis da Vercel; o que roda no **Windows** (computador do consultório) lê o arquivo `.env` desta pasta. Mudar um não muda o outro.

| Publicação automática | Roda onde e quando | Onde está o freio | Para DESLIGAR | Para LIGAR | Hoje |
|---|---|---|---|---|---|
| **Instagram** (posts da fila) | **Vercel**, cron seg–sex 11:00 UTC (08:00 Bahia) | Variável `REDES_PUBLICACAO_ATIVA` na **Vercel** (freio geral das redes) | Vercel → Project Settings → Environment Variables → `REDES_PUBLICACAO_ATIVA` = `false` → **Redeploy** | mesma tela: `true` (ou apagar a variável) → Redeploy | **LIGADO** (`true`) |
| **Textos agendados do site** | **Vercel**, cron diário 11:00 UTC | Sem variável de freio própria | Pausar: tirar o agendamento dos textos (ou pedir ao Claude Code para remover o cron do `vercel.json`) | — | Ligado (primeiro teste real: 19/10 08:00) |
| **LinkedIn** (posts da fila) | **Vercel**, cron seg/qua/sex 22:30 UTC (19:30 Bahia) — **não** é tarefa do Windows | `LINKEDIN_PUBLICACAO_ATIVA` na **Vercel** (e também `REDES_PUBLICACAO_ATIVA` da Vercel) | Vercel → Environment Variables → `LINKEDIN_PUBLICACAO_ATIVA` = `false` (ou apagar) → Redeploy | `true` → Redeploy (só depois de colocar as credenciais do LinkedIn na Vercel; ver `relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md`) | **DESLIGADO** (variável não existe; também faltam as credenciais) |
| **YouTube** (publicador) | **Windows**, tarefa `DrSM-YouTube-Publica`, todos os dias 12:30 (computador ligado) | `YOUTUBE_PUBLICACAO_ATIVA` **e** `REDES_PUBLICACAO_ATIVA` no `.env` **local** (as duas precisam deixar passar) | No `.env` (Bloco de Notas): `YOUTUBE_PUBLICACAO_ATIVA=false` ou apagar a linha. Para parar também a tarefa: `Disable-ScheduledTask -TaskName 'DrSM-YouTube-Publica'` | No `.env`: `YOUTUBE_PUBLICACAO_ATIVA=true` **e** `REDES_PUBLICACAO_ATIVA` não pode estar `false` | **DESLIGADO**. ⚠ O `REDES_PUBLICACAO_ATIVA` do `.env` local está `false`, então mesmo com `YOUTUBE_PUBLICACAO_ATIVA=true` o YouTube **continuaria bloqueado** até você mudar esse também |
| **YouTube** (geração dos vídeos) | **Windows**, tarefa `DrSM-YouTube-Gera-Midia`, todos os dias 23:30 | Não publica nada: só gera arquivos locais | `Disable-ScheduledTask -TaskName 'DrSM-YouTube-Gera-Midia'` | `Enable-ScheduledTask -TaskName 'DrSM-YouTube-Gera-Midia'` | Ligada |
| **Narração dos áudios** | **Windows**, tarefa `DrSM-Narracao-Noite`, todos os dias 22:00; envia os MP3 ao site pela API | Sem variável de freio (o freio é a própria tarefa) | `Disable-ScheduledTask -TaskName 'DrSM-Narracao-Noite'` | `Enable-ScheduledTask -TaskName 'DrSM-Narracao-Noite'` | Ligada |

Notas:
- **Freio geral (`REDES_PUBLICACAO_ATIVA=false`)**: bloqueia Instagram, LinkedIn e YouTube **no lugar onde a variável está**. Na Vercel vale para Instagram e LinkedIn; no `.env` local vale para o YouTube e para qualquer script rodado no computador.
- Quem decide ligar o YouTube e o LinkedIn é o Dr. Antônio. Nada foi alterado nos freios nesta etapa. Não se repete a sobrescrita do freio em comando sem ordem expressa.
- Ver o estado do freio da Vercel sem abrir o painel: `GET /api/admin/freio-redes` (Instagram/geral) e `GET /api/admin/freio-youtube` (variável do YouTube na Vercel; o publicador real lê o `.env` local).

## YouTube: o freio é DUPLO (no `.env` local)
Para o YouTube publicar são necessários **os dois ajustes ao mesmo tempo** no arquivo `C:DRSAUDEMENTAL.env` (Bloco de Notas):

| Ajuste no `.env` | Valor para LIGAR | Hoje |
|---|---|---|
| `YOUTUBE_PUBLICACAO_ATIVA` | `true` | linha **não existe** (desligado) |
| `REDES_PUBLICACAO_ATIVA` | `true` (ou apagar a linha) | está `false` (bloqueando) |

**Para DESLIGAR basta um dos dois:** `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apagar a linha) **ou** `REDES_PUBLICACAO_ATIVA=false`.

Quem depende de quê (no computador):
- `DrSM-YouTube-Publica` (12:30): precisa dos **dois**.
- Teste de upload privado (`npm run youtube:upload-teste`) e criação das playlists: precisam só de `REDES_PUBLICACAO_ATIVA` (não olham o freio do YouTube).
- `DrSM-YouTube-Gera-Midia` (23:30, só gera arquivos), `DrSM-Narracao-Noite`, `DrSM-Rotina-Semanal` e as conferências: **não dependem** de nenhum dos dois.

Atenção: o `REDES_PUBLICACAO_ATIVA` da **Vercel** é uma variável **separada** (controla Instagram e LinkedIn). Mudar o `.env` daqui não altera a Vercel, e o contrário também não. Passo a passo completo: `relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md` (passo D).
