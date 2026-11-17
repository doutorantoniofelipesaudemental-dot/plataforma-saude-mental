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

## Atualização (17/11/2026, 07:05): decisões abertas

- [ ] **Rodapé (35 px / 44 px).** O rodapé já cumpre o AA (WCAG 2.2, 2.5.8) pela exceção de espaçamento. Os 44 px são meta AAA (2.5.5). Opções: (a) aceitar como está; (b) autorizar o aumento de espaçamento: patch `C:/DRS-tools/toque-44-layout.patch`, capturas `C:/DRS-tools/capturas-rodape/` (antes e depois, 375 e 1280 px). Efeito: rodapé mais alto. Estado atual: 17 e 16 links abaixo de 44 px de altura; na variante, 0.
- [ ] **Política de privacidade.** O site já publica `/privacidade` (200). `/politica-de-privacidade` segue 404 e não foi criado. Rascunho em `docs/rascunhos/politica-de-privacidade-RASCUNHO.md` (NÃO PUBLICAR). Pontos que dependem do Dr:
  1. Dado de saúde: nenhum formulário envia dado de saúde hoje (PHQ-9/GAD-7 ficam no navegador, sem chamada de rede). Confirmar a regra.
  2. Registros antigos de contato e agendamento (até 15/10/2026): o banco ainda os guarda? Por quanto tempo? Não consultei o banco.
  3. Código morto em `home.js` e endpoints `/api/contato` e `/api/agendamentos` (410): remover exige ordem escrita (public/) e mudança no backend.
  4. "Consultório", atendimento e prontuário em `privacidade.html` (seções 1, 3, 5, 10) conflitam com a ordem de 08/11/2026 (sem consulta particular). Decidir o texto.
  5. Prazos: e-mails em 12 meses; resposta em 15 dias; prontuário em 20 anos (referência normativa a conferir na fonte oficial).
  6. Contadores e limite de pedidos: confirmar no código (`limiteEnvio`) que o IP só fica na memória.
  7. Orientação jurídica: obrigatória antes de publicar.
- [ ] **Contraste inline.** Commitado (branch `feat/drsm-contraste-inline`, 3 commits, um por página): `.cta a.botao` de verde-escuro para `tinta` em mentoria, linkedin e youtube (5,66:1 → 6,82:1). AA já passava; AAA (7:1) não é alcançável com tokens travados. Prova: uma região de 93×12 px por página e largura, dentro do botão. Não commitado: nada (sem patch de contraste, porque nenhuma troca ficou duvidosa). Pendente de decisão: `summary` terracota (`extras.css`, `#a85d3c` não é token), etiquetas `#1f7a72` (4,81:1) e `#8cc4b8` (6,98:1) no `index.html`.
- [ ] **Argument-hint do Ponytail `off`.** A auditoria `relatorios/auditoria-ponytail.md` não trata da opção `off`. Só texto, sem efeito de comportamento.
- [ ] **Deny de pastas pesadas.** Proposta inativa em `.claude/settings.proposta.json`. Ativar exige decisão.
- [ ] **Teste do `-Modo local` no PowerShell real.** Pendente (o modo `--message` do Aider funciona sem console; o interativo não foi testado).
