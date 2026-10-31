# Revisão dos 3 episódios de estreia do podcast (30/10/2026)

Base: `origin/main` em 834f47b. Proposta: `.tmp/podcast-proposta-3-episodios.md`. Nada foi aprovado, publicado ou mesclado.

## Feed #200 (branch `fix/podcast-revisao-20261029`, lido sem publicar)

- `backend/lib/podcast.js` filtra os episódios com `R.estadoRevisao(...).valido`.
- `estadoRevisao` só é válido com `registro.status === APROVADA` e `hash` igual ao hash atual do corpo.
- `relatorios/revisoes/registro.json` tem 194 bytes e nenhuma entrada: o feed sai **vazio**, como previsto.

## Hashes do corpo (recalculados com `revisaoMedica.hashConteudo`)

Os três hashes batem com a proposta.

## Episódios

| # | Slug | Título | Duração (ffprobe) | Duração na proposta | Tamanho | sha256 do áudio | Blob | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | professores-saude-mental | Saúde mental de professores: o adoecimento silencioso de quem forma pessoas | 379,8 s (6 min 20 s) | 323 s | 2 279 324 bytes | 656cee5ac6aa4be1cc764e04a4b60d8d071cff246a369b03a4a78adebf11394a | HTTP 200 | Pronto para revisão (sem trecho de conduta) |
| 2 | psicofarmacos-mitos-verdades | Psicofármacos: mitos e verdades sobre o tratamento medicamentoso em saúde mental | 350,3 s (5 min 50 s) | 333 s | 2 102 348 bytes | 21e95d4c721b40b22484f58b380add4a7bfb767f0af40d45f4d41d7e806bb60b | HTTP 200 | Precisa de decisão clínica |
| 3 | saude-mental-idoso | Saúde mental do idoso: o que toda família precisa saber | 357,5 s (5 min 58 s) | 319 s | 2 145 692 bytes | a9f3584303bd67343352bbc4d818a51a2e16ef49cbc680ccee84502673fa8885 | HTTP 200 | Pronto para revisão (com decisão de números, ver abaixo) |

Duração: a proposta indica 5 min 19 s a 5 min 33 s. O ffprobe mede 5 min 50 s a 6 min 20 s nos três áudios. A diferença precisa ser explicada antes da aprovação (a proposta usou outra fonte ou um áudio anterior). O feed usa `duracaoSegundos` (caracteres/15), que não é a duração real.

Fonte do texto: `apps/plataforma-saude-mental/src/content/artigos/<slug>.mdx`. Os três estão publicados. Corpo sem frontmatter = hash acima.

## Trechos que exigem decisão clínica

### 2 · psicofarmacos-mitos-verdades (decisão do Dr.)

1. Trecho "O que vale perguntar ao seu médico": pergunta "O que fazer se eu esquecer uma dose, ou sentir vontade de parar?". Não dá conduta, mas trata de interrupção. Confirmar que a resposta fica só no encaminhamento ao médico.
2. "Manter o antidepressivo pelo tempo indicado após a melhora reduz em cerca de 70% a chance de recaída" e "21 antidepressivos ... todos mais eficazes que o placebo". São números que precisam da referência conferida (refs 2 e 3). Não verifiquei o conteúdo das fontes.
3. Aviso: o texto tem "não constitui orientação para iniciar, ajustar, substituir ou interromper qualquer medicação", mas **não cita** "protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais", exigido para conteúdo com medicação (CLAUDE.md §1.C). Texto já publicado: a inclusão exige OK seu (mudança em texto publicado). Não alterei.

### 1 · professores-saude-mental (sem trecho de conduta)

- "cerca de metade dos professores apresentava sinais de burnout" (meta-análise de covid-19, ref. 2): número com referência, conferir antes da aprovação.
- Sem conduta medicamentosa; o aviso final e CVV 188 · SAMU 192 estão presentes.

### 3 · saude-mental-idoso (decisão de números)

- "medicação têm eficácia comprovada em idosos com depressão" (ref. 4): afirmação forte, conferir se a referência sustenta "comprovada" para idosos.
- Sem conduta medicamentosa específica; avisos e CVV 188 · SAMU 192 presentes.

## Comandos de aprovação (o Dr. roda; nada foi rodado)

```
npm run revisao:aprovar -- professores-saude-mental
npm run revisao:aprovar -- psicofarmacos-mitos-verdades
npm run revisao:aprovar -- saude-mental-idoso
```

Se o corpo mudar depois, o hash muda e a aprovação cai.

## Pendências para o Dr.

1. Explicar a diferença de duração (proposta x ffprobe).
2. Decidir o aviso de protocolos locais no episódio 2 (texto publicado).
3. Conferir os números citados nos episódios 1, 2 e 3 contra as referências.
