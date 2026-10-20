# Plano de reaproveitamento dos reprovados (19/10/2026)

## Diagnóstico (Fase 1)
- 54 pastas. Motivos: todas F (forma): vinheta falada ausente (início ou fim) ou assinatura falada curta ausente no fim. Algumas com texto da narração com erro de digitação ou trecho truncado (ex.: short-2026-11-05-relato-crise-evitavel; short-resumo-ansiedade-social-medo-julgamento). Não há classe R nem C no diagnóstico automático.
- Publicação: nenhuma das 54 consta em relatorios/youtube/publicacao-log.md.

## CONFLITO (exige decisão antes de qualquer reforma)
- As 54 IDs estão em relatorios/youtube/fila.json com status aprovado-checagem. O publicador (scripts/youtube/publicarYoutube.js) publica esse status quando o horário chega, desde que o freio YOUTUBE_PUBLICACAO_ATIVA esteja "true".
- Ou seja: se o freio estiver ligado, estes 54 vídeos seriam publicados mesmo com motivo de reprovação registrado.
- Proposta: marcar as 54 entradas da fila como "reprovado" (alteração no índice da fila, sem apagar pasta), para o publicador ignorá-las até a reforma. Depende de ordem sua.

## Próximo passo (se aprovado)
- Fase 2 em lotes de 6, começando pelos de assinatura falada ausente (F, mecânicos). Cada vídeo: guardar original em _original/, corrigir só forma, revalidar T1, T2 e T3, auditoria em relatorios/checagens/.

## Fase 2 (19/10/2026, ordem do Dr. Antônio): estado
- Classificação: 54 F, 0 R, 0 C, 0 D, 0 X. Nenhuma pasta foi alterada; nenhum original precisou ser guardado (nada foi reformado).
- Bloqueio: a correção de F exige nova narração (áudio com vinheta/assinatura faladas) e novo render. A conferência (`scripts/youtube/conferirVideo.js`) checa quadros, transcrição do áudio e legenda do vídeo renderizado; metadado sozinho não zera nenhum dos 54.
- `scripts/youtube/montarFila.js` só gera mídia quando `meta.json` não existe. Não há forma segura de enfileirar regeração sem apagar ou mover arquivos (proibido). Registrado em PENDENTES.md; nada foi forçado.
- Causa a confirmar antes de regerar: `gerarVideosLongos.js` chama `L.comVinheta` e `L.comAssinaturaFalada`. Se o defeito persistir na regeração, o bug está nessas funções, não na fila.
- Ollama (127.0.0.1:11434) não respondeu: T2/T3 locais não rodaram. Não houve texto reformado, então não havia o que checar.

## Diagnóstico por motivo exato (19/10/2026, Item 5a; contagem de motivos.txt)
- 31: vinheta falada ausente no início (todos os Shorts e longos de 2026-10-26 a 2026-12-01 da lista).
- 19: assinatura falada curta ausente no fim.
- 4: vinheta falada ausente no fim.
- Total: 54 (0 classe R, C, D ou X).

## Item 5b (19/10/2026): teste de rascunho com o menor vídeo
- Amostra: short-2026-11-30-relato-silencio-fatal (808 KB), gerado em relatorios/logs/regera-teste/ (fora da pasta original).
- Resultado: geração 13 s, conferirVideo 6 s, rascunho 1 MB. Passou em todas as checagens. Motivo original: "vinheta falada ausente no início".
- Conclusão (resultado A, com uma amostra): o defeito não se repete com o gerador atual; é geração antiga. Longos ainda não testados como rascunho.
- Pista para o próximo passo: 726 narrações em narracoes-geradas/ têm marcador .vinheta, e comVinheta pula a inserção quando o marcador existe.

## Item 6 e 7 (19/10/2026): código pronto, não executado em massa
- scripts/youtube/regeracao.js (lotes de 6, espaço 2,5x, backup SHA-256, freio 50% em duas noites).
- scripts/youtube/reaproveitarReprovados.js (T2/T3 com gemma2:9b; calibração dos 12 primeiros).
- REGERAR.txt (piloto, 6 menores) e REGERAR-FILA.txt (48 restantes). Só rodam na noite, depois do merge.
- Portão no status: regerado só vira aprovado-checagem quando "liberado" (regeracao.statusComGate).
