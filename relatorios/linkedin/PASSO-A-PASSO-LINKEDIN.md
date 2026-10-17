# Passo a passo — deixar o LinkedIn publicando sozinho

Linguagem simples. ~30 minutos, uma vez (e de novo a cada ~60 dias, quando o token vence). **Nunca cole chaves em chat**: elas vão só no `.env` e no painel da Vercel.
Enquanto isto não estiver feito, **nada é publicado** e tudo fica pronto em `relatorios/linkedin/fila-manual/` (uma pasta por semana: `texto.txt` para copiar e colar e, nos carrosséis, o `carrossel.pdf`).

## DECISÃO DE 17/10/2026: publicação MANUAL no perfil pessoal (sem API)
O LinkedIn será usado **no perfil pessoal** (https://www.linkedin.com/in/doutor-antonio-felipe-undefined-70990b438), sem a API de empresas e sem credencial do Developer Portal. Tudo abaixo, a partir da seção "1. Página e app", fica **arquivado** (só se um dia for usar a API).

**Como funciona hoje** (segunda, quarta e sexta, 19:30 Bahia; primeiro post: 28/10/2026):
1. Às **19:25** a tarefa `DrSM-LinkedIn-Lembrete` abre no Bloco de Notas o arquivo `relatorios/linkedin/POST-DE-HOJE.md` e já deixa o texto copiado (só abre se houver post no dia).
2. Abra o LinkedIn no perfil pessoal → **Começar publicação** → cole (Ctrl + V) → confira → **Publicar**. Nos carrosséis, anexe o PDF indicado no arquivo.
3. Marque como feito: `! npm run linkedin:marcar -- <id do post>` (o id aparece no arquivo).
- Ver o post do dia a qualquer hora: `! npm run linkedin:hoje -- --copiar --abrir` (`--linkedin` abre a caixa de publicação no navegador).
- Calendário completo e situação de cada post: `relatorios/linkedin/FILA-MANUAL.md` (também resumido em `relatorios/ESTADO-GERAL.md`, atualizado pela rotina de segunda e por `! npm run linkedin:fila`).
- O arquivo avisa se o **texto do site** citado no post ainda não saiu (o link daria página inexistente): nesse caso espere ou adie o post.
- **Não** usamos robô de navegador para publicar: automatizar o perfil pessoal viola os termos do LinkedIn e pode restringir a conta. A automação é só o lembrete e o texto pronto.
- Dica opcional: o endereço do perfil tem "undefined" no meio (o LinkedIn gerou assim). Em *Perfil → Editar perfil público e URL* você pode trocar por algo limpo, como `linkedin.com/in/dr-antonio-felipe`; depois me avise para atualizar os arquivos.

## Onde você está (conferido em 16/10/2026, à noite)
- **Nada feito ainda:** nenhuma credencial do LinkedIn está no `.env` (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` ausentes) e o freio `LINKEDIN_PUBLICACAO_ATIVA` não existe, então nada é publicado.
- A fila de 43 itens está pronta e a simulação do primeiro post passou (texto, assinatura de 3 linhas e crédito do Portal). Quando as credenciais entrarem, o primeiro post sai em 28/10 às 19:30 (Bahia), se o freio estiver ligado.
- Enquanto isso, copie e cole os textos da pasta `relatorios/linkedin/fila-manual/`.

## 1. Página e app no LinkedIn
1. **Criar a Página.** Abra linkedin.com/company/setup/new → **Empresa** (ou "Pequena empresa") → nome: `Dr. Antônio Felipe · Saúde Mental` → o endereço (URL) que o LinkedIn sugerir → **Criar página**. O LinkedIn exige uma Página para criar o app.
2. **Criar o app.** Abra linkedin.com/developers/apps → **Create app**: nome `Portal Saúde Mental`; *LinkedIn Page*: escolha a Página do passo 1; *Privacy policy URL*: `https://www.drantoniofelipemedico.com.br/privacidade`; logotipo: `relatorios/linkedin/perfil/foto-perfil.png`; marque que aceita os termos → **Create app**.
3. **Verificar o app com a Página.** No app, aba **Settings** → em *App settings*, **Verify** (ao lado da Página) → **Generate URL** → abra o endereço gerado (você, como administrador da Página, clica em **Approve / Aprovar**). Volte ao app: deve aparecer "Verified".
4. **Pedir os produtos.** Aba **Products** → **Share on LinkedIn** → **Request access**; e **Sign In with LinkedIn using OpenID Connect** → **Request access**. Aceite os termos. (Ambos costumam liberar na hora; se algum ficar "em análise", espere o e-mail do LinkedIn.)
5. **URL de redirecionamento.** Aba **Auth** → *OAuth 2.0 settings* → **Authorized redirect URLs for your app** → clique no lápis → **Add redirect URL** e cole **exatamente** (sem espaço, sem barra no fim, com `http` e não `https`):
   ```
   http://127.0.0.1:53683/callback
   ```
   Salve. Na mesma aba, copie o *Client ID* e clique no ícone de copiar do *Primary Client Secret*.
6. **Colar no `.env` com o Bloco de Notas** (nunca no chat): abra `C:DRSAUDEMENTAL.env` com o Bloco de Notas (botão direito → Abrir com → Bloco de Notas; se não aparecer, Exibir → Itens ocultos) e acrescente no fim, com os **nomes exatamente assim** (maiúsculas, `=` logo depois do nome, valor entre aspas):
   ```
   LINKEDIN_CLIENT_ID="(o Client ID copiado)"
   LINKEDIN_CLIENT_SECRET="(o Primary Client Secret copiado)"
   ```
   Salve (Ctrl + S). **Não** crie ainda a linha `LINKEDIN_PUBLICACAO_ATIVA` (o freio fica desligado até você decidir).

## 2. Gerar a autorização
No terminal do Claude Code, digite exatamente:
```
! npm run linkedin:autorizar
```
Abra o endereço que aparecer (**neste computador**, porque o retorno vai para `127.0.0.1:53683`), entre com o LinkedIn do Dr. Antônio e clique em **Permitir**. O terminal mostra que gravou, sem exibir o token: ele vai para o `.env` (junto com `LINKEDIN_AUTHOR_URN` e `LINKEDIN_TOKEN_VENCE_EM`). Para conferir, avise o Claude Code: ele só olha o tamanho dos valores.

## 3. Levar para a Vercel (é lá que o cron roda)
Vercel → projeto `drsaudemental` → Settings → Environment Variables (Production): `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN`, `LINKEDIN_TOKEN_VENCE_EM` (copie do `.env`) e **`LINKEDIN_PUBLICACAO_ATIVA=true`** → **Redeploy**.
O cron `/api/cron/publicar-linkedin` roda **segunda, quarta e sexta às 19:30 (Bahia)** — no plano Hobby a Vercel pode atrasar até ~1 hora. Primeira publicação: **quarta, 28/10/2026**. Publica 1 texto por vez e só se o texto do site já estiver no ar.

## 4. Renovar o token
O token de apps comuns dura ~60 dias e **não se renova sozinho**. A rotina de segunda-feira avisa quando faltarem menos de 15 dias; repita os passos 2 e 3.

## 5. O que é manual (de propósito)
- **Carrosséis em PDF** (6): LinkedIn → Criar publicação → **Adicionar documento** → `carrossel.pdf`; legenda = `texto.txt` da mesma pasta.
- **Newsletter mensal** (16/11, 14/12, 18/01): `relatorios/linkedin/newsletters/*.md` → LinkedIn → Escrever artigo → Criar newsletter.
- **Post da /mentoria**: é PROPOSTA (`propostas/post-mentoria-PROPOSTA.md`); só entra com o seu "aprovo".

## Desligar
Vercel → `LINKEDIN_PUBLICACAO_ATIVA=false` → Redeploy. Ver `relatorios/SE-ALGO-DER-ERRADO.md`.
