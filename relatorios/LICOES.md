# Lições (registro para não repetir)

- **Verificação de duplicidade só no banco (20/10):** os 24 textos "novos" já estavam no site, em `src/content/artigos` e `content/blog`. Lição: checar sempre as quatro fontes (banco, MDX, rotas compiladas e similaridade). Está em `backend/lib/existeConteudo.js`.
- **Contagem do ZIP inteiro aplicada a um subconjunto (20/10):** eu disse que os 24 traziam ferramentas interativas; a contagem era dos 140. Lição: contar sempre dentro do conjunto analisado.
- **Regex de DOI cortava em parênteses (20/10):** DOIs da Elsevier têm parênteses. Lição: conferir o resultado da extração antes de concluir "sem resposta".
- **Busca por "educativo" não casava com "educativa" (20/10):** o aviso existia. Lição: testar os termos com variações antes de afirmar que algo falta.
- **`git pull` apagou arquivos do disco (20/10):** arquivos removidos do índice numa branch foram apagados do disco ao atualizar a `main`. Lição: antes de fazer `rm --cached` numa branch que vai para a `main`, saber que o pull apaga o arquivo local. Perdeu-se a última edição não commitada de 6 arquivos de estado.
- **`publicadoEm` obrigatório para renderizar (20/10):** sem esse campo, a página falha ("Invalid time value"). Lição: copiar do registro existente, não inventar campos.
- **Importação gravada antes da conferência de duplicidade (20/10):** 17 e depois 9 rascunhos foram inseridos e desfeitos, com backup antes. Lição: conferência de duplicidade antes de qualquer gravação, nunca depois.
- **Diretório do shell muda com `cd` (20/10):** comandos seguintes rodaram na pasta errada. Lição: usar caminhos absolutos.
