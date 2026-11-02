# Revisão dos 3 episódios de estreia do podcast (30/10/2026)

Base: `origin/main` em 834f47b. Proposta: `.tmp/podcast-proposta-3-episodios.md`. Nada foi aprovado, publicado ou mesclado. `revisao:aprovar` não foi rodado.

## Feed #200 (branch `fix/podcast-revisao-20261029`, lido sem publicar)

- `backend/lib/podcast.js` filtra os episódios com `R.estadoRevisao(...).valido`.
- `estadoRevisao` só é válido com `registro.status === APROVADA` e `hash` igual ao hash atual do corpo.
- `relatorios/revisoes/registro.json` tem 194 bytes e nenhuma entrada: o feed sai **vazio**, como previsto.

## Hashes do corpo (método de `scripts/revisao/revisao.js`: arquivo `.mdx` inteiro, sem `---`, trim)

Os três hashes da proposta batem com esse método (`be60bce2…`, `df320dee…`, `87692…`).

| Episódio | Hash na proposta / hoje | Situação |
|---|---|---|
| professores-saude-mental | be60bce2… (igual) | sem mudança |
| psicofarmacos-mitos-verdades | df320dee… (antes) → **cd2d0990…** (após o aviso, commit 3952905) | hash novo, aprovação ainda não existe |
| saude-mental-idoso | 876928fc… (igual) | sem mudança |

## Audio x texto x duração

- Narração no banco (`estadoNarracao`, só leitura): os 3 artigos estão em `ok`. O hash guardado em `artigo.narracao.hash` (717a76dfdc08…, 32c43b8e4561…, 1f38b268d225…) é igual ao hash do texto atual. Vinheta `vinhetaVersao 1` (= `VINHETA_VERSAO` atual). Geração em 16/10/2026.
- Blob x local: sha256 do MP3 no Blob é igual ao do arquivo local `narracoes-geradas/<slug>.mp3` nos 3 casos. Nenhuma versão antiga; nada foi regerado.
- ffprobe (áudio realmente servido): professores 379,8 s; psicofármacos 350,3 s; idoso 357,5 s.

**Por que a proposta diz 323 / 333 / 319 s:** é a estimativa do feed, `duracaoSegundos = caracteres / 15` (`backend/lib/podcast.js`, linha 19). 4840/15 = 322,7; 4989/15 = 332,6; 4787/15 = 319,1. Não é duração de áudio. A diferença tem duas causas: (a) a fórmula usa 15 caracteres/s, enquanto o TTS real fica perto de 12,7 a 14,2; (b) a vinheta de crédito (16/10) acrescenta ao MP3 final: 33,6 s (professores e idoso) e 21,3 s (psicofármacos). Sem vinheta, o ffprobe do base dá 346,2 / 329,0 / 324,0 s.
Consequência: o `itunes:duration` do feed sairia errado. Correção recomendada (decisão 3 abaixo).

## Números (fonte conferida no PubMed, abstract)

| # | Dado no texto | Fonte | Resultado | Trecho da fonte / observação |
|---|---|---|---|---|
| 1 | "cerca de metade dos professores apresentava sinais de burnout" (professores, ref. 2) | Ozamiz-Etxebarria 2023, PMID 36981775 | **Confere, com ressalva** | "pooled prevalence of burnout among teachers was 52% (95% CI 33-71%)", 9 estudos, "significant heterogeneity". Sugestão: "cerca de metade (52%, em 9 estudos com grande variação)". |
| 2 | "burnout em 25% a 74%", "ansiedade em 38% a 41%", "depressão em 4% a 77%" (professores, ref. 1) | Agyapong 2022, PMID 36078422 | **Confere** | "When only clinically meaningful (moderate to severe) ... burnout ranged from 25.12% to 74%, ... anxiety ranged from 38% to 41.2% and depression ranged from 4% to 77%". O texto já diz "quadros moderados a graves". |
| 3 | "reduz em cerca de 70% a chance de recaída" (psicofármacos, ref. 2) | Geddes 2003, PMID 12606176 | **Precisa de contexto** | "reduced the odds of relapse by 70%"; recaída 41% no placebo x 18% no tratamento ativo. 70% é redução de **odds** (chance), não de risco relativo (que é ~56%). Sugestão: "reduz em cerca de 70% as chances de recaída (medida estatística); na prática, a recaída caiu de cerca de 41% para 18% em 12 meses na maioria dos estudos". |
| 4 | "uma grande meta-análise com 21 antidepressivos confirmou que todos foram mais eficazes que o placebo" (ref. 3) | Cipriani 2018, PMID 29477251 | **Confere** | "all antidepressants were more effective than placebo" (522 estudos, 116 477 participantes; adultos com depressão maior aguda). Sem mudança necessária. |
| 5 | "o benefício tende a ser maior nos quadros mais graves" (ref. 4) | Fournier 2010, PMID 20051569 | **Confere, mas incompleto** | "The magnitude of benefit ... increases with severity ... may be minimal or nonexistent, on average, in patients with mild or moderate symptoms". Sugestão: acrescentar "e pode ser pequeno ou inexistente em quadros leves ou moderados". |
| 6 | "sintomas de retirada ... mais frequentes do que se pensava" (ref. 1) | Davies & Read 2018/2019, PMID 30292574 | **Confere (qualitativo)** | Incidência 27% a 86% em 14 estudos, média ponderada 56%. Não citar o número sem a ressalva de heterogeneidade. |
| 7 | "Isolamento social e solidão aumentam em cerca de 26% a 32% o risco de morte" (idoso, ref. 2) | Holt-Lunstad 2015, PMID 25910392 | **Precisa de contexto** | Odds ratio ajustado: isolamento 1,29; solidão 1,26; morar sozinho 1,32 ("29%, 26% e 32% increased likelihood of mortality"). São associações observacionais, não causa. Sugestão: "estão associados a cerca de 26% a 32% maior chance de morte (estudos observacionais, com ajuste)". |
| 8 | "psicoterapia e medicação têm eficácia comprovada em idosos com depressão" (idoso, ref. 4) | Kok & Reynolds 2017, PMID 28535241 | **Não confere como escrito** | "Major depression in older adults ... can be effectively treated with antidepressants and electroconvulsive therapy. Psychological therapies and exercise may also be effective for mild-moderate depression". Sugestão (para o Dr. decidir): "há evidência de benefício dos antidepressivos em idosos com depressão maior; a psicoterapia também pode ajudar, sobretudo nos quadros leves e moderados". |

Nenhuma alteração de texto clínico foi feita. As sugestões 3, 5, 7 e 8 aguardam OK do Dr. Antônio.

## Episódio 2: aviso de protocolos (CLAUDE.md §1.C)

- Problema: o texto trata de medicação, mas a regra automática `precisaAviso` não cobre a categoria "Pacientes & Famílias" sem doses. A página não mostrava o aviso.
- Mudança (commit `3952905`, PR desta branch): parágrafo com o aviso padrão, antes de "Referências", no `.mdx`. A página não duplica o aviso automático, porque `temAviso` passa a ser verdadeiro.
- Narração: **não regerada**. A narração é feita a partir do texto guardado no banco (Mongo), que não muda neste PR. Hash da narração igual (`32c43b8e4561`), sem custo de Edge-TTS. Se o Dr. Antônio aprovar o mesmo parágrafo no texto do banco, aí a narração precisa ser regerada (`npm run narrar -- --slugs=psicofarmacos-mitos-verdades --enviar`) e o hash conferido.
- Backup: não houve gravação no banco nem no Blob. Só o `.mdx` mudou, versionado no git.
- Gap parecido, não tratado (fora do pedido): `psicofarmacos-mitos-culturais` (categoria Geral, publicado) tem medicação e não tem o aviso no corpo. `psicofarmacos-aps-medicos` (Médicos & Enfermeiros) já recebe o aviso automático.

## Episódio alternativo proposto no lugar de psicofarmacos-mitos-verdades (NÃO aprovado)

- Proposta principal: `imagem-corporal-o-que-e` (Geral, publicado, narração `ok`, 4 220 caracteres, 21 referências). Tema de educação, sem conduta nem dose.
- Alternativa: `redes-sociais-criancas` (Pais & Famílias, publicado, narração `ok`, 5 141 caracteres, 19 referências).
- Falta antes de qualquer aprovação: conferir os números desses textos (mesma rotina das tabelas acima) e checar a duração real após a narração estar `ok` (já está).

## Comandos de aprovação (o Dr. roda; nada foi rodado)

```
npm run revisao:aprovar -- professores-saude-mental
npm run revisao:aprovar -- saude-mental-idoso
```

Não aprovar `psicofarmacos-mitos-verdades` antes da decisão sobre o texto (números 3 e 8 e o aviso). O hash atual é cd2d0990…; qualquer mudança no texto muda o hash.

## Decisões para o Dr. Antônio

1. Redação dos números 3, 5, 7 e 8 (acima) e o texto de "eficácia comprovada em idosos". Aprovar as sugestões ou pedir outra.
2. Aviso no texto do banco do `psicofarmacos-mitos-verdades` e no `psicofarmacos-mitos-culturais`: se sim, a narração desses artigos é regerada (custo Edge-TTS zero) e o hash conferido.
3. Duração no feed: trocar `caracteres / 15` pela duração medida do MP3 (ffprobe) antes de publicar o feed. Sem isso, o `itunes:duration` fica errado nos 3 episódios.
