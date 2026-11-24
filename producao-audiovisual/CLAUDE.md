# Produção audiovisual · regras da pasta

Referência: `docs/GUIA-MESTRE-DRSM.md` (§11, §17, §19 PADRÃO VIDEOCAST v2) e o CLAUDE.md da raiz. Em conflito, vale o CLAUDE.md da raiz e, entre duas regras, a mais restritiva.

> Obs.: "relatorios/PADRAO-AUDIOVISUAL-v3.md" e "relatorios/PLANO-MESTRE-NOVA-PRODUCAO-v1.md" foram citados como salvos pelo Dr. em 24/11, mas NÃO estão no disco na sessão de 24/11 (pendente). Até alinhar, valem as regras abaixo, copiadas do guia §19 e das ordens de 24/11.

## Regras
1. **Identificação e crédito:** toda peça com o bloco de identificação de 5 linhas (`IDENTIFICACAO_COMPLETA`, `backend/lib/conformidadeCfm.js`), "Dr. Antônio Felipe" com acento, aviso de IA (Res. CFM 2.454/2026), orientação geral e "Em crise: CVV 188 · SAMU 192".
2. **Crédito de marca em áudio e vídeo:** menção na fala e na tela ao Portal de Saúde Mental Doutor Antônio Felipe Garabito (vinhetas em `backend/lib/vinheta.js`).
3. **Formato:** episódio/vídeo longo 1920×1080; Shorts e Minuto 1080×1920, zona segura de Shorts. 30 fps. Ver §19 do guia.
4. **Áudio:** narração Kokoro (Apache-2.0, local, sem custo) para vídeos novos; master −14 LUFS (YouTube) e −16 LUFS (Spotify); true peak ≤ −2 dBTP; trilha ~20 dB abaixo da voz.
5. **Legenda:** casando ≥ 95% com a fala; máximo 2 linhas × 42 caracteres.
6. **Conteúdo:** sem crise, autolesão ou violência em cena. **Crianças podem ser protagonistas conforme o roteiro** (decisão do Dr., 24/11/2026), em cenas protegidas: sem violência, crise ou risco; sem exposição do corpo; sem close em sofrimento; roteiro e quadros-chave aprovados pelo Dr. antes da geração. Sem humanos realistas (cães e gatos, cenas 2D próprias); sem rosto sem foto aprovada.
7. **Portão:** auditoria geral + tripla checagem (técnica, científica, ética e humanizada) antes de qualquer aprovação, e de novo antes de ir ao ar. Nada publica sem o portão.
8. **Animações:** Higgsfield LIBERADA pelo Dr. (decisão de 24/11/2026). Quem gera imagem e vídeo é o **Claude**, pela conexão Higgsfield (teste grátis até 27/11). O **Claude Code NÃO gera** imagem nem vídeo pago.
9. **Custos:** todo gasto, mesmo que zero, entra em `custos.csv`. Nada de recarga ou crédito extra sem ordem do Dr.

## Arquivos desta pasta
- `roteiro.schema.json`: schema do `roteiro.json` de cada vídeo.
- `custos.csv`: registro de custos (data, item, ferramenta, valor, quem autorizou).
- Pastas de vídeo: `producao-audiovisual/<serie>/<slug>/roteiro.json`.
