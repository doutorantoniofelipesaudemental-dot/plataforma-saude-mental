"""Artes do canal (PIL, sem custo): miniatura 1280x720, quadro do vídeo longo 1920x1080, fundo do Short 1080x1920,
banner 2560x1440 e foto de perfil. Fontes do Windows com acentos (Georgia / Segoe UI).
Uso: python arte.py <spec.json>   (spec: {"tipo": "thumb|longo|short|banner|perfil", "saida": "...png", ...})"""
import json, sys, textwrap, urllib.request, io
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

MARINHO, OURO, BRANCO = (11, 31, 58), (201, 162, 75), (255, 255, 255)
F = 'C:/Windows/Fonts/'
def fonte(nome, tam): return ImageFont.truetype(F + nome, tam)
GEORGIA_B, SEGOE, SEGOE_B = 'georgiab.ttf', 'segoeui.ttf', 'segoeuib.ttf'

def carregar(cap):
    if not cap: return None
    try:
        if cap.startswith('http'):
            req = urllib.request.Request(cap, headers={'User-Agent': 'Mozilla/5.0'})
            return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert('RGB')
        return Image.open(cap).convert('RGB')
    except Exception:
        return None

def cobrir(img, w, h):
    r = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * r) + 1, int(img.height * r) + 1), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))

def contem(img, w, h):
    r = min(w / img.width, h / img.height)
    return img.resize((int(img.width * r), int(img.height * r)), Image.LANCZOS)

def quebrar(draw, texto, f, largura):
    linhas, atual = [], ''
    for p in texto.split():
        t = (atual + ' ' + p).strip()
        if draw.textlength(t, font=f) <= largura: atual = t
        else: linhas.append(atual); atual = p
    if atual: linhas.append(atual)
    return linhas

def titulo_ajustado(draw, texto, largura, altura_max, tam_max=92, tam_min=44, fam=GEORGIA_B, espaco=1.18):
    for tam in range(tam_max, tam_min - 1, -4):
        f = fonte(fam, tam); ls = quebrar(draw, texto, f, largura)
        if len(ls) * tam * espaco <= altura_max: return f, ls, tam
    f = fonte(fam, tam_min); return f, quebrar(draw, texto, f, largura), tam_min

def assinatura3(draw, x, y, tam, cor=BRANCO):
    f1, f2 = fonte(SEGOE_B, tam), fonte(SEGOE, int(tam * 0.86))
    linhas = [('Dr. Antônio Felipe · Médico · CRM-BA 41322', f1), ('Especialista em Medicina de Família e Comunidade · RQE 26638', f2),
              ('Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)', f2)]
    for t, f in linhas:
        draw.text((x, y), t, font=f, fill=cor); y += int(tam * 1.4)
    return y

def barra_ouro(d, x, y, w, h=8): d.rectangle([x, y, x + w, y + h], fill=OURO)

def thumb(s):
    W, H = 1280, 720
    cap = carregar(s.get('capa'))
    if cap:
        im = cobrir(cap, W, H); d = ImageDraw.Draw(im)
        d.rectangle([0, H - 84, W, H], fill=MARINHO); d.rectangle([0, H - 88, W, H - 84], fill=OURO)
        d.text((40, H - 76), 'Dr. Antônio Felipe', font=fonte(SEGOE_B, 34), fill=OURO)
        d.text((40, H - 38), 'Médico · CRM-BA 41322 · RQE 26638 · conteúdo educativo', font=fonte(SEGOE, 24), fill=BRANCO)
        im.save(s['saida'], 'PNG'); return
    im = Image.new('RGB', (W, H), MARINHO); d = ImageDraw.Draw(im)
    barra_ouro(d, 60, 70, 140)
    f, ls, tam = titulo_ajustado(d, s['titulo'], 1100, 470, 84, 46)
    y = 110
    for l in ls: d.text((60, y), l, font=f, fill=BRANCO); y += int(tam * 1.18)
    d.text((60, H - 150), 'Dr. Antônio Felipe', font=fonte(SEGOE_B, 40), fill=OURO)
    d.text((60, H - 98), 'Médico · CRM-BA 41322 · RQE 26638', font=fonte(SEGOE, 28), fill=BRANCO)
    im.save(s['saida'], 'PNG')

def longo(s):
    W, H = 1920, 1080
    im = Image.new('RGB', (W, H), MARINHO); d = ImageDraw.Draw(im)
    cap = carregar(s.get('capa'))
    if cap:
        c = contem(cap, 760, 760); x0 = W - 760 - 90; y0 = 540 - c.height // 2; im.paste(c, (x0, y0))
        d.rectangle([x0, y0 - 6, x0 + c.width, y0 - 2], fill=OURO)
    barra_ouro(d, 110, 150, 180)
    f, ls, tam = titulo_ajustado(d, s['titulo'], 900, 600, 88, 48)
    y = 200
    for l in ls: d.text((110, y), l, font=f, fill=BRANCO); y += int(tam * 1.2)
    d.text((110, y + 20), 'Conteúdo educativo · não substitui consulta', font=fonte(SEGOE, 34), fill=OURO)
    assinatura3(d, 110, H - 215, 32)
    d.text((110, H - 60), 'Em crise: CVV 188 · SAMU 192', font=fonte(SEGOE_B, 30), fill=OURO)
    im.save(s['saida'], 'PNG')

def short(s):
    W, H = 1080, 1920
    cap = carregar(s.get('capa'))
    if cap:
        bg = cobrir(cap, W, H).filter(ImageFilter.GaussianBlur(28)); bg = ImageEnhance.Brightness(bg).enhance(0.38)
    else: bg = Image.new('RGB', (W, H), MARINHO)
    im = bg.copy(); d = ImageDraw.Draw(im)
    barra_ouro(d, 70, 150, 160)
    f, ls, tam = titulo_ajustado(d, s['titulo'], 940, 520, 86, 50)
    y = 200
    for l in ls: d.text((70, y), l, font=f, fill=BRANCO); y += int(tam * 1.2)
    if cap:
        c = contem(cap, 940, 560); im.paste(c, (70, 780))
    assinatura3(d, 70, H - 400, 30)
    d.text((70, H - 230), 'Em crise: CVV 188 · SAMU 192', font=fonte(SEGOE_B, 34), fill=OURO)
    im.save(s['saida'], 'PNG')

def banner(s):
    W, H = 2560, 1440
    im = Image.new('RGB', (W, H), MARINHO); d = ImageDraw.Draw(im)
    # área segura central (1546x423) para TV/celular/desktop
    x0, y0 = (W - 1546) // 2, (H - 423) // 2
    barra_ouro(d, x0, y0 + 10, 160)
    d.text((x0, y0 + 40), 'Dr. Antônio Felipe', font=fonte(GEORGIA_B, 120), fill=BRANCO)
    d.text((x0, y0 + 190), 'Saúde mental no Pronto Atendimento e na Atenção Primária', font=fonte(SEGOE, 50), fill=OURO)
    d.text((x0, y0 + 270), 'Conteúdo educativo · CRM-BA 41322 · RQE 26638 (Medicina de Família e Comunidade)', font=fonte(SEGOE, 34), fill=BRANCO)
    d.text((x0, y0 + 330), 'Em crise: CVV 188 · SAMU 192', font=fonte(SEGOE_B, 34), fill=OURO)
    im.save(s['saida'], 'PNG')

def banner_li(s):
    W, H = 1584, 396
    im = Image.new('RGB', (W, H), MARINHO); d = ImageDraw.Draw(im)
    x0 = 540  # a foto de perfil cobre o canto inferior esquerdo
    barra_ouro(d, x0, 70, 120, 6)
    d.text((x0, 96), 'Dr. Antônio Felipe', font=fonte(GEORGIA_B, 76), fill=BRANCO)
    d.text((x0, 196), 'Saúde mental no Pronto Atendimento e na Atenção Primária', font=fonte(SEGOE, 34), fill=OURO)
    d.text((x0, 250), 'Mentoria para a APS · Consultoria para empresas e RH · NR-1', font=fonte(SEGOE, 28), fill=BRANCO)
    d.text((x0, 306), 'Médico · CRM-BA 41322 · RQE 26638 · Em crise: CVV 188 · SAMU 192', font=fonte(SEGOE_B, 24), fill=OURO)
    im.save(s['saida'], 'PNG')

def perfil(s):
    W = 800
    im = Image.new('RGB', (W, W), MARINHO); d = ImageDraw.Draw(im)
    d.ellipse([60, 60, W - 60, W - 60], outline=OURO, width=10)
    f = fonte(GEORGIA_B, 330); t = 'AF'
    tw = d.textlength(t, font=f); d.text(((W - tw) / 2, 200), t, font=f, fill=BRANCO)
    im.save(s['saida'], 'PNG')

if __name__ == '__main__':
    spec = json.load(open(sys.argv[1], encoding='utf-8'))
    {'banner_li': banner_li, 'thumb': thumb, 'longo': longo, 'short': short, 'banner': banner, 'perfil': perfil}[spec['tipo']](spec)
