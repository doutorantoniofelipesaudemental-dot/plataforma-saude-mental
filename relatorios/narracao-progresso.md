# Narração — controle de progresso (Edge-TTS gratuito, voz pt-BR-AntonioNeural)

Custo: zero (sem Azure, sem ElevenLabs). Ordem: publicados mais lidos primeiro, depois agendados na ordem do calendário.
Cada áudio só entra depois de conferido (duração, decodificação, tamanho, estado "ok" no banco).
Em cada lote: amostra de 5 áudios transcritos (faster-whisper) para checar siglas e números.

Início da sessão: 51 ok · 200 desatualizadas · 475 ausentes · faltam 675.

## Lote 1 — 15/10/2026
- 50 enviados e "ok" · duração 144–345 s · razão duração/esperado 0,89–1,06
- Estado geral: faltam 625
- Amostra: CVV, 188, 192 e anos reconhecidos nos 5 áudios. "SAMU" e "CAPS" nem sempre reconhecidos pelo transcritor (versão "base"): CAPS soa como "capis". Limitação possível do transcritor; a voz neural não pode ser alterada sem mudar o texto/hash.
- Obs.: "Antônio" não aparece no corpo narrado (a identificação do médico fica fora da narração).
- PAROU no lote 2: falha na geração (ver scratchpad/gerar.log)
- (nota: o laço parou porque o Edge-TTS travou 2 h em 1 texto; o antigo 'PAROU' acima foi tratado)

## Lote 2 — 15/10/2026 (sem dicionário de pronúncia, gerado antes da aprovação)
- 49 enviados e "ok" (1 falha de geração: benzodiazepinicos-urgencia, refeita no lote seguinte) · duração 131–225 s · razão 0,89–1,04
- Estado geral: {"total":726,"estados":{"ok":150,"desatualizada":101,"ausente":475},"faltam":576}
- Amostra:
  - violencia-domestica-impacto-criancas | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2017FALHA
  - laudo-psiquiatrico-previdenciario | conferidos: CRMok, RQEok, CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2002ok
  - ansiedade-generalizada-aps | conferidos: APSok, CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026FALHA
  - automutilacao-adolescentes-consulta | conferidos: CVVok, SAMUFALHA, CAPSok, 188ok, 192ok, 2019ok
  - bipolar-diferenciando-depressao | conferidos: APSok, CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 3 — 15/10/2026 07:03 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 50 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":200,"desatualizada":51,"ausente":475},"faltam":526}
- Amostra (transcrição de 5 áudios):
  - adolescencia-mudancas-humor | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2025FALHA
  - prevencao-suicidio-ambiente-trabalho | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - assedio-moral-prevencao-empresa | conferidos: CVVok, SAMUok, 188ok, 192ok, 2022FALHA
  - gestacao-maternidade-trabalho | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - linguagem-inclusiva-saude-mental-empresa | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 4 — 15/10/2026 07:19 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 50 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - quando-procurar-psiquiatra-psicologo | conferidos: CVVok, SAMUok, CAPSok, SUSok, 188ok, 192ok, 2026ok
  - solidao-diferenca-estar-sozinho | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - adolescente-experimentacao-alcool-conversa | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2026ok
  - depressao-sinais-alem-tristeza | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - terapia-online-funciona | conferidos: CRMok, CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2022ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 5 — 15/10/2026 07:19 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 6 — 15/10/2026 07:19 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 7 — 15/10/2026 07:19 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 8 — 15/10/2026 07:19 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 9 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 10 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 11 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 12 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":250,"desatualizada":1,"ausente":475},"faltam":476}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 13 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 14 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 15 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 16 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 17 — 15/10/2026 07:20 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 18 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 19 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 20 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 21 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 22 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 23 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 24 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 25 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 26 — 15/10/2026 07:21 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 27 — 15/10/2026 07:22 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 28 — 15/10/2026 07:22 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 29 — 15/10/2026 07:22 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK

## Lote 30 — 15/10/2026 07:22 (pronúncia ativa)
- ENVIAR · aprovados na conferência: 0 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":246,"desatualizada":5,"ausente":475},"faltam":480}
- Amostra (transcrição de 5 áudios):
  - AMOSTRA OK
- FIM do laço em 15/10/2026 07:22
