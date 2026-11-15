# Guia Mestre DrSM

**Versão 1.0 — 14/11/2026.** Aprovado pelo Dr. Antônio Felipe. Auditoria e redação: Claude.

> **Para o Claude Code:** este guia é a referência obrigatória de todo o ecossistema. **Consulte-o antes de qualquer tarefa.** Quando houver conflito, vale esta ordem:
> 1. a ordem escrita mais recente do Dr.;
> 2. este guia;
> 3. o `CLAUDE.md`, o `docs/DESIGN.md` e o `docs/METODO-DRSM.md`;
> 4. as skills.
>
> Ponto que o guia não cobre: decida pelo **mais seguro e reversível**, registre a decisão no `relatorios/ESTADO-GERAL.md` e siga.

---

## Sumário

1. Como usar este guia
2. Identidade e missão
3. Regras éticas, legais e de segurança do conteúdo
4. Regras operacionais (código, banco, publicação)
5. Auditoria geral e tripla checagem
6. Método DrSM: a fábrica de produção
7. Identidade visual: cores, letras, ícones, infográficos e personagens
8. Portal: arquitetura e visual
9. Canais: YouTube, Instagram, LinkedIn, Spotify, WhatsApp, newsletter e Portal
10. Calendário editorial e cadência
11. Produção audiovisual: ferramentas e padrões
12. Automação, rotina e papéis
13. Monetização ética
14. Metas 2027
15. Checklists por peça
16. Caminhos, arquivos e glossário

---

## 1. Como usar este guia

- **Onde fica:**
  - `docs/GUIA-MESTRE-DRSM.md` no repositório: é a versão que vale;
  - o PDF é cópia de leitura para o Dr.
- **Skill:** a skill `guia-drsm` manda ler este guia no início de toda sessão e antes de cada etapa.
- **Atualização:**
  - só por PR, com portão aprovado e merge do Dr.;
  - cada mudança vai para o "Histórico de versões", no fim do guia.
- **Decisões novas do Dr.:** entram primeiro no `ESTADO-GERAL` e, na revisão semanal, viram texto aqui.
- **Itens "PROPOSTA" ou "A DEFINIR":** ainda não são regra; dependem de ativação escrita do Dr.

---

## 2. Identidade e missão

### 2.1 Quem é o responsável
**Dr. Antônio Felipe Garabito**, médico em Salvador-BA.
- Especialista em **Medicina de Família e Comunidade** (RQE).
- Atua em **Pronto Atendimento Psiquiátrico (PAP)** e **Atenção Primária à Saúde (APS)**.
- Pós-graduações em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho.

### 2.2 Regras de identificação (invioláveis)
- **Nunca** apresentar o Dr. como "psiquiatra".
- Escrever sempre **"Antônio"**, com acento.
- Identificação padrão em **5 linhas** (constante `IDENTIFICACAO_COMPLETA` no código):
  1. Dr. Antônio Felipe — Médico — CRM-BA nº
  2. Especialista em Medicina de Família e Comunidade — RQE nº
  3. Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)
  4. Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho
  5. NÃO ESPECIALISTA
- O Dr. **não aparece**: nem rosto, nem voz, nem avatar. **O protagonismo é das produções.**
- O Dr. **não oferece consulta particular.** Nenhuma peça convida para consulta ou agendamento.

### 2.3 Missão e públicos
- **Missão:** "Saúde mental em cada fase da vida, explicada com clareza e empatia."
- **Frase de acolhida:** "Seja qual for o seu momento, este é um lugar para você. Não é preciso saber explicar o que sente para começar."
- **Públicos:**
  1. pessoas e famílias;
  2. profissionais de saúde;
  3. empresas e RH (NR-1);
  4. escolas e educadores.

### 2.4 Os 7 temas (fonte: `backend/lib/temas.js`)
1. Infância & Família
2. Maternidade & Perinatal
3. Vida Adulta & Envelhecimento
4. Cuidar de Quem Cuida (NR-1)
5. Transtornos Mentais
6. Hábitos & Sono
7. Sociedade & Cultura

**Formato separado:** Relatos da Prática.

**Regra editorial:**
- **Transtornos Mentais** = conceito, diagnóstico e conduta.
- **Os outros 6 temas** = psicoeducação e cuidados.

---

## 3. Regras éticas, legais e de segurança do conteúdo

| Norma | O que exige na prática |
|---|---|
| **CFM 2.336/2023** (publicidade médica) | Sem sensacionalismo, sem promessa de cura, sem "antes e depois", sem preço, sem depoimento de paciente, sem divulgar produto ou marca comercial. |
| **CFM 2.454/2026** (IA na medicina) | Aviso de IA em toda peça: "Conteúdo educativo produzido com apoio de inteligência artificial, com checagem automatizada e aprovado para publicação pelo Dr. Antônio Felipe, responsável pelo conteúdo (Resolução CFM 2.454/2026)." |
| **Código de Ética Médica, art. 75** | Nenhum caso identificável. Os relatos são **ficção literária**, sempre com a nota de ficção. |
| **OMS 2023 (suicídio e mídia)** | Sem método, sem local, sem detalhe, sem suspense em torno da crise. Linguagem: "morreu por suicídio". Sempre caminho de ajuda: **CVV 188 · SAMU 192**. |
| **Linguagem centrada na pessoa** | "pessoa com depressão", "pessoas com TEA". Nunca rótulo como identidade ("o depressivo"). |
| **LGPD** | Nada de dado pessoal ou de saúde guardado em ferramentas do Portal. Formulários só com consentimento explícito. |
| **YouTube (regra de julho de 2026)** | Cada vídeo com valor original. Sem conteúdo repetitivo ou em massa, sem isca emocional, **sem avatar ou persona de IA dando conselho de saúde**. Médico real responsável e visível nos créditos. |
| **Rotulagem de IA** (boa prática, no rumo da Lei de IA europeia, art. 50) | Aviso CFM 2.454, marcação de "conteúdo alterado ou sintético" no YouTube quando houver imagem gerada por IA e origem registrada nos metadados do arquivo. |
| **Direito autoral** | Só material próprio ou com licença que permite uso comercial, registrada. Nunca copiar, transcrever ou "modelar" texto, vídeo, imagem ou música de terceiros. |

**Textos fixos obrigatórios (usar sem alterar):**
- **Nota de ficção (relatos):** "Relato literário inspirado na prática clínica. Personagens, nomes, lugares e detalhes foram criados para proteger a identidade das pessoas. Qualquer semelhança é coincidência."
- **Protocolos:** "Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais."
- **Crise:** "Em crise: CVV 188 · SAMU 192."
- **Crise em espanhol** (aguarda aprovação final do Dr.): "Si estás en crisis o con pensamientos de muerte, llama al número de emergencias de tu país. En Brasil: CVV 188 · SAMU 192."

**Proibido em qualquer peça:**
- foto ou vídeo **realista** de ser humano, inclusive gerado por IA;
- visual infantil e mascote;
- imitação de estilo de estúdio conhecido (Pixar, Disney, Ghibli);
- "canal dark" e operação de vários canais;
- iscas do tipo "comente X";
- música gerada por IA;
- geradores pagos;
- link de afiliado ou de produto.

---

## 4. Regras operacionais (código, banco, publicação)

### 4.1 Código e Git
- Toda mudança em arquivo controlado pelo Git: **worktree** em `C:\DRS-<nome>` → branch → PR.
- **Nunca** editar arquivo controlado pelo Git na pasta principal `C:\DRSAUDEMENTAL`. **Nunca** trocar a branch da pasta principal.
- O **portão** (`npm run portao` / `publicarBranch --so-portao`) roda **só dentro do worktree**, com **cópia real** do `node_modules` do app. Junção quebra o build; `npm install` no worktree não está autorizado.
- Publicar a branch e abrir o PR **só com o portão aprovado** e o commit local igual ao remoto.
- **Merge:** só o Dr., com `npm run merge-seguro -- N`, um por vez.
- **Proibidos:**
  - `git checkout -- .` e `git checkout -- <arquivo>`;
  - `git checkout <ref> -- .`;
  - `git restore .`, `git reset --hard`, `git clean`;
  - `rm -rf`;
  - push na main, force push, apagar branch remota.
- **Junções:** remover só com `cmd /c rmdir C:\DRS-<nome>\node_modules`, sem `/s`, depois de confirmar que é junção.
- **Arquivos temporários:** só em `C:\DRSAUDEMENTAL\.tmp\`, que o Git ignora.

### 4.2 Segredos
- **Nunca** ler, abrir, buscar ou imprimir `.env`, tokens, `kaggle.json` ou chaves.
- Scripts **só de leitura** podem carregar o `.env` com `node --env-file-if-exists=.env`, sem exibir valores.
- **Nunca** pedir ao Dr. que cole um segredo no chat.

### 4.3 Banco, filas e freios
- Gravação no banco, nas filas ou nos freios: **só por script rodado pelo Dr.**, com:
  - `dry-run` como padrão;
  - `--backup`;
  - `--aplicar` (com `--etapa` quando houver);
  - `--conferir`;
  - `--reverter`;
  - `--slugs` quando fizer sentido.
- **Freios** (só mudam por ordem escrita do Dr.; o padrão seguro é: só publica com `"true"`):
  - `REDES_PUBLICACAO_ATIVA`;
  - `YOUTUBE_PUBLICACAO_ATIVA`;
  - `LINKEDIN_PUBLICACAO_ATIVA`.
- **Fila do Instagram:** pastas em `conteudo/redes-v2` → banco `redes_v2`, **só pelo `enviarFilaSeguro.js`**. Ele recusa peça com data passada ou sem `checagem.ok`. O `enviarFila.js` antigo está **proibido**.
- O cron das 08:00 publica tudo que estiver vencido e com `aprovado-checagem`. Por isso **nenhuma peça pode ter data passada**.
- **Proibido:** apagar em massa, apagar post ou vídeo publicado, mudar a configuração ou o plano da Vercel, criar API nova sem autorização escrita.

### 4.4 Execução
- **No máximo 1 monitor por tarefa.** Ele espera o **arquivo final**, nunca uma linha de log.
- **Ação negada pelo sistema:** não contornar; registrar e seguir.
- **Instalações:** só em `C:\DRSAUDEMENTAL\.tmp\`, com versão fixa e licença registrada.

---

## 5. Auditoria geral e tripla checagem

**Regra de ouro:** nenhuma peça sai sem **auditoria geral + tripla checagem técnica, científica e ética, mais a humanizada**. Falhou em qualquer item, a peça não avança e volta para "ajustar".

### 5.1 Técnica
- Formatos, dimensões, duração e loudness conforme a seção 9.
- Ortografia, pontuação, "Antônio", 5 linhas. Itens de lista terminam em ponto final, nunca em ";".
- Sem frase cortada, sem reticências que mudem o sentido e sem fragmento que comece por conector sem antecedente (`falhasDeTexto`).
- Hash das imagens igual ao checado. Data futura. Link funcionando (HTTP 200).
- **Acessibilidade:**
  - contraste WCAG 2.2 AA;
  - texto alternativo nas imagens;
  - legendas SRT nos vídeos;
  - alvos de toque de 44 px.

### 5.2 Científica
- **Toda afirmação clínica ou número tem referência conferida no PubMed**, com PMID ou DOI e o **trecho do resumo que comprova**.
- A referência precisa ser compatível com a frase em **número, população e tipo de medida**. Exemplos de erro:
  - chance (odds) apresentada como risco;
  - residentes apresentados como estudantes;
  - artigo original da escala apresentado como estudo de validação.
- **Busca vazia = "pendente de conferência"**, nunca "errada". Conferir pela **citação exata ou DOI**, não pelo tema.
- Diretriz atual antes de estudo isolado. **Sem extrapolar** o que a fonte diz: "primeira escolha" só se a fonte disser.
- **Dado-chave nas capas:** só artigos da lista `backend/lib/dadosChaveVerificados.json`.

### 5.3 Ética
- Seção 3 inteira: CFM 2.336 e 2.454, CEM art. 75, OMS 2023, LGPD, direitos autorais, YouTube.
- Executar `checarEticaCfm` e o **zero genérico** (`zgGate`), que verifica o eixo do dia e a ausência de conteúdo genérico.

### 5.4 Humanizada
- Leitura em voz alta: soa acolhedor, claro e sem jargão?
- Respeita quem está sofrendo? Não culpa, não assusta, não promete.
- **Sempre** há um próximo passo concreto: autocuidado, UBS ou CAPS, CVV ou SAMU.
- Linguagem simples: frases de até 15 palavras sempre que possível.

### 5.5 Quem audita
- **Claude Code:** executa as checagens automáticas (portões).
- **Claude:** faz a auditoria geral e a tripla checagem das propostas que mudam sentido clínico.
- **Dr.:** responsável final. Aprova as mudanças de sentido clínico e uma **amostra semanal** (seção 6.4).

---

## 6. Método DrSM: a fábrica de produção

### 6.1 Princípios (decisões D1–D5)
- **D1. Automação máxima.** O Dr. não aparece. O protagonismo é das produções. Método e estilo próprios.
- **D2. Imagem.** Proibido: foto ou vídeo **realista** de humano. Autorizado: **desenho animado e anime adultos, em estilo próprio**, inclusive gerados por IA.
  - Checagem automática descarta imagem fotorrealista (classificador CLIP).
  - **Ficha de personagem** fixa: mesmo rosto e roupa em todas as cenas.
- **D3. Ícones.** Família plana **Lucide** (licença ISC) em vídeos e no site. **3dicons** (CC0) só nas capas.
- **D4. IA gratuita na nuvem**, só com modelos de licença que permite uso comercial:
  - **Kaggle** (autorizado): FLUX.1-schnell para imagens e Wan 2.x para animar, ambos Apache-2.0;
  - **Cloudflare Workers AI** (autorizado): FLUX.1-schnell, sempre dentro da cota gratuita;
  - **Modal:** não, pelo risco de cobrança;
  - **Proibidos:** modelos com licença não comercial (ex.: FLUX.1-dev) e qualquer gerador pago.
- **D5. Recusados:**
  - rosto ou voz do Dr.; avatar ou apresentador;
  - "canal dark"; vários canais; iscas;
  - ElevenLabs; música por IA;
  - skill Vox-explainer (usa `npx` sem versão fixa); WanGP local;
  - imitação de canais de terceiros.

### 6.2 Origem de toda peça
**Toda peça nasce de um artigo ou relato JÁ APROVADO no Portal.** A fábrica não cria conteúdo clínico novo e não inventa história. O que entra de novo é forma: gancho, cena, imagem. O sentido clínico fica intacto.

### 6.3 Estrutura padrão de peça educativa
1. **Gancho (até 5 s):** pergunta ou situação concreta tirada do artigo. Sem sensacionalismo, sem promessa.
2. Série e título.
3. Explicação, **com uma ideia completa a cada 60 a 90 s**.
4. **Sinal de alerta** ou **Dado**, com fonte.
5. **O que fazer.**
6. **Onde buscar ajuda no SUS:** UBS, CAPS, UPA; em crise, CVV 188 · SAMU 192.
7. **Cartela final (8 s):** 5 linhas, aviso CFM 2.454, protocolos, crise, crédito "Portal de Saúde Mental Doutor Antônio Felipe Garabito".

### 6.4 Etapas, portões e aprovação
**Etapas:** pauta → roteiro → referências → narração → cenas → montagem → Short/Reel → miniatura → textos de cada rede → **portões** → central de aprovação → agendamento.

**Portões automáticos** (cada um com teste no repositório):

| Etapa | O que o portão verifica |
|---|---|
| Roteiro | origem aprovada; frases curtas; texto fixo exato |
| Referências | PubMed; compatibilidade da frase com a fonte |
| Ética | CFM; OMS; zero genérico |
| Áudio | −14 LUFS; pico ≤ −1,5 dBFS; sem pausa morta acima de 0,5 s |
| Visual | troca de imagem a cada 3–5 s; legibilidade no celular; fotorrealismo; licenças |
| Miniatura | legível; sem sensacionalismo |
| Textos das redes | `checarPost`; `falhasDeTexto`; tamanhos |

**Aprovação:**
- Peça **derivada de conteúdo aprovado** que passa em todos os portões, mais a auditoria do Claude = **"aprovada automaticamente"**, com registro de quem, quando e por quê.
- O Dr. revê **uma amostra semanal** e tudo o que for sinalizado, pela **Central de Aprovação**.
- Mudança de sentido clínico **sempre** vai ao Dr.

### 6.5 Central de Aprovação (deve abrir no celular)
- Página privada, acessível no celular durante o plantão.
- Cada peça mostra a etapa em que está, o vídeo ou a arte, o texto, as referências e o resultado de cada portão.
- **Produção em lote:** a semana é gerada de madrugada e conferida de uma vez.
- **Calendário** por dia e por rede, com alerta de estoque abaixo de 14 dias.
- **Botões:**
  - **Aprovar**;
  - **Pedir ajuste** (texto livre, que vira ordem em arquivo para o Claude Code refazer);
  - **Recusar**.

### 6.6 Regras de retenção e autenticidade
1. Uma ideia completa a cada 60 a 90 s, com um pequeno "ganho" e uma prévia do que vem.
2. Frases de até 15 palavras, voz ativa, pausa antes de cada revelação.
3. O melhor conteúdo na segunda metade, com uma **quebra de padrão no meio** (exemplo, pergunta, mudança de cena ou de música).
4. Cortar pausas mortas acima de 0,5 s na narração; manter as pausas intencionais.
5. Imagem nova a cada 3 a 5 s, com **gráficos próprios**. Biblioteca de infográficos reutilizáveis por conceito.
6. Dado importante também escrito na tela, nos vídeos educativos.
7. Capítulos nos vídeos acima de 5 min. Tela final levando a outro episódio da série.
8. Revisar os vídeos publicados: ver onde as pessoas saem e reeditar os que têm muito acesso e pouca retenção.
9. Conferir a legibilidade no celular.
10. Constância. Conteúdo atemporal.
11. **Variar de propósito dentro de cada série** (ângulo, cenário, estrutura), para nunca parecer modelo repetido.
12. A monetização vem dos serviços próprios do Dr. (seção 13).

---

## 7. Identidade visual: cores, letras, ícones, infográficos e personagens

> Os valores oficiais ficam em `docs/DESIGN.md` e `docs/tokens.json`. Em caso de diferença, **valem os tokens**.

### 7.1 Paleta base
| Token | Cor | Uso |
|---|---|---|
| `--areia-50` | #faf7f2 | Fundo principal |
| `--areia-100` | #f4efe6 | Fundo de seção |
| `--areia-200` | #e9e0d2 | Bordas e divisórias |
| `--verde-900` | #0d3330 | Títulos, fundo escuro |
| `--verde-800` | #114240 | Fundo escuro alternativo |
| `--verde-700` | #185d58 | Links, ícones, destaques |
| `--verde-500` | #2b978d | Elementos gráficos |
| `--verde-300` | #8cc4b8 | Gráficos claros, bordas |
| `--verde-100` | #dbeee8 | Caixas "Para entender" |
| `--dourado` | #c9a227 | Filete, linha de cuidado, detalhes |
| `--terracota` | #c0714f | Alerta suave, contraste |
| `--tinta` | #17211f | Texto principal |
| `--tinta-media` | #45564f | Texto secundário |
| `--tinta-fraca` | #5a6e66 | Legendas (contraste mínimo de 4,5:1) |
| `--alerta-fundo` / `--alerta-tinta` | #fbf1d9 / #4a3606 | Caixa "Sinal de alerta" |

- **Uma cor de destaque por tema**, definida em `tokens.json`, aplicada a capas, miniaturas e infográficos.
- **Modo escuro** em todo o site.
- **Contraste mínimo:** 4,5:1 para texto e 3:1 para elementos gráficos.

### 7.2 Tipografia (licença SIL OFL, hospedada no próprio site)
| Fonte | Onde |
|---|---|
| **Oswald** (500 e 700) | Títulos, ganchos, miniaturas, rótulos ("SINAL DE ALERTA") |
| **Raleway** (400, 500 e 700) | Texto corrido, legendas, cartelas |

- **Sem Google Fonts** externo, por privacidade e desempenho. **Sem Arial** em peça final.
- **Mínimos de leitura:** os do `checagemArte`.
- **Carrossel:** até **25 palavras por tela**.
- **Vídeo:** palavra-chave de até ~6 palavras na tela.

### 7.3 Ícones
- **Lucide** (licença ISC): planos, traço 1,6 a 2 px, na cor do tema. Em vídeo, a partir de 72 px; na vinheta, 140 px.
- **3dicons** (CC0): só nas capas dos artigos.

### 7.4 Assinatura visual DrSM
- **"Linha de cuidado":** linha dourada ou na cor do tema que conduz o olhar e **liga os ícones e as ideias**. Aparece em todo vídeo, capa e página.
- **Vinheta de 2 s:** ícone Lucide e nome da série.
- **Cartões padrão:**
  - "Sinal de alerta";
  - "Dado" (sempre com a fonte);
  - "Passo";
  - "Para refletir";
  - "Para entender".
- **Faixa de crise:** CVV 188 · SAMU 192, discreta e fixa.
- **Cartela final:** padrão da seção 6.3.

### 7.5 Infográficos (o coração dos vídeos educativos)
- **Tela inteira como cena**, nunca um cartão de texto sobre fundo liso.
- **Tipos da biblioteca:**
  - grade de pessoas (ex.: "1 em cada 10");
  - barras e linhas que crescem;
  - linha do tempo;
  - **fluxo** (ex.: preocupação → corpo → comportamento → prejuízo);
  - **comparação lado a lado** (ex.: nervosismo comum × transtorno);
  - ciclo (ex.: ciclo da ansiedade);
  - mapa do cuidado (UBS → CAPS → UPA).
- Constroem-se **em sincronia com a narração**. **Todo número com fonte** discreta na cena.

### 7.6 Personagens e cenários
- **Desenho animado ou anime adulto em estilo próprio**, na paleta DrSM: personagens desenhados pela fábrica (SVG próprio) ou gerados por IA gratuita (seção 6.1, D4).
- **Ficha de personagem** (`personagens/<nome>.json` + folha de modelo): aparência, roupa, paleta e expressões.
- **Linguagem de cinema:**
  - plano de abertura com a câmera descendo do cenário amplo;
  - câmera sempre em movimento lento (push-in, pan, parallax 2.5D);
  - close nas emoções;
  - transições suaves e luz quente.

### 7.7 Padrões proibidos
- Gradiente roxo genérico, cérebro com raios, pessoa segurando a cabeça.
- Foto de pessoa por IA, emoji em excesso.
- Frase motivacional vazia, promessa de cura, visual infantil, mascote, voxel ou pixel art.
- Slide estático como vídeo final (o `produzir.js` por slides está proibido).

---

## 8. Portal: arquitetura e visual

### 8.1 Página inicial
1. **Acolhida:** missão e frase de acolhida.
2. **3 portas por pergunta:**
   - "Por que me sinto assim?";
   - "Entender um transtorno";
   - "O que posso fazer agora".
3. **"Eu sou...":**
   - pessoa ou família;
   - profissional de saúde;
   - empresa, RH ou NR-1;
   - escola ou educador.
   Cada entrada leva aos conteúdos e aos serviços próprios do Dr.
4. **Os 7 temas** e a faixa dos **Relatos da Prática**.
5. **Busca local** com sinônimos (ex.: "não durmo" leva a insônia), sem IA externa.
6. **Faixa de crise** fixa e discreta.

### 8.2 Modelos fixos por tipo de página
| Tipo | Estrutura |
|---|---|
| **Transtorno** | Visão geral → Sinais → **Quando procurar ajuda** (em destaque, no início) → Causas e fatores → Diagnóstico → Tratamento → Como a família pode ajudar → Referências |
| **Psicoeducação** | O que é → Por que acontece → O que ajuda → Quando procurar ajuda → Para entender → Referências |
| **Relato** | Nota de ficção → Relato → Para entender (reflexão clínica) → Onde buscar ajuda. Sem lista de referências no corpo literário. |

**Todo artigo é multimídia:**
- capa infográfica;
- **player da narração**;
- episódio ou Reel relacionado;
- caixa "Para entender";
- referências conferidas;
- barra de leitura e tempo estimado.

### 8.3 Ferramentas
- **"Meu plano de cuidado"** (educativo, sem diagnóstico, **nada é gravado**):
  - perguntas simples de sim ou não;
  - destino claro: autocuidado / UBS em alguns dias / CAPS ou UPA / **SAMU 192 e CVV 188 agora**;
  - "Resumo para levar à consulta", para imprimir ou salvar;
  - escalas validadas de uso livre só com **regra de segurança** (resposta de risco leva direto à ajuda imediata) e **após revisão do Dr.**
- **"Onde buscar ajuda":** UBS, CAPS, UPA, CVV e SAMU explicados, com links oficiais.
- **"Aula de 5 minutos"** e trilhas de formação: empresas (NR-1), escolas, cuidadores.

### 8.4 Acessibilidade, privacidade e desempenho
- **Acessibilidade:**
  - WCAG 2.2 AA; `prefers-reduced-motion`; modo escuro;
  - **botão de tamanho de letra**; versão leve para internet fraca.
- **Retorno do leitor:** "Esta página ajudou?" anônimo no fim de cada página.
- **Privacidade:** anônimo, sem rastreamento invasivo, LGPD.
- **Desempenho e busca:**
  - LCP abaixo de 2,5 s;
  - Lighthouse ≥ 95 em acessibilidade, boas práticas e SEO;
  - dados estruturados `MedicalWebPage`, com autor médico.
- **Espanhol** (`/es/`): `noindex` até a curadoria do Dr. Aviso de crise em espanhol (seção 3).
- **Sem AdSense no Portal.** **Sem agendamento de consulta.**

---

## 9. Canais

> Horário padrão de publicação: **08:00 (Brasília)**. No mesmo dia, a mesma pauta em todas as redes, adaptada a cada uma.

### 9.1 YouTube (canal educativo, só para adultos)
- **Marcação:** "não é conteúdo para crianças" em todo vídeo. Marcar "conteúdo alterado ou sintético" quando houver imagem gerada por IA.
- **Séries:**
  1. "Ansiedade no dia a dia";
  2. "Pais e filhos: como ajudar";
  3. "Cuidar de quem cuida" (NR-1);
  4. "Entendendo os transtornos";
  5. "Relatos da Prática" (relatos-filme).
- **Episódio:** 16:9, 1920×1080, 3 a 8 min, infográfico animado (seção 7.5), narração Kokoro, −14 LUFS, SRT, cartela de 8 s, capítulos acima de 5 min, tela final.
- **Shorts:** 9:16, até 60 s (ou 90 s), gancho nos 2 primeiros segundos, legenda queimada.
- **Relato-filme:** capítulo longo de 5 a 10 min, mais **micro-capítulos verticais de 1 a 3 min**, como uma novela em episódios.
- **Miniatura:** 1280×720, título em Oswald grande, ícone, cor do tema, sem rosto, legível no celular. Duas opções por vídeo.
- **Título:** claro e sem sensacionalismo.
- **Descrição modelo:**
  - resumo;
  - "Roteiro e revisão: Dr. Antônio Felipe";
  - 5 linhas;
  - aviso CFM 2.454;
  - referências e link da página de fontes no Portal;
  - link do artigo;
  - CVV 188 · SAMU 192.
- **Publicação:** pela API, atrás do freio `YOUTUBE_PUBLICACAO_ATIVA`. O Google confirmou em 02/11/2026 que os vídeos enviados pela API não ficam privados. **Conferir a visibilidade do primeiro vídeo.**
- **Estreia:** segunda, 23/11/2026, com 7 dias de estoque.
- **Meta 2027:** selo de **fonte de saúde do YouTube**. Requisitos: Brasil elegível, mais de 1.500 h assistidas em 12 meses ou 1,5 milhão de visualizações de Shorts em 90 dias, licença verificada.

### 9.2 Instagram (@doutor.antoniofelipe.smental)
- **Carrossel diário, às 08:00:**
  - 5 a 8 telas, 1080×1350, até 25 palavras por tela, 5 linhas na arte;
  - legenda com gancho na 1ª linha, lista com ponto final, referências conferidas, aviso CFM, crise e crédito;
  - texto alternativo em todas as telas.
- **Eixo do dia (zero genérico):**

  | Dia | Eixo |
  |---|---|
  | Segunda | E4 |
  | Terça | E5 |
  | Quarta | E1 |
  | Quinta | E3 |
  | Sexta | E6 |
  | Sábado | E7 |
  | Domingo | Relato |

- **Reels:** 2 a 3 por semana, a partir dos Shorts. 9:16, até 90 s, legenda queimada, cartela final. Publicação pela integração atual (`media_type REELS`).
- **Fluxo:** pasta → checagem oficial nas **telas reais** → `aprovado-checagem` → `enviarFilaSeguro.js` (feito pelo Dr.) → cron das 08:00, atrás do freio `REDES_PUBLICACAO_ATIVA`.
- **Token:** vence por volta de 24/12/2026. **Alertar a partir de 10/12.**

### 9.3 LinkedIn
- **Mesmo dia, às 08:00. No máximo 1 publicação por dia;** no dia do vídeo, o vídeo substitui o PDF.
- **Formato:**
  - **carrossel em PDF**, com título do documento de até 58 caracteres, **reescrito** (nunca cortado);
  - **texto profissional próprio**, com o link do artigo no corpo, 5 linhas, aviso CFM e crise;
  - abertura voltada a profissionais.
- **Agendamento:** pelo Chrome, no agendador nativo do LinkedIn, **sem API**.
  1. Anexar o **PDF (ou vídeo) primeiro**.
  2. Depois colar o texto.
  3. Agendar para 08:00 (só "Agendar", nunca "Publicar").
  4. Conferir na lista de agendados, com recarga da página, sem duplicar.
  - Aviso de login ou de atividade incomum: **parar**.
- **Freio:** `LINKEDIN_PUBLICACAO_ATIVA`. A tarefa `DrSM-LinkedIn-Agendar` é reativada só pelo Dr.

### 9.4 Spotify: podcast (PROPOSTA, aguarda ativação)
- **Programa 1, "Saúde Mental Explicada":** narração dos artigos (as antigas em Edge-TTS; as novas em Kokoro).
- **Programa 2, "Relatos da Prática":** relatos narrados, com nota de ficção e "Para entender".
- **Episódio:** vinheta → aviso de IA curto → conteúdo → "Onde buscar ajuda" → créditos. −16 LUFS, padrão de podcast.
- **Distribuição:** hospedagem gratuita com RSS (ex.: Spotify for Creators), a definir pelo Dr. Capa no estilo das capas do Portal.
- **Cadência sugerida:** 2 episódios por semana.

### 9.5 Canal de WhatsApp (PROPOSTA, só divulgação)
- **Canal de transmissão. Nunca atendimento.**
- Mensagem fixa: "Este canal não responde mensagens. Em crise: CVV 188 · SAMU 192."
- **2 a 3 envios por semana:** resumo de 2 linhas, link do artigo ou vídeo, 1 cartão visual.
- O WhatsApp não tem API gratuita para canais. A fábrica prepara o **pacote pronto** (texto, imagem e link) e o Dr. envia em menos de 1 minuto, até haver solução gratuita autorizada.

### 9.6 Newsletter (PROPOSTA)
- **Quinzenal, por e-mail.** Ferramenta gratuita a definir.
- Inscrição com **confirmação dupla** e consentimento explícito (LGPD). Descadastro em 1 clique.
- **Conteúdo:** 3 artigos, 1 vídeo, 1 relato, 1 "Aula de 5 minutos", "Onde buscar ajuda".
- **Versões por público** quando houver volume: profissionais, famílias, empresas e escolas.

### 9.7 Portal: artigos
- Padrões das seções 8.2 e 5. Toda nova peça das redes aponta para o artigo de origem.

### 9.8 Espanhol
- Artigos e vídeos com versão ES depois de curadoria rápida do Dr.
- **2027:** faixa de áudio em espanhol nos vídeos do YouTube.

---

## 10. Calendário editorial e cadência

| Dia | Instagram 08:00 | LinkedIn 08:00 | YouTube | Outros |
|---|---|---|---|---|
| Segunda | Carrossel E4 | PDF | **Episódio da semana** (rodízio das séries) | Podcast |
| Terça | Carrossel E5 | PDF | Short | WhatsApp |
| Quarta | Carrossel E1 + Reel | **Vídeo** | Short | — |
| Quinta | Carrossel E3 | PDF | Short | Podcast |
| Sexta | Carrossel E6 + Reel | **Vídeo** | Short | WhatsApp; newsletter (quinzenal) |
| Sábado | Carrossel E7 | — | Micro-capítulo do relato | — |
| Domingo | Relato | — | **Relato-filme** (quinzenal) | — |

- **Estoque mínimo:** 14 dias em todas as redes. Abaixo disso, alerta na Central.
- **Séries curtas** (Shorts e Reels): "Mito ou verdade?" e "Pergunta da semana", sempre a partir dos artigos.

---

## 11. Produção audiovisual: ferramentas e padrões

| Item | Padrão |
|---|---|
| Animação | **HyperFrames 0.9.44** (Apache-2.0), instalado em `.tmp\hyperframes-cli` com versão fixa. Playwright só como reserva, com o motivo registrado. |
| Voz | **Kokoro-82M** (pesos Apache-2.0), vozes `pf_dora`, `pm_alex` e `pm_santa`, liberadas pelo Dr. em 10/11 e 12/11/2026. Mesmo narrador em toda a série. |
| Áudio | Fala a −14 LUFS integrado, pico ≤ −1,5 dBFS (normalização em duas passagens). Trilha a −24 LUFS sob a voz. |
| Trilha | Banco com licença comercial gratuita e sem atribuição obrigatória (ex.: Pixabay Music). Registrar faixa, link e licença. Sem música por IA. |
| Legendas | SRT em todo vídeo. Legenda queimada nos verticais. Relatos sem texto na tela; SRT opcional. |
| Imagens por IA | Kaggle: FLUX.1-schnell e Wan 2.x, em notebook privado. Cloudflare: FLUX.1-schnell dentro da cota gratuita (começar com 30 por dia e só subir depois de conferir o painel). Classificador CLIP descarta fotorrealismo. |
| Licenças | Registro em `.tmp\ordens\LICENCAS-FERRAMENTAS.md` e, depois, em `docs/`. |

**Formatos:**
- **Educativo:** infográfico animado de tela inteira (seção 7.5), ritmo de 3 a 6 s, nada parado por mais de 8 s.
- **Relato-filme:**
  - adaptação de **relato já publicado**;
  - **virada vinda da ação da personagem** (estratégia de enfrentamento ou busca de cuidado), nunca de mudança mágica;
  - sem texto na tela, salvo a nota de ficção e a cartela;
  - **a duração segue a narração**, com pausas de até 3 s;
  - narrador e vozes distintas;
  - "Para entender" auditado antes da narração.
- **Vertical** (Short, Reel, LinkedIn): 9:16, até 90 s, legenda queimada.

---

## 12. Automação, rotina e papéis

### 12.1 Rotina contínua
- **Ordem ativa:** `.tmp\ordens\ORDEM-ATUAL.md`.
- **Estado:** `relatorios\ESTADO-GERAL.md`, com a **lista de etapas no topo**, e `relatorios\PENDENTES.md`.
- **Loop:** `/loop 20m`. A cada rodada, ler este guia, a ORDEM-ATUAL e a lista de etapas; executar **a próxima etapa pendente** até o fim; marcar; gravar o checkpoint. O que depende do Dr. fica "pendente do Dr." e o loop segue para a próxima etapa.
- **Toda rodada termina com:** o que foi feito, o que falta, as ações negadas e a **LISTA CURTA do Dr.**, com comandos PowerShell completos, um por bloco, sem placeholder.
- **Melhoria semanal:** relatório de métricas (Instagram pela integração atual) com ajustes de gancho e miniatura. O YouTube Analytics só depois de autorizado pelo Dr., por ser API nova.

### 12.2 Papéis
| Quem | Faz |
|---|---|
| **Dr. Antônio** | Merges, freios, scripts que gravam no banco, chaves e contas, aprovação de mudança clínica, amostra semanal, configuração dos canais |
| **Claude** | Auditoria geral e tripla checagem, decisões editoriais e técnicas, ordens unificadas, pesquisa |
| **Claude Code** | Execução de tudo o mais, sem perguntar: produção, portões, PRs, staging, comandos prontos para o Dr. |

### 12.3 Horários do Dr. (para planejar entregas)
- **Dias úteis:** trabalho das 07:30 às 17:15.
- **Plantão:** quinta e domingo, a partir das 18:00. Indisponível das 17:30 até as 10:30 de sexta e de segunda.
- **Tempo livre:**
  - segunda, terça e sexta, das 17:30 até dormir;
  - quinta, só das 17:30 às 18:00;
  - sábado, a partir das 20:00;
  - domingo, até as 18:00.

---

## 13. Monetização ética

- **Fontes:**
  - **mentoria** para profissionais;
  - **consultoria NR-1** para empresas;
  - **formação** para escolas (Lei 14.819/2024), pais, cuidadores, trabalhadores e migrantes;
  - receita do YouTube (Programa de Parcerias).
- **Proibido:** consulta particular, afiliados, divulgação de produto, AdSense no Portal, apelo por doação.
- As redes levam ao Portal, e o Portal leva às páginas dos serviços, sem promessa nem pressão.

---

## 14. Metas 2027

1. **Selo de fonte de saúde do YouTube** (mais de 1.500 h assistidas em 12 meses).
2. **Versão em espanhol** de artigos e vídeos (faixa de áudio no YouTube).
3. **Relatos em novela vertical:** capítulo longo e micro-capítulos de 1 a 3 min.
4. **Rótulo de conteúdo sintético** e origem nos metadados de todos os arquivos.
5. **Página pública de fontes** por vídeo.
6. **Leitores com experiência vivida** (opcional e anônimo) para os relatos.
7. Séries curtas **"Mito ou verdade?"** e **"Pergunta da semana"**.
8. **Central de Aprovação no celular**, com aprovação automática e amostra semanal.
9. Podcast, canal de WhatsApp e newsletter ativos (seção 9).
10. Portal no **estilo DrSM** (seção 8), com "Meu plano de cuidado".

---

## 15. Checklists por peça

### 15.1 Carrossel (Instagram e LinkedIn)
- [ ] Origem: artigo aprovado. Eixo do dia correto. Zero genérico aprovado.
- [ ] 5 a 8 telas, até 25 palavras por tela, frases inteiras, 5 linhas na arte.
- [ ] Checagem oficial nas **telas reais** e hashes registrados.
- [ ] Legenda: gancho; lista com ponto final; referências conferidas (PMID/DOI); aviso CFM; crise; crédito.
- [ ] Texto alternativo em todas as telas.
- [ ] LinkedIn: PDF; título até 58 caracteres, reescrito; texto profissional com link.
- [ ] Data futura, às 08:00. Envio seguro em dry-run antes do `--aplicar` pelo Dr.

### 15.2 Episódio do YouTube
- [ ] Origem: artigo aprovado. Gancho de até 5 s. Estrutura da seção 6.3.
- [ ] Infográfico de tela inteira. Troca de imagem a cada 3 a 5 s. Lucide. Linha de cuidado. Oswald e Raleway.
- [ ] Todo número com fonte conferida. Quadro de referências frase a frase.
- [ ] −14 LUFS, pico ≤ −1,5 dBFS, SRT, capítulos, tela final, cartela de 8 s.
- [ ] Miniatura (2 opções). Título e descrição no modelo. "Não é para crianças". Marcação de conteúdo sintético, se houver.

### 15.3 Relato-filme
- [ ] Adaptação de relato publicado. Sem tema de suicídio no piloto. OMS, se houver tema sensível.
- [ ] Nota de ficção na abertura, com o texto exato. Virada pela ação da personagem.
- [ ] Ficha de personagem. Estilo adulto próprio. Sem fotorrealismo, verificado pelo classificador.
- [ ] "Para entender" auditado. Onde buscar ajuda. Cartela final.
- [ ] Duração segue a narração. Trilha com licença registrada. −14 LUFS.

### 15.4 Artigo do Portal
- [ ] Modelo do tipo (seção 8.2). "Quando procurar ajuda" em destaque.
- [ ] Referências conferidas. Capa infográfica (dado-chave só se verificado). Narração.
- [ ] Linguagem simples. Acessibilidade AA. `MedicalWebPage`. Links funcionando.

---

## 16. Caminhos, arquivos e glossário

| Item | Caminho |
|---|---|
| Pasta principal | `C:\DRSAUDEMENTAL` |
| Worktrees | `C:\DRS-<nome>` |
| Estado e pendências | `relatorios\ESTADO-GERAL.md`, `relatorios\PENDENTES.md` |
| Ordem ativa | `.tmp\ordens\ORDEM-ATUAL.md` |
| Design | `docs\DESIGN.md`, `docs\tokens.json` |
| Método | `docs\METODO-DRSM.md` |
| Temas | `backend\lib\temas.js` |
| Nota de ficção | `backend\lib\relatos.js` |
| Capas | `backend\lib\capaArtigo.js`, `backend\lib\dadosChaveVerificados.json` |
| Checagens | `backend\lib\redesV2\checagem.js` (`checarPost`, `falhasDeTexto`, `falhasDeListaLegenda`), `backend\lib\redesV2\zgGate.js`, `backend\lib\redesV2\zeroGenerico.js` (`EIXO_DO_DIA`, `checarZeroGenerico`), `checarEticaCfm` |
| Fila do Instagram | `conteudo\redes-v2\` (fora do Git) → banco `redes_v2` via `backend\scripts\redes\enviarFilaSeguro.js` |
| LinkedIn | `scripts\linkedin\agendarDiario.js`, skill `agendar-linkedin` |
| Merge | `npm run merge-seguro -- N` |

**Glossário:**
- **Portão:** auditoria automática, testes, build e E2E, rodados antes do PR.
- **Zero genérico:** checagem que impede conteúdo genérico e confere o eixo do dia.
- **Staging:** preparado em `.tmp`, sem gravar no banco nem publicar.
- **Freio:** variável que liga ou desliga a publicação automática de uma rede.

---

## Histórico de versões

- **1.0 (14/11/2026):** primeira versão. Consolida as decisões de 08 a 14/11/2026: Método DrSM, D1–D5, identidade visual, arquitetura do Portal, canais, calendário, ferramentas, metas 2027.
- **1.1 (14/11/2026):** caminho do `zgGate` corrigido (`backend\lib\redesV2\`) e `zeroGenerico.js` citado; tokens `alerta.fundo` (#fbf1d9) e `alerta.tinta` (#4a3606) acrescentados em `docs\DESIGN.md` (seção 9) e gerados em `docs\tokens.json`; vinheta com alvo de −14 LUFS (`backend\lib\vinheta.js`, só para renderizações novas).
