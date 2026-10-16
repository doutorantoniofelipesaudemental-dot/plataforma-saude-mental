"""Carrossel em PDF (1080x1350, 4:5; azul-marinho + dourado + branco; até 25 palavras de arte por página, exceto a última com a assinatura).
Uso: python carrossel.py <spec.json>   spec: {"saida": "...pdf", "paginas": [{tipo, titulo, texto, sub, url, ref}]}"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'youtube'))
from PIL import Image, ImageDraw
import arte
from arte import MARINHO, OURO, BRANCO, fonte, quebrar, GEORGIA_B, SEGOE, SEGOE_B, barra_ouro, titulo_ajustado

W, H = 1080, 1350

def pagina(p, i, n):
    im = Image.new('RGB', (W, H), MARINHO); d = ImageDraw.Draw(im)
    barra_ouro(d, 80, 110, 150)
    t = p['tipo']
    if t == 'capa':
        f, ls, tam = titulo_ajustado(d, p['titulo'], 900, 700, 92, 54)
        y = 220
        for l in ls:
            d.text((80, y), l, font=f, fill=BRANCO); y += int(tam * 1.2)
        d.text((80, H - 260), p.get('sub', ''), font=fonte(SEGOE_B, 36), fill=OURO)
        d.text((80, H - 200), 'Deslize para ver →', font=fonte(SEGOE, 34), fill=BRANCO)
    elif t in ('topico', 'ponto'):
        y = 220
        if p.get('titulo'):
            f, ls, tam = titulo_ajustado(d, p['titulo'], 900, 360, 64, 40)
            for l in ls:
                d.text((80, y), l, font=f, fill=OURO if t == 'ponto' else BRANCO); y += int(tam * 1.2)
            y += 40
        if p.get('texto'):
            f = fonte(SEGOE, 54)
            for l in quebrar(d, p['texto'], f, 900):
                d.text((80, y), l, font=f, fill=BRANCO); y += 78
    else:
        f, ls, tam = titulo_ajustado(d, p['titulo'], 900, 300, 64, 40)
        y = 220
        for l in ls:
            d.text((80, y), l, font=f, fill=BRANCO); y += int(tam * 1.2)
        y += 20
        base, _, resto = p['url'].partition('/artigo/')
        d.text((80, y), base + '/artigo/', font=fonte(SEGOE_B, 28), fill=OURO); y += 40
        d.text((80, y), resto, font=fonte(SEGOE_B, 28), fill=OURO); y += 70
        if p.get('ref'):
            f2 = fonte(SEGOE, 28)
            for l in quebrar(d, 'Referência: ' + p['ref'], f2, 920)[:5]:
                d.text((80, y), l, font=f2, fill=BRANCO); y += 42
        y = max(y + 30, H - 480)
        y = arte.assinatura3(d, 80, y, 30)
        d.text((80, y + 10), 'Conteúdo educativo, não substitui consulta. Em crise: CVV 188 · SAMU 192', font=fonte(SEGOE_B, 26), fill=OURO)
        d.text((80, y + 50), 'Apoio de IA, com revisão e responsabilidade médica final (Res. CFM 2.454/2026).', font=fonte(SEGOE, 24), fill=BRANCO)
    d.text((W - 160, H - 70), f'{i}/{n}', font=fonte(SEGOE, 28), fill=OURO)
    return im

spec = json.load(open(sys.argv[1], encoding='utf-8'))
ps = spec['paginas']
for p in ps[:-1]:
    corpo = ' '.join(str(p.get(k, '')) for k in ('titulo', 'texto'))
    assert len(corpo.split()) <= 25, 'página com mais de 25 palavras: ' + corpo[:60]
imgs = [pagina(p, i + 1, len(ps)) for i, p in enumerate(ps)]
imgs[0].save(spec['saida'], 'PDF', save_all=True, append_images=imgs[1:], resolution=150)

for k, im in enumerate(imgs, 1):
    im.save(spec["saida"].replace(".pdf", "-p%02d.png" % k), "PNG")
