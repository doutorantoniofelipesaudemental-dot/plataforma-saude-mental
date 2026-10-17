# Gera a capa 1200x630 (estilo das capas do site) a partir de um JSON [{slug,titulo,categoria}] e grava em <saida>/<slug>.jpg.
# Uso: reels_automation/.venv/Scripts/python.exe -I backend/tools/gerar-capas.py entrada.json pasta-saida
# Sem marca d'água, com acento ("Antônio"). Fonte dos títulos: Fraunces (backend/assets/fonts).
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

BG, PILL, OURO, CLARO = (12, 51, 48), (44, 74, 72), (201, 164, 52), (255, 255, 255)
FT = ImageFont.truetype('backend/assets/fonts/fraunces-static.ttf', 42)
FC = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
FR = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 21)

def quebra(d, texto, fonte, largura):
    linhas, atual = [], ''
    for p in texto.split():
        t = (atual + ' ' + p).strip()
        if d.textlength(t, font=fonte) <= largura: atual = t
        else: linhas.append(atual); atual = p
    if atual: linhas.append(atual)
    return linhas

def gerar(item, saida):
    im = Image.new('RGB', (1200, 630), BG); d = ImageDraw.Draw(im)
    cat = (item.get('categoria') or '').upper()
    if cat:
        w = d.textlength(cat, font=FC)
        d.rounded_rectangle([72, 56, 72 + w + 50, 100], radius=22, fill=PILL)
        d.text((97, 64), cat, font=FC, fill=(230, 238, 236))
    linhas = quebra(d, item['titulo'], FT, 1000)[:4]
    h = len(linhas) * 54
    y = 330 - h // 2
    for l in linhas:
        d.text((72, y), l, font=FT, fill=CLARO, stroke_width=1, stroke_fill=CLARO); y += 54
    d.rectangle([72, y + 14, 153, y + 19], fill=OURO)
    d.ellipse([72, 576, 84, 588], fill=OURO)
    d.text((95, 570), 'Dr. Antônio Felipe', font=FR, fill=(190, 205, 202))
    im.save(os.path.join(saida, item['slug'] + '.jpg'), quality=90)

if __name__ == '__main__':
    itens = json.load(open(sys.argv[1], encoding='utf-8')); os.makedirs(sys.argv[2], exist_ok=True)
    for it in itens: gerar(it, sys.argv[2])
    print(len(itens), 'capas')
