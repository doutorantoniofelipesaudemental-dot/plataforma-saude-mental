# Manutenção semanal — 2026-11-09 (worktree chore/manutencao-20261109)

STATUS: PARAR: worktree sem `.env` e sem `relatorios/ESTADO-GERAL.md` (arquivos ignorados); a pasta principal está fora do diretório permitido nesta sessão.

## Feito
- `npm run auditoria` (somente leitura): 89 textos MDX, 0 com falha, segurança 0 pendência. Relatório: `relatorios/auditoria-20261109-1750.md`.
- Auditoria do MongoDB NÃO executada (`MONGODB_URI` ausente).

## Bloqueado
1. `npm run rotina-semanal`: falhou em `mongoose.connect()` (URI indefinida). Causa: `.env` ausente no worktree. Não copiei `.env` (segredo; a guarda do projeto proíbe leitura). Rodar na pasta principal, onde o `.env` existe.
2. Órfãs do Blob (grupos c/d): não executado, depende do banco e do `.env`.
3. `youtube-reprovados`: não executado, depende do banco.
4. `lote-narracao` (narrações pendentes): não executado, depende do banco.
5. `agendar-linkedin`: não executado. Não há confirmação de Chrome com o Dr. Antônio logado nesta sessão.
6. Conferências com data futura: não verificadas (sem `ESTADO-GERAL.md`).
7. `npm run portao` completo: não executado. Depende de ambiente com `.env` e da branch sincronizada.

## Corrigido
- Nada. Nenhuma alteração de código, texto ou dado nesta execução.

## Aguardando decisão
- Rodar `npm run rotina-semanal` e `npm run portao` a partir da pasta principal (com `.env`), ou autorizar a leitura dela nesta sessão.
- Dr. Antônio: confirmar se a manutenção deve seguir pela pasta principal.

Sem push, sem PR, sem merge.
