---
name: agendar-linkedin
description: Sessão diária de agendamento no LinkedIn (perfil pessoal, agendador NATIVO, janela do Chrome com o Dr. Antônio logado). Só roda quando o Dr. Antônio digita "rodar agendar-linkedin". Agenda o próximo lote de até 5 posts, com auditoria e tripla checagem antes de cada um, e PARA em limite, verificação, CAPTCHA, login ou aviso de atividade incomum.
---
Regras (CLAUDE.md, "Redes sociais → LinkedIn"): autorizado agendar sem pedir aprovação por post, desde que passe na auditoria + tripla checagem. PROIBIDO: tarefa agendada que rode isto sozinha (só roda quando o Dr. Antônio pede), digitar ou guardar senha, ler cookies ou tokens, contornar CAPTCHA/verificação. Nunca clicar em "Publicar": só "Agendar".

Sessão (uma por dia, até acabar a fila):
1. **Login**: no Chrome controlado (chrome-devtools), abrir `https://www.linkedin.com/feed/`. Se pedir login, verificação, CAPTCHA ou aparecer aviso de atividade incomum: PARAR e chamar o Dr. Antônio. Conferir pela tela (sem ler cookies/tokens) que é o perfil pessoal.
2. **Auditoria do lote**: `node --env-file=.env scripts/linkedin/preAgendamento.js` (gera `relatorios/linkedin/agendamento-lote.json`; reprovado vai para `relatorios/linkedin/reprovados/` e NÃO é agendado). Rodar também `npm run auditoria` (0 falhas). Pegar os próximos até 5 ids da lista `aprovados` com status ainda aberto (`node --env-file=.env scripts/linkedin/filaManual.js estado` mostra os agendados e os abertos), na ordem de data. O link do texto do site citado precisa estar no ar na data do post (o pré-agendamento já confere).
3. **Por post** (pausas de ritmo humano já estão no script): `node --env-file=.env scripts/linkedin/gerarScriptAgendar.js <id> tudo` e executar o arquivo gerado com `evaluate_script` (`sourcePath`) em `https://www.linkedin.com/sharing/compose` (navegar para lá antes de cada post). O script escreve o texto, abre o agendador, põe a data e 19:30 (Bahia), confere o rótulo "Publicação em ...", confirma e clica em **Agendar**; só conta como agendado com o aviso "Publicação agendada". Retorno com `erro`/`fase` = PARAR o lote.
4. **Limite**: "Você atingiu o limite de publicações de hoje" é normal: parar, descartar o rascunho (botão Fechar → Descartar), registrar quantos foram agendados e deixar o resto para o dia seguinte. Verificação, CAPTCHA, login ou atividade incomum: parar e chamar o Dr. Antônio, sem tentar de novo.
5. **Conferir**: abrir o compositor → relógio → aba "Agendamento realizado" e ler data, hora e início do texto de cada post do lote (contagem deve subir pelo número agendado). Divergiu: corrigir/cancelar pelo LinkedIn e avisar.
6. **Marcar no banco** cada post conferido: `node --env-file=.env scripts/linkedin/filaManual.js agendado <id> <AAAA-MM-DD de hoje>`.
7. **Atualizar** `relatorios/linkedin/FILA-MANUAL.md` (`filaManual.js` regrava) e o bloco do `relatorios/ESTADO-GERAL.md`; dizer ao Dr. Antônio: agendados hoje, último agendado, quantos faltam.

Carrosséis (PDF): numa sessão, tentar agendar 1 documento (compositor → "Adicionar documento" com o PDF da pasta do post). Se o agendador não aceitar PDF, os carrosséis continuam na fila manual com o lembrete das 19:25 (`DrSM-LinkedIn-Lembrete`, só para os manuais).

A rotina semanal mostra o último agendado e quantos faltam, e avisa quando faltarem menos de 14 dias.
