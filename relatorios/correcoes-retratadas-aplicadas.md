# Referências retratadas: correções aplicadas em 15/10/2026

Aprovadas pelo Dr. Antônio. Backups: `backups/referencias-retratadas-20261015-0720/` (Mongo + .mdx) e `backups/editorial-20261015-0728/`. Script: `backend/scripts/corrigirRetratadas.js` (dry-run → `--aplicar`).
Depois da troca, a varredura de todos os DOIs/PMIDs (737) acusa **0 retratados** e a auditoria dos 815 textos, 0 falhas.

## Fontes novas e o que o resumo sustenta
- **Hodkinson 2022 (BMJ, PMID 36104064)** — 170 estudos, 239.246 médicos. Resumo: "Overall physician burnout doubled patient safety incidents compared with no patient safety incidents (2.04, 1.69 to 2.45 …)"; "Low professionalism was twice as likely … (2.33, 1.96 to 2.70)"; "patient dissatisfaction … (2.22, 1.38 to 3.57)". → razão de chances ≈ 2: "chance cerca de duas vezes maior" está correto (o número real é 2,04).
- **Salyers 2017 (J Gen Intern Med, PMID 27785668)** — 82 estudos, 210.669 profissionais de saúde. Resumo: relação negativa entre burnout e segurança (r = −0,23; IC 95% −0,28 a −0,17) e qualidade (r = −0,26): "greater burnout among healthcare providers was associated with poorer-quality healthcare and reduced safety for patients"; "effects are small to medium". Cobre profissionais de várias categorias, não só médicos.
- **Parola 2017 (JBI Database System Rev Implement Rep, PMID 28708752)** — 8 estudos transversais, 1.406 profissionais (enfermeiros, médicos e assistentes sociais) de unidades/serviços especializados de cuidados paliativos. Resumo: "Data revealed a prevalence of burnout of 17.3% among health professionals" (maior em assistentes sociais, 27%; atenção domiciliar 19,6%).
- **Dijxhoorn 2021 (Palliat Med, PMID 33063609)** — 59 estudos. Resumo: "Burnout among healthcare professionals providing palliative care ranged from 3% to 66%"; "No major differences in prevalence were found between nurses and physicians"; interventions: meditação, comunicação, mentoria entre pares e supervisão com arteterapia (efeitos de longo prazo desconhecidos).

## ANTES → DEPOIS (cada frase)
1. **burnout-medicos-enfermeiros** (site e Next) e **burnout-aps** (site e Next) — ref. 4: Panagioti 2018 → **Hodkinson 2022**
   - ANTES: "médicos com burnout têm cerca de duas vezes mais chance de se envolver em incidentes de segurança do paciente"
   - DEPOIS: "médicos com burnout têm chance cerca de duas vezes maior de se envolver em incidentes de segurança do paciente" (OR 2,04)
2. **saude-mental-profissionais-saude-hospital** — ref. 4: Panagioti 2018 → **Hodkinson 2022**
   - Frase mantida: "o burnout médico se associa a mais incidentes de segurança e menor satisfação dos pacientes" (OR 2,04 e 2,22: sustentada).
3. **relato-cuidador-equipe-burnout** (ref. 3) e **relato-enfermeira-plantao-exaustao** (ref. 2): Panagioti 2018 → **Salyers 2017**
   - ANTES: "O esgotamento da equipe se associa a mais incidentes de segurança do paciente."
   - DEPOIS: "O esgotamento dos profissionais de saúde se associa a pior segurança do paciente." (Salyers cobre profissionais de saúde em geral; Hodkinson cobre só médicos.)
4. **paliativos-burnout-equipes**
   - ANTES (ref. 1, Kamal 2016): "Um levantamento com profissionais de hospice e cuidados paliativos nos Estados Unidos encontrou taxa de burnout de cerca de 62%, maior entre os mais jovens, os que trabalhavam mais horas e em equipes pequenas."
   - DEPOIS (ref. 1, **Parola 2017**): "Uma revisão sistemática de 8 estudos, com 1.406 profissionais (médicos, enfermeiros e assistentes sociais) de serviços especializados de cuidados paliativos, encontrou prevalência de burnout de 17,3%." Seguida da frase que já existia sobre Dijxhoorn (agora "Outra revisão sistemática, com 59 estudos, mostrou prevalência de burnout entre 3% e 66% …"). O "62%" e os "preditores" saíram (sem apoio nas fontes novas).
   - ANTES (ref. 3, Panagioti): "Entre médicos em geral, o burnout é frequente e está associado a mais erros, pior profissionalismo e menor satisfação dos pacientes."
   - DEPOIS (ref. 3, **Hodkinson 2022**): "Entre médicos em geral, o burnout está associado a mais incidentes de segurança do paciente, pior profissionalismo e menor satisfação dos pacientes." ("é frequente" saiu: o Hodkinson não mede prevalência.)
   - Numeração das referências conferida: 1 Parola, 2 Dijxhoorn, 3 Hodkinson, 4 West, 5 Morris.
5. **paliativos-luto-do-profissional** — ref. 4: Kamal 2016 → **Dijxhoorn 2021**
   - ANTES: "O acúmulo de perdas sem elaboração é um dos caminhos para o burnout em profissionais de cuidados paliativos."
   - DEPOIS: "Profissionais de cuidados paliativos convivem com perdas repetidas, e o burnout aparece nesse grupo, com prevalência que varia de 3% a 66% entre os estudos." (o mecanismo "perdas sem elaboração" não tem apoio no resumo e foi retirado.)

## Narração e Instagram
- Narração: os textos com áudio cujo trecho narrado mudou passam a "desatualizada" e entram primeiro no próximo lote (publicados, por visualizações). `burnout-medicos-enfermeiros`, `burnout-aps`, `relato-cuidador-equipe-burnout` e `relato-enfermeira-plantao-exaustao` estavam "ok" e ficam para regerar; os demais não tinham áudio.
- Instagram: só `relato-cuidador-equipe-burnout` está na fila (08/01/2027); a legenda e a capa não citam número nem estudo e não mudam; a auditoria do texto de origem (feita antes de publicar) passa.

# Observações editoriais (aplicadas)

## ClassInd / ECA Digital — `jogos-online-consulta-medicos` (app Next)
- **Não consegui confirmar em fonte primária aberta** a frase "Roblox, Fortnite e Free Fire foram classificados como NR16 pelo critério de engajamento contínuo e sistemas de recomendação algorítmica": as duas notas oficiais que mencionam isso (gov.br/mj e gov.br/secom, abril/2026) aparecem na busca, mas abrem como "Conteúdo Restrito — É necessário autenticar" (testei por ferramenta e por navegador). Pela regra, a afirmação específica saiu.
- O que está no texto agora (lido por mim em planalto.gov.br): a **Lei 15.211/2025, art. 20**, veda caixas de recompensa (loot boxes) em jogos direcionados a crianças e adolescentes ou de acesso provável por eles; o **Decreto nº 12.880, de 18/03/2026**, regulamenta a Lei e trata como riscos a interação entre usuários, o estímulo ao uso problemático ou excessivo e as caixas de recompensa. Link direto de cada norma, com o Decreto acrescentado à referência 4. O texto manda conferir a classificação vigente de cada jogo no site do Ministério da Justiça.
- A **Portaria MJSP nº 1.048/2025** existe (regulamenta a classificação indicativa na Lei 15.211), mas só achei o link de um repositório do Ministério que não abriu para mim; por isso não a citei com link.
- **Pendente de decisão:** `jogos-online-criancas` (Next) tem a mesma afirmação em tabela (Roblox/Fortnite/Free Fire NR16; Minecraft NR14; EA FC/NBA 2K/WWE 2K NR18), parte dela (Minecraft e os esportivos) sem nenhuma confirmação que eu tenha achado. Não alterei porque é um texto inteiro construído em cima disso; proponho trocar a tabela por orientação geral, se o senhor aprovar.

## Links de leis
- Correção ao meu relatório anterior: as referências a leis **já tinham link direto** (o texto do link é que aparece como "planalto.gov.br"). Conferi todos: 72 URLs distintas nos textos do site e 18 nos `.mdx`; todos abrem e a norma confere (a Lei Maria da Penha também, a página é UTF-16).
- Quebrados e corrigidos: Guia alimentar para menores de 2 anos (bvsms 404 → cópia no Portal de Boas Práticas/Fiocruz, 5 textos: 3 do site + 2 do Next), Portaria MS 254/2002 (bvsms 404 → cópia no MPF, 2 textos), Resolução CFM 2.333/2023 (link da home do CFM → link direto da norma, 2 textos), WHO PM+ (`WHO-MSD-MER-16.2` 404 → página atual da OMS, 1 texto).

## Selo "Narrativa composta"
- Aplicado em **19 textos** do site que abriam com a cena de uma pessoa específica e não tinham o selo (mesma frase dos relatos, no parágrafo final): violencia-adultos-que-sofreram-abuso-na-infancia, caneta-sem-indicacao-magreza, violencia-criancas-em-acolhimento, violencia-obstetrica, violencia-depois-de-sair-reconstruir, violencia-financeira-contra-idoso, violencia-idoso-e-cuidador-sobrecarregado, violencia-trabalhadores-expostos-a-assaltos, violencia-domestica-e-trabalho, violencia-maes-que-perderam-filhos, violencia-digital-e-perseguicao, violencia-institucional-e-revitimizacao, violencia-psicologica-controle-coercitivo, familias-separadas-migracao-quem-fica, migracao-sofrimento-no-corpo, violencia-trauma-vicario-rede-de-protecao, violencia-contra-pessoa-idosa, violencia-negligencia-infantil, migracao-adolescentes-entre-dois-mundos.
- Todos os `relato-*` já tinham o selo (0 sem). Não apliquei em 16 textos que abrem com situações genéricas de vários personagens ("Ela… Ele…"), que não são uma cena individual; se preferir o selo também neles, é só dizer.
