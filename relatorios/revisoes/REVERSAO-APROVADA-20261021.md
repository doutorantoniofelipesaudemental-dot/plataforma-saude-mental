# Reversão da aprovação médica sem registro com hash (2026-10-21)

Antes: 121 arquivo(s) de texto e 121 entrada(s) de pauta com "aprovada".
Alvo: 121 arquivo(s) de texto e 1 arquivo(s) de registro.
Modo: APLICADO (backup em backups\revisao-aprovada-20261021)
Backup verificado: 122 arquivo(s), manifesto com SHA-256.
Depois: 0 arquivo(s) de texto e 0 entrada(s) de pauta com "aprovada".

## Notas
- Escopo: frontmatter "revisaoMedica: aprovada" em CONTEUDO_INSTAGRAM (121 arquivos) e o registro de pautas (pautas.json, 121 entradas). Nenhum texto publicado no site ou no banco tinha esse campo (o modelo Artigo não tem revisaoMedica; 0 MDX com aprovada).
- 63 ocorrências a mais são frases de descrição de pacotes e LEIA-ME ("Pacote 100 ... revisaoMedica aprovada"); não são status e ficaram como estavam.
- Backup: backups/revisao-aprovada-20261021/ com manifesto de SHA-256 (antes e depois) por arquivo.
- Pendência à parte: 59 arquivos já tinham finais de linha misturados (CRLF e LF) antes desta correção; a reversão não criou nenhuma linha nova sem CR.
- Pendência: validarRascunho ainda lê "aprovada" escrito à mão no frontmatter. Deve passar a ler o registro com hash (relatorios/revisoes/registro.json).
