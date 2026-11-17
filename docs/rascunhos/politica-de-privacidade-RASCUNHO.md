# RASCUNHO. NÃO PUBLICAR sem revisão do Dr e de orientação jurídica.

Status: rascunho de 17/11/2026, feito por levantamento estático (sem login, sem acesso ao banco). Não há página nova no site: `/politica-de-privacidade` continua 404 e isto não cria a rota.

**Atenção:** o site JÁ publica uma política em `/privacidade` (HTTP 200, `public/privacidade.html`, última atualização 26/10/2026, 12 seções). Este rascunho não substitui essa página automaticamente. Serve para conferir se a política publicada cobre os fluxos reais e para decidir se ela deve ser atualizada (mudança em `public/` exige ordem escrita do Dr).

---

## Política de privacidade (texto proposto)

**Quem cuida dos seus dados.** O Portal de Saúde Mental Doutor Antônio Felipe Garabito é mantido pelo Dr. Antônio Felipe. Para falar sobre privacidade ou exercer seus direitos, escreva para doutor.antoniofelipe.saudemental@gmail.com.

**O que o site coleta.**
- Nada por formulário. O site não tem cadastro, login nem formulário de contato para visitantes.
- Se você escrever por e-mail, recebemos o seu nome, o seu e-mail e o que você escrever. Use o e-mail só para falar de mentoria, consultoria ou formação. Não envie informações de saúde por e-mail.
- A hospedagem (Vercel) pode registrar dados técnicos de acesso, como endereço IP e tipo de navegador, para segurança e funcionamento.

**O que acontece no seu aparelho.** Os questionários de autoavaliação da página inicial (PHQ-9 e GAD-7) funcionam só no seu navegador. As respostas não são enviadas a nenhum servidor e não são gravadas. Elas somem quando você fecha ou recarrega a página. Preferência de tema (claro ou escuro) fica só no seu navegador.

**Por que usamos esses dados.** Para responder o seu e-mail, com base no seu consentimento ao nos escrever (art. 7º, I, LGPD). Para segurança e funcionamento do site, com base no legítimo interesse (art. 7º, IX, LGPD).

**Com quem compartilhamos.** Não vendemos nem cedemos dados. Compartilhamos apenas com: Vercel (hospedagem), Google (e-mail) e autoridades, quando houver ordem legal.

**Por quanto tempo guardamos.** E-mails são guardados pelo tempo necessário para responder e apagados depois. [PONTO DO DR: prazo, ver abaixo.]

**Seus direitos.** Você pode pedir confirmação de tratamento, acesso, correção, anonimização, eliminação, portabilidade e revogação do consentimento, a qualquer momento e sem custo. Respondemos no prazo da lei. [PONTO DO DR: prazo de resposta.]

**Conteúdo de saúde.** Este site traz informação geral sobre saúde mental. Não substitui consulta, não faz diagnóstico e não atende casos individuais. Em crise: CVV 188 · SAMU 192.

**Alterações.** Quando esta política mudar, a data no topo será atualizada.

---

## Levantamento dos fluxos (evidência)

| Fluxo | Onde está | Situação |
|---|---|---|
| Formulário de contato | `public/assets/js/home.js` (`/api/contato`) | HTML não tem o formulário; JS tem guarda `if (!formularioServicos) return`; backend responde **410** a POST. Nada enviado. |
| Formulário de agendamento | `public/assets/js/home.js` (`/api/agendamentos`, campo `tipoAtendimento: 'particular'`) | Mesma situação: sem HTML, JS inativo, backend **410**. Código morto, ver ponto 3. |
| Questionários PHQ-9 e GAD-7 | `public/index.html` (`#plano-form`), `public/assets/js/extras.js` | Sem nenhuma chamada de rede no script (`fetch`, `XMLHttpRequest`, `sendBeacon`, `/api`: 0 ocorrências). Respostas não gravadas. Dado de saúde tratado só no navegador. |
| Enquete de artigo | `artigo-enquete.js`: POST `/api/artigos/{slug}/enquete` | Voto sem identificação declarada. Confirmar no backend (não verificado nesta rodada). |
| Pedido de narração | `artigo-narracao.js`: POST `/api/artigos/{slug}/solicitar-narracao` | Confirmar se grava IP ou identificador (não verificado nesta rodada). |
| Scripts externos (`src` https) | `public/**` | 0 ocorrências. |
| Fontes externas (Google Fonts etc.) | `public/**` | 0 ocorrências. |
| Analytics, pixels, Clarity, Hotjar | `public/**` | 0 ocorrências (a palavra aparece só no texto de `privacidade.html`). |
| Cookies | `public/**` | Nenhum `document.cookie`. Usa `localStorage` só para `tema` (`extras.js`) e `sessionStorage` só na área admin (`admin.js`). |
| Formspree / serviço de formulário | `public/**` | 0 ocorrências. |
| Logs de hospedagem | `vercel.json` | Sem configuração de analytics ou log próprio. Logs ficam na Vercel. |

---

## Pontos que dependem do Dr (não decididos aqui)

1. **Dado de saúde em formulário.** Hoje nenhum formulário envia dado de saúde. Os questionários PHQ-9 e GAD-7 são dado de saúde, mas ficam no navegador. Confirme que é essa a regra desejada. Se um dia um formulário voltar a enviar respostas, isso é dado sensível pela LGPD (art. 5º, II) e exige base legal específica e revisão.
2. **Registros antigos.** Antes de 15/10/2026 os formulários de contato e agendamento estavam ativos. Se o banco ainda guarda essas mensagens (com campo livre de texto), a política precisa dizer por quanto tempo ficam e quando são apagadas. Não consultei o banco nesta rodada. Verificação necessária pelo Dr ou com a sua autorização.
3. **Código morto.** `home.js` ainda contém a lógica dos formulários desativados, e os endpoints do backend seguem existindo (respondem 410). Remover exige ordem escrita (`public/`) e mudança em `backend/`.
4. **Consultório e atendimento.** `privacidade.html` (seção 1 e 3, 5 e 10) fala em "consultório", atendimento e prontuário. A ordem de 08/11/2026 diz que o Dr não faz consulta particular e nenhum canal oferece atendimento. Decisão do Dr sobre o texto.
5. **Prazo de guarda de e-mails.** O texto atual diz 12 meses. Confirme o prazo.
6. **Prazo de resposta.** O texto atual diz 15 dias. Confirme (a LGPD não fixa um prazo em dias para todos os casos; confirmar com orientação jurídica).
7. **Prontuário.** O texto atual cita 20 anos de guarda do prontuário. A referência normativa precisa ser conferida na fonte oficial antes de publicar. Não verificado nesta rodada.
8. **Contadores anônimos.** A política diz que o site não guarda IP, mas que o servidor mantém o IP só na memória para limitar excesso de pedidos. Confirmar no código de limite de pedidos (`limiteEnvio`) antes de publicar.
9. **Canal de contato.** Confirmado o e-mail doutor.antoniofelipe.saudemental@gmail.com como único canal. Confirmar que é o canal que o Dr quer manter.
10. **Orientação jurídica.** Esta versão não substitui parecer de advogado especializado em LGPD.
