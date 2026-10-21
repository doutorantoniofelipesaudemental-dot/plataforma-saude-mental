> **ALERTA: token do Instagram inválido (190); fila pausada até novo token.** Atualizado em 20/10/2026.
# PROMPT ATUAL (salvo em 16/10/2026 para sobreviver ao /clear)

## ESTADO REAL (19/10/2026, lote 2) — leia primeiro
- PR #114 MESCLADO (22:00 UTC). Horários do YouTube aplicados no Windows. Blob, LinkedIn-Agendar e Lembrete Disabled.
- Alerta: renovação do token da Meta recusada na conferência de 19/10 (ver PENDENTES.md).
- Lote 2 (branch feat/lote2-automacao-20261019): item 1 feito; item 2 PARADO (regras do Blob precisam de decisão); item 3 feito (PR semanal, tarefa criada desativada); item 4 sem trabalho (fila 60); item 5 feito; item 6 PARADO; item 7 NÃO apagado (data de teste não informada); item 8 não executado. Detalhes em PENDENTES.md.

## ESTADO REAL (19/10/2026, noite)
- PR #113 MESCLADO (21:02 UTC). Lote 1: correções já presentes na main; 387 testes passam.
- Blob mensal DESATIVADA (decisão C2). Código do Blob com condições (b) e (d) faltando: correção em ordem separada.
- Aplicar horários no Windows: só por ordem, depois de `-Simular`. Hoje YouTube Publica ainda tem gatilho 12:30, e DrSM-LinkedIn-Agendar não existe.
- Branch `docs/autonomia-classe1-20261019`: docs e CLAUDE.md alterados, sem commit até o portão leve.

## ESTADO REAL (19/10/2026, correções pós-plano)
1. PR #112 MESCLADO (19/10/2026, 14:37 UTC): horários do YouTube publica na main.
2. Branch `fix/agendador-estado-e-teto-20261019`: (A) agendador mantém tarefas pausadas; (B) teto do `claude -p` 3/dia e 15/semana (`scripts/consumoClaude.js`); (C) MCP ElevenLabs removido. Detalhes em ESTADO-GERAL.md e PENDENTES.md.
3. Nada aplicado no Windows nesta sessão (só `-Simular`). Aplicar horários só por ordem, depois do merge.

## ESTADO REAL (19/10/2026, pós-merge)
1. MESCLADOS: PR #111 (fix do CLS, 13:40 UTC) e PR #110 (Lote 1, 14:01 UTC). Portão aprovado nas duas etapas.
2. YouTube publica: novos horários (seg/ter/qua/sex/sáb 20:15; qui/dom 17:15). Só vale depois que `scripts/agendar-tarefas-windows.ps1` rodar de novo, por ordem do Dr. Antônio.
3. Pendências: RESEND_API_KEY; ativação do Blob (só por ordem); PR semanal sexta 11:00 (sem script); Lote 2 (autorizações b, d, f e testes do LinkedIn); CLS no PageSpeed em 2 ou 3 relatos.
4. O bloco "ESTADO REAL (19/10/2026, correções do lote 1)" abaixo está superado pelo de cima.

## ESTADO REAL (19/10/2026, correções do lote 1) — superado
1. Código do LinkedIn corrigido (linha `STATUS:` obrigatória), testes 8/8, `pausar.js --simular` e `alerta:teste` OK, `node --check` OK nos arquivos do lote. Nada commitado nem enviado.
2. Agenda de plantões aplicada no script do Windows (quinta e domingo: narração 14:00, YouTube gera 15:30) + trava diária + StartWhenAvailable. Lembrete manual LinkedIn desativado.
3. **Portão REPROVADO** (E2E: CLS 0.18 no `relato-aposta-tres-da-manha`, limite 0.1; falha pré-existente na base, ver ESTADO-GERAL). Merge bloqueado até decisão.
4. Pendente: PR semanal sexta 11:00 (sem script ainda). Comandos `!` para o Dr. Antônio: ver a resposta da sessão de 19/10.

## PENDÊNCIAS ao reabrir (18/10/2026, tarde) — leia primeiro
1. FEITO: trava v2, órfãs do Blob (0), landings /youtube e /instagram, bios e perfis (pelo Dr. Antônio), app Google em produção, YouTube reautorizado (registro `producao`).
2. **LinkedIn:** 10 agendados (até 20/11); limite diário atingido em 18/10. Próxima sessão: `rodar agendar-linkedin` a partir de **li-2026-11-25**; testar o carrossel PDF de 06/11 (se o agendador não aceitar, fica na fila manual). 33 abertos (27 posts + 6 carrosséis): ~6 a 7 sessões diárias.
3. **YouTube:** 109 aprovados, freio desligado. Decisão do Dr. Antônio: `relatorios/youtube/DECISAO-FREIO.md` (A ligar agora, B esperar a auditoria). Preencher os campos (PREENCHA) de `AUDITORIA-API-RESPOSTAS.md` (nome legal, endereço, telefone, prints, vídeo de tela). Apagar o vídeo de teste **z_JHmmpw880** no Studio (Dr. Antônio).
4. **Agenda das conferências (comandos):**
   - **19/10 depois das 9h:** "rodar conferência de 19/10" (skill `conferencia-19-10`: teste real da trava B e origem do token do Instagram "renovado"; cron renovar-token-instagram segunda 12:00 UTC).
   - **26/10 às 08:00:** 1º post do Instagram (2026-10-26-saude-mental-cuidador). **Depois das 9h:** "rodar conferência de 26/10" (skill `conferencia-26-10`).
   - **Toda segunda:** "rodar manutencao" (a rotina semanal roda sozinha às 07:30).
   - **LinkedIn diário até zerar a fila:** "rodar agendar-linkedin".
5. **Instagram (ordem de 18/10, automação total):** carrossel LIBERADO (validação 7/7 sem publicar). O PR da automação (publicador novo + conferência diária) precisa de `! npm run merge-seguro -- <N>` ANTES de 26/10 08:00. 26/10 08:00: 1º post sai sozinho pela Vercel (freio da Vercel ligado); 09:30: conferência diária confere imagens, legenda, link e ID da Meta (`relatorios/conferencias/2026-10-26.md`; alerta no topo do ESTADO-GERAL se falhar). Reels e Stories: não produzir por ora, reavaliar em ~18/11.
5. Melhorias propostas (sem implementar): `relatorios/PROPOSTAS-PARTE-E.md`.

## ATUALIZAÇÃO 17/10/2026 — autonomia com portão
Autorizado pelo Dr. Antônio: tudo o que for rotina roda sem pedir autorização, SEMPRE depois do `npm run portao` (auditoria + tripla checagem + build + unitários + e2e). Merge só por `npm run merge-seguro -- <PR>`; publicação só por crons/tarefas com checagem ou `npm run publicar-seguro`. Se o classificador bloquear, não contornar: passar o comando com "!". Sequência: (1) skills `youtube-reprovados` e `manutencao` [feito]; (2) branch `chore/portao-seguro` + PR; (3) portão completo + merge-seguro; (4) `rodar manutencao` (LinkedIn li-2026-11-11/13/16/18/20 + PDF de teste, 5 órfãs do Blob grupos c/d, 9 vídeos reprovados do YouTube, 3 narrações com EBUSY, "aguardando data").

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


---
# ATUALIZAÇÃO 17/10/2026 — #81 e #82 conferidos
1 Auditoria + unit sobre a main (regra vale p/ documentação). 2 Capas (475): verificação automática de TODAS (acentos, margem, assinatura, sem "psiquiatra", sem marca d'água, contraste, tamanho/formato) + mosaicos relatorios/capas-mosaico-N.png (24 por imagem; 1º com 12 antigas + 12 novas) + relatorios/capas-problemas.md. 3 YouTube: conferir CADA vídeo (quadro 1 s e final: crédito sem cobrir assinatura, assinatura legível, sem marca d'água, .srt, vinheta falada início/fim); embutir na tarefa DrSM-YouTube-Gera-Midia (reprovado -> relatorios/youtube/reprovados/); mosaico relatorios/youtube/mosaico-quadros.png. 4 Blob: teto 5 GB, aviso na rotina semanal a partir de 80%; uso atual e estimativa; varredura: URL de MP3/capa de texto AGENDADO não aparece em sitemap, RSS, API pública, categoria, busca, fila de redes ou HTML publicado. 5 Narração dos 194: rotina semanal conta (com vinheta/faltam); prioridade a textos dos próximos 7 dias. 6 Instagram 1º post 26/10 08:00: conferir fila (60) e simular (freio, token, horário). 7 Credenciais: estado por rede; PASSO-A-PASSO atualizado; topo do ESTADO-GERAL: "Para ligar YouTube e LinkedIn, siga os passos em ...". 8 docs/fonte-resolucao-cfm-2454-2026.md: link, data de acesso, nº e data do DOU; rotina semanal tenta ler o PDF de novo.


---
# ATUALIZAÇÃO 17/10/2026 — #83 conferido; decisões do Dr. Antônio
1. Título "a-carta-que-nunca-foi-enviada-ao-psiquiatra": MANTER. Registrar no CLAUDE.md: "'psiquiatra' é proibido apenas como título/identificação do Dr. Antônio Felipe; é permitido como nome da profissão no conteúdo." Ajustar a auditoria (proibido perto de 'Dr. Antônio', 'Antônio Felipe', 'sou', 'médico psiquiatra' na assinatura/bio; permitido no corpo e nos títulos dos textos). Aprovar a capa; manter a proibição de #psiquiatria.
2. Capas: regerar as 475 com o mesmo peso de fonte das antigas; repetir conferência completa; reenviar ao Blob; novo relatorios/capas-mosaico-1.png (antigas × novas).
3. Vídeos longos: na FALA só "Doutor Antônio Felipe, médico, CRM Bahia 41322, especialista em Medicina de Família e Comunidade, RQE 26638." (5 linhas continuam na TELA final e na DESCRIÇÃO). Regerar a fala de todos os longos (aprovados e da fila), refazer conferência e mosaico. Shorts: crédito curto só no fim; legenda queimada aceita no lugar do .srt.
4. YouTube: 4.1 freio YOUTUBE_PUBLICACAO_ATIVA (desligado por padrão, padrão do Instagram) + endpoint admin {publicacaoAtiva}. 4.2 PASSO-A-PASSO-YOUTUBE.md: chave secreta no Google Cloud, colar no .env com o Bloco de Notas (nome exato), "! npm run youtube:autorizar", o que aparece no navegador, como conferir. 4.3 Depois que o Dr. Antônio autorizar: 1 upload de teste PRIVADO e mostrar o link; só depois ele decide ligar o freio.
5. Instagram: confirmar cron de 19/10 12:00 UTC ativo e que a origem do token muda para "renovado" (entra na conferência de 19/10).


---
# ATUALIZAÇÃO 17/10/2026 (noite) — YouTube autorizado
1 token gravado (conferir só pelo tamanho); 2 npm run youtube:upload-teste (1 Short PRIVADO, freio desligado); 3 conferir pela API (privado, título com acentos, linha de crédito, assinatura, CVV/SAMU, sem "psiquiatra" como título, sem #psiquiatria) e mostrar o link; 4 gravar a data da autorização (16/10/2026) no ESTADO-GERAL e avisar na rotina semanal 2 dias antes do vencimento (7 dias), com o passo a passo; 5 PASSO-A-PASSO-YOUTUBE: seção "Publicar o app (para a autorização não vencer)" (Branding sem logo, página inicial, /privacidade, domínio autorizado, e-mail do desenvolvedor; Público-alvo → Publicar app; autorizar de novo); 6 relatorios/youtube/AUDITORIA-API-RESPOSTAS.md (PT e EN, formulário, link e passo a passo); 7 manter YOUTUBE_PUBLICACAO_ATIVA DESLIGADO.


---
# ATUALIZAÇÃO 17/10/2026 (noite) — PR #85 conferido; decisões
1 Política de privacidade: seção curta "Uso da API do YouTube" (APROVADA) em public/privacidade e na /privacidade do app Next (Portal usa a API só para publicar/organizar os vídeos do próprio canal; não coleta/armazena/compartilha dados de visitantes nem de usuários do YouTube; links: Termos do YouTube https://www.youtube.com/t/terms, Política do Google https://policies.google.com/privacy; revogar: https://myaccount.google.com/permissions; atualizar "Última atualização"); não mudar o resto; registrar em relatorios/politica-privacidade-aprovada.md; deploy e conferir no ar.
2 Freios LOCAL × VERCEL: tabela no ESTADO-GERAL.md e em SE-ALGO-DER-ERRADO.md (Instagram=Vercel; YouTube, LinkedIn, narração=tarefas do Windows/.env local; como ligar/desligar). NÃO alterar freio; não repetir sobrescrita sem ordem.
3 AUDITORIA-API-RESPOSTAS.md: topo com "O que o Dr. Antônio preenche" e onde achar cada item; não inventar dados pessoais.
4 Vídeo de teste z_JHmmpw880: não apagar; registrar como "teste" (fora de relatórios e fila).
5 LinkedIn sem credencial: 5.1 PASSO-A-PASSO completo (Página, app, verificar, Share on LinkedIn + Sign In with LinkedIn using OpenID Connect, URL de redirecionamento exata, nome exato das variáveis, comando "!"); 5.2 npm run linkedin:autorizar (padrão do YouTube) e freio LINKEDIN_PUBLICACAO_ATIVA desligado; 5.3 linha na /privacidade só se a política do LinkedIn exigir.
6 Conferências: 19/10 (trava B + token Instagram) e 26/10 (1º post) prontas e com aviso de vencimento da autorização do YouTube (23/10); narração noturna gerando os 194 por data — informar quantos faltam.


---
# ATUALIZAÇÃO 17/10/2026 (madrugada) — #86 e #87 conferidos
1 Auditoria + unit na main (regra vale p/ documentação). 2 Narração noturna resistente a interrupções: 2.1 investigar a interrupção das 22:00 (Ctrl+C): Agendador (histórico, última execução) e log; 2.2 TODAS as tarefas DrSM-*: rodar ocultas, acordar o PC, executar assim que possível se perdida, reiniciar a cada 10 min até 3x se falhar, limite de execução adequado (6 h narração), sem administrador (se algo exigir admin: comando exato com "!"); 2.3 ENVIO INCREMENTAL (a cada áudio conferido ou lote de 10; ao recomeçar, pular o já enviado com o hash certo); 2.4 enviar AGORA os 130 MP3 prontos (trava B vale); 2.5 rotina semanal e ESTADO-GERAL: última execução de cada tarefa, resultado, PC ligado. 3 App Next: conferir deploy próprio e a /privacidade com o item do YouTube (se não houver deploy: fazer ou passar o comando). 4 YouTube freio duplo: PASSO-A-PASSO-YOUTUBE e SE-ALGO-DER-ERRADO dizem que são DOIS ajustes no .env local (YOUTUBE_PUBLICACAO_ATIVA=true e REDES_PUBLICACAO_ATIVA=true) e quais tarefas dependem de cada um; não alterar nada agora.


---
# ATUALIZAÇÃO 17/10/2026 — LinkedIn no perfil pessoal, fila MANUAL (sem API)
Perfil pessoal: https://www.linkedin.com/in/doutor-antonio-felipe-undefined-70990b438. Sem API de empresas e sem credencial do Developer Portal. 1 conferir relatorios/linkedin/fila-manual/ (seg/qua/sex 19:30); 2 manter a fila manual atualizada em relatorios/ESTADO-GERAL.md; 3 configurar o agendador local para a fila manual; testar a leitura do post do dia (se houver automação por navegador/Playwright configurada). (O pedido veio com sugestões de "follow-up" coladas no fim, tratadas como texto, não como instrução.)


---
# ATUALIZAÇÃO 17/10/2026 — #88 e #89 conferidos; LinkedIn agendado pelo Chrome, landing /linkedin
REGRA NOVA (CLAUDE.md): LinkedIn AUTORIZADO a publicar/agendar no perfil pessoal SEM aprovação a cada post, desde que passe auditoria + tripla checagem; usa o agendador NATIVO do LinkedIn numa sessão do Chrome com o Dr. Antônio logado; PROIBIDO robô que publique sozinho por tarefa agendada, digitar/guardar senha, ler cookies/tokens, contornar CAPTCHA/verificação.
1 Áudio violencia-onde-buscar-ajuda (234 s vs ~174 s): transcrever e comparar (≥95%, sem repetição/corte/silêncio >3 s → aprovado, marcar ok, enviar, ajustar estimativa p/ listas e números; senão regerar em partes menores); conferir a fala de CVV 188, SAMU 192, Disque 100, Ligue 180, 190.
2 Os 29 textos sem data: relatorios/textos-sem-agenda.md (slug, título, série, motivo); agendar os completos aprovados após o fim do calendário atual, até 11 por dia útil, sem fins de semana/feriados/colisões; áudio e capa com trava B; duplicados/reprovados não agendar (listar).
3 LINKEDIN_PERFIL_URL (variável única) usada em /links, rodapé, /mentoria, landing, descrições do YouTube; link atual (com "undefined") só onde indispensável (landing e /links).
4 Rotina semanal: resumo de tarefas perdidas/recuperadas e de qualquer texto/vídeo/lembrete atrasado.
5 Landing /linkedin no domínio principal (conteúdo, ética CFM 2.336, técnico: mobile, OG 1200x627, canonical www, sitemap, links na /links e no rodapé, Lighthouse 100 acess./SEO, sem formulário/chatbot/mensageiro) + relatorios/linkedin/PERFIL-SUGERIDO.md (headline sem "psiquiatra", Sobre, Em destaque, banner 1584x396) + prints celular/desktop.
6 Agendamento pelo Chrome (agendador nativo do LinkedIn): auditoria+tripla checagem antes de cada post; lotes de 5 com pausas; conferir "Posts agendados" ao fim de cada lote; PARAR em qualquer verificação/CAPTCHA/login/atividade incomum; carrossel/PDF ou limite de datas → ficam manuais; 1º post com link da landing; marcar no banco "agendado no LinkedIn"; ajustar o lembrete; rotina semanal lembra de conferir "Posts agendados".


---
# ATUALIZAÇÃO 17/10/2026 — #90 e #91 conferidos; Dr. Antônio logado no LinkedIn na janela controlada
ORDEM: primeiro 4 (conferir os 5 primeiros posts) e 5 (agendar no LinkedIn), depois 1, 2 e 3.
1 7 textos parados: corrigir com backup e fonte verificada (link/PMID/DOI), listar antes/depois: 1.1 haloperidol = antipsicótico típico de ALTA potência (conferir o parágrafo); 1.2 "país que mais faz cirurgias plásticas": conferir a pesquisa global mais recente da ISAPS (escrever exatamente o que diz, com o ano; se não confirmar: "um dos países que mais realizam cirurgias plásticas no mundo"); 1.3 litemia (bipolar): faixas de manutenção, fase aguda e limite de toxicidade conforme diretriz atual (CANMAT/ISBD 2018, NICE CG185) citadas, sem inventar; 1.4 relato do namorado: caixa de apoio com Ligue 180, 190 e CVV 188 (Disque 100 só se houver criança/adolescente/idoso); 1.5 demais correções da revisão com antes/depois; 1.6 depois da auditoria + tripla checagem, agendar os 7 no próximo dia útil livre após 21/12/2026, mesmo ritmo, áudio (regerar se mudou) e capa.
2 Aviso de protocolos locais no TEMPLATE dos artigos clínicos (manejo, urgência, medicação, protocolos), uma vez perto do fim; não em relatos nem textos leigos; remover duplicação do corpo; hash da narração não muda; também no app Next; informar quantas páginas.
3 Varredura científica dos 726 textos (potência de antipsicóticos; doses/faixas de lítio, valproato, antidepressivos, benzodiazepínicos; rankings "o país que mais…"; caixas de apoio ausentes em violência) -> relatorios/varredura-cientifica-AAAAMMDD.md; corrigir sozinho só erro factual inequívoco com fonte; o que muda sentido clínico vai para aprovação; conferir posts de LinkedIn/Instagram/YouTube que citem texto corrigido.
4 Conferir os 5 primeiros posts (auditoria + tripla checagem, link do site no ar na data, 1º com link da landing).
5 Agendar pelo Chrome (logado): confirmar pela tela que é o perfil pessoal (sem cookies/tokens); agendador NATIVO sem aprovação por post; texto, imagem, ícone de relógio, data e 19:30 (Bahia), confirmar; lotes de 5 com pausas; ao fim de cada lote abrir "Posts agendados" e conferir; PARAR em verificação/CAPTCHA/login/atividade incomum; carrossel/PDF: tentar 1, se não der ficam manuais; limite de data do LinkedIn: agendar até o limite; marcar no banco "agendado no LinkedIn"; ajustar DrSM-LinkedIn-Lembrete; atualizar FILA-MANUAL.md e ESTADO-GERAL.md; perfil persistente do Chrome só para o LinkedIn do Portal.


---
## Prompt de 17/10/2026 (rodada 2): commit pendente, correções aprovadas dos 7 textos, aviso de protocolos, varredura científica, skill agendar-linkedin
Itens: 0 commit; 1.1 haloperidol; 1.2 ISAPS (ano exato); 1.3 lítio só com texto literal (CANMAT 2018 + Nolen 2019 ISBD/IGSLi) ou sem números; 1.4 caixa 180/190/188; 1.5 demais; 1.6 regerar narração (player oculto/pendente) e agendar após 21/12/2026; 2 aviso no template (+Next); 3 varredura dos 726; 4 skill agendar-linkedin (sem tarefa agendada), rotina mostra faltantes e aviso <14 dias, carrossel teste, perfil undefined.

---
## Prompt de 17/10/2026 (rodada 3): merges #92/#93, decisões dos textos pendentes, caixa de violência, link do LinkedIn
1 Regra de merge: #92 (e2e 31/31, auditoria 0 falhas, build, 261 unitários) MERGED; #93 com e2e 31/31, build, 267 unitários e auditoria 0 falhas antes do merge. Depois: deploy, conferência em produção (clínico com aviso, não clínico sem, /linkedin, home) e rollback documentado.
2.1 Catatonia sem doses de lorazepam (BAP, PMID 37039129: benzodiazepínico e/ou ECT como 1ª linha; catatonia maligna "ameaça a vida"); 2.2 telas sem dopamina/luz azul; 2.3 abandono: Dewa 2009 trocada por Loots 2021 (PMID 34639510); 2.4 cirurgia: título novo (slug mantido), ISAPS 2025 ("1º em cirúrgicos, 2º no total"), capa nova no Blob e áudios regerados; 2.5 caixa 180/190/Disque 100/CVV 188/SAMU 192 no template (backend/lib/caixaViolencia.js + app Next + navegador): 34 páginas.
3 LinkedIn: `LINKEDIN_PERFIL_URL` = https://www.linkedin.com/in/doutor-ant%C3%B4nio-felipe-70990b438 (config/marca.json; `npm run marca:aplicar`). Rotina: "rodar agendar-linkedin" 1x/dia. Próxima sessão: testar agendar 1 carrossel em PDF.

---
## Prompt de 18/10/2026 (rodada 4): #94, citação da catatonia, sessão LinkedIn, YouTube, preparo de 19/10
1 #94 mergeado. 2 Catatonia: citação Apetauerova 2021 (PMID 33896535: malignant catatonia entre emergências com risco de vida; "many of these conditions require admission to the neurologic intensive care unit"); narração regerada (ok). 3 LinkedIn: logado (conferido pela tela); perfil novo abre com "Doutor Antônio Felipe"; agendamento do lote de 5 (li-2026-11-11, 13, 16, 18, 20) BLOQUEADO pelo classificador de permissões do Claude Code (evaluate_script e take_snapshot do chrome-devtools): nada agendado hoje; teste do PDF não feito. Para liberar: regra de permissão para mcp__chrome-devtools__evaluate_script/take_snapshot nas settings, ou agendar à mão. 4 YouTube: app "Testando", autorização vence em 23/10 (passos a-d no relatório). 5 Tarefas noturnas OK; rotina semanal rodada (relatorios/rotina-20261017.md).

---
## ESTADO REAL 18/10/2026 (conferido em `linkedin:fila` e na tela do LinkedIn)
- LinkedIn: **10 posts agendados** (até 20/11; contador "Agendamento realizado (10)" na tela). 33 abertos; próximos: 06/11 (carrossel PDF), 23/11 (carrossel), 25/11, 27/11, 30/11, 02/12, 04/12.
- 18/10: tentativa do li-2026-11-25 barrada por "Você atingiu o limite de publicações de hoje" (limite diário do LinkedIn, normal). Rascunho descartado, nada agendado, nada marcado. Teste do PDF (06/11) NÃO feito (mesmo limite). Retomar em outro dia: `rodar agendar-linkedin` (começa em li-2026-11-25).
- Carta de autonomia gravada no CLAUDE.md. Trava v2 ativa; `mcp__chrome-devtools` no allow.
- YouTube (18/10): portão aprovado (relatorios/portao-20261018-0014.md; e2e 31/31, 307 unit.). `youtube:fila --aplicar --gerar` gerou a mídia dos 34 itens que faltavam, mas **os 34 reprovaram** no conferidor por uma única regra: `scripts/youtube/lib.js` (~l.246) não aceita o link do perfil do LinkedIn (`LINKEDIN_PERFIL_URL`, config/marca.json, agora personalizado) que está nas descrições. Fila: 75 aprovado-checagem · 34 reprovado · 0 sem mídia · 0 publicado. A correção (aceitar só `u.startsWith(LINKEDIN_PERFIL_URL)`) foi BLOQUEADA pelo classificador ("Security Test Removal"); não contornada. Pendente: decisão do Dr. Antônio (liberar o ajuste ou tirar o link das descrições), depois `youtube:fila --aplicar` e conferir. Freio do YouTube continua desligado; nada publicado.
- **ATUALIZAÇÃO (18/10, conferidor liberado por decisão do Dr. Antônio):** `scripts/youtube/lib.js` aceita o link EXATO de `LINKEDIN_PERFIL_URL`/`LINKEDIN_LANDING_URL` (config/marca.json), com ou sem "ô" codificado; qualquer outro link externo segue reprovado (3 testes em `tests/unit/conferidor-links-oficiais.test.js`). `montarFila.js` reconfere o texto com a regra atual. 9 vídeos reprovavam por cache velho de conferência (regex "Bahia" antiga): cache apagado e reconferido. **YouTube: 109 aprovado-checagem · 0 reprovado · 0 sem mídia · 0 publicado.** Freio desligado. Autorização do Google vence em 23/10.
- LinkedIn: próxima sessão `rodar agendar-linkedin` a partir de li-2026-11-25 e testar o carrossel PDF de 06/11.

- **18/10 (landings):** PRs #101, #102 e #103 mesclados. /youtube e /instagram no ar, 100 no Lighthouse. Falta o Dr. Antônio colar as bios (`relatorios/redes/BIO-SUGERIDAS.md`). Pendentes: conferência 19/10 (token Instagram), YouTube reautorizar até 22/10, LinkedIn `agendar-linkedin` a partir de li-2026-11-25 + PDF 06/11, 1º post Instagram 26/10.

- **18/10 (manuais concluídos, informado pelo Dr. Antônio):** bios (Instagram, YouTube, LinkedIn) e app Google em "Em produção" feitos. Falta `! npm run youtube:autorizar` (Dr. Antônio) e conferir o token (tamanho, sem imprimir). Conferência 19/10 (token Instagram) e 1º post 26/10 seguem. LinkedIn: `agendar-linkedin` a partir de li-2026-11-25 + PDF 06/11.
- **18/10 (reautorização feita):** `youtube:autorizar` concluído; token conferido (103 caracteres, canal HTTP 200); 322 testes unitários OK. Bios, links e app Google 100% concluídos. O aviso de vencimento em 23/10 não vale mais (app em produção). Freio do YouTube desligado.
- **18/10, 14h:** narrações 726/726 com vinheta; `DrSM-Conferencia-Diaria` registrada (09:30, S4U, oculta); conferência de hoje: 0 falhas. LinkedIn: sem novos agendamentos (limite diário), retomar a partir de li-2026-11-25.

## Estado em 18/10/2026 (ordem "versão enxuta + Ollama")
- Fases 0, 1, 4 e 5 feitas: `relatorios/VERIFICACOES.md`, `relatorios/MAPA-AUTOMACAO.md`, `relatorios/checagens/2026-10-18.md`, `relatorios/PENDENTES.md`. CLAUDE.md ganhou "O que continua sendo do Dr. Antônio", "Modo economia" e "Uso do Ollama".
- Nada publicado, nenhuma tarefa agendada criada, nenhum freio alterado. Merge só pelo Dr. Antônio via `npm run merge-seguro -- <PR>`.
- Próximo passo exato: o Dr. Antônio revisa o PR da Fase 5 e roda o merge-seguro; depois da renovação da cota, ver `relatorios/PENDENTES.md`.

## Lote 1 (18/10/2026): estado real
- Branch `feat/automacao-lote1-20261018` (a partir da main com o PR #109 mesclado). Itens 1, 2 e 3 commitados e testados; item 4 não criado (conflito de regra).
- Portão: **não passou** (e2e 26 passed / 5 failed, localhost:3000 recusado). Não fazer merge até corrigir. Relatório: relatorios/checagens/2026-10-18-lote1.md.
- Próximo passo exato: rodar `npm run test:e2e` com o servidor local no ar; corrigir os 5 testes; então `npm run portao` e entregar os comandos `!` de push/PR/merge-seguro.

## Lote 1, fechamento (18/10/2026)
- Portão APROVADO (relatorios/portao-20261018-1808.md): auditoria 0 falhas, build OK, unitários OK, e2e 31/31.
- Regra do LinkedIn trocada por ordem escrita (CLAUDE.md, seção LinkedIn). Tarefa DrSM-LinkedIn-Agendar ainda NÃO criada: falta o comando `!`.
- Próximo passo exato: rodar o comando `!` de criação da tarefa LinkedIn (ver resposta), depois `npm run merge-seguro -- <PR>` pelo Dr. Antônio.

## Instagram — pós-merge PR #120 (20/10/2026)
- Merge feito, deploy Ready. ID da conta gravado (Vercel e .env). Renovação semanal pelo cron de segunda 12:00 UTC (26/10); a conferência de 26/10 confere renovadoEm/expiraEm.
- Diagnóstico diário 23:00 UTC; primeira execução real 25/10 às 20:00.
- Próximo passo: ordem do Dr. Antônio sobre a limpeza da árvore de trabalho (PR próprio para mudanças reais; .gitignore para gerados).

## Limpeza da árvore (20/10/2026)
- Branch chore/limpeza-gerados-20261020: 68 gerados saem do índice (no disco), .gitignore atualizado, ZIPs em arquivo/. Portão APROVADO (relatorios/portao-20261020-0634.md).
- Pendente: decidir sobre as pastas novas de fila-manual e aprovar a normalização de fim de linha (PR separado).

## Pós-limpeza (20/10/2026)
- PR de fim de linha (.gitattributes): aguardando push/PR/merge do Dr. Antônio.
- PR de backup do estado + fila manual + ZIPs: portão e merge pendentes.
- Aguardando ordem: (a) 11 reprovados da fila manual (cap.ass em 9 Shorts; encerramento falado em 2 longos); (b) importar os 24 textos novos do referencias-140-prontas; (c) descartar ou manter o importacao-extra-180 (recomendação: manter arquivado).

## Decisões de 20/10/2026 (fim de sessão)
- Trava de duplicidade no LinkedIn e no YouTube: PR em fix/trava-duplicidade-agendadores-20261020. Portão aprovado (relatorios/portao-20261020-0733.md).
- Aguardando o Dr. Antônio: (a) método de regeração dos 11 reprovados (gerador direto ou lote noturno); (b) decisões dos 24 textos novos: ferramentas interativas e <script>, identificação e aviso no corpo, e os 7 textos com menos de 4 DOIs.
- Tarefa DrSM-LinkedIn-Agendar: desativada; reativar só depois de reconciliar e revisar o trabalho desta semana.

## Decisões de 20/10/2026 — execução
- LinkedIn: agendamento manual bloqueado pelo classificador; nada agendado. Tarefa desativada até nova ordem.
- Fila manual do YouTube: 7 reprovados enfileirados para a regeração noturna (55 na lista).
- Textos do ZIP referencias-140-prontas: TODOS já existem no site (artigos e blog). Nada importado. Decidir se o ZIP é atualização de referências (aplicar-referencias).

## Carta de autonomia v3 (20/10/2026)
- Feito: existeConteudo.js, ZIP classificado (C=24), árvore limpa parcial, resumo do dia com 'PRECISA DO DR. ANTÔNIO', docs da carta, lições e mapa.
- Pendente: permissões headless (item 1), causa dos 7 aprovados sem conferidor (item 3), manutenção semanal (item 5, precisa de criação de tarefa por você).

## Item 1 — 20/10/2026
- Feito: .env carregado dentro do script; atalhos npm; checagem de permissões. Pendente: teste headless real e decisão sobre a manutenção semanal (docs/manutencao-semanal.md).
## Item 2 — 20/10/2026
- Fonte única ligada à criação de texto novo (ingestaoRascunhos e importarTudo). Pendente: teste real de importarTudo num lote de teste, com backup.
## Item 3 — 20/10/2026
- Feito: status da fila só pelo conferidor; checagem cruzada na conferência diária; 7 itens revertidos.
- Pendente: a exportação da fila manual deve incluir cap.ass e credito.ass, para o conferidor não reprovar por falta de arquivo (decisão de exportação).

## Carta v3 — 20/10/2026 (noite)
- LinkedIn: 1 post agendado hoje (li-2026-11-25); total 11 (até 25/11). Tarefa desativada.
- PRs #131 e #132 abertos: merge é seu (merge-seguro).
- Decidir: 54 itens reprovados com conferência ok; settings.json (Write→Edit); ativar tarefas.

## Ordem unificada (20/10/2026, noite)
- LinkedIn: lote em uma chamada (até 3 posts), trava no banco, reserva de 1 chamada ao LinkedIn. Próxima execução: 11:00 de amanhã. Conferir o painel (deve bater com 11 até 25/11).
- YouTube: 45 aprovados em nova fila (01/02 a 21/03/2027); 9 em regeração (link externo na descrição). Decidir sobre a regra de links oficiais.
- Permissões: rodar docs/permissoes-headless/aplicar.js --aplicar no PowerShell.
- Pendências: teste do PDF dos carrosséis; a checagem do painel do LinkedIn.

## Rodada de 21/10/2026 (revisão médica)
- Aprovar o aviso (npm run aviso:aprovar), depois que ele for lido.
- Escolher textos para revisão e aprovar com npm run revisao:aprovar -- <slug>.
- Conferir o preview do PR #138 logado e autorizar o merge só depois.
- Legendas: reautorização OAuth no PC e aprovação do padrão de legenda (ainda não preparadas).

## Estratégia de crescimento (20/10/2026)
- Decidir: OK para instalar Piper e gerar 3 amostras; autorização do Search Console (passo a passo em SEARCH-CONSOLE-PASSO-A-PASSO.md); OK para corrigir o canonical dos 24 MDX; comentários (proposta em COMENTARIOS-PROPOSTA.md).
- PR #134 em conflito: resolver os 3 arquivos de status (manter os dois blocos) e rodar o portão de novo.
