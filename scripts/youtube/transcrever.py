# Transcreve trechos de áudio (faster-whisper base, CPU) e imprime JSON [texto, ...]. Uso: python -I transcrever.py a.wav b.wav
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel('base', device='cpu', compute_type='int8')
out = []
for f in sys.argv[1:]:
    seg, _ = m.transcribe(f, language='pt', beam_size=1)
    out.append(' '.join(s.text.strip() for s in seg))
print(json.dumps(out))
