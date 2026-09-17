"""Orquestra o pipeline completo: roteiro -> narracao -> legendas -> imagens ->
video -> (opcional) publicacao. Cada etapa grava seus artefatos intermediarios
em assets/runs/<run_id>/, para depuracao e para permitir retomar manualmente
uma etapa que falhou sem refazer tudo.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from . import composio_actions, instagram_bridge
from .config import SETTINGS
from .image_gen_sd import gerar_imagens
from .llm_ollama import RoteiroReel, gerar_roteiro
from .logger import get_logger
from .transcribe_whisperx import gerar_legendas
from .tts_edge import gerar_narracao
from .utils import ensure_dir, timestamp
from .video_builder import montar_video

logger = get_logger(__name__)


@dataclass
class ResultadoPipeline:
    run_id: str
    roteiro: RoteiroReel
    video_path: Path
    media_id: str | None = None


def _run_dir(run_id: str) -> Path:
    return ensure_dir(SETTINGS.assets_dir / "runs" / run_id)


def rodar_pipeline(
    *,
    tema: str | None = None,
    numero: int | None = None,
    publicar: bool = False,
    metodo_publicacao: str | None = None,
    dry_run: bool = False,
) -> ResultadoPipeline:
    run_id = timestamp()
    run_dir = _run_dir(run_id)
    logger.info("=== Iniciando pipeline (run_id=%s, tema=%r, numero=%r) ===", run_id, tema, numero)

    # 1) Roteiro
    try:
        roteiro = gerar_roteiro(tema=tema, numero=numero)
    except Exception as exc:
        _notificar_falha("geracao de roteiro", exc)
        raise
    roteiro.save(run_dir / "roteiro.json")

    # 2) Narracao (TTS)
    audio_path = run_dir / "narracao.mp3"
    try:
        gerar_narracao(roteiro.narracao, audio_path)
    except Exception as exc:
        _notificar_falha("narracao (Edge-TTS)", exc)
        raise

    # 3) Legendas sincronizadas (WhisperX)
    try:
        _srt, _json, chunks = gerar_legendas(audio_path, run_dir, nome_base="legendas")
    except Exception as exc:
        _notificar_falha("transcricao/alinhamento (WhisperX)", exc)
        raise

    # 4) Imagens (Stable Diffusion)
    try:
        imagens = gerar_imagens(roteiro.prompts_imagens, run_dir / "imagens", nome_base="cena")
    except Exception as exc:
        _notificar_falha("geracao de imagens (Stable Diffusion)", exc)
        raise

    # 5) Montagem do video (MoviePy)
    video_path = run_dir / f"{roteiro.slug}.mp4"
    try:
        montar_video(imagens=imagens, audio_path=audio_path, chunks_legenda=chunks, destino=video_path)
    except Exception as exc:
        _notificar_falha("montagem do video (MoviePy)", exc)
        raise

    resultado = ResultadoPipeline(run_id=run_id, roteiro=roteiro, video_path=video_path)

    # 6) Publicacao (opcional)
    if publicar and not dry_run:
        try:
            legenda_final = _montar_legenda_final(roteiro)
            media_id = instagram_bridge.publicar_reel(
                video_path=video_path,
                slug=roteiro.slug,
                legenda=legenda_final,
                tema=roteiro.tema,
                metodo=metodo_publicacao,
            )
            resultado.media_id = media_id
            _notificar_sucesso(roteiro, media_id)
        except Exception as exc:
            _notificar_falha("publicacao no Instagram", exc)
            raise
    elif publicar and dry_run:
        logger.info("[dry-run] pulando publicacao — video pronto em %s", video_path)

    logger.info("=== Pipeline concluido (run_id=%s) -> %s ===", run_id, video_path)
    return resultado


def _montar_legenda_final(roteiro: RoteiroReel) -> str:
    hashtags = " ".join(roteiro.hashtags)
    return f"{roteiro.legenda_instagram}\n\n{hashtags}".strip()


def _notificar_sucesso(roteiro: RoteiroReel, media_id: str) -> None:
    composio_actions.notificar(
        f"Reel publicado: '{roteiro.tema}' (slug={roteiro.slug}, media_id={media_id})",
        sucesso=True,
        contexto={"slug": roteiro.slug, "media_id": media_id},
    )


def _notificar_falha(etapa: str, exc: Exception) -> None:
    logger.error("Falha na etapa '%s': %s", etapa, exc)
    composio_actions.notificar(
        f"Pipeline de Reels falhou na etapa '{etapa}': {exc}",
        sucesso=False,
        contexto={"etapa": etapa},
    )
