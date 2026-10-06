# Relatório de fechamento do ciclo: conformidade (nota de IA) e áudio narrado

Data: 2026-10-06. Resume o que foi feito e verificado neste ciclo e o que segue pendente. **Não valida o conteúdo clínico** nem substitui a revisão do Dr. Antônio Felipe.

## 1. Nota de transparência de IA (Resolução CFM 2.454/2026)

- **O que mudou:** a nota "Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026)" entrou no rodapé de `public/artigo.html` (PR #36).
- **Alcance:** esse arquivo é a base do shell estático e da página pré-renderizada de todos os artigos publicados (251), então todos herdam a nota.
- **Trava:** teste novo em `tests/unit/assinatura-cfm.test.js` compara a nota com a fonte única `AVISO_CFM` e exige que a página pré-renderizada a traga. Suíte: 197 testes, todos passando.
- **No ar:** conferido pelo HTML em 3 artigos (`alimentacao-criancas`, `relato-territorio-segredos`, `dependencia-quimica`): nota presente, citação da Resolução 2.454/2026 e player de áudio. Os demais não foram abertos um a um.
- **Demais páginas públicas:** em 2026-10-06 a mesma nota entrou no rodapé de `index.html`, `blog.html` e `instagram.html` (PR #38), e o teste passou a cobrir as quatro páginas. `privacidade.html` (página legal, sem conteúdo educativo) e `admin.html` (área restrita) não receberam a nota.

## 2. Áudio narrado dos artigos do portal

- **Voz e provedor:** Azure Speech, `pt-BR-AntonioNeural`, camada gratuita (500.000 caracteres/mês).
- **Lote de outubro de 2026:** 230 artigos sintetizados, 0 falhas, **499.917 de 500.000 caracteres** usados. A ferramenta parou sozinha antes de `sindrome-neuroleptica-maligna` para não estourar a cota. Log do lote: `narracoes-geradas/_lote-2026-10.log`.
- **Envio para produção:** 230 MP3 enviados sem sintetizar de novo, 0 falhas (`narracoes-geradas/_envio-2026-10.log`).
- **Cobertura:** **251 de 251** artigos publicados com áudio em dia (4 de antes, 230 do lote Azure e 17 do lote Edge-TTS de 2026-10-06); nenhum com áudio antigo e nenhum sem áudio.
- **Verificado no servidor:** o arquivo de áudio de `alimentacao-criancas` responde 200 com `audio/mpeg`, e a API registra provedor Azure e 3.760 caracteres.
- **Observação:** a chave da ElevenLabs foi rejeitada (401) e `ELEVENLABS_VOICE_ID` não está definido; não foi usada.
- **Os arquivos de áudio não estão no Git:** `narracoes-geradas/` é ignorado de propósito; eles vão direto para o armazenamento do portal.

### Os 17 artigos restantes: gerados com Edge-TTS e enviados em 2026-10-06

Depois de a cota gratuita do Azure se esgotar, os 17 artigos que faltavam (23.486 caracteres) foram sintetizados com Edge-TTS (mesma voz `pt-BR-AntonioNeural`, sem consumir a cota do Azure) e enviados para produção, registrados com o provedor `edge`: 17 de 17, 0 falhas (`narracoes-geradas/_lote-edge-2026-10.log` e `_envio-edge-2026-10.log`). Conferido no servidor em 3 deles (`sindrome-neuroleptica-maligna`, `tept-aps`, `violencia-domestica-impacto-criancas`): o arquivo responde 200 com `audio/mpeg`, o banco registra provedor `edge` e o player está na página. A estimativa da ferramenta mostra 251 ok, 0 legado, 0 desatualizada, 0 ausente.

## 3. Narração dos 114 carrosséis animados

- **O que foi feito (2026-10-06):** 1.107 falas, uma por slide, sintetizadas com Edge-TTS (`pt-BR-AntonioNeural`, 88.509 caracteres, sem consumir a cota do Azure): **0 falhas**. Os MP3 ficam em `CONTEUDO_INSTAGRAM/interativos/assets/audio/voiceover/pacote-NNN/slide-NN.mp3` (cerca de 46 MB) e cada HTML de `carrosseis/` passou a trazer o mapa `voiceovers` do motor `AudioPlayer.js`.
- **O que é narrado:** a narração do roteiro aprovado de cada pacote (frases curtas); nos slides de alerta e de gravidade, o texto inteiro, com os canais CVV 188 e SAMU 192; no último slide, o aviso de que nenhum medicamento deve ser iniciado, trocado ou suspenso sem orientação médica. Nenhum texto narrado cita medicamento, classe ou dose.
- **Verificado no navegador (servidor local):** os 114 carrosséis carregam sem erro; as 1.107 falas respondem 200 como `audio/mpeg` e apontam para slides que existem; em `pacote-105`, ao ligar o áudio e avançar, a narração disparada é a do slide 1, 2 e 3. O áudio continua começando desligado, como já era o desenho do motor.
- **Trilha de fundo (2026-10-06):** faixa instrumental original, sintetizada localmente (pad ambiente em Lá menor, 96 s, loop contínuo, estéreo, MP3 de 128 kbit/s, 1,5 MB), sem serviço externo, sem créditos e sem questão de licença: `CONTEUDO_INSTAGRAM/interativos/assets/audio/bgm/suave.mp3`, ligada aos 114 HTML pelo campo `bgm`. Masterizada com pico em -5,9 dBFS: com os 15% de ganho que o `AudioPlayer.js` aplica à trilha, o pico fica em torno de -22 dB no conjunto; sob a narração ela cai para 8%. Conferido no navegador em `pacote-105` (trilha e falas são carregadas, sem erro); a emenda do loop foi medida nas amostras e não tem salto.
- **Não feito:** não ouvi os arquivos (narração e trilha): a conferência foi técnica, não de qualidade. Como a trilha é sintética, vale o Dr. Antônio Felipe ouvir e decidir se mantém ou troca por uma faixa licenciada.

## 4. Voz dos carrosséis sensíveis: Francisca (decisão de 2026-10-06)

- **Decisão:** por instrução do Dr. Antônio Felipe, os **28 carrosséis sensíveis** passaram a usar a voz **`pt-BR-FranciscaNeural`** (Edge-TTS). Os outros 86 seguem com `pt-BR-AntonioNeural`.
- **O que mudou nos arquivos:** só os caminhos do campo `voiceovers` dos 28 HTML (de `voiceover/` para `voiceover-francisca/`). As 273 falas da Francisca estão em `CONTEUDO_INSTAGRAM/interativos/assets/audio/voiceover-francisca/pacote-NNN/` (12 MB, 0 falhas na geração). **Os arquivos da voz de Antônio dos 28 foram mantidos**, então voltar atrás é trocar o caminho de novo.
- **Verificado no navegador (servidor local):** dos 114 carrosséis, 28 apontam só para a Francisca e 86 só para o Antônio (nenhum misto); as 1.107 falas respondem 200 como `audio/mpeg`; em `pacote-105`, ao ligar o áudio e avançar, tocam os arquivos da Francisca.
- **Painel de comparação:** `CONTEUDO_INSTAGRAM/interativos/painel-comparacao-vozes.html` segue disponível, agora rotulando Antônio como "anterior" e Francisca como "atual".
- **Modo de revisão (`?revisao=1`), uso interno:** nos 28 carrosséis sensíveis, abrir a página com `?revisao=1` no final do endereço mostra um botão extra, "Voz: Francisca (revisão)", que alterna entre a Francisca (principal) e o Antônio (alternativa) e refaz a fala do slide atual; a escolha continua ao avançar. Sem o parâmetro, ou nos outros 86 carrosséis, **nada aparece para o público**. Implementado no motor (`CarrosselAnimado.js`, com `AudioPlayer.setVoiceovers`) e no campo `voiceoversAlt` do config dos 28; protegido por 4 testes novos (`tests/unit/carrosseis-vozes.test.js`). Verificado no navegador: sem o parâmetro não há botão; com ele, o botão aparece (48 px), a troca funciona nos dois sentidos e o pacote 110, não sensível, não mostra botão. Exemplo: `http://localhost:8000/carrosseis/pacote-105-manejo-de-sintomas-psicoticos-induzidos-por-subs.html?revisao=1`.
- **Não ouvido por mim:** a escolha foi do Dr. Antônio Felipe; a conferência que fiz foi técnica.

## 5. Voz dos 17 artigos do portal: Antônio, Francisca e Thalita (2026-10-06); no ar, Antônio

- **Histórico dos 17 artigos** (`sindrome-neuroleptica-maligna`, `sindrome-panico-o-que-e`, `sobrecarga-docente-descompressao`, `solidao-diferenca-estar-sozinho`, `tcc-quando-indicar-aps`, `tdah-adultos-sinais`, `tempo-tela-bebes-primeira-infancia`, `tept-aps`, `terapia-online-funciona`, `terapia-primeira-vez-o-que-esperar`, `toc-sinais-consulta`, `trabalho-domestico-invisivel-estresse`, `trabalho-noturno-turnos-saude-mental`, `transicao-carreira-aposentadoria-identidade`, `trauma-infancia-adulto`, `vergonha-culpa-diferenca`, `violencia-domestica-impacto-criancas`): primeiro foram narrados com `pt-BR-AntonioNeural` (Edge-TTS, quando a cota do Azure acabou), depois com `pt-BR-FranciscaNeural` e com `pt-BR-ThalitaMultilingualNeural` e, por instrução do Dr. Antônio Felipe, **voltaram à voz Antônio (`pt-BR-AntonioNeural`), que é a voz no ar hoje**. Os outros 234 artigos também usam a voz Antônio.
- **Mudança no portal (PRs #48 e #50):** a narração pode ter a voz escolhida artigo a artigo, entre `VOZES_NARRACAO` (Antônio, Francisca e Thalita). O hash considera a voz gravada em `narracao.voz`, e a rota `PUT /api/artigos/:slug/midia/narracao` aceita o cabeçalho opcional `X-Narracao-Voz` (voz desconhecida recebe 400; sem o cabeçalho, nada muda). Teste em `tests/unit/narracao.test.js`.
- **Envios (todos com 200 e sem falhas):** Francisca (17 de 17), Thalita (17 de 17) e, por último, o **reenvio do Antônio (17 de 17, `narracoes-geradas/_envio-antonio-reenvio-2026-10.log`)**, feito com os MP3 originais, depois de conferir que o texto de cada artigo era idêntico ao sintetizado. Detalhe da Thalita: 17 de 17 com resposta 200, 0 falhas (`narracoes-geradas/_envio-thalita-2026-10.log`). Na geração, um arquivo saiu incompleto (2 KB) e foi refeito antes do envio; os 17 foram conferidos por tamanho, duração e ritmo (15 a 17 caracteres por segundo), e o texto de cada artigo foi comparado com o sintetizado.
- **Verificado no portal:** a estimativa da ferramenta mostra 251 ok, 0 legado, 0 desatualizada e 0 ausente; em 3 artigos (`violencia-domestica-impacto-criancas`, `tept-aps`, `sobrecarga-docente-descompressao`) a API registrava estado `ok` e voz Thalita; após o reenvio, os 17 aparecem na API com estado `ok` e voz Antônio (conferidos os 17), o MP3 de `tept-aps` e de `violencia-domestica-impacto-criancas` responde 200 como `audio/mpeg` e o player está na página. **Não ouvi os áudios.**
- **Comparação das três vozes (local, fora do Git):** os MP3 ficam em `narracoes-geradas/` (Antônio), `narracoes-geradas/voz-francisca/` e `narracoes-geradas/voz-thalita/`, e o painel `narracoes-geradas/painel-vozes-artigos.html` (51 áudios, verificados) reúne as três vozes de cada artigo lado a lado. Para escolher outra voz num artigo, basta me dizer qual: o envio é reversível e os arquivos continuam guardados.
- **Trilha de fundo nos 17 (2026-10-06):** a trilha instrumental dos carrosséis (`suave.mp3`, sintética e original) foi misturada por baixo da voz do Antônio nesses 17 artigos, a 8% (-22 dB, o mesmo nível que o motor dos carrosséis usa sob a voz; medida: música ~22 dB abaixo da voz), com fade-in de 1,5 s e uma cauda de 3 s com fade-out. Nenhum arquivo com clipping (pico entre -2,5 e -4,8 dB); cada um tem menos de 1,2 MB. Enviados por instrução do Dr. Antônio Felipe: **17 de 17 com resposta 200** (`narracoes-geradas/_envio-antonio-trilha-2026-10.log`), com o mesmo caminho e o mesmo hash de antes (a voz não mudou). Conferido artigo a artigo: estado `ok`, voz Antônio, bytes registrados iguais ao arquivo com trilha, o servidor entrega o arquivo novo (inclusive pela URL pura, sem cache) e o player está na página. Os arquivos sem trilha (voz pura) continuam guardados em `narracoes-geradas/`, para reverter. Os outros 234 artigos continuam sem trilha. **Não ouvi o resultado.**

## 6. Decisões do Dr. Antônio Felipe (2026-10-06)

- **Referências dos Lotes 81 a 114:** todas as 77 foram **mantidas** (inclusive a referência parcial da pauta 155). Registrado na planilha `CURADORIA_REFERENCIAS_081_114.csv`, nos 34 pacotes e rascunhos e no `pautas.json`.
- **LinkedIn dos pacotes 001 a 006:** os seis textos foram **aprovados** (`REVISAO_LINKEDIN_001_006.md`).

## 7. Pendências abertas

1. **Ouvir a trilha e a narração dos carrosséis** (roteiro em `ROTEIRO_ESCUTA_CARROSSEIS.md`; comparação das duas vozes nos sensíveis em `interativos/painel-comparacao-vozes.html`) e confirmar se a trilha sintética fica ou é trocada por uma faixa licenciada.
2. **Conferência no navegador** das páginas de artigo (a verificação foi pelo HTML, por amostra).
