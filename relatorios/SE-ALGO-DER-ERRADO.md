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
