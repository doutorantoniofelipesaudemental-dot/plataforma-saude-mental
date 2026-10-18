# Prompt mestre unificado — Portal de Saúde Mental Doutor Antônio Felipe Garabito (18/10/2026)

Vale como parte do `CLAUDE.md`. **Em conflito, prevalece o `CLAUDE.md`** e, entre duas regras, a mais restritiva. Segurança (chaves, segredos, freios, backup) nunca é afrouxada.

## Como os conflitos foram resolvidos (decisão provisória, até o Dr. Antônio dizer o contrário)
| Ponto do prompt | Resolução |
|---|---|
| Assinatura com "TCC" abreviado e "(PAP)/(APS)" na de 5 linhas | **Vale o `CLAUDE.md`:** 5 linhas com "Terapia Cognitivo-Comportamental" por extenso e sem siglas; a de 3 linhas (com PAP/APS) só nas redes. Os testes de assinatura continuam como estão. |
| 8.1 "alterar código/landings/conteúdo existente: plano e aguardar autorização" | Mantida como regra mais restritiva **para conteúdo já publicado/agendado e para landings**: apresentar plano e arquivos afetados e esperar. Mudanças de código de rotina seguem a carta de autonomia (portão + `merge-seguro` executado pelo Dr. Antônio). |
| 6.3 "carrossel, Reels e Stories só na fila manual" × `CLAUDE.md` (publicar por Meta Graph/script local) | **EM ABERTO: pergunta ao Dr. Antônio.** Até a resposta, nada muda no publicador atual; Reels e Stories vão para a fila manual. |
| Newsletter, Podcast "Relatos da Prática", Kit NR-1 em PDF, thumbnail com rosto | **Planejados, não implementados.** Cada módulo entra como arquivo/módulo novo, com PR próprio, sem tocar em conteúdo existente. Thumbnail com rosto só com foto aprovada pelo Dr. Antônio. |
| Vídeo "sempre com rosto ou voz própria" | Voz padrão do projeto: Edge-TTS `pt-BR-AntonioNeural` (regra do `CLAUDE.md`); rosto só com material aprovado. |
| Exceção "burnout" | Mantida: "esgotamento profissional (burnout)". |

## 1. Identidade
- Nome oficial: Portal de Saúde Mental Doutor Antônio Felipe Garabito. Domínio: `www.drantoniofelipemedico.com.br` (rotas: /blog, /mentoria, /youtube, /instagram, /linkedin, /links, /privacidade).
- Identificação: exatamente a do `CLAUDE.md` §1.A (site) e §1.B (redes). Nunca "psiquiatra" como título dele; nunca #psiquiatria.
- Toda narração e audiovisual citam o Portal (crédito discreto). Contato só por e-mail. Português do Brasil (exceção: burnout).

## 2. Objetivo e receita
Converter audiência qualificada em: (a) mentoria para profissionais de saúde; (b) consultoria institucional (empresas, RH, instituições); (c) Kit NR-1 gratuito como porta de entrada para a consultoria (planejado); (d) consultas. Secundárias: monetização do YouTube e parcerias éticas. Três públicos tratados separadamente: pacientes/público geral, profissionais de saúde, gestores/RH/empresas. Proibido prometer resultado financeiro, clínico ou de cura.

## 3. Regras invioláveis
1. **Não-regressão:** conteúdo aprovado, publicado ou agendado (artigos, landings, vídeos, posts, carrosséis, filas) não é alterado, reescrito nem apagado sem ordem explícita; o novo entra como arquivo/módulo novo, preservando hashes (§D do `CLAUDE.md`).
2. **Fonte única:** todo conteúdo deriva de artigo publicado no blog; sem artigo-base, propor primeiro o artigo.
3. **Segurança:** tema de sofrimento intenso, crise ou risco inclui CVV 188 · SAMU 192 · CAPS/UPA · pronto-socorro.
4. **Conformidade CFM** (2.336/2023 e 2.454/2026): sem sensacionalismo, medo como gatilho, garantia, autodiagnóstico ou automedicação; paciente nunca exposto; relatos anonimizados ("Narrativa composta"); aviso de IA com revisão e responsabilidade médica final.
5. **Sem atendimento em comentários, DM ou e-mail público:** acolher, orientar a buscar consulta ou a rede de saúde, informar emergência quando houver risco; nunca coletar dados de saúde.
6. **Direitos autorais:** nada copiado de terceiros (texto, legenda, transcrição, música, imagem).
7. **Fatos normativos** (NR-1, GRO, prazos, resoluções) só após checagem na fonte oficial (gov.br, portal.cfm.org.br).

## 4. Agente de pesquisa de referência
Mapear, nos últimos 30 dias, conteúdos de alto desempenho em saúde mental, esgotamento profissional, ansiedade, sono, NR-1/riscos psicossociais, educação médica e saúde mental no trabalho. Extrair **só padrões** (tema, gancho, estrutura, formato, duração, CTA, horário). Descartar o sensacionalista. Entrega: tabela por canal (padrão → artigo do blog que o atende → peça proposta). Sem copiar.

## 5. Pipeline: 1 artigo → 1 pacote
Site: narração. YouTube: 1 longo + 3 Shorts. Instagram: 1 carrossel + 2 Reels + Stories (com enquete) + chamada ao áudio. LinkedIn: 1 post + 1 PDF (+ artigo opcional). Newsletter: 1 edição (planejada). Podcast "Relatos da Prática" quando houver relato correspondente (planejado). Cada peça adaptada ao canal, sem copiar e colar.

## 6. Regras por canal
- **Blog:** dias úteis; 3–5 referências (o `CLAUDE.md` exige ≥ 4); texto humanizado; narração em áudio no topo; links internos para /mentoria ou Kit NR-1 quando couber.
- **YouTube:** longo 8–15 min (gancho em 15 s, capítulos, síntese, CTA); Shorts até 60 s (1 ideia, legenda na tela, CTA para o longo). Título com termo real de busca; descrição com identificação, link do artigo, `/youtube` e emergência. Thumbnail: até 4 palavras, sem expressão de choque.
- **Instagram:** carrossel 7–10 lâminas (gancho → conteúdo → síntese → identificação + CTA); Reels 15–60 s com gancho em 3 s e áudio livre de direitos; Stories com enquete/caixinha educativa e link do artigo; legenda: primeira linha forte, corpo curto, identificação, CTA, 3–5 hashtags de nicho; "Comente X" só para enviar material educativo/link; destaques: Mentoria · Consultoria/NR-1 · Emergência · Sobre. Formato técnico automático: ver "em aberto" acima.
- **LinkedIn:** gestores, RH, SESMT, empresas e profissionais; tom técnico-executivo (absenteísmo, presenteísmo, afastamentos, NR-1/GRO); post com gancho em 2 linhas, parágrafos curtos, 1 insight prático e pergunta final; PDF de 6–10 páginas com CTA para o Kit NR-1; 80% educação, 20% oferta. Só o agendador nativo (regras do `CLAUDE.md`).
- **Newsletter (planejada):** resumo do pacote da semana + 1 relato anonimizado + 1 recurso gratuito + 1 oferta.

## 7. Calendário e métricas
Cadência base: site conforme a fila (dias úteis); YouTube 1 longo/semana + 3 Shorts; Instagram 3–4 posts/semana + Stories diários; LinkedIn 3 posts/semana + 1 PDF/semana; newsletter semanal. Métricas semanais por canal (YouTube: views, retenção, CTR, inscritos, cliques; Instagram: alcance, salvamentos, compartilhamentos, cliques; LinkedIn: impressões, comentários qualificados, contatos de empresas) e funil (e-mails, downloads do Kit NR-1, reuniões, contratos). Os 3 melhores conteúdos da semana definem o padrão (não o texto) do próximo pacote.

## 8. Protocolo
- **Aprovação:** ver tabela de conflitos. Peça nova que passar na auditoria e na tripla checagem, sem marca d'água e com as correções feitas, pode ser publicada sem aprovação prévia (carta de autonomia, freios respeitados).
- **Tripla checagem:** (1) técnica: `npm test` + build, zero regressão (o projeto roda `npm run portao`); (2) científica/ética/humanizada: fidelidade ao artigo-base, referências válidas, conformidade com 1 e 3; (3) estado: rotas e landings intactas, `ESTADO-GERAL.md` e `PROMPT-ATUAL.md` atualizados.
- **Relatório final:** [AUDITORIA DE EXECUÇÃO] com: preservação do existente; fonte (artigos); referências de mercado (padrões, sem cópia); peças por canal; tripla checagem (técnica, científica/ética/CFM, estado/links); métricas da semana; falhas detectadas e corrigidas; próximo passo requerido.
