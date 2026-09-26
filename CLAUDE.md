# SYSTEM DESIGN & FRONTEND TASTE RULES (DR. S�UDE MENTAL)

## 1. DESIGN TASTE & ANTI-AI PATTERNS (design-taste-frontend)
- PROHIBITED: Generic purple/violet gradients (#6366f1, #8b5cf6), oversized glassmorphism shadows, neon glow buttons.
- PROHIBITED: Centered hero text without visual hierarchy, generic stock illustrations.
- PREFER: Clean, warm, clinical yet human design aesthetic suitable for mental health. Soft slate, calm teals, high-contrast readable typography.

## 2. IMPECCABLE UI/UX RULES (impeccable)
- Use strict 8px spacing scale (gap-2, gap-4, gap-8, p-4, p-6, etc.).
- Ensure text contrast meets WCAG AA standards.
- Typography: Strict font sizing hierarchies, legible line heights (leading-relaxed for long-form blog articles).

## 3. MOTION & ANIMATION (emil-design-eng)
- Always use natural physics springs or refined cubic-bezier curves for micro-interactions (hover, modals, menus).
- Duration: Micro-interactions between 150ms-250ms. No sluggish 500ms transitions.
- Prefer Tailwind CSS transitions or Framer Motion springs (type: "spring", stiffness: 300, damping: 30).

## 4. GOOGLE OFFICIAL PLAYBOOKS (google/skills)
- GOOGLE ADS DIAGNOSTICS: Analyze conversion drops, impression share losses, budget constraints, and ad relevance scores using official GAQL metrics.
- GOOGLE ANALYTICS & FIREBASE: Enforce event-driven architecture, GA4 property schemas, and serverless Cloud Functions best practices.
- GEMINI INTEGRATION: Optimize prompt structures, token usage, and structured JSON schema responses when interfacing with Google AI models.

## 5. THREE.JS — CENAS 3D & CURSOR (threejs-3d)
- USE: Cenas 3D leves e ambientais (partículas respirando, gradiente volumétrico, esfera/malha suave que reage ao cursor). Nunca 3D decorativo que compete com o conteúdo clínico.
- CURSOR: Interação de cursor sempre com lerp/damping (fator 0.05-0.12), nunca seguindo o ponteiro 1:1. Movimento deve parecer inércia, não teleporte.
- PERFORMANCE: `dpr` limitado a [1, 2], `frameloop="demand"` quando a cena é estática, geometrias instanciadas para partículas. Meta: 60fps em mobile mid-range.
- ACESSIBILIDADE: Respeitar `prefers-reduced-motion` — degradar para imagem/gradiente estático. Canvas sempre `aria-hidden` com fallback de conteúdo real no DOM.
- PROIBIDO: Neon wireframes genéricos, blobs iridescentes roxos, partículas "starfield" de template. A paleta 3D segue a regra 1 (slate suave, teais calmos).

## 6. GSAP — SCROLL & TIMELINES (gsap-scroll)
- SCROLLTRIGGER: Revelações ancoradas em `start: "top 80%"`, `once: true` para conteúdo textual (não re-animar leitura). `scrub` só para narrativas visuais, nunca para texto de artigo.
- TIMELINES: Sequências nomeadas e reutilizáveis; stagger de 0.06-0.12s para listas. Encadear com timeline em vez de delays manuais empilhados.
- EASING: `power2.out` para entradas, `power2.inOut` para transições, `expo.out` para elementos que precisam de autoridade. Sem `linear` em micro-interações.
- PERFORMANCE: Animar apenas `transform` e `opacity`. Usar `will-change` cirurgicamente e limpar no `onComplete`. Sempre `gsap.context()` + `revert()` no cleanup do React.
- PROIBIDO: Parallax exagerado, pin de seções que prendem o usuário, scroll-jacking. Conteúdo de saúde mental precisa ser lido sem obstáculo.

## 7. DESIGN DNA — EXTRAÇÃO DE IDENTIDADE (design-dna)
- OBJETIVO: Antes de criar telas novas, extrair o DNA visual existente — cores reais em uso, escala tipográfica, raios, sombras, densidade de espaçamento, vocabulário de componentes.
- ENTREGÁVEL: Tokens consolidados (CSS vars / Tailwind theme) como fonte única da verdade. Nenhum valor hardcoded em componentes novos.
- CONSISTÊNCIA: Todo componente novo deve ser justificável a partir do DNA. Se exigir um token inédito, o token entra no sistema primeiro — nunca uma exceção local.
- VOZ DA MARCA: O DNA do Dr. Saúde Mental é clínico-acolhedor: autoridade médica sem frieza, calma sem infantilização. Cada decisão visual passa por esse filtro.

## 8. MOTION DESIGN — RITMO & TRANSIÇÕES (motion-design)
- HIERARQUIA DE DURAÇÃO: micro-interação 150-250ms; transição de componente 250-400ms; transição de página/rota 400-600ms. Nunca inverter essa escala.
- ORIGEM: Movimento nasce do elemento que o disparou (transform-origin no gatilho). Modais e menus escalam de 0.96 → 1, nunca aparecem por fade puro.
- RITMO: Coreografar com stagger, não animar tudo simultaneamente. Entrada e saída assimétricas — saída ~30% mais rápida que a entrada.
- CONTINUIDADE: Elementos compartilhados entre estados usam layout animation / shared element, não um crossfade que apaga o contexto.
- REDUCED MOTION: `prefers-reduced-motion: reduce` → substituir deslocamento por opacidade curta (≤120ms). Reduzir movimento, nunca remover feedback.

## 9. GENJUTSU — DIREÇÃO CRIATIVA & ACABAMENTO (genjutsu)
- PAPEL: Camada final de direção criativa. Roda depois de a funcionalidade estar pronta, para elevar o resultado de "correto" a "memorável".
- CHECKLIST DE ACABAMENTO: óptica antes de matemática (alinhamento óptico, ajuste de letter-spacing em títulos grandes, sombras com cor em vez de preto puro, bordas de 1px com contraste real).
- ESTADOS COMPLETOS: default, hover, focus-visible, active, loading, empty, error e success — nenhuma tela é entregue com estados faltando.
- DETALHE INTENCIONAL: No máximo um momento de encanto por tela, e ele deve reforçar a mensagem clínica (calma, clareza, cuidado) — nunca ser efeito por efeito.
- CRITÉRIO DE APROVAÇÃO: A tela passa se parecer feita por um estúdio de design de produto, não por um gerador. Se qualquer padrão proibido da regra 1 aparecer, reprovar e refazer.

## 10. MARKETING SKILLS — SEO, COPY & GROWTH (marketing-skills)
- SEO: Estrutura de conteúdo orientada a intenção de busca (informacional, transacional, navegacional). Hierarquia de heading única por página, metadados descritivos, dados estruturados (schema.org) para artigos de saúde e FAQ.
- COPY: Benefício antes de feature, prova antes de promessa. Título carrega a ideia central sozinho — nunca depende do parágrafo seguinte para fazer sentido.
- CTA: Um objetivo por tela. Texto do botão descreve a ação real ("Agendar consulta"), nunca genérico ("Clique aqui", "Saiba mais").
- GROWTH: Toda página de conversão precisa de hipótese testável e métrica de sucesso definida antes de ir ao ar. Funil claro: atenção → confiança → ação.
- COMPLIANCE: Conteúdo de saúde mental nunca promete cura, resultado garantido ou diagnóstico à distância. Linguagem responsável é inegociável, mesmo sob pressão de conversão.

## 11. STOP-SLOP — ANTI-AI WRITING (stop-slop)
- VÍNCULO COM A REGRA 1: Esta regra é a extensão textual da Regra 1 (Design Taste & Anti-AI Patterns). O mesmo filtro anti-genérico que bane gradiente roxo e glassmorphism em excesso na interface se aplica à escrita — nenhuma frase pode parecer saída de um gerador de texto em massa, assim como nenhuma tela pode parecer saída de um gerador de UI em massa.
- PROIBIDO: Abrir com "No mundo atual...", "Na era digital...", ou qualquer frase-guarda-chuva. Proibido excesso de "além disso", "portanto", "em suma" como muletas de transição.
- PROIBIDO: Listas de três adjetivos em série ("rápido, eficiente e confiável"), emdash decorativo em excesso, parágrafos-conclusão que só resumem o que já foi dito.
- PREFERIR: Frases com peso informacional real — cada frase adiciona um fato, decisão ou nuance nova. Cortar qualquer frase que possa ser removida sem perda.
- VOZ HUMANA: Variação de ritmo entre frases curtas e longas. Especificidade concreta (números, exemplos, nomes) em vez de generalidade vaga.
- TESTE FINAL: Se o texto poderia ter sido escrito sobre qualquer clínica, qualquer produto, qualquer tema — reescrever até ficar específico do Dr. Saúde Mental.

## 12. UI/UX PRO MAX (ui-ux-pro-max)
- VÍNCULO COM A REGRA 2: O design de experiência, arquitetura de informação e redução de fricção cognitiva nos formulários de agendamento DEVEM herdar diretamente as diretrizes de hierarquia tipográfica, contraste WCAG AA e espaçamento de 8px estipuladas na Regra 2 (Impeccable UI/UX System).
- HIERARQUIA VISUAL: Um único elemento de maior peso por tela (âncora visual). Todo o resto se organiza em relação a ele — tamanho, cor e posição nunca competem entre si.
- FLUXO: Nenhuma tela sem saída clara. Todo caminho tem um próximo passo óbvio, inclusive estados de erro e vazio.
- AFFORDANCE: Elemento clicável parece clicável sem precisar de instrução — cursor, sombra sutil, contraste de cor. Nenhum "toque mágico" invisível.
- FRICÇÃO INTENCIONAL: Reduzir cliques em tarefas frequentes (agendar, contatar); adicionar confirmação explícita em ações sensíveis (cancelar consulta, excluir dado de paciente).
- ACESSIBILIDADE: Navegação por teclado completa, `focus-visible` sempre visível, alvo de toque mínimo de 44x44px. Saúde mental atende públicos com limitações variadas — acessibilidade não é opcional.

## 13. REMOTION VIDEO — REACT ANIMATIONS (remotion-video)
- VÍNCULO COM AS REGRAS 3 E 7: Vídeo não é um sistema visual paralelo. Toda animação herda a Regra 3 (Motion & Animation — springs, easing, duração) e toda decisão de cor, tipografia e voz herda a Regra 7 (Design DNA). Nenhuma composição Remotion pode divergir desses dois sistemas.
- ESTRUTURA: Composições declaradas por cena (`<Sequence>`), nunca lógica de tempo hardcoded em `setTimeout`. Duração e fps definidos na composição raiz, nunca mágicos espalhados pelo código.
- INTERPOLAÇÃO: `interpolate()` com `extrapolateLeft`/`extrapolateRight: "clamp"` sempre explícito. Easing herdado da Regra 3 (springs naturais ou cubic-bezier refinado, nunca `linear`).
- SINCRONIA: Áudio e legendas alinhados a frame exato via `useCurrentFrame()`, nunca por estimativa de tempo real. Testar em `fps` diferentes antes de exportar.
- PERFORMANCE DE RENDER: Assets pesados pré-otimizados (imagens comprimidas, vídeo fonte já no aspect ratio final) antes de entrar na composição — nunca redimensionar em tempo de render.
- MARCA: Vídeos seguem a mesma paleta, tipografia e voz clínico-acolhedora do DNA de design consolidado na Regra 7 — nunca um template de vídeo genérico desalinhado da identidade visual.

## 15. HIGH-CONVERSION LANDING PAGES & CINE-EXPERIENCES (high-conversion-landing-pages)
- VÍNCULO COM AS REGRAS 3, 6, 7 E 12: Toda landing page cinematográfica herda simultaneamente a Regra 3 (Motion & Animation — springs, easing, hierarquia de duração), a Regra 6 (GSAP — Scroll & Timelines), a Regra 7 (Design DNA — tokens e voz de marca) e a Regra 12 (UI/UX Pro Max — hierarquia visual, fluxo e affordance). Uma cine-experience que ignore qualquer uma dessas quatro regras é reprovada antes de chegar ao portão de qualidade.
- FRONTEND DESIGN — 27 DESIGN SKILLS: Biblioteca de padrões de composição validados (hero, prova social, comparação, storytelling de produto, objeção-resposta, prova de resultado, encerramento) usada como vocabulário comum. Nenhuma seção de LP é construída do zero sem primeiro verificar se um desses padrões já resolve o problema.
- CINE-SCROLL: Narrativa dirigida pelo scroll como se fosse corte de cena — cada seção é um "plano", com entrada, permanência e saída coreografadas (Regra 3 + Regra 6). Ritmo de leitura nunca é sacrificado por espetáculo; texto crítico segue `once: true` mesmo dentro de uma sequência cinemática.
- SCROLL WORLD: Ambiente contínuo (não seções isoladas) onde profundidade, paralaxe sutil e camadas visuais reforçam progressão de uma única história — não decoração paralela. Todo elemento de mundo tem `prefers-reduced-motion` como fallback estático coerente com a Regra 3.
- FORJA-LP — PORTÕES DE QUALIDADE DE CONVERSÃO: Pipeline de produção da LP com portões obrigatórios antes de publicar — (1) hierarquia e legibilidade (Regra 2/12), (2) DNA de marca e voz clínico-acolhedora (Regra 7), (3) performance de motion em mobile mid-range (Regra 3/6), (4) CTA único e rastreável por seção (Regra 10), (5) acessibilidade e reduced-motion. Nenhuma LP avança de portão sem os quatro anteriores aprovados.

## 14. CONTEXT ENGINEERING KIT (context-engineering-kit)
- OBJETIVO: Antes de qualquer tarefa complexa, reunir o contexto mínimo necessário e suficiente — nem contexto insuficiente que gera suposição, nem excesso que dilui o sinal.
- FONTES: Priorizar contexto vivo do projeto (CLAUDE.md, código real, dados reais) sobre suposição ou memória genérica de padrões de mercado.
- ESTRUTURA DE PROMPT: Papel, objetivo, restrições e critério de sucesso explícitos separadamente — nunca misturados em um único parágrafo denso.
- ITERAÇÃO: Contexto é vivo — atualizar CLAUDE.md e documentos de referência sempre que uma decisão de projeto mudar, em vez de deixar o contexto desatualizado orientar decisões futuras.
- RASTREABILIDADE: Toda decisão não óbvia a partir do código (motivo de uma escolha de arquitetura, restrição de negócio) é registrada como contexto explícito, nunca deixada apenas na memória da conversa.

## 16. MULTIMODAL GENERATIVE PIPELINE & INSTAGRAM META API (MULTIMODAL & META GRAPH)
- HIGGSFIELD MCP (REELS & VIDEO): Generate 9:16 vertical video assets for Reels using Higgsfield MCP[cite: 1]. Maintain cinematic camera controls and enforce spring motion rules from Regra 3[cite: 1].
- NANO BANANA (PRECISION TEXT IN IMAGES): Use Nano Banana (via Kairogen MCP) for carousel slides and infographics requiring clean, non-deformed typography[cite: 1]. Keep prompts explicit with text in quotes and clear positioning[cite: 1].
- META GRAPH API PROTOCOL (2-STEP PUBLISHING): Always enforce the official Meta API publishing flow for Feed, Reels, Stories, and Carousels[cite: 1, 7]:
  1. Create Media Container (/media) and extract creation_id[cite: 1, 7].
  2. Perform status polling (status_code == FINISHED) before triggering /media_publish[cite: 1, 7].
- TOKEN & RATE LIMIT SAFETY: Maintain long-lived OAuth tokens (60 days) and apply backoff logic to prevent HTTP 429 rate limit triggers[cite: 7].
- V�NCULO COM REGRAS 11, 13 E 15: Prompts e roteiros de m�dia DEVEM passar pelo filtro Stop-Slop (Regra 11), seguir as diretrizes do Remotion (Regra 13) e respeitar os port�es de convers�o do Forja-LP (Regra 15).

## 17. PROTOCOLO ANTI-GENÉRICO — 5 SKILLS (emil-kowalski, impeccable, taste, rauno-craft, refactoring-ui)

Consolida em um único checklist as cinco referências de design que toda tela/componente novo precisa satisfazer antes de ser considerado pronto. Duas já tinham seção própria (mantidas, agora nomeadas explicitamente); três são novas.

- **EMIL KOWALSKI** (= Regra 3, Motion & Animation): micro-interação sempre com spring físico ou cubic-bezier refinado, nunca linear; 150-250ms para hover/toggle/menu; nada de transição de 500ms+ para algo que o usuário aciona diretamente. Todo elemento interativo (botão, campo, card clicável) precisa de um estado de :active/tap visivelmente distinto do :hover — feedback tátil, não só visual.
- **IMPECCABLE** (= Regra 2, Impeccable UI/UX Rules): escala de espaçamento estrita em múltiplos de 8px; contraste WCAG AA em todo texto, inclusive subtextos; `leading-relaxed` em corpo de artigo longo.
- **TASTE**: critério de aprovação é "pareceria decisão de um designer sênior, não a opção default de um framework?" — isso inclui recusar qualquer hierarquia tipográfica plana. Títulos e headings grandes (>= 24px) sempre com `tracking-tight` (letter-spacing levemente negativo) — nunca o tracking default do navegador em texto de destaque. Subtextos, metadados e legendas (data de publicação, tempo de leitura, categoria) usam opacidade reduzida (`opacity: 0.6`–`0.7` sobre a cor base, nunca uma cor cinza genérica isolada) para criar hierarquia sem precisar de um tamanho de fonte novo.
- **RAUNO CRAFT**: o acabamento é a interação, não a superfície — cada elemento que responde a input (arrastar, expandir, dispensar) precisa de uma resposta contínua ao gesto (drag segue o dedo/cursor 1:1 durante o movimento, spring só na soltura), nunca um estado binário instantâneo. Bordas e sombras carregam cor sutil da paleta da marca (slate/teal), nunca preto puro (`rgba(0,0,0,.4)` genérico). Nenhum componente customizado é entregue sem os estados hover/focus-visible/active/disabled todos desenhados — não apenas o default.
- **REFACTORING UI**: nunca usar apenas tamanho de fonte para hierarquia — combinar peso, cor/opacidade (ver Taste acima) e espaçamento. Evitar cinza puro (`#808080`-like) em qualquer texto ou borda — usar a própria paleta slate/teal da marca em tons mais claros/escuros. Todo card/painel precisa de pelo menos duas fontes de profundidade (borda sutil + sombra), nunca sombra genérica de framework sem ajuste.
- **LIMPEZA DE MARCADORES ESTRUTURAIS EM LEGENDAS/CONTEÚDO GERADO**: qualquer texto que chegue de um pipeline de geração (roteiro de carrossel, legenda social, transcrição) precisa ter rótulos de estrutura removidos antes de ir para tela ou publicação — `"Slide 1 -"`, `"Item 2:"`, marcação markdown (`**`), colchetes de instrução de roteiro. Isso já é reforçado no lado do backend Python (`content_pipeline/orchestrator.py` e `backend/app/core/publish_validator.py`, no repo `DOUTOR_ANTONIO_FELIPE_SAUDE_MENTAL`); qualquer texto renderizado aqui na plataforma que vier desse pipeline segue a mesma regra — nunca exibir um rótulo estrutural cru na UI.
- **IDIOMA DAS ARTES E IDENTIDADE DO AUTOR (decisão do dono da conta, 2026-09-25)**: texto de arte (carrossel, Stories, texto na tela de Reels/Shorts, thumbnail) é 100% em português, **com as exceções "burnout", "online", "home office" e "feedback"** (as três últimas liberadas em 2026-09-25, por serem de uso corrente no português do Brasil). Na capa de carrossel, sempre "Esgotamento profissional (burnout)"; nos demais slides e textos na tela, pode usar os dois termos. Qualquer outro termo em inglês continua proibido nas artes — a lista da checagem está em `PALAVRAS_EM_INGLES` (`backend/lib/checagemRedes.js`). Nomes próprios em inglês são liberados só na forma exata, um a um (`NOMES_PROPRIOS_PERMITIDOS`): hoje "Free Fire" (nome do jogo, liberado em 2026-09-25); "free" solto continua proibido. O nome em texto corrido é sempre "Antônio" com acento ("Dr. Antônio Felipe"); o @ `doutor.antoniofelipe.smental`, o e-mail, URLs, slugs e identificadores de código ficam sem acento. Nunca usar `#psiquiatria` (sugere uma especialidade que o autor não tem — CFM): usar `#saudemental` ou `#medicinadefamilia`. Geradores com hashtags fixas: `backend/lib/carrossel.js` (`HASHTAGS_BASE`), `backend/data/roteirosStories.js` e `backend/data/roteirosVideoReels.js` (`HASHTAGS_FIXAS`).
- **HASHTAG DE MARCA (2026-09-25)**: `#doutorsaudemental` foi removida de todos os geradores (`carrossel.js`, `roteirosStories.js`, `roteirosVideoReels.js`), do `reels_automation/settings.json` e do `30_REELS_FACELESS.csv` — as vagas de hashtag ficam para temas. Não reintroduzir hashtag de marca. Na mesma limpeza, `#psiquiatria` saiu desses arquivos e dos roteiros em `CONTEUDO_INSTAGRAM/`.
- **MARCA (decisão do dono da conta, 2026-09-25)**: substitui "Doutor Saúde Mental". **Forma longa** — "Plataforma Integrada de Saúde Mental Doutor Antônio Felipe": rodapé (bloco da marca e ©), privacidade/"Sobre", dados estruturados (`publisher.name`) e arquivos internos (README, package.json, logs, `servico` do health check). **Forma curta** — "Saúde Mental · Doutor Antônio Felipe": `<title>`/`og:title` (sufixo "— Saúde Mental · Doutor Antônio Felipe"; a longa cortaria o título do artigo no Google) e cabeçalho, onde aparece em duas linhas (`marca__nome` "Saúde Mental" + `marca__descricao` "Doutor Antônio Felipe") com a marca inteira no `aria-label` do link. Domínio, @, e-mail e a marca da capa das redes ("Dr. Antônio Felipe · Saúde Mental") não mudam.
- **IDENTIFICAÇÃO DO MÉDICO (CFM 2.336/2023, decisão do dono da conta, 2026-09-25)**: o RQE aparece sempre acompanhado do nome da especialidade ("Medicina de Família e Comunidade · RQE 26638"), nunca sozinho. "NÃO ESPECIALISTA" só aparece logo abaixo da linha das pós-graduações — se as pós-graduações não forem citadas, "NÃO ESPECIALISTA" não entra. Versão resumida (rodapé de arte, LinkedIn): `Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638`. Versão completa (roteiros, descrições, PDFs, newsletter): CRM, especialidade + RQE, atuação (PAP e APS), linha das pós-graduações e, logo abaixo dela, "NÃO ESPECIALISTA".

## 18. REPO COMPANHEIRO — PROMPT MESTRE DO BACKEND (`DOUTOR_ANTONIO_FELIPE_SAUDE_MENTAL`)

**NOTA DE ESCOPO:** Esta seção documenta as regras do repositório Python/Flask companheiro (`DOUTOR_ANTONIO_FELIPE_SAUDE_MENTAL` — backend, `content_pipeline`, SQLite, geração de imagem via Replicate) já referenciado na Regra 17. **Este repositório (`DRSAUDEMENTAL`) não contém Flask, SQLite nem código Replicate** — aqui vivem o site (`apps/plataforma-saude-mental`) e os scripts Python de publicação (`reels_automation/`, `post_instagram.py`, `publicar_instagram.py`, `gerar_carrossel_local.py`, `gerar_capas_artigos.py`, `preparar_midia_publica.py`). Trate os itens abaixo como contexto de integração — aplicam-se quando este repo consome, chama ou espelha dados/artefatos produzidos por aquele backend, nunca como afirmação de que esses sistemas existem aqui.

### 18.1 Identidade e Autonomia do Agente (no repo backend)
- Atuação como Staff Full-Stack Engineer + UI/UX Specialist + Lead Agentic Developer.
- Autonomia total para tarefas com tripla checagem automatizada (`watermark_free=True`, `policy_passed=True`, validações de código): executar, validar e commitar/reiniciar workers sem pausa.
- Resiliência: em falha de API externa ou modelo, usar fallback gracioso (ex.: `institutional_covers.py` local) sem interromper o worker.
- Padrão de código: Python/JS limpo, modular, fortemente tipado, sem *magic numbers* nem variáveis de ambiente soltas — centralizar em `config.py`.

### 18.2 Paleta e Tokens Visuais de Referência

**Atualizado em 2026-09-21 via auditoria de QA visual (Playwright) no site em produção — estes são os valores realmente computados em `https://drsaudemental.vercel.app`, medidos com `getComputedStyle`, e substituem a paleta slate/emerald originalmente prevista neste documento.** A implementação em `public/assets/css/style.css` (`:root`) segue uma paleta floresta/teal quente, não a slate/emerald fria documentada antes — mantenha este bloco como fonte da verdade até que uma decisão de design mude a implementação real.

- Headings e texto de destaque (`--verde-900`): `#0D3330`.
- CTAs e links primários (`--verde-800`/`--verde-700`): `#114240` / `#185D58`, com hover/acento em `#2B978D`.
- Fundo quente da página (`--papel` ou equivalente): `#FAF7F2` — bege quente, não off-white frio.
- Cards: `#FFFFFF`.
- Acessibilidade: contraste mínimo WCAG AAA (mais estrito que o AA mínimo da Regra 2 — usar AAA como meta nesses componentes). Contrastes medidos: headings sobre fundo 12.82:1, CTA (branco sobre `#185D58`) 7.65:1 — ambos acima do mínimo AAA (7:1) para texto normal.
- Espaçamento: escala estrita de 8px (8/16/24/32/48) — consistente com a Regra 2.
- Tipografia: `Inter`/System UI; títulos `font-bold` + `tracking-tight`; corpo `leading-relaxed`.
- Cards: `rounded-xl`/`rounded-2xl`, `shadow-sm`.
- Anti-patterns adicionais: gradientes agressivos, neon ou qualquer elemento que transmita pânico/urgência/alarde; layouts poluídos com múltiplos CTAs competindo.

### 18.3 Pipeline de Imagens — Replicate (FLUX.1 [schnell])
- Provedor primário: Replicate, modelo `black-forest-labs/flux-schnell`.
- **Prompt de geração:** nunca usar negações (ex.: "never smoking") — sempre descrever afirmativamente o ambiente ideal ("clean, healthy lifestyle, calm atmosphere"). Regra aplica-se a qualquer prompt de imagem gerado por este site também, por consistência com a Regra 1/Stop-Slop.
- Regras de chamada: resolver sempre `latest_version.id` antes de criar a predição; passar `wait=False` em `client.run()` (evita `ReadTimeout` e conexões presas de 60s); polling manual via `prediction.wait()`; validar `watermark_free = True` antes de aceitar o retorno.

### 18.4 Loop de Feedback Visual (Playwright CLI)
Sempre que criar/alterar UI ou gerar layout de carrossel/página no backend: renderizar no navegador via Playwright CLI, inspecionar alinhamento/quebra de linha/proporção/contraste, e refatorar+revalidar automaticamente se houver desvio do Design System (ex.: carrossel com mais de 10 slides).

### 18.5 Comandos de Referência (repo backend)
- Worker: `python -m content_pipeline.worker`
- Testes E2E/visuais: `npx playwright test tests/e2e/`
- Checar mídias no SQLite: `python -c "import sqlite3; con = sqlite3.connect('data/db/app.db'); print(con.execute('SELECT id, status, type FROM media_assets').fetchall())"`

### 18.6 Commit e Deploy (regra compartilhada)
- Commits atômicos com convenção clara (`fix:`, `feat:`, `refactor:`, `style:`) — já é a prática observada no histórico deste repo, manter em ambos.
- Nunca commitar segredos (`r8_...`, senhas, `.env`) em nenhum dos dois repositórios.

## 19. SSR E PERFORMANCE — ROTAS `/artigo/:slug` E `/blog` (Node.js/Express, este repo)

Documenta a arquitetura real implementada neste repositório (`DRSAUDEMENTAL`) em 2026-09-21/22, via auditoria de QA + Lighthouse. Backend é **Node.js/Express** (`backend/index.js`), não Flask — ver nota de escopo da Regra 18.

### 19.1 SSR completo em `/artigo/:slug`
- `vercel.json` roteia `/artigo/[^/]+/?` para a função serverless (`/backend/index.js`), não mais para o arquivo estático `public/artigo.html` diretamente.
- `backend/index.js` (rota `GET /artigo/:slug`) consulta `Artigo.findOne({ slug, publicado: true })` no MongoDB (campos: `titulo slug resumo conteudo categoria autor imagemCapa audioNarracaoUrl tempoLeitura publicadoEm atualizadoEm`) e passa o resultado para `backend/lib/renderizarArtigo.js`.
- `renderizarArtigoHtml(artigo)` injeta no shell estático de `public/artigo.html`:
  - **`<head>`**: `<title>`, `meta[name=description]`, `canonical`, `og:title`/`og:description`/`og:url`/`og:image`, e um `<script type="application/ld+json">` com `@type: ["MedicalWebPage", "Article"]` (headline, description, datePublished/dateModified, author, publisher).
  - **Corpo visível**: cabeçalho do artigo (breadcrumb, selo de categoria, `h1`, resumo, autor/data/tempo de leitura, capa com `width="1200" height="630"`, player de narração) e o `conteudo` HTML do artigo, substituindo os dois blocos de skeleton (`#artigo-cabecalho` e `#artigo-conteudo`) do template.
  - **Sanitização**: todo valor interpolado no HTML (título, resumo, autor, URLs) passa por `escapeHtml` (`backend/lib/texto.js`). O JSON-LD é gerado via `JSON.stringify` e tem `</` escapado para `<\/` — evita que o próprio conteúdo do artigo feche a tag `<script>` prematuramente (`</script>` embutido no título, por exemplo). `artigo.conteudo` (HTML rico) **não** passa por escapeHtml — é conteúdo de CMS escrito só pelas rotas administrativas autenticadas (`exigirAdmin`), mesmo modelo de confiança do client-side.
  - **Marcação de sucesso**: `<article data-ssr="1">` só é aplicado se os dois blocos de skeleton baterem exatamente com o template atual — se o template mudar e o replace não bater, a marca não é aplicada e a página cai no fluxo 100% client-side em vez de ficar com skeleton preso.
- **Fallback em 3 camadas** (sempre serve o shell estático de `public/artigo.html`, sem a marca `data-ssr`): banco não configurado (`db.isConfigured()` falso) → artigo não encontrado/despublicado → qualquer erro na consulta (logado, nunca derruba a rota).

### 19.1b SSR completo em `/blog` (mesmo padrão, motivo diferente)
- Mesma arquitetura de `/artigo/:slug`, aplicada à listagem: `backend/lib/listarArtigos.js` (consulta + paginação, também usada por `GET /api/artigos` e `GET /api/artigos/categorias` — fonte única, sem duplicar lógica de filtro) e `backend/lib/renderizarBlog.js` (monta cards, botões de filtro de categoria e navegação de paginação, respeitando `?categoria`/`?busca`/`?pagina` da URL) injetam o resultado em `public/blog.html`, marcando `#lista-artigos[data-ssr="1"]`.
- Motivo aqui **não foi performance** (o self-hosting de fontes já tinha resolvido isso sozinho) — foi crawlability: a listagem inteira era montada via JS após fetch, então um crawler sem JS via só skeleton vazio, sem nenhum link de artigo.

### 19.2 Hidratação client-side (`assets/js/artigo.js` e `assets/js/blog.js`)
- Ao carregar, verifica `document.querySelector('article')?.dataset.ssr === '1'`.
  - **Se SSR'd**: não toca em `cabecalho`/`conteudo`, não mostra skeleton, não chama `atualizarMetadados` (evita duplicar `og:image`/JSON-LD já injetados pelo servidor). Só (1) aplica o hardening de links externos (`target="_blank"`, `rel="noopener noreferrer"`) sobre o conteúdo já renderizado, e (2) busca `/api/artigos/:slug` **apenas** para popular "Artigos relacionados" (que nunca vêm pré-renderizados). Falha nesse fetch é tratada em silêncio (`console.warn`) — nunca substitui a página por uma mensagem de erro, já que o conteúdo real já está visível.
  - **Se não SSR'd** (qualquer fallback do item 19.1): mantém o fluxo client-side completo de sempre — fetch, monta cabeçalho/conteúdo, `atualizarMetadados`, trata 404/503/erro genérico com `mostrarErro`.
- **`blog.js`** segue o mesmo princípio, checando `#lista-artigos.dataset.ssr === '1'`: se SSR'd, pula só o fetch+render inicial (lista e categorias já vêm prontas) — filtro, busca e paginação continuam client-side normalmente a partir da primeira interação, sem nenhuma marca adicional de estado.
- **Armadilha já corrigida (dados)**: `publicadoEm`/`atualizadoEm` chegam do Mongoose/`.lean()` como objetos `Date`, não string — usar `new Date(valor).toISOString()` explicitamente ao montar atributos `datetime=""`; `JSON.stringify` já serializa `Date` como ISO automaticamente, então o JSON-LD não precisa desse cuidado extra.
- **Armadilha já corrigida (roteamento)**: `express.static(PUBLIC_DIR, { extensions: ['html'] })` em `backend/index.js` tem que vir *depois* das rotas de SSR (`/blog`, `/artigo/:slug`) — antes dele, o static shadowia `/blog` (existe `public/blog.html` no disco) e servia o shell sem nunca chegar no handler, sem lançar erro nenhum. Se uma página SSR "não funciona" mas também não loga erro, checar a ordem dos `app.use`/`app.get` primeiro.

### 19.3 Diretrizes de Performance / Core Web Vitals
- **Fontes auto-hospedadas**: Inter e Fraunces (`public/assets/fonts/*.woff2`, 4 arquivos — variável, `font-weight: 400 600`, subconjuntos `latin`/`latin-ext` cobrindo acentuação do português) declaradas via `@font-face` no topo de `public/assets/css/style.css`. **Nunca reintroduzir `<link>` para `fonts.googleapis.com`/`fonts.gstatic.com`** — a segunda viagem de rede externa era a causa dominante do "element render delay" no LCP mobile (~2.2s de um LCP de 3.3s).
- **Fallbacks com métrica ajustada (`Inter Fallback`/`Fraunces Fallback`)** logo abaixo dos `@font-face` e segundos em `--fonte-texto`/`--fonte-titulo`. Motivo (auditoria 2026-09-23): o `style.css` chega depois da primeira pintura em rede lenta, então o texto sai em Arial/Times e a troca por Inter/Fraunces mudava o número de linhas do `h1`/resumo, empurrando meta e capa ~29px — CLS mobile de 0.10–0.30 em 102 dos 251 artigos. Com os fallbacks: 0.000 em 4G lento. `<link rel="preload">` das fontes foi testado em A/B e **não teve efeito nenhum** — não é a solução. Se trocar de fonte ou de tamanho de `h1`, **re-medir o `size-adjust` no DOM** (não em `<canvas>`: a Fraunces tem eixo óptico e a largura relativa muda com o tamanho — medida a 100px dava 92%, o real no h1 mobile é 111%).
- **Templates HTML lidos com CRLF → LF** (`lerTemplate` em `renderizarArtigo.js`/`renderizarBlog.js`): com `core.autocrlf=true` no Windows, um `git checkout` grava CRLF e o replace exato do skeleton deixa de bater — SSR desligado em silêncio só no ambiente local, 0/251 páginas com `data-ssr`.
- **Barra de filtros (`.filtros`) em linha única com rolagem horizontal**, nunca `flex-wrap`: com ~23 categorias, diferenças de poucos px na troca de fonte mudavam o ponto de quebra e reorganizavam a grade inteira (CLS 0.14–0.17 no `/blog` desktop em 4G lento). Em linha única, a altura da barra não muda.
- **Regressão automatizada**: `npm run test:e2e` (`tests/e2e/auditoria-ferramentas.spec.js`) — SSR/CLS/overflow de todos os artigos, todos os miniaplicativos (validação, pontuação, disclaimer, contador, CTA → Home com `?tipo=`), salvaguardas CVV 188/SAMU 192, fallback sem SSR e CLS do `/blog` em 4G lento. Sem `E2E_BASE_URL` sobe o servidor local; contra produção: `E2E_BASE_URL=https://drsaudemental.vercel.app npm run test:e2e`. O contador `/ferramenta-uso` é interceptado — não polui o /admin.
- **Dimensões explícitas obrigatórias em toda imagem de conteúdo** (capas de artigo, thumbnails de card): atributo `width`/`height` na tag `<img>` **e** `aspect-ratio` no CSS do container (`.artigo-capa`, `.artigo-cartao__capa`) — nunca um dos dois isolado. Proporção padrão das capas geradas pelo pipeline: `1200 / 630`. Ausência disso é a causa nº1 de CLS neste projeto.
- **Nunca montar uma página inteira via skeleton → replace de HTML completo no client-side** sem pré-renderizar o corpo no servidor quando há como consultar os dados na própria rota — esse padrão (skeleton pequeno virando conteúdo real muito maior) desloca tudo abaixo do ponto de injeção e domina o CLS mesmo com todas as imagens corrigidas. Ver 19.1 para o padrão correto (SSR completo com fallback client-side).
- **Resultados medidos (Lighthouse CLI, Chrome headless local, 2026-09-22, após SSR completo em Home/Blog/Artigo)** — usar como baseline para regressão em mudanças futuras:

| Página | Performance (Desktop/Mobile) | CLS (Desktop/Mobile) | LCP (Desktop/Mobile) | FCP (Desktop/Mobile) |
|---|---|---|---|---|
| Home | 100 / 98 | 0.007 / 0.085 | 0.6s / 1.0s | 0.6s / 1.0s |
| Blog | 96 / 100 | 0.004 / 0.02 | 0.8s / 0.9s | 0.6s / 0.9s |
| Artigo | 95 / 100 | 0.002 / 0.027 | 0.8s / 1.8s | 0.6s / 1.1s |

Acessibilidade 95-96, Boas Práticas 100 e SEO 100 em todas as combinações, TBT ≤40ms em todas. Pequena variação de Performance entre execuções (ex.: Artigo Desktop 97→95) é ruído normal do Lighthouse — olhar CLS/LCP/FCP/TBT junto antes de investigar como regressão. Ver 19.1b para o motivo do SSR do Blog (crawlability, não performance) e 19.2 para a armadilha de roteamento (`express.static` vs. rotas dinâmicas) encontrada ao aplicar.

## 20. PUBLICAÇÃO EM REDES SOCIAIS COM TRIPLA CHECAGEM (`backend/lib/socialPublisher.js`)

**⚠️ Não coexiste sem cuidado com os scripts Python legados da raiz do repo** (`publicar_instagram.py` — Graph API direto, e `post_instagram.py` — via Composio com legenda gerada por Claude). Os três publicam na **mesma conta do Instagram**. Nunca disparar mais de um para o mesmo artigo/dia — risco real de post duplicado. Este módulo é o único dos três que também cobre LinkedIn e que parte do status de aprovação de um artigo no MongoDB (os scripts Python trabalham a partir de `CONTEUDO_INSTAGRAM/CALENDARIO_30_DIAS.md`, uma fonte diferente).

- **Tripla checagem, nessa ordem, cada uma bloqueando a próxima**:
  1. `Artigo.status === 'aprovado'` no MongoDB (campo no schema, `enum: ['rascunho','aprovado','publicado']`, default `'rascunho'`) + `publicado === true` + `conteudo` não vazio. Independente de `publicado` (que só controla visibilidade no site): um artigo pode estar publicado no site e ainda não aprovado para redes. Aprovar via `PUT /api/artigos/:slug` com `{ "status": "aprovado" }` (rota administrativa já existente, sem endpoint novo).
  2. A URL pública do artigo (`/artigo/:slug`) e a `imagemCapa` (usada como `og:image`) respondem HTTP 200. Se o artigo tiver um miniaplicativo embutido (`detectarWebapp`, procura `id="ferramenta-*"` no `conteudo` — ver Regra 20-bis), checa também que o HTML **realmente entregue em produção** contém esse id **e** `data-ssr="1"` — prova que o SSR injetou o corpo, não só o `<head>` (mesma armadilha da Seção 19.2). Isto valida *entrega*, não *interatividade em runtime*: não executa o JS do widget (exigiria navegador headless, fora do escopo de um módulo de backend).
  3. Monta sempre os payloads das redes (Instagram feed + LinkedIn) **e os 4 pacotes de mídia** (`montarPacotesMidia` — ver 20-bis), com link direto para o miniaplicativo (`${url}#${idFerramenta}`) embutido nas legendas/roteiros quando ele existe. Só executa a chamada de escrita real com `confirmar: true` explícito (manual) ou via o interruptor automático (20-bis); sem isso, devolve tudo para revisão (dry-run) e não posta nada.
- **Gatilhos pós-aprovação**:
  - **Automático** (ver 20-bis, atrás do interruptor `AUTO_PUBLICAR_REDES`): dispara sozinho quando `status` transiciona para `'aprovado'` via `POST`/`PUT /api/artigos`.
  - **Manual** — CLI: `npm run publicar-redes -- --slug=<slug> [--confirmar] [--redes=instagram,linkedin]`; Rota admin: `POST /api/admin/artigos/:id/publicar-redes` (`exigirAdmin` + `exigirBanco`), body `{ redes?, confirmar? }`.
- **Variáveis de ambiente** (`.env.example`): reaproveita `INSTAGRAM_ACCOUNT_ID`/`INSTAGRAM_ACCESS_TOKEN` já existentes para os scripts Python (mesma conta — não duplicar). Deste módulo: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` (a URN do autor — organização ou pessoa — é obrigatória; o token sozinho não identifica em nome de quem postar) e `AUTO_PUBLICAR_REDES` (ver 20-bis).
- **Armadilha corrigida ao criar isso**: `.env.example` nunca tinha sido versionado — um `.gitignore` com `.env*` duplicado bloqueava até o arquivo de exemplo (que não tem segredo, só placeholders vazios). Corrigido para `.env*` + `!.env.example`; `.env`/`.env.local` continuam ignorados normalmente. O mesmo ajuste liberou `reels_automation/.env.example`.

### 20-bis. Automação ponta a ponta — interruptor, 4 pacotes de mídia, exceções por rede

**Contexto da decisão:** foi pedido explicitamente um fluxo 100% autônomo, sem nenhuma confirmação, disparado a partir de um save no MongoDB. Implementar isso *literalmente* reverteria a Checagem 3 original (pedida duas tarefas antes: "exige confirmação de execução") e faria qualquer save com `status:'aprovado'` — inclusive um bug, uma edição em lote futura, ou um admin errando o campo — postar de verdade e sem revisão nas contas reais do Instagram/LinkedIn. Alinhado com o usuário (dono do site), a implementação ficou como abaixo: **automação completa, mas atrás de um interruptor que ele liga deliberadamente.**

- **Interruptor de segurança — `AUTO_PUBLICAR_REDES`** (`.env`): ausente ou diferente de `"true"` (padrão) → `dispararPublicacaoAutomatica` monta e loga tudo (pacotes, payloads, resultado das checagens 1/2), **nunca chama a API de verdade**. Só com `AUTO_PUBLICAR_REDES=true` a publicação real acontece sem pedir confirmação no terminal — exatamente o "sem aprovação manual" pedido, mas como escolha explícita e reversível do dono da conta, não como comportamento padrão de fábrica.
- **Gatilho no MongoDB**: não é um Change Stream nem um hook do Mongoose — é uma checagem explícita em `backend/routes/artigos.js` (`dispararSeTransicionouParaAprovado`), chamada dentro de `POST`/`PUT /api/artigos`, comparando o status **antes e depois** do save. Só dispara numa transição real *para* `'aprovado'` (nunca em re-saves que já estavam aprovados/publicados — evita repost a cada edição de um artigo já aprovado). Motivo de não usar Change Streams: a app roda em funções serverless da Vercel (`@vercel/node`), que não sustentam um processo de escuta contínua — a checagem no próprio handler da requisição é o que existe de mais simples e correto nesse runtime.
- **Aguardado, não fire-and-forget**: o disparo é `await`ado **antes** de `res.json(...)` responder ao admin. Uma função serverless pode ser encerrada a qualquer momento depois que a resposta HTTP é enviada — background "solto" arriscaria a publicação nunca terminar. Efeito colateral aceito e documentado: com o interruptor ligado, salvar um artigo como `aprovado` pode levar até ~30s a mais (o Instagram tem uma etapa de polling do container); com o interruptor desligado (padrão), o custo é desprezível.
- **Os 4 pacotes de mídia** (`montarPacotesMidia`, sempre gerados, façam parte ou não do disparo automático):
  - **Carrossel** — reaproveita `montarSlides`/paleta de `backend/lib/carrossel.js` (`#FAF7F2`/`#0D3330`/`#185D58`); as imagens em si são PNG gerado localmente sem URL pública (`npm run carrosseis`), então este pacote nunca é "postado" pela API — é preparado, não publicado sozinho.
  - **Roteiro para Reel** e **Sequência para Stories** — mesmo formato de `roteirosVideoReels.js`/`roteirosStories.js` (Seção 21), com o link do artigo (e do miniaplicativo, se houver) já embutido na legenda/quadro de CTA.
  - **Roteiro e título para YouTube Short** (até 60s) — texto puro; este projeto **não tem integração com a API do YouTube**, então isso é sempre um roteiro para produção/upload manual, nunca um post automático.
  - **Único pacote com publicação real via API neste módulo: Instagram feed (imagem = `imagemCapa`) e LinkedIn (compartilhamento de link).** Reel/Stories/YouTube exigiriam asset de vídeo/imagem com URL pública que este pipeline não gera — documentar isso claramente evita a falsa impressão de que "4 pacotes" significa "4 publicações automáticas reais".
- **Exceção por rede, não tudo-ou-nada**: Instagram e LinkedIn são tentados em `try/catch` independentes dentro do orquestrador. Token ausente numa rede (`ENV_AUSENTE`) é logado (`console.error`) e **não impede** a tentativa na outra. `status` só vira `'publicado'` se **pelo menos uma** rede publicou de verdade; se todas falharem, o artigo continua `'aprovado'` para permitir nova tentativa depois de configurar o token que faltava.
- **Log**: só `console.error`/`console.log` (capturado pelos logs de função da Vercel, `vercel logs`) — o pedido original mencionava "log em servidor/arquivo", mas funções serverless da Vercel têm sistema de arquivos efêmero (nada escrito em disco local sobrevive entre invocações); gravar em arquivo local seria um log que desaparece sozinho. Console é o mecanismo real e correto neste ambiente.

### 20-ter. Fila diária de publicação (`backend/lib/filaRedes.js`, ativada em 2026-09-23)

**Contexto:** em 2026-09-23 os 251 artigos foram aprovados de uma vez (direto no banco, sem disparo automático). Postar todos juntos estouraria o limite diário da API do Instagram e inundaria o feed; o dono da conta escolheu uma fila de **2 posts por dia**, na ordem de maior engajamento.

- **Vercel Cron** (`vercel.json` → `crons`) chama `GET /api/cron/publicar-fila` às 15:00 e 22:00 UTC (12h e 19h de Brasília; no plano Hobby o disparo pode cair em qualquer minuto dessa hora). Cada chamada publica **no máximo 1 artigo**.
- **Interruptor:** a rota exige `Authorization: Bearer $CRON_SECRET`. Sem a variável, tudo 401 — **apagar `CRON_SECRET` na Vercel pausa a fila**. `?simular=1` mostra o próximo sem publicar.
- **Travas** sobre `publicadoRedesEm` (campo novo, gravado pelo orquestrador junto com `status: 'publicado'`, então cobre cron, CLI e /admin): teto `REDES_POSTS_POR_DIA` (padrão 2) nas últimas 24h e intervalo `REDES_INTERVALO_MIN_HORAS` (padrão 4). Execução duplicada do cron não vira post extra.
- **Ordem:** `visualizacoes + 10 × (votos da enquete + usos da ferramenta + pedidos de narração)`, desempate por `publicadoEm` mais recente. Em 2026-09-23 só `visualizacoes` tinha dados. **Robôs e navegadores automatizados não contam visita** (`backend/lib/robos.js`, por User-Agent: HeadlessChrome/Playwright, Lighthouse, crawlers, curl, UA vazio): antes disso, cada rodada da suíte e2e somava +1 em todos os artigos, e os testes do Checklist o levaram de fora do top 10 a 1º da fila. O contador não tem data/hora, então o do Checklist foi zerado em 2026-09-24 (valor anterior, 126, em `backups/fila-redes/`).
- **Falhas:** artigo barrado nas pré-condições técnicas (capa/URL fora) ou na tripla checagem editorial (Seção 20-quater) é pulado e o motivo vai para `registrospublicacao` (até 10 candidatos por execução); se todas as redes falharem (token expirado), a fila **para** em vez de queimar artigos. Só redes com credencial entram — hoje só Instagram (sem `LINKEDIN_*`).
- **Pausa manual:** gravar `pausadoEm` (+ `impressaoPausada` = impressão digital do token atual, vista em `/api/admin/fila-redes`) no doc `instagram_access_token` da coleção `credencials`. É o mesmo mecanismo da pausa por token inválido — a fila e a renovação semanal param; o log mostra o prefixo "pausada por token inválido" mesmo sendo manual (o `motivoPausa` diz a verdade). Retomar: `pausadoEm = null`. **Não apagar `CRON_SECRET` para pausar** — ele deriva a chave do token cifrado e, sendo Sensitive, não dá para recriá-lo com o mesmo valor.
- **Scripts Python legados (`publicar_instagram.py`, `post_instagram.py`) não passam pelas travas** — não rodar enquanto a fila estiver ativa (Regra 20).
- `maxDuration: 60` no build do `backend/index.js`: o polling do container do Instagram pode passar de 30s.
- **Tipo de token decide o host da API**: o token da conta (@doutor.antoniofelipe.smental) é do **Instagram Login** (prefixo `IGAA`) e só funciona em `graph.instagram.com` — em `graph.facebook.com` volta "Cannot parse access token". `graphBase()` em `socialPublisher.js` escolhe pelo prefixo. Cota real medida em 2026-09-23 via `content_publishing_limit`: **100 posts/24h**. **Renovação**: `npm run renovar-token-instagram` detecta o tipo pelo prefixo — IGAA usa `ig_refresh_token` sobre o próprio token (sem app secret; o token precisa ter ≥24h e não ter vencido), `--curto` troca um token recém-saído do login (`ig_exchange_token`, exige `INSTAGRAM_APP_SECRET`); EAA segue o fluxo antigo do Facebook. `-- --verificar` só valida (conta + cota). O script atualiza só o `.env.local`.
- **Renovação automática semanal** (`backend/lib/tokenInstagram.js`, cron `GET /api/cron/renovar-token-instagram` às segundas 12:00 UTC): renova o token atual com `ig_refresh_token` e guarda o novo **cifrado (AES-256-GCM) no MongoDB** (model `Credencial`, chave `instagram_access_token`). A publicação lê sempre `obterTokenInstagram()` = o renovado, se houver. Não usamos a variável da Vercel via API porque exigiria um token da API da Vercel com poder sobre a conta e o valor só valeria após redeploy. **Chave de cifra derivada do `CRON_SECRET`**: trocar o `CRON_SECRET` torna o token guardado ilegível → cai no da variável até a próxima renovação (logado). **Troca manual do token na Vercel sempre vence**: o doc guarda `origemHash` (SHA-256 do token da variável); se a variável mudar, a cadeia antiga é ignorada. Falha na renovação → log `[token-instagram] FALHA NA RENOVAÇÃO` com código da Meta, prazo restante e ação, e `ultimoErro` gravado no doc; o token anterior segue valendo. Nenhum log contém o token. Validade de 60 dias — renovar antes de vencer, senão a fila para. `publicar_instagram.py` ainda usa graph.facebook.com e não funciona com este token.

### 20-quater. Padrão do post do feed e tripla checagem bloqueante (2026-09-25)

**Contexto:** os dois primeiros posts da fila (tmc-aps em 24/09, burnout-medicos-enfermeiros em 25/09) saíram com capa 1,91:1 (uma delas a genérica "Saúde Mental", repetida em 51 artigos), legenda "título + resumo + Leia mais: <url>" (link não clicável), "Antonio" sem acento, sem CVV nem identificação. As antigas "checagens 1/2/3" eram só técnicas e a 3 era um `confirmar: true` fixo no cron. A fila ficou pausada até este padrão ir para produção.

- **Capa** (`backend/lib/capaRedes.js`): PNG 1080×1350 gerado do título (Fraunces, `#0d3330`, filete dourado, selo da categoria, "Dr. Antônio Felipe · Saúde Mental" + @), mesma técnica de contorno vetorial do carrossel. Fica em `capaRedes` {url, hash SHA-256, modelo, titulo…}, **separada de `imagemCapa`** (capa 1200×630 do site/og:image — trocá-la quebraria o layout da Seção 19.3). A fila gera/grava no Blob (`artigos/<slug>/instagram-4x5-<hash>.png`) se faltar ou se o título/modelo mudou; em lote: `POST /api/admin/capas-redes/gerar` (20 por chamada, repetir até `faltam: 0`). `subtituloRedes` (opcional) entra abaixo do título. Mudou o desenho → subir `MODELO`.
- **Legenda** (`backend/lib/legendaInstagram.js`): gancho (1ª frase da abertura, ≤125 car.) · 2 parágrafos **inteiros** do artigo (resumo, resto da abertura, parágrafos ≤320 car. — nunca recorte no meio, que pode separar "No discurso…" de "Na prática…") · em relato, a frase do próprio artigo que o declara narrativa composta · "Salve para ler depois." ou (tema sensível) "Compartilhe com quem precisa." · "🔗 Artigo completo no link da bio" · CVV 188/SAMU 192 em tema sensível · identificação resumida (Regra 17) · 3–5 hashtags em português (tema do título antes da categoria). Nada é reescrito: todo trecho vem do artigo.
- **Tripla checagem** (`backend/lib/checagemRedes.js`), bloqueante, depois das pré-condições técnicas e antes da Meta — vale para cron, CLI e /admin:
  1. *Conteúdo*: reescrita aprovada não importada; gancho; ≥2 parágrafos; chamada; "link da bio"; identificação; 3–5 hashtags; sem `\bAntonio\b`, `#psiquiatria`, URL solta, marcador estrutural, caractere corrompido, inglês de uma lista (exceto "burnout"); ≤2200 car.; **fidelidade** — cada trecho usado tem de existir no texto do artigo.
  2. *Visual*: baixa a imagem real do endereço; 1080×1350 PNG; hash = o gravado; modelo atual; título gravado = título atual; hash único entre artigos; sem inglês no título/subtítulo/categoria.
  3. *Segurança/CFM*: tema sensível (ansiedade, depressão, burnout, luto, suicídio, autolesão, crise, pânico, trauma, transtorno) sem "CVV 188"; relato sem declaração de narrativa composta; promessa de cura/resultado garantido, milagre, superlativos, "especialista em psiquiatria", "antes e depois", diagnóstico a distância.
  Limites: "português sem erros" é por sinais objetivos (texto do próprio artigo revisado, sem corrompidos/inglês), não corretor ortográfico; "título em destaque" é provado pelo hash, não por OCR.
- **Registro** (`backend/models/RegistroPublicacao.js`, coleção `registrospublicacao`): um por tentativa — data, artigo, origem (cron/admin/cli/previa), resultado (reprovado/publicado/falha-rede/previa), motivo e o resultado de cada checagem. Consulta: `GET /api/admin/registros-publicacao?slug=`. Prévia sem publicar: `GET /api/admin/previa-redes[?slug=]` (capa em base64 + legenda + checagens).
- **Reescritas** (`backend/data/reescritas/<lote>/`, `backend/lib/reescritas.js`): lotes aprovados versionados; `npm run importar-reescritas -- --lote=semana-1 [--confirmar]` segue o LEIA-ME (troca conteúdo — com `manter_ferramenta`, só o texto antes de `<h2>Ferramenta interativa</h2>` —, resumo e tempo de leitura; backup em `backups/reescritas/<lote>/`; atualiza banco **e** `.mdx`, validado com o compilador MDX do app; grava `reescrita` {lote, hash, importadaEm}). O artigo passa a exibir "Atualizado em". Semana 1 importada em 2026-09-25.
- **Link da bio:** `https://drsaudemental.vercel.app/instagram` (`backend/lib/renderizarInstagram.js` + `public/instagram.html`, SSR com o mesmo padrão do /blog): os 12 últimos artigos postados pela fila, por `publicadoRedesEm` — atualiza sozinho a cada post.
- **Barrados por inglês:** com "online", "home office" e "feedback" liberados (Regra 17), e "Free Fire" liberado como nome próprio, nenhum artigo da fila é barrado por idioma (2026-09-25).
- **Selo da capa:** categoria "Geral" não aparece — vira o tema do título (`TEMAS_SELO` em capaRedes.js, ex.: "Professores") ou some. Modelo atual: `capa-4x5-v3` (v3 corrige limites de palavra corrompidos nos padrões de tema da v2).

### 20-quinquies. Narração em áudio versionada (2026-09-25)

- **Como era:** o repo companheiro (`C:DOUTOR_ANTONIO_FELIPE_SAUDE_MENTAL`, `content_pipeline/article_media.py`) narrava o HTML inteiro via `get_text()` — lia ferramentas, lista de referências e links — com Edge-TTS (`pt-BR-AntonioNeural`) + trilha de fundo, e enviava ao Blob. 65 de 251 artigos tinham áudio, nenhum com controle de versão.
- **Agora** (`backend/lib/narracao.js`): `textoParaNarracao` lê título, "Narração em voz sintética." e o texto — sem ferramenta interativa (do `<h2>Ferramenta interativa</h2>` ao próximo H2), sem script/formulário/código, sem links, sem chamadas ¹²; a lista de referências vira "As referências estão no fim da página."; CVV/SAMU do texto são lidos; caixa alta longa vira caixa normal. `narracao.hash` = SHA-256 de voz + texto: mudou o conteúdo, a narração fica **desatualizada** sozinha.
- **Estados:** `ok` (hash confere) · `legado` (áudio antigo sem hash, artigo não reescrito — ainda toca) · `desatualizada` (texto mudou; **não toca**, o player diz que está sendo atualizada) · `ausente`.
- **Gerar:** `npm run narrar -- --estimar` · `--slugs=a,b` · `--pendentes --limite=N`; `--enviar` manda para produção por `PUT /api/artigos/:slug/midia/narracao` (ADMIN_TOKEN; MP3 até 4,4 MB ≈ 12 min), que recusa com 409 se o hash não bater com o texto atual. Roda local (o Edge-TTS é Python: `reels_automation/.venv`, ou `EDGE_TTS_BIN`); MP3 em `narracoes-geradas/` (ignorado pelo git). Medido: ~13,7 caracteres por segundo de áudio, 48 kbit/s, 20–50 s de geração por artigo.
- **Player:** rótulo ligado ao `<audio>` (`aria-labelledby`), aviso "Narração em voz sintética." (`aria-describedby`, Res. CFM 2.454/2026), `preload="none"`, sem autoplay, controles nativos (teclado).
- **Fila:** narração que não está `ok` não reprova o post, mas entra em `pendencias` no registro de publicação.
- **Edge-TTS:** gratuito e sem chave, mas é o serviço de leitura em voz alta do navegador Edge, sem contrato nem garantia — pode mudar ou sair do ar. Alternativa oficial com a mesma voz: Azure Speech (cobrança por caractere).

### 20-sexies. Diretrizes de operação (dono da conta, 2026-09-25)

- **Fila intocada:** a partir de 2026-09-25, não mexer na fila do Instagram (quantidade, horários, ordem, token, pausa) sem pedido explícito — a Regra 5 do `prompt-mestre-plataforma.md`. As alterações daquele dia (pausa, novo padrão, retomada) foram pedidas.
- **Fim de fase = push + deploy:** ao fechar cada fase/ciclo de trabalho, rodar os testes, fazer commit descritivo, push na `main` e confirmar o deploy (Regra 12 do prompt-mestre). Dentro da fase, commits locais.
- O `prompt-mestre-plataforma.md` fica na raiz, **fora do git** (repositório público).

### 20-septies. Bot de mídias com LLM gratuito (2026-09-26)

- **Por quê:** economizar cota do Claude Code — que é gasta quando o conteúdo é escrito dentro da sessão (ex.: o pacote Essencial de professores). **Nenhum script ou rota Node chamava LLM** antes disto: fila (legenda/capa sem IA, de propósito), narração (TTS Azure/Edge) e carrossel continuam sem LLM. O único que usava Claude era o legado `post_instagram.py` (via Composio), que não deve rodar com a fila ativa.
- **`backend/lib/llm.js`:** `gerarJson({sistema, usuario, schema})` — Gemini (`@google/genai`, modelo `GEMINI_MODEL`, padrão `gemini-flash-latest`) com saída em JSON Schema; reserva Groq (`groq-sdk`, `GROQ_MODEL`, padrão `openai/gpt-oss-120b`, modo JSON). Repete em 429/5xx. Chaves `GEMINI_API_KEY`/`GROQ_API_KEY` só no `.env` local (mascaradas pelo verificador de segredos por serem `*_KEY`).
- **`npm run bot:gerar-posts -- --slug=<slug>` ou `--proximos=N`** (`scripts/bot-gemini.js`, alias `bot:gemini`): rascunho do pacote Essencial (ganchos, carrossel, legenda, 2 Reels, 5 Stories, 2 LinkedIn, 5 títulos e 2 Shorts) a partir do texto limpo do artigo, com as regras de fidelidade/CFM/idioma/escrita no prompt. Identificação do médico e, em tema sensível, CVV 188/SAMU 192 são acrescentados **pelo código**, nunca pelo LLM. Saída em `CONTEUDO_INSTAGRAM/rascunhos/<slug>.md` + `<slug>.json` (**fora do git**). Não publica e não mexe na fila (Regra 5).
- **Duplo passe de verificação**, anotado no topo de cada rascunho:
  1. *Estrutural/determinístico (código)*: número que não está no artigo (só contagens de estrutura como "6 sinais" ficam de fora), faixa citada só pelo teto ("até N%"), termos do CFM, "Antonio", `#psiquiatria`, inglês nas artes, limites de tamanho, quantidade de peças, LinkedIn sem chamada, CVV em tema sensível, narrativa composta em relato.
  2. *Revisor semântico de fidelidade (LLM, `revisarFidelidade`)*: compara cada frase, identificada pela peça de origem (sem as linhas fixas), com o artigo e aponta afirmação ausente do artigo, **atribuição incorreta de conceito a contexto** (ex.: "fadiga por compaixão" presa ao ensino médio), número/faixa distorcidos, exagero e orientação clínica não dada — com o trecho do rascunho, o do artigo e gravidade (alta/média/baixa). Usa **o outro provedor** quando as duas chaves existem (Groq revisa Gemini e vice-versa); com uma só chave, o rascunho diz que o revisor foi o mesmo modelo. Revisor indisponível fica registrado.
  Os dois passes **reduzem** o trabalho da revisão médica, não o substituem: um revisor automático também erra.
- **Aprovação rápida** (`scripts/bot-aprovar.js`): ao fim de cada lote o `bot:gerar-posts` mostra o resumo (alertas, desvios, gravidade) e o comando de cada rascunho. `npm run bot:aprovar -- --slug=<slug>` ou `-- --lote`. É o **ato do médico** — o agente não roda este comando por ele. Recusa se o artigo mudou depois do rascunho (hash de título+resumo+conteúdo) e, havendo alerta, desvio ou revisor indisponível, exige `--revisado` (declara que leu e corrigiu/aceitou). Grava no `.json` quem aprovou, quando, o hash do rascunho aprovado, se foi editado e as pendências reconhecidas; copia para `CONTEUDO_INSTAGRAM/aprovados/` (fora do git). **Aprovar não publica** — a publicação dessas peças segue manual.
- **Conformidade (Res. CFM 2.454/2026 / prompt-mestre 1.4):** todo rascunho e todo aprovado trazem "Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe". Não há publicação de conteúdo gerado por LLM sem essa aprovação.
- **`npm run bot:narracoes`:** atalho de `narrar --pendentes --limite=20 --enviar` (Azure, com a trava da cota mensal).

### 20-octies. Publicador do bot de mídias (`npm run bot:publicar`, 2026-09-26)

- **O que publica por API:** o **carrossel** aprovado no Instagram — slides desenhados em PNG 1080×1350 a partir do texto aprovado (`backend/lib/carrosselAprovado.js`, mesmas fontes/paleta da capa 4:5; `Rodapé pequeno: "..."` da sugestão visual vira rodapé; identificação em duas linhas no último slide), gravados no Blob por `PUT /api/admin/redes-midia/:slug/:nome` (ADMIN_TOKEN; o token do Blob fica só na Vercel) e publicados por `publicarCarrosselNoInstagram` (containers `is_carousel_item` → `CAROUSEL` → FINISHED → `media_publish`, token só no cabeçalho); e **um post de LinkedIn por execução** (UGC Posts, com o link do artigo), se `LINKEDIN_*` existirem.
- **O que fica manual:** Reels e Shorts (as APIs exigem o arquivo de vídeo; o aprovado é roteiro) e Stories com enquete (a API da Meta não publica figurinhas). YouTube Data API não implementada pelo mesmo motivo (variáveis previstas no `.env.example`).
- **Travas, nesta ordem:** `meta.aprovacao` registrada; artigo inalterado desde o rascunho (`hashArtigo`); aprovado sem edição posterior não registrada (`correcoesPosAprovacao` conta como registro); checagens de texto (2–10 slides, ≤ 25 palavras, inglês nas artes, termos do CFM, "Antonio", `#psiquiatria`, **hashtag de marca**, URL solta, ≤ 2.200 caracteres, 3–5 hashtags, CVV em tema sensível, identificação e aviso CFM presentes); fila/conta pausada por token; **mesma cadência da fila** (`REDES_POSTS_POR_DIA`/`REDES_INTERVALO_MIN_HORAS`) contando os posts da fila **e** os do bot. Nunca publica duas vezes a mesma peça.
- **Legenda:** a aprovada + identificação resumida + "Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026)", antes das hashtags. (Decisão do dono: o aviso de IA entra nos posts — substitui a orientação anterior do prompt do Ecossistema de não incluí-lo.)
- **Prévia é o padrão:** sem `--confirmar`, desenha os slides em `aprovados/<slug>-slides/`, mostra a legenda final, o plano e a cadência — nada é enviado. `--confirmar` publica; `--todos` percorre os aprovados.
- **Logs:** cada envio (rede, peça, status, status HTTP, id, permalink ou erro) vai para `meta.publicacao.logs` no `.json` do aprovado e para `registrospublicacao` (origem `bot`). Carrossel publicado → `.md`, `.json` e slides movidos para `CONTEUDO_INSTAGRAM/publicados/` (fora do git). Erro de token da Meta pausa a fila, como na publicação da fila.
- **Pendente de decisão (2026-09-26):** a fila (`filaRedes.js`) **não conta** os posts do bot — só o bot conta os da fila; com os dois ativos, a conta pode passar de 2 posts/dia. Resolver exige mudar a contagem da fila (Regra 5 — só com pedido explícito).

### Segredos

**O repositório `plataforma-saude-mental` no GitHub é PÚBLICO** (verificado em 2026-09-24): todo commit, inclusive este arquivo, fica aberto na internet. Secret scanning e Push protection do GitHub estão ativos (são gratuitos só em repositório público — torná-lo privado numa conta pessoal sem plano pago os desliga).

- **Nunca** colar token, senha ou string de conexão em chat (inclusive com IA), issue, PR, commit ou print. Em 2026-09-23 um token do Instagram foi colado num chat e continuou válido mesmo após "remover o app" — trate qualquer segredo exposto como comprometido.
- **Onde cada segredo fica:**

| Segredo | Produção | Local | Observação |
| --- | --- | --- | --- |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID` | Vercel (Sensitive, Production; o ID também em Preview) | `.env.local` | Token IGAA; renovado semanalmente e guardado **cifrado** no MongoDB (`Credencial`) |
| `CRON_SECRET` | Vercel (Sensitive) | — | Autentica os crons **e** deriva a chave AES-256-GCM do token no MongoDB — trocá-lo invalida o token guardado (cai no da variável até a próxima renovação) |
| `ADMIN_TOKEN`, `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN` | Vercel (Sensitive) | `.env`, `.env.local` | — |
| Chave de cifra do token | **Em lugar nenhum** — derivada em memória do `CRON_SECRET` | — | Nunca no banco nem no repositório |

- **Bloqueio local:** `.husky/pre-commit` roda `scripts/verificar-segredos.js --staged` e **bloqueia o commit** se achar token IGAA/EAA, MongoDB com senha, chaves `sk-`/`sk-ant-`/`r8_`/`vercel_blob_rw_`/`gh*_`, chave privada ou `CRON_SECRET`/`*_TOKEN`/`*_SECRET`/`*_KEY` com valor literal. Só imprime arquivo, linha e tipo — nunca o valor. Histórico inteiro: `npm run verificar-segredos` (2026-09-24: 52 commits, nenhum segredo real). Falso positivo inevitável: `segredos:permitir` na mesma linha; em testes, montar tokens falsos por concatenação.
- **Logs:** todo log de redes, cron, token, admin e artigos passa por `backend/lib/log.js` (`log.info/aviso/erro`), que mascara o valor exato das variáveis sensíveis e qualquer coisa com cara de token (IGAA…, EAA…, `Bearer …`, `mongodb://user:senha@`, `?access_token=`). Nunca usar `console.*` direto nesses módulos.
- **Token nunca em URL:** chamadas à Meta mandam o token só no cabeçalho `Authorization: Bearer` (publicação, polling do container, renovação, verificação). Exceção inevitável: as TROCAS de token curto (`ig_exchange_token`/`fb_exchange_token`) no script local, onde a Meta exige parâmetros na URL.
- **Nenhuma rota devolve token**, nem mascarado. `/api/admin/fila-redes` mostra só origem (`variavel`/`renovado`), impressão digital (SHA-256 truncado em 16 hex), validade e pausa.
- **Pausa automática:** se a Meta recusar o token (códigos 190, 102, 10, 200–299) na publicação ou na renovação, grava `[token-instagram] ALERTA` e **pausa a fila e a renovação**, sem novas tentativas com aquele token. A pausa cai sozinha quando a impressão digital do token em uso muda (token novo configurado).

**Como trocar o token do Instagram:**
1. Instagram → Configurações → Apps e sites → remover o app (e, se houve vazamento, trocar a senha da conta).
2. Gerar um token novo no painel de desenvolvedor da Meta (Instagram Login, prefixo IGAA).
3. Vercel → Settings → Environment Variables → `INSTAGRAM_ACCESS_TOKEN` (Production) → novo valor; depois **redeploy** de produção.
4. Conferir: `/api/admin/fila-redes` deve mostrar `origem: "variavel"` com impressão digital nova e sem pausa; localmente, com o token no `.env.local`, `npm run renovar-token-instagram -- --verificar`.

**Em caso de vazamento de qualquer segredo:** (1) revogar/trocar na origem imediatamente (Meta, MongoDB Atlas → Database Access, Vercel, GitHub), antes de qualquer limpeza; (2) atualizar o valor na Vercel e fazer redeploy; (3) confirmar que o valor antigo foi de fato invalidado com uma chamada de leitura; (4) se entrou no git, trocar o segredo é obrigatório — reescrever histórico não basta, o repositório é público e pode ter sido clonado; (5) registrar aqui o que aconteceu e o que mudou.

## 21. SEÇÃO DE SERVIÇOS E FORMULÁRIO DE CONTATO (Home)

Duas seções novas em `public/index.html`, entre "Como funciona" (`#como-funciona`) e "Artigos" (`#artigos`) — reaproveitam classes/tokens já existentes em `style.css`, nenhum CSS novo foi necessário.

- **`#servicos`** — dois cards (`.grade.grade--2` + `.cartao`, mesmo padrão de "Situações que acompanhamos"): **Mentoria Individual** (médicos/residentes/profissionais de saúde) e **Consultoria em Saúde Mental Institucional** (empresas/RH/instituições). Cada card tem um CTA `<a data-preencher-tipo="particular|consultoria-empresa">` que rola até o formulário e pré-marca o radio `tipoAtendimento` correspondente (lógica em `public/assets/js/home.js`).
- **`#contato-servicos`** — formulário (Nome, E-mail, Telefone/WhatsApp, Tipo de atendimento, Mensagem), mesma marcação/classes do formulário de agendamento (`.formulario`, `.campos`, `.opcoes`/`.opcao`, honeypot `.campo-armadilha`, `.consentimento`) — herda toda a acessibilidade e validação client-side já provadas naquele formulário, sem reinventar padrão.
- **Distinto de propósito do `#agendar`** (formulário de agendamento clínico, não tocado): este é um lead de primeiro contato — sem data/período/modalidade de consulta. Integra com a API do backend (não com WhatsApp): **não há número de WhatsApp institucional documentado no repo**, então nenhum redirecionamento foi inventado. Se um número for definido no futuro, dá para complementar com um CTA de WhatsApp pós-envio sem mexer na integração com a API.

### Backend — `POST/GET/PATCH /api/contato`
- `backend/models/Contato.js`: `nome`, `email`, `telefone`, `tipoAtendimento` (`enum: ['particular','consultoria-empresa']`), `mensagem` (obrigatória, min 10 caracteres — diferente do `mensagem` opcional do `Agendamento`), `consentimentoLGPD`, `status` (`novo`/`em-contato`/`concluido`). Modelo deliberadamente separado de `Agendamento`.
- `backend/routes/contato.js`: mesmo padrão de `agendamentos.js` — `POST /` público (rate-limit 5/min por IP, honeypot, guarda de duplicidade por e-mail nos últimos 10 min), `GET /` e `PATCH /:id` administrativos (`exigirAdmin` + `exigirBanco`).
- Registrado em `backend/index.js` como `app.use('/api/contato', contatoRouter)`.
