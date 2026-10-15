# Instagram: como criar o app na Meta, gerar o token e colocar na Vercel

Situação em 15/10/2026: o app antigo da Meta foi **excluído**, então nenhuma publicação no Instagram funciona. O novo token serve para o publicador das redes (`REDES_PUBLICACAO_ATIVA=true`). Quando o token novo for colocado na Vercel, a pausa antiga sai sozinha e os posts atrasados saem **um por dia**.

> Nunca cole o token em chat, e-mail ou arquivo do repositório. Ele só vai em dois lugares: no painel da Vercel e (se quiser conferir) no seu `.env` local, que o Git ignora.

## Antes de começar
1. O Instagram `@doutor.antoniofelipe.smental` precisa ser conta **Profissional** (Comercial ou Criador). No celular: Perfil → Configurações → Tipo de conta e ferramentas → Mudar para conta profissional.
2. Tenha à mão o login do Facebook que será o dono do app (pode ser o pessoal; o app não aparece para o público).

## Parte 1: criar o app (Instagram Login)
1. Acesse **https://developers.facebook.com** e entre. Se for a primeira vez, aceite os termos e confirme o e-mail e o telefone.
2. Clique em **Meus apps → Criar app**.
3. Nome do app: por exemplo `Portal Saúde Mental Publicador`. E-mail de contato: o do consultório. Clique em **Avançar**.
4. Em "Casos de uso", escolha **Gerenciar mensagens e conteúdo no Instagram** (ou "Outro" → tipo **Empresa**, se o caso de uso não aparecer). Avance até **Criar app**.
5. No painel do app, em **Configurações do app → Básico**, preencha:
   - **URL da política de privacidade:** `https://drantoniofelipemedico.com.br/privacidade`
   - **Categoria:** Saúde e bem-estar.
   Salve.
6. No menu da esquerda, abra **Casos de uso → Gerenciar mensagens e conteúdo no Instagram → Personalizar** (ou **Adicionar produto → Instagram**) e escolha **API com login do Instagram** ("API setup with Instagram login").

## Parte 2: ligar a conta do Instagram e gerar o token
1. Na tela **Configuração da API com login do Instagram**, procure **Gerar tokens de acesso** e clique em **Adicionar conta**.
2. Entre com o Instagram `@doutor.antoniofelipe.smental` e **autorize** as permissões. As duas que importam são:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
3. Se aparecer um convite para ser **testador** do app: no Instagram, vá em Configurações → **Apps e sites → Convites de testador** e aceite. (Com o app em modo "Desenvolvimento" isso basta para publicar na **sua própria conta**. Não precisa pedir revisão da Meta.)
4. Volte à tela do app e clique em **Gerar token** ao lado da conta. **Copie o token** (começa com `IGAA…`) e anote também o **ID da conta do Instagram** que aparece ali (um número).
5. Anote a **data de hoje**: esse token de longa duração vale **60 dias** e o sistema o renova sozinho toda segunda-feira (veja abaixo).

## Parte 3: colocar na Vercel
1. Acesse **https://vercel.com**, abra o projeto **drsaudemental**.
2. **Settings → Environment Variables.**
3. Edite (ou crie) estas duas variáveis, ambiente **Production**:
   - `INSTAGRAM_ACCESS_TOKEN` = o token copiado (marque como **Sensitive**).
   - `INSTAGRAM_ACCOUNT_ID` = o número da conta anotado.
4. Confirme que `REDES_PUBLICACAO_ATIVA` está `true`.
5. Vá em **Deployments**, abra o último deploy de produção e clique em **⋯ → Redeploy**. (A Vercel só lê variável nova num deploy novo.)

## Parte 4: conferir (opcional, mas recomendado)
No computador, coloque o mesmo token no arquivo `.env` (linhas `INSTAGRAM_ACCESS_TOKEN=` e `INSTAGRAM_ACCOUNT_ID=`) e rode:

```
node --env-file=.env backend/scripts/redes/verificarToken.js
```

O resultado deve mostrar **TOKEN VÁLIDO**, o nome da conta e `contaBateComINSTAGRAM_ACCOUNT_ID: true`. O script **não imprime o token** e não altera nada. Se disser inválido, repita a Parte 2 (o erro `código 190` quase sempre é token copiado incompleto ou conta não autorizada).

## O que acontece depois
- **Pausa:** a fila estava pausada desde 09/10 porque a Meta recusou o token antigo. Ao trocar o token, o sistema detecta a mudança e **retoma sozinho**.
- **Primeiro post:** o de 26/10 (e os atrasados, um por dia, os de texto mais lido primeiro), às 08:00 de Salvador, de segunda a sexta.
- **Renovação automática:** toda **segunda-feira, 09:00 de Salvador** (cron `renovar-token-instagram`), o sistema troca o token por um novo de 60 dias **antes de vencer**, guarda o novo cifrado no banco e registra `renovadoEm` e `expiraEm`. A renovação exige token com mais de 24 horas de vida. Por isso, na primeira segunda-feira após gerar o token, ela pode avisar "ainda cedo" (sem problema).
- **Freio de emergência:** se algo parecer errado, ponha `REDES_PUBLICACAO_ATIVA=false` na Vercel e faça Redeploy: nada é publicado.

## Se der problema
| Sintoma | O que fazer |
|---|---|
| Verificador diz `código 190` | Gerar o token de novo (Parte 2) e conferir se copiou inteiro |
| Verificador diz que o token **não é Instagram Login** | O token precisa começar com `IGAA`; gere pelo painel "API com login do Instagram" |
| `contaBateComINSTAGRAM_ACCOUNT_ID: false` | Corrigir `INSTAGRAM_ACCOUNT_ID` na Vercel com o número da Parte 2, passo 4 |
| Posts não saem depois do Redeploy | Rodar o verificador; ver `filaPausada` (deve ser `false`) |
