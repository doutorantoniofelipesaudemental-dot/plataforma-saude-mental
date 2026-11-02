# Inventário do acervo — reclassificado (PROPOSTA, só leitura)

Gerado em 01/11/2026 (17:45) a partir de `textos-banco.json` (export) e `agenda-pos-aplicacao.json` (agenda aplicada hoje). Nada alterado no banco, no site ou na Vercel.
CSV com uma linha por texto: `INVENTARIO.csv`. Eixo por TÍTULO + CONTEÚDO; público = categoria.

## Totais
- Textos: **726**
- Status: publicados **361** · agendados **339** (03/11/2026 a 21/04/2027, 2 por dia) · fora da agenda **26** (aguarda-revisao-medica, Nível 1)
- Vertical A (relatos): **190** · Vertical B (psicoeducação): **536**
- Marcados para revisão ("revisar" = sim): **11** (eram 216; lista em `reclassificacao-02-11-revisar.txt`)
- Referências fora do padrão (sem lista formatada): **12** (agenda não alterada)
- Títulos sensíveis (palavra-chave, pré-triagem): **19**

## Totais por eixo (1–7, nomes oficiais de 02/11/2026)
Reclassificação com as regras da ordem de 02/11 (paliativos → 3, exceto quem cuida → 4; luto → 3, ou 7 se ligado a violência/sociedade; categoria = público). Regras e decisões manuais: `reclassificar-eixos.js` e `reclassificacao-02-11-overrides.json`.

| Eixo | Textos |
|---|---|
| 1 — Infância, Adolescência, Pais & Família, Professores & Saúde Escolar | 157 |
| 2 — Maternidade, Puerpério & Saúde Perinatal | 19 |
| 3 — Vida Adulta, Envelhecimento & Cuidados Paliativos | 88 |
| 4 — Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1) | 134 |
| 5 — Transtornos Mentais | 138 |
| 6 — Hábitos, Estilo de Vida & Sono | 54 |
| 7 — Sociedade, Cultura & Existência | 136 |

## Por vertical × status
| Vertical | Publicados | Agendados | Fora |
|---|---|---|---|
| A (relatos) | 81 | 107 | 2 |
| B (psicoeducação) | 280 | 232 | 24 |

## Público (categoria de origem)
| Relatos da Prática | 190 |
| Pacientes & Famílias | 102 |
| Empresas & RH | 73 |
| Pais & Famílias | 67 |
| Médicos & Enfermeiros | 64 |
| Geral | 56 |
| Migrantes & Expatriados | 51 |
| Condições Específicas | 33 |
| Infância & Adolescência | 21 |
| Terceiro Setor & Causas Sociais | 12 |
| Residentes & Estudantes | 11 |
| Cuidadores & Famílias | 10 |
| Saúde Mental na Terceira Idade | 7 |
| Dependências & Adições | 6 |
| Luto & Divórcio | 5 |
| Educadores & Professores | 4 |
| Maternidade, Puerpério & Lactação | 4 |
| Neurodivergência na Vida Adulta | 3 |
| Ansiedade Social & Timidez | 2 |
| Compulsões & Transtornos Alimentares | 2 |
| Trabalho Doméstico & Cuidados do Lar | 1 |
| Pós-Graduação & Concursos | 1 |
| Transição de Carreira & Aposentadoria | 1 |

## Limites
- O eixo é uma **classificação automática por palavras-chave** no título (peso ×3) e em trechos específicos do corpo. Não é leitura clínica. Os 216 marcados como "revisar" precisam de conferência; os relatos são os mais afetados.
- O status vem da agenda aplicada hoje (339 agendados). O export original tinha 365 agendados; os 26 fora são os do Nível 1.
- Revisão médica: o banco não tem campo de status de revisão.
