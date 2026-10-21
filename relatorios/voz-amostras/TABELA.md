# Amostras de voz para podcast e YouTube (21/10/2026)

Texto: trecho de dois parágrafos do artigo de burnout na APS, com o CVV 188 e o SAMU 192 por extenso. Mesmo texto para todas as vozes, com o dicionário de pronúncia atual (`backend/lib/pronunciaTts.js`), velocidade 0,9, pausas de 0,45 s entre frases e de 1,0 s entre parágrafos, e volume normalizado em -16 LUFS. Gerado localmente; nada foi publicado.

**Eu não consigo ouvir os arquivos.** Por isso a tabela traz as medidas e as licenças, e não uma avaliação de clareza, naturalidade ou empatia. A escolha pelo ouvido é sua.

| Arquivo | Motor e voz | Licença do modelo e dos dados | Pode ir ao ar (podcast e YouTube)? | Duração medida |
|---|---|---|---|---|
| `piper-faber.mp3` | Piper, faber (média) | Dados CC0 (cartão do modelo) | Sim | 55,3 s |
| `piper-cadu.mp3` | Piper, cadu (média) | Dados CC0 | Sim | 68,3 s |
| `piper-jeff.mp3` | Piper, jeff (média) | Dados CC0 | Sim | 68,0 s |
| `piper-edresson.mp3` | Piper, edresson (baixa qualidade) | Dados CC BY 4.0: exige crédito ao autor | Sim, com crédito | 85,8 s |
| `kokoro-pf_dora.mp3` | Kokoro, pf_dora (feminina) | Modelo Apache 2.0; origem dos dados desta voz **não documentada** | **Não**, até confirmar a origem | 61,6 s |
| `kokoro-pm_alex.mp3` | Kokoro, pm_alex (masculina) | Mesmo caso | **Não**, até confirmar | 62,8 s |
| `kokoro-pm_santa.mp3` | Kokoro, pm_santa (masculina) | Mesmo caso | **Não**, até confirmar | 63,9 s |
| `edge-atual-antonio.mp3` | Edge-TTS, pt-BR-AntonioNeural (voz atual do site) | Sem termo oficial que permita distribuição pública (pesquisa de 20/10) | Incerto | 65,2 s |

## Observações

- **Duração:** nenhuma voz ficou exatamente em 60 s. A diferença vem do ritmo de cada modelo. Se quiser igualar, ajusto a velocidade por voz.
- **Piper, aviso de fonema:** o modelo emitiu avisos de "fonema ausente" para o til combinante (`̃`). Pode haver leve distorção em palavras com "ã". Vale conferir essas palavras na escuta.
- **Edresson:** é a voz de baixa qualidade e a mais longa. Só entraria se a clareza das outras não servir.
- **Kokoro:** é a única família com as vozes femininas e masculinas que você citou. Como a origem dos dados não está documentada, não uso essas vozes em público até alguém confirmar.

## Recomendação

Entre as vozes que podem ir ao ar, a escolha fica entre **faber, cadu e jeff**, que são de qualidade média e têm dados CC0. Eu não tenho base para escolher entre elas sem ouvir. Ouça as três com as mesmas palavras de CVV e escolha a que soar mais acolhedora para você.

Se nenhuma soar bem, a próxima opção é perguntar a origem dos dados das vozes do Kokoro. Só então elas podem entrar na lista.
