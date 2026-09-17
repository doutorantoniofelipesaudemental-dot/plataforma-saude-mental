"""Transcricao + alinhamento word-level com WhisperX, para gerar legendas
sincronizadas (SRT + JSON de chunks) a partir do audio de narracao.

WhisperX carrega dois modelos: o modelo Whisper (transcricao) e um modelo de
alinhamento fonetico (wav2vec2) que da o timestamp de cada palavra — e esse
segundo passo que permite legendas "palavra por palavra" sincronizadas de
verdade, em vez de apenas por frase.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import SETTINGS
from .logger import get_logger
from .utils import PipelineError

logger = get_logger(__name__)

_whisper_model = None
_align_model = None
_align_metadata = None


@dataclass
class PalavraTimestamp:
    palavra: str
    inicio: float
    fim: float


@dataclass
class ChunkLegenda:
    texto: str
    inicio: float
    fim: float


def _carregar_modelos():
    """Carrega os modelos WhisperX uma unica vez (lazy, cache em modulo)."""
    global _whisper_model, _align_model, _align_metadata
    import whisperx  # import pesado, mantido local para nao atrasar `main.py --help`

    if _whisper_model is None:
        logger.info(
            "Carregando modelo WhisperX '%s' (device=%s, compute_type=%s)...",
            SETTINGS.get("whisperx", "model_size", default="small"),
            SETTINGS.whisperx_device,
            SETTINGS.whisperx_compute_type,
        )
        try:
            _whisper_model = whisperx.load_model(
                SETTINGS.get("whisperx", "model_size", default="small"),
                device=SETTINGS.whisperx_device,
                compute_type=SETTINGS.whisperx_compute_type,
                language=SETTINGS.get("whisperx", "language", default="pt"),
            )
        except Exception as exc:  # noqa: BLE001
            raise PipelineError(
                f"Falha ao carregar o modelo WhisperX: {exc}. Verifique se torch/whisperx "
                "estao instalados corretamente para o device configurado."
            ) from exc

    if _align_model is None:
        try:
            _align_model, _align_metadata = whisperx.load_align_model(
                language_code=SETTINGS.get("whisperx", "language", default="pt"),
                device=SETTINGS.whisperx_device,
            )
        except Exception as exc:  # noqa: BLE001
            raise PipelineError(
                f"Falha ao carregar o modelo de alinhamento do WhisperX: {exc}. "
                "Pode ser necessario um HUGGINGFACE_TOKEN e aceitar os termos do "
                "modelo pyannote/wav2vec2 no site da Hugging Face."
            ) from exc

    return _whisper_model, _align_model, _align_metadata


def transcrever_e_alinhar(audio_path: Path) -> list[PalavraTimestamp]:
    """Transcreve `audio_path` e devolve a lista de palavras com timestamp
    (inicio/fim em segundos), pronta para montar legendas sincronizadas."""
    import whisperx

    if not audio_path.exists():
        raise PipelineError(f"Audio nao encontrado para transcricao: {audio_path}")

    modelo, align_model, align_metadata = _carregar_modelos()

    logger.info("Transcrevendo %s com WhisperX...", audio_path)
    audio = whisperx.load_audio(str(audio_path))
    resultado = modelo.transcribe(audio, batch_size=SETTINGS.get("whisperx", "batch_size", default=8))

    if not resultado.get("segments"):
        raise PipelineError(f"WhisperX nao encontrou fala em {audio_path}")

    logger.info("Alinhando timestamps palavra a palavra...")
    alinhado = whisperx.align(
        resultado["segments"],
        align_model,
        align_metadata,
        audio,
        SETTINGS.whisperx_device,
        return_char_alignments=False,
    )

    palavras: list[PalavraTimestamp] = []
    for segmento in alinhado.get("word_segments", []):
        inicio = segmento.get("start")
        fim = segmento.get("end")
        texto = segmento.get("word", "").strip()
        if texto and inicio is not None and fim is not None:
            palavras.append(PalavraTimestamp(palavra=texto, inicio=float(inicio), fim=float(fim)))

    if not palavras:
        raise PipelineError("WhisperX nao devolveu timestamps de palavras alinhadas.")

    logger.info("Alinhamento concluido: %d palavras.", len(palavras))
    return palavras


def agrupar_em_chunks(palavras: list[PalavraTimestamp], *, max_palavras: int | None = None) -> list[ChunkLegenda]:
    """Agrupa palavras em chunks curtos (ex.: 3-4 palavras) para exibir como
    legenda estilo Reels, um chunk por vez, sincronizado ao audio."""
    max_palavras = max_palavras or SETTINGS.get("whisperx", "max_words_per_caption_chunk", default=4)
    chunks: list[ChunkLegenda] = []
    buffer: list[PalavraTimestamp] = []

    for palavra in palavras:
        buffer.append(palavra)
        termina_frase = palavra.palavra.strip().endswith((".", "!", "?"))
        if len(buffer) >= max_palavras or termina_frase:
            chunks.append(
                ChunkLegenda(
                    texto=" ".join(p.palavra for p in buffer),
                    inicio=buffer[0].inicio,
                    fim=buffer[-1].fim,
                )
            )
            buffer = []

    if buffer:
        chunks.append(ChunkLegenda(texto=" ".join(p.palavra for p in buffer), inicio=buffer[0].inicio, fim=buffer[-1].fim))

    return chunks


def _srt_timestamp(segundos: float) -> str:
    ms_total = int(round(segundos * 1000))
    h, resto = divmod(ms_total, 3_600_000)
    m, resto = divmod(resto, 60_000)
    s, ms = divmod(resto, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def salvar_srt(chunks: list[ChunkLegenda], destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    linhas = []
    for i, chunk in enumerate(chunks, start=1):
        linhas.append(str(i))
        linhas.append(f"{_srt_timestamp(chunk.inicio)} --> {_srt_timestamp(chunk.fim)}")
        linhas.append(chunk.texto)
        linhas.append("")
    destino.write_text("\n".join(linhas), encoding="utf-8")
    logger.info("Legendas SRT salvas em %s (%d chunks)", destino, len(chunks))
    return destino


def salvar_chunks_json(chunks: list[ChunkLegenda], destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    data: list[dict[str, Any]] = [
        {"texto": c.texto, "inicio": c.inicio, "fim": c.fim} for c in chunks
    ]
    destino.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return destino


def gerar_legendas(audio_path: Path, saida_dir: Path, *, nome_base: str) -> tuple[Path, Path, list[ChunkLegenda]]:
    """Pipeline completo: transcreve, agrupa em chunks e salva .srt + .json.

    Retorna (caminho_srt, caminho_json, chunks) para uso direto pelo video_builder.
    """
    palavras = transcrever_e_alinhar(audio_path)
    chunks = agrupar_em_chunks(palavras)
    srt_path = salvar_srt(chunks, saida_dir / f"{nome_base}.srt")
    json_path = salvar_chunks_json(chunks, saida_dir / f"{nome_base}.json")
    return srt_path, json_path, chunks
