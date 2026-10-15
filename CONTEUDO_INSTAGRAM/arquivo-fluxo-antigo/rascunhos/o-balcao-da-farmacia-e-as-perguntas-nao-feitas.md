# RASCUNHO — O balcão da farmácia e as perguntas não feitas

> Gerado por gemini (gemini-flash-lite-latest) em 2026-10-03 01:56 UTC a partir do artigo `o-balcao-da-farmacia-e-as-perguntas-nao-feitas`. Nada foi publicado.
> Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).
> **Ver as artes antes:** `npm run bot:previa-visual -- --slug=o-balcao-da-farmacia-e-as-perguntas-nao-feitas` (folha de contato + dimensões)
> **Aprovar depois de revisar:** `npm run bot:aprovar -- --slug=o-balcao-da-farmacia-e-as-perguntas-nao-feitas`

## 1º passe — verificação estrutural (código)

- ⚠️ relato clínico sem dizer que é narrativa composta
- ⚠️ Reel 1 sem especificação de movimento (Lottie/GSAP/3D) e gancho visual dos 3 primeiros segundos

## 2º passe — revisor semântico de fidelidade (LLM)

> groq (openai/gpt-oss-120b), provedor diferente do que escreveu · 37 peças comparadas com o artigo.

- 🟠 **slide 3** — Adiciona a expressão "puramente burocrático", que não consta no artigo e contradiz a ideia de que o ato envolve mais que burocracia.
  - Rascunho: "A renovação de uma receita raramente é um ato simples e puramente burocrático."
  - Artigo: "renovação de uma receita raramente é um ato simples."
- 🔴 **LinkedIn 1, §1** — Inclui termos "estigma" e "plano de cuidado integral" que não são mencionados no artigo, atribuindo conceitos inexistentes ao texto original.
  - Rascunho: "Na Atenção Primária à Saúde, o atendimento vai muito além da prescrição burocrática. ... revelam receios profundos, como o medo da dependência e o **estigma** em torno do tratamento. ... oferecendo escuta ativa, validação do sofrimento e um **plano de cuidado integral**."
  - Artigo: "por trás do papel timbrado, existem receios sobre dependência e efeitos colaterais. ... o cuidado nunca se resume ao comprimido."

> Os dois passes reduzem o trabalho da revisão, mas não a substituem: um revisor automático também erra.

## Matriz multimídia obrigatória

- Instagram: Carrossel (PNG 4:5)
- Instagram: Reel (vertical 9:16)
- Instagram: Stories (3 a 5 quadros, com enquete e caixa de perguntas) (publicação manual; registrar com npm run bot:matriz)
- YouTube: Short (vertical 9:16)
- YouTube: Vídeo longo (16:9, SEO e capítulos)
- LinkedIn: Post corporativo

> O artigo só fica "totalmente_concluido" com os seis formatos entregues (npm run bot:matriz -- --slug=<slug>).

## Ganchos para Reels

1. O que se esconde atrás de uma receita renovada?
2. Você já teve medo de depender de um remédio?
3. A pergunta silenciosa que muitos guardam na farmácia.
4. O remédio é para sempre? Descubra o cuidado humanizado.
5. Quando o balcão da farmácia vira espaço de escuta.

## Carrossel (4:5, 1080 × 1350)

| Slide | Texto | Sugestão visual |
|---|---|---|
| 1 | O balcão da farmácia e as perguntas não feitas. | Slide de capa com fundo acolhedor em tom suave, tipografia limpa, título centralizado em contraste AAA. |
| 2 | Entre caixas de remédios, histórias silenciosas vêm à tona na Atenção Primária. | Slide com layout limpo, margem segura generosa, ilustração 2D sutil representando um ambiente de atendimento. |
| 3 | A renovação de uma receita raramente é um ato simples e puramente burocrático. | Slide com texto curto à esquerda e elemento gráfico 3D leve de apoio à direita. |
| 4 | Por trás do papel, existem receios sobre dependência e efeitos colaterais. | Slide focado em legibilidade, contraste elevado entre texto escuro e fundo claro. |
| 5 | A medicação é um apoio temporário, mas o cuidado nunca se resume ao comprimido. | Slide com espaçamento generoso e destaque visual na ideia central de suporte. |
| 6 | O tratamento ganha eficácia quando vem acompanhado de escuta e validação do sofrimento. | Slide com blocos tipográficos claros e harmônicos. |
| 7 | Cuidar da saúde mental exige tempo para olhar nos olhos e construir caminhos juntos. | Slide de conclusão com tom empático e acolhedor. |
| 8 | Salve este post e compartilhe com quem precisa saber disso. 🔗 Artigo completo no link da bio Apoio agora: CVV 188 · SAMU 192 | Slide final com ícones limpos de salvamento e compartilhamento, fundo acolhedor. |

Rodapé do último slide: Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638

### Legenda

> O que se esconde atrás de uma receita renovada?
> 
> No dia a dia da Atenção Primária, o balcão da farmácia revela dúvidas silenciosas e receios sobre o uso de medicações para ansiedade. Muitas pessoas carregam o medo de que o remédio seja um sinal de fraqueza ou que precisem dele para sempre.
> 
> A escuta atenta e o acolhimento mostram que a medicação é apenas uma ferramenta de suporte, e que o cuidado envolve olhar para a rotina, o sono e as angústias de cada um.
> 
> 🔗 Artigo completo no link da bio
> 
> 🎧 Ouça o artigo narrado no Portal: https://drsaudemental.vercel.app/artigo/o-balcao-da-farmacia-e-as-perguntas-nao-feitas
> 
> Se precisar de apoio: CVV 188 (ligação gratuita, 24h) · SAMU 192
> 
> #SaúdeMental #AtençãoPrimária #CuidadoHumanizado #BemEstar

## Reel 1: Perguntas não feitas no balcão da farmácia (30 s)

| Tempo | Cena | Texto na tela | Fala |
|---|---|---|---|
| 0:00–0:10 | Animação 2D de uma caixinha de remédios sobre um balcão. | O balcão da farmácia | O balcão da farmácia do posto de saúde costuma ser um ponto de encontro singular. |
| 0:10–0:20 | Transição suave para elementos gráficos que simbolizam conversas e escuta. | Dúvidas silenciosas | Por trás do papel timbrado, existem receios sobre dependência e efeitos colaterais. |
| 0:20–0:30 | Animação acolhedora mostrando um ambiente de conversa tranquila. | Cuidado além do comprimido | O tratamento ganha real eficácia quando vem acompanhado de escuta e validação do sofrimento. |

**Movimento (3 s iniciais):** Gráfico 2D suave simulando a transição de um balcão de atendimento para uma sala de conversa acolhedora.

**Legenda do Reel:**

> A renovação de uma receita vai muito além do papel timbrado. Descubra a importância da escuta na saúde mental.
> 
> 🎧 Ouça o artigo narrado no Portal: https://drsaudemental.vercel.app/artigo/o-balcao-da-farmacia-e-as-perguntas-nao-feitas

## Reel 2: O remédio é para sempre? (25 s)

| Tempo | Cena | Texto na tela | Fala |
|---|---|---|---|
| 0:00–0:10 | Animação de uma pessoa segurando uma receita com dúvidas. | O remédio é para sempre? | Muitas pessoas perguntam se o remédio precisará acompanhar a vida delas para sempre. |
| 0:10–0:25 | Transição para gráficos que mostram o equilíbrio e o suporte temporário. | Ferramenta de suporte | A medicação é um apoio temporário para que o organismo recupere o equilíbrio, mas o cuidado nunca se resume a isso. |

**Movimento (3 s iniciais):** Microanimação Lottie com ícones de apoio e elementos da natureza em tons suaves.

**Legenda do Reel:**

> Entenda como a medicação atua como suporte temporário na saúde mental.
> 
> 🎧 Ouça o artigo narrado no Portal: https://drsaudemental.vercel.app/artigo/o-balcao-da-farmacia-e-as-perguntas-nao-feitas

## Stories

| # | Texto | Recurso |
|---|---|---|
| 1 | Você já teve dúvidas silenciosas ao renovar uma receita médica? | Enquete: Sim / Não |
| 2 | O que você gostaria de perguntar ao seu médico sobre o seu tratamento? | Caixa de perguntas: Deixe sua dúvida aqui |
| 3 | Leia nossa crônica completa no Portal e entenda como a escuta transforma o cuidado. 🎧 Ouça o artigo narrado no Portal: https://drsaudemental.vercel.app/artigo/o-balcao-da-farmacia-e-as-perguntas-nao-feitas Apoio agora: CVV 188 · SAMU 192 | Link para o Portal (artigo e áudio) |

Rodapé do último Story: Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638

## LinkedIn 1: autoridade

> Na Atenção Primária à Saúde, o atendimento vai muito além da prescrição burocrática. O balcão da farmácia e o momento da renovação de receitas revelam receios profundos, como o medo da dependência e o estigma em torno do tratamento. Como profissionais, precisamos enxergar a pessoa por trás do papel timbrado, oferecendo escuta ativa, validação do sofrimento e um plano de cuidado integral. Leia o artigo completo no Portal.
>
> Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638
> Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).

## LinkedIn 2: educativo

> A medicação é uma ferramenta valiosa de suporte no cuidado em saúde mental, mas ela não substitui a escuta humanizada. Entender o remédio como um apoio temporário e olhar para o contexto de vida do paciente — como o sono, a rotina e as relações — faz toda a diferença na eficácia do tratamento. Leia o artigo completo no Portal.
>
> Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638
> Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).

## YouTube

### Títulos

1. O balcão da farmácia e as perguntas não feitas
2. Renovação de receitas e a saúde mental na APS
3. O papel da escuta no tratamento medicamentoso
4. Medicação e suporte: entendendo o cuidado
5. Por trás da receita: escuta e acolhimento

### Short 1: O balcão da farmácia e as perguntas não feitas

- **Gancho:** Você já teve medo de que o remédio fosse para sempre?
- **Desenvolvimento:** Na Atenção Primária, a renovação de receitas revela dúvidas silenciosas e receios sobre o tratamento.
- **CTA:** Leia o artigo completo no Portal.
- **Movimento (3 s iniciais):** Elemento 3D leve de um bloco de receitas com transição para um ambiente acolhedor.

```metadados:short-1
titulo: O balcão da farmácia e as perguntas não feitas
tags: saúde mental, atenção primária, cuidado humanizado, receita médica, escuta
descricao:
O balcão da farmácia revela dúvidas silenciosas e a importância da escuta na saúde mental. Conheça uma reflexão sobre o cuidado humanizado.
```

### Short 2: O remédio é para sempre na saúde mental?

- **Gancho:** A medicação precisa acompanhar você para o resto da vida?
- **Desenvolvimento:** A medicação atua como suporte temporário para o organismo recuperar o equilíbrio, sempre aliada à escuta.
- **CTA:** Acesse o Portal para saber mais.
- **Movimento (3 s iniciais):** Microanimação Lottie com balanças equilibrando remédio e qualidade de vida.

```metadados:short-2
titulo: O remédio é para sempre na saúde mental?
tags: medicamento, suporte, saúde mental, médico de família, acolhimento
descricao:
Entenda como a medicação funciona como ferramenta de suporte na saúde mental e por que o acolhimento é essencial.
```

## YouTube — vídeo longo (16:9)

```metadados:longo
titulo: O balcão da farmácia e as perguntas não feitas
tags: saúde mental, atenção primária, médico de família, cuidado humanizado, receita, escuta, ansiedade, tratamento, bem-estar, psicossocial
descricao:
O balcão da farmácia e a renovação de receitas revelam dúvidas silenciosas e abrem espaço para o acolhimento na Atenção Primária. Uma reflexão sobre o cuidado humanizado em saúde mental.
```

### Capítulos

- 0:00 Introdução
- 1:00 O balcão da farmácia
- 3:00 O mito do remédio para sempre
- 5:00 A escuta e o cuidado integral

### Roteiro

| Tempo | Bloco | Fala | B-roll | Texto na tela |
|---|---|---|---|---|
| 0:00–0:30 | Gancho | O balcão da farmácia do posto de saúde guarda histórias silenciosas. E se a renovação de uma receita fosse muito mais do que um ato burocrático? | Animação 2D de um balcão de atendimento e caixas de remédios. | O balcão da farmácia |
| 0:30–2:00 | Promessa honesta e desenvolvimento | Neste vídeo, vamos refletir sobre como a Atenção Primária acolhe dúvidas silenciosas, como o medo da dependência e a função real dos medicamentos na saúde mental. | Gráficos limpos mostrando o fluxo de atendimento na APS. | Cuidado na Atenção Primária |
| 2:00–6:00 | Conteúdo principal | Muitas pessoas chegam com receio de que o remédio seja um sinal de fraqueza ou que precisem dele para sempre. A medicação é uma ferramenta de suporte, um apoio temporário, mas o tratamento exige escuta, validação e atenção à rotina. | Animação ilustrando o diálogo médico-paciente e hábitos de vida. | Suporte temporário e escuta |
| 6:00–8:00 | Recapitulação e CTA | Cuidar da saúde mental exige tempo para olhar nos olhos e construir caminhos juntos. Leia o artigo completo no Portal. | Tela final com identidade visual acolhedora. | Construindo caminhos juntos |

> Na publicação (npm run bot:publicar), a descrição do YouTube recebe automaticamente: link do artigo, capítulos (no longo),
> "#Shorts" (nos Shorts), aviso educativo, CVV 188/SAMU 192, identificação completa do médico e o aviso da Res. CFM 2.454/2026.
