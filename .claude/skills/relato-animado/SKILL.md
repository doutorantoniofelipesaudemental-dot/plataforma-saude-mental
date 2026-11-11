---
name: relato-animado
description: Vídeo de relato da prática em animação 2D não realista (ficção), com a nota de ficção na abertura e as regras OMS 2023. Lê docs/DESIGN.md.
---

# Relato animado (2D não realista)

Transforma um relato já publicado (Relatos da Prática, ficção composta) em vídeo. Não é relato real.

## Antes de começar
1. Leia `docs/DESIGN.md` (seções 5.1, 6, 7 e 8).
2. O relato precisa estar publicado e aprovado. Sem isso, pare.
3. Texto de origem: o relato como está. Não reescrever o desfecho. Se houver suicídio ou autolesão, a cena segue a OMS 2023 (sem método, sem local, sem detalhe do ato).

## Nota de ficção (obrigatória, na abertura)
Texto exato de `backend/lib/relatos.js` (CEM art. 75), falado e escrito na primeira tela. Mostrada inteira antes de qualquer cena.

## Estilo visual
- Animação 2D não realista: formas simples, paleta do DESIGN.md (areia, verde). Sem rostos detalhados; personagens sem traços que os identifiquem.
- Sem desenho infantil, sem personagem fofo, sem música infantil.
- Sem cena de sofrimento explícito. Sem ilustração de pessoa segurando a cabeça ou chorando (padrão proibido).

## Regras OMS 2023 (suicídio e autolesão)
- Nunca mostrar método, instrumento, local ou detalhe do ato.
- Nunca usar "cometeu suicídio": usar "morreu por suicídio" ou "tirou a própria vida" só quando o texto original já usar.
- A cena termina com CVV 188 · SAMU 192 e um caminho de cuidado (UBS, CAPS).

## Regras fixas
- Nome sempre "Dr. Antônio Felipe" (com acento), na fala, na tela e na descrição.
- Narrador. Sem rosto e sem voz do Dr. Antônio.
- Narração Kokoro (vídeos novos), −14 LUFS, legenda SRT.
- Cartela final de 8 s: assinatura de 5 linhas (`IDENTIFICACAO_COMPLETA`, `backend/lib/conformidadeCfm.js`), aviso CFM 2.454/2026, "Em crise: CVV 188 · SAMU 192".
- Público adulto. Linguagem centrada na pessoa.

## Não fazer
- Não apresentar o relato como caso real.
- Não usar foto de pessoa gerada por IA como "personagem real".
- Não reescrever o relato para mudar o desfecho clínico.
