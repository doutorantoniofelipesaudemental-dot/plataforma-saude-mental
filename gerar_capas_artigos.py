"""Gera capas de artigo (1200x630, proporcao 1.91:1 — padrao OG/link-preview
e cartao de blog) para todos os artigos de apps/plataforma-saude-mental,
usando as MESMAS primitivas de fonte/cor do gerador de carrossel (Regra 7 do
CLAUDE.md — nenhuma paleta paralela). Capas conceituais/tipograficas, nao
fotos: titulo grande em Fraunces, selo de eixo/categoria, barra dourada,
marca no rodape — mesma linguagem visual dos slides do Instagram.

Uso:
    python gerar_capas_artigos.py
"""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw

from gerar_carrossel_local import (
    COR,
    _blend,
    _desenhar_linhas,
    _fonte_sans,
    _fonte_serif,
    _quebrar_linhas,
    _tamanho_adaptativo,
    NOME_MARCA,
)

RAIZ_APP = Path(__file__).resolve().parent / "apps" / "plataforma-saude-mental"
PASTA_BLOG = RAIZ_APP / "content" / "blog"
PASTA_ARTIGOS = RAIZ_APP / "src" / "content" / "artigos"
PASTA_DESTINO = RAIZ_APP / "public" / "images" / "artigos"

LARGURA, ALTURA = 1200, 630
MARGEM = 72
LARGURA_UTIL = LARGURA - MARGEM * 2


def _extrair_campo(texto: str, campo: str) -> str | None:
    m = re.search(rf"{campo}:\s*'((?:\\.|[^'\\])*)'", texto)
    if not m:
        return None
    return m.group(1).replace("\\'", "'").replace("\\\\", "\\")


def _extrair_metadados(mdx_texto: str) -> dict:
    titulo = _extrair_campo(mdx_texto, "titulo") or "Sem título"
    eixo_m = re.search(r"eixo:\s*(\d+)", mdx_texto)
    if eixo_m:
        badge = f"Eixo {int(eixo_m.group(1)):02d}"
    else:
        badge = _extrair_campo(mdx_texto, "categoria") or "Blog"
    return {"titulo": titulo, "badge": badge}


def _listar_artigos() -> list[dict]:
    artigos = []
    for pasta in (PASTA_BLOG, PASTA_ARTIGOS):
        for arquivo in sorted(pasta.glob("*.mdx")):
            meta = _extrair_metadados(arquivo.read_text(encoding="utf-8"))
            artigos.append({"slug": arquivo.stem, **meta})
    return artigos


def _renderizar_capa(titulo: str, badge: str) -> Image.Image:
    fundo = COR["verde_escuro"]
    img = Image.new("RGB", (LARGURA, ALTURA), fundo)
    draw = ImageDraw.Draw(img)

    # Selo de eixo/categoria
    fonte_badge = _fonte_sans(22)
    texto_badge = badge.upper()
    largura_badge = fonte_badge.getlength(texto_badge) + 48
    draw.rounded_rectangle(
        [MARGEM, 56, MARGEM + largura_badge, 56 + 44], radius=22,
        fill=_blend(COR["branco"], 0.12, fundo),
    )
    draw.text((MARGEM + 24, 56 + 22), texto_badge, font=fonte_badge, fill=COR["branco"], anchor="lm")

    # Titulo — tamanho adaptativo ao comprimento, igual aos outros geradores
    tamanho = _tamanho_adaptativo(titulo, [(40, 62), (65, 50), (100, 42), (999, 36)])
    fonte_titulo = _fonte_serif(tamanho)
    linhas = _quebrar_linhas(fonte_titulo, titulo, LARGURA_UTIL, max_linhas=4)
    altura_linha = tamanho * 1.2
    bloco_altura = len(linhas) * altura_linha
    y_inicio = (ALTURA - bloco_altura) / 2 - 10

    _desenhar_linhas(draw, fonte_titulo, linhas, MARGEM, y_inicio, altura_linha, COR["branco"], negrito=True, tamanho_fonte=tamanho)

    y_barra = y_inicio + bloco_altura + 28
    draw.rounded_rectangle([MARGEM, y_barra, MARGEM + 80, y_barra + 5], radius=2.5, fill=COR["dourado"])

    # Marca no rodape
    y_marca = ALTURA - 48
    draw.ellipse([MARGEM, y_marca - 6, MARGEM + 12, y_marca + 6], fill=COR["dourado"])
    draw.text(
        (MARGEM + 22, y_marca), NOME_MARCA, font=_fonte_sans(20),
        fill=_blend(COR["branco"], 0.75, fundo), anchor="lm",
    )
    return img


def main() -> None:
    PASTA_DESTINO.mkdir(parents=True, exist_ok=True)
    artigos = _listar_artigos()
    print(f"Gerando {len(artigos)} capas em {PASTA_DESTINO} ...")
    for i, artigo in enumerate(artigos, start=1):
        img = _renderizar_capa(artigo["titulo"], artigo["badge"])
        destino = PASTA_DESTINO / f"{artigo['slug']}.jpg"
        img.save(destino, "JPEG", quality=88, optimize=True)
        if i % 15 == 0 or i == len(artigos):
            print(f"  {i}/{len(artigos)}")
    print("Concluído.")


if __name__ == "__main__":
    main()
