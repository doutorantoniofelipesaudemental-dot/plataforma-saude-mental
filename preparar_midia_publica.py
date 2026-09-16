"""Sobe as midias locais de carrosseis-instagram/ para o Vercel Blob (armazenamento
publico) e devolve URLs HTTPS prontas para o parametro --midias de
publicar_instagram.py.

Por que isso existe: a Meta baixa a midia do servidor de origem ao criar um
container (POST /media), entao um caminho local (C:\\...\\01-capa.png) nunca
funciona — precisa ser uma URL publica. Este script fecha essa lacuna.

Fluxo por slug (carrosseis-instagram/<slug>/):
    1. Le os arquivos de midia da pasta (PNG/JPG/WEBP/MP4/MOV), ordenados por nome.
    2. Converte imagem para JPEG quando necessario — a API de publicacao da Meta
       so aceita JPEG para fotos e itens de carrossel; PNG e rejeitado no
       momento da publicacao, nao no upload, entao o erro apareceria tarde.
    3. Sobe cada arquivo final para o Vercel Blob (armazenamento publico) via
       PUT https://blob.vercel-storage.com — protocolo confirmado a partir do
       pacote publicado `vercel_blob` (SuryaSekhar14/vercel_blob), sem
       depender dele diretamente.
    4. Cacheia localmente (hash + URL) para nao reenviar arquivo que nao mudou.

Credenciais em .env.local:
    BLOB_READ_WRITE_TOKEN=<token do Vercel Blob>

Como obter o token: no dashboard da Vercel, Storage > Blob > criar um store
(acesso publico) > Connect to Project, ou rode `vercel env pull .env.local`
se o projeto ja tiver um store conectado.

Uso via linha de comando:

    python preparar_midia_publica.py <slug>                 # um carrossel
    python preparar_midia_publica.py <slug> --formato midias  # so as URLs, prontas p/ --midias
    python preparar_midia_publica.py <slug> --publicar        # sobe e ja publica no Instagram
    python preparar_midia_publica.py --todos                  # todos os carrosseis da pasta
    python preparar_midia_publica.py --listar                 # lista slugs disponiveis

Exemplo de integracao com publicar_instagram.py:

    python preparar_midia_publica.py burnout-medicos-enfermeiros --formato midias
    python publicar_instagram.py carrossel --midias <URLs impressas acima> --legenda "..."

Dependencias: requests, python-dotenv, Pillow.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import random
import sys
import time
from pathlib import Path
from typing import Any, Sequence

import requests
from dotenv import dotenv_values

# --------------------------------------------------------------------------- #
# Constantes
# --------------------------------------------------------------------------- #

RAIZ_PROJETO = Path(__file__).resolve().parent
PASTA_CARROSSEIS = RAIZ_PROJETO / "carrosseis-instagram"
ARQUIVO_ENV = RAIZ_PROJETO / ".env.local"

# Protocolo confirmado a partir do codigo-fonte do pacote publicado
# `vercel_blob` (PyPI), que implementa o mesmo contrato usado pelo SDK oficial
# @vercel/blob para uploads simples via PUT.
BLOB_BASE_URL = os.environ.get("BLOB_API_URL", "https://blob.vercel-storage.com")
BLOB_API_VERSION = os.environ.get("BLOB_API_VERSION", "10")
BLOB_CACHE_MAX_AGE = "31536000"  # 1 ano — mesmo default do SDK.

EXTENSOES_IMAGEM = {".png", ".jpg", ".jpeg", ".webp"}
EXTENSOES_VIDEO = {".mp4", ".mov"}
ARQUIVOS_IGNORADOS = {"legenda.txt", "info.txt"}

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
}

TENTATIVAS_MAX = 5
BACKOFF_BASE_S = 2.0
BACKOFF_TETO_S = 60.0
TIMEOUT_HTTP = (10, 120)  # upload de video pode demorar mais que o Reels/Story.

QUALIDADE_JPEG = 92

log = logging.getLogger("preparar_midia_publica")


# --------------------------------------------------------------------------- #
# Erros
# --------------------------------------------------------------------------- #


class ErroMidia(RuntimeError):
    """Falha ao preparar ou subir uma midia."""


class ErroCredencialBlob(ErroMidia):
    """BLOB_READ_WRITE_TOKEN ausente ou placeholder em .env.local."""


# --------------------------------------------------------------------------- #
# Credenciais
# --------------------------------------------------------------------------- #

_PLACEHOLDERS = ("seu_", "sua_", "your_", "xxx", "<", "changeme")


def _valor_util(valor: str | None) -> str | None:
    if not valor:
        return None
    limpo = valor.strip().strip('"').strip("'")
    if not limpo or limpo.lower().startswith(_PLACEHOLDERS):
        return None
    return limpo


def carregar_token_blob(caminho: Path | None = None) -> str:
    arquivo = caminho or ARQUIVO_ENV
    do_arquivo = dotenv_values(arquivo) if arquivo.exists() else {}
    token = _valor_util(do_arquivo.get("BLOB_READ_WRITE_TOKEN")) or _valor_util(
        os.environ.get("BLOB_READ_WRITE_TOKEN")
    )
    if not token:
        raise ErroCredencialBlob(
            f"Preencha BLOB_READ_WRITE_TOKEN em {arquivo}. "
            "Crie um Blob store publico no dashboard da Vercel (Storage > Blob > Create), "
            "conecte ao projeto e copie o token — ou rode `vercel env pull .env.local` "
            "se o store ja estiver conectado."
        )
    return token


# --------------------------------------------------------------------------- #
# Upload para o Vercel Blob
# --------------------------------------------------------------------------- #


def _espera_backoff(tentativa: int, resposta: requests.Response | None) -> float:
    if resposta is not None:
        cabecalho = resposta.headers.get("Retry-After")
        if cabecalho:
            try:
                return min(float(cabecalho), BACKOFF_TETO_S)
            except ValueError:
                pass
    espera = min(BACKOFF_BASE_S * (2 ** (tentativa - 1)), BACKOFF_TETO_S)
    return espera + random.uniform(0, espera * 0.25)


def _mensagem_erro_blob(resposta: requests.Response) -> str:
    try:
        corpo = resposta.json()
        detalhe = corpo.get("error", corpo) if isinstance(corpo, dict) else corpo
    except ValueError:
        detalhe = resposta.text[:300]
    return f"HTTP {resposta.status_code}: {detalhe}"


def enviar_para_blob(
    pathname: str,
    conteudo: bytes,
    content_type: str,
    token: str,
    *,
    permitir_sobrescrever: bool = True,
) -> str:
    """PUT direto no Vercel Blob (armazenamento publico). Retorna a URL final.

    pathname vira a URL publica (sem sufixo aleatorio, para ficar previsivel
    e cacheavel entre execucoes): .../carrosseis-instagram/<slug>/<arquivo>.
    """
    headers = {
        "access": "public",
        "authorization": f"Bearer {token}",
        "x-api-version": BLOB_API_VERSION,
        "x-content-type": content_type,
        "x-cache-control-max-age": BLOB_CACHE_MAX_AGE,
    }
    if permitir_sobrescrever:
        headers["x-allow-overwrite"] = "1"

    url = f"{BLOB_BASE_URL}/?pathname={requests.utils.quote(pathname)}"

    ultima_falha = ""
    for tentativa in range(1, TENTATIVAS_MAX + 1):
        try:
            resposta = requests.put(url, headers=headers, data=conteudo, timeout=TIMEOUT_HTTP)
        except requests.RequestException as exc:
            ultima_falha = f"falha de rede: {exc}"
            if tentativa == TENTATIVAS_MAX:
                break
            espera = _espera_backoff(tentativa, None)
            log.warning("%s — nova tentativa em %.1fs (%d/%d)", ultima_falha, espera, tentativa, TENTATIVAS_MAX)
            time.sleep(espera)
            continue

        if resposta.ok:
            dados = resposta.json()
            url_publica = dados.get("url")
            if not url_publica:
                raise ErroMidia(f"Upload sem 'url' na resposta do Blob: {dados}")
            return url_publica

        ultima_falha = _mensagem_erro_blob(resposta)
        recuperavel = resposta.status_code == 429 or resposta.status_code >= 500
        if not recuperavel or tentativa == TENTATIVAS_MAX:
            raise ErroMidia(f"Upload de {pathname!r} falhou — {ultima_falha}")

        espera = _espera_backoff(tentativa, resposta)
        log.warning(
            "Rate limit/instabilidade no Blob (%s) — aguardando %.1fs (%d/%d)",
            pathname,
            espera,
            tentativa,
            TENTATIVAS_MAX,
        )
        time.sleep(espera)

    raise ErroMidia(f"Upload de {pathname!r} falhou apos {TENTATIVAS_MAX} tentativas — {ultima_falha}")


# --------------------------------------------------------------------------- #
# Conversao PNG/WEBP -> JPEG (exigencia da API de publicacao da Meta)
# --------------------------------------------------------------------------- #


def _converter_para_jpeg(origem: Path, destino: Path) -> bytes:
    """Converte para JPEG, achatando transparencia sobre fundo branco.

    Reaproveita o cache em disco quando destino ja e mais novo que a origem —
    evita reconverter a cada execucao quando nada mudou.
    """
    if destino.exists() and destino.stat().st_mtime >= origem.stat().st_mtime:
        return destino.read_bytes()

    try:
        from PIL import Image
    except ImportError as exc:
        raise ErroMidia(
            "Pillow nao instalado — necessario para converter PNG/WEBP em JPEG "
            "(exigencia da API de publicacao da Meta, que so aceita JPEG). "
            "Rode: pip install -r requirements.txt"
        ) from exc

    with Image.open(origem) as imagem:
        if imagem.mode in ("RGBA", "LA", "P"):
            base = Image.new("RGB", imagem.size, (255, 255, 255))
            rgba = imagem.convert("RGBA")
            base.paste(rgba, mask=rgba.split()[-1])
            imagem_final = base
        else:
            imagem_final = imagem.convert("RGB")

        destino.parent.mkdir(parents=True, exist_ok=True)
        imagem_final.save(destino, "JPEG", quality=QUALIDADE_JPEG, optimize=True)

    return destino.read_bytes()


def _preparar_midia(caminho: Path) -> tuple[bytes, str, str, str]:
    """Retorna (conteudo, nome_final, content_type, tipo) para um arquivo local.

    tipo e "imagem" ou "video". Imagens PNG/WEBP sao convertidas para JPEG;
    JPG/JPEG e videos sao usados como estao.
    """
    ext = caminho.suffix.lower()

    if ext in {".png", ".webp"}:
        cache_dir = caminho.parent / ".jpg_cache"
        destino = cache_dir / f"{caminho.stem}.jpg"
        conteudo = _converter_para_jpeg(caminho, destino)
        return conteudo, destino.name, "image/jpeg", "imagem"

    if ext in {".jpg", ".jpeg"}:
        return caminho.read_bytes(), caminho.name, CONTENT_TYPES[ext], "imagem"

    if ext in EXTENSOES_VIDEO:
        return caminho.read_bytes(), caminho.name, CONTENT_TYPES[ext], "video"

    raise ErroMidia(f"Extensao nao suportada: {caminho.name}")


# --------------------------------------------------------------------------- #
# Cache de URLs ja publicadas (por slug)
# --------------------------------------------------------------------------- #


def _arquivo_manifesto(pasta_slug: Path) -> Path:
    return pasta_slug / ".urls_publicadas.json"


def _ler_manifesto(pasta_slug: Path) -> dict[str, Any]:
    caminho = _arquivo_manifesto(pasta_slug)
    if not caminho.exists():
        return {}
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _gravar_manifesto(pasta_slug: Path, manifesto: dict[str, Any]) -> None:
    caminho = _arquivo_manifesto(pasta_slug)
    tmp = caminho.with_suffix(".tmp")
    tmp.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(caminho)


# --------------------------------------------------------------------------- #
# API publica
# --------------------------------------------------------------------------- #


def listar_slugs() -> list[str]:
    if not PASTA_CARROSSEIS.exists():
        return []
    return sorted(p.name for p in PASTA_CARROSSEIS.iterdir() if p.is_dir() and not p.name.startswith("."))


def ler_legenda(slug: str) -> str | None:
    caminho = PASTA_CARROSSEIS / slug / "legenda.txt"
    if not caminho.exists():
        return None
    return caminho.read_text(encoding="utf-8").strip()


def preparar_slug(
    slug: str,
    *,
    forcar: bool = False,
    token: str | None = None,
) -> list[dict[str, str]]:
    """Sobe as midias de carrosseis-instagram/<slug>/ e retorna, em ordem:

        [{"arquivo": "01-capa.png", "url": "https://...", "tipo": "imagem"}, ...]

    Pula o upload de arquivos cujo conteudo (pos-conversao) nao mudou desde a
    ultima execucao, a menos que forcar=True.
    """
    pasta_slug = PASTA_CARROSSEIS / slug
    if not pasta_slug.is_dir():
        disponiveis = ", ".join(listar_slugs()) or "(nenhum encontrado)"
        raise ErroMidia(f"Carrossel {slug!r} nao encontrado em {PASTA_CARROSSEIS}. Disponiveis: {disponiveis}")

    arquivos = sorted(
        p
        for p in pasta_slug.iterdir()
        if p.is_file()
        and p.name not in ARQUIVOS_IGNORADOS
        and not p.name.startswith(".")
        and p.suffix.lower() in (EXTENSOES_IMAGEM | EXTENSOES_VIDEO)
    )
    if not arquivos:
        raise ErroMidia(f"Nenhuma midia (png/jpg/webp/mp4/mov) encontrada em {pasta_slug}.")

    token = token or carregar_token_blob()
    manifesto = _ler_manifesto(pasta_slug)
    resultado: list[dict[str, str]] = []
    houve_mudanca = False

    for arquivo in arquivos:
        conteudo, nome_final, content_type, tipo = _preparar_midia(arquivo)
        hash_conteudo = hashlib.sha256(conteudo).hexdigest()

        entrada = manifesto.get(arquivo.name)
        if not forcar and entrada and entrada.get("sha256") == hash_conteudo and entrada.get("url"):
            log.info("Sem mudanca — reaproveitando URL de %s.", arquivo.name)
            resultado.append({"arquivo": arquivo.name, "url": entrada["url"], "tipo": tipo})
            continue

        pathname = f"carrosseis-instagram/{slug}/{nome_final}"
        log.info("Enviando %s -> %s ...", arquivo.name, pathname)
        url_publica = enviar_para_blob(pathname, conteudo, content_type, token)

        manifesto[arquivo.name] = {
            "sha256": hash_conteudo,
            "pathname": pathname,
            "url": url_publica,
        }
        houve_mudanca = True
        resultado.append({"arquivo": arquivo.name, "url": url_publica, "tipo": tipo})

    if houve_mudanca:
        _gravar_manifesto(pasta_slug, manifesto)

    return resultado


def preparar_todos(*, forcar: bool = False, token: str | None = None) -> dict[str, list[dict[str, str]]]:
    token = token or carregar_token_blob()
    saida: dict[str, list[dict[str, str]]] = {}
    for slug in listar_slugs():
        saida[slug] = preparar_slug(slug, forcar=forcar, token=token)
    return saida


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _montar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="preparar_midia_publica.py",
        description="Sobe midias de carrosseis-instagram/ para o Vercel Blob e devolve URLs HTTPS.",
    )
    parser.add_argument("slug", nargs="?", help="pasta em carrosseis-instagram/ a processar")
    parser.add_argument("--todos", action="store_true", help="processar todos os carrosseis da pasta")
    parser.add_argument("--forcar", action="store_true", help="reenviar mesmo se o conteudo nao mudou")
    parser.add_argument("--listar", action="store_true", help="listar slugs disponiveis e sair")
    parser.add_argument(
        "--formato",
        choices=["texto", "midias", "json"],
        default="texto",
        help="texto (padrao, legivel) | midias (so URLs, uma linha) | json",
    )
    parser.add_argument(
        "--publicar",
        action="store_true",
        help="apos subir, publicar direto como carrossel via publicar_instagram.py (nao combina com --todos)",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="log detalhado de cada etapa")
    return parser


def _imprimir_texto(slug: str, itens: list[dict[str, str]]) -> None:
    print(f"\nCarrossel: {slug} ({len(itens)} midias)\n")
    for i, item in enumerate(itens, start=1):
        print(f"  {i}. [{item['tipo']}] {item['url']}")

    urls = " ".join(item["url"] for item in itens)
    print("\n--midias (uma linha, pronta para colar):")
    print(urls)

    legenda = ler_legenda(slug)
    if legenda:
        print(f"\nLegenda ({PASTA_CARROSSEIS / slug / 'legenda.txt'}):")
        print(legenda)
        print(
            "\nComo a legenda tem varias linhas, publique direto por este script "
            "(sem escapar nada na mao):"
        )
        print(f"  python preparar_midia_publica.py {slug} --publicar")
    print(
        "\nOu monte o comando manualmente:\n"
        f"  python publicar_instagram.py carrossel --midias {urls} --legenda \"...\""
    )


def main(argv: Sequence[str] | None = None) -> int:
    args = _montar_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s  %(message)s",
        datefmt="%H:%M:%S",
    )

    if args.listar:
        slugs = listar_slugs()
        if not slugs:
            print(f"Nenhum carrossel encontrado em {PASTA_CARROSSEIS}.")
            return 0
        print(f"Carrosseis disponiveis em {PASTA_CARROSSEIS}:")
        for slug in slugs:
            print(f"  - {slug}")
        return 0

    if not args.slug and not args.todos:
        print("Informe um slug ou use --todos. Slugs disponiveis:", file=sys.stderr)
        for slug in listar_slugs():
            print(f"  - {slug}", file=sys.stderr)
        return 1

    if args.publicar and args.todos:
        print(
            "Erro: --publicar nao combina com --todos "
            "(evita publicar varios carrosseis de uma vez sem revisar cada um). "
            "Rode um slug por vez com --publicar.",
            file=sys.stderr,
        )
        return 1

    try:
        if args.todos:
            resultado = preparar_todos(forcar=args.forcar)
            if args.formato == "json":
                print(json.dumps(resultado, ensure_ascii=False, indent=2))
            else:
                for slug, itens in resultado.items():
                    _imprimir_texto(slug, itens)
            return 0

        itens = preparar_slug(args.slug, forcar=args.forcar)

        if args.publicar:
            import publicar_instagram

            legenda = ler_legenda(args.slug)
            print(f"Publicando carrossel {args.slug!r} ({len(itens)} midias)...")
            try:
                media_id = publicar_instagram.publicar_carrossel(itens, legenda)
            except publicar_instagram.ErroInstagram as exc:
                print(f"Erro ao publicar: {exc}", file=sys.stderr)
                return 1
            print(f"Publicado no Instagram. media_id={media_id}")
            return 0

        if args.formato == "json":
            print(json.dumps(itens, ensure_ascii=False, indent=2))
        elif args.formato == "midias":
            print(" ".join(item["url"] for item in itens))
        else:
            _imprimir_texto(args.slug, itens)

    except ErroMidia as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
