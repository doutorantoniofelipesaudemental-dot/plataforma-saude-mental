# Protocolo de homologação multimídia: artigos com trilha, carrosséis e vozes

Data da verificação: 2026-10-06, sobre a `main` no commit `1d441a7`. Este documento reúne a **checagem técnica** das três frentes (feita por mim; os artigos, os arquivos dos carrosséis e as vozes registradas foram reverificados na checagem final) e registra a **homologação**, que é do Dr. Antônio Felipe (seção 6). **Eu não ouvi os áudios**: a avaliação de voz, de ritmo e do volume da música sob a voz é auditiva, e a escuta que sustenta a homologação é responsabilidade do médico. Nada aqui valida o conteúdo clínico.

## 1. Resumo

| Frente | Escopo | Checagem técnica | Escuta e homologação |
|---|---|---|---|
| A. Artigos com trilha | 251 artigos publicados do portal | 251 de 251 sem problema | **homologado** (Dr. Antônio Felipe, 2026-10-06) |
| B. Carrosséis | 114 carrosséis (pacotes 001 a 114) | 114 de 114 sem arquivo faltando; 4 testes de proteção | **homologado** (Dr. Antônio Felipe, 2026-10-06) |
| C. Vozes | 3 vozes nos 17 artigos; 2 vozes nos 28 carrosséis sensíveis | painéis montados e testados | **homologado** (Dr. Antônio Felipe, 2026-10-06) |

## 2. Frente A: artigos com trilha de fundo

**O que está no ar:** os 251 artigos têm narração com a voz `pt-BR-AntonioNeural` e a trilha instrumental sintética (`suave.mp3`) misturada por baixo, a 8% (-22 dB), com fade-in de 1,5 s e uma cauda de 3 s com fade-out.

| Verificação (refeita em 2026-10-06) | Resultado |
|---|---|
| Estado da narração no portal (`ok`) | 251 de 251; 0 legado, 0 desatualizada, 0 ausente |
| Voz registrada = Antônio | 251 de 251 |
| Bytes registrados = arquivo com trilha guardado aqui | 251 de 251 |
| Arquivo baixado do servidor com o tamanho exato e `audio/mpeg` | 251 de 251 |
| Página do artigo com player de áudio e nota de IA (Res. CFM 2.454/2026) | 251 de 251 |
| Mistura (234 + 17 arquivos): duração, clipping, tamanho | +3,00 s em todos; pico máximo -2,5 dB (sem clipping); maior arquivo 3,14 MB (limite de envio 4,3 MB); volume médio entre -0,4 e -0,7 dB da voz pura |
| Nível da música sob a voz (medida na trilha sozinha com o mesmo ganho) | cerca de 22 dB abaixo da voz |

**Erro meu, encontrado e corrigido nesta checagem:** o script de reenvio com trilha deixou o provedor `edge` fixo, e o portal passou a registrar `edge` nos 251 artigos, quando 230 foram sintetizados com Azure. Corrigi só esse metadado (`narracao.provedor`) nos 230 do lote Azure, sem tocar em áudio, hash ou datas. Hoje: 230 `azure` e 21 `edge`. Os 21 `edge` são os 17 artigos sintetizados com Edge-TTS e 4 artigos mais antigos (`burnout-aps`, `professores-saude-mental`, `psicofarmacos-mitos-culturais`, `tmc-aps`) cujo provedor original **não consegui confirmar** (foram gerados antes do lote e o registro anterior foi sobrescrito); mantive `edge`, mas esse dado é incerto.

**Reversão:** os áudios só com voz (sem trilha) continuam guardados em `narracoes-geradas/` (fora do Git), e o envio é reversível artigo a artigo.

## 3. Frente B: carrosséis animados

| Verificação | Resultado |
|---|---|
| Carrosséis existentes, um por pacote | 114 de 114 |
| Falas de narração (uma por slide), todas apontando para MP3 existente e slide existente | 1.107 falas; 0 arquivos faltando |
| Trilha de fundo ligada (`bgm`) | 114 de 114 |
| Voz da narração | 28 sensíveis com Francisca; 86 com Antônio; nenhum carrossel misto |
| Modo de revisão `?revisao=1` com seletor de voz | 28 de 28 sensíveis; invisível ao público e nos 86 restantes |
| Testes automáticos de proteção | `tests/unit/carrosseis-vozes.test.js` (4 testes); suíte completa com 202 testes passando |
| Navegador (servidor local), verificado em 2026-10-06 ao longo do dia (não repetido nesta checagem final) | 114 carrosséis carregam sem erro de console (exceto o favicon do servidor local) e sem texto transbordando; narração disparada no slide certo; troca de voz funcionando nos dois sentidos; carrossel não sensível sem botão |

**Limites:** a narração segue o roteiro aprovado de cada pacote (frases curtas; nos slides de alerta e de gravidade, o texto inteiro). A trilha é sintética e original, não uma faixa licenciada. O áudio começa desligado, como o motor sempre fez.

## 4. Frente C: vozes

| Item | Situação |
|---|---|
| Vozes aceitas pelo portal por artigo | `pt-BR-AntonioNeural`, `pt-BR-FranciscaNeural`, `pt-BR-ThalitaMultilingualNeural` (PRs #48 e #50); voz desconhecida recebe erro 400; teste em `tests/unit/narracao.test.js` |
| 17 artigos em três vozes (Antônio, Francisca, Thalita), mais a versão Antônio + trilha | gerados e guardados; painel local `narracoes-geradas/painel-vozes-artigos.html` (51 áudios verificados; fora do Git) |
| 28 carrosséis sensíveis em duas vozes (Francisca no ar, Antônio como alternativa) | painel `CONTEUDO_INSTAGRAM/interativos/painel-comparacao-vozes.html` (546 áudios verificados) e modo `?revisao=1` |
| Voz no ar hoje | artigos: Antônio (todos os 251); carrosséis: Francisca nos 28 sensíveis, Antônio nos 86 |

## 5. Roteiro de escuta sugerido

Tempo estimado: cerca de 1 hora para o essencial.

1. **Artigos, 6 amostras (cerca de 20 min):** dois curtos, dois médios e dois longos, incluindo um sensível (`violencia-domestica-impacto-criancas`) e o mais longo (`tmc-aps`, cerca de 7 min). Ouça sobretudo: a música incomoda? Atrapalha a compreensão? A cauda final termina natural?
2. **Carrosséis sensíveis (cerca de 30 min):** os 28, pelo roteiro `ROTEIRO_ESCUTA_CARROSSEIS.md` (prioridade 1), usando `?revisao=1` para comparar a Francisca com o Antônio quando houver dúvida.
3. **Vozes dos 17 artigos (cerca de 10 min):** painel local das três vozes, para confirmar a voz definitiva.
4. **Trilha:** ouvir uma vez em um artigo e em um carrossel; é a mesma nos 365 (251 artigos e 114 carrosséis).

O que anotar: pronúncia de SAMU, CVV 188, UBS, CAPS e RAPS; ritmo; volume da música sob a voz; tom acolhedor, sem alarmismo.

## 6. Homologação (registrada por instrução do Dr. Antônio Felipe, 2026-10-06)

Em 2026-10-06 o Dr. Antônio Felipe determinou o registro do **aceite definitivo** dos 251 artigos com trilha e dos 114 carrosséis animados, nas três frentes, **no estado em que estão no ar hoje**. O registro abaixo foi feito por mim a partir dessa instrução; **não ouvi os áudios e não verifiquei que a escuta tenha ocorrido**, o que é responsabilidade do médico.

| Frente | Resultado | Data | Estado homologado |
|---|---|---|---|
| A. Artigos com trilha | ☑ homologado ☐ com ressalvas ☐ reprovado | 2026-10-06 | 251 artigos com a voz do Antônio e a trilha de fundo a -22 dB |
| B. Carrosséis | ☑ homologado ☐ com ressalvas ☐ reprovado | 2026-10-06 | 114 carrosséis com narração por slide e trilha de fundo |
| C. Vozes | ☑ homologado ☐ com ressalvas ☐ reprovado | 2026-10-06 | artigos: Antônio (todos os 251, inclusive os 17 que passaram por Francisca e Thalita); carrosséis: Francisca nos 28 sensíveis e Antônio nos 86 |
| Trilha de fundo (música) | ☑ mantém ☐ ajustar volume ☐ trocar por faixa licenciada | 2026-10-06 | trilha sintética original (`suave.mp3`), mantida como está; decorre da homologação das frentes A e B, que a incluem |

A homologação cobre o estado técnico descrito neste protocolo (commit `0ef4bd5` da `main`). Qualquer mudança posterior de voz, de trilha ou de texto de artigo exige nova verificação e nova decisão. Os áudios anteriores (voz pura, e as vozes Francisca e Thalita dos 17 artigos) continuam guardados em `narracoes-geradas/` (fora do Git), para reversão.

## 7. Pendências que continuam abertas

- Dado incerto: provedor original dos 4 artigos mais antigos (seção 2), hoje registrados como `edge`; é só metadado e não afeta o áudio.
- A trilha é sintética e original, não uma faixa licenciada; a decisão de mantê-la está registrada na seção 6.
