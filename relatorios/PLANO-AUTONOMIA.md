# Plano de autonomia máxima — 19/10/2026 (somente documento)

Ordem: "CONTINUAR O PASSO 2 + PLANO DE AUTONOMIA MÁXIMA". Nada deste plano foi implementado. Nenhuma regra do CLAUDE.md foi alterada. Leitura: nomes de arquivos, `.mcp.json`, `vercel.json` e grep. Não abri o `.env`, não rodei o Ollama, não instalei nem conectei nada.

## 1. Inventário

| Item | O que é | Custo |
|---|---|---|
| Skills do projeto (`.claude/skills`) | agendar-linkedin, aplicar-referencias, auditoria-tripla-checagem, conferencia-19-10, conferencia-26-10, importar-agendar-textos, lote-narracao, manutencao, ponytail, post-linkedin, rotina-semanal, video-youtube, youtube-reprovados | nenhum (local) |
| Subagentes (`.claude/agents`) | agendador-linkedin, auditor, conferente, narrador, produtor-linkedin, produtor-youtube, varredor | nenhum (local); usam o modelo do Claude |
| Hook (`.claude/hooks`) | guarda.js (trava de merge, push na main, .env, freios, tarefas fora de DrSM-*) | nenhum |
| Scripts Node/Python (`scripts/`) | rotina, narração (Edge-TTS), FFmpeg, conferências, publicadores, portão, merge-seguro | nenhum (script puro) |
| Tarefas Windows `DrSM-*` | Rotina-Semanal, Narracao-Noite, YouTube-Gera-Midia, YouTube-Publica, Conferencia-Diaria, Conferencia-19-10 e 26-10, LinkedIn-Agendar, Blob-Rotina-Mensal (desativada), LinkedIn-Lembrete (desativada) | nenhum, exceto LinkedIn-Agendar (usa `claude -p`) |
| Crons da Vercel (`vercel.json`) | publicar-agendados, publicar-redes-v2, publicar-linkedin (freio off, sem credenciais), relatorio-redes, renovar-token-instagram | nenhum (plano Hobby) |
| Servidores MCP (`.mcp.json`) | **elevenlabs** configurado no projeto. O CLAUDE.md proíbe ElevenLabs (voz paga). **Pago: só com ordem sua; recomendo remover.** | pago |
| Conectores da conta (Vercel, Notion, Gamma, Higgsfield, Canva etc.) | disponíveis na sessão, não configurados no projeto | variável; muitos pagos |
| GitHub | sem workflows (`.github/workflows` vazio); PRs e merge pelo `merge-seguro` | nenhum |
| Ollama | llama3.2:3b, gemma2:9b e qwen2.5-coder:14b, documentados no CLAUDE.md. **Não verificado nesta ordem** (sem Ollama). | nenhum (local) |
| Hooks/permissões | `.claude/settings.json` com deny essenciais | nenhum |

## 2. Classificação das tarefas (MAPA-AUTOMACAO.md)

Classes: **C1** roda sozinha após T1+T2+T3 e auditoria geral. **C2** o Claude prepara e entrega um comando "!". **C3** só o Dr. Antônio.

| Tarefa | Hoje | Classe | Ferramentas já existentes | Checagens que a liberam | Cota | Risco se falhar |
|---|---|---|---|---|---|---|
| Deploy do site | merge-seguro (manual) | C2 | merge-seguro, portão | portão verde, merge pelo dono | nenhuma | site fora do ar até rollback |
| Textos agendados do site | cron Vercel `publicar-agendados` | C1 (já automático) | cron | auditoria no portão | nenhuma | texto sai na data errada |
| Narração | `DrSM-Narracao-Noite` 22:00 / 14:00 | C1 (já automática) | cicloNarracao.js, Edge-TTS | hash, vinheta, identificação | nenhuma | áudio pendente |
| YouTube gera mídia | `DrSM-YouTube-Gera-Midia` | C1 (já automática) | montarFila.js, FFmpeg | conferência de vídeo | nenhuma | fila sem arquivo |
| YouTube publica | `DrSM-YouTube-Publica` 20:15 / 17:15 | C1 com freio; ligar o freio = C3 | publicarYoutube.js | freio `YOUTUBE_PUBLICACAO_ATIVA`, trava diária | nenhuma | publicação indevida se o freio ligar sem auditoria |
| Instagram fila (imagem única) | cron `publicar-redes-v2` | C1 com freio | publicador | freio `REDES_PUBLICACAO_ATIVA`, trava | nenhuma | post atrasa 1 dia |
| Instagram carrossel | mesmo publicador, liberado | C1 | publicador | validação de containers | nenhuma | post atrasa |
| Reels e Stories | não produzidos | C3 (reavaliar 18/11) | — | — | — | — |
| Conferência diária (Instagram) | `DrSM-Conferencia-Diaria` 09:30 | C1 (só leitura) | conferenciaDiaria.js | — | nenhuma | alerta atrasado |
| Token do Instagram | cron `renovar-token-instagram` | C1; se o OAuth falhar = C3 | cron | — | nenhuma | publicações param |
| LinkedIn agendamento | `DrSM-LinkedIn-Agendar` 11:00 | C1 com `claude -p` (≤3 chamadas/dia) | agendarDiario.js, skill agendar-linkedin | STATUS, auditoria, parada em CAPTCHA/login | **baixo-médio** | parada; login é C3 |
| LinkedIn cron `publicar-linkedin` | freio off, sem credenciais | **C3 (credencial). Recomendo desativar.** | cron | — | nenhuma | nenhum hoje |
| LinkedIn lembrete | desativado | retirar | — | — | — | — |
| Relatório de redes | cron `relatorio-redes` | C1 (leitura) | cron | — | nenhuma | relatório atrasado |
| Blob, rotina mensal | desativada | C3 (ativar e apagar) | blob-rotina-mensal.js com trava | trava de 50% e 20 arquivos | nenhuma | apagar arquivo errado |
| Conferências 19/10 e 26/10 | pontuais | C1; concluir e retirar depois | conferirPosRenovacao.js | — | nenhuma | nenhum |
| Rotina semanal | `DrSM-Rotina-Semanal` seg 07:30 | C1 | rotinaSemanal.js | auditoria, retratações | nenhuma | relatório incompleto |
| Landings (/mentoria, /linkedin, /links) | deploy com o merge | C2 | merge-seguro | portão | nenhuma | página fora do ar |
| SEO | sitemap no código | C2 (deploy) | sitemap.js | portão | nenhuma | **não verificado** |
| Backups antes de gravar | manual | **C1 candidato** (falta script de cópia com contagem) | — | cópia abre e tem contagem | nenhuma | gravação sem backup |
| Auditoria geral | `npm run auditoria`, por evento | **C1 candidato** (falta agendamento só leitura) | auditoria | — | nenhuma | falha tardia |
| Tokens e chaves | manual | C3 | — | — | — | — |
| Enviar auditoria do YouTube | manual | C3 (ato de publicação) | — | — | — | — |
| PR semanal sexta 11:00 | não existe | C2 (PR nunca é aberto sem o dono) | a construir | — | nenhuma | — |
| Newsletter, Podcast, Kit NR-1 | planejados | C3 | — | — | — | — |

Itens que já cabem em C1 e ainda estão manuais: **backup antes de gravar** (falta script com cópia e contagem) e **auditoria geral** (falta agendamento só de leitura).

## 3. Controle de cota (proposta, não implementada)

- Arquivo `relatorios/CONSUMO.md` com contador diário e semanal de chamadas ao `claude -p`, uma linha por chamada: data, tarefa, resultado.
- Teto diário: 3 chamadas (o limite atual do LinkedIn), com teto semanal de 15.
- Regra: **sem trabalho na fila, nenhuma chamada**. A tarefa checa a fila antes de chamar o modelo.
- Hoje, pela busca por `'claude'` em `scripts/*.js`, só `scripts/linkedin/agendarDiario.js` chama `claude -p`. Todo o resto é script puro (custo zero).

## 4. Proteções obrigatórias para qualquer tarefa C1

1. Trava diária (`scripts/travaDiaria.js`) e estado próprio quando a tarefa não usa o travaDiaria.
2. Modo de simulação (`--simular`) antes da primeira execução real.
3. Para no primeiro erro, CAPTCHA, deslogado ou bloqueio do classificador. Registra alerta no topo do `ESTADO-GERAL.md`.
4. Relatório diário curto em `RESUMO-DO-DIA.md`.
5. Modelo local só como triagem, nunca decisor único. "Incerto" ou JSON inválido = não executa.
6. Nada de contornar CAPTCHA, verificação, login ou freio.

## 5. Achados desta leitura (não corrigidos)

- `scripts/agendar-tarefas-windows.ps1` reativa `DrSM-LinkedIn-Agendar` mesmo após `linkedin:pausar`, porque não respeita o `pausado`.
- `.mcp.json` tem ElevenLabs, proibido pelo CLAUDE.md.
- Cron `publicar-linkedin` está ligado com freio off e sem credenciais.

## DECISÕES PARA O DR. ANTÔNIO

1. **Remover o ElevenLabs do `.mcp.json`?** Recomendação: SIM (voz paga; o CLAUDE.md só admite Edge-TTS).
2. **Criar `relatorios/CONSUMO.md` com teto de 3 chamadas `claude -p` por dia e 15 por semana?** Recomendação: SIM.
3. **Fazer o `agendar-tarefas-windows.ps1` respeitar o `pausado` do LinkedIn antes de recriar a tarefa?** Recomendação: SIM. É uma mudança de código para aprovar depois.
4. **Desativar o cron `publicar-linkedin` na Vercel** (freio off, sem credenciais)? Recomendação: SIM.
5. **Criar um backup automático da coleção `artigos`, com contagem, antes de qualquer gravação agendada?** Recomendação: SIM, só leitura e cópia local.
6. **Agendar a auditoria geral como tarefa só de leitura, diária?** Recomendação: SIM.
7. **PR semanal sexta 11:00 com relatório de tarefas (sem código, só `relatorios/`)?** Recomendação: SIM, desde que você mescle.
8. **Manter Reels e Stories fora da automação até 18/11?** Recomendação: SIM.
