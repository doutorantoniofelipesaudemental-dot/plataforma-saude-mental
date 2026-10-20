# Dry-run da importação (20/10/2026) — nada gravado no banco

Aceitos para importar: 17 de 17. Em revisão (decisão do Dr. Antônio): 7.

| slug | categoria | data agendada | referências | resultado |
|---|---|---|---|---|
| afastamento-trabalho-laudo-aps | Médicos & Enfermeiros | revisão | 4 | OK |
| anorexia-bulimia-adolescencia | Compulsões & Transtornos Alimentares | 2026-12-24 | 4 | OK |
| ansiedade-depressao-gestacional | Maternidade, Puerpério & Lactação | 2026-12-28 | 4 | OK |
| ansiedade-por-inteligencia-artificial | Geral | 2026-12-29 | 4 | OK |
| baby-blues-ou-depressao-pos-parto | Maternidade, Puerpério & Lactação | 2026-12-30 | 4 | OK |
| benzodiazepinicos-uso-cronico-riscos | Médicos & Enfermeiros | 2026-12-31 | 5 | OK |
| burnout-docente-sala-de-aula | Educadores & Professores | revisão | 4 | OK |
| colapso-do-cuidador-emergencia-pa | Cuidadores & Famílias | 2027-01-04 | 4 | OK |
| comparacao-redes-sociais-autoestima | Geral | 2027-01-05 | 4 | OK |
| esquecimento-normal-ou-alzheimer | Saúde Mental na Terceira Idade | 2027-01-06 | 4 | OK |
| exercicio-fisico-como-prescricao-medica | Condições Específicas | 2027-01-07 | 4 | OK |
| fadiga-por-compaixao-profissionais-saude | Médicos & Enfermeiros | 2027-01-08 | 4 | OK |
| fome-emocional-compulsao-alimentar | Compulsões & Transtornos Alimentares | 2027-01-11 | 4 | OK |
| luto-gestacional-e-neonatal | Luto & Divórcio | revisão | 4 | OK |
| luto-normal-ou-complicado | Luto & Divórcio | 2027-01-12 | 4 | OK |
| panico-ou-infarto-diagnostico-diferencial | Médicos & Enfermeiros | 2027-01-13 | 4 | OK |
| peso-psicologico-doenca-cronica | Condições Específicas | 2027-01-14 | 5 | OK |
| polifarmacia-idoso-delirium | Saúde Mental na Terceira Idade | 2027-01-15 | 4 | OK |
| sindrome-do-cuidador-sinais | Cuidadores & Famílias | 2027-01-18 | 4 | OK |
| tdah-ou-agitacao-infantil | Educadores & Professores | revisão | 4 | OK |
| tept-violencia-urbana-assalto | Condições Específicas | 2027-01-19 | 5 | OK |
| vape-nicotina-adolescentes | Dependências & Adições | revisão | 4 | OK |
| vicio-em-apostas-bets-sinais-de-alerta | Dependências & Adições | revisão | 4 | OK |
| violencia-domestica-sinais-na-consulta | Condições Específicas | revisão | 4 | OK |


## Resultado da importação (20/10/2026) — versão corrigida

- Primeira tentativa (17 textos) foi DESFEITA: 12 deles já existem como páginas MDX no app (apps/plataforma-saude-mental/src/content/artigos/). A checagem de duplicidade inicial olhou só o banco. Os 17 foram removidos pelo marcador da importação; o banco voltou a 726.
- **9 textos novos importados** como AGENDADOS (trava B), status rascunho, publicado false, publicadoEm = data agendada. Banco: 726 → 735. Nenhum documento existente foi alterado.
- Datas (08:00 de Salvador): 24/12 ansiedade por IA; 28/12 baby blues; 29/12 esquecimento normal; 30/12 exercício físico; 31/12 fadiga por compaixão; 04/01 fome emocional; 05/01 luto normal; 06/01 pânico ou infarto; 07/01 síndrome do cuidador.
- Backup antes da primeira gravação: backups/importacao-extra-20261020-1241/artigos.json (726 documentos).
- Calendário: feriados 25/12/2026 e 01/01/2027 incluídos em backend/lib/calendarioSite.js (testes passaram).
- Em revisão: ver IMPORTACAO-24-REVISAO-20261020.md.
- Não importados por já existirem no site: 12 (ver a lista na revisão).

## CORREÇÃO FINAL (20/10/2026)

- **Nenhum texto foi importado.** Os 24 já existem no site: 12 em apps/plataforma-saude-mental/src/content/artigos/ e os outros 12 em apps/plataforma-saude-mental/content/blog/ (MDX rastreado pelo Git). A verificação anterior olhou só o banco, e isso estava errado.
- As 2 tentativas de importação foram DESFEITAS (17 e depois 9 documentos), removidos só pelo marcador da importação. O banco voltou a 726 documentos.
- Possível explicação: o ZIP é uma atualização de referências dos textos já existentes (a ferramenta aplicar-referencias existe para isso). Isso precisa ser confirmado pelo Dr. Antônio, comparando a versão do ZIP com a do site.
