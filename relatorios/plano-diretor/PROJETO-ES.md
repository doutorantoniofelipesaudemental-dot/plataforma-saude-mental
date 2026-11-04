# Projeto Portal Bilíngue PT/ES — Fase 0 (planejamento, revisão 04/11/2026 19:30)

Ordem escrita do Dr. Antônio Felipe · **Somente planejamento**: nenhuma mudança no site, no banco ou na Vercel.
Glossário: [GLOSSARIO-ES.md](GLOSSARIO-ES.md) · Pendências: seção 13.
Base: `main` após o merge do #238 (18:29). Este documento substitui a versão do #238.

## Ajustes desta revisão
- a) Inciso VIII literal (Lei 13.445/2017, art. 4º, publicação original) no quadro de acolhimento, com tradução ES ao lado.
- b) Teto: a tradução **nunca** usa `claude -p`. Só em sessão interativa com o Dr. Antônio presente, máx. 10 por dia após o piloto.
- c) Desatualização: **302 temporário** para a versão PT do mesmo slug, no lugar de 404.
- d) Piloto: saíram os 2 temas de crise (caem na exclusão). Entram substitutos fora das exclusões. A orientação de crise fica só no quadro fixo aprovado.
- e) `vercel.json` lido (somente leitura): ver 1.4.
- f) Coleção `traducoes_es` aprovada como proposta. Instituição participativa em aberto (indicação do Dr. Antônio).
- g) PHQ-9 e GAD-7 em ES ficam para fase posterior, até confirmar URL oficial e licença.
- h) **Eixo:** o campo `eixo` usa os 7 eixos oficiais do `INVENTARIO.csv` (código 1 a 7, chamados E1 a E7), não rótulos livres.
- i) Piloto revisado contra o inventário publicado: CAPS e UBS não têm texto PT publicado fora de relato; saíram (ver seção 9).

## Decisões já tomadas (fora deste plano)
- Sem API ou chave nova (Gemini, Groq, OpenRouter, Anthropic API). Sem troca silenciosa de modelo.
- Sem `content/pt/*.mdx` (o site é Express + MongoDB). Sem `git push` na `main`. Sem lotes de 50–60 por dia. Sem botão "Salir rápido". Identificação = bloco oficial do site.
- Tradução feita pelo Claude Code **em sessão interativa**, com checkpoint por texto. Se o limite acabar: pausa e retoma depois; nunca troca de modelo.

## Os 7 eixos oficiais (INVENTARIO.csv)
| Código | Nome no inventário |
|---|---|
| E1 (1) | Infância, Adolescência, Pais & Família, Professores & Saúde Escolar |
| E2 (2) | Maternidade, Puerpério & Saúde Perinatal |
| E3 (3) | Vida Adulta, Envelhecimento & Cuidados Paliativos |
| E4 (4) | Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1) |
| E5 (5) | Transtornos Mentais |
| E6 (6) | Hábitos, Estilo de Vida & Sono |
| E7 (7) | Sociedade, Cultura & Existência |

## 1) Arquitetura

### 1.1 Onde fica a tradução (MongoDB)
Coleção separada **`traducoes_es`** (aprovada como proposta), não campo embutido em `artigos`.
- Não toca nenhum documento PT: o hash de narração e o backup de `artigos` ficam como estão.
- Chave: `slug` + `idioma` (índice único `{slug:1, idioma:1}`), com `hash_origem_pt`.

```
{
  slug: "migrantes-como-buscar-ajuda-saude-mental-sus",
  idioma: "es-419",
  titulo, resumo, corpo,               // corpo em HTML, mesma estrutura do PT
  hash_origem_pt: "sha256…",
  status: "pendente" | "revisao" | "publicado" | "desatualizado" | "reprovado",
  revisao: { automatica: {data, checagens: [...]}, medica: {data, por, pendente: true} },
  modelo: "claude-…",                  // registrado; nunca trocado em silêncio
  data_traducao: "AAAA-MM-DD",
  eixo: "1" … "7"                      // código oficial do INVENTARIO.csv (E1 a E7)
}
```

- Backup `backups/importacao-completa-AAAAMMDD-HHMM/` da coleção antes de qualquer gravação.

### 1.2 Rota `/es/artigo/<slug>` (Express)
- Serve o texto de `traducoes_es` **somente** se `status = publicado` e `hash_origem_pt` = hash atual do PT.
- Caso contrário: **302 temporário** para `/artigo/<slug>` (versão PT), sem indicar tradução oficial.
- Layout: o mesmo template de artigo. **Mudança em `public/` exige nova ordem escrita do Dr. Antônio**: não incluída nesta fase.
- Página de entrada `/es/` para migrantes: ver piloto, seção 9.

### 1.3 hreflang, canonical e sitemap
- Em cada artigo PT com ES publicado: `hreflang="pt-BR"`, `hreflang="es-419"` e `hreflang="x-default"` (apontando para o PT).
- Canonical de cada versão aponta para si mesma.
- Sitemap: URL ES só quando `status = publicado`; `lastmod` = data da última revisão.
- Domínio: `https://www.drantoniofelipemedico.com.br` (único, regra permanente).

### 1.4 `vercel.json` (lido em 04/11, somente leitura)
- O arquivo tem regras específicas para `/artigo/…`, `/mentoria`, `/links` etc. **Não há regra para `/es/`.**
- A última regra é genérica (`/(.*)`). Se ela envia ao backend Express, `/es/*` chega ao Express **sem alterar `vercel.json`**. O destino exato dessa regra não foi confirmado no painel da Vercel.
- **Conclusão:** provavelmente não precisa de rewrite. Confirmar no painel (Root Directory vazio = raiz, regra de 25/10) antes da Fase 1. Se precisar de regra nova: **sinalizar para aprovação**, sem alterar.

### 1.5 DNS do domínio (somente leitura, 04/11)
- Nameservers: `b.sec.dns.br` e `c.sec.dns.br` (Registro.br). **Não são da Cloudflare.**
- Registro MX: **nenhum** encontrado.
- Registro do apex: aponta para 76.76.21.21 (Vercel).
- Conclusão: os complementos pagos cancelados pela Cloudflare em 04/11 não afetam o Portal (ver DECIDIDO.md).

## 2) Regra de desatualização
- Hash do PT = sha256 de `titulo + resumo + corpo` normalizados. Não reutilizar o hash de narração, para não invalidar áudios.
- Se o hash do PT ≠ `hash_origem_pt`: `status = desatualizado`, **302 para a versão PT**, sai do sitemap, some o hreflang. Só volta após nova tradução revisada.
- Verificação diária em modo leitura (sem IA; custo zero).
- Alteração de sentido clínico no PT: aviso ao Dr. Antônio, além do status.

## 3) Exclusões do automático (só com leitura do Dr. Antônio)
Ficam em `relatorios/plano-diretor/` como "aguardando leitura", sem publicação automática:
1. Textos de **Nível 1** (classificação de risco/crise ou conteúdo de alto impacto clínico).
2. Textos com **nome ou dose de medicamento**.
3. **Relatos da prática** (narrativa composta; vertical A no inventário).
4. Qualquer texto que a checagem marcar com **dúvida** (status `revisao`).

## 4) Glossário
Ver [GLOSSARIO-ES.md](GLOSSARIO-ES.md): partiu da tabela do manual, com termos do acervo (UBS, CAPS, APS, PAP = "Urgencias psiquiátricas", NR-1, GRO etc.). Linguagem centrada na pessoa; "persona" fora de contexto clínico.

## 5) Prompt clínico de tradução (versão do projeto)
Instrução fixa a cada tradução. A saída registra o modelo usado.

```
Traduza o texto PT-BR para espanhol de América Latina (es-419), para pessoas migrantes hispano-falantes no Brasil.
1. Centrado na pessoa: fale COM a pessoa, em linguagem simples; sem culpa, medo, vergonha ou pressão.
2. Não acrescente nem retire conteúdo clínico. Não crie número, dado, dose, nome de medicamento ou referência que não esteja no original.
3. Frases clínicas fiéis ao original; em caso de incerteza, mantenha a construção do original e marque [REVISAR].
4. Preserve HTML, atributos, links e a ordem dos parágrafos. Não traduza URLs, e-mails nem siglas oficiais (SUS, CAPS, UBS, APS, PAP, CVV, SAMU, NR-1): use o glossário.
5. Sem sensacionalismo nem promessa (Res. CFM 2.336/2023). Aviso de IA e identificação mantidos (Res. CFM 2.454/2026).
6. Suicídio e autolesão: sem método, local ou detalhe; sempre CVV 188 e SAMU 192, com "atención en portugués".
7. Nunca apresente o Dr. Antônio Felipe como "psiquiatra" (título). Use o bloco de identificação fixo (seção 7), sem tradução livre.
8. Não reescreva nem "melhore" o texto: é tradução.
Saída: somente o HTML traduzido.
```

## 6) Checagem automática pós-tradução
Determinística (sem IA), todas obrigatórias:
1. **Números, doses, siglas e links**: conjunto extraído do PT e do ES deve ser idêntico (siglas conforme o glossário).
2. **Contagem de parágrafos e de blocos HTML** iguais.
3. **Glossário**: todo termo do glossário presente no PT aparece com a forma ES aprovada.
4. **Proibidos**: "psiquiatra" como título do Dr., "#psiquiatria", "paciente" fora de contexto clínico, sensacionalismo.
5. **Bloco de identificação e aviso de IA** presentes e iguais aos textos fixos (seção 7).
6. **Retrotradução por amostragem**: 30% dos parágrafos (mínimo 3) retraduzidos para PT por chamada própria; comparação semântica pelo Claude Code, lendo só o resumo das divergências.
7. Qualquer falha → `status = revisao`, nunca `publicado`.
8. Aprovação humana final do Dr. Antônio em cada texto (revisão médica individual), em `revisao.medica`.

## 7) Textos fixos em ES — para aprovação do Dr. Antônio

**7.1 Bloco de identificação (5 linhas, mesmas do rodapé PT):**
```
Dr. Antônio Felipe — Médico — CRM-BA 41322
Especialista en Medicina de Familia y Comunidad — RQE 26638
Ejerzo en Urgencias Psiquiátricas (PAP) y en Atención Primaria de Salud (APS)
Posgrados en Psiquiatría, Salud Mental, Atención Psicosocial, Terapia Cognitivo-Conductual, Neuropsicología y Medicina del Trabajo
NO ESPECIALISTA
```
(a) A 3ª linha é tradução da frase oficial de 02/11/2026. (b) "Pronto Atendimento Psiquiátrico" vira "Urgencias Psiquiátricas (PAP)", conforme o glossário. (c) "NÃO ESPECIALISTA" → "NO ESPECIALISTA". (d) Identificação só no rodapé, uma vez por página.

**7.2 Aviso de IA (texto integral do pedido):**
> Contenido educativo producido con apoyo de inteligencia artificial y verificación automatizada, bajo la responsabilidad del Dr. Antônio Felipe (Resolución CFM 2.454/2026). Traducción asistida por IA. Revisión médica individual: pendiente.

Quando a revisão médica do texto for concluída, "pendiente" vira "revisada por el autor" (ação do Dr. Antônio).

**7.3 Quadro de acolhimento ao migrante (proposta):**

| Português (texto de referência) | Español (es-419, tradução nossa) |
|---|---|
| **Você tem direito à saúde.** A Lei de Migração (Lei 13.445/2017), art. 4º, inciso VIII, garante: "VIII - acesso a serviços públicos de saúde e de assistência social e à previdência social, nos termos da lei, sem discriminação em razão da nacionalidade e da condição migratória;" | **Usted tiene derecho a la salud.** La Ley de Migración (Ley 13.445/2017), artículo 4, inciso VIII, garantiza: "VIII - acceso a servicios públicos de salud y de asistencia social y a la seguridad social, en los términos de la ley, sin discriminación por razón de nacionalidad y de condición migratoria;" |
| **Em crise:** CVV 188 (24 h, sem custo de ligação, atendimento em português) · SAMU 192 (emergências, atendimento em português) | **En crisis:** CVV 188 (24 h, sin costo de llamada, atención en portugués) · SAMU 192 (emergencias, atención en portugués) |
| Esta é uma orientação geral. Respeitam-se sempre os protocolos do hospital, do Pronto Atendimento (PA) e da rede de saúde local. | Esta es una orientación general. Siempre se respetan los protocolos del hospital, de la Unidad de Urgencias (PA) y de la red de salud local. |

Estado da citação: o inciso VIII foi transcrito literalmente da publicação oficial (Planalto, Lei 13.445/2017). A tradução ES do trecho legal é nossa e deve ser marcada como tradução na página.

## 8) Verificações em fonte oficial (feitas em 04/11)

| Item | Resultado | Fonte | Consequência |
|---|---|---|---|
| (a) CVV 188 em espanhol | **Não consta.** Páginas oficiais: 188, 24 h, sem custo, sigilo e acolhimento; nenhuma menção a outro idioma. | cvv.org.br/fale-conosco e cvv.org.br/o-cvv | Quadro diz **"atención en portugués"**. Confirmar com o CVV antes de mudar. |
| (b1) PHQ-9 em espanhol | Termos do PHQ Screeners: conteúdo "expressly exempted from Pfizer's general copyright restrictions" e "free for download and use". Atribuição: Kroenke, Spitzer & Williams (2001), *J Gen Intern Med* 16(9):606–613. **URL do PDF em espanhol não confirmada** (página de screener: 404). | phqscreeners.com/terms | **Fora desta fase** (item g). |
| (b2) GAD-7 em espanhol | Termos cobrem "PHQ and GAD-7 screeners", mas **versão espanhola oficial não confirmada**. | phqscreeners.com | **Fora desta fase** (item g). |
| (c) PIPFLA | **Confirmado**: *Participatory and Iterative Process Framework for Language Adaptation*. Maríñez-Lora, A. M., Boustani, M., del Busto, C. T., & Leone, C. (2016). *Hispanic Journal of Behavioral Sciences*, 38(1), 117–133. DOI 10.1177/0739986315612769. Método em 11 passos, com painel de especialistas comunitários e pais/clínicos latinos. | DOI do editor (busca) | Ver 8.1. |

### 8.1 Citação no documento
"Tradução inspirada no PIPFLA (Maríñez-Lora et al., 2016, DOI 10.1177/0739986315612769)." Não dizer que seguimos o método integral: falta a etapa participativa.

**Etapa participativa:** revisão de cada texto por uma instituição que acolhe migrantes hispano-falantes, com painel de 2 a 3 pessoas migrantes e uma profissional de saúde. Conecta com o público 5 da Mentoria. **Instituição: em aberto, indicação do Dr. Antônio.**

## 9) Piloto da Fase 1 (10 textos + página de entrada)
Cada tema será casado a um texto PT **já publicado** (status `publicado` no inventário), fora das exclusões. Os eixos são os oficiais. A checagem de exclusão (nome ou dose de medicamento, relato, Nível 1) é feita texto a texto antes de entrar.

| # | Tema | Texto PT candidato (slug) | Eixo oficial | Situação |
|---|---|---|---|---|
| 1 | Acesso ao SUS: como buscar ajuda em saúde mental | `migrantes-como-buscar-ajuda-saude-mental-sus` | E7 | Publicado |
| 2 | Migrar não é adoecer (base para a entrada) | `migracao-saude-mental` | E7 | Publicado. **Substitui CAPS** (sem texto PT publicado fora de relato) |
| 3 | Mulher migrante: sobrecarga e redes de apoio | `mulher-migrante-saude-mental` | E7 | Publicado. **Substitui UBS** (sem texto PT publicado fora de relato) |
| 4 | Estresse e adaptação à vida em um novo país | `estresse-migratorio-adaptacao-cultural` | E7 | Publicado. Substituto 1 |
| 5 | Crianças que migram: sinais e proteção (escola e família) | `criancas-adolescentes-migrantes-saude-mental` | E1 | Publicado. Substituto 2 |
| 6 | Ansiedade: o que é e quando buscar ajuda | `ansiedade-generalizada-aps` | E5 | Publicado. Checar exclusão 2 (medicamento) |
| 7 | Depressão: sinais e primeiros passos | `depressao-ansiedade-produtividade` | E5 | Publicado. Checar exclusão 2 |
| 8 | Sono: hábitos que ajudam | `insonia-o-que-fazer` | E6 | Publicado. Checar exclusão 2 |
| 9 | Insônia: quando procurar avaliação | `insonia-consulta-rotina` | E6 | Publicado. Checar exclusão 2 |
| 10 | Saúde mental do trabalhador migrante | `trabalhador-migrante-saude-mental` | E4 | Publicado |

**Pendências do piloto:**
- Os temas 6 a 9 são de eixos clínicos: a checagem de medicamento pode tirar algum. Nesse caso, o substituto sai de E7 ou E1 (publicados).
- A lista é uma proposta: confirmar os slugs no `INVENTARIO.csv` e no banco antes da Fase 1.
- Acesso ao CAPS e à UBS para migrantes: sem texto PT publicado hoje. Se o Dr. Antônio quiser esses temas no piloto, é preciso publicar um texto antes. `migrantes-refugiados-aps` (E7) está agendado, não publicado.

**Página `/es/` de entrada:** quadro de acolhimento (7.3), links para os 10 textos, bloco de identificação (7.1) e aviso de IA (7.2). Sem formulário e sem mensageria de terceiros.

## 10) UX para depois do piloto (somente listado, não feito)
- Seletor PT | ES com `localStorage` (sem cookies).
- Tempo de leitura e nota suave de conteúdo sensível também em PT.
- Player de áudio com Web Speech API só nas páginas ES, script próprio, sem terceiros.
- Busca por eixos (E1 a E7), sem CDN de terceiros.
- PHQ-9 e GAD-7 em ES (após confirmar URL oficial e licença; item g).
- Respiração guiada bilíngue.

## 11) Estimativa de uso e ritmo
- **Não medido.** Estimativa para a Fase 1: 1 tradução + 1 retrotradução por parágrafo amostrado por texto. Medir no piloto e registrar em `relatorios/CONSUMO.md`.
- **Teto:** a tradução **nunca usa `claude -p`** (regra de 19/10 segue valendo para o `claude -p`). Só em sessão interativa, com o Dr. Antônio presente, máximo **10 por dia, após o piloto**, e só com portão aprovado.
- Nada automático roda para ES nesta fase. Publicação ES só com OK do Dr. Antônio.

## 12) Fora desta fase
- Nenhuma alteração em `public/`, `backend/data/`, `vercel.json`, banco ou Vercel.
- Nenhuma tradução feita.
- A Fase 1 começa somente com a frase: **"aprovo a fase 1 ES"**.

## 13) Pendências para o Dr. Antônio
1. Confirmar a coleção `traducoes_es` (aceita como proposta nesta revisão).
2. Aprovar o bloco de identificação ES (7.1) e o aviso de IA (7.2).
3. Aprovar o quadro de acolhimento (7.3).
4. Indicar a instituição participativa (8.1).
5. Confirmar que o teto de 10 por dia vale só para a sessão interativa (11).
6. Aprovar a lista do piloto (9), inclusive a troca de CAPS e UBS por temas já publicados.
7. Autorizar, em fase posterior, a verificação do PHQ-9 e do GAD-7 em espanhol (g).
8. Confirmar o CVV com a instituição (8, a). Até lá, "atención en portugués".
