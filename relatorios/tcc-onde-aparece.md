# "Terapia Cognitivo-Comportamental" (TCC) na assinatura — onde aparece e onde NÃO aparece (15/10/2026)

Levantamento só de leitura. Nada foi alterado: a decisão é do Dr. Antônio.

## Onde APARECE

- **Placas de marca** (assets/marca, as 3): "Pós-Graduações: … • Terapia Cognitivo-Comportamental (Não especialista)".
- **Template do site** (public/artigo.html, rodapé de TODA página de artigo e relato): bloco de 5 linhas com TCC.
- **Páginas estáticas**: public/index.html, public/blog.html, public/instagram.html, public/links.html.
- **App Next**: app/links/page.js, app/mentoria/LandingMentoria.jsx, app/mentoria/page.js.
- **Código**: backend/lib/conformidadeCfm.js (IDENTIFICACAO_COMPLETA, a constante oficial de 5 linhas).
- **Regras e testes**: CLAUDE.md (padrão de 5 linhas, §1.A), tests/unit/assinatura-cfm.test.js, tests/unit/auditoria-instagram-assinatura-social.test.js.
- **Documentos**: README.md, prompt-mestre-plataforma.md, referencias-140-prontas/ (LEIA-ME e PROMPT).
- **CONTEUDO_INSTAGRAM/**: 126 arquivos (roteiros, pautas e rascunhos antigos).
- **MongoDB**: 24 textos trazem a TCC dentro do próprio HTML (lista abaixo).

## Onde NÃO aparece

- **Artes novas das redes** (fila v2) e **legendas**: usam a assinatura de 3 linhas (nome/CRM, especialidade/RQE, atuação), que não tem pós-graduações.
- **MongoDB**: 665 textos trazem a linha de pós-graduações SEM a TCC (inclui os 481+180 importados, cujo HTML tem 4 pós-graduações: Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho). Outros 37 textos não têm o bloco no HTML (a identificação deles vem só do rodapé do template, que TEM a TCC).
- **App Next (89 .mdx)**: a linha de pós-graduações existe nos 89, nenhuma com a TCC.
- **Blocos de identificação do HTML dos lotes** (PROMPT-MESTRE): 4 pós-graduações, sem TCC.

## Consequência visível hoje

Uma mesma página de artigo mostra a identificação do rodapé (COM TCC) e, no corpo, o bloco do texto (na maioria SEM TCC). As placas de marca e a /links também citam TCC; as artes das redes não.

## Os 24 textos do MongoDB com TCC no HTML

- a-carta-que-nunca-foi-enviada-ao-psiquiatra (rascunho/agendado)
- a-planta-que-sobreviveu-na-janela-do-posto (rascunho/agendado)
- a-receita-dobrada-no-bolso-do-casaco (rascunho/agendado)
- a-sala-de-espera-que-respirava-em-silencio (rascunho/agendado)
- o-balcao-da-farmacia-e-as-perguntas-nao-feitas (rascunho/agendado)
- o-cafe-frio-que-esperou-a-consulta-acabar (rascunho/agendado)
- o-corredor-que-parecia-nao-ter-fim (rascunho/agendado)
- o-domingo-a-tarde-em-que-o-telefone-nao-chamou (rascunho/agendado)
- o-idioma-do-afeto-acolhendo-quem-chegou-de-longe-na-ubs (rascunho/agendado)
- o-lenco-esquecido-na-cadeira-do-consultorio (rascunho/agendado)
- o-relogio-na-parede-do-pronto-atendimento (rascunho/agendado)
- abandono-de-tratamento-psiquiatrico-estrategias-de-resgate-n (rascunho/agendado)
- catatonia-na-emergencia-medica-reconhecimento-e-manejo-inici (rascunho/agendado)
- conviver-com-a-oscilacao-de-humor-limites-e-apoio-familiar (rascunho/agendado)
- delirium-no-pronto-atendimento-avaliacao-e-manejo-para-resid (rascunho/agendado)
- esquecimento-comum-ou-sinal-de-alerta-conversando-sobre-memo (rascunho/agendado)
- insonia-refrataria-na-atencao-primaria-investigacao-e-condut (rascunho/agendado)
- manejo-de-sintomas-dissociativos-associados-ao-trauma-e-estr (rascunho/agendado)
- primeiro-atendimento-em-psiquiatria-na-ubs-guia-pratico-para (rascunho/agendado)
- primeiro-episodio-psicotico-orientacoes-essenciais-para-a-fa (rascunho/agendado)
- transtorno-bipolar-na-aps-rastreio-e-manejo-intercrises (rascunho/agendado)
- transtorno-obsessivo-compulsivo-na-aps-reconhecimento-e-mane (rascunho/agendado)
- transtornos-somatoformes-na-ubs-investigacao-e-manejo-clinic (rascunho/agendado)
- uso-problematico-de-telas-e-dependencia-digital-na-infancia (rascunho/agendado)
