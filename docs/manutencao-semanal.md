# Manutenção semanal (carta v3, item 5) — regra de Git de 20/10/2026

- **Segunda 11:00:** `node scripts/manutencaoSemanal.js --auto` cria o branch `chore/manutencao-AAAAMMDD` a partir da `main`, roda uma chamada do `claude -p` com a skill manutencao (dentro do teto diário) e o portão, e commita o que passou. Nunca envia.
- **Sexta 11:00:** o mesmo comando faz push **do branch da semana** (nunca da `main`). Abrir o PR é o passo seguinte.
- **Merge:** sempre do Dr. Antônio (`merge-seguro`), uma vez por semana.
- `relatorios/linkedin/fila.json` é estado rotineiro: não bloqueia a etapa e não entra no commit da manutenção.

## Comando para criar a tarefa (você roda no PowerShell; a tarefa nasce desativada)

```
powershell -NoProfile -Command "$t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Friday -At 11:00; $a = New-ScheduledTaskAction -Execute 'node' -Argument 'scripts/manutencaoSemanal.js --auto' -WorkingDirectory 'C:\DRSAUDEMENTAL'; $s = New-ScheduledTaskSettingsSet -StartWhenAvailable; Register-ScheduledTask -TaskName 'DrSM-Manutencao-Semanal' -Trigger $t -Action $a -Settings $s -Force | Out-Null; Disable-ScheduledTask -TaskName 'DrSM-Manutencao-Semanal' | Out-Null"
```

Para ativar depois de conferir: `powershell -NoProfile -Command "Enable-ScheduledTask -TaskName 'DrSM-Manutencao-Semanal'"`.

Os plantões (quinta e domingo) não coincidem com segunda nem sexta.
