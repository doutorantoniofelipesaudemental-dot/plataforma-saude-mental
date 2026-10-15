#!/bin/bash
# Lotes de 50 (Edge-TTS gratuito, com dicionário de pronúncia): gerar -> reenviar falhas 1x -> conferir/enviar -> amostra -> progresso.
# Para se mais de 3 textos falharem na geração ou se a conferência/envio reprovar algo.
cd /c/DRSAUDEMENTAL
PROG=relatorios/narracao-progresso.md
PY=reels_automation/.venv/Scripts/python.exe
INICIO=${1:-2}
for i in $(seq $INICIO 30); do
  node --env-file=.env backend/scripts/proximoLoteNarracao.js --pre-gerar > scratchpad/lote.txt 2> scratchpad/lote.err
  LOTE=$(cat scratchpad/lote.txt)
  if [ -z "$LOTE" ]; then echo "- Sem mais pendentes." >> $PROG; break; fi
  node --env-file=.env backend/tools/narrar-artigos.js --slugs=$LOTE --provedor=edge --incluir-agendados > scratchpad/gerar.log 2>&1
  FALHOU=$(node backend/scripts/parseGerar.js scratchpad/gerar.log falhou)
  if [ -n "$FALHOU" ]; then
    node --env-file=.env backend/tools/narrar-artigos.js --slugs=$FALHOU --provedor=edge --incluir-agendados > scratchpad/gerar-retry.log 2>&1
    node backend/scripts/parseGerar.js scratchpad/gerar-retry.log ok > scratchpad/retry-ok.txt
  else : > scratchpad/retry-ok.txt; fi
  OK=$(node backend/scripts/parseGerar.js scratchpad/gerar.log ok)
  [ -s scratchpad/retry-ok.txt ] && OK="$OK,$(cat scratchpad/retry-ok.txt)"
  FALHAS_FINAIS=$(node -e "const f='$FALHOU'.split(',').filter(Boolean),r=require('fs').readFileSync('scratchpad/retry-ok.txt','utf8').trim().split(',');console.log(f.filter(x=>!r.includes(x)).join(','))")
  NF=$(echo "$FALHAS_FINAIS" | tr ',' '\n' | grep -c .)
  if [ "$NF" -gt 3 ]; then echo "- PAROU no lote $i: $NF textos falharam na geração (ver scratchpad/gerar.log)" >> $PROG; exit 1; fi
  node --env-file=.env backend/scripts/verificarEEnviarNarracoes.js --slugs=$OK > scratchpad/envio.log 2>&1
  if ! grep -q "reprovados: 0 .* falhas de envio: 0" scratchpad/envio.log; then echo "- PAROU no lote $i: conferência com problema (ver scratchpad/envio.log)" >> $PROG; exit 1; fi
  node --env-file=.env backend/scripts/amostraNarracao.js --slugs=$OK > scratchpad/amostra.log 2>&1
  $PY -I backend/scripts/conferirAmostra.py > scratchpad/amostra-res.log 2>&1
  RES=$(node --env-file=.env backend/scripts/proximoLoteNarracao.js --resumo)
  {
    echo ""
    echo "## Lote $i — $(date '+%d/%m/%Y %H:%M') (pronúncia ativa; MP3 pré-gerados de textos agendados, enviados quando forem publicados)"
    echo "- $(head -1 scratchpad/envio.log)"
    [ -n "$FALHAS_FINAIS" ] && echo "- Falhas de geração (ficam para o próximo lote): $FALHAS_FINAIS"
    echo "- Estado geral: $RES"
    echo "- Amostra (transcrição de 5 áudios):"
    grep -v "Xet\|^$" scratchpad/amostra-res.log | sed 's/^/  - /'
  } >> $PROG
done
echo "- FIM do laço em $(date '+%d/%m/%Y %H:%M')" >> $PROG
