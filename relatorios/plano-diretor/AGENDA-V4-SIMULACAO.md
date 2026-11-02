# Agenda v4 por eixo — SIMULAÇÃO (02/11/2026, dry-run, nada gravado)

Arquivo da simulação: `.tmp/backup-agenda-20261101/simulacao-v4.json` (mesmo formato de `simulacao.json`). Gerador: `.tmp/backup-agenda-20261101/simular-v4.js`. Não aplicado. Aplicação só às 18:00, com "!", após backup.

## Resultado (339 agendados, janela 03/11/2026 a 21/04/2027, 170 dias)
- Alocados: **339 de 339**. Não alocados: 0.
- 2 por dia (08:00 e 14:00 Bahia). Máximo por dia: 2. Mesmo eixo no mesmo dia: 0.
- Pares de título parecidos (Jaccard ≥ 0,5): 2 pares. Intervalo mínimo: 32 dias (regra: ≥ 30).
- Paliativos (45 itens, incluindo relatos de cuidados paliativos): intervalo mínimo 3 dias.
- Nível 1 (26 "fora") fica de fora, como antes.

## Pontos em que a regra não pôde ser cumprida como escrita
1. **"Cada eixo cerca de 2 vezes por semana"**: não cabe no estoque. Com 14 slots por semana, 2 por eixo = 14 por semana, mas o Eixo 2 tem 12 textos e o Eixo 7 tem 98. Apliquei proporção ao estoque. Resultado: Eixo 7 ≈ 4 por semana; Eixo 2 ≈ 0,5 por semana. **Sua decisão**: manter a proporção ou fixar um teto por eixo (e então sobra estoque para depois de abril).
2. **"Relatos cerca de 1 a cada 2 dias"**: há 107 relatos. Em 170 dias, 1 a cada 2 dias daria no máximo 85. A simulação tem relatos em 77 dias, com 40 pares em dias seguidos. **Sua decisão**: aceitar ou abrir a janela além de 21/04/2027.
3. **Pares de título**: encontrei 2 pares pelo critério de similaridade. O relatório antigo falava em 10. Se o critério antigo for o correto, avise e eu rodo de novo.

## Datas temáticas (conferidas em fonte)
- Carnaval 2027: segunda 8 e terça 9 de fevereiro (fonte: notícias de 2026; a publicação oficial da Comissão Nacional de Carnaval não foi encontrada).
- Janeiro Branco: Lei 14.556/2023 (fonte secundária; conferir o texto da lei).
- Novembro Azul: campanha (câncer de próstata). Não é data legal.
- Consciência Negra (20/11), Pessoa com Deficiência (03/12), Dia da Mulher (08/03), Dia do Autismo (02/04): datas fixas, a confirmar no texto oficial antes de usar.
- 28/04 (Abril Verde / Segurança e Saúde no Trabalho) está **fora da janela**: 21/04 é o último dia. Não foi aplicado.

Bônus temáticos: por eixo e por palavra-chave do título. Nos dias temáticos há textos com a palavra-chave, mas em alguns casos o tema entra só pelo eixo. Exemplos:
- 20/11: "Corpo negro, cabelo e padrões: racismo…" (E7). Além disso, um texto de E5 e um de E4 (por eixo).
- 08/03: "Violência contra mulheres migrantes…" (E7) e "Violência obstétrica…" (E2).
- 02/04: sem texto de autismo no dia (os dois textos sobre autismo estão em outras datas).
- 03/12 (Pessoa com Deficiência): nenhum texto com "deficiência" no título. O dia recebeu luto (E3) e migração (E7).
- Carnaval: os textos de E6 são de cirurgia plástica e exercício, sem relação direta com álcool ou drogas.
- Novembro Azul: 19 de 56 slots de novembro são E4/E5 (o bônus não é absoluto). 6 títulos de novembro tratam de homens (um é de E2 e outro é de E6).

## Quadro eixo × semana (4 primeiras semanas, a partir de 02/11)
| Eixo | Sem. 1 | Sem. 2 | Sem. 3 | Sem. 4 |
|---|---|---|---|---|
| 1 Infância e família | 1 | 2 | 3 | 3 |
| 2 Maternidade | 1 | 0 | 0 | 0 |
| 3 Vida adulta e paliativos | 2 | 3 | 2 | 2 |
| 4 Quem cuida e NR-1 | 2 | 3 | 2 | 2 |
| 5 Transtornos mentais | 2 | 2 | 3 | 2 |
| 6 Hábitos e sono | 2 | 0 | 0 | 0 |
| 7 Sociedade e cultura | 2 | 4 | 4 | 5 |

Semana 1 = 03/11 a 08/11 (os dias antes de 03/11 não entram).

## Para aplicar às 18:00 (pendências técnicas)
- O `aplicar-agenda.js` lê `simulacao.json` fixo e tem uma trava de backup: conta 365 documentos e confere o sha256 de `agenda-atual.bak.json`. Hoje o banco tem 339 agendados (não 365), então o `--backup` recusa. Antes de aplicar, é preciso (a) apontar o script para `simulacao-v4.json` e (b) atualizar a trava para o estado atual. Não alterei o script nesta rodada.
- O plano não mexe nos 26 "fora" nem nos publicados.
