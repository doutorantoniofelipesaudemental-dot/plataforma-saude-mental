# PROMPT ATUAL (salvo em 16/10/2026 para sobreviver ao /clear)

CONTEXTO: o PR #77 está MERGED (d339b9f) e o deploy de produção está Ready. Antes de tudo, SALVE este prompt em relatorios/PROMPT-ATUAL.md e registre no topo de relatorios/ESTADO-GERAL.md qual etapa está em andamento. Atualize os dois ao fim de cada etapa.

Regras permanentes do CLAUDE.md: backup -> --dry-run -> --aplicar; auditoria geral + tripla checagem técnica, científica, ética e humanizada; não mudar o sentido dos textos sem aprovação; nunca ler nem imprimir o .env ou segredos.
AUTORIZADA e APROVADA a sequência abaixo, com conferência pós-deploy e rollback documentado em cada etapa. Subagentes com model: sonnet no trabalho repetitivo; commit ao fim de cada etapa.

REGRA DE MERGE: só com auditoria 0 falhas, build OK e 100% dos testes. Se o merge for bloqueado pelas permissões, NÃO contornar: deixar o PR pronto, passar o comando exato (com "!") e SEGUIR com as etapas que não dependem dele.

ETAPA 1 — VALIDAÇÃO DA PRODUÇÃO (código do #77)
1.2 Validar em produção: home, /mentoria, /links; 1 artigo publicado com player de áudio tocando; capa no Blob (HTTP 200); cron do LinkedIn registrado; rota de limpeza de órfãos; freios (Instagram, YouTube, LinkedIn).
1.3 TRAVA B: com 1 texto AGENDADO, confirmar que o MP3 NÃO toca nem é acessível pela URL antes da data de publicação, e que passa a tocar quando publicado (simular a data). Se falhar, PARAR a etapa 4.1 (áudios) e informar.

ETAPA 2 — BRANCH feat/credito-marca-vinheta
2.1 Rebase sobre a main atual (d339b9f), sem perder mudanças.
2.2 npm run auditoria, build, testes unitários e e2e (copiar .env ao worktree se precisar, sem ler/imprimir, e apagar depois).
2.3 PR próprio e merge se tudo passar. Se bloquear, passar o comando e seguir com 4.2, 5, 6 e 7.
2.4 Após merge e deploy Ready, conferir em produção 1 áudio com a vinheta do "Portal de Saúde Mental Doutor Antônio Felipe Garabito" (abertura e encerramento; encerramento com CVV/SAMU nos temas sensíveis).
2.5 Gerar relatorios/teste-pronuncia/vinheta-abertura.mp3 e vinheta-encerramento.mp3 se não existirem.

ETAPA 3 — INVENTÁRIO DE ÓRFÃOS NO BLOB (só leitura primeiro)
3.1 Rodar /api/admin/blob-narracoes e listar órfãos (sem texto ou hash antigo).
3.2 Gravar em relatorios/blob-orfaos-AAAAMMDD.md.
3.3 APROVADA a limpeza só dos órfãos confirmados, com backup da lista e dry-run antes. Nada ligado a texto publicado ou agendado pode ser apagado.

ETAPA 4 — ÁUDIOS, CAPAS E YOUTUBE
4.1 Só com trava B validada (1.3) e vinheta em produção (2.4): subir os ~277 áudios e capas pendentes em lotes de 50, com vinheta. Ciclo-narracao; conferir 5 por lote (vinheta, duração, volume, trava); atualizar relatorios/narracao-progresso.md.
4.2 VARREDURA ÉTICA (não depende de merge): Grep/Glob por garantido, garantidos, garantida, cura, curar, 100%, milagre, definitivo, "melhor médico", único, "resultado garantido" em relatorios/youtube (roteiros, .srt, descrições), filas de Instagram/YouTube/LinkedIn e produção audiovisual. Começar pelo Short crise-psiquiatrica-familia. Trocar por formulação sem promessa (CFM 2.336/2023), refazer vídeo e legenda afetados, listar antes/depois.
4.3 Retomar 27 vídeos longos e 45 Shorts do YouTube, com crédito do Portal na fala e na tela, sem marca d'água, com assinatura, auditoria e tripla checagem antes da fila.

ETAPA 5 — LINKEDIN
5.1 Validar cron em produção: simulação do primeiro post, freio LINKEDIN_PUBLICACAO_ATIVA, renovação do token.
5.2 Se a autorização da API faltar, confirmar que relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md e a fila manual semanal estão prontos.

ETAPA 6 — TAREFAS AGENDADAS DO WINDOWS
6.1 LER scripts\agendar-tarefas-windows.ps1 e listar tarefas (nome, horário, comando).
6.2 APROVADO rodar se: rodam como meu usuário sem administrador; só executam scripts do repositório; nenhum segredo nos argumentos; cada tarefa grava log em relatorios/.
6.3 Rodar, conferir com Get-ScheduledTask, 1 execução de teste de cada.
6.4 Documentar em relatorios/SE-ALGO-DER-ERRADO.md como desativar cada tarefa.

ETAPA 7 — MEMÓRIA E ESTADO
7.1 Conferir RAM das tarefas longas (ffmpeg, Edge-TTS). Se >70%, reduzir lotes ou rodar em série.
7.2 Atualizar relatorios/ESTADO-GERAL.md: o que roda sozinho e quando, freios, filas, dependências de mim, PRs pendentes.

DECISÃO "ANTONIO" SEM ACENTO: vale o CLAUDE.md ("Antônio" com acento em todo lugar). Exceções: URLs, @, e-mail, nomes técnicos e "Antonio Felipe Garabito Jr." (dedicatória). Se o teste protege uma exceção, MANTER. Se permite sem acento em outro lugar, corrigir o teste. Informar qual foi o caso.

RELATÓRIO FINAL (curto, pt-BR): 1 validação+trava B; 2 PR da vinheta e arquivos para ouvir; 3 órfãos; 4 áudios/capas, varredura ética, vídeos YouTube; 5 LinkedIn; 6 tarefas Windows; 7 estado geral; teste do "Antonio"; comandos "!" para mim.


---
# ATUALIZAÇÃO 16/10/2026 (noite) — vinheta aprovada, PR #78 mergeado
(Substitui as etapas 2–6 acima; texto integral do pedido do Dr. Antônio resumido abaixo.)
- URGENTE antes das 23:30: tarefa DrSM-YouTube-Gera-Midia — merge em produção => 1 execução de teste com 1 vídeo (crédito na fala e na tela, sem marca d'água, assinatura, RAM < 70%); só deixar ativa se passar.
- 2.4: conferir 1 áudio publicado com abertura/encerramento da vinheta (CVV/SAMU em temas sensíveis); reativar DrSM-Narracao-Noite e confirmar que usa a vinheta.
- 3: ajustar /api/admin/blob-narracoes para listar TODOS os arquivos e classificar (a publicado, b agendado, c hash antigo de texto existente, d sem texto). Relatório blob-orfaos-AAAAMMDD.md com contagens/tamanhos. APROVADO apagar só (c) e (d), com backup da lista e dry-run; nunca (a)/(b); se (c)+(d) > 50% do total, PARAR e mostrar números.
- 4.1: com vinheta em produção e trava B: subir ~277 áudios/capas em lotes de 50, amostra de 5 por lote. 4.3: 27 longos + 45 Shorts com crédito, sem marca d'água, assinatura, auditoria e tripla checagem.
- TÍTULO APROVADO: "Alta do PA Psiquiátrico: o que garante que o paciente não volte em crise" -> "Alta do PA Psiquiátrico: o que ajuda a reduzir o risco de nova crise" (título do artigo, meta title/og:title, post LinkedIn 25/11, qualquer post/vídeo/capa/legenda). MANTER slug. Regerar capa e, se narrado, o áudio.
- 5: simulação do primeiro post do LinkedIn; renovação do token; freio desligado; conferir PASSO-A-PASSO-LINKEDIN.md e fila manual.
- Conferência 19/10 (conferirPosRenovacao.js): incluir teste real da trava B (1º agendado de 19/10 08:00 Bahia toca com vinheta e URL do MP3 responde 200).
- Se push/merge bloquear: comandos separados, um por linha, com "!", sem "cd".
- Relatório final curto: tarefa 23:30; vinheta+narração noturna; órfãos por grupo; áudios/capas; YouTube; título; LinkedIn; conferência 19/10; comandos "!".


---
# ATUALIZAÇÃO 16/10/2026 (madrugada) — #79 mergeado
- P1 TRAVA B: áudios COM vinheta de todos os textos que publicam de 19 a 25/10 no Blob antes das 08h de 19/10 (ordem de data); conferir vinheta, URL/página bloqueada antes de publicar, hash; rodar conferirPosRenovacao.js em simulação para o texto de 19/10.
- P2 TÍTULO: regerar já a narração de "Alta do PA Psiquiátrico: o que ajuda a reduzir o risco de nova crise" com vinheta + capa nova no Blob (player não pode ficar sem áudio).
- Etapa 3: conferir plano Vercel/cota do Blob (informar); GET blob-narracoes?completo=1 -> relatorios/blob-orfaos-AAAAMMDD.md; DELETE dry-run; (c)+(d) até 50% => ?aplicar=1 (nunca a/b); >50% parar; inventário de novo + amostra de 10 (incl. 19/10).
- Etapa 4: 4.1 demais áudios/capas em lotes de 50 por data de publicação, amostra de 5; parar se Blob >90% da cota. 4.3 retomar 27 longos + 45 Shorts com crédito em canto livre; conferir 1 quadro inicial e 1 final por lote.
- ÉTICA: conferir no portal.cfm.org.br se a "Resolução CFM 2.454/2026" (IA) existe com esse número/ano e trata de IA; se sim, manter e gravar link em docs/; se NÃO, retirar o número em TODOS os lugares (site, Instagram, YouTube, LinkedIn, vídeos) e manter só "Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe."
- short-resumo: não apagar; colocar no .gitignore e confirmar que nenhuma fila usa.
- Relatório final curto: 19–25/10; título; Blob (plano, cota, antes/depois, a/b/c/d); áudios/capas; YouTube; Resolução CFM; comandos "!".
