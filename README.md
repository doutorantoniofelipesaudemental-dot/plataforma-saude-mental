# Doutor Saúde Mental — Dr. Antônio Felipe

Site institucional + blog da clínica, com formulário de agendamento gravado em
MongoDB. Backend em Express 5, front-end em HTML/CSS/JS puro (sem build),
publicado na Vercel.

---

## Estrutura

```
├── index.js                  Entrada local (delega para backend/index.js)
├── vercel.json               Roteamento: /api → lambda, resto → estáticos
├── backend/
│   ├── index.js              App Express: API + fallback estático
│   ├── lib/
│   │   ├── db.js             Conexão Mongoose com cache (serverless)
│   │   └── texto.js          slugify / escapeHtml
│   ├── models/
│   │   ├── Agendamento.js    Solicitações do formulário
│   │   └── Artigo.js         Posts do blog
│   ├── routes/
│   │   ├── agendamentos.js   POST público + GET/PATCH administrativos
│   │   └── artigos.js        Listagem/detalhe públicos + CRUD administrativo
│   ├── middleware/index.js   Banco, autenticação, limite de taxa, validação
│   ├── seed.js               Popula o blog (idempotente)
│   └── seed-artigos.js       Conteúdo inicial: 6 artigos
└── public/
    ├── index.html            Home: hero, áreas, etapas, artigos, formulário, FAQ
    ├── blog.html             Listagem com busca, filtro e paginação
    ├── artigo.html           Artigo individual + relacionados
    ├── privacidade.html      Política de privacidade (LGPD)
    └── assets/
        ├── css/style.css     Sistema de design completo
        └── js/               site.js (comum), home.js, blog.js, artigo.js
```

---

## Rodando localmente

```powershell
npm install
Copy-Item .env.example .env      # preencha MONGODB_URI e ADMIN_TOKEN
npm run seed                     # popula o blog com os 6 artigos
npm run dev                      # http://localhost:3000
```

O site sobe mesmo **sem** `MONGODB_URI`: as páginas renderizam normalmente e as
chamadas de API respondem `503` com mensagem clara. O blog fica vazio e o
formulário avisa que não conseguiu registrar — de propósito, para nunca fingir
que uma solicitação de consulta foi salva quando não foi.

---

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `MONGODB_URI` | sim | Conexão com o MongoDB Atlas |
| `MONGODB_DB` | não | Nome do banco, se a URI não o incluir |
| `ADMIN_TOKEN` | sim (para a área administrativa) | Autentica as rotas de gestão |
| `PORT` | não | Porta local (padrão `3000`) |

Gere o token com:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API

### Público

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status do serviço e do banco |
| `POST` | `/api/agendamentos` | Cria solicitação de agendamento |
| `GET` | `/api/artigos` | Lista publicados — `?categoria=&busca=&pagina=&limite=` |
| `GET` | `/api/artigos/categorias` | Categorias com contagem |
| `GET` | `/api/artigos/:slug` | Artigo + até 3 relacionados |

### Administrativo

Exige `Authorization: Bearer <ADMIN_TOKEN>` (ou header `x-admin-token`).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/agendamentos` | Lista solicitações — `?status=&pagina=&limite=` |
| `PATCH` | `/api/agendamentos/:id` | Muda status: `novo`, `em-contato`, `confirmado`, `realizado`, `cancelado` |
| `POST` | `/api/artigos` | Cria artigo |
| `PUT` | `/api/artigos/:slug` | Atualiza artigo |
| `DELETE` | `/api/artigos/:slug` | Remove artigo |

Exemplo — ver os agendamentos recebidos:

```powershell
Invoke-RestMethod "https://SEU-DOMINIO/api/agendamentos" `
  -Headers @{ Authorization = "Bearer $env:ADMIN_TOKEN" } |
  Select-Object -ExpandProperty itens |
  Format-Table nome, email, telefone, dataPreferida, status
```

---

## Publicando artigos

Duas opções:

1. **Pelo seed** — adicione o objeto em `backend/seed-artigos.js` e rode
   `npm run seed`. É idempotente: reaplica por `slug`, preservando o contador
   de visualizações.
2. **Pela API** — `POST /api/artigos` com o token administrativo.

Campos: `titulo`, `resumo`, `conteudo` (HTML), `categoria`, `tags`,
`tempoLeitura`, `imagemCapa`, `publicado`, `publicadoEm`. O `slug` é gerado a
partir do título se não for informado.

Categorias válidas: `Ansiedade`, `Depressão`, `Sono`, `Relacionamentos`,
`Autocuidado`, `Tratamento` — a lista fica em `backend/models/Artigo.js`.

> O `conteudo` é inserido como HTML na página. Trate-o como conteúdo de autor
> confiável: só grave por rotas autenticadas.

---

## Decisões de projeto que valem saber

**O formulário não coleta dado clínico.** Pede apenas nome, contato e
preferência de horário, com aviso explícito para não descrever sintomas. Isso
mantém o site fora do escopo de dado sensível de saúde da LGPD e evita que
informação clínica trafegue por um canal que não é prontuário.

**Consentimento é obrigatório no schema**, não só no HTML — `consentimentoLGPD`
tem validador que rejeita `false` no banco.

**Anti-spam em três camadas:** honeypot invisível no formulário, limite de
5 envios/minuto por IP e bloqueio de duplicata por e-mail em 10 minutos. Em
serverless o limite por IP é por instância, então a checagem de duplicata no
banco é a barreira que realmente segura reenvio.

**Faixa de crise (CVV 188 / SAMU 192)** aparece na home, no rodapé de todas as
páginas e nos artigos sobre depressão e apoio. Site de saúde mental precisa
dizer, em lugar visível, que não atende emergência.

**Conteúdo psicoeducativo, nunca prescritivo.** Os artigos explicam sintomas e
encaminham para avaliação; não sugerem diagnóstico nem conduta medicamentosa.
Vale manter esse padrão em textos novos.

---

## Deploy na Vercel

O `vercel.json` já está configurado:

- `/api/*` → função serverless (`backend/index.js`)
- demais rotas → arquivos estáticos da CDN
- `/blog`, `/artigo/<slug>`, `/privacidade` → URLs limpas

```powershell
vercel --prod
```

Antes do primeiro deploy, cadastre `MONGODB_URI` e `ADMIN_TOKEN` em
**Settings → Environment Variables** e libere o IP da Vercel no Network Access
do Atlas (ou `0.0.0.0/0`, já que a Vercel não tem IP fixo nos planos padrão).

---

## Dados oficiais já cadastrados

| Campo | Valor |
|---|---|
| Nome | Dr. Antônio Felipe |
| Marca/clínica | Doutor Saúde Mental |
| Registro | CRM-BA 41322 · RQE 26638 |
| Especialidade | Medicina de Família e Comunidade |
| Pós-graduações | Psiquiatria, Saúde Mental, Medicina do Trabalho, Atenção Psicossocial, Neuropsicologia |
| E-mail | doutor.antoniofelipe.saudemental@gmail.com |
| Instagram | [@doutor.antoniofelipe.smental](https://instagram.com/doutor.antoniofelipe.smental) |

Esses dados aparecem no cabeçalho, na seção "Sobre" da home, no rodapé das
quatro páginas e na política de privacidade.

## Pendências para a clínica preencher

Estes pontos ainda estão com valor genérico no código e precisam ser
trocados antes de ir ao ar:

- **Endereço do consultório** — a home diz que é informado na confirmação.
- **Telefone/WhatsApp** — não há número no site ainda.
- **Horários de atendimento** — "seg–sex, 8h–19h" é um exemplo.
- **Valores e convênios** — o FAQ remete ao contato de confirmação.
