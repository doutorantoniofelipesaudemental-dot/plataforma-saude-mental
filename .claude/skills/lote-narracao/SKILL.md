---
name: lote-narracao
description: Gera narrações (Edge-TTS gratuito, pt-BR-AntonioNeural), confere e envia; MP3 de textos agendados sobem antes e só tocam após a publicação.
---
Fluxo sem custo: `node scripts/cicloNarracao.js --lotes=4` (roda sozinho toda noite pelo Agendador do Windows).
- Passos manuais: `backend/scripts/proximoLoteNarracao.js --pre-gerar --n=50` → `backend/tools/narrar-artigos.js --slugs=… --provedor=edge --incluir-agendados` → `backend/scripts/enviarNarracoesPublicadas.js --agendados --enviar`.
- Proibido Azure, ElevenLabs e vozes pagas. Hash diferente = áudio não toca e o texto volta à fila.
- Não alterar texto de artigo para "ajustar" a voz (hash). Pronúncia só pelo dicionário `backend/lib/pronunciaTts.js`.
- Progresso em `relatorios/narracao-progresso.md`. Se o Edge-TTS travar, o limite de 5 min por texto o interrompe.

- Crédito de marca (16/10/2026): toda narração/vídeo cita, na fala e na tela, o "Portal de Saúde Mental Doutor Antônio Felipe Garabito" (`backend/lib/vinheta.js`; vinheta nos MP3 via `backend/tools/vinheta-narracoes.js`; hash da narração não muda; campo `vinhetaVersao`). Descrição/legenda: 1ª linha "Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito" + link. Crédito de tela discreto, nunca marca d'água.
