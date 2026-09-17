"""Montagem do Reel com MoviePy 2.x: imagens com efeito Ken Burns, narracao e
legendas queimadas no video, sincronizadas palavra-a-palavra via WhisperX.

Nota sobre a API: o MoviePy 2.x trocou os metodos `set_*`/`resize`/`fx` (1.x)
por `with_*`/`resized`/`with_effects` (imutaveis) e moveu os efeitos para
classes em `moviepy.vfx` (`FadeIn`, `FadeOut`, `Resize`, ...). Alem disso o
`TextClip` passou a exigir um **caminho de arquivo de fonte** (.ttf/.otf) em
`font`, nao mais um nome de familia como "Arial-Bold".
"""

from __future__ import annotations

from pathlib import Path

from moviepy import (
    AudioFileClip,
    CompositeVideoClip,
    ImageClip,
    TextClip,
    concatenate_videoclips,
    vfx,
)

from .config import SETTINGS
from .logger import get_logger
from .transcribe_whisperx import ChunkLegenda
from .utils import PipelineError, check_executable

logger = get_logger(__name__)

_DEFAULT_FONT = r"C:\Windows\Fonts\arialbd.ttf"


def _resolver_fonte() -> str:
    cfg_font = SETTINGS.get("video", "caption_font", default=_DEFAULT_FONT)
    caminho = Path(cfg_font)
    if not caminho.exists():
        raise PipelineError(
            f"Fonte configurada em video.caption_font nao encontrada: {caminho}. "
            "Aponte para um arquivo .ttf/.otf valido (ex.: C:\\Windows\\Fonts\\arialbd.ttf)."
        )
    return str(caminho)


def _clip_com_ken_burns(caminho_imagem: Path, duracao: float, *, resolucao: tuple[int, int], zoom: float) -> ImageClip:
    largura, altura = resolucao

    fundo = (
        ImageClip(str(caminho_imagem))
        .resized(height=altura)
        .with_duration(duracao)
    )
    if fundo.w < largura:
        fundo = fundo.resized(width=largura)

    animado = fundo.with_effects([vfx.Resize(lambda t: 1 + (zoom - 1) * (t / max(duracao, 0.01)))])
    animado = animado.with_position("center")

    return CompositeVideoClip([animado], size=resolucao).with_duration(duracao)


def _construir_legendas(chunks: list[ChunkLegenda], *, resolucao: tuple[int, int]) -> list[TextClip]:
    cfg = SETTINGS.raw.get("video", {})
    largura, altura = resolucao
    _, pos_y_ratio = cfg.get("caption_position_ratio", [0.5, 0.78])
    fonte = _resolver_fonte()

    legendas = []
    for chunk in chunks:
        duracao = max(chunk.fim - chunk.inicio, 0.05)
        try:
            txt_clip = TextClip(
                font=fonte,
                text=chunk.texto.upper(),
                font_size=cfg.get("caption_fontsize", 64),
                color=cfg.get("caption_color", "white"),
                stroke_color=cfg.get("caption_stroke_color", "black"),
                stroke_width=cfg.get("caption_stroke_width", 3),
                method="caption",
                size=(int(largura * 0.9), None),
                text_align="center",
            )
        except Exception as exc:  # noqa: BLE001
            raise PipelineError(f"Falha ao renderizar legenda com MoviePy ({fonte}): {exc}") from exc

        txt_clip = (
            txt_clip.with_start(chunk.inicio)
            .with_duration(duracao)
            .with_position(("center", pos_y_ratio), relative=True)
        )
        legendas.append(txt_clip)

    return legendas


def montar_video(
    *,
    imagens: list[Path],
    audio_path: Path,
    chunks_legenda: list[ChunkLegenda],
    destino: Path,
) -> Path:
    """Monta o Reel final: imagens (Ken Burns) + narracao + legendas queimadas."""
    if not imagens:
        raise PipelineError("Nenhuma imagem disponivel para montar o video.")
    if not audio_path.exists():
        raise PipelineError(f"Audio de narracao nao encontrado: {audio_path}")
    if not check_executable("ffmpeg"):
        raise PipelineError("ffmpeg nao encontrado no PATH — necessario para o MoviePy exportar o video.")

    cfg = SETTINGS.raw.get("video", {})
    resolucao = tuple(cfg.get("resolution", [1080, 1920]))
    fps = cfg.get("fps", 30)
    zoom = cfg.get("ken_burns_zoom", 1.08)
    fade = cfg.get("fade_seconds", 0.4)

    logger.info("Carregando audio de narracao: %s", audio_path)
    audio_clip = AudioFileClip(str(audio_path))
    duracao_total = audio_clip.duration
    duracao_por_imagem = duracao_total / len(imagens)

    logger.info(
        "Montando video: %d imagens x %.2fs cada, duracao total %.2fs, resolucao %s",
        len(imagens), duracao_por_imagem, duracao_total, resolucao,
    )

    clips_imagem = []
    for caminho in imagens:
        clip = _clip_com_ken_burns(caminho, duracao_por_imagem, resolucao=resolucao, zoom=zoom)
        clip = clip.with_effects([vfx.FadeIn(fade), vfx.FadeOut(fade)])
        clips_imagem.append(clip)

    video_base = concatenate_videoclips(clips_imagem, method="compose").with_duration(duracao_total)

    legendas = _construir_legendas(chunks_legenda, resolucao=resolucao)

    video_final = CompositeVideoClip([video_base, *legendas], size=resolucao).with_audio(audio_clip)
    video_final = video_final.with_duration(duracao_total)

    destino.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Exportando video final para %s ...", destino)
    try:
        video_final.write_videofile(
            str(destino),
            fps=fps,
            codec=cfg.get("codec", "libx264"),
            audio_codec=cfg.get("audio_codec", "aac"),
            bitrate=cfg.get("bitrate", "8000k"),
            threads=4,
            logger=None,
        )
    except Exception as exc:  # noqa: BLE001
        raise PipelineError(f"Falha ao exportar o video final com MoviePy/ffmpeg: {exc}") from exc
    finally:
        audio_clip.close()
        video_final.close()

    if not destino.exists() or destino.stat().st_size == 0:
        raise PipelineError(f"Exportacao terminou mas {destino} nao foi criado corretamente.")

    logger.info("Video final pronto: %s (%.1f MB)", destino, destino.stat().st_size / (1024 * 1024))
    return destino
