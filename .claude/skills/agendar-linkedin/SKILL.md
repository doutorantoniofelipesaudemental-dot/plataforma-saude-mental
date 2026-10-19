---
name: agendar-linkedin
description: Agendamento no LinkedIn (perfil pessoal, agendador NATIVO, janela do Chrome com o Dr. Antônio logado). Roda pela tarefa diária DrSM-LinkedIn-Agendar (11:00, via scripts/linkedin/agendarDiario.js) ou quando o Dr. Antônio pede. No máximo 3 posts por dia. Auditoria e tripla checagem antes de cada post; PARA em limite, verificação, CAPTCHA, login ou aviso de atividade incomum.
---
Regras (CLAUDE.md, "Redes sociais → LinkedIn"): autorizado agendar sem pedir aprovação por post, desde que passe na auditoria + tripla checagem. Agendamento diário automático AUTORIZADO em 18/10/2026 (tarefa DrSM-LinkedIn-Agendar, 11:00; máx. 3 posts/dia, 2 min entre eles; parada imediata nos avisos do CLAUDE.md). Sempre só agendar, nunca publicar. PROIBIDO: digitar ou guardar senha, ler cookies ou tokens, contornar CAPTCHA ou verificação. Nunca clicar em "Publicar": só "Agendar".

**Linha de status (obrigatória).** Quando a execução é automática (`agendarDiario.js`), a última linha da resposta deve ser exatamente uma destas:
- `STATUS: OK`
- `STATUS: PARAR <motivo curto>` (deslogado, verificação, CAPTCHA, limite diário, erro)
- `STATUS: DESATIVAR <motivo curto>` (só aviso de atividade incomum ou restrição de conta)

O script lê só a ÚLTIMA linha que começa com `STATUS:`. Sem essa linha, código de saída diferente de 0 ou timeout, conta como PARAR. Texto como "verificação concluída" ou "dentro do limite diário" não para nada.

Sessão (uma por dia, até acabar a fila, no máximo 3 posts):
1. **Login**: no Chrome controlado (chrome-devtools), abrir `https://www.linkedin.com/feed/`. Se pedir login, verificação, CAPTCHA ou aparecer aviso de atividade incomum: PARAR e chamar o Dr. Antônio. Conferir pela tela (sem ler cookies/tokens) que é o perfil pessoal.
2. **Auditoria do lote**: `node --env-file=.env scripts/linkedin/preAgendamento.js` (gera `relatorios/linkedin/agendamento-lote.json`; reprovado vai para `relatorios/linkedin/reprovados/` e NÃO é agendado). Rodar também `npm run auditoria` (0 falhas). Pegar os próximos até 3 ids da lista `aprovados` com status ainda aberto (`node --env-file=.env scripts/linkedin/filaManual.js estado` mostra os agendados e os abertos), na ordem de data. O link do texto do site citado precisa estar no ar na data do post (o pré-agendamento já confere).
3. **Por post** (pausas de ritmo humano já estão no script): `node --env-file=.env scripts/linkedin/gerarScriptAgendar.js <id> tudo` e executar o arquivo gerado com `evaluate_script` (`sourcePath`) em `https://www.linkedin.com/sharing/compose` (navegar para lá antes de cada post). O script escreve o texto, abre o agendador, põe a data e 19:30 (Bahia), confere o rótulo "Publicação em ...", confirma e clica em **Agendar**; só conta como agendado com o aviso "Publicação agendada". Retorno com `erro`/`fase` = PARAR o lote.
4. **Limite**: "Você atingiu o limite de publicações de hoje" é normal: parar (`STATUS: PARAR limite diário`), descartar o rascunho (botão Fechar → Descartar), registrar quantos foram agendados e deixar o resto para o dia seguinte. Verificação, CAPTCHA, login: `STATUS: PARAR` e chamar o Dr. Antônio, sem tentar de novo. Atividade incomum: `STATUS: DESATIVAR`.
5. **Conferir**: abrir o compositor → relógio → aba "Agendamento realizado" e ler data, hora e início do texto de cada post do lote (contagem deve subir pelo número agendado). Divergiu: corrigir/cancelar pelo LinkedIn e avisar.
6. **Marcar no banco** cada post conferido: `node --env-file=.env scripts/linkedin/filaManual.js agendado <id> <AAAA-MM-DD de hoje>`.
7. **Atualizar** `relatorios/linkedin/FILA-MANUAL.md` (`filaManual.js` regrava) e o bloco do `relatorios/ESTADO-GERAL.md`; dizer ao Dr. Antônio: agendados hoje, último agendado, quantos faltam.
8. **Fechar** com a linha `STATUS: OK` (ou PARAR/DESATIVAR, conforme o caso).

Carrosséis (PDF): numa sessão, tentar agendar 1 documento (compositor → "Adicionar documento" com o PDF da pasta do post). Se o agendador não aceitar PDF, o carrossel continua na fila manual (`relatorios/linkedin/FILA-MANUAL.md`). O lembrete manual `DrSM-LinkedIn-Lembrete` está desativado, porque o agendamento agora é automático.

A rotina semanal mostra o último agendado e quantos faltam, e avisa quando faltarem menos de 14 dias.
