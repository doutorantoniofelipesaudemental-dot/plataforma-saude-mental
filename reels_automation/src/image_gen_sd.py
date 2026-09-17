"""Geracao de imagens com Stable Diffusion.

Dois backends suportados (escolhidos em settings.json > stable_diffusion.backend):

  - "automatic1111": fala com a API REST do AUTOMATIC1111 WebUI local
    (precisa iniciar o WebUI com a flag --api). Mais leve para este processo
    Python e reaproveita um WebUI que a maioria de quem usa SD ja tem.

  - "diffusers": roda o modelo localmente via biblioteca `diffusers`, sem
    depender de um WebUI rodando. Mais pesado (carrega o modelo na memoria
    deste processo) mas nao precisa de nenhum servico externo.
"""

from __future__ import annotations

import base64
from pathlib import Path

import requests

from .config import SETTINGS
from .logger import get_logger
from .utils import PipelineError, with_retry

logger = get_logger(__name__)

_diffusers_pipeline = None


@with_retry(attempts=3)
def _gerar_automatic1111(prompt: str, destino: Path) -> None:
    api_url = SETTINGS.sd_api_url
    if not api_url:
        raise PipelineError("stable_diffusion.api_url / SD_API_URL nao configurado.")

    sd_cfg = SETTINGS.raw.get("stable_diffusion", {})
    payload = {
        "prompt": prompt,
        "negative_prompt": sd_cfg.get("negative_prompt", ""),
        "steps": sd_cfg.get("steps", 30),
        "cfg_scale": sd_cfg.get("cfg_scale", 7),
        "sampler_name": sd_cfg.get("sampler_name", "DPM++ 2M Karras"),
        "width": sd_cfg.get("width", 1080),
        "height": sd_cfg.get("height", 1920),
    }

    try:
        resp = requests.post(f"{api_url.rstrip('/')}/sdapi/v1/txt2img", json=payload, timeout=180)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise PipelineError(
            f"Falha ao chamar a API do AUTOMATIC1111 em {api_url} — o WebUI esta "
            f"rodando com a flag --api? Detalhe: {exc}"
        ) from exc

    data = resp.json()
    imagens = data.get("images") or []
    if not imagens:
        raise PipelineError(f"AUTOMATIC1111 nao devolveu nenhuma imagem para o prompt: {prompt!r}")

    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(base64.b64decode(imagens[0]))


def _carregar_pipeline_diffusers():
    global _diffusers_pipeline
    if _diffusers_pipeline is not None:
        return _diffusers_pipeline

    import torch
    from diffusers import AutoPipelineForText2Image

    model_id = SETTINGS.get("stable_diffusion", "diffusers_model_id", default="stabilityai/stable-diffusion-xl-base-1.0")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info("Carregando pipeline diffusers '%s' em %s (pode demorar na 1a vez)...", model_id, device)

    try:
        pipe = AutoPipelineForText2Image.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            use_safetensors=True,
        )
        pipe = pipe.to(device)
    except Exception as exc:  # noqa: BLE001
        raise PipelineError(f"Falha ao carregar o modelo diffusers '{model_id}': {exc}") from exc

    _diffusers_pipeline = pipe
    return pipe


@with_retry(attempts=2)
def _gerar_diffusers(prompt: str, destino: Path) -> None:
    pipe = _carregar_pipeline_diffusers()
    sd_cfg = SETTINGS.raw.get("stable_diffusion", {})
    try:
        imagem = pipe(
            prompt=prompt,
            negative_prompt=sd_cfg.get("negative_prompt", ""),
            num_inference_steps=sd_cfg.get("steps", 30),
            guidance_scale=sd_cfg.get("cfg_scale", 7),
            width=sd_cfg.get("width", 1080),
            height=sd_cfg.get("height", 1920),
        ).images[0]
    except Exception as exc:  # noqa: BLE001
        raise PipelineError(f"Falha ao gerar imagem via diffusers: {exc}") from exc

    destino.parent.mkdir(parents=True, exist_ok=True)
    imagem.save(destino)


def gerar_imagem(prompt: str, destino: Path) -> Path:
    """Gera uma imagem para `prompt` usando o backend configurado e salva em `destino`."""
    backend = SETTINGS.sd_backend
    logger.info("Gerando imagem (backend=%s) -> %s", backend, destino)

    if backend == "automatic1111":
        _gerar_automatic1111(prompt, destino)
    elif backend == "diffusers":
        _gerar_diffusers(prompt, destino)
    else:
        raise PipelineError(f"Backend de Stable Diffusion desconhecido: {backend!r}")

    if not destino.exists() or destino.stat().st_size == 0:
        raise PipelineError(f"Geracao de imagem nao produziu arquivo valido em {destino}")

    return destino


def gerar_imagens(prompts: list[str], saida_dir: Path, *, nome_base: str) -> list[Path]:
    """Gera uma imagem por prompt. Continua tentando as demais mesmo se uma
    cena falhar apos os retries — o video_builder decide o que fazer com
    menos cenas do que o previsto."""
    saida_dir.mkdir(parents=True, exist_ok=True)
    caminhos: list[Path] = []
    for i, prompt in enumerate(prompts, start=1):
        destino = saida_dir / f"{nome_base}_{i:02d}.png"
        try:
            gerar_imagem(prompt, destino)
            caminhos.append(destino)
        except PipelineError as exc:
            logger.error("Cena %d/%d falhou e sera pulada: %s", i, len(prompts), exc)

    if not caminhos:
        raise PipelineError("Nenhuma imagem foi gerada com sucesso para nenhum dos prompts.")

    return caminhos
