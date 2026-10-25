# Consolidação dos registros (texto pronto; aplicar só depois do alinhamento da pasta principal)

Arquivo novo. Os compartilhados não foram editados. Aplicar por ordem do Dr. Antônio, depois de o PR 156 e os PRs de horário e registro estarem na main.

## CLAUDE.md
- Disponibilidade em casa (substitui a regra antiga de plantão de quinta e domingo, 17:30 às 10:30): seg a sex a partir das 17:30; seg a qui até 22:00; sexta sem fim informado (considerar 22:00); sábado a partir das 20:30 até domingo 22:00 (ordem de 25/10/2026).
- Horários sempre em Salvador (America/Bahia). No Windows, ler com PowerShell `Get-Date`: o `date` do Git Bash devolve UTC.
- Alias: `--skip-domain` só vale com `--prod`; não garante que aliases derivados fiquem de fora. Confirmar com `vercel alias ls` antes de criar deploy de produção sem domínio.
- Root Directory: já coberto pelo PR 156 (não repetir).

## relatorios/LICOES.md
- 25/10/2026: plano da conta lido como Hobby sem conferir; era Pro. Confirmar o plano pela API antes de escrever limites de cron e de logs.
- 25/10/2026: duração medida (narração ~2 h) não coube na margem assumida; sobreposição corrigida no branch de horários. Medir antes de agendar.
- 25/10/2026: "mais lidos primeiro" no publicador de redes pode furar a ordem por data quando há mais de um post devido.
- 25/10/2026: registro de checagem sem data posterior à validação não prova o estado atual.
- 25/10/2026: `merge-seguro` troca de branch na própria raiz: rodar só em worktree limpo no branch do PR.

## relatorios/PENDENTES.md
- Decidir o freio de segunda 08:00 (26/10): [A] mantido ou [B] (desativar crons; ver fase 3).
- Corrigir a arte do post de 26/10 (terceira linha da assinatura social) e refazer a tripla; depois `enviarFila` de novo.
- Substituir `checagem-tripla.md` na pasta principal pelo registro revisado (comando na fase 3).
- Erro 190 da Meta: passos em `relatorios/instagram-erro-190-20261025.md`.
- Manutenção-Semanal: corrigir o branch exigido (worktree dedicado) e a saída em log fixo.
- Decidir `--limite` da gera-mídia (25) e o horário de publicação do YouTube seg a sex (20:15 ou 21:15).
- LinkedIn-Agendar e Blob: estão Ready; a ordem pede desativados.
- Confirmar quinta-feira (CLAUDE.md diz plantão; ordem diz disponível até 22:00).

## relatorios/ESTADO-GERAL.md
- Plano da conta: Pro (lido pela API em 25/10/2026).
- Produção: #147 (`dpl_9pwS6…`), domínios no #147. Candidato `dpl_GcikF9…` (a40869f) não promovido.
- Freio de segunda 08:00: [A] vigente salvo decisão do Dr. Antônio; recomendação [B] pela arte do post de 26/10.
- Branches pendentes de merge: horários (`feat/horarios-presenca-20261025`, `f6e0f6c`), registro (`fix/registro-tripla-cuidador-20261025`, `3f0ea6d`), PR 156, documentação da promoção (`docs/vercel-promocao-20261025`, `8d2c466`).

## relatorios/PROMPT-ATUAL.md
- Próximo passo: decisão de [A]/[B] para segunda; depois alinhar a pasta principal (fase 3, 2.3), na ordem dos PRs (2.4).
