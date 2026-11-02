# Plano diretor adaptado — PROPOSTA (versão 3, 01/11/2026, 17:45)

Status: **proposta.** Inventário reclassificado (726 textos). Nada alterado no banco, no site ou na Vercel.
Arquivos: `INVENTARIO.md` (totais) · `INVENTARIO.csv` (uma linha por texto) · `PRIORITARIOS-REVISAO.md` · `amostras/pilar-eixo4-cuidar-de-quem-cuida.md` · `amostras/modelo-relato-3-blocos.md`.

## Decisões já tomadas (01/11/2026) — não são mais pendência
- **Agenda aplicada:** 339 agendados, de 03/11/2026 a 21/04/2027, 2 por dia (08:00 e 14:00, Bahia), todos os dias.
- **Fora da agenda (Nível 1):** 26 textos com `aguarda-revisao-medica` (`agendamento.agendado = false` com motivo). Mecanismo decidido.
- **Duplicados:** os 10 textos de títulos parecidos voltaram à agenda, espaçados 30 dias ou mais.
- **Paliativos:** 30 na agenda, espaçados 3 dias ou mais (conferido em dias de calendário).
- **Site:** no máximo 2 artigos por dia; sensíveis só com revisão médica registrada.
- **Proibido:** "consultas psiquiátricas" (MFC); agendamento ou formulário no site; ElevenLabs; Make; n8n; Canva; Descript; Metricool; selo "revisado" sem revisão registrada; anúncios de terceiros. Contato só por e-mail. Newsletter mensal.

## Números reais do inventário
- 726 textos: **361 publicados · 339 agendados · 26 fora** da agenda.
- Vertical A (relatos, categoria "Relatos da Prática"): **190**. Vertical B (psicoeducação): **536**.
- Eixos (reclassificados por título e conteúdo, público = categoria): ver a tabela em `INVENTARIO.md`. **216 marcados "revisar"**: o eixo mais provável, mas com pouca margem. Nenhum texto fica sem eixo.
- Referências: **12 textos fora do padrão**: não têm a lista formatada de referências (só um bloco de nota "localizadas no PubMed"). Não é falta de fonte; é formato. A agenda deles não foi alterada.
- Títulos com palavra sensível (pré-triagem por palavra): 19. Não é classificação clínica.

## Quadro: plano original × adaptado × motivo
| Item | Plano original | Adaptado (01/11) | Motivo |
|---|---|---|---|
| Ritmo do site | 11 por dia útil (seg–sex) | 2 por dia (08:00 e 14:00), todos os dias | Ordem do Dr. Antônio |
| Acervo agendado | simulação anterior: 11 por dia útil (34 dias úteis, até 07/12) | 339 agendados, 03/11/2026 a 21/04/2027 | Ritmo novo, aplicado hoje |
| Sensíveis | publicação automática | 26 fora da agenda (`aguarda-revisao-medica`) | Risco de suicídio e medicação; CFM 2.336/2023 |
| Duplicados | não verificados na agenda | 10 de volta, espaçados ≥ 30 dias | Decisão do Dr. Antônio |
| Paliativos | sem regra | na agenda, espaçados ≥ 3 dias | Decisão do Dr. Antônio |
| Verticais | não existem no calendário | A = relatos; B = psicoeducação (campo `vertical`) | Taxonomia para revisão e redes |
| Eixos (1–7) | não existem no calendário | nomes oficiais (ver DECIDIDO.md); campo `eixo` por título e conteúdo | Taxonomia para pilares e satélites |
| Referências | "≥ 4" sem checagem no acervo | 12 fora do padrão (formato), entram na revisão | Auditoria |
| Newsletter | semanal | mensal | Ordem |
| Redes | 11 posts por dia útil automáticos | 1 Instagram/dia, 3 LinkedIn/semana, 3 Shorts/semana, 2 Spotify/semana (só revisados) | Ordem; freio de redes continua valendo |

## Nota sobre o CLAUDE.md
Não há a frase "11 por dia" no `CLAUDE.md` rastreado. A versão anterior desta proposta afirmou que havia; essa afirmação estava errada e foi corrigida. O único registro do ritmo antigo está em `relatorios/calendario-publicacao-site.md`, que sai do Git pelo PR do calendário (opção A). Nenhuma alteração no `CLAUDE.md` nesta PR.

## Limites
1. A classificação de eixos é **automática por palavra-chave** (título ×3; trechos específicos do corpo). Não é leitura clínica. Os 216 "revisar" precisam de conferência; os relatos são os mais afetados.
2. Categoria é público, não eixo (decisão do Dr. Antônio).

## Ordem proposta dos 7 pilares (02/11/2026, PROPOSTA)
Critério: publicados disponíveis (base do pilar), tamanho do eixo, risco clínico e custo de conferência.
1. **Eixo 4 — Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1)** — 131 textos (85 publicados); consultoria NR-1; amostra já pronta (`amostras/pilar-eixo4-cuidar-de-quem-cuida.md`).
2. **Eixo 3 — Vida Adulta, Envelhecimento & Cuidados Paliativos** — 87 (25 publicados, 57 agendados); paliativos com sensibilidade clínica alta; segundo, como indicado.
3. **Eixo 1 — Infância, Adolescência, Pais & Família, Professores & Saúde Escolar** — 160 (89 publicados); maior público.
4. **Eixo 5 — Transtornos Mentais** — 144 (91 publicados); maior volume clínico, exige revisão de sentido clínico por texto.
5. **Eixo 6 — Hábitos, Estilo de Vida & Sono** — 53 (32 publicados).
6. **Eixo 7 — Sociedade, Cultura & Existência** — 132 (32 publicados, 95 agendados); pilar com muitos textos ainda não no ar.
7. **Eixo 2 — Maternidade, Puerpério & Saúde Perinatal** — 19 (7 publicados); menor volume, pode ser fundido com o Eixo 1 se o Dr. preferir.
Só o pilar do Eixo 4 segue como amostra. Os demais: após aprovação.

## Pendências para o Dr. decidir (segunda, 18:00)
1. **Pilar do eixo 4 (amostra):** aprovar o rascunho (10 satélites sobre cuidado de quem cuida e trabalho). Publicar só depois da aprovação do sentido clínico.
2. **Reclassificação:** conferir os 76 "revisar" (lista em `reclassificacao-02-11-revisar.txt`); os demais já seguem a regra.
3. **Monetização:** não há decisão registrada no repositório. Entra na pauta só se você quiser decidir agora.

## Lacuna prioritária: Eixo 2 — Maternidade, Puerpério & Saúde Perinatal (02/11/2026, PROPOSTA)
O Eixo 2 tem 19 textos (7 publicados, 12 agendados). É a lacuna mais urgente do plano. Regra proposta: no máximo 1 artigo novo por semana para este eixo, sempre com aprovação de sentido clínico do Dr. Antônio antes de ir ao ar.

Oito temas propostos (fonte oficial a conferir no capítulo antes da redação):
1. **Depressão pós-parto: sinais, rastreio e tratamento** — OMS, Depressão: https://www.who.int/news-room/fact-sheets/detail/depression
2. **Ansiedade na gestação e no pós-parto** — OMS, Guia para integração da saúde mental perinatal (2022): https://www.who.int/publications/i/item/9789240057142
3. **Psicose pós-parto: quando procurar urgência** — mesmo guia (capítulo de sinais de alerta a conferir)
4. **Perda gestacional e neonatal: o luto dos pais** — mesmo guia; ligar ao Eixo 3 (luto) por link cruzado
5. **Pais também adoecem no perinatal** — mesmo guia (capítulo sobre pais a conferir)
6. **Violência na gestação e no pós-parto: sinais e proteção** — OMS, Saúde materna: https://www.who.int/news-room/fact-sheets/detail/maternal-health (confirmar o trecho sobre violência)
7. **Gravidez na adolescência e saúde mental** — OMS, Saúde mental dos adolescentes: https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health
8. **Medicamentos na gestação e na amamentação: decidir com a equipe** — mesmo guia perinatal (capítulo de medicamentos a conferir); sem indicação de dose, só orientação geral.
