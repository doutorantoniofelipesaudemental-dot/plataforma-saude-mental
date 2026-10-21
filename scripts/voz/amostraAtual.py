"""Amostra da voz atual do site (pt-BR-AntonioNeural, Edge-TTS) para comparar com as demais (ordem de 21/10/2026).
Mesmo texto preparado, velocidade equivalente a 0,9 (-10%) e normalização de -16 LUFS. Gera arquivo local; não publica.

    reels_automation/.venv/Scripts/python.exe scripts/voz/amostraAtual.py <blocos.json> <saida.mp3>
"""
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

PAUSA_PARAGRAFO = '\n\n'


async def gerar(texto, saida_wav_mp3):
    comunicado = edge_tts.Communicate(texto, voice='pt-BR-AntonioNeural', rate='-10%')
    await comunicado.save(saida_wav_mp3)


def main():
    blocos_json, saida = sys.argv[1], sys.argv[2]
    with open(blocos_json, encoding='utf8') as f:
        blocos = json.load(f)
    texto = PAUSA_PARAGRAFO.join(' '.join(b['frases']) for b in blocos)
    bruto = saida + '.bruto.mp3'
    asyncio.run(gerar(texto, bruto))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', bruto,
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-codec:a', 'libmp3lame', '-b:a', '128k', saida], check=True)
    os.remove(bruto)
    dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', saida],
                         capture_output=True, text=True, check=True).stdout.strip()
    print(json.dumps({'arquivo': saida, 'segundos': round(float(dur), 1)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
