"""Logging centralizado do pipeline: console + arquivo rotativo em logs/."""

from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"

_CONFIGURED_LOGGERS: set[str] = set()


def get_logger(name: str = "reels_automation", *, level: int = logging.INFO) -> logging.Logger:
    """Retorna um logger configurado com saida em console e arquivo rotativo.

    Chamar varias vezes com o mesmo nome nao duplica handlers.
    """
    logger = logging.getLogger(name)
    if name in _CONFIGURED_LOGGERS:
        return logger

    logger.setLevel(level)
    logger.propagate = False

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(stream=sys.stdout)
    console.setFormatter(fmt)
    console.setLevel(level)
    logger.addHandler(console)

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_handler = RotatingFileHandler(
        LOGS_DIR / "pipeline.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(fmt)
    file_handler.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)

    error_handler = RotatingFileHandler(
        LOGS_DIR / "errors.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setFormatter(fmt)
    error_handler.setLevel(logging.ERROR)
    logger.addHandler(error_handler)

    _CONFIGURED_LOGGERS.add(name)
    return logger
