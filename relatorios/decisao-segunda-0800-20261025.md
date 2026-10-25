# Freio de segunda 08:00 (26/10/2026): registro da decisão

Registrado: domingo 25/10/2026, 12:41 (Salvador). Faltam 9 h 19 min até 22:00.
Decisão: [B] (a ordem não marcou escolha; vale [B]). Nada publica sem supervisão.

## 1. Disponibilidade do Dr. Antônio (registrada)
- Seg a sex: a partir das 17:30. Seg a qui: até 22:00. Sex: sem fim informado (considerar 22:00).
- Sáb: a partir das 20:30 até dom 22:00. Hoje (dom): até 22:00.
- Fora dessas janelas: PC pode estar desligado e nenhuma ação depende do Dr.
- Conflito a confirmar: o CLAUDE.md (plantões, 19/10) diz que quinta é plantão das 17:30 às 10:30; esta ordem diz seg a qui até 22:00.

## 2. Premissas corrigidas
- Horários em Salvador (UTC−3). O `date` do Git Bash devolve UTC mesmo com `TZ`; usar PowerShell `Get-Date`.
- A promoção fica para segunda, 17:30–21:30, em decisão separada. Não foi feita.
- A pausa do Instagram no banco se limpa quando a impressão digital do token muda: não é retenção robusta.

## 3. Posts previstos (validação de 18/10/2026 13:58, Salvador; 7 carrosséis, Instagram)
Horário previsto: 08:00 de Salvador (11:00 UTC) em cada data.
- 26/10 Saúde mental do cuidador (5 imagens)
- 27/10 Tempo de tela em crianças e adolescentes (5)
- 28/10 Primeiros episódios psicóticos (7)
- 29/10 O paciente que ninguém via (6)
- 30/10 Programa de saúde mental ocupacional (5)
- 03/11 Gestação, amamentação e saúde mental (7)
- 04/11 Alimentação e saúde mental de crianças e adolescentes (6)
Não li a fila do banco: pode haver outros posts devidos fora deste arquivo.

## 4. O que o handler `publicar-redes-v2` faz (código lido)
a) Publica UM post por execução e para ao publicar. Ordem: mais visualizações primeiro; empate: data mais antiga.
b) Não publica todos de uma vez. Cron seg a sex; a cada dia útil sai no máximo um.
c) Revalida na hora: hash de cada imagem, quantidade e marca d'água. Antes do `media_publish`, cria containers novos e espera FINISHED. Não confiou só na validação de 18/10. Não reexecuta a auditoria do texto (não li o restante de `conferir`).
d) Falha: o post volta a `aprovado-checagem`, recebe `adiadoAte` de +20 h, soma uma falha e gera alerta. Não repete no mesmo run. Token inválido: `registrarTokenInvalido` grava pausa (não confirmei o ponto exato de chamada no caminho de publicação).
e) Portas, nesta ordem: (1) `REDES_PUBLICACAO_ATIVA` (ausente = LIGADA; valor não lido); (2) pausa no banco (`estadoPausa`); (3) credencial presente; (4) status `aprovado-checagem`, data devida e sem `adiadoAte` futuro; (5) conferência de hash e marca d'água; (6) rota (imagem única, carrossel ou fila manual); (7) trava atômica; (8) containers FINISHED; (9) `media_publish`.
Conclusão: se a Meta aceitar o token às 08:00 de segunda, sai 1 post (26/10, 5 imagens), em algum minuto entre 08:00 e 08:59 (cron do Hobby). Os demais saem um por dia útil, de 27/10 a 04/11, se nada for pausado.

## 5. Estado da Meta
- Verificador, executado uma vez antes desta ordem (só leitura; log em `relatorios/logs/verificar-token-20261025.log`): exit 1, "Falha: 190: ... The user has not authorized application ...". Não é o texto "API access deactivated".
- Limite: o verificador lê só a variável local `INSTAGRAM_ACCESS_TOKEN`. A publicação usa `obterTokenInstagram`, que prefere a credencial cifrada no banco. Logo o 190 não prova o que a produção usa.
- Não há `DIAGNOSTICO-*.md` em `relatorios/instagram/`; `token-estado.json` não existe. Pausa no banco: não li.
- Se a produção usar token inválido: nada publica (falha segura). Se usar token válido: vale o item 4.
- RESUMO-DO-DIA (25/10), primeira linha: "YouTube: autorização vencida". Alertas: "diagnóstico da Vercel sem resultado há 38 h"; "DrSM-Manutencao-Semanal terminou com código 1".

## 6. Pesquisa oficial (25/10/2026)
- Cron no Hobby: uma execução por dia; pode disparar em qualquer minuto da hora marcada; duração máx. 300 s; pode ser pulado ou repetido. https://vercel.com/docs/cron-jobs/usage-and-pricing
- Desativar: Cron Jobs → "Disable Cron Jobs" (projeto inteiro, não por cron); sem deploy; persiste em promoção e Instant Rollback; reativação manual na mesma tela; desativados continuam listados. https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Variáveis de ambiente: a mudança vale só para deploys novos; deploys existentes mantêm os valores. https://vercel.com/docs/environment-variables/managing-environment-variables
- Crons chamam o deploy de produção: herdado da pesquisa anterior; não reconfirmado nesta rodada.
- Plano da conta: evidência indireta (comentário "Hobby: 1x/dia" no código e retenção de 1 h dos logs). Painel não lido.
- Alias divergente: NÃO EXPLICADO. Docs: `--skip-domain` vale só com `--prod` e desativa a promoção automática de domínios; não diz se o alias derivado por deployment fica de fora. Relatos de comunidade: o alias derivado foi reatribuído. https://vercel.com/docs/cli/deploy e https://community.vercel.com/t/production-alias-reassigned-despite-skip-domain/50528

## 7. Opções para 08:00 de segunda (executar hoje, antes das 22:00)
- O1 Desativar crons no painel. Para TODOS: publicar-redes-v2, publicar-agendados (artigos do site), renovar-token (seg 09:00), relatorio-redes, diagnostico-instagram, publicar-linkedin. Reversível: sim. Quem: Dr. Efeito colateral: artigos agendados do site param; ao reativar, o próximo 08:00 de dia útil publica sozinho.
- O2 Reter por `adiadoAte` nos 7 posts: mecanismo existe (filtro de devidos). Não há script pronto nem simulação; exige escrita no banco. Não executar hoje.
- O3 Pausa manual no banco (`pausadoEm` + `impressaoPausada` com a impressão atual): mecanismo existe. Sem comando pronto; escrita no banco; cai sozinha se o token mudar. Não executar hoje.
- O4 `REDES_PUBLICACAO_ATIVA=false` + redeploy + promoção hoje: NÃO recomendo. Variável só vale em deploy novo; exige deploy e promoção (proibidos nesta ordem); o alias derivado ainda não está explicado.
- O5 Não fazer nada: seguro se o token de produção estiver inválido; se estiver válido, sai 1 post às 08:00 de segunda.
Recomendação para [B]: O1 é a única ação hoje que para o 08:00 sem depender de banco ou deploy. Mas não entrega supervisão: ao reativar, a fila volta a sair sozinha. Então: desativar hoje e manter desligado até existir liberação supervisionada (PR com dry-run). Custo: os artigos do site também param.

## 8. Comandos para HOJE (antes das 22:00; o Dr. executa)
- Painel: Vercel → drsaudemental → Settings → Cron Jobs → "Disable Cron Jobs". Desfazer: mesma tela, reativar.
- Conferir depois: a tela mostra os crons como desativados.

## 9. Segunda, 17:30: o que verificar
- Perfil do Instagram: nenhum post de 26/10 publicado.
- Relatório da conferência de 09:30 (`relatorios/conferencias/2026-10-26.md`).
- Se O1 foi aplicado: os logs de cron de 08:00 podem já ter expirado (retenção de 1 h). A checagem é pelo perfil e pelo painel.
- Nada apagado. Fila intacta.

## 10. Janela de promoção de segunda (17:30–21:30)
- Evitar 19:30 (LinkedIn cron, seg/qua/sex; desligado sem flag) e 20:00 (diagnóstico), e 20:15 (YouTube publica no PC).
- Margem para desfazer até 22:00. Não promover sem a decisão do freio (item 7) registrada.

## 11. Proposta de horários das tarefas DrSM-* (não aplicada)
- Conferência 09:30 e relatório: sem ação do Dr.; manter.
- LinkedIn-Agendar (11:00 diário): mover para 18:00 seg a sex; o Chrome precisa de login do Dr.
- Manutenção-Semanal (seg e sex 11:00): mover para 18:00.
- Rotina-Semanal (seg 07:30): mover para 18:30.
- Narração (22:00 seg/ter/qua/sex/sáb; 14:00 qui/dom): propor 18:00 seg a qui, 21:00 sáb, 14:00 dom.
- Gera-mídia (23:30; 15:30 qui/dom): propor 19:00 seg a qui e sáb 21:00 (depois da narração).
- Publica YouTube (20:15; 17:15 qui/dom): sáb 20:45; qui 20:15 (se o Dr. confirmar o conflito de quinta).
- PC ligado depois do horário: StartWhenAvailable roda a tarefa perdida; a trava diária impede repetir no mesmo dia.
- Arquivos a mudar: `scripts/agendar-tarefas-windows.ps1`, o mapa de horários da rotina e os testes que fixam horários (localizar com grep antes).

## 12. Lição e sugestão para o CLAUDE.md (só sugestão)
- Lição: o `date` do Git Bash é UTC; relatórios em Salvador usam PowerShell `Get-Date` ou fuso explícito.
- Sugestão para o CLAUDE.md (uma linha): "Horários: sempre em America/Bahia (Salvador); no Windows usar PowerShell Get-Date, pois o `date` do Git Bash devolve UTC."

## 13. Commit anterior
- `8363441` (plano de segunda) ainda não foi enviado. Comando: `! git -C C:/DRS-promocao push -u origin docs/vercel-promocao-20261025`
