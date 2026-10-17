# Passo a passo — deixar o YouTube publicando sozinho

Linguagem simples. **Nunca cole chaves em chat.** Elas vão só no arquivo `.env` deste computador.
Enquanto isto não estiver feito, **nada é publicado**: tudo fica pronto em `relatorios/youtube/fila-manual/` (uma pasta por semana, com vídeo, capa, título, descrição, tags e legenda) para subir à mão.

## Onde você está (conferido em 17/10/2026)
- ✅ Canal e projeto no Google Cloud: o `YOUTUBE_CLIENT_ID` já está no `.env`.
- ❌ **Falta a chave secreta** (`YOUTUBE_CLIENT_SECRET` está vazia no `.env`). **Comece pelo passo A.**
- ❌ Falta a autorização (`YOUTUBE_REFRESH_TOKEN` vazio) → passo B.
- ❌ O freio está **desligado** (é o certo por enquanto): `YOUTUBE_PUBLICACAO_ATIVA` não existe. Só se liga no passo D, depois do teste.

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
3. Se estiver tudo certo, **você** liga o freio: no Bloco de Notas, no `.env`, acrescente a linha
   ```
   YOUTUBE_PUBLICACAO_ATIVA=true
   ```
   e salve. (Para conferir sem publicar: `! node --env-file=.env scripts/youtube/publicarYoutube.js --simular`.)
4. O agendador do Windows roda o publicador todo dia às 12:30 (o computador precisa estar ligado). Até 2 vídeos por dia.

## Atenção: vídeos privados por padrão
Projetos do Google Cloud **não verificados** têm os vídeos enviados pela API forçados para **privado**. O log (`relatorios/youtube/publicacao-log.md`) avisa. Soluções: (a) pedir a auditoria no formulário "YouTube API Services – Audit and Quota Extension" (gratuito, leva dias) ou (b) continuar subindo à mão pela pasta `fila-manual`.

## Comentários — moderação
YouTube Studio → **Configurações → Comunidade → Padrões**: marque **"Reter comentários potencialmente inadequados para revisão"**. Em **Palavras bloqueadas**, cadastre (retêm o comentário para você revisar): suicídio, suicida, me matar, quero morrer, tirar minha vida, acabar com tudo, automutilação, me cortar, overdose, além de termos de ódio. Revise a fila de "Retidos" ao menos 1x por dia.
**Regra:** nunca responder com orientação clínica individual. Resposta-modelo: "Obrigado por compartilhar. Este canal é educativo e não substitui consulta; procure a UBS ou o CAPS da sua região. Em crise: CVV 188 (24 h) ou SAMU 192." Se houver risco imediato no comentário, responder só com isso e, se possível, denunciar/encaminhar conforme a plataforma.

## Desligar a qualquer momento
No `.env`: `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apague a linha). Ver também `relatorios/SE-ALGO-DER-ERRADO.md`.

## Criar o canal (se ainda não existir)
1. youtube.com → foto do perfil → **Criar um canal**. Nome: `Dr. Antônio Felipe · Saúde Mental`; identificador: `@drantoniofelipe.saudemental`.
2. Personalização: foto = `relatorios/youtube/canal/perfil.png`; banner = `canal/banner.png`; descrição = bloco de `canal/nome-e-sobre.md`; **trailer** = `canal/trailer.mp4`.
3. Configurações → Canal → Configurações avançadas → Público: **"Não, este canal não é para crianças"**.
