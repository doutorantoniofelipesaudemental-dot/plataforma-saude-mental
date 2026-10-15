# Passo a passo — deixar o YouTube publicando sozinho

Linguagem simples. Tempo: ~40 minutos, uma vez. **Nunca cole chaves em chat.** Elas vão só no arquivo `.env` deste computador.
Enquanto você não fizer isso, **nada é publicado** e tudo fica pronto em `relatorios/youtube/fila-manual/` (uma pasta por semana, com vídeo, capa, título, descrição, tags e legenda `.srt` para subir à mão).

## 1. Criar o canal
1. Entre em youtube.com com a conta Google do consultório → foto do perfil → **Criar um canal**.
2. Nome: `Dr. Antônio Felipe · Saúde Mental`. Identificador (@): `@drantoniofelipe.saudemental`.
3. **Personalização do canal**: foto = `relatorios/youtube/canal/perfil.png`; banner = `canal/banner.png`; descrição = bloco de `canal/nome-e-sobre.md`; links = os 3 do mesmo arquivo; **trailer do canal** = suba `canal/trailer.mp4` (vale para quem ainda não é inscrito).
4. Configurações → Canal → Configurações avançadas → Público: **"Não, este canal não é para crianças"**.

## 2. Projeto no Google Cloud (a "porta" da API)
1. Abra console.cloud.google.com com a mesma conta → **Novo projeto** → nome `portal-saude-mental-youtube`.
2. Menu → **APIs e serviços → Biblioteca** → procure **YouTube Data API v3** → **Ativar**.
3. **Tela de permissão OAuth** (Google Auth Platform): tipo **Externo**; nome do app `Portal Saúde Mental`; e-mail de suporte = o do consultório.
4. Em **Público-alvo / Usuários de teste**: **+ Add users** → coloque o e-mail da conta dona do canal (você é o "testador").
5. **Importante:** depois que tudo funcionar, em "Público-alvo" clique **Publicar app** (status "Em produção"). Se ficar em "Teste", o Google apaga a autorização a cada **7 dias** e as publicações param.
6. **Credenciais → Criar credenciais → ID do cliente OAuth → Tipo: App para computador.** Copie o ID e a chave secreta.
7. No arquivo `.env` (na pasta do projeto, **não** no chat) coloque:
   ```
   YOUTUBE_CLIENT_ID="..."
   YOUTUBE_CLIENT_SECRET="..."
   ```

## 3. Gerar a autorização (token)
No terminal do Claude Code digite `! npm run youtube:autorizar`, abra o endereço que aparecer, entre com a conta do canal e aceite (aparece "app não verificado": **Avançado → Ir para o app**). O token é gravado no `.env` sem aparecer na tela. Depois: `! node --env-file=.env scripts/youtube/criarPlaylists.js` (cria as 10 playlists).

## 4. Ligar a publicação
No `.env`: `YOUTUBE_PUBLICACAO_ATIVA=true`. Para testar sem publicar: `! node --env-file=.env scripts/youtube/publicarYoutube.js --simular`.
O agendador do Windows roda o publicador todo dia (ver `scripts/agendar-tarefas-windows.ps1`; o computador precisa estar ligado nesse horário). Até 2 vídeos por dia (a cota diária da API permite ~6).

## 5. Atenção: vídeos privados por padrão
Projetos do Google Cloud **não verificados** têm os vídeos enviados pela API forçados para **privado**. O log (`relatorios/youtube/publicacao-log.md`) avisa. Soluções: (a) pedir a auditoria no formulário "YouTube API Services – Audit and Quota Extension" (gratuito, leva dias) ou (b) continuar subindo à mão pela pasta `fila-manual`.

## 6. Comentários (F.8) — moderação
YouTube Studio → **Configurações → Comunidade → Padrões**: marque **"Reter comentários potencialmente inadequados para revisão"**. Em **Palavras bloqueadas**, cadastre (retêm o comentário para você revisar): suicídio, suicida, me matar, quero morrer, tirar minha vida, acabar com tudo, automutilação, me cortar, overdose, além de termos de ódio. Revise a fila de "Retidos" ao menos 1x por dia.
**Regra:** nunca responder com orientação clínica individual. Resposta-modelo: "Obrigado por compartilhar. Este canal é educativo e não substitui consulta; procure a UBS ou o CAPS da sua região. Em crise: CVV 188 (24 h) ou SAMU 192." Se houver risco imediato no comentário, responder só com isso e, se possível, denunciar/encaminhar conforme a plataforma.

## Desligar a qualquer momento
`.env` → `YOUTUBE_PUBLICACAO_ATIVA=false` (ou apague a linha). Ver também `relatorios/SE-ALGO-DER-ERRADO.md`.
