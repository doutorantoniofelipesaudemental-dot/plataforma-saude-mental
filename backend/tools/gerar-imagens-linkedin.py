# Gera as imagens do LinkedIn no estilo das capas do site (sem marca d'água, com acento):
#   public/assets/img/og-linkedin.png            1200x627  (cartão de compartilhamento da página /linkedin)
#   relatorios/linkedin/banner-perfil-1584x396.png 1584x396  (banner do perfil pessoal)
# Uso: reels_automation/.venv/Scripts/python.exe -I backend/tools/gerar-imagens-linkedin.py
# Assinatura: a COMPLETA de 5 linhas (ativos de marca, CLAUDE.md §3.A); mesma fonte da identificação do site (backend/lib/conformidadeCfm.js).
import json, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

BG, OURO, CLARO, SUAVE = (12, 51, 48), (201, 164, 52), (255, 255, 255), (206, 222, 219)
FT = 'backend/assets/fonts/fraunces-static.ttf'
FI = 'backend/assets/fonts/inter-static.ttf'
ASSIN = [
    'Dr. Antônio Felipe — Médico — CRM-BA 41322',
    'Especialista em Medicina de Família e Comunidade — RQE 26638',
    'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde',
    'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
    'NÃO ESPECIALISTA',
]

def f(caminho, tam): return ImageFont.truetype(caminho, tam)

def titulo(d, x, y, linhas, tam, passo):
    fonte = f(FT, tam)
    for l in linhas:
        d.text((x, y), l, font=fonte, fill=CLARO, stroke_width=1, stroke_fill=CLARO); y += passo
    return y

def assinatura(d, x, y, tam, largura_max):
    fonte, forte = f(FI, tam), f(FI, tam)
    for k, l in enumerate(ASSIN):
        fo = fonte
        while d.textlength(l, font=fo) > largura_max and fo.size > 10: fo = f(FI, fo.size - 1)
        d.text((x, y), l, font=fo, fill=CLARO if k in (0, 4) else SUAVE); y += int(tam * 1.35)
    return y

def og():
    im = Image.new('RGB', (1200, 627), BG); d = ImageDraw.Draw(im)
    d.rectangle([72, 70, 252, 76], fill=OURO)
    d.text((72, 92), 'PARA PROFISSIONAIS DE SAÚDE, GESTORES E EMPRESAS', font=f(FI, 21), fill=OURO)
    y = titulo(d, 72, 150, ['Saúde mental na prática:', 'do Pronto Atendimento', 'à Atenção Primária'], 62, 76)
    d.text((72, y + 14), 'Mentoria · Consultoria · Artigos', font=f(FI, 28), fill=SUAVE)
    d.rectangle([72, 430, 1128, 432], fill=(40, 84, 80))
    assinatura(d, 72, 446, 18, 1056)
    im.save('public/assets/img/og-linkedin.png', optimize=True)

def banner():
    # a foto do perfil cobre o canto inferior esquerdo no computador: o texto fica à direita (x >= 440)
    im = Image.new('RGB', (1584, 396), BG); d = ImageDraw.Draw(im)
    d.rectangle([440, 52, 620, 57], fill=OURO)
    titulo(d, 440, 72, ['Saúde mental na prática'], 58, 66)
    d.text((440, 148), 'Pronto Atendimento Psiquiátrico · Atenção Primária à Saúde', font=f(FI, 26), fill=SUAVE)
    d.text((440, 190), 'Mentoria para profissionais da APS · Consultoria para empresas e RH', font=f(FI, 22), fill=SUAVE)
    assinatura(d, 440, 252, 17, 1090)
    d.text((440, 366), 'Portal de Saúde Mental Doutor Antônio Felipe Garabito', font=f(FI, 15), fill=OURO)
    im.save('relatorios/linkedin/banner-perfil-1584x396.png', optimize=True)

if __name__ == '__main__':
    og(); banner(); print('ok')
