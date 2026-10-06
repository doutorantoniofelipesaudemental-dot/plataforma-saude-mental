# Protocolo de homologação multimídia: artigos com trilha, carrosséis e vozes

Data da verificação: 2026-10-06, sobre a `main` no commit `1d441a7`. Este documento reúne a **checagem técnica** das três frentes (feita por mim; os artigos, os arquivos dos carrosséis e as vozes registradas foram reverificados na checagem final) e deixa em branco a **homologação**, que é do Dr. Antônio Felipe. **Ninguém ouviu os áudios**: a avaliação de voz, de ritmo e do volume da música sob a voz é auditiva e só o médico faz. Nada aqui valida o conteúdo clínico.

## 1. Resumo

| Frente | Escopo | Checagem técnica | Escuta e homologação |
|---|---|---|---|
| A. Artigos com trilha | 251 artigos publicados do portal | 251 de 251 sem problema | pendente (Dr. Antônio Felipe) |
| B. Carrosséis | 114 carrosséis (pacotes 001 a 114) | 114 de 114 sem arquivo faltando; 4 testes de proteção | pendente (Dr. Antônio Felipe) |
| C. Vozes | 3 vozes nos 17 artigos; 2 vozes nos 28 carrosséis sensíveis | painéis montados e testados | pendente (Dr. Antônio Felipe) |

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

## 6. Homologação (a preencher pelo Dr. Antônio Felipe)

Marque uma opção por frente, com data e observações. **Em branco até a sua decisão.**

| Frente | Resultado | Data | Observações / o que ajustar |
|---|---|---|---|
| A. Artigos com trilha | ☐ homologado ☐ com ressalvas ☐ reprovado | | |
| B. Carrosséis | ☐ homologado ☐ com ressalvas ☐ reprovado | | |
| C. Vozes (definitiva por artigo/carrossel) | ☐ homologado ☐ com ressalvas ☐ reprovado | | |
| Trilha de fundo (música) | ☐ mantém ☐ ajustar volume ☐ trocar por faixa licenciada | | |

Se houver ressalva ou reprovação, diga o item (artigo, pacote ou frente) e o que mudar: eu regenero e reenvio só o que for apontado, com a mesma verificação deste protocolo.

## 7. Pendências que continuam abertas

- Escuta e homologação das três frentes (seção 6).
- Dado incerto: provedor original dos 4 artigos mais antigos (seção 2).
- Trilha sintética: decidir se fica ou se é trocada por uma faixa licenciada.
