# Decisão do freio de segunda 08:00 — fase 2 (25/10/2026, Salvador)

## 0. Correção
- Os 7 carrosséis saem 1 por dia útil (26/10 a 04/11, 08:00). Não é lote. Na segunda sai no máximo 1 post.
- Decisão: sem escolha marcada na ordem, vale [A] (crons LIGADOS). O item 1 recomenda [B] por defeito de registro (abaixo).

## 1. Post de 26/10 (revisão final, leitura)
- Ok: arquivos presentes (5 telas, legenda, alt, meta); hashes das 5 telas batem com os salvos (sem alteração); imagem da tela 1 com "Dr. Antônio Felipe" com acento; "Portal de Saúde Mental Doutor Antônio Felipe Garabito" presente na legenda; sem "psiquiatra"; links 200 (`/artigo/saude-mental-cuidador` e home).
- Defeito: o registro `carrosseis-instagram/saude-mental-cuidador/checagem-tripla.md` (gerado em 13/10) marca como verificados itens que contradizem o estado: "arte sem acento (Antonio)", "assinatura Dr. Antonio Felipe" e "7 slides" (o post tem 5). A tela renderizada mostra o acento correto. Ou seja, o registro está errado ou defasado.
- Não há registro de checagem posterior à validação de 18/10 (regra de ouro, 21/10: antes e depois).
- Referências da legenda: 2 (Pinquart 2003; Brodaty 2009), sem link. Não verifiquei os links das fontes (não há).
- RECOMENDAR [B] — motivo: registro de checagem contraditório e sem checagem posterior. Solução sem desligar crons: refazer a tripla do post e registrar.

## 2. Efeito de desativar os crons e recuperação
(a) Site: `publicarVencidos({diario:true})` publica TODOS os itens agendados com horário até o fim do dia (limite 48). Lista de títulos de 26/10 não verificável sem banco (o snapshot de 20/10 não serve).
(b) Catch-up: SIM para o site (publica o que venceu). Para as redes: NÃO há catch-up; cada execução publica um post devido; os vencidos ficam devidos e saem um por dia útil.
(c) Se os crons ficarem desligados na segunda e ligados na terça: a terça publica 1 post entre os devidos (26 e 27), o de MAIS VISUALIZAÇÕES primeiro, o que pode furar a ordem de data. Como evitar: ordenar por data e só depois por visualizações (mudança de código, PR próprio). Até lá, religar só depois de decidir qual post sai.
(d) renovar-token (seg 09:00): pula se a fila estiver pausada; senão, renova o token da variável e grava credencial cifrada no banco. O prazo está no banco (`expiraEm`), não lido; `token-estado.json` não existe. O verificador de 25/10 deu 190 para o token local, então a renovação falharia de qualquer forma. Um dia de atraso é neutro nesse caso; não é seguro afirmar sem ler o banco.

## 3. Fluxo do token em produção (código)
- Publicação: `obterTokenInstagram` → `resolverToken`. Se a variável existir e houver credencial cifrada no banco (com chave de cifra e banco configurados), usa a do BANCO; senão usa a variável.
- renovar-token: lê a variável, troca por token de longa duração e grava no banco (cifrado, `expiraEm`, `renovadoEm`).
- Pausa: `registrarTokenInvalido` grava `pausadoEm` e `impressaoPausada`. `estadoPausa` limpa a pausa quando a impressão digital do token em uso (do banco ou da variável) muda.
- Só atualizar `INSTAGRAM_ACCESS_TOKEN` NÃO basta se houver credencial no banco: a publicação continua com o token do banco. Além disso, variável nova só vale em deploy novo (docs Vercel).
- O #147 (22/10) foi criado depois da troca de 20/10: pela data, a variável do deploy é a nova. Isso é inferência; não verificado em runtime.
- NÃO verificável sem banco: se há credencial no banco, sua validade e `expiraEm`, se a pausa está ativa e desde quando.

## 4. Erro 190 (ver relatorios/instagram-erro-190-20261025.md)
- 190 = token inválido. Causas prováveis: usuário desautorizou o app ou sessão mudou; token expirado; token de outro app; testador não aceito. "API access deactivated" é outro problema (conta ou API restrita).

## 5. Manutenção-Semanal (código 1 na conferência de 25/10)
- O log `relatorios/logs-agendador/DrSM-Manutencao-Semanal.log` NÃO existe: a saída não está sendo gravada nesse caminho.
- Causa mais provável: `scripts/manutencaoSemanal.js --sexta` recusa se o branch atual não começa com `chore/manutencao`. A pasta principal está em `feat/ux-…`, então para com "PARADO" e código 1. O `--segunda` também recusa árvore suja (a pasta principal tem 55 alterações).
- Correção mínima proposta (não aplicada): rodar a tarefa a partir de um worktree dedicado no branch de manutenção, e gravar a saída em um log fixo.
- Afeta publicações? NÃO. Só prepara branch e PR. Não toca no Instagram nem no site.

## 6. Recomendação final
- Sob [A] (vigente): sai 1 post às 08:00 de segunda se a Meta aceitar o token da produção (inconclusivo; ver seção 3). Se recusar, o handler adia 20 h e alerta.
- Terça: sai 1 post (27/10) se a fila estiver em ordem.
- Verificar segunda às 17:30: perfil do Instagram (post 26/10 publicado ou não); primeira linha de `relatorios/RESUMO-DO-DIA.md`; `relatorios/conferencias/2026-10-26.md` (09:30); se o PC estava ligado.
- Se [B] for escolhido: `Vercel → drsaudemental → Settings → Cron Jobs → Disable Cron Jobs` hoje; religar em `Enable` na mesma tela. Religar na segunda libera o disparo de terça 08:00.

## 7. Tabela de horários (Salvador) — implementada no branch feat/horarios-presenca-20261025
| Tarefa | Seg–sex | Sábado | Domingo | Duração medida |
|---|---|---|---|---|
| Conferência-Diaria (leitura) | 17:35 | 21:00 | 09:00 | ~1 min |
| Narração | 17:45 | 20:30 | 10:00 | não medida de forma confiável (logs sem tempo por execução) |
| Gera-Mídia | 18:45 | 21:45 | 11:30 | mediana 47 s/item; máx. 426 s (54 itens) |
| YouTube publica | 20:15 | 20:45 | 20:15 | 1 item (trava de freio) |
| Rotina-Semanal | seg 18:30 | — | — | (não medida) |
- Ordem: narração → gera-mídia (≥60 min de margem) → publica. Sábado: a publicação 20:45 roda antes da gera-mídia de 21:45 (usa o material do dia anterior); isso é uma troca consciente.
- Desativadas e fora da tabela: LinkedIn-Agendar (a ordem pede desativada; no PC está Ready, rodou às 11:00 de hoje — conflito a confirmar), Blob-Rotina-Mensal, PR-Semanal, Lembrete LinkedIn.
- Manutenção-Semanal não está em `agendar-tarefas-windows.ps1`: não foi alterada.
- Quinta: a ordem diz disponível até 22:00; o CLAUDE.md diz plantão a partir de 17:30. Confirmar.

## 8. Implementação (branch feat/horarios-presenca-20261025)
- Commit `3a61d11`, local, sem push. Arquivos: `scripts/agendar-tarefas-windows.ps1`, `scripts/rotinaTarefas.js`, `tests/unit/rotina-tarefas-horarios.test.js`, `tests/unit/conferencia-diaria.test.js`.
- Testes de horário: 14/14 passam. Portão completo: APROVADO (31 e2e), relatório `relatorios/portao-20261025-1313.md` no worktree.
- O script de agendamento NÃO foi executado. Nada registrado no Windows.

## 9. Lições
- O `date` do Git Bash é UTC; horários de relatório em Salvador usam PowerShell `Get-Date`.
- "Mais lidos primeiro" fura a ordem por data quando há mais de um post devido.
- Registro de checagem sem data posterior à validação não prova o estado atual.

## 10. Commits e pendências
- `8363441`, `1f12916`, `cf6f22f`, `bc3c925` (docs) e `3a61d11` (horários, em outro branch). Push pendente: `! git -C C:/DRS-promocao push -u origin docs/vercel-promocao-20261025` e `! git -C C:/DRS-horarios push -u origin feat/horarios-presenca-20261025`.
