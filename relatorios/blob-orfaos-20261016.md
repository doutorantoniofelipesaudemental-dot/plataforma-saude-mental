# Blob — órfãos e inventário (16/10/2026)

Plano da Vercel: **Pro** (alterado em 16–17/10/2026; `vercel api /v2/teams/<id>` → billing.plan "pro"). A cota de Blob do Pro é de uso incluído + cobrança por excedente (limite de gasto configurável no painel); não há o bloqueio duro de 1 GB do Hobby. Uso atual: ver abaixo.

## Limpeza aprovada (grupos c + d), 16/10/2026
- Antes: 1212 blobs, 1017,4 MB · narrações 617 (676 MB) · a 251 (270 MB) · b 78 (92,3 MB) · c 288 (313,7 MB) · d 0. (c)+(d) = 46,7% das narrações (≤ 50%).
- Backup da lista: `backups/blob-orfaos-20261016-*/lista-c-d.json` (288 arquivos, abre). Dry-run feito antes. Apagadas: 288. Depois: 924 blobs, 703,8 MB.
- Rollback: os MP3 apagados eram de hash antigo (texto reescrito); o áudio atual de cada texto está no grupo a/b. Se algum precisar voltar, regerar com `npm run narrar -- --slugs=<slug> --enviar`.

## Inventário após os envios com vinheta (noite de 16/10)
- 1076 blobs, 923,7 MB (outros arquivos 595: capas e imagens, ~342 MB) · narrações 481.
- a (publicados): 251 · 270,2 MB · b (agendados): 229 · 310,6 MB · c: 1 · 1,5 MB (áudio antigo do texto retitulado, apagado em seguida) · d: 0.
- Regra de ouro: nunca apagar a nem b. Amostra de 10 (6 publicados + 4 agendados de 19/10): 10/10 com MP3 HTTP 200.

## Fechamento (17/10/2026, madrugada)
- Plano Pro. Blob 1060,7 MB · narrações 533: a 251 (307 MB) · b 281 (388,5 MB) · c 1 (3,1 MB, apagado) · d 0. Capas: 475 enviadas (0 falhas); 0 textos sem capa.
- Envios com vinheta: 351 áudios em 8 lotes (50 cada), amostra de 5 por lote: vinheta v1 + HTTP 200 em todas, exceto 1 áudio truncado reprovado na conferência de duração (regerado e reenviado).
