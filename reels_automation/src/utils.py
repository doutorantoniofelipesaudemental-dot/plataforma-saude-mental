"""Utilitarios compartilhados: erros do pipeline, retry, slugify, subprocess."""

from __future__ import annotations

import re
import shutil
import subprocess
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Sequence

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .logger import get_logger

logger = get_logger(__name__)


class PipelineError(RuntimeError):
    """Erro de qualquer etapa do pipeline (roteiro, TTS, legendas, SD, video, publicacao)."""


class SubprocessError(PipelineError):
    """Um script externo (raiz do repo) retornou codigo de saida != 0."""


def slugify(text: str) -> str:
    """Converte um titulo/tema em slug ascii-lower-kebab, igual ao usado em
    carrosseis-instagram/<slug>/ na raiz do repo."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "reel-sem-titulo"


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def check_executable(name: str) -> bool:
    """Verifica se um executavel (ffmpeg, magick, etc.) esta no PATH."""
    found = shutil.which(name) is not None
    if not found:
        logger.warning("Executavel '%s' nao encontrado no PATH.", name)
    return found


def with_retry(*, attempts: int = 3, min_wait: float = 1.0, max_wait: float = 10.0):
    """Decorator de retry com backoff exponencial, logando cada tentativa."""

    def _before_sleep(retry_state):
        logger.warning(
            "Tentativa %s/%s falhou para %s: %s — tentando de novo...",
            retry_state.attempt_number,
            attempts,
            retry_state.fn.__name__ if retry_state.fn else "?",
            retry_state.outcome.exception(),
        )

    return retry(
        stop=stop_after_attempt(attempts),
        wait=wait_exponential(multiplier=min_wait, max=max_wait),
        retry=retry_if_exception_type(Exception),
        reraise=True,
        before_sleep=_before_sleep,
    )


def run_subprocess(
    args: Sequence[str],
    *,
    cwd: Path,
    timeout: int = 300,
    step_name: str = "subprocess",
) -> str:
    """Executa um script externo (ex.: publicar_instagram.py na raiz do repo),
    loga stdout/stderr e levanta SubprocessError se o codigo de saida for != 0.

    Retorna o stdout (para parsing, ex.: URL publica impressa por
    preparar_midia_publica.py).
    """
    logger.info("[%s] executando: %s (cwd=%s)", step_name, " ".join(args), cwd)
    try:
        result = subprocess.run(
            args,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        logger.error("[%s] timeout apos %ss", step_name, timeout)
        raise SubprocessError(f"{step_name}: timeout apos {timeout}s") from exc

    if result.stdout:
        logger.debug("[%s] stdout:\n%s", step_name, result.stdout)
    if result.stderr:
        logger.debug("[%s] stderr:\n%s", step_name, result.stderr)

    if result.returncode != 0:
        logger.error("[%s] falhou com codigo %s", step_name, result.returncode)
        raise SubprocessError(
            f"{step_name} falhou (codigo {result.returncode}): {result.stderr.strip()[-2000:]}"
        )

    return result.stdout
