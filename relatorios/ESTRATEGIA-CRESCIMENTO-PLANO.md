# Estratégia de crescimento: plano das peças e do painel (20/10/2026). Não executado.

## 3) Um artigo, sete peças

Para cada texto publicado, o pipeline gera e enfileira:
1. Carrossel do Instagram (já existe, 4:5, com fila e publicação pela Meta).
2. Short do YouTube (já existe, fila com reprovação e reaproveitamento).
3. Post do LinkedIn (já existe, agendador nativo, 3 por dia).
4. Episódio de podcast (feed pronto no PR #134; entra quando o texto é publicado).
5. Trecho para Stories (não existe; criar a partir do carrossel, com enquete).
6. Newsletter: **módulo futuro**, só e-mail, sem dados de saúde, com sua aprovação.
7. Registro de vínculo: cada peça guarda o slug do texto de origem e a data. Assim dá para medir qual formato traz visitas.

**Checagens:** cada peça passa por `existeConteudo.js` antes de ser criada (evitar duplicata), pela auditoria, pela tripla checagem e pelo portão.

**O que falta:** o registro de vínculo ainda não existe. Criar a coleção de vínculos e a leitura de visitas por peça depende das integrações de audiência (seção 4).

## 4) Painel semanal de audiência

Fontes, por ordem de disponibilidade:
- **Vercel Analytics:** já disponível no projeto (a confirmar o acesso pela API).
- **YouTube Analytics:** precisa de autorização OAuth, igual ao upload.
- **Instagram Insights:** já existe token da Meta; confirmar as métricas de conta.
- **Search Console:** depende do passo a passo em `SEARCH-CONSOLE-PASSO-A-PASSO.md`.
- **Spotify:** só depois do cadastro do feed (sem API de audiência pública para podcast; a confirmar).

**Saída:** `relatorios/AUDIENCIA-AAAA-SS.md` com o que cresceu, o que caiu, os 5 temas que mais trouxeram gente e 3 recomendações que realimentam o radar. Resumo de 3 linhas no `RESUMO-DO-DIA` de segunda.

**Estado:** nenhuma integração de audiência está conectada ainda. Cada fonte precisa de autorização sua (login ou OAuth), por isso o relatório só sai com as fontes que você liberar.
