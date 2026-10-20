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
