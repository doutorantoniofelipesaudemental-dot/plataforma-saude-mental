# Mapa da automação (20/10/2026)

Fontes: `vercel.json` (crons), `relatorios/*-estado*`, freios em variáveis de ambiente. Nada aqui foi alterado.

## Crons de produção (Vercel)

| Horário (UTC) | Rota | O que faz |
|---|---|---|
| 11:00 todo dia | `/api/cron/publicar-agendados` | publica os textos agendados no horário |
| 11:00 seg a sex | `/api/cron/publicar-redes-v2` | publica a fila de redes (freio `REDES_PUBLICACAO_ATIVA`) |
| 22:30 seg, qua, sex | `/api/cron/publicar-linkedin` | publica a fila do LinkedIn (freio próprio) |
| 12:00 segunda | `/api/cron/relatorio-redes` | relatório semanal das redes |
| 12:00 segunda | `/api/cron/renovar-token-instagram` | renova o token do Instagram (IGAA) e grava `expiraEm` |
| 23:00 todo dia | `/api/cron/diagnostico-instagram` | valida o próximo post sem publicar; grava em `diagnosticos_publicacao` |

## Tarefas locais (Agendador do Windows, `DrSM-*`)

- `DrSM-Conferencia-Diaria`: 09:30. Gera o `RESUMO-DO-DIA.md`, roda o backup do estado e os alertas.
- `DrSM-LinkedIn-Agendar`: **desativada**. Só reativar após reconciliar e nova ordem.
- `DrSM-PR-Semanal`: criada desativada (19/10).
- `DrSM-Renovar-Token-Inicial`: não foi criada (a renovação é o cron de segunda).

## Freios (só o Dr. Antônio liga ou desliga)

- `REDES_PUBLICACAO_ATIVA`: freio geral das redes. Está desligado.
- `YOUTUBE_PUBLICACAO_ATIVA`: freio do YouTube. Está desligado.
- Freio próprio do LinkedIn: `LINKEDIN_PUBLICACAO_ATIVA`.

## Estados fora do Git (com backup diário em `backup_estado`)

`agendamento-lote`, `narracao-progresso`, `validacao-carrosseis`, `youtube/fila.json`, `publicacao-log`, `links-estado.json`, `estado-regeracao.json`, `teste-carrossel/estado.json`, `linkedin/agendar-diario-estado.json`, `linkedin/fila.json`, `youtube/reprovados/REGERAR-FILA.txt`, `CONSUMO.md`, `consumo-claude.json`.

## Trava contra duplicidade

- LinkedIn: `scripts/linkedin/travaDuplicidade.js` (conta no banco antes e depois).
- YouTube: `scripts/youtube/travaDuplicidadeYoutube.js` (coleção `youtube_publicados`).
- Conteúdo novo: `backend/lib/existeConteudo.js` (ainda não ligado a todas as importações).

## Mudanças de 20/10 (carta v3)
- Agendador do LinkedIn e pré-checagem carregam o .env por dentro (scripts/carregarEnv.js); sem --env-file na linha de comando. Atalhos: npm run linkedin:pre e linkedin:agendar.
- Permissões headless: docs/permissoes-headless/aplicar.js (checagem; hoje nada falta).
- Fila do YouTube: status só pelo conferidor (conferirVideo.statusPelaConferencia), checagem cruzada na conferência diária.
- Criação de texto novo: fonte única (existeConteudo) na ingestão de rascunhos e na importação.
- Manutenção semanal: pendente (ver docs/manutencao-semanal.md).

## Atualização de 20/10 (noite)
- LinkedIn: agendador carrega o .env por dentro; 1 post agendado hoje; tarefa DrSM-LinkedIn-Agendar desativada.
- Manutenção semanal: scripts/manutencaoSemanal.js --auto (segunda 11:00 prepara o branch; sexta 11:00 envia o branch). Tarefa a criar (docs/manutencao-semanal.md).
- Processos filhos sem --env-file (teste estático em tests/unit/sem-env-file-em-codigo.test.js).

## Atualização de 20/10 (noite)
- LinkedIn: scripts/linkedin/agendarDiario.js (uma chamada, até 3 posts, trava no banco). Tarefa DrSM-LinkedIn-Agendar ativada.
- Manutenção semanal: DrSM-Manutencao-Semanal (segunda e sexta 11:00), scripts/manutencaoSemanal.js.
- Monitoramento: conferência diária lê LastTaskResult das tarefas DrSM-* (scripts/conferencias/monitorTarefas.js).
- YouTube: scripts/youtube/reaproveitarProntos.js e proximosHorarios.js (fila nova, 1 por dia, horários das regras da fila).
- Permissões: docs/permissoes-headless/aplicar.js (Write(...) para Edit(...) nas negações).

## Estratégia de crescimento (20/10/2026)
- Planos: ARQUITETURA-ARTIGOS.md (domínio e pilares), RADAR-TEMAS-2026-10.md (radar mensal, depende do Search Console), ESTRATEGIA-CRESCIMENTO-PLANO.md (sete peças e painel semanal), COMENTARIOS-PROPOSTA.md (comentários, sem resposta automática), BENCHMARK-ECOSSISTEMAS.md (10 práticas).
