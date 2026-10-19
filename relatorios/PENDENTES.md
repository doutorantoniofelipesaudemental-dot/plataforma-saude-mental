# Pendentes — ficou para depois da renovação da cota (18/10/2026)
Nenhuma tarefa agendada, código de produto ou ação em Instagram, YouTube, LinkedIn ou Blob foi feita nesta ordem.

1. **Autorizações a–g da ordem anterior.** Passo exato: reler a lista da ordem anterior (registrada no PROMPT-ATUAL.md, se lá estiver; o texto integral não está nos arquivos desta sessão) e pedir ao Dr. Antônio a confirmação de cada item antes de executar.
2. **E-mail de alertas** (`docs/alertas-email.md`, **arquivo não encontrado em 18/10/2026**). Passo exato: localizar ou criar o documento depois da renovação; não enviar nada antes.
3. **Tarefas agendadas.** Passo exato: só criar após a renovação e nova ordem escrita. Nenhuma tarefa `DrSM-*` foi criada ou alterada nesta ordem.
4. **Merge do PR da Fase 5.** Passo exato: o Dr. Antônio roda `npm run merge-seguro -- <número do PR>` (o número aparece em `relatorios/ESTADO-GERAL.md`).
5. push e PR dependem de comando do Antônio (bloqueio do classificador em 18/10/2026).

## Lote 1 (18/10/2026, branch feat/automacao-lote1-20261018)
- **Feito:** item 1 (resumo diário, `scripts/conferencias/resumoDoDia.js`, testes); item 2 (rotina mensal do Blob, tarefa `DrSM-Blob-Rotina-Mensal` DESATIVADA, só simulação); item 3 (e-mail de alertas, `docs/alertas-email.md`, desligado sem `RESEND_API_KEY`).
- **Item 4 NÃO criado (conflito com regra permanente):** a tarefa `DrSM-LinkedIn-Agendar` chamaria o Claude Code sem o Dr. Antônio, para agendar posts no LinkedIn. O CLAUDE.md proíbe "robô que publique sozinho por tarefa agendada" e a skill `agendar-linkedin` diz que só roda quando o Dr. Antônio pede. Decisão para o Dr. Antônio: manter o agendamento manual ("rodar agendar-linkedin") ou alterar a regra escrita.
- **Pendente de você:** ativar a rotina do Blob (`! schtasks /Change /TN DrSM-Blob-Rotina-Mensal /ENABLE`, só após ordem); criar a variável `RESEND_API_KEY` no `.env` (passos em `docs/alertas-email.md`).
- **Lote 2:** autorizações b, d, f e testes do LinkedIn.
- **Lote 1 — portão NÃO passou:** e2e 5 falhas (ERR_CONNECTION_REFUSED em localhost:3000 e ECONNRESET, visual-miniapps). Passo exato: subir o servidor de teste e rodar `npm run test:e2e`; se persistir, investigar o webServer do playwright.config.

## Correções antes do commit do lote 1 (19/10/2026)
- **Portão REPROVADO (bloqueia merge):** E2E `auditoria-ferramentas.spec.js` › CLS do `relato-aposta-tres-da-manha` = 0.1835 (limite < 0.1). Reproduzido 2x com o mesmo valor. Código de páginas e conteúdo idênticos ao origin/main (falha pré-existente). Decisão necessária: corrigir o layout/artigo ou ajustar o limite (com ordem do Dr. Antônio). Relatório: relatorios/portao-20261019-0858.md.
- **PR semanal sexta 11:00:** não automatizado. Falta definir o que o PR contém e de qual branch sai.
- **DrSM-LinkedIn-Agendar:** criar/recriar pelo `scripts/agendar-tarefas-windows.ps1` (comando `!` no fim da sessão).
