---
name: guia-drsm
description: Guia Mestre DrSM v1.0. Ler docs/GUIA-MESTRE-DRSM.md no início de toda sessão e antes de cada etapa. Referência obrigatória do ecossistema.
---
Leia `docs/GUIA-MESTRE-DRSM.md` (até o merge deste PR, use `.tmp\guia\GUIA-MESTRE-DRSM.md`) no início de toda sessão e antes de cada etapa de trabalho.

1. Siga a ordem de precedência do próprio guia: ordem escrita mais recente do Dr. Antônio > guia > `CLAUDE.md`, `docs/DESIGN.md`, `docs/METODO-DRSM.md` > skills.
2. Se o guia e o código divergirem (valores de tokens, nomes de scripts, eixos), NÃO altere o guia: registre a divergência em `.tmp\guia\DIVERGENCIAS.md` para decisão do Claude.
3. Ponto que o guia não cobre: decida pelo mais seguro e reversível, registre a decisão em `relatorios/ESTADO-GERAL.md` e siga.
4. Não altere `docs/GUIA-MESTRE-DRSM.md` sem ordem escrita do Dr. Antônio.

## Economia e cascata
- Ferramentas de terceiros (Caveman, RTK, Ponytail novo, UI UX Pro Max) NÃO estão instaladas: o scan SkillSpector (17/11) deu DO NOT INSTALL nas quatro. Não instalar sem novo scan e ordem do Dr.
- Alternar modo com `powershell -NoProfile -File scripts/cascata.ps1 -Modo normal|local|off|status`.
  - `normal`: Claude direto. `off`: Claude direto, usar em toda tarefa clínica.
  - `local`: Aider + qwen2.5-coder:14b (Ollama local), só código. Detalhes em `docs/cascata-local.md`.
- **Regra dura:** conteúdo clínico, roteiro, legenda, texto de vídeo/YouTube e dado de paciente NUNCA vão a modelo local, roteador, gateway ou serviço de terceiros. Se a cota acabar, a tarefa espera; só então `-Modo local` para código.
- Proibidos: OmniRoute, NadirClaw e qualquer gateway que roteie para outros provedores. Não alterar `ANTHROPIC_BASE_URL`.

## Visual do Portal
- Tokens travados em `docs/tokens.json` (bloco `site`). Paleta, fontes (Fraunces + Inter) e textos NÃO mudam sem ordem escrita do Dr. Antônio.
- Só CSS, layout e componentes. Texto pequeno sobre fundo claro usa `--tinta-media` (AAA); `--tinta-fraca` e `--dourado` só em texto grande ou não textual.
- Contato institucional só por e-mail (`mailto:`), sem WhatsApp.
- Detalhes e medições: `docs/design/visual-portal.md` e `docs/design/auditoria-visual.md`.
- UI UX Pro Max: não instalada (scan DO NOT INSTALL). Sem degradê roxo genérico nas páginas novas.
