---
name: manutencao
description: Manutenção completa em um comando - rotina semanal, órfãs do Blob (grupos c/d), reprovados do YouTube, narrações pendentes, agendar-linkedin (se o Dr. Antônio estiver logado), portão final e relatório.
---
Execute em ordem. Pare só nos itens da seção "O que continua dependendo do Dr. Antônio" do `relatorios/ESTADO-GERAL.md` (login, verificação, CAPTCHA, OAuth, pagamento, sentido clínico, freios):
1. Skill `rotina-semanal`.
2. Órfãs do Blob: somente os grupos c/d, primeiro em dry-run; remova só o que o dry-run listar nesses grupos e registre o que removeu.
3. Skill `youtube-reprovados`.
4. Skill `lote-narracao` para narrações pendentes (EBUSY: trava contra colisão, tente de novo uma vez; persistindo, relate).
5. Skill `agendar-linkedin` somente se o Chrome estiver com o Dr. Antônio logado; PARE em login, verificação, CAPTCHA ou aviso de atividade incomum.
6. Conferências com data futura: marque "aguardando data".
7. Termine com `npm run portao` COMPLETO e grave `relatorios/manutencao-AAAAMMDD-HHMM.md` (feito / bloqueado / aguardando).
Merge só por `npm run merge-seguro`. Nunca imprima o `.env`.
