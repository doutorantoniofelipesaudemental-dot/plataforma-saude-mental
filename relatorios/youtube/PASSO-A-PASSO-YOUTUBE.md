# Passo a passo — deixar o YouTube publicando sozinho

Linguagem simples. **Nunca cole chaves em chat.** Elas vão só no arquivo `.env` deste computador.
Enquanto isto não estiver feito, **nada é publicado**: tudo fica pronto em `relatorios/youtube/fila-manual/` (uma pasta por semana, com vídeo, capa, título, descrição, tags e legenda) para subir à mão.

## Onde você está (conferido em 16/10/2026, à noite)
- ✅ Chave secreta, autorização e teste privado: **feitos**. O vídeo de teste está privado em https://www.youtube.com/shorts/z_JHmmpw880 (só você vê; pode apagar no YouTube Studio).
- ✅ O app do Google está **"Em produção" desde 18/10/2026**. O refresh token não vence. O antigo aviso de "vence em 23/10" era falso e foi removido (`relatorios/youtube/validade.json`, decisão do Dr. Antônio em 27/10/2026).
- ⚠ **Escopo da autorização (27/10/2026):** o `youtube:autorizar` precisa ser rodado **com a pasta principal na `main`** (o escopo é `youtube.force-ssl`). Se foi rodado com a pasta no branch antigo, o escopo é `youtube.upload` + `youtube`, e é preciso rodar de novo. Quem confere é o `npm run youtube:teste-playlists` (só leitura).
- ❌ O freio está **desligado** (é o certo por enquanto): `YOUTUBE_PUBLICACAO_ATIVA` não existe. Só se liga no passo D.
- ❌ Os vídeos só poderão ficar **públicos** depois da auditoria da API (seção "Auditoria da API"; respostas prontas em `relatorios/youtube/AUDITORIA-API-RESPOSTAS.md`). Até lá, mesmo com o freio ligado, o YouTube deixa tudo como privado.

---

## Publicar o app (para a autorização não vencer)
Fazer **uma vez**, depois do teste. Não precisa de verificação do Google para isso (o app só tem você como usuário).
1. Abra **console.cloud.google.com**, projeto **portal-saude-mental-youtube** → menu ☰ → **Google Auth Platform** (ou **APIs e serviços → Tela de permissão OAuth**).
2. Página **Branding** (Identidade visual). Preencha:
   - **Nome do app:** `Portal Saúde Mental`.
   - **E-mail de suporte do usuário:** doutor.antoniofelipe.saudemental@gmail.com.
   - **Logotipo:** **deixe em branco** (não envie logo; enviar logo obriga a uma revisão demorada).
   - **Página inicial do app:** `https://www.drantoniofelipemedico.com.br`
   - **Link da Política de Privacidade:** `https://www.drantoniofelipemedico.com.br/privacidade`
   - **Link dos Termos de Serviço:** pode ficar em branco.
   - **Domínios autorizados:** `drantoniofelipemedico.com.br` (sem `www`, sem `https://`).
   - **Dados de contato do desenvolvedor (e-mail):** doutor.antoniofelipe.saudemental@gmail.com.
   - Clique em **Salvar**.
3. Página **Público-alvo** (Audience): confira que o tipo é **Externo** e clique em **Publicar app** → **Confirmar**. O status muda de "Testando" para **"Em produção"**.
4. **Rode a autorização de novo** (a de "Testando" não vale como permanente):
   ```
   ! npm run youtube:autorizar
   ```
   Abra o endereço, entre com a conta do canal, **Avançado → Acessar Portal Saúde Mental (não seguro) → Continuar**. Deve aparecer "YOUTUBE_REFRESH_TOKEN gravado no .env".
5. Registre que o app está em produção (para o aviso de 7 dias parar):
   ```
   ! node --env-file=.env scripts/youtube/avisoAutorizacao.js --registrar producao
   ```
6. Se o Google disser que a política de privacidade precisa citar o YouTube, avise o Claude Code: o texto da página `/privacidade` hoje **não menciona** o uso da API do YouTube e acrescentar um parágrafo exige o seu OK (a pasta `public/` é protegida).

---

## A. Pegar a chave secreta no Google Cloud (5 minutos)
1. Abra **console.cloud.google.com** e entre com a mesma conta Google do canal.
2. No topo, confira que o projeto escolhido é **portal-saude-mental-youtube**.
3. Menu (☰) → **APIs e serviços** → **Credenciais**.
4. Em **IDs do cliente OAuth 2.0**, clique no **nome** do ID (tipo "App para computador").
5. Na página que abrir, procure **"Chave secreta do cliente"** (*Client secret*). Clique no ícone de **copiar** (dois quadradinhos).
   - Se aparecer só "••••" e não deixar copiar: clique em **"Adicionar chave secreta"**, depois em **copiar** (o Google mostra a chave inteira só nessa hora; se fechar a janela sem copiar, crie outra).
6. **Não cole em nenhum chat.** Vá para o passo seguinte com a chave copiada.

## B. Colar a chave no `.env` com o Bloco de Notas
1. Abra o **Explorador de Arquivos** na pasta `C:\DRSAUDEMENTAL`. (Se não aparecer o arquivo `.env`: aba **Exibir** → marque **Itens ocultos**.)
2. Clique com o botão direito no arquivo **`.env`** → **Abrir com** → **Bloco de Notas**.
3. Use **Ctrl + F** e procure `YOUTUBE_CLIENT_SECRET`. Deve existir uma linha assim:
   ```
   YOUTUBE_CLIENT_SECRET=""
   ```
4. Clique com o cursor **entre as duas aspas** da linha e cole a chave (Ctrl + V), sem espaços. O nome da variável tem de ficar **exatamente** `YOUTUBE_CLIENT_SECRET`, em maiúsculas, com o `=` logo depois e as aspas em volta da chave. A chave do Google começa com `GOCSPX-`.
   (Se a linha não existir, acrescente-a no fim do arquivo, no mesmo formato da linha do passo 3.)
5. **Arquivo → Salvar** (Ctrl + S) e feche. Não envie esse arquivo a ninguém.

## C. Autorizar o canal (uma vez)
1. No terminal do Claude Code, digite exatamente (com o `!` na frente):
   ```
   ! npm run youtube:autorizar
   ```
2. Vai aparecer na tela um **endereço** (começa com `https://accounts.google.com/...`). Copie e abra no navegador.
3. Entre com a **conta dona do canal** do YouTube.
4. O Google vai avisar **"O Google não verificou este app"**. É normal (o app é só seu). Clique em **Avançado** → **Acessar Portal Saúde Mental (não seguro)**.
5. Na tela de permissões, marque/aceite **"Gerenciar seus vídeos do YouTube"** (ou "Fazer upload de vídeos") → **Continuar**.
6. O navegador vai mostrar uma página dizendo que a autorização foi concluída (pode fechar). No terminal aparece: **"✅ YOUTUBE_REFRESH_TOKEN gravado no .env (valor não exibido)"**.
7. Em seguida, para criar as 10 playlists do canal:
   ```
   ! node --env-file=.env scripts/youtube/criarPlaylists.js
   ```
8. **Importante:** no Google Cloud → **Tela de permissão OAuth / Público-alvo**, clique em **Publicar app** (status "Em produção"). Se ficar em "Teste", o Google apaga a autorização a cada **7 dias**.

### Como conferir que deu certo
- Abra o `.env` no Bloco de Notas: `YOUTUBE_CLIENT_SECRET` e `YOUTUBE_REFRESH_TOKEN` agora têm texto entre as aspas.
- Avise o Claude Code: "autorizei o YouTube". Ele testa a autorização sem publicar nada.

## D. Teste privado e só depois ligar o freio
1. **Não ligue o freio ainda.** Peça ao Claude Code o **teste** (ou digite você: `! node --env-file=.env scripts/youtube/testeUploadPrivado.js --confirmar`): ele sobe **1 vídeo como PRIVADO** (só você vê) e mostra o link para você conferir. Sem `--confirmar`, ele só confere o vídeo e não envia nada.
2. Abra o link, veja o vídeo, o título, a descrição e as playlists.
3. Se estiver tudo certo, **você** liga o freio. **São DOIS ajustes no `.env` deste computador** (Bloco de Notas), e os dois precisam estar certos ao mesmo tempo:
   ```
   YOUTUBE_PUBLICACAO_ATIVA=true
   REDES_PUBLICACAO_ATIVA=true
   ```
   - `YOUTUBE_PUBLICACAO_ATIVA` é o freio **do YouTube**: nasce desligado; só o valor `true` liga.
   - `REDES_PUBLICACAO_ATIVA` é o freio **geral das redes**: com `false` ele bloqueia tudo que sobe vídeo. **Hoje essa linha está `false` no `.env` local**, então mesmo com `YOUTUBE_PUBLICACAO_ATIVA=true` nada seria publicado até você trocar para `true` (ou apagar a linha).
   - **Quais tarefas dependem de cada um:**

     | O que | Depende de `YOUTUBE_PUBLICACAO_ATIVA` | Depende de `REDES_PUBLICACAO_ATIVA` (local) |
     |---|---|---|
     | Tarefa `DrSM-YouTube-Publica` (12:30, publica os vídeos) | **sim** | **sim** |
     | Teste de upload privado e criação das playlists | não | **sim** (por isso o teste privado precisou de autorização expressa) |
     | Tarefa `DrSM-YouTube-Gera-Midia` (23:30, só gera os arquivos) | não | não |
     | Tarefa `DrSM-Narracao-Noite` (áudios) e conferências/rotina | não | não |

   - O freio geral da **Vercel** (que controla o Instagram e o LinkedIn) é **outra** variável, em outro lugar; mudar o `.env` daqui não mexe nele (ver a tabela de freios no `ESTADO-GERAL.md`).
   - Para conferir sem publicar: `! node --env-file=.env scripts/youtube/publicarYoutube.js --simular`.
4. O agendador do Windows roda o publicador todo dia às 12:30 (o computador precisa estar ligado). Até 2 vídeos por dia.

## Auditoria da API (para os vídeos poderem ser públicos)
Projetos do Google Cloud **não auditados** têm os vídeos enviados pela API forçados para **privado**. O log (`relatorios/youtube/publicacao-log.md`) avisa. Soluções: (a) pedir a auditoria no formulário **YouTube API Services – Audit and Quota Extension** (gratuito, leva dias): link, respostas prontas em português e inglês e passo a passo de envio estão em `relatorios/youtube/AUDITORIA-API-RESPOSTAS.md`; ou (b) continuar subindo à mão pela pasta `fila-manual` (funciona hoje, sem depender de ninguém).

## Comentários — moderação
YouTube Studio → **Configurações → Comunidade → Padrões**: marque **"Reter comentários potencialmente inadequados para revisão"**. Em **Palavras bloqueadas**, cadastre (retêm o comentário para você revisar): suicídio, suicida, me matar, quero morrer, tirar minha vida, acabar com tudo, automutilação, me cortar, overdose, além de termos de ódio. Revise a fila de "Retidos" ao menos 1x por dia.
**Regra:** nunca responder com orientação clínica individual. Resposta-modelo: "Obrigado por compartilhar. Este canal é educativo e não substitui consulta; procure a UBS ou o CAPS da sua região. Em crise: CVV 188 (24 h) ou SAMU 192." Se houver risco imediato no comentário, responder só com isso e, se possível, denunciar/encaminhar conforme a plataforma.

## Desligar a qualquer momento
No `.env`: `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apague a linha). **Qualquer um dos dois freios desliga**: `REDES_PUBLICACAO_ATIVA=false` também impede o YouTube (e qualquer upload feito deste computador). Para parar também a tarefa: `Disable-ScheduledTask -TaskName 'DrSM-YouTube-Publica'`. Ver também `relatorios/SE-ALGO-DER-ERRADO.md`.

## Criar o canal (se ainda não existir)
1. youtube.com → foto do perfil → **Criar um canal**. Nome: `Dr. Antônio Felipe · Saúde Mental`; identificador: `@drantoniofelipe.saudemental`.
2. Personalização: foto = `relatorios/youtube/canal/perfil.png`; banner = `canal/banner.png`; descrição = bloco de `canal/nome-e-sobre.md`; **trailer** = `canal/trailer.mp4`.
3. Configurações → Canal → Configurações avançadas → Público: **"Não, este canal não é para crianças"**.
