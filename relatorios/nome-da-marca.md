# Nome da marca: levantamento de variantes

**AGUARDA APROVAÇÃO DO DR. ANTÔNIO — nada foi alterado no site.**

Levantamento de 15/10/2026, somente leitura. O app Next fica em `apps/plataforma-saude-mental/` (não existe `app/` na raiz). Linhas aproximadas (grep dentro do escopo). Descoberta principal: o nome-alvo **já está aplicado** em rodapés, JSON-LD, layout do app e backend; o que falta são títulos de página, OG, /links, mentoria e YouTube.

## 1. Variantes e ocorrências

| Variante | Arquivo:linha | Contexto |
|---|---|---|
| **A. Portal de Saúde Mental Doutor Antônio Felipe Garabito** (alvo) | public/index.html:23 (JSON-LD name), 736 (marca__nome), 793 (rodapé) | Site |
| A | public/artigo.html:152,204; blog.html:126,178; instagram.html:104,156; privacidade.html:66,163 | Site (cabeçalho e rodapé) |
| A | apps/plataforma-saude-mental/app/layout.js:22-23 | App Next (title default e template) |
| A | backend/lib/renderizarArtigo.js:163 | JSON-LD dos artigos |
| A | backend/lib/ideacao.js:26; rascunhoArtigo.js:29 | Prompts de sistema |
| A | backend/lib/vinheta.js:14 | Vinhetas de áudio |
| A | backend/lib/redesV2/arte.js:14; conteudo.js:11; checagem.js:44 | Crédito "Conteúdo do Portal..." em capas/legendas |
| A | scripts/youtube/lib.js:213 | 1ª linha da descrição dos vídeos |
| A | package.json:5 (description) | Descrição do projeto |
| **B. Saúde Mental · Doutor Antônio Felipe** | public/index.html:6,15 | `<title>` e og:title da home |
| B | public/blog.html:6,15; instagram.html:6,15; artigo.html:6,15 | title e og:title ("Artigos —", "Do Instagram —", "Artigo —" + B) |
| B | public/privacidade.html:6; 404.html:7; admin.html:6 | title |
| **C. Dr. Antônio Felipe** (nome curto) | public/links.html:6 | title "Links · Dr. Antônio Felipe" |
| C | apps/.../app/Header.jsx:32 | Nome no cabeçalho do app |
| C | public/mentoria.html:6,11 | title/og: "Mentoria e Consultoria em Saúde Mental · Dr. Antônio Felipe" |
| **D. Portal de Saúde Mental · Dr. Antônio Felipe** | public/mentoria.html:77 | Link "voltar" do topo |
| **E. Portal de Saúde Mental & Narrações em Áudio** | public/links.html:57 | Rótulo do botão 3 (definido no CLAUDE.md §3.C) |
| **F. Dr. Antônio Felipe · Saúde Mental** | scripts/youtube/gerarCanal.js:14 (NOME); relatorios/youtube/canal/nome-e-sobre.md:3 | Nome do canal do YouTube |
| **G. Portal de Saúde Mental e áudios** | relatorios/linkedin/perfil/perfil-linkedin.md:32 | Rótulo de link no LinkedIn (headline/Sobre usam só "Dr. Antônio Felipe") |
| **H. Técnicos** | package.json:2 `drsaudemental`; apps/.../package.json:2 `plataforma-saude-mental`; assets/marca/placa-dr-antonio-felipe-*.png | Nomes de projeto e arquivo |
| Metadados do app | apps/.../app/*/page.js (Artigos, Blog, Links, Mentoria em Saúde Mental, Privacidade, Ferramenta Clínica) | Só o título da página; herdam o template A (OK) |

Não encontrado nos arquivos do escopo: "Plataforma Integrada" e "Dr Saúde Mental" (só "Sistema Integrado" em `ferramentas/sistema-integrado-saude-mental.jsx`, nome de ferramenta clínica), e nenhum `og:site_name` em `public/*.html`. As capas geradas (`gerar_capas_artigos.py` etc.) e `legendaInstagram.js` não foram lidos a fundo; `legendaInstagram.js` e `conformidadeCfm.js` não contêm nome de marca.

Total: 8 variantes (A a H), cerca de 45 ocorrências (A: 24, B: 12, C a G: 9).

## 2. Variantes legítimas por regra (NÃO trocar)

- **Assinatura de autor** "Dr. Antônio Felipe · Médico · CRM-BA 41322" (3 e 5 linhas): identificação CFM, não é nome de marca. Também `backend/lib/conformidadeCfm.js:22` e `tests/unit/assinatura-cfm.test.js`.
- **"Antonio Felipe Garabito Jr."** em `public/index.html:186`: exceção permanente, sem acento. Não mexer.
- **Textos de artigos** em `backend/data/` e `.mdx`: proibido alterar (hash de narração).
- **Rótulos de botão da /links** (CLAUDE.md §3.C): "Portal de Saúde Mental & Narrações em Áudio" (E) é nome de botão definido; manter.
- **Nome técnico** `drsaudemental` (projeto Vercel), `plataforma-saude-mental` (pasta do app), `pt-BR-AntonioNeural`, e-mail, @ do Instagram e URLs: sem acento e sem troca.
- **Título de página com prefixo de seção** ("Artigos —", "Mentoria ...") é padrão aceitável; só o sufixo da marca muda.
- **Nome do canal YouTube (F) e LinkedIn**: plataformas têm limite de caracteres e público próprio; a decisão de nome é do Dr. Antônio (ver proposta).

## 3. Proposta de padronização

**Nome completo** "Portal de Saúde Mental Doutor Antônio Felipe Garabito": rodapé e cabeçalho (já aplicado), JSON-LD `name`, `og:site_name` (adicionar `<meta property="og:site_name">` em todas as páginas de `public/`), `<title>` e `og:title` da **home** (hoje B), seção "Sobre"/privacidade, `layout.js` do app, crédito das capas, 1ª linha da descrição do YouTube.

**Forma curta** "Portal de Saúde Mental Dr. Antônio Felipe": sufixo de `<title>` das páginas internas (ex.: "Artigos · Portal de Saúde Mental Dr. Antônio Felipe", mentoria, links, 404, admin, privacidade), link "voltar" da mentoria (D), cabeçalho do app (`Header.jsx`, junto ao nome), nome do canal do YouTube e descrição curta do LinkedIn. Canal do YouTube: sugestão "Portal de Saúde Mental Dr. Antônio Felipe" (41 caracteres, dentro do limite); decisão do Dr. Antônio.

**Não tocar:** assinatura CFM, Garabito Jr., `backend/data`, `.mdx`, rótulos dos 4 botões da /links, nomes técnicos, `tests/`, `client_secret.json`, `.env`.

Observação: "Garabito" é sobrenome de família já usado no nome completo; confirmar com o Dr. Antônio se deve aparecer em todas as superfícies públicas (LGPD/identificação), pois a regra CFM de identificação não o exige.

## 4. Riscos e ordem de aplicação

Riscos:
- **SEO/OG**: troca de `<title>`/og:title muda snippet e cartão de compartilhamento já em cache (Instagram/LinkedIn exigem reraspagem); manter canonical e URLs.
- **Hash de narração**: não afeta se só os templates em `public/*.html` e o app forem alterados; NÃO tocar `backend/data`, `.mdx` nem o texto narrado (`backend/lib/narracao.js`). As vinhetas (`vinheta.js`) usam a marca A; mudar texto de vinheta exige regerar áudio (custo zero Edge-TTS, mas só com ordem).
- **Testes**: `tests/unit/assinatura-cfm.test.js` e `identificacao-unica.test.js` checam CRM/RQE/"NÃO ESPECIALISTA" 1 vez; nome de marca no `<title>` não deve afetá-los, mas rodar a suíte. CLAUDE.md proíbe editar `public/` exceto `links.html` e `vercel.json`, então **editar `public/*.html` exige autorização expressa do Dr. Antônio**.
- **Regra CFM**: manter o nome da marca separado da identificação; a marca nunca pode sugerir "psiquiatra" nem "especialista em saúde mental".
- **Acessibilidade/tamanho**: nome completo é longo; usar curto em `<title>` interno (SEO ideal até ~60 caracteres) e em cabeçalho mobile.

Ordem sugerida (cada passo com backup, `npm run auditoria`, dry-run e OK):
1. Decidir o nome (completo x curto) e a grafia de "Garabito".
2. `public/links.html` (único `public/` liberado) e rota; sufixo de title.
3. App Next: `Header.jsx` e metadados (sem impacto em narração).
4. Backend/redes: já alinhado; só conferir `checarEticaCfm`.
5. `public/*.html` (title, og:title, og:site_name), com autorização expressa.
6. YouTube (`gerarCanal.js`, `nome-e-sobre.md`) e LinkedIn (perfil).
7. Rodar `npm run auditoria`, testes e conferir OG nos depuradores (Meta/LinkedIn); deploy só com OK do Dr. Antônio.
