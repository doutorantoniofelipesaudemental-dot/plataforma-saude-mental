# Procedimentos de mídia, design e publicação (movido do CLAUDE.md em 15/10/2026)

Texto **integral e sem alterações** das seções movidas do CLAUDE.md para reduzir o contexto carregado a cada sessão.
Continuam valendo como regras do projeto, com a mesma precedência do CLAUDE.md. O CLAUDE.md traz o resumo das regras duras e aponta para cá.

### 2. DESIGN & MOTION (SKILLS DE APOIO: PORTAL, MINIAPPS E MULTIMÍDIA)
Uso estratégico das skills abaixo (referências externas, ainda não instaladas nem auditadas neste repositório: conferir o conteúdo e a licença antes de instalar). Nenhuma sobrepõe as regras do CFM, de acessibilidade e de LGPD.
- **Design DNA (`zanwei/design-dna`):** extrair tokens visuais (paleta acolhedora, tipografia legível, espaçamentos) de referências de alto padrão e manter a consistência entre Portal, miniapps e peças sociais.
- **Genjutsu (`AThevon/genjutsu`):** direção de arte e refinamento de UI/UX, com contraste AAA e alvos de toque de 44 px (os testes E2E já exigem os dois).
- **GSAP (`greensock/gsap-skills`):** animações de linha do tempo e `ScrollTrigger` para transições, revelações de conteúdo e interações nos miniapps clínicos. Respeitar `prefers-reduced-motion`.
- **Motion Design (`lottiefiles/motion-design-skill`):** microinterações em Lottie/SVG leves (áudio narrado, respiração guiada, checklists, feedbacks). Sem efeito que cause ansiedade, piscadas ou som automático.
- **Three.js (`CloudAI-X/threejs-skills`):** elementos 3D interativos e leves em matérias clínicas e anatômicas, com alternativa estática e sem bloquear a leitura em celular.
- **Mídias sociais:** Reels e Shorts exigem especificação de movimento (microanimação Lottie/GSAP ou elemento 3D) com gancho visual nos 3 primeiros segundos; LinkedIn segue os tokens de Design DNA/Genjutsu, com tom de autoridade e conformidade estrita ao CFM. Detalhes em `CONTEUDO_INSTAGRAM/pautas/PADRAO_PACOTE_MULTIMIDIA.md`.


---


---

#### F. PADRÃO DE CARROSSÉIS E PACOTES DO INSTAGRAM
- Slides 4:5 (1080x1350), paleta azul-marinho + dourado + branco, alto contraste e leitura mobile; máximo de 25 palavras de arte por slide (a assinatura obrigatória do último slide é exceção).
- Nas artes, legendas e textos de apoio: "Dr. Antônio Felipe" (COM acento). Regra atualizada em 14/10/2026 (ver "Regras permanentes"); "Antonio" sem acento nas artes é erro.
- Legenda validada por `checarEticaCfm` (contexto `social`) antes de entregar, com: aviso de IA (Res. CFM 2.454/2026), orientação geral/protocolos locais e "Em crise: CVV 188 · SAMU 192".
- Último slide: assinatura de 3 linhas (CRM-BA 41322, RQE 26638, PAP e APS) sem quebras órfãs.
- Carrossel de lançamento da /links (7 slides): capa (cérebro dourado + chamada), agendamento por e-mail, mentoria B2B, portal com áudios, conteúdos educativos, CTA para o link da bio e assinatura.
- Salvar em `C:\DRSAUDEMENTAL\carrosseis-instagram\<nome-do-post>\` (pasta no `.gitignore`, fora do Git).
- Só quando o escopo pedir o Pacote Multimídia Completo: gerar também roteiro de Reel, Stories interativos (com enquete) e chamadas para os artigos narrados (ver `CONTEUDO_INSTAGRAM/pautas/PADRAO_PACOTE_MULTIMIDIA.md`).

#### G. ECOSSISTEMA MULTIMÍDIA COMPLETO (AUTORIZADO PARA CADA POST OU TEMA)
- Formatos: carrossel/post de feed (4:5, 1080x1350, 7 slides); vídeos e Reels (9:16, 1080x1920) com roteiro, narração, gancho nos 3 primeiros segundos, marcação Lottie/GSAP, trilha a -22 dB, legendas em caixa mista e cartão final CFM; Stories interativos (9:16, 3 a 5 quadros) com áreas livres para adesivos nativos (enquete, caixa de perguntas, link, isenção de emergência); podcasts e narrações com roteiro e chamada explícita ao player no topo das páginas do Portal.
- Identificação, avisos mandatórios (IA Res. CFM 2.454/2026, orientação geral/protocolos locais, "Em crise: CVV 188 · SAMU 192") e regras de grafia valem para todos os formatos.
- Legendas e roteiros validados por `checarEticaCfm` (contexto `social`) antes de entregar.
- Todo o pacote (artes, roteiros, vídeos, podcasts e legendas) em `C:\DRSAUDEMENTAL\carrosseis-instagram\<nome-do-post>\`, fora do Git. Voz/áudio de Reels e Podcasts: AUTORIZADA, com custo zero, usando a mesma voz do pipeline de narração de artigos (`backend/lib/narracao.js`): `pt-BR-AntonioNeural` via **Edge-TTS** (`--provedor=edge` em `backend/tools/narrar-artigos.js`). Execução homologada pelo módulo Python do ambiente do projeto (`reels_automation/.venv/Scripts/python.exe -m edge_tts --voice pt-BR-AntonioNeural --file <texto> --write-media <mp3>`), pois o `edge-tts.exe` pode ser bloqueado pelo Controle de Aplicativo do Windows. NÃO usar o provedor padrão Azure Speech (a cota gratuita se esgotou e passa a cobrar), nem ElevenLabs, Higgsfield ou qualquer voz paga/clonada sem aval explícito. Trilha a -22 dB. Vídeo montado com ferramentas pagas continua dependendo de aval.

#### H. AUTONOMIA DE PRODUÇÃO E TRIPLA CHECAGEM PRÉ-PUBLICAÇÃO
- Geração e montagem do pacote multimídia (carrossel 4:5, Stories 9:16, Reels/vídeos MP4 via FFmpeg com movimento, podcasts e narrações via Edge-TTS `pt-BR-AntonioNeural`, legendas) são 100% automáticas, sem API paga.
- Antes de declarar um pacote PRONTO, rodar `node carrosseis-instagram/_checagem-tripla.js <nome-do-post> [artes.html…]` (script local, fora do Git), que grava `checagem-tripla.md` na pasta do post:
  1. Ética/legal: `checarEticaCfm` (contexto `social`) em legendas e roteiros; aviso de IA, orientação geral/protocolos locais e "Em crise: CVV 188 · SAMU 192"; sem mensageria de terceiros; links só do domínio oficial e do Instagram oficial; agendamento só por e-mail.
  2. Branding/integridade: artes, legendas e roteiros com "Dr. Antônio Felipe" (com acento, conferido na imagem renderizada); 25 palavras por quadro (exceto assinatura e avisos obrigatórios); dimensões 1080x1350 e 1080x1920; vídeo a 30 fps constante; trilha a -22 dB; inspeção visual dos quadros (quebras órfãs, zoom, transições) pelo agente.
  3. Segurança/preservação: mídias só em `carrosseis-instagram/` (ignorada pelo Git), repositório sem pendências, `backend/data`, `narracao.js` e testes intactos, sem custo de API.
- Roteiros e legendas devem trazer o bloco oficial de identificação de 3 linhas (com acento) para passar no validador.
- PUBLICAÇÃO (atualizada pelo usuário): a aprovação 50/50 na Tripla Checagem é o GATILHO AUTOMÁTICO de publicação direta no Instagram oficial (API Meta Graph ou script local de automação), sem comandos manuais adicionais nem nova confirmação, seguida do registro do log de publicação na pasta do post. Qualquer reprovação, alteração de conteúdo após a checagem ou ausência de credencial válida bloqueia o envio. Tokens do Meta ficam só em variáveis de ambiente/arquivos locais ignorados pelo Git, nunca no repositório nem em chats. Fluxo: conteúdo → Edge-TTS → FFmpeg → Tripla Checagem → disparo → log.


---


## Crédito de marca em áudio e vídeo (16/10/2026)
Toda narração e produção audiovisual (artigos, longos, Shorts, Reels, trailer, podcast, LinkedIn) cita na fala e na tela o Portal de Saúde Mental Doutor Antônio Felipe Garabito: abertura+encerramento (longos/artigos), versão curta só no fim (Shorts/Reels ≤ 60 s); tela nos 3 primeiros segundos e na tela final com www.drantoniofelipemedico.com.br; legenda .srt inclui a fala; 1ª linha da descrição/legenda do post. Crédito discreto, sem marca d'água sobreposta. Código: `backend/lib/vinheta.js`, `scripts/youtube/lib.js` (`creditoAss`, `comVinheta`).
