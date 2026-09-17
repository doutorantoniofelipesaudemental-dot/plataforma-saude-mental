"""Narracao via Edge-TTS (voz neural da Microsoft, gratuita, sem chave de API)."""

from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

from .config import SETTINGS
from .logger import get_logger
from .utils import PipelineError, with_retry

logger = get_logger(__name__)


@with_retry(attempts=3)
def _sintetizar_async(texto: str, destino: Path, *, voz: str, rate: str, pitch: str, volume: str) -> None:
    async def _run() -> None:
        communicate = edge_tts.Communicate(texto, voice=voz, rate=rate, pitch=pitch, volume=volume)
        await communicate.save(str(destino))

    asyncio.run(_run())


def gerar_narracao(texto: str, destino: Path) -> Path:
    """Sintetiza `texto` em audio (mp3) usando a voz configurada em settings.json.

    Levanta PipelineError se o Edge-TTS nao conseguir gerar audio (rede
    indisponivel, texto vazio, voz invalida etc.).
    """
    if not texto.strip():
        raise PipelineError("Texto de narracao vazio — nada para sintetizar.")

    destino.parent.mkdir(parents=True, exist_ok=True)
    voz = SETTINGS.edge_tts_voice
    rate = SETTINGS.get("tts", "rate", default="+0%")
    pitch = SETTINGS.get("tts", "pitch", default="+0Hz")
    volume = SETTINGS.get("tts", "volume", default="+0%")

    logger.info("Gerando narracao (%s) -> %s", voz, destino)
    try:
        _sintetizar_async(texto, destino, voz=voz, rate=rate, pitch=pitch, volume=volume)
    except Exception as exc:  # noqa: BLE001 - qualquer falha de rede/voz vira erro de pipeline
        raise PipelineError(f"Falha ao gerar narracao com Edge-TTS (voz={voz}): {exc}") from exc

    if not destino.exists() or destino.stat().st_size == 0:
        raise PipelineError(f"Edge-TTS nao gerou arquivo de audio valido em {destino}")

    logger.info("Narracao gerada: %s (%.1f KB)", destino, destino.stat().st_size / 1024)
    return destino


async def listar_vozes_pt_br() -> list[str]:
    """Utilitario de diagnostico: lista vozes pt-BR disponiveis no Edge-TTS."""
    vozes = await edge_tts.list_voices()
    return [v["ShortName"] for v in vozes if v["Locale"].lower().startswith("pt-br")]
