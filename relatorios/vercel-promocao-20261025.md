# Plano de promoção segura (25/10/2026). Sem candidato validado: não executar ainda.

**Pré-requisito.** Um preview com saída (functions e static no resumo, sem o aviso "no functions, static, or services"). Hoje nenhum tem: o reprodutor `3ac645c` saiu vazio.

**1. Gerar o candidato de produção.** Opções, por ordem de segurança:
- (a) Redeploy pelo painel do último deploy de produção bom. A pesquisa não confirmou se o Redeploy usa as configurações e variáveis atuais; checar no log qual Root e qual CLI aparecem.
- (b) Um deploy de produção novo a partir da main, sem ir ao ar: não há fluxo oficial confirmado para isso. Não usar sem nova pesquisa.

**2. Validar antes de promover (Dr. ou ferramenta autenticada).**
- Log: sem aviso de saída vazia; resumo com functions e static.
- `/` e `/artigo/migracao-saude-mental` respondem 200. `/privacidade` 200 (`/politica-de-privacidade` não existe na main).
- `/api/health` 200.
- `drsaudemental.vercel.app/*` redireciona 301 para `www`; `/blog/migracao` → `/artigo/migracao-saude-mental` 301.
- Headers: `/sw.js` com `Service-Worker-Allowed: /`; `/podcast/feed.xml` com RSS.
- Crons (6) no resumo do deploy.
- Nomes das variáveis de produção presentes (sem valores), incluindo `INSTAGRAM_ACCESS_TOKEN`.
- O preview tem SSO. Não contornar a proteção.

**3. Promover e desfazer.**
- Promover: painel > Deployments > o deploy validado > Promote to Production. Ou `vercel promote <url>`.
- Desfazer: Instant Rollback para o #147 (`dpl_9pwS6LguSCW11r13XehkUFNgbhdy`).
- Não promover a menos de 15 min de um cron ou da conferência.

**4. Janelas (25/10, Salvador).** 08:00 cron publicar-agendados; 09:30 conferência; 11:00–12:00 janela de promoção; 12:00–14:00 margem para rollback; depois das 14:00, sem promoção. Se não validar, promoção segunda após 10:00.

**5. O que muda para o visitante, quando for ao ar:**
- #153: título dos artigos com fonte estável (menos salto visual).
- #146: narração padrão Edge-TTS; sem mudança visível.
- #150 e #154: documentação e merge-seguro; nenhuma mudança visível.
- Só depois da promoção: `INSTAGRAM_ACCESS_TOKEN` novo; crons do vercel.json passam a rodar no deploy novo.
