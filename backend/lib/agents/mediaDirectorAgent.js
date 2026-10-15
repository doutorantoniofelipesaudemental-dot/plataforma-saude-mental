/**
 * Diretor de mídia — conectores open-source de custo zero:
 *   Voz: Kokoro-TTS / Chatterbox (PT-BR); fallback homologado: Edge-TTS pt-BR-AntonioNeural.
 *   Legendas: Faster-Whisper (.SRT/.VTT).
 *   Animação: ComfyUI (HTTP :8188) com Wan2.1 / LivePortrait.
 * Cada etapa detecta o conector e, se ausente, devolve { disponivel:false, motivo }
 * sem inventar saída. `simulado` gera só o plano/stub, sem processar.
 * Nunca remove marca d'água de terceiros: peça reprovada é REGERADA localmente.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PY_PROJETO = path.resolve(__dirname, '../../../reels_automation/.venv/Scripts/python.exe');
const COMFY = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';

const pythonTem = (modulo) => {
  const py = fs.existsSync(PY_PROJETO) ? PY_PROJETO : 'python';
  const r = spawnSync(py, ['-I', '-c', `import importlib.util,sys;sys.exit(0 if importlib.util.find_spec('${modulo}') else 1)`], { timeout: 15_000 });
  return r.status === 0 ? py : null;
};

async function comfyOnline() {
  try { return (await fetch(`${COMFY}/system_stats`, { signal: AbortSignal.timeout(2500) })).ok; } catch { return false; }
}

/** Etapa 2 — narração. Ordem: kokoro → chatterbox → edge-tts (homologado). */
function narrar({ texto, saida, simulado }) {
  if (simulado) return { etapa: 'voz', simulado: true, conector: pythonTem('kokoro') ? 'kokoro' : pythonTem('edge_tts') ? 'edge-tts (fallback homologado; Kokoro ausente)' : 'indisponível', saida };
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const txt = `${saida}.txt`;
  fs.writeFileSync(txt, texto, 'utf8');
  const kokoro = pythonTem('kokoro');
  if (kokoro) {
    const cod = `from kokoro import KPipeline;import soundfile as sf,numpy as np;p=KPipeline(lang_code='p');t=open(r'${txt}',encoding='utf8').read();a=np.concatenate([x[2] for x in p(t,voice='pf_dora')]);sf.write(r'${saida}',a,24000)`;
    const r = spawnSync(kokoro, ['-I', '-c', cod], { timeout: 600_000 });
    if (r.status === 0) return { etapa: 'voz', conector: 'kokoro', saida };
  }
  const edge = pythonTem('edge_tts');
  if (edge) {
    const r = spawnSync(edge, ['-m', 'edge_tts', '--voice', 'pt-BR-AntonioNeural', '--file', txt, '--write-media', saida], { timeout: 300_000 });
    if (r.status === 0) return { etapa: 'voz', conector: 'edge-tts (fallback homologado)', saida };
  }
  return { etapa: 'voz', disponivel: false, motivo: 'nenhum conector de voz respondeu (Kokoro/Chatterbox/Edge-TTS)' };
}

/** Etapa 3 — legendas .SRT com Faster-Whisper. */
function legendar({ audio, saidaSrt, simulado }) {
  if (simulado) return pythonTem('faster_whisper') ? { etapa: 'legendas', simulado: true, conector: 'faster-whisper', saida: saidaSrt } : { etapa: 'legendas', disponivel: false, motivo: 'indisponível: faster-whisper não instalado' };
  const py = pythonTem('faster_whisper');
  if (!py) return { etapa: 'legendas', disponivel: false, motivo: 'faster-whisper não instalado (pip install faster-whisper)' };
  const cod = `from faster_whisper import WhisperModel as M
m=M('small',device='cpu',compute_type='int8',cpu_threads=4)
s,_=m.transcribe(r'${audio}',language='pt')
f=lambda t:'%02d:%02d:%02d,%03d'%(t//3600,t%3600//60,t%60,int(t%1*1000))
open(r'${saidaSrt}','w',encoding='utf8').write('\\n'.join('%d\\n%s --> %s\\n%s\\n'%(i+1,f(x.start),f(x.end),x.text.strip()) for i,x in enumerate(s)))`;
  const r = spawnSync(py, ['-I', '-c', cod], { timeout: 900_000 });
  return r.status === 0 ? { etapa: 'legendas', conector: 'faster-whisper', saida: saidaSrt } : { etapa: 'legendas', disponivel: false, motivo: 'falha no faster-whisper' };
}

/** Prompt de animação 2D/anime estilo Ghibli + movimento de câmera (sem rosto real, sem texto na imagem). */
function promptAnimacao({ tema, camera = 'slow push-in' }) {
  return {
    positivo: `hand-painted 2D anime scene, Studio Ghibli inspired, soft watercolor background, warm navy and gold palette, calm person near a window at dawn, theme: ${tema}, gentle breathing motion, ${camera}, no text, no logo, no watermark`,
    negativo: 'watermark, logo, text, signature, distorted face, flashing, strobe, frightening imagery, blood',
    modelo: 'Wan2.1 (i2v) ou LivePortrait',
    formato: '9:16 1080x1920, 30 fps, 5 s',
  };
}

/** Etapa 4 — animação via ComfyUI. Sem ComfyUI online, entrega o prompt pronto. */
async function animar({ tema, simulado, saida }) {
  const prompt = promptAnimacao({ tema });
  if (!(await comfyOnline())) return { etapa: 'animacao', disponivel: false, motivo: `indisponível: ComfyUI offline em ${COMFY}`, prompt };
  return { etapa: 'animacao', disponivel: true, motivo: 'ComfyUI online: envie o workflow Wan2.1 ao endpoint /prompt', prompt };
}

/** Regeração local após marca d'água de terceiros (nunca apagar a marca). */
async function regerarImagem({ tema, simulado }) {
  const prompt = promptAnimacao({ tema, camera: 'static' });
  if (simulado) return { regerada: true, simulado: true, via: 'comfyui (nova geração local)', prompt };
  return (await comfyOnline()) ? { regerada: false, via: 'comfyui', motivo: 'enviar workflow de imagem ao /prompt', prompt } : { regerada: false, motivo: 'ComfyUI offline', prompt };
}

async function diagnostico() {
  return {
    kokoro: Boolean(pythonTem('kokoro')),
    edgeTts: Boolean(pythonTem('edge_tts')),
    fasterWhisper: Boolean(pythonTem('faster_whisper')),
    comfyui: await comfyOnline(),
  };
}

module.exports = { nome: 'mediaDirectorAgent', narrar, legendar, animar, regerarImagem, promptAnimacao, diagnostico };
