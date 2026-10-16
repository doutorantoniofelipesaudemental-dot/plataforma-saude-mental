# Blob — inventário de órfãos (16/10/2026, somente leitura)

GET /api/admin/blob-narracoes em produção: 1212 blobs, 1017 MB; 617 narrações (676 MB); **288 órfãs (314 MB)**; nada apagado.
Órfã = `artigos/<slug>/narracao-<hash12>.mp3` que nenhum documento referencia em `narracao.url` ou `audioNarracaoUrl`.
Exemplos: abstinencia-alcoolica-protocolo, acidente-trabalho-trauma-psicologico, adocao-saude-mental-filho, adolescencia-mudancas-humor, adolescente-corpo-mudanca-aceitacao.

Pendente: a lista completa (o endpoint devolve só 5 exemplos e o `.env` local não tem BLOB_READ_WRITE_TOKEN). Também falta confirmar se alguma órfã é áudio antigo que o CLAUDE.md manda preservar (§D liberado: "NÃO apagar o arquivo de áudio antigo").
Textos agendados não têm arquivo no Blob (MP3 só local até publicar), então não correm risco na limpeza.
