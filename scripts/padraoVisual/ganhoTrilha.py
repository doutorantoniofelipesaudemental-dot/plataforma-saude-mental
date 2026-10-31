"""Ganho da trilha em relação à voz (regra: trilha a -22 dB RMS abaixo da narração).

Funções puras, sem dependências de imagem, para serem testadas em tests/unit/padrao-visual.test.js.
"""
import math
import re
import subprocess

ALVO_TRILHA_DB = -22.0  # trilha RMS = RMS da voz - 22 dB


def combinar_rms_db(trechos):
    """RMS (dB) de um conjunto de trechos [(rms_db, duracao_s), ...] concatenados."""
    total = sum(d for _, d in trechos)
    if total <= 0:
        raise ValueError("duração total zero")
    potencia = sum((10 ** (db / 10)) * d for db, d in trechos) / total
    return 10 * math.log10(potencia)


def ganho_trilha_db(rms_voz_db, rms_trilha_bruta_db, alvo_db=ALVO_TRILHA_DB):
    """Ganho (dB) a aplicar na trilha bruta para que RMS(trilha) = RMS(voz) + alvo_db."""
    return (rms_voz_db + alvo_db) - rms_trilha_bruta_db


def rms_db(caminho, ffmpeg="ffmpeg"):
    """RMS geral (dB) de um arquivo de áudio, medido pelo filtro astats do FFmpeg."""
    saida = subprocess.run([ffmpeg, "-hide_banner", "-i", caminho, "-af", "astats=metadata=0",
                            "-f", "null", "-"], capture_output=True, text=True, check=True).stderr
    valores = re.findall(r"RMS level dB:\s*(-?[\d.]+|-inf)", saida)
    if not valores:
        raise RuntimeError(f"astats sem RMS para {caminho}")
    return float(valores[-1])  # último valor = bloco "Overall"
