# Como revisar — sábado 07/11/2026

Total: 120 textos, ~511 min de leitura (sem contar a pausa).

## Ordem sugerida
1. G1 — agendados até 15/11 (urgentes) — 13 textos, ~66 min
2. G2 — fora da agenda (Nível 1) — 26 textos, ~98 min
3. G3 — agendados após 15/11 — 24 textos, ~107 min
4. G4 — já publicados (revisão posterior) — 57 textos, ~240 min

1. Comece pelo **ALERTA** do `INDICE.md`: os 3 primeiros textos do G1 foram retirados da agenda em 04/11 até a revisão; reagendar após aprovação.
2. Leia um texto por arquivo `NN-slug.md`. Os medicamentos e as doses aparecem em **negrito**.
3. Em cada arquivo, marque uma opção no final:
   - `[x] Aprovo`: publica como está.
   - `[x] Aprovo com ajuste: ...`: escreva o ajuste. Nada muda sem a sua aprovação expressa.
   - `[x] Não publicar`: fica fora.
4. Para a versão em celular: `CADERNO-SABADO-20261107.pdf` tem todos os textos na ordem do índice.

## Como aprovar (depois que você marcar)
O registro de aprovação não é feito agora. Depois da sua marcação, o registro é feito por `npm run revisao:aprovar -- <slug>` (hash do texto atual), e o texto recebe o selo "Revisado pelo Dr. Antônio Felipe em DD/MM/AAAA". Um texto alterado depois da aprovação perde o selo.

## Limites
- Esta pasta não altera agenda, texto ou banco.
- Medicamento e dose aparecem como estão no texto publicado ou agendado; a leitura e a decisão são suas.