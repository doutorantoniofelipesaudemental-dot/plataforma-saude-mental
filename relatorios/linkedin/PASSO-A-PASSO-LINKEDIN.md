# Passo a passo — deixar o LinkedIn publicando sozinho

Linguagem simples. ~30 minutos, uma vez (e de novo a cada ~60 dias, quando o token vence). **Nunca cole chaves em chat**: elas vão só no `.env` e no painel da Vercel.
Enquanto isto não estiver feito, **nada é publicado** e tudo fica pronto em `relatorios/linkedin/fila-manual/` (uma pasta por semana: `texto.txt` para copiar e colar e, nos carrosséis, o `carrossel.pdf`).

## 1. Página e app no LinkedIn
1. Em linkedin.com/company/setup/new crie uma **Página** (ex.: "Dr. Antônio Felipe · Saúde Mental"). O LinkedIn exige uma Página para criar o app.
2. Abra linkedin.com/developers/apps → **Create app**: nome `Portal Saúde Mental`, a Página criada, logotipo = `relatorios/linkedin/perfil/foto-perfil.png`.
3. Aba **Products**: peça **Share on LinkedIn** e **Sign In with LinkedIn using OpenID Connect** (ambos liberam na hora).
4. Aba **Auth**: em *Authorized redirect URLs* coloque `http://127.0.0.1:53683/callback`. Copie *Client ID* e *Primary Client Secret*.
5. No `.env` (pasta do projeto, **não** no chat):
   ```
   LINKEDIN_CLIENT_ID="..."
   LINKEDIN_CLIENT_SECRET="..."
   ```

## 2. Gerar a autorização
No terminal do Claude Code: `! npm run linkedin:autorizar`. Abra o endereço mostrado, entre com o LinkedIn do Dr. Antônio e aceite. O token é gravado no `.env` sem aparecer (também `LINKEDIN_AUTHOR_URN` e `LINKEDIN_TOKEN_VENCE_EM`).

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
