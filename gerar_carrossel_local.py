"""Gerador local de carrosseis (Pillow) — Dr. Saude Mental.

Porta em Python do motor de imagens de backend/lib/carrossel.js, para gerar
carrosseis 100% locais quando nao ha geracao por IA disponivel (Kairogen
sem autenticar, sem internet, etc.). Usa os MESMOS tokens de marca —
cores, fontes, margens, layout — extraidos direto daquele arquivo: a
Regra 7 do CLAUDE.md exige que todo componente novo seja justificavel a
partir do DNA existente, nunca uma paleta paralela.

Por que nao e so uma chamada ao script Node existente: o gerador em JS
converte cada linha em contorno vetorial via opentype.js porque o sharp/
librsvg do ambiente de funcoes da Vercel roda sem motor de shaping de
texto (Pango/HarfBuzz) — <text> vira caixa vazia la. Rodando localmente
com Pillow, esse problema nao existe: as mesmas fontes TTF sao desenhadas
diretamente, sem precisar do workaround de contorno.

Fontes: Fraunces (serifada, titulos) e Inter (sans, corpo) — os mesmos
arquivos estaticos usados pelo gerador em Node, em backend/assets/fonts/.

Uso como biblioteca:

    from gerar_carrossel_local import gerar_carrossel_local

    slides = [
        {"tipo": "capa", "titulo": "..."},
        {"tipo": "conteudo", "titulo": "SINAL 1", "texto": "..."},
        {"tipo": "cta", "titulo": "...", "texto": "..."},
    ]
    gerar_carrossel_local(slides, categoria="Pacientes & Familias",
                           pasta_destino=Path("prontos_para_postar/01-slug"))

Dependencias: Pillow.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from PIL import Image, ImageDraw, ImageFont

# --------------------------------------------------------------------------- #
# DNA visual — extraido de backend/lib/carrossel.js, nao reinventado aqui.
# --------------------------------------------------------------------------- #

RAIZ_PROJETO = Path(__file__).resolve().parent
PASTA_FONTES = RAIZ_PROJETO / "backend" / "assets" / "fonts"
CAMINHO_FRAUNCES = PASTA_FONTES / "fraunces-static.ttf"
CAMINHO_INTER = PASTA_FONTES / "inter-static.ttf"

COR = {
    "verde_escuro": (0x0D, 0x33, 0x30),
    "verde": (0x18, 0x5D, 0x58),
    "verde_claro": (0x8C, 0xC4, 0xB8),
    "areia": (0xFA, 0xF7, 0xF2),
    "tinta": (0x17, 0x21, 0x1F),
    "tinta_media": (0x45, 0x56, 0x4F),
    "dourado": (0xC9, 0xA2, 0x27),
    "branco": (0xFF, 0xFF, 0xFF),
}

LARGURA = 1080
ALTURA = 1350
MARGEM = 84
LARGURA_UTIL = LARGURA - MARGEM * 2

EMAIL_CONTATO = "doutor.antoniofelipe.saudemental@gmail.com"
HANDLE_INSTAGRAM = "@doutor.antoniofelipe.smental"
NOME_MARCA = "Dr. Antônio Felipe"


# --------------------------------------------------------------------------- #
# Fontes — cache por tamanho (Pillow nao escala um objeto de fonte carregado).
# --------------------------------------------------------------------------- #

_CACHE_FONTES: dict[tuple[Path, int], ImageFont.FreeTypeFont] = {}


def _fonte(caminho: Path, tamanho: int) -> ImageFont.FreeTypeFont:
    chave = (caminho, tamanho)
    if chave not in _CACHE_FONTES:
        _CACHE_FONTES[chave] = ImageFont.truetype(str(caminho), tamanho)
    return _CACHE_FONTES[chave]


def _fonte_serif(tamanho: int) -> ImageFont.FreeTypeFont:
    return _fonte(CAMINHO_FRAUNCES, tamanho)


def _fonte_sans(tamanho: int) -> ImageFont.FreeTypeFont:
    return _fonte(CAMINHO_INTER, tamanho)


# --------------------------------------------------------------------------- #
# Cor com alpha sobre fundo solido — equivalente as rgba(...) do CSS/SVG
# original, ja que aqui desenhamos direto sobre um fundo opaco conhecido.
# --------------------------------------------------------------------------- #


def _blend(cor_fg: tuple[int, int, int], alpha: float, cor_fundo: tuple[int, int, int]) -> tuple[int, int, int]:
    return tuple(round(cor_fg[i] * alpha + cor_fundo[i] * (1 - alpha)) for i in range(3))  # type: ignore[return-value]


# --------------------------------------------------------------------------- #
# Texto: quebra de linha e tamanho adaptativo — mesma logica de
# backend/lib/carrossel.js (quebrarLinhas / tamanhoAdaptativo), adaptada
# para medir largura via Pillow (font.getlength) em vez de opentype.js.
# --------------------------------------------------------------------------- #


def _quebrar_linhas(fonte: ImageFont.FreeTypeFont, texto: str, largura_max_px: float, max_linhas: int = 8) -> list[str]:
    palavras = texto.split()
    linhas: list[str] = []
    atual = ""

    for palavra in palavras:
        candidato = f"{atual} {palavra}".strip()
        if fonte.getlength(candidato) > largura_max_px and atual:
            linhas.append(atual)
            atual = palavra
        else:
            atual = candidato
    if atual:
        linhas.append(atual)

    if len(linhas) > max_linhas:
        cortadas = linhas[:max_linhas]
        ultima = cortadas[-1]
        while len(ultima) > 1 and fonte.getlength(f"{ultima}…") > largura_max_px:
            ultima = ultima[:-1]
        cortadas[-1] = f"{ultima}…"
        return cortadas
    return linhas


def _tamanho_adaptativo(texto: str, bandas: list[tuple[int, int]]) -> int:
    """bandas: lista de (limite_de_caracteres, tamanho_fonte), crescente."""
    for limite, tamanho in bandas:
        if len(texto) <= limite:
            return tamanho
    return bandas[-1][1]


def _desenhar_linha_negrito(draw: ImageDraw.ImageDraw, xy: tuple[float, float], texto: str, fonte: ImageFont.FreeTypeFont, cor: tuple[int, int, int], deslocamento: int) -> None:
    """Simula peso maior redesenhando a linha varias vezes com pequeno
    deslocamento (preenchimentos solidos sobrepostos), em vez de
    stroke_width/stroke_fill do Pillow.

    stroke_width desenha um CONTORNO ao redor do glifo; em marcas finas
    (o circunflexo de "e", por exemplo) esse contorno fica maior que a
    propria marca e o interior nao preenchido aparece vazado/oco. Redesenhar
    o preenchimento solido deslocado evita esse artefato por construcao —
    so ha area preenchida, nunca so contorno.
    """
    x, y = xy
    offsets = [(0, 0), (deslocamento, 0), (-deslocamento, 0), (0, deslocamento), (0, -deslocamento)]
    for dx, dy in offsets:
        draw.text((x + dx, y + dy), texto, font=fonte, fill=cor, anchor="la")


def _desenhar_linhas(
    draw: ImageDraw.ImageDraw,
    fonte: ImageFont.FreeTypeFont,
    linhas: list[str],
    x: float,
    y_inicial: float,
    altura_linha: float,
    cor: tuple[int, int, int],
    *,
    negrito: bool = False,
    tamanho_fonte: int = 0,
) -> None:
    deslocamento = max(1, round(0.028 * tamanho_fonte)) if negrito else 0
    for i, linha in enumerate(linhas):
        pos = (x, y_inicial + i * altura_linha)
        if negrito:
            _desenhar_linha_negrito(draw, pos, linha, fonte, cor, deslocamento)
        else:
            draw.text(pos, linha, font=fonte, fill=cor, anchor="la")


# --------------------------------------------------------------------------- #
# Elementos compartilhados (pill de categoria, indicador de pagina, rodape)
# --------------------------------------------------------------------------- #


def _pill_categoria(draw: ImageDraw.ImageDraw, categoria: str, x: int, y: int, escura: bool, cor_fundo_slide: tuple[int, int, int]) -> None:
    texto = categoria.upper()
    fonte = _fonte_sans(22)
    largura = fonte.getlength(texto) + 56
    cor_fundo_pill = _blend(COR["branco"], 0.12, cor_fundo_slide) if escura else COR["verde"]
    draw.rounded_rectangle([x, y, x + largura, y + 52], radius=26, fill=cor_fundo_pill)
    draw.text((x + 28, y + 26), texto, font=fonte, fill=COR["branco"], anchor="lm")


def _indicador_pagina(draw: ImageDraw.ImageDraw, indice: int, total: int, escura: bool, cor_fundo_slide: tuple[int, int, int]) -> None:
    cor = _blend(COR["branco"], 0.6, cor_fundo_slide) if escura else COR["tinta_media"]
    fonte = _fonte_sans(24)
    draw.text((LARGURA - MARGEM, MARGEM + 8), f"{indice + 1}/{total}", font=fonte, fill=cor, anchor="ra")


def _rodape_marca(draw: ImageDraw.ImageDraw, escura: bool, cor_fundo_slide: tuple[int, int, int]) -> None:
    y = ALTURA - 76
    cor = _blend(COR["branco"], 0.75, cor_fundo_slide) if escura else COR["tinta_media"]
    cor_forte = COR["branco"] if escura else COR["verde_escuro"]
    draw.ellipse([MARGEM, y - 14, MARGEM + 28, y + 14], fill=COR["dourado"])
    _desenhar_linha_negrito(draw, (MARGEM + 40, y - 5), NOME_MARCA, _fonte_sans(24), cor_forte, 1)
    draw.text((MARGEM + 40, y + 16), HANDLE_INSTAGRAM, font=_fonte_sans(20), fill=cor, anchor="la")


# --------------------------------------------------------------------------- #
# Slides
# --------------------------------------------------------------------------- #


def _renderizar_capa(titulo: str, categoria: str, indice: int, total: int) -> Image.Image:
    fundo = COR["verde_escuro"]
    img = Image.new("RGB", (LARGURA, ALTURA), fundo)
    draw = ImageDraw.Draw(img)

    _pill_categoria(draw, categoria, MARGEM, 90, True, fundo)
    _indicador_pagina(draw, indice, total, True, fundo)

    tamanho = _tamanho_adaptativo(titulo, [(45, 78), (75, 64), (110, 54), (999, 46)])
    fonte = _fonte_serif(tamanho)
    linhas = _quebrar_linhas(fonte, titulo, LARGURA_UTIL, max_linhas=7)
    altura_linha = tamanho * 1.18
    bloco_altura = len(linhas) * altura_linha
    y_inicio = (ALTURA - bloco_altura) / 2 - 40

    _desenhar_linhas(draw, fonte, linhas, MARGEM, y_inicio, altura_linha, COR["branco"], negrito=True, tamanho_fonte=tamanho)

    y_barra = y_inicio + bloco_altura + 36
    draw.rounded_rectangle([MARGEM, y_barra, MARGEM + 90, y_barra + 5], radius=2.5, fill=COR["dourado"])

    _rodape_marca(draw, True, fundo)
    draw.text(
        (LARGURA - MARGEM, ALTURA - 68), "deslize →", font=_fonte_sans(22),
        fill=_blend(COR["branco"], 0.55, fundo), anchor="ra",
    )
    return img


def _renderizar_conteudo(titulo: str | None, texto: str, categoria: str, indice: int, total: int) -> Image.Image:
    fundo = COR["areia"]
    img = Image.new("RGB", (LARGURA, ALTURA), fundo)
    draw = ImageDraw.Draw(img)

    _pill_categoria(draw, categoria, MARGEM, 90, False, fundo)
    _indicador_pagina(draw, indice, total, False, fundo)

    tem_titulo = bool(titulo)
    tamanho_titulo = _tamanho_adaptativo(titulo, [(35, 54), (60, 46), (999, 40)]) if tem_titulo else 0
    fonte_titulo = _fonte_serif(tamanho_titulo) if tem_titulo else None
    linhas_titulo = _quebrar_linhas(fonte_titulo, titulo, LARGURA_UTIL, max_linhas=3) if tem_titulo else []
    altura_linha_titulo = tamanho_titulo * 1.22

    tamanho_texto = 38
    fonte_texto = _fonte_sans(tamanho_texto)
    linhas_texto = _quebrar_linhas(fonte_texto, texto, LARGURA_UTIL, max_linhas=8 if tem_titulo else 11)
    altura_linha_texto = tamanho_texto * 1.5

    espaco_titulo_texto = 50
    altura_titulo = (len(linhas_titulo) * altura_linha_titulo + espaco_titulo_texto) if tem_titulo else 90
    altura_texto = len(linhas_texto) * altura_linha_texto
    altura_bloco = altura_titulo + altura_texto

    topo_area_util = 210
    base_area_util = ALTURA - 180
    y_bloco = max(topo_area_util, topo_area_util + (base_area_util - topo_area_util - altura_bloco) / 2)
    y_titulo = y_bloco + (tamanho_titulo * 0.9 if tem_titulo else 70)
    y_texto = y_bloco + altura_titulo + tamanho_texto * 0.9

    if tem_titulo:
        _desenhar_linhas(draw, fonte_titulo, linhas_titulo, MARGEM, y_titulo, altura_linha_titulo, COR["verde_escuro"], negrito=True, tamanho_fonte=tamanho_titulo)
    else:
        aspas = _fonte_serif(90)
        cor_aspas = _blend(COR["dourado"], 0.5, fundo)
        draw.text((MARGEM, y_bloco + 60), "“", font=aspas, fill=cor_aspas, anchor="la")

    _desenhar_linhas(draw, fonte_texto, linhas_texto, MARGEM, y_texto, altura_linha_texto, COR["tinta_media"])
    _rodape_marca(draw, False, fundo)
    return img


def _renderizar_cta(titulo: str, subtitulo: str, categoria: str, indice: int, total: int) -> Image.Image:
    fundo = COR["verde_escuro"]
    img = Image.new("RGB", (LARGURA, ALTURA), fundo)
    draw = ImageDraw.Draw(img)

    _pill_categoria(draw, categoria, MARGEM, 90, True, fundo)
    _indicador_pagina(draw, indice, total, True, fundo)

    # Tamanho adaptativo ao comprimento do titulo: o gerador em Node tinha
    # esse valor fixo em 62px porque o texto do CTA la e sempre a mesma
    # frase curta ("Quer conversar sobre isso?"); aqui o titulo e
    # parametrizavel e pode ser uma pergunta bem mais longa, entao precisa
    # da mesma logica adaptativa usada nos outros slides — sem isso, uma
    # frase longa estoura o limite de 2 linhas e trunca com "…".
    tamanho1 = _tamanho_adaptativo(titulo, [(30, 62), (50, 52), (80, 44), (999, 38)])
    fonte1 = _fonte_serif(tamanho1)
    linhas1 = _quebrar_linhas(fonte1, titulo, LARGURA_UTIL, max_linhas=4)
    altura_linha1 = tamanho1 * 1.2

    fonte2 = _fonte_sans(34)
    linhas2 = _quebrar_linhas(fonte2, subtitulo, LARGURA_UTIL, max_linhas=3)
    altura_linha2 = 46

    # Centraliza o bloco (titulo+subtitulo) entre o cabecalho (pill/indice)
    # e o rodape (barra dourada + e-mail + marca), em vez do y fixo do
    # original — que so funcionava porque o texto la tinha tamanho conhecido.
    altura_bloco = len(linhas1) * altura_linha1 + 50 + len(linhas2) * altura_linha2
    topo_area_util = 220
    base_area_util = ALTURA - 320
    y_bloco = max(topo_area_util, topo_area_util + (base_area_util - topo_area_util - altura_bloco) / 2)

    _desenhar_linhas(draw, fonte1, linhas1, MARGEM, y_bloco, altura_linha1, COR["branco"], negrito=True, tamanho_fonte=tamanho1)
    y2 = y_bloco + len(linhas1) * altura_linha1 + 50
    _desenhar_linhas(draw, fonte2, linhas2, MARGEM, y2, altura_linha2, _blend(COR["branco"], 0.82, fundo))

    y_barra = ALTURA - 260
    draw.rounded_rectangle([MARGEM, y_barra, MARGEM + 90, y_barra + 5], radius=2.5, fill=COR["dourado"])
    draw.text(
        (MARGEM, ALTURA - 210), EMAIL_CONTATO, font=_fonte_sans(28),
        fill=_blend(COR["branco"], 0.75, fundo), anchor="la",
    )
    _rodape_marca(draw, True, fundo)
    return img


# --------------------------------------------------------------------------- #
# API publica
# --------------------------------------------------------------------------- #


@dataclass
class SlideLocal:
    tipo: Literal["capa", "conteudo", "cta"]
    titulo: str | None = None
    texto: str | None = None


def renderizar_slide(slide: SlideLocal, categoria: str, indice: int, total: int) -> Image.Image:
    if slide.tipo == "capa":
        if not slide.titulo:
            raise ValueError("Slide 'capa' precisa de titulo.")
        return _renderizar_capa(slide.titulo, categoria, indice, total)
    if slide.tipo == "cta":
        if not slide.titulo or not slide.texto:
            raise ValueError("Slide 'cta' precisa de titulo e texto.")
        return _renderizar_cta(slide.titulo, slide.texto, categoria, indice, total)
    if slide.tipo == "conteudo":
        if not slide.texto:
            raise ValueError("Slide 'conteudo' precisa de texto.")
        return _renderizar_conteudo(slide.titulo, slide.texto, categoria, indice, total)
    raise ValueError(f"Tipo de slide desconhecido: {slide.tipo!r}")


def gerar_carrossel_local(
    slides: list[dict | SlideLocal],
    *,
    categoria: str,
    pasta_destino: Path,
    prefixos: list[str] | None = None,
) -> list[Path]:
    """Renderiza e salva um carrossel completo em pasta_destino/NN-<prefixo>.png.

    slides: cada item {"tipo": "capa"|"conteudo"|"cta", "titulo": ..., "texto": ...}
    prefixos: nomes descritivos por slide (ex.: ["capa","sinal1",...]); se
    omitido, usa o proprio `tipo` de cada slide (com sufixo de indice quando
    repetido, ex.: conteudo1, conteudo2).
    """
    objetos = [s if isinstance(s, SlideLocal) else SlideLocal(**s) for s in slides]
    total = len(objetos)

    if prefixos is None:
        total_por_tipo: dict[str, int] = {}
        for s in objetos:
            total_por_tipo[s.tipo] = total_por_tipo.get(s.tipo, 0) + 1
        contagem: dict[str, int] = {}
        prefixos = []
        for s in objetos:
            contagem[s.tipo] = contagem.get(s.tipo, 0) + 1
            unico = total_por_tipo[s.tipo] == 1
            prefixos.append(s.tipo if unico else f"{s.tipo}{contagem[s.tipo]}")
    if len(prefixos) != total:
        raise ValueError("prefixos precisa ter o mesmo tamanho de slides.")

    pasta_destino.mkdir(parents=True, exist_ok=True)
    caminhos: list[Path] = []
    for i, (slide, prefixo) in enumerate(zip(objetos, prefixos)):
        img = renderizar_slide(slide, categoria, i, total)
        caminho = pasta_destino / f"{i + 1:02d}-{prefixo}.png"
        img.save(caminho, "PNG")
        caminhos.append(caminho)
    return caminhos
