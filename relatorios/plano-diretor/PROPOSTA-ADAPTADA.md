# Plano diretor adaptado — PROPOSTA para segunda, 18:00 (01/11/2026, versão 2)

Status: **proposta.** Inventário real feito (só leitura, 726 textos do export `textos-banco.json`). Nada foi alterado no banco, no site ou na Vercel.
Arquivos: `INVENTARIO.md` (totais), `INVENTARIO.csv` (uma linha por texto), `amostras/pilar-eixo4-cuidar-de-quem-cuida.md`, `amostras/modelo-relato-3-blocos.md`.

## Decisões já tomadas (ordem de 01/11/2026, para registrar em DECIDIDO.md por PR)
- Site: no máximo 2 artigos por dia; sensíveis só com revisão médica registrada; duplicados só com decisão do Dr. Antônio.
- Acervo de 365 agendados: cobre ~6 meses no ritmo novo. Textos novos só para lacunas reais, no máximo 1 por semana.
- Revisão do acervo: 3 a 5 por domingo, lote de até 45 min, começando pelos mais lidos e pelos sensíveis.
- Proibido: "consultas psiquiátricas" (MFC); agendamento ou formulário no site; ElevenLabs; Make; n8n; Canva; Descript; Metricool; selo "revisado" sem revisão registrada; anúncios de terceiros no site. Newsletter mensal. Contato só por e-mail.

## Números reais do inventário
- 726 textos: **361 publicados** e **365 agendados**. Nenhum fora de publicação e agenda.
- Vertical A (relatos, categoria "Relatos da Prática"): **190**. Vertical B (psicoeducação): **536**. Dos 365 agendados, a simulação tirou 40 sensíveis e 10 duplicados.
- Referências: **714 com ≥ 4**; **12 com menos de 4** (regra da auditoria: ≥ 4). Lista no CSV (`referencias_ok = false`).
- Pré-triagem sensível por palavra-chave no título: **45**. Candidatos totais à revisão (sensível, eixo 7 ou referência fraca): **65**.
- Revisão médica: o banco não tem campo de status de revisão. Hoje nenhum texto registra revisão.

## Quadro: plano original × adaptado × motivo
| Item | Plano original (ordem anterior / CLAUDE.md) | Adaptado (01/11) | Motivo |
|---|---|---|---|
| Ritmo do site | 11 por dia útil (08:00–18:00, seg–sex) | 2 por dia (08:00 e 14:00), todos os dias | Ordem do Dr. Antônio; CLAUDE.md ainda diz 11 e precisa de PR |
| Acervo agendado | simulação anterior: 11 por dia útil (34 dias úteis, até 07/12) | 315 agendados em 2 por dia, de 03/11/2026 a 09/04/2027 (158 dias), após tirar 40 sensíveis e 10 duplicados | Ritmo novo; decisão do Dr. Antônio nos sensíveis e duplicados |
| Sensíveis | publicação automática | `aguarda-revisao-medica` fora da agenda (`agendamento.agendado = false` com motivo) | Risco de suicídio e medicação; CFM 2.336/2023 |
| Duplicados | não verificados na agenda | similaridade > 60% antes de agendar; decisão do Dr. | 5 pares da ordem; 10 textos tirados da agenda |
| Verticais | não existem no calendário | A = relatos (categoria), B = psicoeducação (demais). Campo novo `vertical` nos metadados | Taxonomia para a revisão e as redes |
| Eixos (1–7) | não existem no calendário | campo novo `eixo`, **PROVISÓRIO** (ver limite abaixo) | Taxonomia para pilares e satélites |
| Referências | "≥ 4" sem checagem no acervo | 12 textos abaixo de 4: entram na fila de revisão | Auditoria (regra de ≥ 4) |
| Newsletter | semanal (planejada) | mensal | Ordem |
| Redes | 11 posts por dia útil automáticos | 1 Instagram/dia, 3 LinkedIn/semana, 3 Shorts/semana, 2 Spotify/semana (só revisados) | Ordem; freio de redes continua valendo |

## Limites do inventário (leia antes de decidir)
1. **Os nomes oficiais dos 7 eixos não estão no repositório.** O único documento com temas (`ARQUITETURA-ARTIGOS.md`) traz outra lista, e o eixo 4 da ordem não aparece nela. Por isso os eixos do inventário são provisórios e derivados da categoria de origem (E1 saúde mental no cotidiano; E2 infância e família; E3 luto e transições; E4 cuidar de quem cuida e trabalho; E5 pacientes e tratamento; E6 migração e causas sociais; E7 crise, por palavra-chave).
2. **A categoria não define o assunto.** A categoria "Médicos & Enfermeiros" traz textos clínicos do PA (psicose, contenção), que não são "cuidar de quem cuida". Por isso o eixo 4 por categoria (158 textos) está inflado. O pilar de amostra usa só títulos sobre cuidado e trabalho (72 publicados candidatos; 8 escolhidos).
3. **Relatos (189 sem eixo):** a categoria não diz o eixo. Ficam como "indefinido" até classificação por conteúdo.
4. **Sensíveis:** pré-triagem por palavra-chave no título. Não é classificação clínica.

## Pendências para o Dr. decidir
1. **Os 7 eixos:** confirmar os nomes oficiais (o eixo 4, "Cuidar de Quem Cuida & Saúde do Trabalhador", é o da amostra).
2. **Os 40 sensíveis da simulação:** aprovar a lista (`simulacao.json`, campo `sensiveis`) e o mecanismo de fora da agenda.
3. **Os 10 duplicados e os paliativos:** unir ou diferenciar os 5 pares. Há cerca de 39 textos com "paliativ" no título; a ordem fala em ~15. Não foram tirados por regra genérica.
4. **Pilar 1 (eixo 4) como amostra:** aprovar o rascunho; os outros 6 pilares só com aprovação.
5. **Os 12 textos com menos de 4 referências:** revisar ou aceitar fora da agenda.
