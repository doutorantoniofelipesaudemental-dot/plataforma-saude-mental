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

## 3. Human-in-the-loop (n8n e reciclagem de mídia)

- O fluxo de reciclagem (Spotify/YouTube para blog e redes) roda em servidor separado (fora deste repositório).
- **Obrigatório:** um nó de aprovação humana (e-mail formatado ou Telegram) antes de qualquer publicação gerada por IA, em blog, LinkedIn, Instagram, Facebook ou YouTube.
- Quem aprova confere auditoria, aviso de IA, aviso psicoeducacional e CVV 188 / SAMU 192 quando o tema pedir.

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
