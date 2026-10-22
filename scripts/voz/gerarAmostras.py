"""Gera a mesma amostra em cada voz aprovada (ordem de 21/10/2026). Só gera arquivos locais; não publica nada.

Uso (a partir da raiz do projeto):
    .tmp/voz-venv/Scripts/python.exe scripts/voz/gerarAmostras.py <blocos.json> <pasta-de-saida>

Ajustes iguais para todas as vozes: velocidade 0,9; pausa de 0,45 s entre frases e de 1,0 s entre parágrafos;
volume normalizado para -16 LUFS (padrão de podcast), com ffmpeg.
"""
import io
import json
import os
import subprocess
import sys
import wave

import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELOS = os.path.join(RAIZ, '.tmp', 'voz-modelos')
VELOCIDADE = 0.9
PAUSA_FRASE_S = 0.45
PAUSA_PARAGRAFO_S = 1.0
FFMPEG = 'ffmpeg'


def silencio(segundos, sr):
    return np.zeros(int(segundos * sr), dtype=np.float32)


def juntar(blocos, sintetizar_frase, sr):
    """Une as frases com pausas. blocos: [{frases:[...]}, ...]. sintetizar_frase(texto) -> np.float32 mono."""
    partes = []
    for i, bloco in enumerate(blocos):
        for j, frase in enumerate(bloco['frases']):
            partes.append(sintetizar_frase(frase))
            if j < len(bloco['frases']) - 1:
                partes.append(silencio(PAUSA_FRASE_S, sr))
        if i < len(blocos) - 1:
            partes.append(silencio(PAUSA_PARAGRAFO_S, sr))
    return np.concatenate(partes).astype(np.float32)


def piper_frase_factory(caminho_onnx):
    from piper import PiperVoice, SynthesisConfig
    voz = PiperVoice.load(caminho_onnx)
    sr = voz.config.sample_rate
    cfg = SynthesisConfig(length_scale=1.0 / VELOCIDADE)

    def sintetizar(texto):
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as w:
            voz.synthesize_wav(texto, w, syn_config=cfg)
        buf.seek(0)
        with wave.open(buf, 'rb') as r:
            dados = np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16)
        return dados.astype(np.float32) / 32768.0
    return sintetizar, sr


def kokoro_frase_factory(voz_nome):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(MODELOS, 'kokoro', 'kokoro-v1.0.onnx'), os.path.join(MODELOS, 'kokoro', 'voices-v1.0.bin'))

    def sintetizar(texto):
        amostras, _sr = k.create(texto, voice=voz_nome, speed=VELOCIDADE, lang='pt-br')
        return np.asarray(amostras, dtype=np.float32)
    return sintetizar, 24000


def gravar_mp3(wav_tmp, mp3_saida):
    """Normaliza para -16 LUFS e converte para MP3 com ffmpeg."""
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', wav_tmp,
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-codec:a', 'libmp3lame', '-b:a', '128k', mp3_saida], check=True)
    os.remove(wav_tmp)


def duracao_s(mp3):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', mp3],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def gerar(nome, sintetizar, sr, blocos, pasta):
    audio = juntar(blocos, sintetizar, sr)
    tmp = os.path.join(pasta, f'.{nome}.wav')
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype('<i2').tobytes()
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm)
    mp3 = os.path.join(pasta, f'{nome}.mp3')
    gravar_mp3(tmp, mp3)
    return {'arquivo': os.path.relpath(mp3, RAIZ).replace('\\', '/'), 'segundos': round(duracao_s(mp3), 1)}


def main():
    blocos_json, pasta = sys.argv[1], sys.argv[2]
    os.makedirs(pasta, exist_ok=True)
    with open(blocos_json, encoding='utf8') as f:
        blocos = json.load(f)
    resultados = []
    piper = os.path.join(MODELOS, 'piper')
    for voz in ['faber', 'cadu', 'jeff', 'edresson']:
        onnx = os.path.join(piper, f'pt_BR-{voz}-{"low" if voz == "edresson" else "medium"}.onnx')
        f, sr = piper_frase_factory(onnx)
        resultados.append({'motor': 'Piper', 'voz': voz, **gerar(f'piper-{voz}', f, sr, blocos, pasta)})
    for voz in ['pf_dora', 'pm_alex', 'pm_santa']:
        f, sr = kokoro_frase_factory(voz)
        resultados.append({'motor': 'Kokoro', 'voz': voz, **gerar(f'kokoro-{voz}', f, sr, blocos, pasta)})
    print(json.dumps(resultados, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
