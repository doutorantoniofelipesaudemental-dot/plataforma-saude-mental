# Auditoria da YouTube API — respostas prontas (português e inglês)

**Para que serve:** projetos do Google Cloud ainda não auditados têm os vídeos enviados pela API **forçados para "privado"**. A auditoria de conformidade do Google remove essa trava e os vídeos podem ficar públicos. Enquanto isso não sai, a pasta `relatorios/youtube/fila-manual/` continua valendo (subir à mão).

**Formulário (oficial):** https://support.google.com/youtube/contact/yt_api_form — título "YouTube Data API Services — Audit and Quota Extension Form".
Confira o que é verdadeiro antes de enviar. **Nunca coloque chaves, tokens nem o conteúdo do `.env` no formulário.**

> Os trechos marcados **(PREENCHA)** são dados pessoais/jurídicos que eu não tenho. Os demais descrevem exatamente o que o código faz hoje.

## O que o Dr. Antônio preenche (e onde achar cada item)
**Já preenchido com dados do projeto (18/10/2026):** número do projeto e ID do cliente OAuth (abaixo), e-mail de contato, URLs da política de privacidade, do site e da landing do canal (https://www.drantoniofelipemedico.com.br/youtube, sem player de terceiros). **Depende só de você:** nome legal completo, endereço legal, telefone, prints e vídeo de tela (itens 2, 3, 4, 6, 8, 9 e 10 da tabela).

Nada abaixo foi inventado: são dados seus. **Não coloque senha, chave secreta (`CLIENT_SECRET`) nem token no formulário.**

| # | Item do formulário | De onde vem | Onde achar |
|---|---|---|---|
| 1 | **Número do projeto** (Project number) | Google Cloud | console.cloud.google.com → escolha o projeto **portal-saude-mental-youtube** → **Painel (Dashboard)** → cartão **"Informações do projeto"** → **"Número do projeto"** (só dígitos). *Não* é o "ID do projeto" (esse tem letras). |
| 2 | **Nome legal completo** do solicitante | Você | Como está no seu documento de identidade / CRM. |
| 3 | **Tipo de solicitante** (pessoa física ou organização) e, se for organização, **nome legal da organização**, **empresa-mãe** e **porte** | Você / contador | Se atende como pessoa física: escolha pessoa física e "não se aplica" para empresa-mãe. Se o consultório tem CNPJ: razão social em seu cartão CNPJ (consulta pública da Receita Federal). Porte: 1 pessoa. |
| 4 | **Endereço legal** | Você | Endereço do consultório ou o endereço fiscal que consta no CNPJ/comprovante de residência. |
| 5 | **E-mail de contato** (principal, técnico e comercial) | Já definido | doutor.antoniofelipe.saudemental@gmail.com (o mesmo da política de privacidade e do Google Cloud). Confirme que você lê essa caixa: o Google responde por ela. |
| 6 | **Telefone de contato** (se o formulário pedir) | Você | O telefone do consultório (o mesmo que aparece no site, só como "Telefone"). |
| 7 | **ID do cliente OAuth** (Client ID) | Google Cloud | Menu ☰ → **APIs e serviços → Credenciais** → clique no nome do ID do cliente: o **ID do cliente** (termina em `.apps.googleusercontent.com`) é público e pode ir no formulário. **A chave secreta não vai.** |
| 8 | **Capturas de tela** da política de privacidade e da página inicial | Você (print) | Abra https://www.drantoniofelipemedico.com.br/privacidade e https://www.drantoniofelipemedico.com.br e tire um print de cada (a política já tem a seção "Uso da API do YouTube"). |
| 9 | **Captura do painel do Google Cloud** (projeto, YouTube Data API v3 ativada, escopos) | Você (print) | Google Cloud → **APIs e serviços → APIs ativadas** (mostra a YouTube Data API v3) e **Google Auth Platform → Acesso a dados** (mostra os escopos). |
| 10 | **Vídeo de tela** de 1–2 minutos (canal, pasta de vídeos prontos, comando de upload privado) | Você (grave) / Claude Code prepara o roteiro | Gravador de Tela do Windows (tecla **Windows + Alt + R**). Peça ao Claude Code o roteiro do que mostrar. |
| 11 | **Quando o formulário perguntar "como conheceu a API"**, representante do Google, IDs de proprietário de conteúdo, Google Ads | Você | Responda "pesquisa na documentação" e deixe os demais em branco / "não se aplica" (você não é parceiro do YouTube nem usa Google Ads aqui). |

---

## Passo a passo para enviar (você faz, ~30 minutos)
1. ✅ **Feito em 18/10/2026:** app "Em produção" no Google Cloud, política de privacidade e página inicial no ar, YouTube reautorizado (token definitivo).
2. Abra o formulário (link acima), entre com a conta Google dona do projeto e escolha **"Audit"** (auditoria de conformidade; em **"Request type"**, a opção de auditoria/cota adicional).
3. Copie as respostas abaixo, **campo por campo**, na língua que o formulário estiver (o Google costuma pedir em inglês: use a versão EN).
4. Anexe as **evidências**: (a) captura de tela da página `https://www.drantoniofelipemedico.com.br/privacidade`; (b) captura da página inicial `https://www.drantoniofelipemedico.com.br`; (c) captura do painel do Google Cloud mostrando o projeto, a API ativada e os escopos; (d) um vídeo curto de tela (1–2 min) mostrando o canal, a pasta de vídeos prontos e o comando de upload privado (peça ao Claude Code para gravar o roteiro do que mostrar).
5. Em **"Número do projeto"** (Project number): **741851919949** (é o prefixo do ID do cliente OAuth, que é público; confira em Google Cloud → Painel → "Número do projeto"). **ID do cliente OAuth:** `741851919949-dqtp625up9qjvc3p8lpg0npr9esm9n9v.apps.googleusercontent.com` (público; a chave secreta NUNCA vai no formulário).
6. Envie. O Google responde por e-mail (costuma levar de dias a semanas). Se pedirem mais informação, responda no mesmo e-mail com as respostas abaixo.
7. Quando aprovarem: avise o Claude Code. O teste seguinte é subir 1 vídeo e conferir que ficou **público** só se você ligar o freio (`YOUTUBE_PUBLICACAO_ATIVA=true`), o que **só você decide**.

---

## 1. Tipo de solicitação / Request type
**PT:** Auditoria de conformidade com as Políticas para Desenvolvedores dos Serviços de API do YouTube, para que os vídeos enviados pela API possam ser públicos. Não é necessária cota adicional: a cota padrão basta.
**EN:** Compliance audit against the YouTube API Services Developer Policies, so that videos uploaded through the API can be public. No additional quota is needed: the default quota is enough.

## 2. Organização e contato / Organization and contact
**PT:** Solicitante: pessoa física, médico, titular do canal. Nome legal completo: **(PREENCHA)**. Site principal: https://www.drantoniofelipemedico.com.br. Endereço legal: **(PREENCHA)**. Contato principal, técnico e comercial: doutor.antoniofelipe.saudemental@gmail.com. Porte: 1 pessoa (profissional autônomo).
**EN:** Applicant: individual, physician, owner of the channel. Full legal name: **(FILL IN)**. Main website: https://www.drantoniofelipemedico.com.br. Legal address: **(FILL IN)**. Primary, technical and business contact: doutor.antoniofelipe.saudemental@gmail.com. Size: one person (self-employed professional).

## 3. Modelo de negócio e uso / Business model and use case
**PT — descrição do uso:** Canal educativo de **saúde mental** em português (Brasil), do médico titular do canal. A aplicação é uma **automação de uso próprio**: envia os **meus próprios vídeos** (vídeos longos e Shorts educativos produzidos a partir de artigos do portal) para **o meu próprio canal**, com título, descrição, miniatura e playlists. Não é um aplicativo público, não tem outros usuários e **não acessa, coleta nem trata dados de terceiros** (nenhum dado de espectadores, comentários, inscritos ou analytics). Sem monetização direta pela API e sem venda de anúncios. Público-alvo do canal: pessoas adultas e profissionais de saúde em busca de informação educativa; o canal é marcado como **não feito para crianças**.
**EN — use case:** An educational **mental health** channel in Brazilian Portuguese, run by the physician who owns the channel. The application is a **single-owner automation**: it uploads **my own videos** (long-form videos and educational Shorts produced from articles on my portal) to **my own channel**, with title, description, thumbnail and playlists. It is not a public app, has no other users, and **does not access, collect or process any third-party data** (no viewer data, comments, subscribers or analytics). No direct monetization through the API and no ad sales. The channel's audience: adults and health professionals looking for educational information; the channel is set as **not made for kids**.

## 4. Visão geral do cliente da API / API client overview
- **Nome do aplicativo / App name:** Portal Saúde Mental (não contém a palavra "YouTube" / does not contain "YouTube").
- **Tipo de cliente OAuth / OAuth client type:** App para computador (Desktop app); roda só no computador do consultório, via agendador do sistema operacional.
- **URL de acesso / Access URL:** https://www.drantoniofelipemedico.com.br (site do portal; o cliente da API em si **não é acessível ao público**: roda localmente).
- **Política de Privacidade / Privacy Policy URL:** https://www.drantoniofelipemedico.com.br/privacidade
- **Termos de Serviço / Terms of Service URL:** não há termos próprios para esta automação de uso próprio / there are no separate terms for this single-owner automation. (Se o formulário exigir uma URL, informe a da política de privacidade.)
- **Publicamente acessível? / Publicly accessible?** PT: o site sim; o cliente da API não (uso privado). EN: the website yes; the API client no (private use).
- **Conta de demonstração / Demo account:** PT: não se aplica (sem login de usuários); posso gravar um vídeo de tela do fluxo completo. EN: not applicable (no user logins); I can provide a screen recording of the full flow.

> ✅ **Resolvido (16–17/10/2026):** a `/privacidade` já traz a seção "Uso da API do YouTube" (APROVADA pelo Dr. Antônio; ver `relatorios/politica-privacidade-aprovada.md`), com os links dos Termos do YouTube (https://www.youtube.com/t/terms), da Política de Privacidade do Google (https://policies.google.com/privacy) e de como revogar o acesso (https://myaccount.google.com/permissions). Conferido no ar em 18/10/2026.

## 5. Casos de uso, OAuth e cota / Use cases, OAuth and quota
- **Uso de OAuth 2.0 / Uses OAuth 2.0:** PT: sim, fluxo para aplicativo de computador (loopback), acesso offline. EN: yes, desktop-app (loopback) flow with offline access.
- **Escopos usados e por quê / Scopes used and why:**
  - `https://www.googleapis.com/auth/youtube.upload` — PT: enviar vídeos ao meu canal (`videos.insert`) e definir a miniatura (`thumbnails.set`). EN: upload videos to my channel (`videos.insert`) and set the thumbnail (`thumbnails.set`).
  - `https://www.googleapis.com/auth/youtube` — PT: criar e listar as minhas playlists temáticas e inserir o vídeo na playlist certa (`playlists.insert`, `playlists.list` com `mine=true`, `playlistItems.insert`). EN: create and list my own thematic playlists and add each video to the right playlist (`playlists.insert`, `playlists.list` with `mine=true`, `playlistItems.insert`).
- **Endpoints usados / Endpoints used:** `videos.insert`, `thumbnails.set`, `playlists.insert`, `playlists.list`, `playlistItems.insert`. **Não usa / Does not use:** `search.list`, comentários/comments, analytics, captions, dados de outros canais / other channels' data.
- **Volume esperado / Expected volume:** PT: 1 a 2 vídeos por dia (3 longos + 5 Shorts por semana, durante cerca de 14 semanas). Cada upload custa ~1.600 unidades + ~100 para miniatura e playlist: no máximo ~3.400 unidades/dia, **abaixo da cota padrão de 10.000/dia**. EN: 1–2 videos per day (3 long videos + 5 Shorts per week for about 14 weeks). Each upload costs ~1,600 units + ~100 for thumbnail and playlist: at most ~3,400 units/day, **below the default 10,000/day quota**.
- **Cota total solicitada / Total quota requested:** PT: nenhuma cota adicional (manter 10.000/dia). EN: no additional quota (keep 10,000/day).
- **Justificativa para `videos.insert` / Justification for `videos.insert`:** PT: publicar os vídeos educativos do próprio canal; sem esse endpoint o canal teria de ser alimentado manualmente. EN: publish the channel owner's own educational videos; without it the channel would have to be fed manually.
- **Justificativa para `search.list`:** PT: não utilizamos. EN: not used.

## 6. Como os dados são guardados / How data is stored
**PT:** A aplicação **não armazena dados de usuários do YouTube nem dados de terceiros**. Guarda apenas: (1) o **ID e a chave secreta do cliente OAuth** e o **refresh token** da própria conta do titular, **somente** no arquivo `.env` do computador do consultório (fora do repositório de código, ignorado pelo controle de versão e nunca exibido em logs nem enviado a terceiros); (2) o **ID dos vídeos** que ela mesma enviou e a data, em um arquivo local de controle da fila. Nenhuma métrica derivada é criada. O titular pode **revogar o acesso a qualquer momento** em https://myaccount.google.com/permissions e remover o token apagando a linha do `.env`. Há um "freio de emergência" (variável de ambiente) que desliga qualquer envio imediatamente.
**EN:** The application **does not store any YouTube user data or third-party data**. It only keeps: (1) the **OAuth client ID and secret** and the **refresh token** of the owner's own account, **only** in the `.env` file on the clinic's computer (outside the code repository, ignored by version control, never printed in logs or sent to third parties); (2) the **IDs of the videos** it uploaded itself and the date, in a local queue-control file. No derived metrics are created. The owner can **revoke access at any time** at https://myaccount.google.com/permissions and remove the token by deleting the `.env` line. An emergency brake (environment variable) turns off any upload immediately.

## 7. Conformidade e conteúdo / Compliance and content
**PT:** Conteúdo exclusivamente educativo, sem promessa de resultado, em conformidade com a Resolução CFM nº 2.336/2023 e com o aviso de uso de inteligência artificial da Resolução CFM nº 2.454/2026; todo vídeo traz CVV 188 · SAMU 192 e o aviso de que não substitui consulta. Os vídeos passam por conferência automática (identificação, crédito, ausência de marca d'água de terceiros) antes de entrar na fila. Não usamos a API para spam, para coletar dados nem para manipular métricas.
**EN:** Exclusively educational content, with no promise of results, in line with Brazilian Medical Council (CFM) Resolution 2,336/2023 and the AI-use notice required by CFM Resolution 2,454/2026; every video carries the Brazilian crisis lines (CVV 188 · SAMU 192) and a notice that it does not replace a medical consultation. Videos go through an automatic check (identification, credit, no third-party watermarks) before entering the queue. We do not use the API for spam, data collection or metric manipulation.

---

## Se o Google perguntar / If Google asks
- **"Por que um app de uso próprio precisa de auditoria?"** — PT: para que os vídeos enviados pela API possam ser públicos (sem a auditoria, o YouTube força privado). EN: so that videos uploaded through the API can be public (without the audit, YouTube forces private).
- **"Posso ver o app?"** — PT: envie o vídeo de tela e as capturas descritas no passo 4. EN: send the screen recording and screenshots described in step 4.
