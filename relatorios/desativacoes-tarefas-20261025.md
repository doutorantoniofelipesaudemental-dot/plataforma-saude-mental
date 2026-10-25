# Desativações de tarefas do Windows (25/10/2026, 14:09 Salvador)

Feitas pelo Dr. Antônio Felipe com `Disable-ScheduledTask` (comandos colados no chat, resultado Disabled).

| Tarefa | Antes | Depois | Motivo |
|---|---|---|---|
| DrSM-Blob-Rotina-Mensal | Ready (próxima 01/11 03:00) | Disabled | Ordem de 20/10/2026: tarefa nova nasce desativada; regra do Blob pendente (decisão a/b). |
| DrSM-LinkedIn-Agendar | Ready (próxima 26/10 11:00) | Disabled | Ordem de 25/10/2026: LinkedIn sem agendamento automático até nova ordem. |

Estado das demais (leitura de 25/10, sem alteração):
- Ativas: DrSM-Conferencia-Diaria, DrSM-Manutencao-Semanal, DrSM-Narracao-Noite, DrSM-Rotina-Semanal, DrSM-YouTube-Gera-Midia, DrSM-YouTube-Publica.
- Pontuais: DrSM-Conferencia-19-10 (já passou), DrSM-Conferencia-26-10 (26/10 19:30).
- Já desativada antes: DrSM-LinkedIn-Lembrete.

Horários: as ativas ainda estão nos horários antigos até o alinhamento da pasta principal (decisao-segunda-0800-20261025-fase3.md, item 2.3).

Para reativar, só por ordem escrita do Dr. Antônio: `Enable-ScheduledTask -TaskName '<nome>'`.
