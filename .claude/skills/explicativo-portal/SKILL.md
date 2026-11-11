---
name: explicativo-portal
description: Vídeo explicativo do Portal (artigo que já está publicado, em formato de vídeo longo ou curto). Narrador, nunca apresentador. Público adulto. Lê docs/DESIGN.md.
---

# Vídeo explicativo do Portal

Use quando o Dr. pedir um vídeo a partir de um artigo JÁ publicado e aprovado (nunca de texto em revisão).

## Antes de começar
1. Leia `docs/DESIGN.md` (seções 1, 2, 5.2, 6, 7 e 8). Use só os tokens de `docs/tokens.json`.
2. Confirme no banco (leitura) que o artigo está publicado e que a revisão médica está aprovada (`revisao:aprovar`). Sem isso, pare.
3. Texto de origem: o texto aprovado, sem reescrever o sentido. Para a narração, use o `textoParaNarracao` do artigo.

## Regras fixas (todo vídeo)
- Público adulto. Na descrição e na primeira cartela: "Não é conteúdo para crianças."
- Narrador, nunca apresentador. Sem rosto e sem voz do Dr. Antônio. Sem avatar.
- Narração: Kokoro local para vídeos novos (ver o relatório de licença das vozes pt-BR antes de ir ao ar). Edge-TTS só para narrações antigas dos artigos.
- Sem música por IA, sem anúncio de produto, sem gerador pago de imagem ou vídeo.
- Mixagem da narração em −14 LUFS (medir com ffmpeg `ebur128`; tolerância de ±1 LU).
- Legenda SRT junto do vídeo.
- Crédito da marca na fala: "Este foi um conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito."
- Aviso de IA (Resolução CFM 2.454/2026): versão curta falada + crédito; versão completa na cartela final de 8 s e na descrição.
- Cartela final de 8 s com a assinatura de 5 linhas (`IDENTIFICACAO_COMPLETA`, `backend/lib/conformidadeCfm.js`), com "Dr. Antônio Felipe" com acento, e "Em crise: CVV 188 · SAMU 192".
- Orientação geral: "Respeite sempre os protocolos do hospital, do Pronto Atendimento e da rede de saúde da sua cidade" quando houver conduta, dose ou fluxo.
- Linguagem centrada na pessoa ("pessoa com depressão"). Sem promessa de cura. Sem oferta de consulta.
- OMS 2023 para suicídio e autolesão (sem método, sem local).

## Produção
1. Roteiro: uma frase por tela; no máximo 25 palavras por tela de texto.
2. Narração: `tts` local, gravar `narracao.wav`, medir LUFS, registrar a duração.
3. Composição: Hyperframes (ver `RELATORIO.md` do piloto para a recomendação atual). Cenas com `data-start` e `data-duration` derivadas da narração.
4. Render MP4 1920×1080, 30 fps.
5. Checagem: `npx hyperframes lint` sem erro; medir LUFS do áudio final; conferir legendas contra a narração.
6. Pacote em `.tmp/<tema>-<data>/`. Nada é publicado: publicação depende de OK do Dr. e dos freios do YouTube.

## Não fazer
- Não apresentar o vídeo como consulta, orientação individual ou diagnóstico.
- Não usar imagem de pessoa gerada por IA.
- Não reaproveitar textos de revisão pendente.
