---
name: transtornos-clinico
description: Vídeo de transtorno mental no formato conceito, diagnóstico e conduta (a série "Entendendo os transtornos"). Cada dado numérico na tela tem fonte nomeada. Lê docs/DESIGN.md.
---

# Vídeo clínico de transtorno (conceito, diagnóstico e conduta)

Cobre um transtorno por vídeo. Regra editorial: "Transtornos Mentais" = conceito, diagnóstico e conduta; os outros temas = psicoeducação e cuidados (ordem de 09/11/2026).

## Antes de começar
1. Leia `docs/DESIGN.md` (seções 1, 2, 5.2, 6, 7 e 8).
2. O artigo de origem precisa estar publicado e aprovado. Sem isso, pare.
3. Confira cada número e cada afirmação de conduta com a referência do próprio artigo. Não adicione dado novo.

## Estrutura (ordem fixa)
1. Abertura: nome do transtorno e a frase "Você está ouvindo um conteúdo do Portal..." (crédito).
2. Conceito: o que é, em linguagem simples.
3. Diagnóstico: critérios de forma geral. Sem auto-diagnóstico. "Para saber mais" aponta para o artigo do tema.
4. Conduta: tratamento de primeira escolha, com "orientação geral" e o aviso dos protocolos locais.
5. Quando procurar ajuda: UBS, CAPS, SAMU 192, CVV 188.
6. Cartela final de 8 s: assinatura de 5 linhas (`IDENTIFICACAO_COMPLETA`, `backend/lib/conformidadeCfm.js`), aviso CFM 2.454/2026, "Em crise: CVV 188 · SAMU 192".

## Rótulos e dados na tela
- Rótulos permitidos: "Sinal de alerta", "Dado", "Passo", "Para refletir".
- Todo "Dado" traz a fonte na própria tela: autor e ano (ex.: "Martin et al., 2013"). Sem fonte nomeada, o rótulo "Dado" não entra.
- Número com mais de 2 anos sai com a data na tela.

## Regras fixas
- Nome sempre "Dr. Antônio Felipe" (com acento), na fala, na tela e na descrição.
- Público adulto. Narrador, nunca apresentador. Sem avatar e sem voz ou rosto do Dr.
- Narração Kokoro (vídeos novos). −14 LUFS. Legenda SRT.
- Linguagem centrada na pessoa. Sem estigma, sem culpa, sem promessa de cura.
- Suicídio e autolesão: OMS 2023, sem método e sem local; CVV 188 · SAMU 192.
- Aviso de IA: falado curto + crédito; completo na cartela e na descrição.

## Não fazer
- Não dar dose ou esquema de medicação sem a frase de protocolo local.
- Não prometer resultado de tratamento.
- Não chamar o vídeo de consulta.
