# Autorizações do Dr. Antônio Felipe (registro)

Só valem as linhas copiadas de ordem escrita do Dr. Antônio, com data. O Claude Code nunca acrescenta, amplia nem reinterpreta autorização por conta própria.

Referências permanentes no CLAUDE.md: seções "Autonomia Classe 1" e "Comandos, arquivos e autonomia" (19/10/2026).

## 19/10/2026: ordem "destravar o reaproveitamento dos 54 vídeos + travas e bloqueios"

Mantidas (autorizadas por escrito nesta ordem):
- Regerar a mídia dos 54 vídeos reprovados SEM apagar e SEM mover as pastas originais, pela tarefa noturna DrSM-YouTube-Gera-Midia (que não chama o Claude), em lotes de 6 por noite, com backup por cópia verificado por SHA-256 e freio de 50% de falha em duas noites seguidas.
- Piloto: REGERAR.txt com os 6 menores; demais em REGERAR-FILA.txt.
- Calibração: os 12 primeiros vídeos regerados ficam "aprovado, aguardando calibração" até revisão do Claude Code. A partir do 13º, enfileiramento automático com revisão por amostragem de 1 em cada 5.
- Escrever scripts/ollamaStatus.js e a regra: Ollama fora = pendente, nunca aprovado nem reprovado.
- Validade do YouTube em relatorios/youtube/validade.json (2026-10-23), com alerta no RESUMO-DO-DIA.md.
- Simulações do LinkedIn em arquivo próprio, ignorado pelo git.
- Opcional O1 (formulário da auditoria no Chrome, sem Enviar), mantido.
- Opcional O2 (apagar SOMENTE o vídeo z_JHmmpw880, após conferir título, data e status privado), mantido como exceção única.
- Opcional O3 (agendarDiario.js uma vez, 1 post, sem senha, sem cookies, sem contornar CAPTCHA), mantido.

Não autorizado nesta ordem (continuam só com o Dr. Antônio): push, PR, merge-seguro, ativar ou desativar tarefas do Windows, YOUTUBE_PUBLICACAO_ATIVA, RESEND_API_KEY, contas e chaves, qualquer gasto, sentido clínico, novos módulos, foto de rosto, mudança de regras ou freios.

## 20/10/2026: decisões sobre o token do Instagram (ordem escrita do Dr. Antônio)
- Hook de segredos: marcador "segredos:permitir" autorizado SOMENTE nas linhas do token fictício do teste atualizarToken (valor fictício confirmado, "FICTICIO"). Nenhuma outra exceção.
- relatorios/youtube/fila.json: gerado pela tarefa do YouTube. Fica na lista de pré-existentes (arquivo rastreado, por isso não entra no .gitignore) e não entra em commit de outra tarefa.
- Host da API: IGAA → graph.instagram.com (instagram_business_content_publish); demais tokens → graph.facebook.com (instagram_content_publish). Regra única em backend/lib/instagramHost.js. INSTAGRAM_GRAPH_HOST só vale quando coerente com o token.

## 25/10/2026: painel do Root Directory (declaração escrita do Dr. Antônio, ordem de 25/10)
- O Dr. declarou ter alterado o Root Directory do projeto drsaudemental para VAZIO em 25/10/2026 às 08:00 (Salvador). Valor anterior: apps/plataforma-saude-mental. Sem promoção nem rollback; produção segue no #147.
- Verificação: a API não expõe o Root Directory (get_project não traz o campo). O relógio do sistema, nessa mesma sessão, marcava 03:17 de Salvador; a declaração não foi conferida contra ele. O `updatedAt` do projeto não mudou desde 24/10 às 21:52 (Salvador).
- Preview reprodutor com Root declarado vazio (3ac645c, dpl_6MHQJ89sUedALBUQYsRwJpGVD7a4): saída vazia (sem aviso de builds, sem install, 29 ms). Resultado não confirma a alteração.

## 25/10/2026: teste discriminador (autonomia para pendências possíveis)
- Branch test/vercel-discriminador-20261025 (9f8f1fd, sem pasta apps/, vercel.json com builds na raiz), dpl_D3aWAcdWr95LMG2wqBPrr8euDeAJ: ERROR com "The specified Root Directory "apps/plataforma-saude-mental" does not exist".
- Conclusão: o Root Directory do projeto drsaudemental continua apontando para apps/plataforma-saude-mental. A alteração declarada para vazio NÃO está aplicada no painel. A causa mais provável deixa de ser o código ou a CLI e passa a ser o painel.
