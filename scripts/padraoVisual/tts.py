"""Narração Edge-TTS (voz pt-BR-AntonioNeural, gratuita) com tempo de cada palavra.

Uso (Python do reels_automation/.venv):
  python tts.py <entrada.json> <pasta_saida>
Entrada: [{"id": "s1", "texto": "..."}]. Saída: <id>.mp3 por item e palavras.json.
"""
import asyncio
import json
import os
import sys

import edge_tts

VOZ = "pt-BR-AntonioNeural"


async def gerar(entrada, pasta):
    os.makedirs(pasta, exist_ok=True)
    with open(entrada, encoding="utf-8") as f:
        itens = json.load(f)
    palavras_por_id = {}
    for item in itens:
        com = edge_tts.Communicate(item["texto"], VOZ, boundary="WordBoundary")
        palavras = []
        caminho = os.path.join(pasta, item["id"] + ".mp3")
        with open(caminho, "wb") as arquivo:
            async for pedaco in com.stream():
                if pedaco["type"] == "audio":
                    arquivo.write(pedaco["data"])
                elif pedaco["type"] == "WordBoundary":
                    palavras.append({
                        "t": pedaco["offset"] / 1e7,
                        "d": pedaco["duration"] / 1e7,
                        "p": pedaco["text"],
                    })
        palavras_por_id[item["id"]] = palavras
    with open(os.path.join(pasta, "palavras.json"), "w", encoding="utf-8") as f:
        json.dump(palavras_por_id, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    asyncio.run(gerar(sys.argv[1], sys.argv[2]))
