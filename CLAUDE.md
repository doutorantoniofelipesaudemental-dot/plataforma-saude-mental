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
