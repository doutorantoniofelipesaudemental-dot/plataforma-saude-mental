# Benchmark: práticas de comunicação em saúde (20/10/2026)

Fontes consultadas (pesquisa web em 20/10/2026; confira as páginas antes de citar em público):
- Mayo Clinic: [política de informação em saúde](https://www.mayoclinic.org/about-this-site/health-information-policy)
- NHS (Reino Unido): [guia de conteúdo "How we write"](https://service-manual.nhs.uk/content/how-we-write)
- OMS e IASP: [recursos de mídia sobre suicídio](https://www.iasp.info/specialinterestgroups/suicideandthemedia/) (o texto original da OMS não foi localizado na pesquisa)

Limite da pesquisa: não consegui confirmar se a Mayo mostra "revisado por" e data em cada artigo. A própria busca indicou que a Mayo revisa conteúdo a cada dois anos para temas de evolução rápida.

## As 10 práticas

| # | Prática | Fonte | Esforço | Ganho | Risco ético | Tipo |
|---|---|---|---|---|---|---|
| 1 | Dono médico identificado e data de última revisão visível | Mayo | Baixo | Confiança e E-E-A-T | Baixo, se a data vier do registro real | Técnica |
| 2 | Revisão periódica por tema (acompanhar a cada 12 meses e rever conforme evolução) | Mayo (2 anos) | Médio | Conteúdo atualizado | Baixo | Processo (fila já prevista) |
| 3 | Declaração de conflito de interesse, quando houver | Mayo | Baixo | Transparência | Baixo | Conteúdo: só com sua aprovação |
| 4 | Sem "byline" de equipe; autoria clara do médico | Mayo | Baixo | Clareza de responsabilidade | Baixo | Já aplicado |
| 5 | Termo simples primeiro, termo técnico entre parênteses | NHS | Médio | Compreensão | Baixo | **Conteúdo clínico: só com sua aprovação, texto a texto** |
| 6 | Meta de leitura entre 9 e 11 anos quando possível | NHS | Alto | Acessibilidade | Baixo | **Conteúdo: reescrita precisa do seu OK** |
| 7 | Legenda obrigatória em vídeo, não só "queimada" na imagem | NHS (guia legado) | Baixo | Acessibilidade | Nenhum | Técnica (YouTube já é legenda de arquivo) |
| 8 | Linguagem de suicídio sem detalhar métodos e locais; "morreu por suicídio" | OMS/IASP | Baixo | Prevenção | Alto se violado | Conteúdo: já é regra do CLAUDE.md; reforçar na auditoria |
| 9 | Mensagem de esperança com caminho de cuidado (Papageno) | IASP | Médio | Prevenção | Baixo se factual | Conteúdo: com sua aprovação |
| 10 | Sem promessa de cura nem linguagem de sensacionalismo | Consenso das diretrizes | Baixo | Credibilidade | Alto se violado | Já coberto pela checagem ética |

## O que dá para fazer agora (só técnico)

- **Item 1:** campo de data de revisão vindo do registro, com `reviewedBy` no schema. Precisa de OK de deploy (mexe em `public/artigo.html` e no app Next).
- **Item 7:** conferir que os vídeos têm legenda em arquivo (já é o padrão do pipeline).

Os demais mudam conteúdo. Só entram com a sua aprovação.

## Observação

A pesquisa não encontrou o texto atual da OMS sobre mídia e suicídio. Antes de citar a OMS em qualquer peça, confira o documento no site da OMS.
