# Projeto Portal Bilíngue PT/ES — Fase 0 (planejamento)

Data: 04/11/2026 · Ordem escrita do Dr. Antônio Felipe · **Somente planejamento**: nenhuma mudança no site, no banco ou na Vercel.
Glossário: [GLOSSARIO-ES.md](GLOSSARIO-ES.md)

## Decisões já tomadas (fora deste plano)
- Sem API ou chave nova (Gemini, Groq, OpenRouter, Anthropic API). Sem troca silenciosa de modelo.
- Sem `content/pt/*.mdx` (o site é Express + MongoDB). Sem `git push` na `main`. Sem lotes de 50–60 por dia. Sem botão "Salir rápido". Identificação = bloco oficial do site.
- Tradução feita pelo Claude Code dentro da assinatura, com checkpoint por texto. Se o limite acabar: pausa e retoma depois; nunca troca de modelo.

## 1) Arquitetura

### 1.1 Onde fica a tradução (MongoDB)
Recomendação: **coleção separada `traducoes_es`**, não campo embutido em `artigos`.
- Motivo: não toca nenhum documento PT (o hash de narração e o backup de `artigos` continuam como estão) e facilita o backup antes de qualquer gravação.
- Chave: `slug` (único) + `hash_origem_pt`.
- Documento:
```
{
  slug: "ansiedade-sinais",            // mesmo slug do PT
  idioma: "es-419",
  titulo, resumo, corpo,               // corpo em HTML, com a mesma estrutura do PT
  hash_origem_pt: "sha256…",           // hash do PT no momento da tradução
  status: "pendente" | "revisao" | "publicado" | "desatualizado" | "reprovado",
  revisao: { automatica: {data, checagens: [...]}, medica: {data, por, pendente: true} },
  modelo: "claude-…",                  // registrado, nunca trocado em silêncio
  data_traducao: "AAAA-MM-DD",
  eixo: "ansiedade" | "depressao" | "sono" | "acesso" | "crise" | "trabalho"
}
```
- Pré-requisito: índice único `{slug:1, idioma:1}`.
- Backup `backups/importacao-completa-AAAAMMDD-HHMM/` da coleção antes de qualquer gravação (regra permanente).

### 1.2 Rota `/es/artigo/<slug>` (Express)
- Serve o texto de `traducoes_es` **somente** se `status = publicado` e `hash_origem_pt` = hash atual do PT.
- Caso contrário: 404 (não redireciona para PT, para não parecer tradução oficial).
- Layout: o mesmo `public/artigo.html` (template). **Mudança em `public/` exige nova ordem escrita do Dr. Antônio** — não incluída nesta fase.
- Rota de entrada `/es/` (página para migrantes) — ver piloto, item 9.

### 1.3 hreflang, canonical e sitemap
- Em cada artigo PT publicado com ES publicado: `<link rel="alternate" hreflang="pt-BR" href="…/artigo/<slug>">`, `<link rel="alternate" hreflang="es-419" href="…/es/artigo/<slug>">`, `<link rel="alternate" hreflang="x-default" href="…/artigo/<slug>">`.
- Canonical de cada versão aponta para si mesma (não para a PT).
- Sitemap: incluir a URL ES só quando `status = publicado`; `lastmod` = data da última revisão.
- Domínio: `https://www.drantoniofelipemedico.com.br` (único, regra permanente).

### 1.4 `vercel.json` — **exige aprovação, não alterar nesta fase**
- Não foi lido nesta fase (escopo). Antes da Fase 1: ler o `vercel.json` e conferir o Root Directory no painel (regra de 25/10/2026).
- Se `/es/*` precisar de rewrite para o backend Express: **sinalizar para aprovação do Dr. Antônio** antes de qualquer alteração. Deploy só com OK dele.

## 2) Regra de desatualização
- Hash do PT = sha256 de `titulo + resumo + corpo` normalizados (mesma função usada pela narração, em modo leitura; não reutilizar o hash de narração para não invalidar áudios).
- Se o hash do PT ≠ `hash_origem_pt` → `status = desatualizado` → sai do ar (404), sai do sitemap, some o hreflang. Só volta após nova tradução revisada.
- Verificação diária em modo leitura (sem chamada de IA; custo zero).
- Alteração de sentido clínico no PT: aviso ao Dr. Antônio além do status.

## 3) Exclusões do automático (só com leitura do Dr. Antônio)
Vão para `relatorios/plano-diretor/` como "aguardando leitura", nunca são publicados sozinhos:
1. Textos de **Nível 1** (classificação de risco/crise ou conteúdo de alto impacto clínico).
2. Textos com **nome ou dose de medicamento**.
3. **Relatos da prática** (narrativa composta).
4. Qualquer texto que a checagem marcar com **dúvida** (status `revisao`).

## 4) Glossário
Ver [GLOSSARIO-ES.md](GLOSSARIO-ES.md): partiu da tabela do manual, com termos do acervo (UBS, CAPS, APS, PAP = "Urgencias psiquiátricas", NR-1, GRO etc.). Linguagem centrada na pessoa; "persona" em vez de "paciente" quando não for ambiente clínico.

## 5) Prompt clínico de tradução (versão do projeto)
Usado como instrução fixa a cada tradução; a saída é sempre registrada com o modelo usado.

```
Traduza o texto PT-BR para espanhol de América Latina (es-419), para pessoas migrantes hispano-falantes no Brasil.
Regras:
1. Centrado na pessoa: fale COM a pessoa, em linguagem simples; sem culpa, medo, vergonha ou pressão.
2. Não acrescente nem retire conteúdo clínico. Não crie número, dado, dose, nome de medicamento ou referência que não esteja no original.
3. Frases clínicas fiéis ao original; quando houver incerteza, mantenha a construção do original e marque [REVISAR].
4. Preserve HTML, atributos, links e a ordem dos parágrafos. Não traduza URLs, e-mails, siglas oficiais (SUS, CAPS, UBS, APS, PAP, CVV, SAMU, NR-1) — use o glossário.
5. Sem sensacionalismo, promessa ou linguagem de sucesso garantido (Res. CFM 2.336/2023). Sem estigma (Res. CFM 2.454/2026 e aviso de IA mantidos).
6. Suicídio e autolesão: sem método, local ou detalhe; sempre CVV 188 e SAMU 192 (com "atención en portugués").
7. Nunca apresente o Dr. Antônio Felipe como "psiquiatra" (título). Use o bloco de identificação fixo (seção 7), não o traduza livremente.
8. Não reescreva nem "melhore" o texto: é tradução.
Saída: somente o HTML traduzido.
```

## 6) Checagem automática pós-tradução
Determinística (sem IA), todas obrigatórias:
1. **Números, doses, siglas e links**: extrair de PT e ES e comparar conjunto (deve ser idêntico, salvo siglas que o glossário mapeia).
2. **Contagem de parágrafos e de blocos HTML** iguais.
3. **Glossário**: todo termo do glossário presente no PT deve aparecer com a forma ES aprovada.
4. **Proibidos**: "psiquiatra" como título do Dr., "#psiquiatria", "paciente" fora de contexto clínico (aviso), sensacionalismo.
5. **Bloco de identificação e aviso de IA** presentes e iguais aos textos fixos (seção 7).
6. **Retrotradução por amostragem**: 30% dos parágrafos (mínimo 3) retraduzidos para PT por uma segunda chamada com instrução própria; comparação semântica pelo Claude Code (ler só o resumo das divergências).
7. Qualquer falha → `status = revisao`, nunca `publicado`.
8. Aprovação humana final: sempre do Dr. Antônio para cada texto (revisão médica individual), registrada em `revisao.medica`.

## 7) Textos fixos em ES — para aprovação do Dr. Antônio

**7.1 Bloco de identificação (5 linhas, mesmas do rodapé PT):**
```
Dr. Antônio Felipe — Médico — CRM-BA 41322
Especialista en Medicina de Familia y Comunidad — RQE 26638
Ejerzo en Urgencias Psiquiátricas (PAP) y en Atención Primaria de Salud (APS)
Posgrados en Psiquiatría, Salud Mental, Atención Psicosocial, Terapia Cognitivo-Conductual, Neuropsicología y Medicina del Trabajo
NO ESPECIALISTA
```
Observações: (a) a 3ª linha é tradução da frase oficial de 02/11/2026; (b) "Pronto Atendimento Psiquiátrico" vira "Urgencias Psiquiátricas (PAP)", conforme o glossário; (c) "NÃO ESPECIALISTA" → "NO ESPECIALISTA"; (d) a identificação fica só no rodapé, uma vez por página.

**7.2 Aviso de IA (texto integral do pedido):**
> Contenido educativo producido con apoyo de inteligencia artificial y verificación automatizada, bajo la responsabilidad del Dr. Antônio Felipe (Resolución CFM 2.454/2026). Traducción asistida por IA. Revisión médica individual: pendiente.

Quando a revisão médica do texto for concluída, o rótulo "pendiente" é trocado por "revisada por el autor" (ação do Dr. Antônio).

**7.3 Quadro de acolhimento ao migrante (proposta):**
> **Usted tiene derecho a la salud.** La Ley de Migración de Brasil (Ley n.º 13.445/2017) establece, en el art. 4.º, inciso VIII, el "acceso a servicios públicos de salud y de asistencia social y a la seguridad social, en los términos de la ley, sin discriminación por razón de nacionalidad y de condición migratoria".
> **En crisis:** CVV 188 — atención en portugués, las 24 horas, sin costo de llamada. SAMU 192 — emergencias (atención en portugués).
> Este texto es una orientación general. Siempre se respetan los protocolos del hospital, de la Unidad de Urgencias (PA) y de la red de salud local.

Citação literal: o trecho do inciso VIII foi conferido na fonte oficial (Planalto, Lei 13.445/2017, art. 4.º); a parte final ("sem discriminação em razão da nacionalidade e da condição migratória") foi conferida por paráfrase e **precisa de transcrição literal antes da aprovação**. A tradução ES do trecho legal é nossa e deve ser marcada como tradução.

## 8) Verificações em fonte oficial (feitas nesta fase)

| Item | Resultado | Fonte | Consequência |
|---|---|---|---|
| (a) CVV 188 em espanhol | **Não consta.** As páginas oficiais falam só em 188 (24 h, sem custo), sigilo e acolhimento, sem idioma estrangeiro. | cvv.org.br/fale-conosco e cvv.org.br/o-cvv (lidas) | Quadro diz **"atención en portugués"**. Confirmar com o CVV antes de dizer outra coisa. |
| (b1) PHQ-9 em espanhol | Termos do PHQ Screeners: conteúdo "expressly exempted from Pfizer's general copyright restrictions" e "free for download and use". Atribuição esperada: Kroenke, Spitzer & Williams (2001), *J Gen Intern Med* 16(9):606–613. **URL do PDF em espanhol não confirmada** (página de screener retornou 404). | phqscreeners.com/terms (lida) | Usar só após baixar o PDF oficial espanhol pelo site e registrar a URL exata. Os termos vinculam a pfizer.com/general/terms.jsp (não lido). |
| (b2) GAD-7 em espanhol | Termos cobrem "PHQ and GAD-7 screeners", mas **versão espanhola oficial não confirmada**. Há adaptação cultural espanhola publicada (estudo em adultos e adolescentes). | phqscreeners.com (home e termos) e busca | Não usar até a versão oficial e a licença serem confirmadas pelo Dr. Antônio. |
| (c) PIPFLA | **Confirmado**: *Participatory and Iterative Process Framework for Language Adaptation*. Maríñez-Lora, A. M., Boustani, M., del Busto, C. T., & Leone, C. (2016). *Hispanic Journal of Behavioral Sciences*, 38(1), 117–133. DOI 10.1177/0739986315612769. Método em 11 passos, com painel de especialistas comunitários e pais/clínicos latinos. | Busca (DOI do editor) | Ver item 8.1 (texto do documento). |

### 8.1 Citação no documento
"Tradução inspirada no PIPFLA (Maríñez-Lora et al., 2016, DOI 10.1177/0739986315612769)." Não dizer que seguimos o método integral: falta a etapa participativa.

**Etapa participativa proposta:** revisão de cada texto por uma instituição que acolhe migrantes hispano-falantes em São Paulo ou Salvador (a definir), com painel de 2 a 3 pessoas migrantes e uma profissional de saúde. Conecta com o público 5 da Mentoria (profissionais de saúde e empresas). Sem custo para o portal; combinar formato e termo de uso em Fase 1. **Decisão do Dr. Antônio: escolher a instituição.**

## 9) Piloto da Fase 1 (10 textos + página de entrada)

Cada tema será casado a um texto PT **já publicado** (a identificar no `INVENTARIO.md`). Nenhum tem medicamento, dose, relato da prática ou classificação de nível 1.

| # | Tema | Eixo | Observação |
|---|---|---|---|
| 1 | Acesso ao SUS: como funciona e como se cadastrar | acesso | Sem medicamento |
| 2 | O que é o CAPS e quando procurar | acesso | Usar glossário (CAPS = Centro de Atención Psicosocial) |
| 3 | Atenção Primária (UBS): primeira porta de entrada | acesso | Glossário UBS |
| 4 | Quando procurar ajuda: sinais de alerta | crise | Revisão extra (crise) — pode cair na exclusão 4 |
| 5 | Crise agora: o que fazer e onde pedir ajuda | crise | CVV 188 com "atención en portugués"; pode cair na exclusão 4 |
| 6 | Ansiedade: o que é e quando buscar ajuda | ansiedade | Sem medicamento |
| 7 | Depressão: sinais e primeiros passos | depressão | Sem medicamento; sem escala ainda (PHQ-9 entra na Fase 2) |
| 8 | Sono: hábitos que ajudam | sono | Sem nome de medicamento |
| 9 | Insônia: quando procurar avaliação | sono | Sem medicamento |
| 10 | Saúde mental do trabalhador migrante | trabalho | Glossário NR-1 e GRO quando aplicável |

**Página `/es/` de entrada para migrantes:** texto de acolhimento (7.3), links para os 10 textos, bloco de identificação (7.1) e aviso de IA (7.2). Sem formulário e sem mensageria de terceiros (regra permanente).

Itens 4 e 5 entram com risco de exclusão: se a checagem marcar dúvida, saem do piloto para leitura do Dr. Antônio.

## 10) UX para depois do piloto (somente listado, não feito)
- Seletor PT | ES com `localStorage` (sem cookies).
- Tempo de leitura e nota suave de conteúdo sensível também em PT.
- Player de áudio com Web Speech API só nas páginas ES, script próprio, sem terceiros.
- Busca por eixos, sem CDN de terceiros.
- PHQ-9 e GAD-7 em ES (após confirmação de versão e licença, item 8).
- Respiração guiada bilíngue.

## 11) Estimativa de uso e ritmo
- **Não medido.** Estimativa para a Fase 1: 1 chamada de tradução + 1 de retrotradução por parágrafo amostrado por texto. Medir no piloto (10 textos) e registrar em `relatorios/CONSUMO.md`.
- **Conflito a decidir:** o teto de `claude -p` (3 por dia e 15 por semana, regra de 19/10/2026) limita chamadas automáticas. A tradução por sessão interativa não passa por esse teto, mas precisa de checkpoint por texto. Proposta: tradução em sessões interativas, lote de no máximo 10 por dia **só após o piloto aprovado e com portão verde**. **Decisão do Dr. Antônio:** confirmar que esse teto não se aplica à sessão interativa.
- Nada automático roda para ES nesta fase; publicação ES sempre com OK do Dr. Antônio (regra de deploy).

## 12) Fora desta fase
- Nenhuma alteração em `public/`, `backend/data/`, `vercel.json`, banco ou Vercel.
- Nenhuma tradução feita.
- Fase 1 começa somente com a frase: **"aprovo a fase 1 ES"**.

## 13) Pendências para o Dr. Antônio
1. Aprovar a coleção `traducoes_es` (ou pedir campo embutido).
2. Aprovar o bloco de identificação ES (7.1) e o aviso de IA (7.2).
3. Aprovar o quadro de acolhimento (7.3) e fornecer a transcrição literal da parte final do inciso VIII.
4. Escolher a instituição para a revisão participativa (8.1).
5. Confirmar o teto de chamadas na sessão interativa (11).
6. Autorizar a baixa do PDF oficial PHQ-9 em espanhol e a verificação da licença do GAD-7 (8, b1 e b2).
7. Confirmar o CVV com a instituição (8, a) — até lá, "atención en portugués".
