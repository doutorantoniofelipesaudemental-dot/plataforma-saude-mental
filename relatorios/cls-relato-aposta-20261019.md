# CLS do relato-aposta-tres-da-manha — correção urgente (19/10/2026)

**Status: CORRIGIDO. Portão APROVADO.** Branch `fix/urgente-cls-relato-aposta-20261019` (a partir de `main` d9d8be0).

## Causa
- Ao trocar a fonte, o resumo (`.texto-apoio`) do artigo passava de 6 linhas (fallback) para 5 (Inter).
- Isso deslocava 30 px para cima `.artigo-meta`, `.artigo-capa` e `.artigo-narracao`: um shift único de 0.1828 em ~282 ms.
- Só este texto muda de número de linhas entre as duas fontes; os relatos de comparação tinham CLS 0 a 0.0008.

## Correção (uma linha de CSS, sem texto alterado)
- `public/assets/css/style.css`, `@font-face` do `Inter Fallback` (400): `size-adjust` 106.1% → 104.5%; `ascent-override` 91.4% → 92.8%; `descent-override` 22.6% → 22.9%.
- As métricas efetivas ficam iguais (override × size-adjust). O fallback passa a quebrar o resumo em 5 linhas, como a Inter.

## CLS antes e depois
- Antes: 0.18352107807702675 (reproduzido na `main`, duas vezes).
- Depois: lote 3/6 do teste de artigos passou em duas execuções seguidas (limite < 0.1). O valor exato não é impresso pelo teste quando passa.

## Resultado do portão
- `npm run portao` (1 rodada completa): **APROVADO**, 31/31 no E2E. Relatório: `relatorios/portao-20261019-0954.md`.
- Testes e limite não foram alterados nem pulados.

## Observação
- O CLAUDE.md proíbe alteração em `public/` fora de `links.html`; esta mudança seguiu a ordem escrita do Dr. Antônio de corrigir o template compartilhado. Confirmar se a exceção vale também para o futuro.
- Em celular sem Arial local o fallback usa outra fonte: a correção calibra o desktop/teste. Se o CLS aparecer em aparelhos reais, a alternativa é `font-display: optional` ou espaço reservado no resumo.
