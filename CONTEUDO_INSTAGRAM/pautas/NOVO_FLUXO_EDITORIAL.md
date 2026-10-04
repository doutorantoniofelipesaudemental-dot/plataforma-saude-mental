# Novo fluxo editorial: fila de pautas ainda não publicadas

> Gerado a partir de `pautas.json` (status `redigida`) e do banco (somente leitura). Pacote Multimídia Completo obrigatório para cada pauta: ver `PADRAO_PACOTE_MULTIMIDIA.md`.

## Critério

- **Entram:** as pautas redigidas que não têm publicação nas redes. Nenhuma das 121 está entre os 10 artigos já postados (status `publicado`).
- **Ficam de fora:** as 7 que já têm pacote em `pacotes/` (crônicas ainda não postadas, listadas no fim).
- **Ordem:** por tema, na ordem de `METAS_EDITORIAL.json`; dentro do tema, lote crescente e, em seguida, data de redação.
- **Bloco Empresas & RH (Lote 3), pacotes 29 a 35 criados em 2026-10-04:** 5 peças em cada um (carrossel de 10 slides, reel com Lottie/GSAP, 6 Stories com enquete, 🎧 áudio narrado e podcast), chancela de saúde ocupacional, CVV 188 e SAMU 192; a 031 é sensível, com caixa de perguntas protegida. Passam em `checarEticaCfm`. Pautas 022 a 026 passaram a `sensivel: true`.
- **Residentes & Estudantes (Lote 1), pacotes 36 a 40 criados em 2026-10-04:** 5 peças em cada um, sem fármacos nem doses nas peças públicas, protocolos locais, CVV 188 e SAMU 192; 037, 038 e 040 são sensíveis, com caixa de perguntas protegida. Passam em `checarEticaCfm`. Os rascunhos 036 a 040 seguem `revisaoMedica: pendente`. **O rascunho 040 tem um marcador de dose da prometazina ainda por confirmar e não deve ser aprovado antes da correção.** A 039 está como `sensivel: false`, mas trata de emergência com risco de morte.
- **Lote de agendamento (2026-10-04):** `CONTEUDO_INSTAGRAM/agendamento/` reúne as legendas de texto dos pacotes 01 a 28 e o `agenda.csv` a partir de 05/10/2026; sem artes nem vídeos.
- **Revisão médica:** os rascunhos dos pacotes 01 a 35 estão com `revisaoMedica: aprovada`, registrada em 2026-10-04 por instrução expressa do Dr. Antônio Felipe (029 a 035 depois da adequação ao viés de saúde ocupacional e da remoção, no rascunho 031, da orientação direta de avaliação de risco a leigos). Os demais seguem `pendente`: nada vai ao ar sem revisão do Dr. Antônio Felipe.
- **Auditoria dos pacotes (2026-10-04):** os 35 pacotes de `pacotes/` têm as 5 peças (carrossel, reel, stories com enquete, 🎧 áudio narrado, Lottie/GSAP/Three.js) e passam em `checarEticaCfm` (contexto social); os pacotes 22 a 28 trazem CVV 188, SAMU 192 e caixa de perguntas protegida. Os ajustes clínicos e éticos do commit `c2e7d56` cobrem os pacotes 01 a 20 (21 a 28 foram gerados já com as diretrizes). Isso é checagem automática: a aprovação médica dos pacotes 01 a 28 foi registrada depois, por instrução do Dr. Antônio Felipe (ver item acima).

## Resumo

| Tema | Pautas na fila |
|---|---|
| Relatos da Prática | 21 |
| Pacientes & Famílias | 6 |
| Empresas & RH | 8 |
| Residentes & Estudantes | 44 |
| Condições Específicas | 18 |
| Linhas de Cuidado (Cuidadores & Professores) | 17 |
| **Total** | **114** |

## Relatos da Prática (21)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 001 | O balcão da farmácia e as perguntas não feitas | crônica | não | 1 | rascunho, fora do site |
| 002 | O lenço esquecido na cadeira do consultório | crônica | não | 1 | rascunho, fora do site |
| 003 | O domingo à tarde em que o telefone não chamou | crônica | sim | 1 | rascunho, fora do site |
| 004 | O corredor que parecia não ter fim | crônica | sim | 1 | rascunho, fora do site |
| 005 | O peso da prancheta e o olhar que escuta na APS | crônica | não | 2 | ainda não criado |
| 006 | A última consulta antes do plantão virar a madrugada | crônica | não | 2 | ainda não criado |
| 007 | O bilhete amassado no bolso do jaleco do plantão noturno | crônica | não | 2 | ainda não criado |
| 008 | A chave que girou devagar na porta da UBS ao amanhecer | crônica | não | 2 | ainda não criado |
| 009 | O eco dos passos vazios no corredor do plantão de domingo | crônica | não | 2 | ainda não criado |
| 010 | O peso do crachá na mesa de triagem do pronto-socorro | crônica | não | 2 | ainda não criado |
| 011 | O som do teclado que não parava na noite de plantão | crônica | não | 4 | ainda não criado |
| 012 | A mancha de café na folha de prescrição avulsa | crônica | não | 4 | ainda não criado |
| 013 | A última lâmpada acesa no corredor do posto de saúde | crônica | não | 4 | ainda não criado |
| 014 | O grampo de cabelo esquecido na maca de observação | crônica | sim | 4 | ainda não criado |
| 015 | A caneta que falhou no meio da consulta | crônica | não | 4 | ainda não criado |
| 016 | O peso da chave guardada no bolso da bata branca | crônica | não | 4 | ainda não criado |
| 017 | O peso do bloco de receituário rasgado na mesa | crônica | não | 4 | ainda não criado |
| 018 | O eco da campainha da última casa na visita domiciliar | crônica | não | 6 | ainda não criado |
| 019 | A luz acesa na sala de vacina quando a UBS já está vazia | crônica | não | 6 | ainda não criado |
| 020 | O som do estetoscópio na mesa de madeira escura | crônica | não | 6 | ainda não criado |
| 021 | A luz amarela do abajur na triagem do plantão | crônica | sim | 6 | ainda não criado |

## Pacientes & Famílias (6)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 022 | Saúde mental de migrantes: Síndrome de Ulisses e luto migratório | científico | sim | 1 | ainda não criado |
| 023 | Sinais precoces de depressão: guia de apoio prático para familiares | científico | sim | 1 | ainda não criado |
| 024 | Psicoeducação em saúde mental na família: orientando para o cuidado | científico | sim | 1 | ainda não criado |
| 025 | Primeiro episódio psicótico: orientações essenciais para a família | científico | sim | 2 | rascunho, fora do site |
| 026 | Esquecimento comum ou sinal de alerta: conversando sobre memória | científico | sim | 2 | rascunho, fora do site |
| 027 | Conviver com a oscilação de humor: limites e apoio familiar | científico | não | 2 | rascunho, fora do site |

## Empresas & RH (8)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 028 | Emissão de CAT por adoecimento mental: quando e como proceder | científico | sim | 3 | ainda não criado |
| 029 | Readaptação funcional em saúde mental: estratégias na empresa | científico | não | 3 | ainda não criado |
| 030 | Prevenção quaternária na medicina do trabalho e saúde mental | científico | não | 3 | ainda não criado |
| 031 | Acolhimento ao sofrimento psíquico agudo no ambiente laboral | científico | sim | 3 | ainda não criado |
| 032 | Impacto da cultura organizacional tóxica na saúde mental dos times | científico | não | 3 | ainda não criado |
| 033 | Avaliação de riscos psicossociais no trabalho: ferramentas práticas | científico | não | 3 | ainda não criado |
| 034 | Prevenção do absenteísmo psiquiátrico: diretrizes para o médico avaliador | científico | não | 3 | ainda não criado |
| 035 | Manejo da Síndrome do Esgotamento Profissional na Saúde Ocupacional: Do Rastreio ao Plano de Readaptação | científico | não | 3 | ainda não criado |

## Residentes & Estudantes (44)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 036 | Rastreio e manejo da depressão pós-parto na UBS | científico | não | 1 | ainda não criado |
| 037 | Avaliação do risco de suicídio na APS: o que o médico deve fazer | científico | sim | 1 | ainda não criado |
| 038 | Urgências psiquiátricas na UBS: Guia rápido de avaliação e conduta inicial | científico | sim | 1 | ainda não criado |
| 039 | Síndrome serotoninérgica na emergência: reconhecer para salvar | científico | não | 1 | ainda não criado |
| 040 | Manejo da agitação psicomotora: protocolo rápido no PA | científico | sim | 1 | ainda não criado |
| 041 | Delirium no pronto-atendimento: avaliação e manejo para residentes | científico | não | 2 | rascunho, fora do site |
| 042 | Catatonia na emergência médica: reconhecimento e manejo inicial | científico | não | 2 | rascunho, fora do site |
| 043 | Transtornos somatoformes na UBS: investigação e manejo clínico | científico | não | 2 | rascunho, fora do site |
| 044 | Uso de antipsicóticos na APS: indicações, ajustes e desprescrição | científico | não | 2 | ainda não criado |
| 045 | Insônia refratária na atenção primária: investigação e conduta | científico | não | 2 | rascunho, fora do site |
| 046 | Abandono de tratamento psiquiátrico: estratégias de resgate na UBS | científico | não | 2 | rascunho, fora do site |
| 047 | Transtorno bipolar na APS: rastreio e manejo intercrises | científico | não | 2 | rascunho, fora do site |
| 048 | Primeiro atendimento em psiquiatria na UBS: guia prático para residentes | científico | não | 2 | rascunho, fora do site |
| 049 | Urgências de abstinência de substâncias no PA: guia rápido | científico | sim | 3 | ainda não criado |
| 050 | Transtornos de personalidade na APS: identificação e manejo | científico | não | 3 | ainda não criado |
| 051 | Reações adversas a psicofármacos na UBS: o que monitorar | científico | não | 3 | ainda não criado |
| 052 | Avaliação de cefaleia tensional e ansiedade na UBS | científico | não | 3 | ainda não criado |
| 053 | Avaliação de queixas somáticas sem causa orgânica óbvia | científico | não | 3 | ainda não criado |
| 054 | Manejo da ideação suicida em populações vulneráveis na UBS | científico | sim | 3 | ainda não criado |
| 055 | Uso de estabilizadores de humor na APS: guia prático para residentes | científico | não | 4 | ainda não criado |
| 056 | Avaliação de queixas cognitivas em idosos na UBS: guia prático | científico | não | 4 | ainda não criado |
| 057 | Uso de antidepressivos em populações especiais na APS | científico | não | 4 | ainda não criado |
| 058 | Manejo da recusa alimentar e seletividade grave no pronto atendimento | científico | sim | 4 | ainda não criado |
| 059 | Manejo de episódios de raiva e agressividade no pronto atendimento | científico | sim | 4 | ainda não criado |
| 060 | Investigação de fadiga crônica e exaustão na atenção primária | científico | não | 4 | ainda não criado |
| 061 | Síndrome de descontinuação de antidepressivos na APS: guia prático | científico | não | 4 | ainda não criado |
| 062 | Manejo da Insônia em Plantões: Abordagem no Pronto-Atendimento | científico | não | 5 | ainda não criado |
| 063 | Manejo de Efeitos Colaterais Extrapiramidais no Plantão | científico | não | 5 | ainda não criado |
| 064 | Abordagem da Dor Crônica e Sofrimento Psíquico na UBS | científico | não | 5 | ainda não criado |
| 065 | Manejo da Hiperventilação e Ataque de Pânico no Plantão | científico | não | 5 | ainda não criado |
| 066 | Desmame Seguro de Benzodiazepínicos na Atenção Primária | científico | não | 5 | ainda não criado |
| 067 | Uso de inibidores seletivos da recaptação de serotonina na UBS | científico | não | 5 | ainda não criado |
| 068 | Distonia aguda por antipsicóticos na emergência: manejo prático | científico | não | 5 | ainda não criado |
| 069 | Uso Off-Label de Psicofármacos na UBS: Evidências e Prática | científico | não | 5 | ainda não criado |
| 070 | Crise de Ansiedade vs Infarto: Diagnóstico Diferencial no PA | científico | não | 5 | ainda não criado |
| 071 | Avaliação Inicial de Sintomas Conversivos no Pronto-Socorro | científico | não | 5 | ainda não criado |
| 072 | Avaliação de Risco de Quedas por Psicofármacos na UBS: Guia para Residentes | científico | não | 6 | ainda não criado |
| 073 | Manejo de Sintomas Depressivos Resistentes na UBS: Conduta para Residentes | científico | não | 6 | ainda não criado |
| 074 | Abordagem de Transtornos de Pânico no Pronto-Socorro: Guia para Residentes | científico | não | 6 | ainda não criado |
| 075 | Avaliação de Sintomas Somáticos na UBS: Raciocínio Clínico para Residentes | científico | não | 6 | ainda não criado |
| 076 | Manejo de Sintomas Psicóticos Induzidos por Substâncias no PA | científico | sim | 6 | ainda não criado |
| 077 | Transtorno de Personalidade Borderline no Plantão: Conduta Inicial | científico | sim | 6 | ainda não criado |
| 078 | Manejo da Insônia Aguda e Crônica em Pacientes Oncológicos na APS | científico | não | 6 | ainda não criado |
| 079 | Uso de Antipsicóticos de Depósito na APS: Guia Prático para Residentes | científico | não | 6 | ainda não criado |

## Condições Específicas (18)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 080 | Transtorno obsessivo-compulsivo na APS: reconhecimento e manejo inicial | científico | não | 2 | rascunho, fora do site |
| 081 | Uso problemático de telas e dependência digital na infância e APS | científico | não | 2 | rascunho, fora do site |
| 082 | Manejo de Sintomas Dissociativos Associados ao Trauma e Estresse Crônico na APS: Guia de Acolhimento e Autorregulação | científico | sim | 2 | rascunho, fora do site |
| 083 | Transtorno dissociativo de identidade: reconhecimento e manejo clínico na APS | científico | não | 4 | ainda não criado |
| 084 | Disforia de gênero e saúde mental: acolhimento e suporte na atenção primária | científico | não | 4 | ainda não criado |
| 085 | Transtorno explosivo intermitente: reconhecimento e manejo farmacológico na APS | científico | não | 4 | ainda não criado |
| 086 | Tricotilomania e transtorno de escoriação: diagnóstico e manejo ambulatorial | científico | não | 4 | ainda não criado |
| 087 | Mutismo seletivo na infância: identificação precoce e conduta na UBS | científico | não | 4 | ainda não criado |
| 088 | Hipocondria e transtorno de ansiedade de doença: conduta na atenção primária | científico | não | 4 | ainda não criado |
| 089 | Disforia Sensorial e Sobrecarga no Transtorno do Espectro Autista | científico | não | 5 | ainda não criado |
| 090 | Acatisia Induzida por Antipsicóticos: Diagnóstico e Conduta | científico | não | 5 | ainda não criado |
| 091 | Transtorno da Fluência na Fala na Infância: Manejo Inicial na APS | científico | não | 5 | ainda não criado |
| 092 | Transtorno de Personalidade Esquizotípica na APS: Rastreio e Manejo | científico | não | 6 | ainda não criado |
| 093 | Amnésia Global Transitória no Pronto-Socorro: Diagnóstico Diferencial Psiquiátrico | científico | não | 6 | ainda não criado |
| 094 | Síndrome do Coração Partido e Sofrimento Psíquico Agudo no PA | científico | não | 6 | ainda não criado |
| 095 | Mutismo Acinético e Estados de Inércia Severa no Pronto-Socorro | científico | não | 6 | ainda não criado |
| 096 | Transtorno de Adaptação na APS: Diagnóstico e Conduta para Residentes | científico | não | 6 | ainda não criado |
| 097 | Uso de Benzodiazepínicos na Emergência: Manejo de Agudos | científico | não | 6 | ainda não criado |

## Linhas de Cuidado (Cuidadores & Professores) (17)

| # | Pauta | Tipo | Sensível | Lote | Artigo no banco |
|---|---|---|---|---|---|
| 098 | Grupos de apoio para cuidadores de idosos na APS: eficácia na prática | científico | não | 1 | ainda não criado |
| 099 | Conflitos escolares e saúde docente: manejo e apoio na inclusão | científico | não | 1 | ainda não criado |
| 100 | Cuidadores de pessoas com autismo e deficiência: manejo do estresse crônico | científico | não | 1 | ainda não criado |
| 101 | Cuidadores familiares em cuidados paliativos: como prevenir o colapso emocional | científico | não | 1 | ainda não criado |
| 102 | Professores e inclusão: manejo da ansiedade na sala de aula inclusiva | científico | não | 3 | ainda não criado |
| 103 | Cuidadores de jovens com autismo severo: transição para a vida adulta | científico | não | 3 | ainda não criado |
| 104 | Professores iniciantes: prevenção do choque de realidade e exaustão | científico | não | 3 | ainda não criado |
| 105 | Professores e a saúde mental: identificando limites diante da sobrecarga | científico | não | 3 | ainda não criado |
| 106 | Professores e o luto pedagógico: acolhendo perdas e mudanças na escola | científico | não | 3 | ainda não criado |
| 107 | Cuidadores de pacientes com doenças raras: o fardo invisível | científico | não | 3 | ainda não criado |
| 108 | Professores e o ciberbullying: impactos na saúde mental | científico | não | 5 | ainda não criado |
| 109 | Cuidadores de pacientes com sequelas de AVC em casa | científico | não | 5 | ainda não criado |
| 110 | Professores de educação infantil e a regulação emocional | científico | não | 5 | ainda não criado |
| 111 | Professores de EJA: lidando com histórias de superação | científico | não | 5 | ainda não criado |
| 112 | Cuidadores de pacientes com Alzheimer avançado e o luto antecipatório | científico | não | 5 | ainda não criado |
| 113 | Cuidadores familiares de dependentes químicos: manejo da codependência na APS | científico | sim | 5 | ainda não criado |
| 114 | Professores e o suporte aos alunos com ideação suicida: guia na APS | científico | sim | 5 | ainda não criado |

## Fora da fila: já têm pacote (ainda não postados)

- A sala de espera que respirava em silêncio (`a-sala-de-espera-que-respirava-em-silencio`)
- O café frio que esperou a consulta acabar (`o-cafe-frio-que-esperou-a-consulta-acabar`)
- A carta que nunca foi enviada ao psiquiatra (`a-carta-que-nunca-foi-enviada-ao-psiquiatra`)
- A receita dobrada no bolso do casaco (`a-receita-dobrada-no-bolso-do-casaco`)
- A planta que sobreviveu na janela do posto (`a-planta-que-sobreviveu-na-janela-do-posto`)
- O idioma do afeto: acolhendo quem chegou de longe na UBS (`o-idioma-do-afeto-acolhendo-quem-chegou-de-longe-na-ubs`)
- O relógio na parede do pronto atendimento (`o-relogio-na-parede-do-pronto-atendimento`)

## Lote piloto

- **Pacote 01:** primeira pauta da fila (item 001). Arquivo: `pacotes/novo-fluxo-01-<slug>.md`.
