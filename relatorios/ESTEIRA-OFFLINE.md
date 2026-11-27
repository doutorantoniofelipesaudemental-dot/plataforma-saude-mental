# Esteira offline de pílulas (v1, 27/11/2026)

## Como usar (3 passos)
1. Crie um arquivo `.md` em `fila_producao/` com o cabeçalho abaixo e uma frase por linha.
2. Dê dois cliques em `Gerar_Videos_Portal.bat` (ou rode `python scripts/esteira/gerar_lote_offline.py`).
3. Veja `saida_pronta/<nome>/`: `video-9x16.mp4`, `video-16x9.mp4`, `descricao.txt`, `legendas.srt`, `meta.json`, `relatorio.json`. O roteiro vai para `fila_producao/concluidos/`. Nada é publicado.

## Modelo de cabeçalho
```
---
eixo: 06-habitos-estilo-vida-sono
formato: 9x16            (9x16 | 16x9 | ambos)
titulo: Título da pílula
artigo: slug-do-artigo-publicado
---
Frase 1 da narração.
Frase 2 da narração.
```
Cada frase vira uma cena (b-roll do eixo, cenários) com legenda. Números por extenso na narração; CVV e SAMU falados por extenso.

## Siglas permitidas (sem expansão)
CVV, SAMU, UBS, SUS, CAPS, NR, TOC, TCC, PMID, CRAS, PA, RQE, CRM, APS, PAP, EMDR (lista `SIGLAS` no script).

## Pré-requisitos
- Kokoro (kokoro-onnx) no venv `.tmp\piloto-video-20261110\kokoro-venv` e modelos em `.tmp\kokoro-modelo`.
- ffmpeg/ffprobe no PATH. Montador oficial: `producao-audiovisual/montador/montar.js`.
- Clipes em `assets/cartoon-higgsfield/<eixo>/cenarios/` (`*-916.mp4` / `*-169.mp4`).

## O que a v1 NÃO faz (pendências)
- Trilha FluidSynth: acorde sintético por código.
- Personagens (`personagens/`): usa só b-rolls de cenário.
- Fechamento sobre clipe calmo: usa o cartão final de 6 s.
- Spotify (mp3 −16 LUFS): não gerado.
- Checagem Whisper texto × áudio: não rodada; legenda = texto do roteiro com tempos do plano.
- Teste de RAM (psutil) e pausa entre itens: não implementados.

## Teste (27/11/2026)
- `fila_producao/exemplo-pilula.md` é modelo (não é processado).
- Teste `teste-pilula-sono` (eixo 06, 9x16): GERADO; checar-peca APROVADO; −14,2 LUFS; TP −2,0 dBTP.
- Log: `relatorios/logs/esteira-teste-20261127.log` (na pasta principal).
- O cartão final só sai inteiro com o PR `fix/montador-cartao-linha1` (1ª linha a 40 pt) mergeado.
