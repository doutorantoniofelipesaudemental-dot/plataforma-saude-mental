# Lições (registro para não repetir)

- **Verificação de duplicidade só no banco (20/10):** os 24 textos "novos" já estavam no site, em `src/content/artigos` e `content/blog`. Lição: checar sempre as quatro fontes (banco, MDX, rotas compiladas e similaridade). Está em `backend/lib/existeConteudo.js`.
- **Contagem do ZIP inteiro aplicada a um subconjunto (20/10):** eu disse que os 24 traziam ferramentas interativas; a contagem era dos 140. Lição: contar sempre dentro do conjunto analisado.
- **Regex de DOI cortava em parênteses (20/10):** DOIs da Elsevier têm parênteses. Lição: conferir o resultado da extração antes de concluir "sem resposta".
- **Busca por "educativo" não casava com "educativa" (20/10):** o aviso existia. Lição: testar os termos com variações antes de afirmar que algo falta.
- **`git pull` apagou arquivos do disco (20/10):** arquivos removidos do índice numa branch foram apagados do disco ao atualizar a `main`. Lição: antes de fazer `rm --cached` numa branch que vai para a `main`, saber que o pull apaga o arquivo local. Perdeu-se a última edição não commitada de 6 arquivos de estado.
- **`publicadoEm` obrigatório para renderizar (20/10):** sem esse campo, a página falha ("Invalid time value"). Lição: copiar do registro existente, não inventar campos.
- **Importação gravada antes da conferência de duplicidade (20/10):** 17 e depois 9 rascunhos foram inseridos e desfeitos, com backup antes. Lição: conferência de duplicidade antes de qualquer gravação, nunca depois.
- **Diretório do shell muda com `cd` (20/10):** comandos seguintes rodaram na pasta errada. Lição: usar caminhos absolutos.
- **Rebaixei 7 vídeos sem olhar a pasta do pipeline (20/10):** marquei como reprovados itens que o conferidor do pipeline já tinha aprovado (cap.ass presente, hash igual). O erro foi confiar na cópia da fila manual, que não traz o cap.ass. Lição: antes de mudar status, comparar hash e pasta de origem. Revertido: os 7 voltaram a aprovado-checagem e saíram da lista noturna.
- **Cache do conferidor ignorava a legenda (20/10):** o cache era indexado só pelo hash do vídeo. Corrigido com a assinatura vídeo + legenda. Lição: todo cache precisa de uma chave que cubra todas as entradas do resultado.
- **Push e PR com portão reprovado (20/10, PR #135):** encadeei `npm run portao && git push && gh pr create` sem checar o resultado. O portão reprovou (6 testes de artigos, DNS do banco fora por instantes), mas o push e o PR aconteceram. Nada foi mesclado nem publicado. Lição: push e PR só depois de ler o relatório e ver "PORTÃO APROVADO". Agora é feito por scripts/publicarBranch.js (testes em tests/unit/publicar-branch.test.js).
- **gh com shell no Windows (21/10):** publicarBranch.js passou título e corpo do PR por shell; o gh leu parte do texto como opção e a criação do PR falhou depois do push e do portão aprovado. Lição: só o npm precisa de shell no Windows; git e gh rodam sem shell (regra em precisaShell, com teste).

## 23/10/2026 — branch local desatualizada aprovou código velho
- **O que aconteceu:** depois de `git push origin HEAD:<branch>`, a branch local ficou no commit antigo. O portão rodou esse código e a regressão visual aparecia (ou sumia) conforme o commit que estava na pasta. A aprovação "3/3" mostrada não era do código enviado.
- **Causa:** `git push origin HEAD:<branch>` não atualiza a referência local da branch.
- **Correção:** `publicarBranch.js` e `portao.js` param quando a branch local não está no mesmo commit de `origin/<mesmo nome>` (`scripts/lib/branchSincronizado.js`, com testes). Regra no CLAUDE.md (Regra de merge).
- **Como verificar a qualquer momento:** `git rev-parse HEAD` e `git rev-parse origin/<branch>` devem dar o mesmo hash.

## Incidente 24/10/2026: site 404 após deploy da migração/merges (Etapa 0f)
- **Causa:** a CLI de build da Vercel passou de 65.0.0 para 65.1.0 entre o #147 e o #153. Com o array legado `builds` no vercel.json, os deploys de #146, #150, #153 e #154 terminaram sem saída (`Build output contains no functions, static, or services`). Produção ficou no deploy anterior (#147) por rollback.
- **Tempo fora do ar:** o www deu 404 de ~02:20 UTC até o rollback (21:52 de 24/10, horário local). Confirmar a duração exata pelo log de conferência antes de citar.
- **O que foi testado:** migração para zero config (api/index.js, redirects, rewrites, headers, crons) com quatro variantes de preview (buildCommand, installCommand, sem outputDirectory, sem functions). Nenhuma gerou functions nem static. Controle mínimo falhou antes do build: o painel tem Root Directory = apps/plataforma-saude-mental.
- **Lição:** remover `builds` faz as configurações do painel passarem a valer; ler o painel antes de migrar. Testar com um preview de controle antes do preview real. Erro de Root Directory aparece no log de deploy; ler o log antes de mexer no código.
- **Prevenção:** merge-seguro deve testar a URL do deploy novo e o www em todas as rotas (status e conteúdo) e reverter sozinho se falhar; o alerta do e-mail segue desligado até o RESEND_API_KEY.

## Root Directory do painel (25/10/2026)
- Causa sustentada: o painel do projeto drsaudemental aponta para apps/plataforma-saude-mental. Com isso, o vercel.json da raiz (builds, api/, public/) não é lido e a saída fica vazia. Deploys bons (22/10 20:24, CLI 65.0.0, raiz) e ruins (23/10 22:21 em diante, CLI 65.1.0). A mudança de versão da CLI coincidiu no tempo, mas o controle v2 (CLI 65.1.0, config dentro de apps/) builda: a CLI não é a causa.
- Lição: ler o Root Directory do painel e comparar um deploy bom e um ruim ANTES de migrar o vercel.json. Migrar o formato não corrige um painel errado.
- Limite: a API não expõe o histórico de mudanças do painel; a data exata da mudança não foi confirmada.
- Reprodutor (25/10/2026): o código do #147, sem mudança, sai vazio na CLI 65.1.0 hoje. O código fica excluído; a causa é o ambiente (painel). Para reproduzir um commit já implantado, o Git integration não criou deploy; foi preciso um commit vazio sobre ele.
