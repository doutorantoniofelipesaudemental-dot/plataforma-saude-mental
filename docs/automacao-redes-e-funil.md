# Automação de redes, captura e funil (diretrizes permanentes)

Aprovado pelo Dr. Antônio em 22/10/2026. Vale para qualquer automação que leve pessoas do miniaplicativo, das redes sociais ou do blog a um e-mail, a uma oferta ou a uma mensagem.

## 1. Meta (Instagram e Facebook)

- Automações de atração **não enviam mensagem direta** a quem comenta. O caminho é levar a pessoa à landing ou à bio oficial do Portal, onde ela escolhe receber o material (opt-in ativo).
- Mensagens automáticas só depois do consentimento ativo da pessoa, e só dentro das regras de mensagens da plataforma. Sem isso, o risco é bloqueio da conta.
- Nenhuma publicação automática sai sem a aprovação humana descrita na seção 3.

## 2. Captura de e-mail (miniaplicativo)

- Formulário opcional (`EmailOptIn`), com checkbox de consentimento LGPD obrigatório e campo oculto anti-robô.
- O payload envia **somente**: e-mail, consentimento, origem e produto. Respostas de humor, diário e escalas **não saem do navegador** (`localStorage`, por visitante).
- Rota: `POST /api/captura-email`. Sem as chaves, responde **503** com a mensagem "Serviço de envio temporariamente desativado por ausência de chaves de serviço." Não quebra o miniaplicativo.

### 2.1 Contrato do pedido (do navegador para `/api/captura-email`)

```json
{
  "email": "pessoa@exemplo.com",
  "consentimento": true,
  "website": ""
}
```

- `email`: obrigatório, até 254 caracteres, normalizado para minúsculas e sem espaços nas pontas.
- `consentimento`: obrigatório, deve ser `true` (checkbox LGPD).
- `website`: campo anti-robô. Deve chegar vazio; se vier preenchido, a rota finge sucesso (202) e não encaminha.

### 2.2 Contrato do envio (do backend para o webhook do Pocketsflow)

```
POST {POCKETSFLOW_WEBHOOK_URL}
Authorization: Bearer {POCKETSFLOW_API_KEY}
Content-Type: application/json
```

```json
{
  "email": "pessoa@exemplo.com",
  "origem": "miniaplicativo",
  "produto": "guia-pensamentos-ansiosos-21-dias",
  "consentimentoEm": "2026-10-22T18:00:00.000Z"
}
```

- `consentimentoEm`: data e hora (ISO 8601, UTC) em que a rota aceitou o consentimento. É a prova de consentimento que o funil guarda.
- **Nomes de campo a confirmar:** o código envia `consentimentoEm` (e não `consentimento_lgpd` e `timestamp`). Se o Dr. preferir esses nomes, a mudança é um PR pequeno em `backend/lib/funilEmail.js` (função `montarPayloadFunil`), com teste.
- **Contrato do Pocketsflow a confirmar:** o formato de autenticação (Bearer) e o do corpo precisam ser checados na documentação oficial do Pocketsflow antes de ativar. Até lá, o webhook pode recusar o envio (a rota responde 502 e não perde o pedido do navegador).
- Nenhum campo de saúde mental entra no payload. Isso é verificado por teste automatizado (`tests/unit/captura-funil-email.test.js`).

### 2.3 Respostas da rota

| Situação | HTTP | Corpo |
|---|---|---|
| Chaves ausentes | 503 | `{"erro":"Serviço de envio temporariamente desativado por ausência de chaves de serviço."}` |
| E-mail ou consentimento inválidos | 400 | `{"erro":"..."}` |
| Aceito (ou honeypot) | 202 | `{"ok":true}` |
| Webhook do funil falhou | 502 | `{"erro":"Não foi possível concluir a inscrição agora. Tente de novo em instantes."}` |
| Limite excedido (5 pedidos por minuto por IP) | 429 | `{"erro":"Muitas solicitações..."}` |

### 2.4 Como ativar em produção (painel da Vercel)

1. Abra o projeto do app na Vercel e vá em **Settings → Environment Variables**.
2. Adicione `POCKETSFLOW_WEBHOOK_URL` (endereço do webhook criado no Pocketsflow) e `POCKETSFLOW_API_KEY` (chave da API), para o ambiente **Production**.
3. Opcional: `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`, para o limite de requisições ser compartilhado entre instâncias.
4. Faça **redeploy** do projeto (Deployments → último deploy → Redeploy). Variáveis novas só valem a partir de um novo deploy.
5. Teste: `curl -X POST https://<dominio>/api/captura-email -H "Content-Type: application/json" -d '{"email":"teste@exemplo.com","consentimento":true}'`. Esperado: **202**. Antes da ativação, o mesmo teste responde **503**.
6. Não use e-mail real de paciente no teste; use um endereço de teste seu e remova-o do funil depois.

## 3. Human-in-the-loop (n8n e reciclagem de mídia)

- O fluxo de reciclagem (Spotify/YouTube para blog e redes) roda em servidor separado (fora deste repositório).
- **Obrigatório:** um nó de aprovação humana (e-mail formatado ou Telegram) antes de qualquer publicação gerada por IA, em blog, LinkedIn, Instagram, Facebook ou YouTube.
- Quem aprova confere auditoria, aviso de IA, aviso psicoeducacional e CVV 188 / SAMU 192 quando o tema pedir.
- Nenhuma automação publica sozinha. Não há publicação automática nem no n8n nem em rotas deste repositório.

## 4. Variáveis de ambiente (nomes; os valores ficam só na Vercel e no `.env` local)

| Variável | Uso | Obrigatória para ativar |
|---|---|---|
| `POCKETSFLOW_API_KEY` | autenticação do webhook do funil | sim |
| `POCKETSFLOW_WEBHOOK_URL` | endereço do webhook que inicia a régua de e-mails | sim |
| `EMAIL_SERVICE_API_KEY` | reservada para provedor de e-mail direto, se o funil sair do Pocketsflow | não |
| `UPSTASH_REDIS_REST_URL` | limite de requisições compartilhado entre instâncias | não (sem ela, o limite é por instância) |
| `UPSTASH_REDIS_REST_TOKEN` | token do Upstash | não |

## 5. Fora do repositório

- Configurações MCP (Blotato, Buffer, Metricool, Pocketsflow) ficam no ambiente local do Dr. (`~/.claude.json`), fora do Git.
- Preços, produtos e cupons do Pocketsflow são decisão comercial do Dr.; o código não os define.
- O deploy do miniaplicativo depende da conexão do projeto na Vercel com o repositório oficial (ver o relatório da rodada de unificação).
