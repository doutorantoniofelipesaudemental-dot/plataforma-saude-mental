# YouTube sem o PC: plano (fase 2, 20/10/2026). Não implementado.

## Por que não implementei ainda

1. **Voz (bloqueio).** A narração usa `pt-BR-AntonioNeural` (Edge-TTS). Não encontrei termo oficial da Microsoft que permita distribuição pública da voz em vídeo do YouTube nem em podcast. Só há comentários informais (fonte: pesquisa de 20/10/2026, sem fonte oficial). Como o YouTube é distribuição pública, a fase 2 depende da sua decisão sobre a voz (item 1c da ordem). Nada foi trocado.
2. **Limite gratuito do GitHub Actions.** Os números vêm de sites de terceiros, não da documentação do GitHub: cerca de 2000 minutos/mês em repositório privado no plano gratuito. Os minutos de Windows contam 2x e os de macOS 10x. Rodando em Linux, o consumo é 1x. **A confirmar** na página de faturamento do GitHub.
3. **Segredos.** Exige criar Secrets no GitHub (ex.: token do YouTube, credenciais do Blob). Isso precisa do seu comando `gh secret set NOME`, no PowerShell, com o valor digitado por você.

## Plano (quando você aprovar a voz e o limite)

- **Narração e vídeo:** GitHub Actions agendado (cron), em Linux: Edge-TTS (ou a alternativa aprovada) + ffmpeg + conferidor. Resultado gravado no Blob, como hoje.
- **Upload:** cron da Vercel ou a própria Action, com refresh token. A trava `youtube_publicados` e o freio `YOUTUBE_PUBLICACAO_ATIVA` continuam valendo.
- **Paralelo de 7 dias:** a tarefa do PC (`DrSM-Narracao-Noite`, `DrSM-YouTube-Gera-Midia`) e a Action rodam juntas, só comparando resultados. Ninguém sobe nada duplicado: a trava impede.
- **Desligar as tarefas do PC:** só depois de 7 dias de comparação OK e proposta sua.

## Cadência e consumo estimado

Hoje: 1 vídeo por dia (Shorts ou longo). Estimativa com ~10 min por vídeo em Linux: ~300 min/mês, dentro de 2000 min/mês, se o número de terceiros estiver certo. **A confirmar** antes de decidir.
