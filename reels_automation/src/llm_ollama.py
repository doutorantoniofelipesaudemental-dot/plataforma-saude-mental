"""Geracao de roteiro de Reel via Ollama local.

Le opcionalmente uma linha de ../30_REELS_FACELESS.csv (Numero ou Tema) para
aproveitar o calendario de conteudo ja existente (Texto de Tela, Sugestao de
B-roll, Legenda, Hashtags) e pede ao modelo local para expandir isso em:
  - narracao (texto corrido para a TTS, tom clinico-acolhedor)
  - prompts de imagem (para Stable Diffusion, um por "cena")
  - legenda final do Instagram + hashtags

Se nenhuma linha do CSV bater com --tema/--numero, gera tudo do zero a partir
do tema livre informado.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import requests

from .config import SETTINGS
from .logger import get_logger
from .utils import PipelineError, slugify, with_retry

logger = get_logger(__name__)

SYSTEM_PROMPT_TEMPLATE = """Voce e o redator do perfil de Instagram do Dr. Saude Mental \
(Dr. Antonio Felipe, psiquiatra). Escreva roteiros de Reels faceless (sem rosto \
aparecendo, so narracao + imagens de apoio).

Voz de marca (obrigatorio seguir): {voz_marca}

Responda APENAS com um JSON valido, sem markdown, sem comentarios, no formato:
{{
  "titulo_tela": "texto curto de ate 8 palavras para abrir o video na tela",
  "narracao": "texto corrido em portugues do Brasil, 80 a 150 palavras, para ser lido em voz alta por uma TTS, dividido em frases curtas",
  "prompts_imagens": ["prompt em ingles descrevendo uma cena/foto realista, sem texto na imagem", "..."],
  "legenda_instagram": "legenda para o post, 2 a 4 frases, terminando com uma pergunta ou chamada leve para o link na bio",
  "hashtags": ["#exemplo1", "#exemplo2"]
}}

Gere entre 4 e 6 prompts_imagens, um para cada momento/cena da narracao, em ingles, \
descrevendo cenas realistas de consultorio, cotidiano ou metaforas visuais — nunca \
pessoas identificaveis, nunca texto embutido na imagem.
"""

USER_PROMPT_TEMPLATE = """Tema do Reel: {tema}
Categoria: {categoria}
Texto de tela sugerido (pode reaproveitar ou melhorar): {texto_tela}
Sugestao de b-roll do calendario (use como inspiracao para prompts_imagens): {broll}
Legenda de referencia do calendario (pode reaproveitar ou melhorar): {legenda_ref}
Hashtags de referencia: {hashtags_ref}

Escreva o roteiro completo no formato JSON pedido.
"""


@dataclass
class RoteiroReel:
    tema: str
    slug: str
    titulo_tela: str
    narracao: str
    prompts_imagens: list[str]
    legenda_instagram: str
    hashtags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "tema": self.tema,
            "slug": self.slug,
            "titulo_tela": self.titulo_tela,
            "narracao": self.narracao,
            "prompts_imagens": self.prompts_imagens,
            "legenda_instagram": self.legenda_instagram,
            "hashtags": self.hashtags,
        }

    def save(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info("Roteiro salvo em %s", path)
        return path


def _find_csv_row(*, numero: int | None, tema: str | None) -> dict[str, str] | None:
    csv_path = SETTINGS.csv_path
    if not csv_path.exists():
        logger.warning("CSV de conteudo nao encontrado em %s — seguindo sem ele.", csv_path)
        return None
    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if numero is not None and row.get("Nº", "").strip() == str(numero):
                return row
            if tema and row.get("Tema", "").strip().lower() == tema.strip().lower():
                return row
    return None


def _extract_json(raw_text: str) -> dict[str, Any]:
    """Modelos locais as vezes envolvem o JSON em ```json ... ``` ou acrescentam
    texto antes/depois. Extrai o primeiro bloco {...} valido."""
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Resposta do Ollama nao e JSON valido: {exc}\n---\n{raw_text[:1000]}") from exc


@with_retry(attempts=3)
def _call_ollama(system_prompt: str, user_prompt: str) -> str:
    url = f"{SETTINGS.ollama_host.rstrip('/')}/api/chat"
    payload = {
        "model": SETTINGS.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": SETTINGS.get("ollama", "temperature", default=0.7),
            "num_predict": SETTINGS.get("ollama", "num_predict", default=900),
        },
    }
    timeout = SETTINGS.get("ollama", "timeout_seconds", default=180)
    logger.info("Chamando Ollama (%s) em %s", SETTINGS.ollama_model, url)
    try:
        resp = requests.post(url, json=payload, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise PipelineError(
            f"Falha ao chamar o Ollama em {url} — ele esta rodando? (`ollama serve`, "
            f"`ollama pull {SETTINGS.ollama_model}`). Detalhe: {exc}"
        ) from exc
    data = resp.json()
    content = data.get("message", {}).get("content", "")
    if not content:
        raise PipelineError(f"Resposta vazia do Ollama: {data}")
    return content


def gerar_roteiro(*, tema: str | None = None, numero: int | None = None) -> RoteiroReel:
    row = _find_csv_row(numero=numero, tema=tema)

    if row:
        tema_final = row.get("Tema", tema or "").strip()
        categoria = row.get("Categoria", "").strip()
        texto_tela = row.get("Texto de Tela", "").strip()
        broll = row.get("Sugestão de B-roll", "").strip()
        legenda_ref = row.get("Legenda", "").strip()
        hashtags_ref = row.get("Hashtags", "").strip()
        slug = row.get("Slug do Artigo", "").strip() or slugify(tema_final)
    else:
        if not tema:
            raise PipelineError("Informe --tema (nenhuma linha do CSV encontrada) para gerar o roteiro.")
        tema_final = tema
        categoria = ""
        texto_tela = ""
        broll = ""
        legenda_ref = ""
        hashtags_ref = ""
        slug = slugify(tema_final)

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(voz_marca=SETTINGS.get("content", "voz_marca", default=""))
    user_prompt = USER_PROMPT_TEMPLATE.format(
        tema=tema_final,
        categoria=categoria or "Relatos da Pratica",
        texto_tela=texto_tela or "(gerar do zero)",
        broll=broll or "(gerar do zero)",
        legenda_ref=legenda_ref or "(gerar do zero)",
        hashtags_ref=hashtags_ref or ", ".join(SETTINGS.get("content", "hashtags_padrao", default=[])),
    )

    raw = _call_ollama(system_prompt, user_prompt)
    parsed = _extract_json(raw)

    hashtags = parsed.get("hashtags") or [h.strip() for h in hashtags_ref.split() if h.strip()]
    if not hashtags:
        hashtags = SETTINGS.get("content", "hashtags_padrao", default=[])

    prompts_imagens = parsed.get("prompts_imagens") or []
    style_suffix = SETTINGS.get("stable_diffusion", "style_suffix", default="")
    if style_suffix:
        prompts_imagens = [f"{p.strip()}, {style_suffix}" for p in prompts_imagens]

    roteiro = RoteiroReel(
        tema=tema_final,
        slug=slug,
        titulo_tela=parsed.get("titulo_tela", texto_tela or tema_final)[:120],
        narracao=parsed.get("narracao", "").strip(),
        prompts_imagens=prompts_imagens,
        legenda_instagram=parsed.get("legenda_instagram", legenda_ref).strip(),
        hashtags=hashtags,
    )

    if not roteiro.narracao:
        raise PipelineError("O Ollama nao devolveu narracao — verifique o modelo/prompt e tente de novo.")
    if not roteiro.prompts_imagens:
        raise PipelineError("O Ollama nao devolveu prompts_imagens — verifique o modelo/prompt e tente de novo.")

    logger.info("Roteiro gerado para tema '%s' (slug=%s, %d cenas)", tema_final, slug, len(roteiro.prompts_imagens))
    return roteiro
