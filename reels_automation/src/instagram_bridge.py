"""Ponte para a publicacao no Instagram, reaproveitando os scripts que ja
existem na raiz do repositorio em vez de reimplementar Graph API / Composio:

  - preparar_midia_publica.py  -> hospeda o .mp4 local no Vercel Blob e
                                   devolve uma URL HTTPS publica (a Meta so
                                   aceita midia por URL, nunca caminho local).
  - publicar_instagram.py      -> publica via Meta Graph API direta (metodo
                                   "graph", 2 etapas: container + publish).
  - post_instagram.py          -> gera legenda com Claude e publica via
                                   Composio (metodo "composio").

Este modulo so orquestra: copia o video renderizado para
carrosseis-instagram/<slug>/reel.mp4 (mesma convencao ja usada pelos
carrosseis) e chama os scripts acima como subprocesso, no mesmo interpretador
Python usado para rodar este pipeline.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

from .config import ROOT_REPO_DIR, SETTINGS
from .logger import get_logger
from .utils import PipelineError, run_subprocess

logger = get_logger(__name__)

_MEDIA_ID_RE = re.compile(r"media_id=(\S+)")


def _script_path(nome_settings_key: str) -> Path:
    nome_arquivo = SETTINGS.get("instagram", "root_scripts", nome_settings_key)
    caminho = ROOT_REPO_DIR / nome_arquivo
    if not caminho.exists():
        raise PipelineError(f"Script esperado na raiz do repo nao encontrado: {caminho}")
    return caminho


def copiar_video_para_carrossel(video_path: Path, slug: str) -> Path:
    """Copia o .mp4 renderizado para carrosseis-instagram/<slug>/reel.mp4,
    a mesma pasta que preparar_midia_publica.py sabe subir para o Vercel Blob."""
    if not video_path.exists():
        raise PipelineError(f"Video final nao encontrado para publicar: {video_path}")

    pasta_destino = ROOT_REPO_DIR / SETTINGS.get("instagram", "carousel_folder", default="carrosseis-instagram") / slug
    pasta_destino.mkdir(parents=True, exist_ok=True)
    nome_arquivo = SETTINGS.get("instagram", "media_filename", default="reel.mp4")
    destino = pasta_destino / nome_arquivo
    shutil.copyfile(video_path, destino)
    logger.info("Video copiado para %s", destino)
    return destino


def obter_url_publica(slug: str, *, forcar_upload: bool = False) -> str:
    """Roda preparar_midia_publica.py <slug> --formato midias e devolve a URL
    HTTPS publica do video (Vercel Blob)."""
    script = _script_path("prepare_media")
    args = [sys.executable, str(script), slug, "--formato", "midias"]
    if forcar_upload:
        args.append("--forcar")

    saida = run_subprocess(args, cwd=ROOT_REPO_DIR, timeout=180, step_name="preparar_midia_publica")
    urls = saida.strip().split()
    if not urls:
        raise PipelineError(
            f"preparar_midia_publica.py nao devolveu nenhuma URL para o slug '{slug}'. Saida: {saida!r}"
        )
    url = urls[-1]
    logger.info("URL publica obtida: %s", url)
    return url


def publicar_via_graph(video_url: str, legenda: str) -> str:
    """Publica o Reel via Meta Graph API direta (publicar_instagram.py)."""
    script = _script_path("publish_graph")
    args = [sys.executable, str(script), "reels", "--video-url", video_url, "--legenda", legenda]
    saida = run_subprocess(args, cwd=ROOT_REPO_DIR, timeout=300, step_name="publicar_instagram (graph)")

    match = _MEDIA_ID_RE.search(saida)
    if not match:
        raise PipelineError(f"publicar_instagram.py rodou mas nao confirmou media_id. Saida: {saida!r}")
    media_id = match.group(1)
    logger.info("Reel publicado via Graph API. media_id=%s", media_id)
    return media_id


def publicar_via_composio(video_url: str, tema: str) -> str:
    """Publica o Reel via Composio (post_instagram.py), que tambem gera a
    legenda com Claude a partir do tema — usa a legenda gerada la, nao a
    nossa, para manter uma unica fonte de verdade de copy quando esse metodo
    e escolhido."""
    script = _script_path("publish_composio")
    args = [
        sys.executable, str(script), "publicar",
        "--media-url", video_url,
        "--tema", tema,
        "--tipo-midia", "video",
    ]
    saida = run_subprocess(args, cwd=ROOT_REPO_DIR, timeout=300, step_name="post_instagram (composio)")

    match = _MEDIA_ID_RE.search(saida)
    if not match:
        raise PipelineError(f"post_instagram.py rodou mas nao confirmou media_id. Saida: {saida!r}")
    media_id = match.group(1)
    logger.info("Reel publicado via Composio. media_id=%s", media_id)
    return media_id


def publicar_reel(
    *,
    video_path: Path,
    slug: str,
    legenda: str,
    tema: str,
    metodo: str | None = None,
) -> str:
    """Fluxo completo: copia o video pra pasta de carrossel, sobe pro Vercel
    Blob e publica pelo metodo escolhido ("graph" ou "composio"). Devolve o media_id."""
    metodo = metodo or SETTINGS.publish_method
    copiar_video_para_carrossel(video_path, slug)
    video_url = obter_url_publica(slug)

    if metodo == "graph":
        return publicar_via_graph(video_url, legenda)
    if metodo == "composio":
        return publicar_via_composio(video_url, tema)

    raise PipelineError(f"Metodo de publicacao desconhecido: {metodo!r} (use 'graph' ou 'composio')")
