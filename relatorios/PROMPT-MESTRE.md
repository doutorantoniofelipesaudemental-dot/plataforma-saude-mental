# PROMPT-MESTRE — Claude Code + agentes (vigente a partir de 27/11/2026)
Substitui TODOS os prompts anteriores. Os anteriores (UNICO, CASCATA, FERRAMENTAS, APRIMORAMENTO, MONTAGEM-DEZEMBRO, ESTEIRA-OFFLINE) viram referência: o que estiver pendente neles está consolidado aqui.
Guarde este arquivo como relatorios/PROMPT-MESTRE.md e, em PR, acrescente ao CLAUDE.md a linha: "Ordem de trabalho vigente: relatorios/PROMPT-MESTRE.md".

## 0. PAPÉIS (decisão do Dr., 27/11)
- **Claude Code + agentes:** TODA a fábrica de ativos e TODA a produção audiovisual, de ponta a ponta: pauta → roteiro → cenas no Higgsfield → conferência → montagem → portão de engajamento → revisor-ético → pacote → calendário. O Claude do chat NÃO gera mais cenas.
- **Claude do chat:** dá instruções, confere se tudo segue o plano, corrige erros e resolve problemas. Lê o relatorios/HANDOFF-CHAT.md e o PAINEL-DIARIO que o Dr. cola.
- **Dr.:** assiste, aprova a publicação, faz os merges, faz os logins e exporta as métricas.

## 1. REGRAS FIXAS
- **Nada é publicado** nem entra na fila sem o OK do Dr. Fila, banco, Blob, freios e Vercel pertencem ao Dr.
- **Git:** merge só pelo Dr. (npm run merge-seguro -- N). Branch + PR + portão. Sem push na main nem force push.
- **Comandos proibidos:** rm, del, Remove-Item, reset --hard, checkout --, restore . — para tirar arquivo do lugar, use Move-Item para .tmp\backup-<data>\.
- **Worktree** só para mudança de código, em pasta nova; node_modules só por robocopy.
- **Sigilo:** nunca ler nem imprimir .env, tokens ou kaggle.json.
- **Comandos para o Dr.:** uma linha por vez, sem "&&" (PowerShell 5.1).
- **Áudio:** voz Kokoro pf_dora (masculina pm_alex). Trilha FluidSynth (FERRAMENTAS-AUDIO.md). -14 LUFS (vídeo/Reels/LinkedIn), -16 LUFS (Spotify), TP <= -2 dBTP.
- **Cartão final:** identificação de 5 linhas (lida do conformidadeCfm.js) + "Em crise: CVV 188 · SAMU 192" + "Conteúdo produzido com apoio de Inteligência Artificial." + "Fonte: Portal de Saúde Mental Doutor Antônio Felipe Garabito · drantoniofelipemedico.com.br".
- **Proibido nos conteúdos:** "psiquiatra" (para o Dr.), "sintético", "cura", promessa de resultado, consulta, agendamento, telemedicina, consultório, NR-15 para calor a céu aberto (o certo é NR-9 Anexo III + NR-1), clickbait.
- **Conteúdo:** PMID ou norma oficial em toda afirmação clínica. Sem violência. Crianças só em cenas protegidas. Profissionais de saúde de costas ou por cima do ombro. Relatos só com personagens compostos. Comunicação segura sobre suicídio (sem método, sem detalhe de circunstância).
- **Estilo visual:** 3D animado acolhedor da série, nunca desenho plano. Nenhum texto gerado dentro de imagem: títulos e selos são compostos localmente.
- **YouTube:** caixa "conteúdo alterado" desmarcada (animação); a frase de IA vai no vídeo e na descrição.

## 2. DISCIPLINA DE SESSÃO
- **NÃO encerre o turno.** Ao terminar uma tarefa, passe imediatamente para a próxima da fila da Seção 9. Sem resumos no meio.
- **Contexto:** se passar de 150 mil tokens, use /compact e continue.
- **Parada:** pare de começar tarefas novas 15 min antes do horário de parada (padrão 22:15, salvo outro horário informado na abertura). PARADA SEGURA = PAINEL-DIARIO + ESTADO-GERAL + HANDOFF-CHAT atualizados, sem processo rodando.
- **Pendências do Dr.:** o que depende dele vai para a lista final (no máximo 7 itens, numerados, com o comando ou clique exato) e não trava o resto.
- **Agentes:** um por vez. Retorno de no máximo 15 linhas. Passagem de bastão por arquivos numerados (01-evidencias … 10-pacote).

## 3. FÁBRICA DE ATIVOS NO HIGGSFIELD (pelo conector MCP do Claude Code)
**Plano:** Ultra, 3.000 créditos/mês (renova ~27/12; o Dr. decide em 20/12 se cancela). Os créditos são 100% para a produção audiovisual; capas NUNCA usam crédito.

**Teto e prioridade** (até 1.000 créditos/semana):
1. Cenas com diálogo da família e do elenco para as peças do lançamento.
2. Ganchos dos 3 primeiros segundos.
3. Cenas de série (minisséries, Relatos em 3 capítulos).
4. B-roll genérico, só se faltar no banco (assets/cartoon-higgsfield/, 212 clipes).

**Parâmetros:**
- Modelo: seedance_2_5, resolução 720p, duração 5 s (10 s só quando a fala exigir).
- Formato: 9:16 para Shorts/Reels/LinkedIn; 16:9 para YouTube longo e Spotify.
- Use use_unlim: false (o teste grátis acabou).
- Antes de cada lote: estime o custo (estimate_video_cost) e registre em relatorios/CUSTOS-HIGGSFIELD.md.
- Diálogo: mode "omni_reference", medias [{role: "image_references", value: <job_id da referência>}], generate_audio: true. A fala vai no prompt, em português, entre aspas, com "Clear lip-sync". Números escritos por extenso.
- B-roll: mode "t2v", generate_audio: false, sem rosto.

**Referências (job_id):**
| Referência | job_id |
|---|---|
| Família (Clara, Rafael, Davi, Bia, Vó Zezé, Pipoca, Nina) | 879d0b5c-0c27-4415-9463-abef5ff21008 |
| Família estendida (Tio Jorge, Tia Lúcia, Mariana, Pedro, Tia Rosa) | c63b4256-8c5c-4d75-88bc-ae0ff08e5e01 |
| Amigos e trabalho (Marcos, Toninho, Jean, Dona Celeste, Kaique) | 0b428759-5823-4838-9b6c-f9919613b3ae |
| Figurino trabalho/escola | 16a386f1-5877-4dfc-b770-d946f28b875a |
| Figurino dormir | 608ca01f-439c-4de6-92c7-578a8956f6b5 |
| Figurino casa/fim de semana | 88986c2a-e48b-466d-a9a2-394b756bb6f4 |
| Médico da UBS | c9442a59-ae98-47ef-9a35-732f5f39b497 |
| Seu Raimundo + Lívia | 141875ee-48ca-49a9-8997-9c2291e3a2a5 |
| Sala de escuta da UBS (cena) | 4f39ae85-5b3f-48c3-8c03-e36c05a17404 |

Use a referência do figurino da situação: noite no quarto = dormir; obra = trabalho; escola = uniforme.

**Operação:**
- No máximo 8 jobs simultâneos. Pedido por arquivo JSON e jobs_wait.
- Baixe cada clipe e confira: Whisper na fala, quadro-chave contra a continuidade e a ficha. Se falhar, regenere até 2 vezes; depois aplique o plano B (infográfico + narração).
- Falso positivo de "nsfw": reescreva de forma neutra. Evite "bed", "yoga", "pills", close de criança triste e menor em cena de tensão.
- Registre tudo em producao-audiovisual/episodios/<slug>/07-cenas.md e no banco (INDICE.csv).

## 4. EQUIPE (15 agentes)
Os 13 originais + 13-analista-de-crescimento + 14-capista-e-titulos (já criados). Modelo por função (opus: showrunner, consultor-científico, roteirista, revisor-ético; sonnet: os de execução; haiku: os mecânicos).
- **Roteirista:** gancho em 3 s, uma ideia, emoção e identificação, utilidade prática, CTA único "Leia o artigo completo no Portal" + convite para seguir.
- **Montador:** corte ou movimento a cada 3–5 s, legenda grande, telas finais do YouTube.
- **Distribuição:** legenda nativa por rede (YouTube, Shorts, Instagram, LinkedIn, Spotify), UTM, playlists, Short → vídeo longo.
- **Revisor-ético:** dois portões (roteiro e corte final) e veta sensacionalismo.
- **Analista:** lê dados-metricas/ toda segunda e gera CRESCIMENTO-SEMANA.md.

## 5. PORTÃO DE ENGAJAMENTO (decisão do Dr.: só sai o que pode viralizar e engajar)
Nota de 0 a 10, e TODOS os itens precisam de nota ≥ 8 para a peça ir à fila:
1. gancho em 3 s;
2. uma ideia clara;
3. emoção e identificação;
4. utilidade prática;
5. ritmo de 3–5 s;
6. legenda e som;
7. título e thumbnail curiosos e éticos;
8. convite final;
9. formato nativo da rede.

Abaixo de 8, a peça volta com o motivo. Registre em relatorios/PORTAO-ENGAJAMENTO.csv.

## 6. LANÇAMENTO E CALENDÁRIO
- **Redes:** YouTube (longo + Shorts), Instagram, LinkedIn (REATIVADO, mesmas produções), Spotify (capítulos/videocast). O Facebook é só ponte.
- **Quando lançar:** em todas as redes ao mesmo tempo, quando houver ESTOQUE ≥ 14 peças aprovadas no portão.
- **Cadência a partir do lançamento:**
  - YouTube: 3 vídeos longos/semana + 1 Short/dia;
  - Instagram: 1 Reel/dia + 2 carrosséis/semana;
  - LinkedIn: 1 vídeo ou carrossel por dia útil;
  - Spotify: 2 episódios/semana.
- **Uploads da fila:** seg/ter/qua/sex; 24, 25 e 31/12 vazios (regra da fila).
- **Plano de lançamento:** relatorios/PLANO-LANCAMENTO.md (data, peças, ordem — abrir com as 3 de maior nota —, horários, legendas, rotina de responder comentários na 1ª hora).

## 7. PORTAL
- Inventário de capas antigas (CAPAS-INVENTARIO.csv) e troca, só por quadros dos vídeos e imagens do elenco, com título composto localmente e alt text.
- Landing "Onde me acompanhar" e páginas de eixo no padrão visual novo.
- Tudo em PR, com capturas antes/depois. URLs e SEO mantidos.

## 8. MONETIZAÇÃO
Mantenha relatorios/MONETIZACAO-METAS.md com os critérios oficiais datados:
- **YouTube:** 500 inscritos + 3 envios + 3.000 h ou 3 milhões de views de Shorts; completa: 1.000 inscritos + 4.000 h ou 10 milhões de Shorts. A partir de 01/02/2027: 8.000 h ou 20 milhões de Shorts.
- **Spotify Partner Program:** Spotify for Creators, endereço no Brasil, ≥ 3 episódios e o limite de horas do painel.
- **Instagram:** presentes, assinaturas, parcerias.
- **LinkedIn:** consultoria, palestras, Kit NR-1.

Projeção semanal honesta com os números reais (dados-metricas/). Meta: entrar no YouTube antes de 01/02/2027.
Proibido: comprar seguidores ou views, sorteio por inscrição, clickbait, conteúdo em massa sem autoria.

## 9. FILA DE TRABALHO (siga na ordem e pule o que estiver feito; confira no ESTADO-GERAL)
1. **Merges recusados (#332, #333, #334):**
   - para cada PR, rode a conferência do merge-seguro e liste os motivos;
   - #332: leve para a branch as versões NOVAS dos agentes, da skill, da BIBLIA e da serie-biblia (as da pasta principal); commit, portão, push;
   - mova (Move-Item) as cópias não rastreadas para .tmp\backup-pre-merge-332-<data>\, conferindo o hash;
   - mesmo raciocínio para #333 e #334;
   - deixe os 3 comandos de merge verificados para o Dr.
2. **Banco:** baixe o BANCO-BROLL-200-20261127.md (172 clipes) para assets/cartoon-higgsfield/<eixo>/cenarios/ e atualize o INDICE.csv (descrição por quadro-chave).
3. **Episódios de dezembro:** monte os 5 (Socorristas, TOC, Filhos, Migração, Relato) com CENAS-DEZEMBRO-20261126.md e as correções do revisor-ético.
4. **Portão de engajamento** em TODAS as peças prontas (Telas 1–3, Calor 2A/2B, os 5 de dezembro, Cesta, Davi, Vó Zezé, Clara, 24h). Para as reprovadas: plano de ajuste e pedido de cenas novas (Seção 3).
5. **Gerar no Higgsfield** as cenas que faltam para chegar a 14 peças aprovadas (respeitando o teto).
6. **Esteira offline de dois cliques** (PROMPT-CC-20261127-ESTEIRA-OFFLINE.md) + teste com 1 pílula.
7. **Pílulas novas** pela esteira, a partir do Radar de Pautas de domingo e do banco, com portão ≥ 8.
8. **PLANO-LANCAMENTO.md** quando o estoque ≥ 14 estiver próximo.
9. **Portal:** capas e landing, em PR.
10. **Auditoria geral semanal:** técnica, científica, ética e humanizada; corrigir o que achar.

## 10. RELATÓRIOS E CONTROLE
- **PAINEL-DIARIO.md** (1 página): feito / peças por estado / créditos gastos / notas do portão / bloqueios / lista do Dr.
- **HANDOFF-CHAT.md:** atualizado a cada sessão, para o Dr. colar no chat.
- **CUSTOS-HIGGSFIELD.md, PORTAO-ENGAJAMENTO.csv, MONETIZACAO-METAS.md, CRESCIMENTO-SEMANA.md:** sempre atualizados.

## 11. COMANDO DE ABERTURA DE CADA SESSÃO (o Dr. cola)
"Leia relatorios/PROMPT-MESTRE.md e o ESTADO-GERAL. Continue a fila da Seção 9 de onde parou, sem encerrar o turno. Parada às HH:MM."

## AUTORIZAÇÃO PERMANENTE DO DR. (27/11/2026, 23:15) — vale para esta e para as próximas sessões
O Claude Code DECIDE SOZINHO e registra no PAINEL tudo o que NÃO for:
(a) merge; (b) publicação; (c) gravação no banco ou na fila; (d) gasto acima de 1.000 créditos por semana; (e) mudança nas regras éticas e CFM.
Todo o resto é do Claude Code: cortes, ritmo, montagem, títulos, thumbnails, roteiros, cenas, pílulas, capas em PR. Não perguntar sobre isso.

Regras que continuam valendo junto: portão completo antes de qualquer PR; referência com PMID ou link oficial conferido; sem texto gerado por IA dentro de imagem; sem rosto de criança em close de sofrimento; SM-04 não volta a close.
Revisão ética: agente 11 (revisor-ético) quando disponível; senão revisão inline com serie-biblia/regras-eticas-cfm.md, marcada "revisão inline".
Meta da noite de 27/11: pelo menos 5 peças aprovadas no portão (>= 8 em tudo).
