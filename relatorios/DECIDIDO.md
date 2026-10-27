# Decidido — não perguntar de novo

Atualizado em 27/10/2026, por ordem do Dr. Antônio. Antes de pedir qualquer decisão, conferir este arquivo. Se algo aqui estiver errado, o Dr. corrige; não reabrir por conta própria.

## Decisões
- **YouTube:** o app está "Em produção" desde 18/10/2026. O refresh token não vence. O aviso de "vence em 23/10" era falso: `relatorios/youtube/validade.json` foi corrigido (`autorizacaoVenceEm: null`), e o alerta deixa de disparar.
- **YouTube, escopo:** o `youtube:autorizar` tem de rodar com a pasta na `main` (escopo `youtube.force-ssl`). Rodado no branch antigo, o escopo fica errado. Conferir com `npm run youtube:teste-playlists`.
- **REDES_PUBLICACAO_ATIVA:** ligado. O post de 26/10 saiu.
- **Plano da Vercel:** Pro, confirmado (US$ 4,19 de 20 de crédito).
- **Root Directory da Vercel:** o deploy #158 funciona, então a configuração está correta. Encerrado.
- **Vídeos F (54 regerados):** fila atual com 97 `aprovado-checagem` e 12 `reserva`, nenhum reprovado. O PR #115 foi mesclado em 20/10/2026.
- **Opção A (domínio único):** os 24 textos ficam no site oficial (`www.drantoniofelipemedico.com.br`). Não é a regra a/b do Blob.
- **Regra a/b do Blob** (outra coisa): itens das listas a (publicados) e b (agendados) nunca são apagados; a rotina gera alerta.
- **Referências:** decidido na ordem de 27/10. Sem detalhe adicional nesta ordem (conferir a ordem antes de citar).
- **Vozes pagas:** bloqueadas. Só Edge-TTS (`pt-BR-AntonioNeural`).
- **Crons diários:** publicar redes todos os dias (PR #166, aberto).
- **Cron legado do LinkedIn (publicava por API):** removido no PR #166 (aberto; vale quando mesclado).
- **Manutenção semanal:** a etapa de segunda roda numa worktree própria a partir de `origin/main` (branch `fix/manutencao-arvore-limpa-20261026`).
- **Pasta principal:** SEMPRE na `main`. Trabalho só em worktrees curtos, removidos depois do merge.
- **Worktree de PR:** nunca passar merge com o branch aberto em worktree.
- **#145 (token do Instagram):** fechado em 27/10/2026. Superado pela main; removia a redação do token.
- **#138 (domínio único, textos e assets):** pausado (Opção A). Não mesclar sem ordem.

## Não decidido (aguarda o Dr.)
- Carrossel A e carrossel B (28/10) e o Reel corrigido: avaliação do Dr. Caminhos em `relatorios/ESTADO-GERAL.md`.
- Horários do #159.
- Migração do `vercel.json`.
- Limpeza das worktrees restantes (`DRS-cand`, `DRS-pr77`, `DRS-deploy-main`, `DRS-manut-20261026`, `DRS-post-check`, `DRS-promocao`, `DRS-registro`, `DRS-fix-manut`).
