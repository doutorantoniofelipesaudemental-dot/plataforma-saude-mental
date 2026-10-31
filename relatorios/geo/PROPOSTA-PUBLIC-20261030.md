# Proposta para public/ (GEO, 30/10/2026): NÃO aplicada

A ordem do Dr. Antônio (30/10/2026) não nomeia arquivos de `public/`. Por CLAUDE.md §D, nada em `public/` foi alterado. Abaixo, o que iria para `public/` se houver nova ordem escrita.

## 1. public/artigo.html: link para a biografia
- Onde: rodapé (`<footer class="rodape">`, linha ~144), bloco de links.
- Trecho proposto: `<a href="/sobre">Sobre o Dr. Antônio Felipe</a>`, com `rel="author"` opcional.
- Motivo: E-E-A-T, caminho de autoria visível a leitor e a mecanismos de busca.
- Pré-requisito: confirmar que `/sobre` existe no domínio www. A página foi criada no app Next (`apps/plataforma-saude-mental/app/sobre/page.js`). Se o www for servido pelo `public/`, a página precisa ser publicada também lá (decisão de roteamento, não feita aqui).

## 2. public/index.html: JSON-LD
- O `public/index.html` (linha 23) já tem um bloco JSON-LD `MedicalWebPage` estático da home. Não há mudança obrigatória.
- Opcional: incluir `"about"` com `@id` do `Person` de /sobre quando o nó `Person` for publicado em `/sobre`.

## 3. public/artigo.html: JSON-LD dos artigos
- Hoje o JSON-LD dos artigos é gerado no servidor por `backend/lib/renderizarArtigo.js` (não está no template estático). A troca do bloco atual pelo `montarJsonLdArtigo` do `backend/lib/jsonLdGeo.js` é feita no backend, sem tocar em `public/`.
- Diferenças que o Dr. deve aprovar ao trocar:
  - o bloco atual usa `@type: ['MedicalWebPage','Article']` em um único nó; o novo usa um `@graph` com nós separados (`MedicalWebPage`, `Article`, `Person`, `Organization`, e `FAQPage` quando houver FAQ real);
  - `author.jobTitle` atual diz "Médico — Especialista em Medicina de Família e Comunidade". O novo diz só "Médico" e põe RQE e CRM em `identifier`. Isso segue a regra de identificação única por página (CLAUDE.md §Decisões 15/10/2026). Confirmar se é aceito.
  - `reviewedBy` só aparece com `aprovar()` válido e hash igual ao texto atual.

## Próximo passo (não feito)
- Integrar `montarJsonLdArtigo` em `renderizarArtigo.js`, substituindo o bloco atual, em PR próprio, depois de aprovação das diferenças acima.
