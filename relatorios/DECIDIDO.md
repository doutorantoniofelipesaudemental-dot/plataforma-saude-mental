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

## 01/11/2026 — Reagendamento, ritmo e publicação delegada (ordens do Dr. Antônio, 09:05, 09:35 e 09:50)
- **Ritmo:** 2 posts por dia, 08:00 e 14:00 (Bahia), todos os dias da semana. Primeiro slot 03/11/2026 08:00. Agenda aplicada: 339 com data, 26 sem data (Nível 1), 12 com aviso `revisao-medica-pendente`.
- **Nível 1 (sensíveis):** 26 textos saem da agenda sem data, status `aguarda-revisao-medica`. Só voltam com leitura do Dr. Antônio. Incluem *Remédios numa caixa de sapato* e *O último comprimido da noite*.
- **Duplicados de título:** a comparação de texto deu 0,1% a 14% (nenhum acima de 60%). Não são duplicados: os 10 voltam à agenda, com 30 dias ou mais entre os dois de cada par. A série do segurança fica em ordem ("me seguia" antes de "me seguiu de novo"). Não há união de textos.
- **Relatos:** distribuídos cerca de 1 a cada 2 dias (medido: 1 a cada 1,77 dias).
- **Trava:** `scripts/reagendar.js` e `backend/scripts/importarTudo.js` recusam `--aplicar` sem `--ordem-dr`. Recálculo da agenda só com ordem escrita do Dr. Antônio.
- **Publicação delegada (ordem de 01/11, 09:50):** artigos e posts APROVADOS na auditoria geral e na tripla checagem automática (técnica, científica, ética e humanizada; referências, CFM 2.336/2023 e 2.454/2026; sem "psiquiatra"; "Antônio" com acento; CVV 188 e SAMU 192) podem ser publicados no site e nas redes. Continua sob responsabilidade do Dr. Antônio.
  - Aviso para textos aprovados só pela checagem: "Conteúdo verificado por checagem automática técnica, científica e ética e publicado sob responsabilidade do Dr. Antônio Felipe (Resolução CFM 2.454/2026). Revisão médica individual: pendente."
  - Aviso para textos revisados pelo Dr. (`revisao:aprovar`, com hash): "Revisado pelo Dr. Antônio Felipe em DD/MM/AAAA." Nunca mostrar esse selo sem o registro.
  - Exceções que continuam exigindo leitura do Dr. Antônio: Nível 1, conteúdo com nome de remédio ou dose, e qualquer item com dúvida na checagem. Vão para o caderno de domingo.
- **Freios:** `REDES_PUBLICACAO_ATIVA` e `YOUTUBE_PUBLICACAO_ATIVA` continuam mudando só por ordem escrita do Dr. Antônio, item por item. Esta autorização não liga freio algum.
- **Aviso honesto no site:** `public/artigo.html` deixa de afirmar "revisão e responsabilidade médica final" e passa a dizer "Revisão médica individual: pendente". O mesmo texto ainda aparece em blog, home, instagram, linkedin, mentoria, na landing do app e em `backend/lib/conformidadeCfm.js` (constante `AVISO_CFM`, usada pelas checagens de YouTube e LinkedIn). Essas páginas ficam para PR próprio.

## 01/11/2026 — Aviso honesto em todos os lugares e registro do formulário do YouTube (ordens de 10:05 e 10:50)
- **Aviso (substitui o item "Aviso honesto no site" acima):** a frase "com revisão e responsabilidade médica final" saiu de todas as páginas (artigo, blog, home, instagram, linkedin, mentoria, podcast, youtube), da landing do app, da constante `AVISO_CFM` (`backend/lib/conformidadeCfm.js`, fonte única das checagens de YouTube e LinkedIn) e dos testes correspondentes. Texto padrão: "Conteúdo educativo produzido com apoio de inteligência artificial e checagem automatizada, sob responsabilidade do Dr. Antônio Felipe (Resolução CFM 2.454/2026). Revisão médica individual: pendente."
- Com revisão registrada (`revisao:aprovar` com hash atual): acrescentar "Revisado pelo Dr. Antônio Felipe em DD/MM/AAAA." Nunca mostrar sem o registro.
- **Não alterado nesta rodada:** legendas já agendadas em `CONTEUDO_INSTAGRAM/agendamento/` (659 arquivos com a frase antiga) e o texto de arte de `scripts/linkedin/carrossel.py`. O modelo do roteiro multimídia foi atualizado.
- **Selo dinâmico** (página do artigo recebe o status do registro): PR separado, depois destes.
- **Ordem de merge de hoje:** (1) aviso honesto; (2) trava do reagendamento (#218); (3) calendário 2 por dia; (4) docs (esta, #219, com #216).
- **Formulário da auditoria do YouTube (registro, 01/11, 10:50):** respostas registradas em `relatorios/youtube/auditoria-envio/RESPOSTAS.md`. Ponto em aberto: a seção 1 do formulário estava com "NÃO pedir cota adicional", e a ordem do Dr. Antônio fala em "request for additional quota" com "a cota padrão é suficiente". Confirmar antes do envio.

## 01/11/2026 — Formulário da API do YouTube enviado (12:12)
- Enviado em 01/11/2026 às 12:12 (confirmação: "Your email has been sent. Thank you for submitting the YouTube API Services Form."). Registro completo em `relatorios/youtube/auditoria-envio/RESPOSTAS.md`.
- Seção 1: compliance audit com cota padrão. Seção 4: "Portal de Saúde Mental", não público, sem credenciais de demonstração. Seção 5: videos.insert (3.200/dia), videos.update, thumbnails.set, captions.insert, playlists.list, playlists.insert, playlistItems.insert; quota "No change / Default". Seção 6: arquitetura.pdf, fluxo-usuario.pdf, supporting-materials.pdf e as evidências de site.
- **Regra:** qualquer endpoint novo ou mudança de uso da API exige aviso por escrito ao YouTube ANTES (compromisso da Seção 7). Checagem no portão: endpoint fora da lista reprova (ver PR de checagem).
- Lembrete diário em RESUMO-DO-DIA: "olhar o Gmail (resposta do Google sobre a auditoria)", até a aprovação.
