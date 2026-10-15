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
