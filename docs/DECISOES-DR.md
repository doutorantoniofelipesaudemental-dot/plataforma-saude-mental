# Decisões pendentes do Dr. (17/11/2026) — marcar e devolver

Colocado em C:/DRS-tools (a worktree da branch de visual não foi tocada). Ver também `C:/DRS-tools/triagem-rtk.md`.

1. **Ponytail local: acrescentar `off` ao `argument-hint`?** Diferença de uma linha em relação ao upstream. Recomendação: **sim**, depois de confirmar em `relatorios/auditoria-ponytail.md` que a mudança é só texto. Efeito: nenhum no comportamento. [ ] sim  [ ] não
2. **Ativar a proposta de deny de pastas pesadas?** (`.claude/settings.proposta.json`). Efeito: bloqueia leitura de relatorios, backups, .tmp, assets, importacao. Economia de contexto não medida; o CLAUDE.md (~10.500 tokens) e o guia (~11.200) continuam carregados. Recomendação: **sim**, com teste de uma sessão. [ ] sim  [ ] não
3. **Links de navegação de 16–19 px:** usar área de toque ampliada (pseudo-elemento, sem mudar visual) ou aceitar como estão? Recomendação: **ampliar com pseudo-elemento**, se a captura antes/depois não mostrar diferença. [ ] ampliar  [ ] aceitar
4. **Modo `-Modo local` interativo:** testar no seu PowerShell real com o comando: `powershell -NoProfile -File C:\DRS-economia-visual\scripts\cascata.ps1 -Modo local` (digite `/exit` para sair). Efeito: confirma o modo de uso diário. [ ] testado
5. **Reavaliação do RTK:** triagem = (b) (reescreve comandos e altera ~/.claude). Recomendação: **não instalar**. Só reavaliar com aprovação escrita sua e teste dos comandos reescritos. [ ] manter fora  [ ] reavaliar com teste

## Atualização (17/11/2026, 06:55)
- **Item 1 (argument-hint `off`):** a auditoria `relatorios/auditoria-ponytail.md` não trata da opção `off`. Confirmação pendente. Só texto, sem efeito de comportamento.
- **Item 3 (links de navegação 16–19 px):** a técnica foi testada no rodapé. Capturas idênticas (0 pixel), mas a contagem de alvos < 44 px não cai (máximo sem sobreposição = 35 px). Patch em `C:/DRS-tools/toque-44.patch`. Decisão: aceitar como está, ou autorizar aumento de espaçamento (mudança de layout).
- **Correção:** `da652f2` (verde-700 em `.etapa__numero`) não tem efeito visual: nenhuma página usa essa classe.
