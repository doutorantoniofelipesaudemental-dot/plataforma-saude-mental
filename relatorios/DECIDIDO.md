# Decidido — não perguntar de novo

Atualizado em 27/10/2026, por ordem do Dr. Antônio. Antes de pedir qualquer decisão, conferir este arquivo. Se algo aqui estiver errado, o Dr. corrige; não reabrir por conta própria.

## Decisões
- **YouTube:** o app está "Em produção" desde 18/10/2026. O refresh token não vence. O aviso de "vence em 23/10" era falso: `relatorios/youtube/validade.json` foi corrigido (`autorizacaoVenceEm: null`), e o alerta deixa de disparar.
- **YouTube, escopo:** o `youtube:autorizar` tem de rodar com a pasta na `main` (escopo `youtube.force-ssl`). Rodado no branch antigo, o escopo fica errado. Conferir com `npm run youtube:teste-playlists`.
- **REDES_PUBLICACAO_ATIVA:** ligado. O post de 26/10 saiu.
- **Plano da Vercel:** Pro, confirmado (US$ 4,19 de 20 de crédito).
- **Root Directory da Vercel:** o deploy #158 funciona, então a configuração está correta. Encerrado.
- **Vídeos F (54 regerados):** fila atual com 97 `aprovado-checagem` e 12 `reserva`, nenhum reprovado. O PR #115 foi mesclado em 20/10/2026.
- **Opção A (domínio único):** os 24 textos ficam no site oficial (`www.drantoniofelipemedico.com.br`). Não é a regra a/b do Blob.
- **Regra a/b do Blob** (outra coisa): itens das listas a (publicados) e b (agendados) nunca são apagados; a rotina gera alerta.
- **Referências:** decidido na ordem de 27/10. Sem detalhe adicional nesta ordem (conferir a ordem antes de citar).
- **Vozes pagas:** bloqueadas. Só Edge-TTS (`pt-BR-AntonioNeural`).
- **Crons diários:** publicar redes todos os dias (PR #166, aberto).
- **Cron legado do LinkedIn (publicava por API):** removido no PR #166 (aberto; vale quando mesclado).
- **Manutenção semanal:** a etapa de segunda roda numa worktree própria a partir de `origin/main` (branch `fix/manutencao-arvore-limpa-20261026`).
- **Pasta principal:** SEMPRE na `main`. Trabalho só em worktrees curtos, removidos depois do merge.
- **Worktree de PR:** nunca passar merge com o branch aberto em worktree.
- **#145 (token do Instagram):** fechado em 27/10/2026. Superado pela main; removia a redação do token.
- **#138 (domínio único, textos e assets):** pausado (Opção A). Não mesclar sem ordem.

## Não decidido (aguarda o Dr.)
- Carrossel A e carrossel B (28/10) e o Reel corrigido: avaliação do Dr. Caminhos em `relatorios/ESTADO-GERAL.md`.
- Horários do #159.
- Migração do `vercel.json`.
- Limpeza das worktrees restantes (`DRS-cand`, `DRS-pr77`, `DRS-deploy-main`, `DRS-manut-20261026`, `DRS-post-check`, `DRS-promocao`, `DRS-registro`, `DRS-fix-manut`).

## Continuação (27/10/2026, 19h, ordem única)
- **Tarefas do Windows:** nunca desativar uma tarefa que o Dr. Antônio ativou. Antes de mexer em qualquer tarefa `DrSM-*`, conferir `relatorios/DECIDIDO.md` e o topo de `relatorios/ESTADO-GERAL.md`.
- **Blob (`DrSM-Blob-Rotina-Mensal`):** SUPERADO em 28/10 (ver "Continuação 28/10"): a tarefa fica READY. Quem a desativou em 27/10 foi o Claude Code, por engano.
- **LinkedIn (`DrSM-LinkedIn-Agendar`):** reativar só depois do merge do #167. O #167 recebe o registro obrigatório de desativação; a conferência diária passa a mostrar o `LastTaskResult` com a interpretação do código.
- **YouTube, escopos:** `youtube.force-ssl` é aceito por `videos.insert`, `thumbnails.set`, `playlists.insert`, `playlistItems.insert` e `captions.insert`. Para `playlists.list` a página não confirma; o teste de leitura confirma (ver `relatorios/youtube/AUDITORIA-API-RESPOSTAS.md`).
- **YouTube, rodar de novo:** o Dr. roda `npm run youtube:autorizar` e `npm run youtube:teste-playlists` com a pasta na `main`.
- **Opção A (domínio único):** os 24 textos ficam no site oficial. Não é a regra a/b do Blob.
- **Ordem de merges (14 PRs):** terça: 172 → 173 → 159 → 160 → 161 → 162 → 163. Quarta: 164 → 165 → 166 → 167 → 168 → 169 → 156. Um por vez, com `npm run merge-seguro -- N`. Depois de cada merge, atualizar o próximo se tiver conflito, um portão por vez.
- **Estado perdido e recuperado:** `ESTADO-GERAL.md` e `PROMPT-ATUAL.md` nunca foram rastreados pelo Git. A cópia mais recente deles era de 22/10. Ver o aviso no topo de cada arquivo. Antes de trocar de branch: `npm run estado:guardar`.

## Continuação 28/10/2026 (19h, ordem escrita do Dr. Antônio: vale sobre as notas anteriores)
- **Blob (`DrSM-Blob-Rotina-Mensal`) fica READY.** O Dr. ativou em 26/10 de propósito e confirmou em 27/10. As notas de 19/10 e 27/10 estão superadas. Nunca sugerir desativar o que o Dr. ativou.
- **Produção:** está no deploy do #185 (`dpl_35MJE…`, `main` f3e11f2) e a atribuição automática voltou. Itens "#146/#147" e "produção não verificada": encerrados.
- **Vídeos F (54):** encerrado. Fila com 97 aprovados e 0 reprovados.
- **Links quebrados:** trocas aprovadas em 26/10 e aplicadas no banco (forumseguranca → `/publicacoes/anuario-brasileiro-de-seguranca-publica/`; portaldeimigracao → `gov.br/mj/pt-br/assuntos/seus-direitos/migracoes`). Conferidas em 28/10 (200). bvsms: retestado em 28/10, 200, sem troca. Referências não são narradas, então o áudio não muda.
- **Crédito do Reel:** o padrão é "Portal de Saúde Mental Doutor Antônio Felipe Garabito", com "Doutor" por extenso, na fala e na tela, em Shorts, longos e Reels.
- **Custo da Vercel:** falha de leitura da API é só AVISO ("leitura indisponível"), nunca falha nem alerta de custo. Só o crédito do painel (informado à mão) alerta. A cobrança antiga do registro não entra no alerta. Hoje: US$ 4,19 de US$ 20, lido pelo Dr. em 26/10.
- **PR semanal de sexta (`DrSM-PR-Semanal`):** ENCERRADO. A tarefa não existe mais; a Manutenção semanal abre o PR na sexta.
- **#138 (domínio único):** segue pausado (Opção A). Sem decisão agora.

## Alerta de custo da Vercel (27/10/2026, 22h30, ordem única)
- **Alerta de custo da Vercel = `billedCost` do ciclo (cobrança real) acima de US$ 0,50**, mais o crédito do painel informado manualmente (`creditoPainel`). Acima de 70% do crédito de US$ 20 (US$ 14), alerta.
- **`effectiveCost` é só informativo** (tendência por serviço). Ele soma o uso coberto pelas franquias do Pro, que não consome o crédito de US$ 20. Por isso deu US$ 23,57 (117,9%) enquanto o painel mostra US$ 4,19.
- O valor do painel ("crédito incluído usado") a API não mostra. É atualizado à mão em `creditoPainel`, com a data da leitura (hoje: US$ 4,19 de US$ 20,00, em 26/10).

## Estado fora do Git e alerta de custo (28/10/2026, ordem do Dr. Antônio)
- **Arquivos que a automação escreve não ficam no Git:** PENDENTES.md, AUTORIZACOES.md, FILA-MANUAL.md, tarefas-estado.md e relatorios/linkedin/fila.json. Ficam no `.gitignore`; o backup é feito por `scripts/backupEstado.js`.
- **Fila do LinkedIn:** o portão lê a fixture versionada `tests/fixtures/linkedin-fila.json`. A fila real só é lida pela conferência diária.
- **Versionados (só mudam por PR):** CLAUDE.md, DECIDIDO.md, LICOES.md, documentos (AUDITORIA-API-RESPOSTAS.md, PASSO-A-PASSO-YOUTUBE.md) e configurações (validade.json).
- **Alerta de custo da Vercel:** só o uso sob demanda conta (billedCost sem a assinatura). A linha "Pro" (US$ 20/mês), os assentos e as taxas fixas do plano ficam FORA do alerta. Alerta = uso sob demanda acima de US$ 0,50 no ciclo. Teste: a linha "Pro" sozinha não alerta.

## 28/10/2026 — LinkedIn: tarefa ATIVA (ordem do Dr. Antônio, 07:40)
- `DrSM-LinkedIn-Agendar` foi religada pelo Dr. Antônio como administrador antes de sair (estado Ready). Não foi criada nenhuma tarefa nova.
- Limite: 2 posts por dia (`MAX_POSTS = 2` em `scripts/linkedin/agendarDiario.js`). O comentário do cabeçalho ainda diz 3; corrigir em PR próprio quando houver outra mudança no arquivo.
- Salvaguardas em vigor: 2 min entre posts, uma execução por dia, agendador NATIVO do LinkedIn, perfil persistente do Chrome, parada imediata em deslogado, CAPTCHA, verificação, limite ou atividade incomum (esta última também desativa a tarefa).
- Parada por aviso: não tentar de novo no mesmo dia; a mensagem exata vai para `relatorios/ESTADO-GERAL.md` para o Dr. ver às 18:00.

## 30/10/2026 — Sessão de sexta (ordem escrita do Dr. Antônio, 11:00)
- **Carrossel 28/10:** escolhida a versão A (`C:/DRS-post-check/amostras/carrossel-28/`), com a regra nova do selo: selo = "Para <público>" e título grande = tema. Vale para capas futuras. Sujeita à olhada final do Dr. Antônio (bloco 3). A versão B fica como referência.
- **Vídeos YouTube (após a revisão do Dr. Antônio, bloco 1):**
  - `tmc-aps`: público na sexta, 30/10.
  - `saude-mental-cuidador` (Short): agendado para sábado, 31/10, às 12:00.
  - `burnout-medicos-enfermeiros`: agendado para segunda, 02/11, às 18:00.
  - Cada publicação depende da aprovação do vídeo pelo comando `npm run revisao:aprovar -- <slug>`. Reprovado: não sobe e a data fica livre.
- **App do YouTube:** "Em produção" (confirmado de novo em 30/10).
- **PRs #192 e #138:** fechados sem mesclar. As branches (`feat/reels-api-preparo-20261028` e `feat/dominio-unico-rewrite-20261021`) são preservadas e não são apagadas.

## 30/10/2026 — Plano unificado de qualidade e GEO (ordem escrita do Dr. Antônio)
- **Vídeos estáticos REPROVADOS:** `tmc-aps`, `saude-mental-cuidador` e `burnout-medicos-enfermeiros` não sobem por nenhum caminho. Não se apagam nem se movem. O comando `npm run revisao:aprovar` não é rodado para eles. Os agendamentos de 31/10 (Short) e 02/11 (longo) deste registro ficam CANCELADOS.
- **Regra geral:** "vídeo estático está proibido em todas as redes; todo conteúdo novo segue o padrão aprovado nas amostras".
- **Nada vai ao ar sem aprovação das amostras do Dr. Antônio.** Vale para o padrão novo (personagens, Reels, Stories, LinkedIn em PDF/vídeo, Spotify).
- **Ferramentas:** só gratuitas, com licença conferida e citada. Excluídos: ElevenLabs, vozes pagas e clonagem de voz; Bing Image Creator; Make, n8n, CapCut, Opus Clip, InVideo, Luma, Kling e Pika. Orquestração: a atual.
- **WhatsApp:** excluído por enquanto.
- **Dependência:** o padrão novo para Reels e Stories conflita com a regra do CLAUDE.md ("Reels e Stories: não são produzidos por ora; reavaliar em ~18/11"). Esta ordem prevalece só depois de o CLAUDE.md ser alterado por PR.

## 30/10/2026 — Calendário semanal e revisão em lote (ordem escrita do Dr. Antônio, continuação)
- **Calendário semanal inicial:**
  - Instagram: 3 Reels + 1 carrossel + Stories.
  - LinkedIn: 3 posts (PDF do carrossel, 1 Reel como vídeo, 1 texto).
  - YouTube: 3 Shorts (os mesmos Reels) + 1 vídeo longo.
  - Spotify: 1 episódio.
  - Não existem Shorts diários: os Shorts são os 3 Reels da semana.
- **Regra da revisão em lote:**
  - (a) O Dr. revisa o ARTIGO MASTER da semana e um CADERNO ÚNICO com roteiros, legendas, textos de slides, Stories e posts.
  - (b) As peças derivadas só usam frases e afirmações clínicas presentes no master revisado. Frase clínica sem correspondência no master REPROVA e vai para o caderno destacada.
  - (c) O Dr. assiste 1 Reel (amostra) e o vídeo longo em 1,5x.
  - (d) Stories são só enquete, pergunta ou chamada, sem conteúdo clínico novo.
  - (e) O tempo real do lote é medido. Se passar de 45 min, o vídeo longo passa a ser quinzenal.
- **Reels e Stories na API:** a ativação em `backend/lib/redesV2/roteamento.js` continua proibida até a aprovação das amostras (domingo, 01/11). Depois, por PR, com o freio `REDES_PUBLICACAO_ATIVA` respeitado.
- **Conflito com o CLAUDE.md:** corrigido nesta mesma branch (linha de Instagram).

## 30/10/2026 — Capturas OAuth, Vercel e rotina de frequência (ordem escrita do Dr. Antônio, 12:30)
- **Vercel (conferido pelo assistente, só nomes de variáveis, sem valores):** NÃO existe `YOUTUBE_REFRESH_TOKEN` nem outra variável do YouTube na Vercel. O YouTube roda só localmente. Não há passo na Vercel para a nova autorização.
- **`npm run youtube:autorizar`:** grava o refresh token só no `.env` local. Não revoga tokens existentes.
- **Capturas OAuth:** as imagens vão para `relatorios/youtube/auditoria-envio/capturas/` com prefixo `oauth-` (exigência de `scripts/youtube/montarAnexoAuditoria.js`). Nomes: `oauth-01-consentimento`, `oauth-02-escopos`, `oauth-03-autorizado`, `oauth-04-revogacao`. Método: Win+PrtScn, com a cópia renomeada (a original em `Imagens\Capturas de tela` não é movida nem apagada). A pasta `evidencias/` não é usada.
- **Frequência e revisão em lote:** confirmadas (3 Reels, 1 carrossel, Stories, 3 posts de LinkedIn, 3 Shorts + 1 vídeo longo, 1 episódio por semana, lote de no máximo 45 min). Conforme a entrada de 30/10 acima.

## 30/10/2026 — Auditoria do YouTube: demonstração privada, fila e itens publicáveis (ordem escrita do Dr. Antônio)
- **Screencast (opção C):** o Google exige ver o uso real do escopo de upload. Em vez de subir vídeo estático, cria-se uma demonstração técnica de 15 s, sem conteúdo clínico, com 4 cenas e crédito do Portal, na fila com status `demo-auditoria` (id `demo-auditoria-20261030`). Sobe SEMPRE privada, por `testeUploadPrivado.js --id=demo-auditoria-20261030`. Não é apagada.
- **Fila:** `tmc-aps`, `saude-mental-cuidador` e `burnout-medicos-enfermeiros` (inclusive os itens futuros `short-resumo-*`) marcados como REPROVADOS no `fila.json`. O arquivo não é versionado (ignorado pelo Git): a marcação é de estado local, feita em 30/10; o backup de antes está em `.tmp/fila-antes-reprovar-30.json`.
- **Código:** `itemPublicavel` impede publicação ou teste de item reprovado e de item com menos de 2 cenas (itens antigos contam como 1). Vale para `publicarYoutube.js` e `testeUploadPrivado.js`. Testes em `tests/unit/item-publicavel.test.js`.
- **Vercel:** sem variável do YouTube (ver entrada anterior).

## 30/10/2026 — Freio, pausa estática e ordem de merges (ordem escrita do Dr. Antônio, 15:00)
- **Freio do YouTube:** o Dr. confere `YOUTUBE_PUBLICACAO_ATIVA` no `.env` por conta própria. O assistente não lê o `.env`.
- **Pausa dos estáticos:** os 92 itens `pausado-estatico` ficam pausados até o padrão animado ser aprovado. Reprovados (5) e a demo (`demo-auditoria`) também não são publicados pelo publicador.
- **Conferido no código da main (`scripts/youtube/publicarYoutube.js`, linha 53):** o publicador só seleciona `status === 'aprovado-checagem'` com horário vencido. A tarefa `DrSM-YouTube-Publica` executa esse script via `travaDiaria.js`. Na fila atual, a seleção é de 0 itens.
- **Captura OAuth 02:** o Dr. escolheu o método A (clicar em "Continuar" na tela de consentimento, capturar a lista de permissões e fechar sem concluir).
