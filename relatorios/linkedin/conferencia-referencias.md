# Conferência de referências da fila do LinkedIn (29/10/2026)

Ordem do Dr. Antônio: conferir, no PubMed ou pelo DOI, as referências dos posts abertos da fila. Conferido se a referência existe, se os dados batem (autores, ano, revista) e se ela sustenta o dado e a afirmação principal do post. Os textos não foram editados.

Attribution: according to PubMed (articles retrieved from PubMed, via get_article_metadata; DOIs linkados abaixo).

## Escopo

- Abertos: 20 itens. 14 são textos (`aprovado-checagem`) e 6 são carrosséis (`manual`). A regra de referência vale só para texto, então os carrosséis ficam fora.
- Resultado: **6 aprovados** (referência conferida) e **8 reprovados** (vão para a fila manual com motivo).

## Aprovados (6)

| Post | Referência | PMID | DOI | Observação |
|---|---|---|---|---|
| li-2026-12-30 | Howard LM et al. Lancet 2014 | 25455248 | [DOI](https://doi.org/10.1016/S0140-6736(14)61276-9) | Pontos de corte da EPDS no Brasil não vêm desta referência |
| li-2027-01-01 | Kok RM, Reynolds CF. JAMA 2017 | 28535241 | [DOI](https://doi.org/10.1001/jama.2017.5706) | Validação da GDS no Brasil não vem desta referência |
| li-2027-01-06 | Potenza MN et al. Nat Rev Dis Primers 2019 | 31346179 | [DOI](https://doi.org/10.1038/s41572-019-0099-7) | — |
| li-2027-01-11 | Kessler RC et al. Biol Psychiatry 2013 | 23290497 | [DOI](https://doi.org/10.1016/j.biopsych.2012.11.020) | — |
| li-2027-01-18 | Bush K et al. Arch Intern Med 1998 | 9738608 | [DOI](https://doi.org/10.1001/archinte.158.16.1789) | "Evidência Cochrane" da intervenção breve sem referência. Dr. pode pedir a retirada |
| li-2027-01-29 | Richmond JS et al. West J Emerg Med 2012 | 22461917 | [DOI](https://doi.org/10.5811/westjem.2011.9.6864) | "Negligenciar causas orgânicas" e "segunda opinião" não vêm desta referência |

## Reprovados (8): precisam de decisão do Dr.

| Post | Motivo |
|---|---|
| li-2027-01-04 | Sem referência. Texto sobre o processo de auditoria, sem dado clínico |
| li-2027-01-08 | Referência NR-1 sem PMID nem DOI e cortada no texto. A afirmação do "ensaio clínico" (treinamento de gestores reduziu afastamentos) não tem referência |
| li-2027-01-13 | Duplicata: texto idêntico ao li-2027-01-11 |
| li-2027-01-15 | WHO 2022 sem PMID nem DOI; descrição do PAE não conferida na fonte oficial |
| li-2027-01-20 | Fournier 2010 confere, mas não sustenta "duas a seis semanas" até o efeito nem "seis a 12 meses" após a remissão |
| li-2027-01-22 | Sem referência. Texto de reflexão, sem dado clínico |
| li-2027-01-25 | Luoma 2002 confere, mas "a maioria passou por um serviço nos meses anteriores" não confere: 45% no mês anterior, cerca de três em cada quatro no ano. "Preditor isolado mais forte" não vem desta referência |
| li-2027-01-27 | Kim & von dem Knesebeck não encontrada no PubMed pelo título; referência cortada no texto; a afirmação principal (boas práticas da conversa) não é sustentada |

## Cobertura dos próximos 14 dias (29/10 a 12/11)

- Textos novos aprovados que caem nesse período: **0**.
- Já agendados no LinkedIn: 30/10, 02/11, 04/11, 09/11 e 11/11 (5 textos).
- **06/11 não tem texto**: só o carrossel `li-2026-11-06-carrossel` (manual).
- Os textos agendados seguem até 28/12. Os 6 aprovados começam em 30/12.
- Com os 8 reprovados, ficam vagas em 04/01, 08/01, 13/01, 15/01, 20/01, 22/01, 25/01 e 27/01 (decisão do Dr.: trocar, reaproveitar ou deixar).

## Como aplicar

`node scripts/linkedin/conferenciaReferencias.js` (dry-run) e, no domingo, logo depois da restauração da fila-manual: `node scripts/linkedin/conferenciaReferencias.js --aplicar`. O backup dos itens afetados vai para `.tmp/backup-conferencia-<data>.json` antes de gravar, e a conferência roda depois.
