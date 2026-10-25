# Plano de promoção — segunda, 26/10/2026 (rascunho, nada executado)

Registro desta ordem (sem valores de variáveis). ATENÇÃO DE HORÁRIO: os horários dos relatórios de 25/10 (fases 1 a 3) foram gravados em UTC, não em Salvador. Salvador = UTC−3. Ex.: "11:41" do relatório era 08:41 em Salvador. Windows confirma: fuso "E. South America Standard Time" (UTC−3); 25/10 às 09:02 em Salvador ao registrar.

## 1. Estado (25/10, verificado nesta ordem)
- Alias derivado e domínios principais: `dpl_9pwS6LguSCW11r13XehkUFNgbhdy` (#147), início e fim da sessão.
- Candidato `dpl_GcikF9T1qfyCggPrBpstoDopamMP` (`a40869f`): não promovido, sem domínio. Smoke 200 em `/`, `/privacidade`, `/links`, `/mentoria`, `/api/health`, artigo.
- Log do candidato na última hora: sem linhas. Retenção: 1 hora (Hobby) ou 1 dia (Pro); o código indica Hobby. Logs de cron de 25/10 não recuperáveis.
- Divergência: a API lista o alias no candidato, mas `vercel inspect` mostra o #147. Não explicado; conferir de novo antes de agir.

## 2. Cronograma de segunda (Salvador)
| Hora | Evento | Fonte |
|---|---|---|
| 08:00 | `publicar-agendados` (diário) e `publicar-redes-v2` (seg a sex): publica no SITE e no Instagram | vercel.json, `0 11 * * *` e `0 11 * * 1-5` |
| 09:00 | `renovar-token-instagram` e `relatorio-redes` (segunda) | `0 12 * * 1` |
| 09:30 | Conferência diária (Windows) | tarefa DrSM-Conferencia-Diaria |
| 11:00–13:00 | Sua janela de promoção | sua ordem |
| 17:30 | Plantão (sem ação automática depende de você) | sua ordem |
| 19:30 | `publicar-linkedin` (seg/qua/sex) | `30 22 * * 1,3,5` |
| 20:00 | `diagnostico-instagram` (diário) | `0 23 * * *` |
Correção à sua lista: faltavam `relatorio-redes` (09:00) e `publicar-linkedin` (19:30). `publicar-redes-v2` está em `vercel.json`, seg a sex, 08:00.

## 3. Ponto crítico: a janela de 11:00 chega DEPOIS do cron de 08:00
- O cron roda no deploy que detém o domínio: hoje, o #147. Promover às 11:00 não muda o que roda às 08:00.
- Variáveis: a documentação oficial diz que a edição vale para o PRÓXIMO deploy, não para o já no ar (Environments, vercel.com/docs/deployments/environments). Logo, mudar `REDES_PUBLICACAO_ATIVA` agora não afeta o #147.
- Conclusão: para vetar a publicação das 08:00 pelo freio de variável, é preciso um deploy de produção COM a variável nova PROMOVIDO antes das 08:00 de segunda. A janela de 11:00 é tarde para isso.
- Pausa no banco (`Credencial`): NÃO é freio confiável. Pelo código (`tokenInstagram.js`, `estadoPausa`), a pausa se limpa sozinha quando a impressão digital do token muda, e então `publicarDevidos` publica se houver post devido. O token mudou em 20/10, então a pausa pode já estar limpa.
- Fila: há 7 carrosséis previstos (validados em 18/10, arquivo `relatorios/redes/validacao-carrosseis.json`), o primeiro para 26/10 às 11:00 UTC = 08:00 Salvador, com `publicado=false` naquela data. O status atual no banco não consegui ler.
- Opções (decisão sua; eu não executo):
  a) Desligar a publicação ANTES das 08:00 de segunda: pelo painel, `REDES_PUBLICACAO_ATIVA=false` + deploy de produção com esse valor PROMOVIDO antes das 08:00 (hoje ou cedo na segunda).
  b) Remover os posts de 26/10 da fila (ação de conteúdo no banco; sua decisão).
  c) Desativar os crons no painel (Vercel → Cron Jobs) até a decisão; isso também para o `publicar-agendados` do site.
- Sem uma dessas, o cron das 08:00 pode publicar com ou sem promoção.

## 4. Decisão para promover segunda às 11:00 SOMENTE SE todos forem verdadeiros
| Condição | Como verificar |
|---|---|
| Alias e domínios no #147 | `vercel inspect` de cada domínio |
| Log do candidato sem 5xx nem variável ausente | `vercel logs` / get_runtime_logs, janela de 1 hora |
| Diferença de código entendida: crons NÃO mudam; visível: CLS (`artigo.html`, `style.css`) | relatório fase 3, seção 5 |
| Freio decidido por você ANTES das 08:00 (ver seção 3) | sua decisão; eu não leio o valor |
| CLS conferido por você no candidato (URL do candidato, com login Vercel/SSO) | páginas da seção 6 |
| Conferência de 09:30 entendida | seção 7 |
Se qualquer item falhar: não promover; registrar e manter o #147.

## 5. Visitante: o que muda com a promoção (main `a40869f` vs #147)
- #153: `public/artigo.html` (preload de fonte) e `public/assets/css/style.css` (+29 linhas, fonte Fraunces). Visível: tipografia e possível mudança de layout (CLS).
- #146: narração e provedor padrão (backend). Não muda página. Não altera o cron.
- #150: docs. Nada visível.
- #154: ferramenta de merge. Nada visível.
- Crons: nenhum handler importa os arquivos alterados. Promover NÃO muda o comportamento dos crons.

## 6. Páginas para conferir manualmente (celular e desktop, no candidato)
`/` (home), um artigo (ex.: `/artigo/afastamento-transtorno-mental`), `/blog`, `/privacidade`. O CSS (`style.css`) também carrega em `/instagram`.

## 7. Conferência de 09:30
- Ainda não venceu quando registrei (09:02). A tarefa tem StartWhenAvailable e WakeToRun. O último run foi 24/10 20:03 (resultado 1: 10 falhas, conforme `relatorios/logs-agendador/DrSM-Conferencia-Diaria.log`). O PC foi ligado às 20:03 de 24/10; o 09:30 de 24/10 não rodou.
- Causa mais provável do relatório de 25/10 ausente: o horário ainda não tinha chegado. Se às 09:35 ainda não houver relatório, verificar com a tarefa ligada.

## 8. Comandos (UMA linha cada)
- Promover o candidato (quando decidido): `vercel promote dpl_GcikF9T1qfyCggPrBpstoDopamMP --scope doutor-antonio-felipe-saude-mental`
- Conferir depois: `vercel inspect www.drantoniofelipemedico.com.br --scope doutor-antonio-felipe-saude-mental`
- Desfazer (voltar ao #147, documentado como rollback): `vercel rollback dpl_9pwS6LguSCW11r13XehkUFNgbhdy --scope doutor-antonio-felipe-saude-mental`
- Alternativa: `vercel promote dpl_9pwS6LguSCW11r13XehkUFNgbhdy` reatribui os domínios ao #147, mas reativa a atribuição automática; prefira o rollback.

## 9. Lições
- `--skip-domain` não impediu a atribuição do alias derivado de produção. Antes de criar deploy de produção sem domínio, listar aliases e prever o efeito.
- Antes de promover, confirmar qual deploy os crons invocam (o que serve o domínio) e a data de cada cron.
- Retenção de logs curta (1 h no Hobby): ler os logs logo após o evento.
- Horários: sempre gravar com fuso explícito (`date` sem TZ válido gravou UTC).
- Sugestão (não aplicada): `.mcp.json` no `.vercelignore`.
