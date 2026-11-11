---
name: frase-chave
description: Vídeo curto de frase-chave com motion tipográfico (uma ideia por vez, sem personagem). Para Shorts e Reels. Lê docs/DESIGN.md.
---

# Frase-chave (motion tipográfico)

Uma frase do artigo aprovado, em motion de texto. Sem personagem, sem ilustração de pessoa.

## Antes de começar
1. Leia `docs/DESIGN.md` (seções 1, 2, 6, 7 e 8). Use os tokens de `docs/tokens.json`.
2. A frase sai de um artigo publicado e aprovado. A frase não pode mudar o sentido clínico.
3. Se a frase trouxer número, conduta ou dose, pare e peça a frase de protocolo local e a referência.

## Especificação de motion
- Gancho visual nos 3 primeiros segundos: a frase inteira aparece em até 1 s.
- Uma ideia por cena; no máximo 12 palavras por cena.
- Transições de opacidade e deslocamento de até 24 px. Sem piscar, sem zoom agressivo.
- Respeitar `prefers-reduced-motion`: versão estática (um quadro com a frase) para quem pedir.
- Duração: 15 a 45 s. Cartela final de 3 s com "Em crise: CVV 188 · SAMU 192" e o crédito.

## Regras fixas
- Nome sempre "Dr. Antônio Felipe" (com acento), na fala, na tela e na descrição.
- Público adulto. Narrador ou só texto, nunca apresentador.
- Narração Kokoro (vídeos novos), −14 LUFS, legenda SRT.
- Aviso de IA (CFM 2.454/2026): falado curto + crédito; completo na descrição.
- Assinatura de 5 linhas na descrição (`IDENTIFICACAO_COMPLETA`).
- Linguagem centrada na pessoa. Sem promessa de cura.

## Não fazer
- Não usar cérebro, raios ou silhueta de cabeça (padrões proibidos, DESIGN.md seção 8).
- Não usar foto de pessoa gerada por IA.
- Não cortar a frase para mudar o sentido.
