# Ecossistema de conteúdo: Saúde mental de professores

**Artigo-base:** `professores-saude-mental`, versão reescrita e aprovada (semana 1, com referências verificadas). O texto foi colado na conversa em 2026-09-25, porque o `reescritas-semana-1.zip` não estava na pasta.
**Modo:** Essencial (etapas 1, 2, 4, 5, 6, 10 e 12).
**Fontes do artigo:** (1) Agyapong et al., 2022, *IJERPH*, revisão de escopo. (2) Harvey et al., 2017, *Occup Environ Med*, meta-revisão sistemática.

---

## Antes de publicar: três pendências fora do conteúdo

1. **A fila automática vai postar este artigo a partir do MongoDB, não desta versão.** O próximo horário da fila (12h ou 19h, horário de Brasília) publica a `imagemCapa` com a legenda automática (`título + resumo + "Leia mais: <url>"`), montada por `montarLegenda()` em `backend/lib/socialPublisher.js`. Se a versão reescrita ainda não estiver no banco, o post e o link vão levar à versão antiga do site, sem as referências verificadas e sem a linha do CVV. Duas saídas: atualizar o artigo no banco antes do próximo horário, ou pausar a fila (apagar `CRON_SECRET` na Vercel).
2. **Não reaproveitar o carrossel antigo** de `carrosseis-instagram/professores-saude-mental/`, gerado em 2026-09-12. Ele foi feito a partir da versão antiga, a legenda traz "Antonio" sem acento e a hashtag `#psiquiatria`, que pode sugerir uma especialidade que o Dr. Antônio Felipe não tem.
3. **Kit NR-1 como CTA para gestores [A CONFIRMAR]:** as NRs se aplicam a vínculos CLT. O CTA do Kit NR-1 serve a escolas particulares. Para redes públicas com servidores estatutários, use "consultoria em saúde mental ocupacional" até confirmar se a norma se aplica à rede.

---

## 1. Resumo estratégico

| Item | Leitura |
|---|---|
| **Tema central** | O adoecimento psíquico de professores é frequente, tem causas conhecidas no próprio trabalho e afeta os alunos. |
| **Público principal** | Professores da educação infantil ao ensino médio. |
| **Públicos secundários** | Gestores escolares e de redes de ensino, que são o público de conversão. Famílias, que ajudam a espalhar o conteúdo. |
| **Estágio de consciência** | Professores sentem o cansaço, mas costumam tratá-lo como "parte do trabalho", sem reconhecer os sinais. Gestores conhecem o problema, mas não sabem o que está nas mãos da escola. |
| **Dores** | Cansaço que o recesso não resolve. Angústia no domingo à noite. Mensagens de famílias fora do horário. Violência e desrespeito à autoridade docente. Isolamento. Sensação de que nada dá resultado. |
| **Desejos** | Ter limites respeitados. Dividir o peso com colegas. Saber quando é hora de pedir ajuda, sem culpa. |
| **Objeções** | "Todo professor é cansado, é normal." "Afastamento é fracasso." "Não tenho tempo para cuidar de mim." Do gestor: "isso depende de salário e de governo, não da escola." |
| **Onde gera autoridade** | Junta uma revisão internacional com números e uma meta-revisão de fatores de risco no trabalho a orientações separadas por público. É a leitura de medicina do trabalho aplicada à escola, sem precisar de caso clínico. |
| **Conversão** | CTA principal: ler o artigo completo (sinais e atitudes). Para gestores: consultoria em saúde mental ocupacional, porque a seção "o que depende da escola" é a ponte natural. Kit NR-1 só para escola particular (ver pendência 3). Para o professor, a consulta de orientação fica como CTA secundário. |

---

## 2. Insights extraídos

### As 10 ideias mais fortes
1. No discurso, o professor é essencial; na prática, convive com turmas superlotadas, infraestrutura precária e funções que vão muito além de ensinar.
2. Sofrimento psíquico entre professores é comum, e não exceção.
3. Numa revisão de estudos de vários países, considerando só quadros moderados a graves, os números foram: burnout em 25% a 74%, ansiedade em 38% a 41% e depressão em 4% a 77%.
4. As faixas são largas porque escolas e países diferem. Tamanho das turmas, tempo de profissão, satisfação com o trabalho e disciplina lecionada aparecem entre os fatores associados.
5. Na educação infantil predomina a exaustão emocional: o cuidado é intenso e contínuo, a etapa é desvalorizada e faltam auxiliares e materiais.
6. Nos anos finais e no ensino médio aparecem mais o distanciamento e a impotência. O professor media conflitos, percebe sofrimento nos alunos e sustenta a autoridade pedagógica, muitas vezes sem preparo para isso.
7. Fadiga por compaixão: o esgotamento de testemunhar a vulnerabilidade dos alunos sem ter como transformá-la.
8. O desrespeito cotidiano à autoridade docente desgasta em silêncio, sobretudo em territórios de alta vulnerabilidade.
9. Alta exigência com pouco controle, esforço sem recompensa, injustiça nas decisões, assédio e pouco apoio social estão entre os fatores mais associados a ansiedade e depressão no trabalho. Boa parte disso depende da gestão.
10. Cuidar do professor protege crianças e adolescentes. E, em alguns casos, o afastamento faz parte do cuidado.

### As 10 frases mais marcantes
1. "Quando o professor adoece, os alunos também perdem."
2. "Sofrimento psíquico entre professores é comum, e não é exceção."
3. "O professor é muitas vezes a primeira referência de cuidado fora da família."
4. "Fadiga por compaixão: o esgotamento de testemunhar a vulnerabilidade dos alunos sem ter como transformá-la."
5. "Cansaço que não passa com o fim de semana nem com o recesso."
6. "Angústia no domingo à noite ou ao chegar à escola."
7. "Dividir a experiência reduz a sensação de isolamento."
8. "O suficiente, não o perfeito."
9. "Para muitos alunos, o professor é a única relação de cuidado consistente fora de casa."
10. "Um período de afastamento faz parte do cuidado, e não é fracasso."

### Os 10 aprendizados práticos para hoje
1. Conferir os seis sinais de alerta. Se vários aparecem juntos e duram semanas, é hora de buscar ajuda.
2. Combinar com a coordenação um horário para as mensagens das famílias.
3. Silenciar os grupos fora do expediente.
4. Escolher um colega de confiança e conversar com ele ainda esta semana.
5. Nas semanas de mais carga, decidir antes o que vai ficar "bom o bastante".
6. Observar se aumentou o uso de álcool, café ou remédios para dormir.
7. Saber onde procurar ajuda: UBS, serviço de saúde do trabalhador da rede de ensino ou profissional de saúde mental.
8. **Gestor:** criar um espaço regular de escuta e troca entre professores.
9. **Gestor:** revisar a divisão de turmas, tarefas e projetos e ter um protocolo claro para casos de violência contra professores.
10. Guardar os contatos: CVV 188 (24h, gratuito, também em cvv.org.br) e SAMU 192.

---

## 4. Instagram

### 5 ganchos para Reels
1. Cansaço que nem o recesso resolve merece atenção.
2. Angústia no domingo à noite? Preste atenção nisso.
3. Quando o professor adoece, os alunos também perdem.
4. Seis sinais de que a sala de aula está pesando.
5. Afastamento do trabalho também pode ser cuidado.

### Carrossel: "Quando o professor adoece" (10 slides, 4:5, 1080 × 1350)

Paleta do site: fundo `#FAF7F2`, títulos `#0D3330`, destaques `#185D58`. Fonte: Fraunces nos títulos, Inter no corpo. "Burnout" é a única palavra em inglês permitida nas artes (CLAUDE.md, Regra 17). Na capa, sempre "Esgotamento profissional (burnout)"; nos demais slides, os dois termos podem aparecer.

| Slide | Texto (pronto para o Canva) | Sugestão visual |
|---|---|---|
| 1 (capa) | Esgotamento profissional (burnout) · **Quando o professor adoece, os alunos também perdem.** Sinais de alerta e o que fazer. | "Esgotamento profissional (burnout)" como sobretítulo pequeno em `#185D58`, acima do título grande em `#0D3330` sobre `#FAF7F2`. Foto de mesa de professor com cadernos e caneca, sem pessoas. |
| 2 | No discurso, o professor é essencial. Na prática: turmas cheias, violência, burocracia, cobrança das famílias e pouco reconhecimento. | Duas colunas: "No discurso" e "Na prática". Tipografia limpa, sem ícones de alarme. |
| 3 | Numa revisão de estudos de vários países, o burnout moderado a grave apareceu em 25% a 74% dos professores. Ansiedade: 38% a 41%. | Os números como âncora, em `#185D58`. Rodapé pequeno: "Fonte: Agyapong et al., 2022". |
| 4 | As faixas são largas porque escolas e países são diferentes. A mensagem é clara: sofrimento psíquico entre professores é comum, não exceção. | Texto centralizado à esquerda, com a última frase em negrito. |
| 5 | **Educação infantil:** predomina a exaustão emocional. **Anos finais e ensino médio:** distanciamento e sensação de impotência. | Divisão em duas metades, com um ícone de linha simples em cada (bloco de montar, livro). |
| 6 | Sinais de alerta: cansaço que não passa no recesso, angústia no domingo à noite, impaciência crescente, insônia, mais álcool, café ou remédios para dormir. | Lista com marcadores discretos. Deve ser o slide mais salvo. |
| 7 | Vários sinais juntos, por semanas: procure a UBS, o serviço de saúde do trabalhador da sua rede ou um profissional de saúde mental. | Faixa `#185D58` com texto branco (contraste 7,65:1). |
| 8 | Três atitudes que protegem: 1. Limite para mensagens fora do horário. 2. Conversa com colegas de confiança. 3. O suficiente, não o perfeito. | Três blocos numerados, com um respiro generoso entre eles. |
| 9 (salve/compartilhe) | Salve para reler numa semana difícil. Envie para um colega professor ou para a coordenação da sua escola. | Ícones nativos de salvar e compartilhar, desenhados em linha. |
| 10 (CTA) | Artigo completo, com o que a gestão escolar pode fazer, no link da bio. Precisa de apoio agora? CVV 188 · SAMU 192 | Rodapé com a identificação resumida: "Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638". |

### 2 roteiros de Reels (9:16)

Para as duas gravações: não filmar alunos reais nem salas em que alguém possa ser identificado. Use sala vazia, objetos ou colegas adultos que tenham autorizado a gravação. Telas de celular sem nomes nem fotos visíveis.

**Reel 1: "Seis sinais" (cerca de 40 s)**

| Tempo | Cena | Texto na tela | Fala (câmera ou narração) |
|---|---|---|---|
| 0–3 s | Mão fechando o diário de classe à noite, sob luz de abajur | Cansaço que nem o recesso resolve | "Se nem o recesso resolve o seu cansaço, preste atenção." |
| 3–9 s | Mesa com uma pilha de provas para corrigir | 1. Cansaço que não passa · 2. Angústia no domingo à noite | "Cansaço que não passa com o fim de semana. Angústia no domingo à noite, ou na hora de entrar na escola." |
| 9–15 s | Celular vibrando com notificações de grupo às 22h | 3. Impaciência crescente · 4. Nada parece dar resultado | "Impaciência que só cresce, com alunos, colegas e famílias. A sensação de que nada do que você faz dá resultado." |
| 15–22 s | Xícaras de café se acumulando na mesa | 5. Insônia, dor de cabeça, rouquidão · 6. Mais álcool, café ou remédio para dormir | "Insônia, dor de cabeça, tensão, rouquidão frequente. E mais álcool, mais café, mais remédio para dormir." |
| 22–32 s | Pessoa de costas olhando pela janela de uma sala vazia | Vários juntos, por semanas? Hora de buscar ajuda. | "Um dia ruim todo mundo tem. Vários sinais juntos, durante semanas, pedem ajuda: a UBS, o serviço de saúde do trabalhador da sua rede ou um profissional de saúde mental." |
| 32–40 s | Cartela final em `#FAF7F2` | Artigo completo no link da bio · CVV 188 · SAMU 192 | "O artigo completo está no link da bio. Mande para aquele colega que anda carregando a escola nas costas." |

**Reel 2: "Três atitudes que protegem" (cerca de 32 s)**

| Tempo | Cena | Texto na tela | Fala |
|---|---|---|---|
| 0–3 s | Mão silenciando um grupo de mensagens no celular | Três atitudes que protegem professores | "Três atitudes que protegem quem dá aula." |
| 3–11 s | Agenda aberta com um horário marcado: "mensagens das famílias" | 1. Limites | "Primeira: limites. Combine com a coordenação um horário para as mensagens das famílias. Fora do expediente, grupo silenciado." |
| 11–19 s | Dois colegas adultos conversando na sala dos professores | 2. Pares: dividir reduz o isolamento | "Segunda: converse com colegas de confiança. Dividir a experiência diminui o isolamento, um dos maiores fatores de desgaste." |
| 19–26 s | Pilha de cadernos, com metade dela deixada de lado | 3. O suficiente, não o perfeito | "Terceira: nas semanas de mais carga, escolha o que pode ficar bom o bastante." |
| 26–32 s | Cartela final | Cansaço que dura semanas pede ajuda. Artigo no link da bio · CVV 188 | "Se o cansaço dura semanas, isso não se resolve só com atitude individual. Procure ajuda. O artigo completo está no link da bio." |

Na descrição dos dois Reels vai a identificação completa (bloco no fim deste arquivo).

### 5 Stories em sequência (9:16)

| # | Conteúdo | Recurso |
|---|---|---|
| 1 | "Domingo à noite pesa para você?" | Enquete: *Sim* / *Às vezes* / *Não* |
| 2 | "Sinais de alerta em professores: cansaço que não passa no recesso · angústia no domingo à noite · impaciência crescente" | Texto sobre fundo `#FAF7F2` |
| 3 | "Também: sensação de que nada dá resultado · insônia, dores, rouquidão · mais álcool, café ou remédio para dormir" | Enquete: "Reconhece algum?" *Sim* / *Não* |
| 4 | "Qual destas você consegue começar esta semana?" | Enquete com 3 opções: *Limite de horário* / *Conversar com um colega* / *O suficiente, não o perfeito* |
| 5 | "Vários sinais juntos, por semanas? Procure ajuda. Artigo completo aqui. Apoio agora: CVV 188 · SAMU 192" | Figurinha de link para o artigo |

Evitei a caixa de pergunta de propósito. Ela convida relatos pessoais, que alguém teria de acompanhar e responder com cuidado. Se decidir usar, qualquer resposta com sinal de risco precisa ser respondida em privado com CVV 188, SAMU 192 e a orientação de procurar um serviço de saúde. Nunca repostar respostas.

### Legenda (para o carrossel)

> Cansaço que nem o recesso resolve merece atenção.
>
> Numa revisão de estudos de vários países, o burnout moderado a grave apareceu em 25% a 74% dos professores. A variação é grande porque escolas e países são diferentes. A conclusão é a mesma: sofrimento psíquico na docência é comum.
>
> Na educação infantil, predomina a exaustão emocional. Nos anos finais e no ensino médio, o distanciamento e a sensação de impotência.
>
> No carrossel estão os sinais de alerta e três atitudes que protegem. O artigo também traz o que depende da gestão da escola, porque o professor não resolve isso sozinho.
>
> Salve e envie para um colega professor.
>
> 🔗 Artigo completo no link da bio
>
> Se você precisar de apoio agora: CVV 188 (24h, gratuito, também em cvv.org.br) · SAMU 192.
>
> #saudementaldocente #professores #educacao #saudedotrabalhador #esgotamentoprofissional

### O que é automático e o que é manual

| Peça | Publicação | Motivo |
|---|---|---|
| Capa do artigo (imagem única) | **Fila automática** (cron das 12h/19h) | Único formato que o `socialPublisher.js` posta sozinho. Usa a legenda automática, não a legenda acima (ver pendência 1). |
| Carrossel | Manual | Os PNGs não têm URL pública; a API da fila não posta carrossel. |
| Reels 1 e 2 | Manual | Exigem vídeo, e a música precisa ser escolhida no app. |
| Stories 1–5 | Manual | Enquetes e figurinha de link só existem no app. |

---

## 5. LinkedIn

A fila não posta no LinkedIn, porque as credenciais `LINKEDIN_*` não estão configuradas. Os dois posts são manuais.

### Post 1: autoridade (gestores e RH de redes de ensino)

> O adoecimento de professores tem causas conhecidas. Várias delas estão dentro da escola.
>
> Uma revisão de estudos de vários países encontrou, só entre quadros moderados a graves, burnout em 25% a 74% dos professores e ansiedade em 38% a 41%.
>
> As faixas são largas porque escolas e países diferem. A mensagem não muda: é comum.
>
> Revisões sobre saúde mental no trabalho apontam o que mais pesa: alta exigência com pouco controle, esforço sem recompensa, decisões injustas, assédio e pouco apoio social.
>
> Na escola, isso vira gestão:
> → espaços regulares de escuta entre professores;
> → divisão justa de turmas, tarefas e projetos;
> → apoio da coordenação e de equipe multiprofissional para alunos em situação difícil;
> → protocolo claro para violência contra professores;
> → limite para o contato das famílias fora do horário.
>
> Nenhum desses itens é tarefa do professor sozinho.
>
> E cuidar do professor também protege o aluno. Para muitos, ele é a única relação de cuidado consistente fora de casa.
>
> Se você está na gestão de uma escola e quer organizar isso, a consultoria em saúde mental ocupacional começa por esse diagnóstico. O contato está no site.
>
> Artigo completo: drsaudemental.vercel.app/artigo/professores-saude-mental
>
> Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638

### Post 2: educativo (professores, passo a passo)

> Cansaço que nem o recesso resolve merece atenção.
>
> Seis sinais de alerta para quem dá aula:
> 1. Cansaço que não passa com o fim de semana.
> 2. Angústia no domingo à noite ou ao chegar à escola.
> 3. Impaciência crescente com alunos, colegas e famílias.
> 4. Sensação de que nada do que você faz dá resultado.
> 5. Insônia, dor de cabeça, tensão muscular, rouquidão frequente.
> 6. Mais álcool, café ou remédio para dormir.
>
> Vários juntos, por semanas: hora de buscar ajuda. UBS, serviço de saúde do trabalhador da sua rede ou um profissional de saúde mental.
>
> Três atitudes que protegem:
> → Limites: combine com a coordenação um horário para as mensagens das famílias.
> → Pares: converse com colegas de confiança. O isolamento é um dos maiores fatores de desgaste.
> → Nas semanas pesadas, o suficiente, não o perfeito.
>
> Em alguns casos, um período de afastamento faz parte do cuidado. Não é fracasso.
>
> Envie para um colega professor.
> Artigo completo: drsaudemental.vercel.app/artigo/professores-saude-mental
>
> Apoio agora: CVV 188 · SAMU 192
> Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638

---

## 6. YouTube

### 5 títulos (até 60 caracteres, palavra-chave no início)
1. Saúde mental do professor: 6 sinais de alerta
2. Burnout em professores: por que é tão comum
3. Saúde mental de professores: o que a escola pode fazer
4. Esgotamento de professores: 3 atitudes que protegem
5. Professor esgotado: quando buscar ajuda e onde

### 2 roteiros de Shorts (9:16, até 60 s)

**Short 1: "Fadiga por compaixão" (cerca de 45 s)**
- **Gancho (0–3 s).** Texto na tela: *Fadiga por compaixão*. Fala: "Existe um cansaço que vem de ver o aluno sofrer e não conseguir mudar isso."
- **Desenvolvimento (3–38 s).** "Tem nome: fadiga por compaixão. É o esgotamento de testemunhar a vulnerabilidade dos alunos sem ter como transformá-la. Nos anos finais e no ensino médio, o professor, além de ensinar, media conflitos, percebe sofrimento emocional nos alunos e sustenta a autoridade pedagógica. Muitas vezes sem ter sido preparado para isso. Some a isso o desrespeito cotidiano à autoridade docente, que desgasta em silêncio, principalmente em territórios de alta vulnerabilidade."
- **CTA (38–45 s).** "Se isso soa familiar, converse com colegas de confiança. Se o cansaço durar semanas, procure ajuda. O artigo completo está na descrição."

**Short 2: "Dois perfis de adoecimento" (cerca de 40 s)**
- **Gancho (0–3 s).** Texto na tela: *Educação infantil × Ensino médio*. Fala: "O professor da educação infantil e o do ensino médio adoecem de jeitos diferentes."
- **Desenvolvimento (3–33 s).** "Na educação infantil predomina a exaustão emocional. O cuidado com crianças pequenas é intenso e contínuo, a etapa é historicamente desvalorizada e, com frequência, faltam auxiliares e materiais. Nos anos finais e no ensino médio, o que mais aparece é o distanciamento e a sensação de impotência diante de comportamentos desafiadores."
- **CTA (33–40 s).** "Nos dois casos, cansaço que não passa por semanas é sinal para buscar ajuda. O artigo completo está na descrição."

**Descrição dos dois Shorts:**
```
Artigo completo: https://drsaudemental.vercel.app/artigo/professores-saude-mental
Conteúdo educativo. Não substitui avaliação individual.
Apoio agora: CVV 188 (24h, gratuito, também em cvv.org.br) · SAMU 192

Dr. Antônio Felipe · Médico · CRM-BA 41322
Especialista em Medicina de Família e Comunidade · RQE 26638
Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)
Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho
NÃO ESPECIALISTA
```

---

## 10. Calendário da semana (28/09 a 04/10/2026)

A fila automática já publica até 2 posts de feed por dia (12h e 19h), com outros artigos. Por isso as peças manuais de feed ficam fora desses horários. Os horários abaixo são pontos de partida para testar, não dados de desempenho.

| Dia | Plataforma | Formato | Peça | Horário | Objetivo | Publicação |
|---|---|---|---|---|---|---|
| Próximo horário da fila | Instagram | Imagem única | Capa do artigo | 12h ou 19h | Atenção e tráfego | **Automática** (ver pendência 1) |
| Seg 28/09 | Instagram | Carrossel | "Quando o professor adoece" + legenda | 20h30 | Salvamentos e envios | Manual |
| Ter 29/09 | LinkedIn | Texto | Post 1 (autoridade, gestores) | 8h | Autoridade e consultoria | Manual |
| Qua 30/09 | Instagram | Reel | Reel 1 "Seis sinais" | 20h30 | Alcance | Manual |
| Qui 01/10 | LinkedIn | Texto | Post 2 (educativo) | 8h | Compartilhamento entre professores | Manual |
| Qui 01/10 | YouTube | Short | Short 1 "Fadiga por compaixão" | 18h | Descoberta por busca | Manual |
| Sex 02/10 | Instagram | Reel | Reel 2 "Três atitudes" | 20h30 | Salvamentos | Manual |
| Sáb 03/10 | YouTube | Short | Short 2 "Dois perfis" | 10h | Descoberta por busca | Manual |
| Dom 04/10 | Instagram | Stories | Sequência 1–5 (enquete "Domingo à noite pesa?") | 20h | Conversa e clique no link | Manual |

---

## 12. Tripla checagem final

### Conteúdo
- ✅ **Fiel ao artigo.** Todos os números (25–74%, 38–41%, 4–77%) e as duas fontes são os do artigo reescrito. Nenhum dado, estudo ou fala foi acrescentado.
- ✅ **Nada inventado.** Não usei caso clínico nem relato, por isso não foi preciso montar narrativa composta.
- ✅ **Português correto** em todas as peças.
- ✅ **"Burnout"** é a única palavra em inglês nas artes, dentro da exceção registrada no CLAUDE.md. A capa traz "Esgotamento profissional (burnout)".
- ✅ **Kit NR-1** ficou fora das peças. O CTA para gestores é "consultoria em saúde mental ocupacional" (ver pendência 3).

### Visual
- ✅ **Texto das artes todo em português.**
- ✅ **Formatos:** 4:5 (1080 × 1350) no carrossel; 9:16 em Reels, Stories e Shorts.
- ✅ **Carrossel com no máximo 25 palavras por slide.** O maior tem 23 (slide 3 e slides 6 a 8). O slide 10 tem 22, fora o rodapé de identificação.
- ✅ **Limites de tamanho conferidos por script:** ganchos com até 10 palavras, títulos do YouTube com 43 a 54 caracteres e os dois posts de LinkedIn com menos de 1.300 caracteres.
- ✅ **Contraste:** paleta do site; o texto branco sobre `#185D58` tem 7,65:1 (AAA).

### Ética e segurança
- ✅ **Identificação CFM:** a versão resumida (com o nome da especialidade junto do RQE e sem "NÃO ESPECIALISTA") está no slide 10 e nos dois posts de LinkedIn. A versão completa, com as pós-graduações e "NÃO ESPECIALISTA" logo abaixo delas, está na descrição dos Reels e dos Shorts.
- ✅ **Especialidade:** em nenhum lugar o autor é chamado de "psiquiatra" ou "especialista em saúde mental". A hashtag `#psiquiatria` do carrossel antigo não foi reaproveitada.
- ✅ **Sem sensacionalismo nem promessa de resultado.** O Reel 2 diz com clareza que atitude individual não basta quando o cansaço persiste.
- ✅ **Comunicação segura.** Nenhuma peça fala de suicídio ou de métodos. CVV 188 e SAMU 192 aparecem no carrossel, na legenda, no Reel 1, nos Stories, no LinkedIn 2 e nos Shorts.
- ✅ **Ninguém identificável.** Os roteiros proíbem filmar alunos reais; os Stories não usam caixa de pergunta.
- ⚠️ **Fora do conteúdo:** a peça automática da fila sai do MongoDB, não desta versão, e não traz CVV (pendência 1). É uma decisão sua antes do próximo horário da fila.

---

**Identificação completa (para roteiros, descrições e peças que circulam fora do perfil):**
```
Dr. Antônio Felipe · Médico · CRM-BA 41322
Especialista em Medicina de Família e Comunidade · RQE 26638
Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)
Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho
NÃO ESPECIALISTA
```
