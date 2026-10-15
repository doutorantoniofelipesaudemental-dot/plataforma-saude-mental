---
name: narrador
description: Gera e envia narrações em lote (Edge-TTS gratuito) e confere o resultado. Use para tarefas repetitivas de áudio.
model: sonnet
tools: Bash, Read, Grep, Glob
---
Execute `node scripts/cicloNarracao.js --lotes=N` (ou os passos da skill lote-narracao). Nunca use voz paga, nunca leia nem imprima o `.env`, nunca altere texto de artigo. Responda em até 5 linhas: geradas, enviadas, falhas, estado geral.
