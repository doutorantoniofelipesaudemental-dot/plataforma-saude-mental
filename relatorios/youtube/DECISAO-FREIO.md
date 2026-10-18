# Decisão: ligar o freio do YouTube agora ou esperar a auditoria? (18/10/2026)

**Nada foi ligado.** Esta página só descreve as duas opções; a decisão e os ajustes no `.env` são seus.

## Onde estamos
- Autorização do YouTube refeita em 18/10/2026, app do Google em "Em produção" (não vence mais em 7 dias). Leitura do canal conferida (HTTP 200).
- Fila: **109 vídeos aprovados** (42 longos + 67 Shorts), 0 reprovados, 0 publicados. Primeiro horário da fila: 27/10/2026; último: 31/01/2027.
- Projeto do Google Cloud **ainda não auditado**: o YouTube força para **privado** todo vídeo enviado pela API, mesmo pedido como público (o publicador registra "privacidade aplicada"). Para virarem públicos: auditoria da API (respostas prontas em `AUDITORIA-API-RESPOSTAS.md`; faltam só os dados pessoais e as capturas, listados no topo do arquivo).
- Landings `/youtube` e `/instagram` no ar; descrições dos vídeos já trazem o link da `/youtube`.
- Cota: cada upload custa ~1.600 unidades (padrão 10.000/dia). Padrão do publicador: até 2 por execução diária (12:30), no máximo 4.

## Opção A — ligar agora (vídeos sobem PRIVADOS até a auditoria; ritmo de 1 por dia)
**O que muda:** a tarefa `DrSM-YouTube-Publica` (12:30, todo dia) passa a enviar os vídeos devidos pela data do `slot`. Antes da auditoria, eles ficam **privados** no seu canal (só você vê); depois da aprovação do Google, é preciso torná-los públicos (no Studio, em lote, ou reenviando). Vantagem: o canal e as playlists ganham estrutura e você revisa cada vídeo no ar do seu lado. Risco: acumular até 100+ vídeos privados e ter de publicá-los manualmente; o título, o hash e a conferência já foram checados, mas o vídeo aparece no Studio com o nome final.
**Para ficar em 1 por dia:** a execução diária publica os itens com data vencida, até 2 por execução. Para garantir 1, ajustar o argumento da tarefa para `--max=1` (peça ao Claude Code; é uma alteração de tarefa `DrSM-*`).
**Comando que eu pediria (você faz; dois ajustes no `.env` local, no Bloco de Notas, sem colar nada no chat):**
```
YOUTUBE_PUBLICACAO_ATIVA=true
REDES_PUBLICACAO_ATIVA=true
```
Antes: `! node --env-file=.env scripts/youtube/testeUploadPrivado.js --confirmar` (1 Short privado de teste; confira o link). Para ver o que a tarefa faria, sem enviar: `! node --env-file=.env scripts/youtube/publicarYoutube.js --simular`.
Atenção: `REDES_PUBLICACAO_ATIVA` é também o freio geral das redes no `.env` local (a Vercel tem o seu, separado). Para voltar atrás: `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apagar a linha).

## Opção B — esperar a auditoria
**O que muda:** nada sobe. Os vídeos continuam prontos em `relatorios/youtube/fila-manual/semana-*/` (vídeo, capa, legenda, título e descrição) e você pode subir à mão pelo YouTube Studio quando quiser (isso não depende da auditoria e já os publica de verdade). A fila automática só é ligada depois da aprovação do Google (prazo de dias a semanas). Vantagem: zero vídeo privado acumulado, nenhum risco de envio errado. Desvantagem: o canal fica parado se você não subir à mão.
**Comando que eu pediria:** nenhum agora. Quando o Google aprovar: `! node --env-file=.env scripts/youtube/testeUploadPrivado.js --confirmar` (confirma que fica **público**), depois os dois ajustes do `.env` acima.

## Minha leitura
Os dois caminhos são seguros. Se o objetivo é ter o canal no ar já, a via mais rápida é subir pelo Studio os Shorts e longos da semana (fila manual). Se o objetivo é a automação, enviar a auditoria primeiro (cerca de 30 minutos seus) e ligar o freio quando o Google responder. A Opção A só compensa se você quiser revisar os vídeos já dentro do Studio.

## Lembrete seu
- Apagar o vídeo de teste **z_JHmmpw880** no YouTube Studio (não apago nada por você).
