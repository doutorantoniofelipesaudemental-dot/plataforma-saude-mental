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

## Lote 6 — 15/10/2026 08:11 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":50}
- Amostra (transcrição de 5 áudios):
  - transtorno-bipolar-na-aps-rastreio-e-manejo-intercrises | conferidos: Ant�niook, APSok, CVVFALHA, SAMUok, 188FALHA, 192ok, 2016ok
  - insonia-refrataria-na-atencao-primaria-investigacao-e-condut | conferidos: Ant�niook, APSok, CVVFALHA, SAMUFALHA, 188ok, 192ok, 2016ok
  - catatonia-na-emergencia-medica-reconhecimento-e-manejo-inici | conferidos: Ant�niook, CVVFALHA, SAMUok, 188FALHA, 192ok, 2012ok
  - primeiro-atendimento-em-psiquiatria-na-ubs-guia-pratico-para | conferidos: Ant�niook, APSok, CVVFALHA, SAMUok, CAPSFALHA, 188ok, 192ok, 2012ok
  - transtorno-obsessivo-compulsivo-na-aps-reconhecimento-e-mane | conferidos: Ant�niook, APSok, CVVFALHA, SAMUok, 188ok, 192ok, 2009ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 7 — 15/10/2026 08:37 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":100}
- Amostra (transcrição de 5 áudios):
  - insatisfacao-corporal-brasil-numeros | conferidos: 2006ok, 2019ok, 2024ok
  - assedio-sexual-trabalho-prevencao | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2022FALHA
  - canetas-emagrecedoras-saude-mental-humor | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2023ok
  - saude-mental-indigena-jovens | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2022ok
  - filho-aposta-como-conversar | conferidos: CVVok, SAMUok, CAPSok, 188ok, 192ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 8 — 15/10/2026 08:58 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":150}
- Amostra (transcrição de 5 áudios):
  - paliativos-historia-cicely-saunders | conferidos: SUSok, 1950ok, 1960ok, 1967ok
  - violencia-domestica-saude-mental | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2021ok
  - caneta-sem-indicacao-magreza | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2025ok
  - abuso-sexual-infantil-proteger | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2026ok
  - relato-violencia-a-festa-da-turma | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2013FALHA
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 9 — 15/10/2026 09:17 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":200}
- Amostra (transcrição de 5 áudios):
  - paliativos-normas-brasil | conferidos: CVVok, SAMUok, CAPSFALHA, SUSok, 188ok, 192ok, 2006ok
  - bullying-sinais-o-que-fazer | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2015ok
  - pensamentos-suicidas-pedir-ajuda | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2019FALHA
  - paliativos-necessidade-crescente | conferidos: 2016ok, 2017ok, 2019ok
  - ansiedade-na-gestacao | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 10 — 15/10/2026 09:35 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":250}
- Amostra (transcrição de 5 áudios):
  - brasil-campeao-cirurgias-plasticas | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2020ok
  - eventos-climaticos-saude-mental | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - deficiencia-adquirida-reconstruir | conferidos: CVVok, SAMUFALHA, CAPSok, 188ok, 192ok, 2026ok
  - migrante-endividado-apostas | conferidos: CVVok, SAMUFALHA, CAPSok, 188ok, 192ok, 2026FALHA
  - paliativos-aps-medicina-familia | conferidos: APSok, SUSFALHA, 2018ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Lote 11 — 15/10/2026 09:55 (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)
- CONFERIR · aprovados na conferência: 50 · reprovados: 0 · enviados e "ok" no banco: 0 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":251,"ausente":475},"faltam":475,"agendadosComMp3PreGerado":300}
- Amostra (transcrição de 5 áudios):
  - socorristas-trauma-estresse | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2026ok
  - luto-por-suicidio | conferidos: CVVok, SAMUok, CAPSok, 188ok, 192ok, 2026FALHA
  - luto-prolongado-cid11 | conferidos: CVVok, SAMUok, CAPSFALHA, 188ok, 192ok, 2026ok
  - autolesao-guia-pais-professores | conferidos: CVVok, SAMUFALHA, CAPSFALHA, 188ok, 192ok, 2026ok
  - paliativos-empresas-trabalhador-cuidador | conferidos: CVVok, SAMUFALHA, CAPSFALHA, SUSok, 188ok, 192ok, 2026ok
  - AMOSTRA COM DIVERG�NCIAS (ver FALHA; pode ser limita��o do transcritor)

## Ciclo automático — 15/10/2026, 17:20:59
- Pré-geradas nesta execução: 0 · falhas de geração: 0
- ENVIAR · aprovados na conferência: 198 · reprovados: 1 · enviados e "ok" no banco: 0 · falhas de envio: 198
- Estado geral: {"total":726,"estados":{"ok":329,"ausente":397},"faltam":397,"agendadosComMp3PreGerado":227}

## Envio com vinheta — 16/10/2026 (noite)
- Limpeza do Blob (grupos c+d, aprovada): 288 órfãs apagadas (313,7 MB); lista em `backups/blob-orfaos-*/lista-c-d.json`. Blob: 1017,4 → 703,8 MB.
- Lotes 1–3: 150 áudios NOVOS (agendados, na ordem da data; inclui `imagem-corporal-o-que-e`, texto de 19/10 08:00) enviados com vinheta v1: 150/150 ok, 0 falhas. Amostra de 5+ por lote: vinheta v1 no banco, HTTP 200, duração/razão 1,02–1,29, volume médio ≈ −17 dB.
- Blob agora: 915,8 MB de 1024 (grupos: a 251 = 270 MB · b 228 = 304 MB · c/d 0).
- PARADO por cota: faltam 52 novos (~76 MB) e 328 regravações com vinheta dos já enviados (~+48 MB de crescimento, mesmo caminho) → não cabem em 108 MB livres. `DrSM-Narracao-Noite` DESATIVADA para não encher o Blob sozinha. Depende de decisão do Dr. Antônio (liberar espaço/plano maior/outro destino).

## Fechamento do envio com vinheta — 17/10/2026
- 532/726 textos com áudio v1 no Blob (251 publicados + 281 agendados); lotes 4–8: 0 reprovados além de 1 truncado (relato-pilula-da-concentracao, regerado). Faltam 194 (sem MP3 local): ciclo noturno reativado.

## Ciclo automático — 17/10/2026, 00:01:44
- Pré-geradas nesta execução: 10 · falhas de geração: 0
- ENVIAR · publicados + agendados sem áudio "ok": 1 · com MP3 pronto e selo válido: 0 · MP3 de texto editado depois (regerar): 0 · sem MP3 pré-gerado: 1
- Estado geral: {"total":726,"estados":{"ok":697,"ausente":29},"faltam":29,"agendadosComMp3PreGerado":28}

## Ciclo automático — 17/10/2026, 05:46:04
- Pré-geradas nesta execução: 0 · falhas de geração: 0
- ENVIAR · aprovados na conferência: 5 · reprovados: 0 · enviados e "ok" no banco: 5 · falhas de envio: 0
- Estado geral: {"total":726,"estados":{"ok":724,"ausente":2},"faltam":2,"agendadosComMp3PreGerado":1}

## Ciclo automático — 17/10/2026, 22:03:35
- Pré-geradas nesta execução: 2 · falhas de geração: 3
- ENVIAR · publicados + agendados sem áudio "ok": 0 · com MP3 pronto e selo válido: 0 · MP3 de texto editado depois (regerar): 0 · sem MP3 pré-gerado: 0
- Estado geral: {"total":726,"estados":{"ok":726},"faltam":0,"agendadosComMp3PreGerado":0}

## Ciclo automático — 18/10/2026, 14:02:50
- Pré-geradas nesta execução: 16 · falhas de geração: 0
- ENVIAR · publicados + agendados sem áudio "ok": 0 · com MP3 pronto e selo válido: 0 · MP3 de texto editado depois (regerar): 0 · sem MP3 pré-gerado: 0
- Estado geral: {"total":726,"estados":{"ok":726},"faltam":0,"agendadosComMp3PreGerado":0}

## Ciclo automático — 19/10/2026, 08:20:33
- Pré-geradas nesta execução: 0 · falhas de geração: 0
- ENVIAR · publicados + agendados sem áudio "ok": 0 · com MP3 pronto e selo válido: 0 · MP3 de texto editado depois (regerar): 0 · sem MP3 pré-gerado: 0
- Estado geral: {"total":726,"estados":{"ok":726},"faltam":0,"agendadosComMp3PreGerado":0}
