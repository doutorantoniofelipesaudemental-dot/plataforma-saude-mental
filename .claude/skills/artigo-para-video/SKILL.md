---
name: artigo-para-video
description: Transforma um artigo do Portal de Saúde Mental Doutor Antônio Felipe Garabito em roteiro e produção audiovisual (vídeo com personagens 3D + infográfico cinematográfico + música, carrossel e legendas por rede). Usar sempre que o Dr. pedir "roteiro", "vídeo", "carrossel" ou "post" a partir de um artigo.
---

# Do ARTIGO ao VÍDEO: procedimento obrigatório (v1, 25/11/2026)

Ordem fixa: **1. Ler o artigo → 2. Ficha de evidências → 3. Roteiro → 4. Checagem do roteiro → 5. Pedido de cenas ao Claude → 6. Montagem → 7. Auditoria → 8. Pacotes da fila.** Não pular etapa. Nada vai para a fila sem aprovação do Dr.

## 1. Ler o artigo
- Fonte: artigo PUBLICADO no portal (conferir no ar: `artigo.html?slug=<slug>`). Artigo que não está no ar não gera vídeo.
- Extrair: tema, público (pais / trabalhadores / gestores / profissionais), eixo do dia (seg E4 · ter E5 · qua E1 · qui E3 · sex E6 · sáb E7 · dom Relato/E2), 3–5 mensagens-chave e o "o que fazer".

## 2. Ficha de evidências (antes de escrever uma linha de roteiro)
- Cada número ou afirmação clínica precisa de fonte **conferida no PubMed** (PMID + DOI) ou de norma oficial (MTE/MS/CFM, com link). Sem fonte = a frase sai.
- Estudo observacional → "associado a", nunca "causa". Registrar limites (certeza baixa, heterogeneidade).
- Normas (NR-1, NR-9, NR-15 etc.): conferir o texto vigente no site do MTE antes de citar; não afirmar prazo de vigência sem conferir.
- Gravar em `producao-audiovisual/fichas/<slug>.md`.

## 3. Roteiro (formato único)
Estrutura de 45–60 s (Reels/Shorts) ou capítulos de 3–5 min (YouTube/Spotify):
1. **GANCHO (0–5 s):** cena da FAMÍLIA com FALA e emoção (pergunta ou situação real). Nunca "criador falando para a câmera" (o Dr. não aparece; não usar humanos realistas).
2. **HISTÓRIA (5–25 s):** 2–3 cenas faladas curtas (10 s), com emoções variadas (preocupação, dúvida, cansaço, alívio). Não ficar sempre sorrindo.
3. **O QUE A CIÊNCIA DIZ (narração pf_dora + infográfico):** 1–2 números com fonte na tela.
4. **O QUE FAZER (narração + checklist na tela):** 3 passos práticos e "quando procurar a UBS/CAPS/PA".
5. **FECHO:** cena falada de acolhimento + cartão final padrão (identificação de 5 linhas, crédito do Portal, CVV 188 · SAMU 192, aviso de IA, fontes).

Para cada cena: `cena_id, tipo (fala|narrada|cartao), duracao_s, personagens, emocao, fala_pt, prompt_en (para o Claude gerar), texto_tela, fonte_pmid`.
- Personagens: só os da ficha (Clara, Rafael, Davi, Bia, Vó Zezé, Pipoca, Nina). Para um tema, um deles pode ganhar uma profissão (ex.: Rafael técnico de obra).
- Prompt em inglês: começa com "Cinematic stylized 3D animated family film, characters exactly as in the reference image (same faces, hair, clothes). Expressive acting with natural, varied facial emotions, clear lip-sync … Dialogue in Brazilian Portuguese: …".
- Evitar no prompt palavras que o filtro recusa: close de criança triste, "teen" sozinho em cena tensa. Preferir "the son", "the girl", e cenas calmas.

## 4. Checagem do roteiro (bloqueia se falhar)
- Científica: cada número com PMID/DOI na ficha.
- Ética (CFM 2.336/2023 e 2.454/2026; CEM; LGPD): sem promessa de cura, sem consulta particular, sem diagnóstico à distância, sem "psiquiatra", sem nome de remédio ou dose, profissional sem rosto, zero violência verbal ou física, safe messaging (nada de método; CVV sempre).
- Humanizada: linguagem acolhedora, sem culpa, sem estigma.
- Técnica: 9:16 e 16:9, legenda = fala, gancho ≤ 5 s.

## 5. Pedido de cenas ao Claude
- O Claude Code NÃO gera imagem, vídeo ou voz paga (teto R$ 0). Gerar `producao-audiovisual/pedidos/<slug>.md` com a lista de cenas (prompt_en, duração, 16:9 ou 9:16, com/sem fala) para o Dr. colar no chat do Claude (Higgsfield).
- O Claude devolve os links; salvar em `producao-audiovisual/cenas/<slug>.md`.

## 6. Montagem (montador cinematográfico, PR #330/#331)
- Cena falada: áudio nativo, a música abaixa (ducking).
- Trecho narrado: voz Kokoro **pf_dora** (masculina: pm_alex), sobre uma cena muda, com o infográfico (números grandes Inter 900, etiquetas, fonte na tela).
- Trilha: FluidSynth + FluidR3_GM (`C:\DRSAUDEMENTAL\.tmp\musica-fluid\…`; ver `relatorios/FERRAMENTAS-AUDIO.md` ANTES de dizer que não existe), piano + cordas, −12 dB sob a voz.
- Masters: −14 LUFS (YouTube/Instagram), −16 LUFS (Spotify), TP ≤ −2 dBTP (medir com ebur128 true peak).
- Saídas: 9:16 e 16:9.

## 7. Auditoria
`out/<slug>/AUDITORIA.md`: falas transcritas com Whisper × roteiro; PMIDs; quadros conferidos; métricas; pendências para o Dr.

## 8. Pacotes da fila
- meta.json, legendas por rede (Instagram ≤ 1500, gancho ≤ 140, pergunta acolhedora P4; LinkedIn tom institucional; YouTube descrição com fontes; Spotify), link do artigo, calendário pelo eixo.
- Dry-run sempre; comandos em PowerShell (sem "!" e sem "&&"), um por linha, para o Dr. rodar.

---

# EXEMPLO APLICADO: Artigo 2 "Calor extremo no trabalho: riscos físicos e mentais e como proteger as equipes" (eixo E4, segunda)

## Correções sobre o rascunho recebido
- "Criador com copo d'água na mão" → **trocado pela família** (o Dr. não aparece e não há humano realista).
- "O corpo gasta energia massiva… sobra menos recurso" → **sem fonte; reescrito** de forma prudente ("o corpo prioriza se resfriar, e isso cansa").
- "Absenteísmo", "Burnout" e "queda brusca de produtividade" → **sem fonte; retirados** dos dados. Podem aparecer como pontos de atenção, sem número.
- NR-1/NR-15 → citar só depois de conferir no MTE: NR-15 (Anexo 3: limites de exposição ao calor), NR-9 (avaliação do calor) e NR-1 (gerenciamento de riscos ocupacionais, incluindo os psicossociais). Não afirmar datas de vigência.
- Faltavam CVV, identificação e aviso de IA → incluídos no cartão final.

## Ficha de evidências (conferida no PubMed em 25/11/2026)
- Liu et al., Environment International, 2021 (PMID 33799230; doi 10.1016/j.envint.2021.106533): meta-análise com 53 estudos; **a cada +1 °C, aumentaram os atendimentos por problemas de saúde mental** (RR 1,009) e a mortalidade relacionada (RR 1,022); **maior vulnerabilidade em climas tropicais e subtropicais e acima dos 65 anos**. Associação; heterogeneidade relevante.
- Binazzi et al., American Journal of Industrial Medicine, 2019 (PMID 30675732; doi 10.1002/ajim.22946): meta-análise; **o calor no trabalho se associou a mais acidentes de trabalho**, com risco maior em jovens, homens e agricultura (subgrupos não significativos).
- Spector et al., Current Environmental Health Reports, 2019 (PMID 31520291; doi 10.1007/s40572-019-00250-8): revisão; em trabalhadores da construção, **+0,5% de chance de acidente a cada +1 °C** (humidex máximo); a eficácia das medidas de prevenção ainda não está estabelecida → apresentar as medidas como "boas práticas", não como "comprovadas".

## Roteiro 2A "O calor que ninguém vê" (Reels/Shorts, ~55 s, trabalhadores)
| # | Tipo | Cena (personagens · emoção) | Fala / narração | Tela |
|---|---|---|---|---|
| 1 | fala 8 s | Obra ao meio-dia em Salvador; Rafael (técnico, capacete) enxuga o suor, irritado · cansaço | Rafael: "Hoje tá impossível... não consigo nem pensar direito." | "Calor e mente" |
| 2 | fala 8 s | Colega (Clara, encarregada de segurança) oferece água na sombra · cuidado | Clara: "Rafael, pausa na sombra agora. Bebe água." | — |
| 3 | narrada 15 s | cena muda: termômetro de rua, sol forte, operários na sombra | "Não é só impressão. Uma grande revisão de 53 estudos mostrou que, a cada grau a mais, aumentam os atendimentos por problemas de saúde mental. E o risco é maior em climas quentes, como o nosso." | "+1 °C → mais atendimentos em saúde mental" · Liu 2021 (PMID 33799230) |
| 4 | narrada 10 s | cena muda: canteiro de obras | "No trabalho, o calor também se associa a mais acidentes." | "Calor ↔ mais acidentes" · Binazzi 2019 (PMID 30675732) |
| 5 | narrada 10 s | checklist sobre cena de equipe descansando | "Pausas em local fresco, água antes da sede e atenção a tontura, confusão ou irritação fora do normal." | ✓ pausas na sombra ✓ água ✓ sinais de alerta |
| 6 | fala 6 s | Rafael, aliviado, na sombra · alívio | "Agora sim. Cabeça fresca, trabalho seguro." | — |
| 7 | cartão 6 s | — | — | cartão final padrão + fontes |

## Roteiro 2B "Calor e gestão de equipes" (LinkedIn/YouTube, ~60 s, gestores e RH)
| # | Tipo | Cena | Fala / narração | Tela |
|---|---|---|---|---|
| 1 | fala 8 s | Escritório; Clara (gestora de RH) olha a previsão de 39 °C · preocupação | Clara: "Semana de 39 graus... e a equipe de campo?" | "Sua empresa está pronta?" |
| 2 | narrada 15 s | cena muda: equipe externa ao sol | "O calor extremo deixou de ser só conforto: está associado a mais problemas de saúde mental e a mais acidentes de trabalho." | Liu 2021 · Binazzi 2019 |
| 3 | fala 8 s | Reunião; Clara e Rafael planejam no quadro · foco | Rafael: "Dá pra começar mais cedo e parar no pico?" / Clara: "Dá. E água e sombra em todo ponto." | — |
| 4 | narrada 15 s | checklist sobre o quadro | "Três boas práticas: flexibilizar horários nos picos de calor, garantir água e sombra, e treinar líderes para reconhecer sinais de exaustão." | ✓ horários ✓ água e sombra ✓ líderes treinados · "NR-1 · NR-9 · NR-15 (conferir texto vigente)" |
| 5 | fala 6 s | Equipe de campo descansando na sombra, sorrindo · alívio | Rafael: "Assim dá pra trabalhar com segurança." | — |
| 6 | cartão 8 s | — | "Guia completo no Portal de Saúde Mental." | cartão final padrão + fontes |

## Carrossel (5 lâminas, Instagram/LinkedIn): versão corrigida
1. **Capa:** a família na obra ao sol (imagem do Claude) + "Calor extremo mexe com a mente" · Saúde mental e trabalho.
2. **O que a ciência mostra:** "+1 °C → mais atendimentos em saúde mental" · "Maior risco em climas quentes" · fonte Liu 2021 (PMID 33799230).
3. **No trabalho:** "Calor associado a mais acidentes" · fontes Binazzi 2019 (PMID 30675732) e Spector 2019 (PMID 31520291).
4. **3 boas práticas:** horários fora do pico · água e sombra · líderes treinados para sinais de exaustão (tontura, confusão, irritação fora do comum).
5. **Fecho:** "Sinais de alerta? Pare, vá para a sombra, hidrate e procure atendimento. Em emergência: SAMU 192." + identificação de 5 linhas + CVV 188 · aviso de IA + "Artigo completo no Portal".

## Legenda LinkedIn (corrigida)
O calor extremo não é só desconforto: estudos associam temperaturas mais altas a mais atendimentos por problemas de saúde mental, e o calor no trabalho a mais acidentes, com risco maior em climas quentes como o nosso (Liu et al., 2021; Binazzi et al., 2019).
Para RH, gestores e SST, três boas práticas: ajustar horários nos picos de calor, garantir água e sombra, e preparar líderes para reconhecer sinais de exaustão.
Cuidar das condições de trabalho também é cuidar da saúde mental.
📌 Artigo completo no Portal de Saúde Mental Doutor Antônio Felipe Garabito.
Dr. Antônio Felipe · Médico · CRM-BA 41322 · Especialista em Medicina de Família e Comunidade · RQE 26638.
Conteúdo educativo; não substitui avaliação profissional. Imagens criadas com IA.

## Pipeline automático por episódio (26/11/2026, T13)
Ordem: ficha → roteiro → checagem (T1 determinística, T2 científica, T3 ética) → pedido de cenas → GERAÇÃO no Higgsfield (antes: banco de cenas `producao-audiovisual/banco-de-cenas/INDICE.md`; estimar custo com `estimate_video_cost`) → conferência (Whisper + quadro) → montagem → `node scripts/checar-peca.js <pasta>` → revisor-ético (só itens novos) → pacote → dry-run (`scripts/youtube/entrarNaFila.js --pacote=<pasta>`, sem `--aplicar`).

Parar e registrar em PENDENTES.md somente em:
1. Tema com criança em situação sensível, personagem novo, ou artigo arquivado/sem slug publicado.
2. Veto do revisor-ético.
3. Gasto acima do teto de créditos aprovado pelo Dr. (teste grátis só vale no Claude chat/Cowork/ChatGPT).

Nada é publicado: o pipeline para no dry-run. Regras fixas: frase "Conteúdo produzido com apoio de Inteligência Artificial."; sem a palavra "sintético"; CVV 188 · SAMU 192; PMID para dado numérico; sem consulta particular.

## Contrato de arquivos por episódio (T20) e pílula de 1 minuto (T26)
Em producao-audiovisual/episodios/<slug>/ cada etapa grava UM arquivo: 01-evidencias.md, 02-roteiro.md, 03-etica-portao1.md, 04-decupagem.md, 05-arte-figurino-luz.md, 06-pedido-cenas.md, 07-cenas.md, 08-montagem.md, 09-etica-portao2.md, 10-pacote.md. Episódios já existentes mantêm os nomes antigos.
Pílula "Saúde Mental em um minuto" (9:16, 55–60 s, −14 LUFS, TP ≤ −2 dBTP): 0–5 s gancho; 5–35 s o que acontece e por quê (com fonte); 35–50 s orientação prática e sinal de alerta; 50–60 s cartão com as 5 linhas, CVV/SAMU, aviso de IA e Portal, e "Leia o artigo completo no Portal". Destino: YouTube Shorts e Instagram Reels. Não vai ao Spotify. LinkedIn pausado; Facebook só ponte.
Ficha de evidências (T22): cada dado [CONFIRMADO — PMID ou link oficial] ou [REMOVER — sem fonte]; o roteirista usa só os confirmados. Plano B (T25): se uma cena falhar 2 vezes, reescrever de forma neutra (1 tentativa), depois banco-de-cenas, depois infográfico + pf_dora. Nunca parar o episódio por causa de uma cena.
UTM (T27): <url>?utm_source={youtube|instagram|spotify}&utm_medium={episodio|shorts|reels|podcast}&utm_campaign=<slug>. Só se a landing de destino existir; não criada agora.
