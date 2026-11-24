# Produção audiovisual · regras da pasta

Referências: `relatorios/PADRAO-AUDIOVISUAL-v3.md` (estrutura, regras, fluxo, formatos), `relatorios/PLANO-MESTRE-NOVA-PRODUCAO-v1.md` (calendário, reinício, ordem) e `docs/GUIA-MESTRE-DRSM.md` (§7, §19 PADRÃO VIDEOCAST v2). Em conflito, vale o CLAUDE.md da raiz e, entre duas regras, a mais restritiva.

## Estrutura (PADRÃO-AUDIOVISUAL-v3, seção 1)
```
producao-audiovisual/
  CLAUDE.md                 ← este arquivo
  roteiro.schema.json       ← schema de roteiros/<slug>.json
  custos.csv                ← cada geração paga: data, peça, créditos, US$, autorizado_por
  personagens/              ← ficha fixa + imagens aprovadas (Clara, Rafael, Davi, Bia, Vó Zezé, Pipoca, Nina)
  roteiros/<slug>.json      ← um por peça, gerado a partir do artigo PUBLICADO
  audio/<slug>/             ← narração por cena (Kokoro) + música
  cenas/<slug>/             ← clipes Higgsfield (animação) ou renders (infográfico)
  out/<slug>/               ← .mp4/.png finais + AUDITORIA.md, para revisão do Dr.
```

## Regras obrigatórias (PADRÃO-AUDIOVISUAL-v3, seção 2)
1. **Fonte:** só artigos publicados no portal ou pesquisa com fonte. Fiel ao texto; nada inventado.
2. **Tom:** acolhedor, técnico, psicoeducativo. Sem humor apelativo, sensacionalismo, estigma ou promessa de cura.
3. **Violência:** zero, verbal ou física.
4. **Ciência:** todo dado clínico com PMID conferido na PubMed. Estudo observacional é apresentado como "associação", nunca como causa. Nada de nomes de remédios nem doses.
5. **CFM 2.336/2023 e 2.454/2026:** identificação de 5 linhas; nunca "psiquiatra" como título; sem consulta particular; a UBS como porta de entrada.
6. **Safe messaging:** "Em crise: CVV 188 · SAMU 192" sempre na cartela; orientação geral com a nota de protocolos locais (PA e rede).
7. **IA:** "Imagens e vozes criadas com IA. Personagens ilustrativos." na cartela; marcar "conteúdo sintético" no YouTube.
8. **Personagens:** só os da ficha em `personagens/`, originais. **Crianças podem ser protagonistas conforme o roteiro** (decisão do Dr., 24/11/2026), em cenas protegidas: sem violência, crise ou risco; sem exposição do corpo; sem close em sofrimento; roteiro e quadros-chave aprovados pelo Dr. antes da geração. Sem humanos realistas fora da ficha.
9. **Gasto:** teto por peça e por mês, definido pelo Dr. **Pendente** (não definido). Passou do teto, para e avisa. Nenhuma recarga ou crédito extra sem ordem do Dr.
10. **Publicação:** nada vai para a fila sem aprovação do Dr. Tudo passa antes pela auditoria geral e pela tripla checagem (técnica, científica, ética e humanizada), e de novo antes de ir ao ar.

## Fluxo único: artigo → peça (seção 3)
1. Artigo publicado → `roteiros/<slug>.json`, por cena (campos do `roteiro.schema.json`).
2. Checagem do roteiro (portões + tripla checagem). Só segue se passar.
3. Áudio: Kokoro por cena → Whisper confere → duração real → 30 fps.
4. Imagem: animação pela Higgsfield (gerada pelo Claude, com as referências da ficha); infográfico por HyperFrames ou Remotion.
5. Montagem (FFmpeg): legenda = fala (palavra a palavra, zona segura); música −12 dB com ducking; masters −14 LUFS (YouTube) e −16 LUFS (Spotify); true peak ≤ −2 dBTP.
6. `AUDITORIA.md` automática e quadro de miniaturas em `out/`. O Dr. aprova. Só então entra na fila, com `--slugs`.

## Ferramentas (decisões do Dr.)
- **Higgsfield LIBERADA** (24/11/2026): quem gera imagem e vídeo é o **Claude**, pela conexão Higgsfield (teste grátis até 27/11). O **Claude Code NÃO gera** imagem nem vídeo pago.
- **Voz:** Kokoro (Apache-2.0, local, sem custo) para vídeos novos.
- **Música:** síntese própria por código (sem IA de música). FluidSynth e soundfont não estão instalados; sem instalar sem aprovação.
- **Proibidos:** Dreamina, ElevenLabs, IA de música, Wav2Lip, SadTalker, LivePortrait.
