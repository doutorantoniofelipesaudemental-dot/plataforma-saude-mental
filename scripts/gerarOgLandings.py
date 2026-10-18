"""Gera as imagens Open Graph 1200x630 das landings /youtube e /instagram (mesmo padrão da og-linkedin.png). Fontes do Windows (suportam acentos)."""
from PIL import Image, ImageDraw, ImageFont
import os
F = 'C:/Windows/Fonts/'
SERIF = ImageFont.truetype(F + 'georgiab.ttf', 64)
SANS = lambda n: ImageFont.truetype(F + 'segoeui.ttf', n)
ASSIN = ['Dr. Antônio Felipe — Médico — CRM-BA 41322', 'Especialista em Medicina de Família e Comunidade — RQE 26638',
         'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde',
         'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
         'NÃO ESPECIALISTA']

def gerar(saida, etiqueta, titulo, sub):
    im = Image.new('RGB', (1200, 630), '#0d3330'); d = ImageDraw.Draw(im)
    d.rectangle([72, 70, 253, 76], fill='#c9a227')
    d.text((72, 92), etiqueta.upper(), font=SANS(22), fill='#c9a227')
    y = 150
    for l in titulo:
        d.text((72, y), l, font=SERIF, fill='#ffffff'); y += 78
    d.text((72, y + 8), sub, font=SANS(28), fill='#d6e4e0')
    d.line([72, 430, 1128, 430], fill='#2f5a54', width=2)
    y = 445
    for i, l in enumerate(ASSIN):
        f = SANS(14 if i == 3 else 18)
        d.text((72, y), l, font=f, fill='#ffffff' if i in (0, 4) else '#d6e4e0'); y += 24 if i != 3 else 22
    im.save(saida, optimize=True)

base = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'img')
gerar(os.path.join(base, 'og-youtube.png'), 'Canal no YouTube · conteúdo educativo', ['Saúde mental em vídeo,', 'com linguagem simples'], 'Playlists por tema · Sem promessa, com cuidado')
gerar(os.path.join(base, 'og-instagram.png'), 'Do Instagram para o Portal', ['O artigo completo', 'do post que você viu'], '@doutor.antoniofelipe.smental · Conteúdo educativo')
