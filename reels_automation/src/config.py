"""Carrega settings.json + .env (local) + ../.env.local (raiz do repo, credenciais
de Instagram/Composio/Blob usadas pelos scripts externos que este pipeline chama)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from dotenv import dotenv_values

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_REPO_DIR = BASE_DIR.parent
SETTINGS_PATH = BASE_DIR / "settings.json"


def _load_settings() -> dict[str, Any]:
    if not SETTINGS_PATH.exists():
        raise FileNotFoundError(f"settings.json nao encontrado em {SETTINGS_PATH}")
    with SETTINGS_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _load_env() -> dict[str, str]:
    """Mescla ../.env.local (raiz, credenciais Instagram/Composio/Blob) com
    .env local (config do pipeline) e as variaveis de ambiente do processo,
    nessa ordem de prioridade crescente."""
    merged: dict[str, str] = {}
    root_env = ROOT_REPO_DIR / ".env.local"
    if root_env.exists():
        merged.update({k: v for k, v in dotenv_values(root_env).items() if v is not None})
    local_env = BASE_DIR / ".env"
    if local_env.exists():
        merged.update({k: v for k, v in dotenv_values(local_env).items() if v is not None})
    merged.update({k: v for k, v in os.environ.items() if v is not None})
    return merged


@dataclass
class Settings:
    raw: dict[str, Any] = field(default_factory=_load_settings)
    env: dict[str, str] = field(default_factory=_load_env)

    def get(self, *path: str, default: Any = None) -> Any:
        node: Any = self.raw
        for key in path:
            if not isinstance(node, dict) or key not in node:
                return default
            node = node[key]
        return node

    def env_get(self, key: str, default: str | None = None) -> str | None:
        value = self.env.get(key, default)
        return value if value not in (None, "") else default

    def require_env(self, key: str) -> str:
        value = self.env_get(key)
        if not value:
            raise RuntimeError(
                f"Variavel de ambiente obrigatoria '{key}' nao definida "
                f"(esperada em {ROOT_REPO_DIR / '.env.local'} ou {BASE_DIR / '.env'})."
            )
        return value

    # --- atalhos usados com frequencia pelo pipeline ---

    @property
    def ollama_host(self) -> str:
        return self.env_get("OLLAMA_HOST", self.get("ollama", "host", default="http://localhost:11434"))

    @property
    def ollama_model(self) -> str:
        return self.env_get("OLLAMA_MODEL", self.get("ollama", "model", default="deepseek-r1:8b"))

    @property
    def edge_tts_voice(self) -> str:
        return self.env_get("EDGE_TTS_VOICE", self.get("tts", "voice", default="pt-BR-AntonioNeural"))

    @property
    def sd_backend(self) -> str:
        return self.get("stable_diffusion", "backend", default="automatic1111")

    @property
    def sd_api_url(self) -> str:
        return self.env_get("SD_API_URL", self.get("stable_diffusion", "api_url"))

    @property
    def whisperx_device(self) -> str:
        return self.env_get("WHISPERX_DEVICE", self.get("whisperx", "device", default="cpu"))

    @property
    def whisperx_compute_type(self) -> str:
        return self.env_get("WHISPERX_COMPUTE_TYPE", self.get("whisperx", "compute_type", default="int8"))

    @property
    def assets_dir(self) -> Path:
        return BASE_DIR / self.get("paths", "assets_dir", default="assets")

    @property
    def csv_path(self) -> Path:
        return (BASE_DIR / self.get("content", "csv_path", default="../30_REELS_FACELESS.csv")).resolve()

    @property
    def publish_method(self) -> str:
        return self.env_get(
            "INSTAGRAM_PUBLISH_METHOD", self.get("instagram", "default_publisher", default="graph")
        )


SETTINGS = Settings()
