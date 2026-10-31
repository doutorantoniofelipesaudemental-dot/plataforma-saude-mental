"""Gera as amostras do novo padrão visual (fichas, reel, carrossel, stories, podcast, PDF).

Ilustrações desenhadas por código (PIL), sem IA generativa e sem arte de terceiros.
Uso: python gerarAmostras.py <pasta_saida> <python_edge_tts>
Gera também manifest.json, lido por checagemVisual.js (reprova estático, texto cortado,
título duplicado, caixa vazia e excesso de palavras).
"""
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont

from ganhoTrilha import combinar_rms_db, ganho_trilha_db, rms_db

FONTE = "C:/Windows/Fonts/arial.ttf"
FONTE_B = "C:/Windows/Fonts/arialbd.ttf"
NAVY = (13, 25, 50)
NAVY_ESCURO = (9, 18, 40)
NAVY_CLARO = (26, 44, 84)
CREME = (246, 240, 228)
DOURADO = (233, 190, 110)
TEAL = (120, 205, 196)
CINZA = (176, 186, 206)
TINTA = (22, 22, 30)
CRED = "Portal de Saúde Mental Doutor Antônio Felipe Garabito"
ASSINATURA = [
    ("Dr. Antônio Felipe · Médico · CRM-BA 41322", 34, True),
    ("Especialista em Medicina de Família e Comunidade · RQE 26638", 29, False),
    ("Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)", 29, False),
]
CRISE = "Em crise: CVV 188 · SAMU 192"
AVISO_IA = "Narração por voz sintetizada (IA). Orientação geral: respeite os protocolos do seu serviço de saúde."

PERSONAGENS = {
    "Lúcia": {"pele": (224, 176, 140), "cabelo": (205, 205, 210), "cabelo_estilo": "longo",
              "camisa": TEAL, "extra": None},
    "Marcos": {"pele": (150, 100, 70), "cabelo": (30, 25, 25), "cabelo_estilo": "curto",
               "camisa": DOURADO, "extra": None},
    "Teo": {"pele": (196, 140, 105), "cabelo": (40, 30, 30), "cabelo_estilo": "cacheado",
            "camisa": CREME, "extra": None},
    "Dona Ivone": {"pele": (233, 190, 160), "cabelo": (110, 90, 80), "cabelo_estilo": "lenco",
                   "camisa": (84, 110, 168), "extra": (233, 190, 110)},
}
EXPRESSOES = ["neutro", "sorriso", "preocupado", "cansado", "acolhendo", "calmo"]


def fonte(tamanho, negrito=False):
    return ImageFont.truetype(FONTE_B if negrito else FONTE, tamanho)


def desenhar_personagem(nome, expressao, tamanho=512):
    """Personagem em RGBA transparente. Expressões por traços simples."""
    p = PERSONAGENS[nome]
    k = tamanho / 512
    im = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def P(x, y):
        return (tamanho * x, tamanho * y)

    def R(x0, y0, x1, y1):
        return [tamanho * x0, tamanho * y0, tamanho * x1, tamanho * y1]

    if p["cabelo_estilo"] == "longo":
        d.ellipse(R(0.22, 0.08, 0.78, 0.60), fill=p["cabelo"])
    if p["cabelo_estilo"] == "cacheado":
        for cx, cy in [(0.30, 0.16), (0.42, 0.10), (0.58, 0.10), (0.70, 0.16), (0.26, 0.28), (0.74, 0.28)]:
            d.ellipse(R(cx - 0.09, cy - 0.09, cx + 0.09, cy + 0.09), fill=p["cabelo"])
    # corpo e braços
    d.rounded_rectangle(R(0.22, 0.56, 0.78, 0.98), radius=int(60 * k), fill=p["camisa"])
    d.rounded_rectangle(R(0.10, 0.60, 0.26, 0.92), radius=int(18 * k), fill=p["camisa"])
    d.rounded_rectangle(R(0.74, 0.60, 0.90, 0.92), radius=int(18 * k), fill=p["camisa"])
    if p["extra"]:
        d.rounded_rectangle(R(0.36, 0.60, 0.64, 0.66), radius=int(12 * k), fill=p["extra"])
    d.rectangle(R(0.44, 0.46, 0.56, 0.60), fill=p["pele"])
    d.ellipse(R(0.27, 0.10, 0.73, 0.56), fill=p["pele"])
    # cabelo da frente / lenço
    if p["cabelo_estilo"] == "curto":
        d.chord(R(0.27, 0.08, 0.73, 0.44), 180, 360, fill=p["cabelo"])
    if p["cabelo_estilo"] == "cacheado":
        d.chord(R(0.27, 0.08, 0.73, 0.42), 180, 360, fill=p["cabelo"])
    if p["cabelo_estilo"] == "longo":
        d.chord(R(0.27, 0.08, 0.73, 0.40), 180, 360, fill=p["cabelo"])
    if p["cabelo_estilo"] == "lenco":
        d.chord(R(0.24, 0.06, 0.76, 0.40), 180, 360, fill=p["extra"])
        d.polygon([P(0.24, 0.23), P(0.76, 0.23), P(0.50, 0.42)], fill=p["extra"])
    # olhos
    olhos = [(0.41, 0.31), (0.59, 0.31)]
    raio = 0.026
    for ox, oy in olhos:
        if expressao in ("sorriso", "acolhendo"):
            d.arc(R(ox - raio * 1.3, oy - raio * 1.2, ox + raio * 1.3, oy + raio * 1.2), 200, 340,
                  fill=TINTA, width=int(7 * k))
        elif expressao == "calmo":
            d.arc(R(ox - raio * 1.3, oy - raio * 1.0, ox + raio * 1.3, oy + raio * 1.6), 20, 160,
                  fill=TINTA, width=int(7 * k))
        else:
            d.ellipse(R(ox - raio, oy - raio * 1.2, ox + raio, oy + raio * 1.2), fill=TINTA)
            if expressao == "cansado":
                d.rectangle(R(ox - raio * 1.2, oy - raio * 1.4, ox + raio * 1.2, oy), fill=p["pele"])
                d.line([P(ox - raio * 1.2, oy - raio * 0.1), P(ox + raio * 1.2, oy - raio * 0.1)],
                       fill=TINTA, width=int(4 * k))
    # sobrancelhas
    sob = {
        "neutro": [((0.36, 0.25), (0.46, 0.25)), ((0.54, 0.25), (0.64, 0.25))],
        "sorriso": [((0.36, 0.26), (0.46, 0.23)), ((0.54, 0.23), (0.64, 0.26))],
        "preocupado": [((0.36, 0.26), (0.46, 0.21)), ((0.54, 0.21), (0.64, 0.26))],
        "cansado": [((0.36, 0.22), (0.46, 0.25)), ((0.54, 0.25), (0.64, 0.22))],
        "acolhendo": [((0.36, 0.26), (0.46, 0.23)), ((0.54, 0.23), (0.64, 0.26))],
        "calmo": [((0.36, 0.27), (0.46, 0.27)), ((0.54, 0.27), (0.64, 0.27))],
    }[expressao]
    for a, b in sob:
        d.line([P(*a), P(*b)], fill=TINTA, width=int(6 * k))
    # boca
    if expressao in ("sorriso", "acolhendo"):
        d.arc(R(0.41, 0.36, 0.59, 0.50), 20, 160, fill=TINTA, width=int(9 * k))
    elif expressao == "preocupado":
        d.arc(R(0.43, 0.44, 0.57, 0.52), 200, 340, fill=TINTA, width=int(8 * k))
    elif expressao == "cansado":
        d.line([P(0.44, 0.46), P(0.56, 0.46)], fill=TINTA, width=int(7 * k))
    elif expressao == "calmo":
        d.arc(R(0.44, 0.41, 0.56, 0.48), 30, 150, fill=TINTA, width=int(7 * k))
    else:
        d.line([P(0.44, 0.44), P(0.56, 0.44)], fill=TINTA, width=int(7 * k))
    if expressao == "acolhendo":
        blush = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
        bd = ImageDraw.Draw(blush)
        bd.ellipse(R(0.30, 0.36, 0.40, 0.42), fill=(240, 130, 140, 110))
        bd.ellipse(R(0.60, 0.36, 0.70, 0.42), fill=(240, 130, 140, 110))
        im = Image.alpha_composite(im, blush)
        d = ImageDraw.Draw(im)
    if expressao == "cansado":
        d.polygon([P(0.72, 0.18), P(0.68, 0.25), P(0.76, 0.25)], fill=TEAL)
        d.ellipse(R(0.67, 0.23, 0.77, 0.31), fill=TEAL)
    return im


def fundo_gradiente(w, h):
    base = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / h
        cor = tuple(int(NAVY[i] + (NAVY_ESCURO[i] - NAVY[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=cor)
    d.rectangle([0, 0, w, 8], fill=DOURADO)
    return base


def quebrar(d, texto, fnt, largura_max):
    linhas, atual = [], ""
    for palavra in texto.split():
        teste = (atual + " " + palavra).strip()
        if d.textlength(teste, font=fnt) <= largura_max or not atual:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def bloco(im_d, cx, y, texto, tam, cor, largura_max, negrito=False, tipo="arte", caixas=None,
          painel=None, altura=1.2):
    """Escreve texto centralizado em cx, registra a caixa (para a checagem) e devolve o novo y."""
    fnt = fonte(tam, negrito)
    for linha in quebrar(im_d, texto, fnt, largura_max):
        larg = im_d.textlength(linha, font=fnt)
        x = cx - larg / 2
        im_d.text((x, y), linha, font=fnt, fill=cor)
        bb = im_d.textbbox((x, y), linha, font=fnt)
        if caixas is not None:
            caixas.append({"texto": linha, "x0": bb[0], "y0": bb[1], "x1": bb[2], "y1": bb[3],
                           "tipo": tipo, "painel": painel})
        y += int(tam * altura)
    return y


def painel(im_d, idc, x0, y0, x1, y1, paineis, fill=NAVY_CLARO, raio=36):
    im_d.rounded_rectangle([x0, y0, x1, y1], radius=raio, fill=fill)
    paineis.append({"id": idc, "x0": x0, "y0": y0, "x1": x1, "y1": y1})
    return idc


def assinatura(im_d, cx, y, caixas, painel_id, largura_max):
    for txt, tam, neg in ASSINATURA:
        y = bloco(im_d, cx, y, txt, tam, CREME, largura_max, negrito=neg, tipo="assinatura",
                  caixas=caixas, painel=painel_id)
    return y


def salvar_png(im, caminho):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.convert("RGB").save(caminho, "PNG", optimize=True)


# ---------- fichas dos personagens ----------

def gerar_fichas(saida):
    cel = 240
    colunas = len(EXPRESSOES)
    folha = Image.new("RGB", (colunas * cel, len(PERSONAGENS) * (cel + 70)), NAVY)
    d = ImageDraw.Draw(folha)
    lista = []
    for linha, nome in enumerate(PERSONAGENS):
        for col, expr in enumerate(EXPRESSOES):
            per = desenhar_personagem(nome, expr, 512)
            nome_arq = f"{nome.lower().replace(' ', '-').replace('ú', 'u')}-{expr}.png"
            caminho = os.path.join(saida, "fichas", nome_arq)
            os.makedirs(os.path.dirname(caminho), exist_ok=True)
            fundo = fundo_gradiente(512, 512).convert("RGBA")
            fundo.alpha_composite(per)
            salvar_png(fundo, caminho)
            miniatura = fundo.convert("RGB").resize((cel - 20, cel - 20))
            x, y = col * cel + 10, linha * (cel + 70) + 10
            folha.paste(miniatura, (x, y))
            d.text((x + 6, y + cel - 16), f"{nome} · {expr}", font=fonte(20), fill=CREME)
            lista.append(nome_arq)
    rotulo = fonte(28, True)
    for linha, nome in enumerate(PERSONAGENS):
        d.text((10, linha * (cel + 70) + cel + 26), nome.upper(), font=rotulo, fill=DOURADO)
    salvar_png(folha, os.path.join(saida, "fichas", "folha-personagens.png"))
    return lista


# ---------- reel ----------

CENAS = [
    {"id": "s1", "titulo": "Você cuida de todo mundo?", "personagem": "Lúcia", "expr": "preocupado",
     "texto": "Você cuida de alguém e, por último, cuida de você?", "lista": None},
    {"id": "s2", "titulo": "Cuidar é exigente", "personagem": "Lúcia", "expr": "cansado",
     "texto": "Cuidar de alguém é um trabalho exigente, e o cansaço é real.", "lista": None},
    {"id": "s3", "titulo": "Sinais de alerta", "personagem": "Marcos", "expr": "preocupado",
     "texto": "Sono ruim, irritação constante e vontade de se afastar são sinais de alerta.",
     "lista": ["Sono ruim", "Irritação", "Vontade de se afastar"]},
    {"id": "s4", "titulo": "Você não dá conta sozinho", "personagem": "Teo", "expr": "acolhendo",
     "texto": "Você não precisa dar conta de tudo sozinho.", "lista": None},
    {"id": "s5", "titulo": "Pausas que contam", "personagem": "Lúcia", "expr": "calmo",
     "texto": "Pausas curtas, um momento para você e conversa de confiança ajudam.",
     "lista": ["Pausas curtas", "Momento para você", "Conversa de confiança"]},
    {"id": "s6", "titulo": "Quando buscar ajuda", "personagem": "Teo", "expr": "sorriso",
     "texto": "Procure a Atenção Primária, o CAPS ou sua equipe de saúde.",
     "lista": ["Atenção Primária", "CAPS", "Sua equipe de saúde"]},
    {"id": "s7", "titulo": "Em crise, peça ajuda já", "personagem": "Marcos", "expr": "preocupado",
     "texto": "Em crise, ligue 188, do CVV, ou 192, do SAMU.",
     "lista": ["CVV 188", "SAMU 192"]},
    {"id": "s8", "titulo": "Orientação geral", "personagem": "Teo", "expr": "sorriso",
     "texto": "Orientação geral. Respeite os protocolos do seu serviço de saúde.",
     "lista": "ASSINATURA"},
]
W, H, FPS = 1080, 1920, 30


def base_cena(cena, paineis, caixas):
    """Camada estática: título, painéis, lista/assinatura e rodapé de crédito."""
    im = fundo_gradiente(W, H).convert("RGBA")
    d = ImageDraw.Draw(im)
    bloco(d, W / 2, 230, cena["titulo"], 70, DOURADO, 920, negrito=True, tipo="titulo", caixas=caixas)
    if cena["lista"] == "ASSINATURA":
        pid = painel(d, f"{cena['id']}-assinatura", 60, 880, 1020, 1330, paineis)
        y = 905
        y = assinatura(d, W / 2, y, caixas, pid, 900)
        y = bloco(d, W / 2, y + 6, CRISE, 40, DOURADO, 900, negrito=True, tipo="arte", caixas=caixas,
                  painel=pid)
        bloco(d, W / 2, y + 4, AVISO_IA, 26, CINZA, 900, tipo="aviso", caixas=caixas, painel=pid)
    elif cena["lista"]:
        pid = painel(d, f"{cena['id']}-lista", 60, 1060, 1020, 1330, paineis)
        y = 1095
        for item in cena["lista"]:
            y = bloco(d, W / 2, y, "• " + item, 46, CREME, 900, tipo="arte", caixas=caixas, painel=pid)
            y += 6
    pid_legenda = painel(d, f"{cena['id']}-legenda", 60, 1340, 1020, 1580, paineis, fill=NAVY_CLARO)
    rod = bloco(d, W / 2, 1600, CRED, 28, CINZA, 940, tipo="credito", caixas=caixas, painel=None)
    return im, pid_legenda


def mover_pessoa_ou_nada(cena):
    return cena["personagem"]


def gerar_reel(saida, py_tts):
    import shutil
    pasta_tmp = os.path.join(saida, "reel", "_tmp")
    if os.path.isdir(pasta_tmp):
        shutil.rmtree(pasta_tmp)
    os.makedirs(pasta_tmp, exist_ok=True)
    entrada = os.path.join(pasta_tmp, "roteiro.json")
    with open(entrada, "w", encoding="utf-8") as f:
        json.dump([{"id": c["id"], "texto": c["texto"]} for c in CENAS], f, ensure_ascii=False)
    subprocess.run([py_tts, os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts.py"),
                    entrada, pasta_tmp], check=True)
    with open(os.path.join(pasta_tmp, "palavras.json"), encoding="utf-8") as f:
        palavras = json.load(f)

    def dur_audio(caminho):
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                              "csv=p=0", caminho], capture_output=True, text=True, check=True)
        return float(out.stdout.strip())

    inicio_audio = 0.35
    tempos = []
    t = 0.0
    for c in CENAS:
        ad = dur_audio(os.path.join(pasta_tmp, c["id"] + ".mp3"))
        dur = max(ad + inicio_audio + 0.5, 3.0)
        tempos.append({"id": c["id"], "ini": t, "dur": dur, "audio_ini": t + inicio_audio, "audio_dur": ad})
        t += dur
    duracao_total = t

    # música de licença própria: síntese simples (sem arquivo de terceiros), mixada a -22 dB RMS
    # RELATIVOS à voz: o ganho é calculado a partir do RMS medido da narração (ganhoTrilha.py)
    trilha_bruta = os.path.join(pasta_tmp, "trilha-bruta.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
                    f"aevalsrc=0.12*(sin(2*PI*130.81*t)+sin(2*PI*164.81*t)+sin(2*PI*196*t))*(0.7+0.3*sin(2*PI*0.2*t)):s=44100:d={duracao_total:.2f}",
                    trilha_bruta], check=True)
    rms_voz = combinar_rms_db([(rms_db(os.path.join(pasta_tmp, c["id"] + ".mp3")), tp["audio_dur"])
                               for c, tp in zip(CENAS, tempos)])
    ganho = ganho_trilha_db(rms_voz, rms_db(trilha_bruta))
    musica = os.path.join(pasta_tmp, "trilha.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", trilha_bruta, "-af", f"volume={ganho:.2f}dB",
                    musica], check=True)
    print(f"reel: RMS voz {rms_voz:.2f} dB, ganho da trilha {ganho:+.2f} dB (alvo voz-22)")

    manifest_cenas = []
    caixas_todas = []
    paineis_todos = []
    fundos = []
    for cena, tp in zip(CENAS, tempos):
        caixas, paineis = [], []
        base, pid_leg = cena_base = base_cena(cena, paineis, caixas)
        # legenda palavra a palavra (quebra em linhas, marcação de tempo por palavra)
        d = ImageDraw.Draw(base)
        tokens = cena["texto"].split()
        marcas = palavras[cena["id"]]
        if len(marcas) != len(tokens):
            marcas = [{"t": i * tp["audio_dur"] / len(tokens), "d": 0, "p": w} for i, w in enumerate(tokens)]
        fnt = fonte(44, True)
        linhas = quebrar(d, cena["texto"], fnt, 900)
        pos = []
        y = int(1460 - len(linhas) * 54 / 2)
        idx = 0
        for linha in linhas:
            larg_total = d.textlength(linha, font=fnt)
            x = W / 2 - larg_total / 2
            for palavra in linha.split():
                wlen = d.textlength(palavra + " ", font=fnt)
                bb = d.textbbox((x, y), palavra, font=fnt)
                pos.append({"x": x, "y": y, "p": palavra, "t": marcas[idx]["t"] if idx < len(marcas) else tp["audio_dur"]})
                caixas.append({"texto": palavra, "x0": bb[0], "y0": bb[1], "x1": bb[2], "y1": bb[3],
                               "tipo": "legenda", "painel": pid_leg})
                x += wlen
                idx += 1
            y += 54
        # rodapé (crédito) já registrado em base_cena; caixas acumuladas por cena
        assinatura_cena = cena["lista"] == "ASSINATURA"
        pessoa = desenhar_personagem(cena["personagem"], cena["expr"], 300 if assinatura_cena else 520)
        fundos.append({"base": base, "pessoa": pessoa, "pos": pos, "tp": tp, "cena": cena})
        caixas_todas.append({"cena": cena["id"], "titulo": cena["titulo"], "caixas": caixas,
                             "paineis": paineis})
        manifest_cenas.append({"id": cena["id"], "titulo": cena["titulo"], "dur": tp["dur"],
                               "palavrasLegenda": len(tokens)})

    # render dos quadros via pipe para ffmpeg
    caminho_video_mudo = os.path.join(pasta_tmp, "video.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                           "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", caminho_video_mudo],
                          stdin=subprocess.PIPE)
    quadros_totais = int(round(duracao_total * FPS))
    movimento = {c["id"]: [] for c in CENAS}
    anterior = None
    ultimo_idx = -1
    for n in range(quadros_totais):
        tempo = n / FPS
        idx = 0
        for i, tp in enumerate(tempos):
            if tp["ini"] <= tempo < tp["ini"] + tp["dur"]:
                idx = i
                break
        f = fundos[idx]
        tp = f["tp"]
        lt = tempo - tp["ini"]
        quadro = f["base"].copy()
        bob = math.sin(2 * math.pi * lt / 1.6) * 8
        tam_p = f["pessoa"].size[0]
        if f["cena"]["lista"] == "ASSINATURA":
            pos_p = (int(W / 2 - tam_p / 2), int(420 + bob))
        else:
            pos_p = (int(W / 2 - tam_p / 2), int(780 - tam_p / 2 + bob))
        quadro.alpha_composite(f["pessoa"], pos_p)
        dq = ImageDraw.Draw(quadro)
        ta = lt - inicio_audio
        for p_ in f["pos"]:
            falado = ta >= p_["t"] and p_["t"] >= 0
            cor = DOURADO if falado else (140, 150, 175)
            dq.text((p_["x"], p_["y"]), p_["p"], font=fonte(44, True), fill=cor)
        rgb = quadro.convert("RGB")
        ff.stdin.write(rgb.tobytes())
        if idx != ultimo_idx:
            anterior = None
            ultimo_idx = idx
        pequeno = rgb.resize((108, 192)).convert("L")
        if anterior is not None:
            diff = ImageChops.difference(pequeno, anterior)
            hist = diff.histogram()
            soma = sum(v * c for v, c in enumerate(hist))
            movimento[f["cena"]["id"]].append(soma / (108 * 192))
        anterior = pequeno
    ff.stdin.close()
    ff.wait()

    for m in manifest_cenas:
        vals = movimento[m["id"]]
        m["movimento"] = round(sum(vals) / len(vals), 3) if vals else 0.0

    # áudio: narrações atrasadas + trilha, mixadas
    entradas = []
    filtros = []
    for i, tp in enumerate(tempos):
        entradas += ["-i", os.path.join(pasta_tmp, CENAS[i]["id"] + ".mp3")]
        atraso = int(tp["audio_ini"] * 1000)
        filtros.append(f"[{i}:a]adelay={atraso}|{atraso},volume=1.0[n{i}]")
    entradas += ["-i", musica]
    n = len(CENAS)
    mix_in = "".join(f"[n{i}]" for i in range(n)) + f"[{n}:a]"
    filtros.append(f"{mix_in}amix=inputs={n + 1}:duration=longest:normalize=0[a]")
    caminho_audio = os.path.join(pasta_tmp, "audio.m4a")
    subprocess.run(["ffmpeg", "-y", "-v", "error"] + entradas +
                   ["-filter_complex", ";".join(filtros), "-map", "[a]", "-c:a", "aac", "-b:a", "128k",
                    caminho_audio], check=True)
    saida_mp4 = os.path.join(saida, "reel", "reel-saude-mental-do-cuidador-1080x1920.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", caminho_video_mudo, "-i", caminho_audio,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest",
                    saida_mp4], check=True)
    # capa (quadro da cena 1 e do encerramento)
    salvar_png(fundos[0]["base"].copy(), os.path.join(saida, "reel", "capa-cena-1.png"))
    salvar_png(fundos[-1]["base"].copy(), os.path.join(saida, "reel", "capa-cena-final.png"))
    manifest = {
        "nome": "reel",
        "largura": W, "altura": H, "duracaoSeg": round(duracao_total, 2),
        "cenas": manifest_cenas,
        "caixas": [c for c in caixas_todas],
    }
    return manifest


# ---------- carrossel 1080x1350 ----------

SLIDES = [
    {"titulo": "Saúde mental do cuidador", "corpo": "Para cuidadores de familiares", "selo": True,
     "personagem": "Lúcia", "expr": "preocupado"},
    {"titulo": "Cuidar exige muito", "corpo": "Cuidar de alguém é um trabalho exigente, e o cansaço é real.",
     "personagem": "Lúcia", "expr": "cansado"},
    {"titulo": "Sinais de alerta", "lista": ["Sono ruim", "Irritação constante", "Vontade de se afastar"],
     "personagem": "Marcos", "expr": "preocupado"},
    {"titulo": "Você não precisa dar conta sozinho", "corpo": "Dividir a tarefa com a família e a rede é parte do cuidado.",
     "personagem": "Teo", "expr": "acolhendo"},
    {"titulo": "Pausas que contam", "lista": ["Pausas curtas ao longo do dia", "Um momento só seu", "Conversa com alguém de confiança"],
     "personagem": "Lúcia", "expr": "calmo"},
    {"titulo": "Quando buscar ajuda", "lista": ["Atenção Primária à Saúde", "CAPS da sua região", "Equipe de saúde da sua unidade"],
     "personagem": "Teo", "expr": "sorriso"},
    {"titulo": "Em crise, peça ajuda já", "corpo": CRISE, "personagem": "Marcos", "expr": "preocupado"},
    {"titulo": "Orientação geral", "assinatura": True, "personagem": "Dona Ivone", "expr": "sorriso"},
]


def gerar_carrossel(saida):
    cw, ch = 1080, 1350
    slides_img = []
    manifest = []
    for i, s in enumerate(SLIDES, start=1):
        im = fundo_gradiente(cw, ch).convert("RGBA")
        d = ImageDraw.Draw(im)
        caixas, paineis = [], []
        bloco(d, cw / 2, 120, "SAÚDE MENTAL DO CUIDADOR", 30, DOURADO, 900, negrito=True, tipo="rotulo", caixas=caixas)
        bloco(d, cw / 2, 200, s["titulo"], 72, CREME, 920, negrito=True, tipo="titulo", caixas=caixas)
        pessoa = desenhar_personagem(s["personagem"], s["expr"], 430)
        im.alpha_composite(pessoa, (cw // 2 - 215, 430))
        y = 900
        if s.get("selo"):
            selo_id = painel(d, "s1-selo", 150, 1000, 930, 1080, paineis, fill=DOURADO, raio=40)
            bloco(d, cw / 2, 1018, "Para " + s["corpo"].replace("Para ", ""), 40, TINTA, 740, negrito=True,
                  tipo="selo", caixas=caixas, painel=selo_id)
        elif s.get("lista"):
            pid = painel(d, f"s{i}-lista", 80, 900, 1000, 1220, paineis)
            yy = 930
            for item in s["lista"]:
                yy = bloco(d, cw / 2, yy, "• " + item, 40, CREME, 880, tipo="arte", caixas=caixas, painel=pid)
                yy += 4
        elif s.get("assinatura"):
            pid = painel(d, f"s{i}-assinatura", 60, 880, 1020, 1190, paineis)
            yy = 905
            yy = assinatura(d, cw / 2, yy, caixas, pid, 900)
        else:
            pid = painel(d, f"s{i}-corpo", 80, 900, 1000, 1200, paineis)
            bloco(d, cw / 2, 940, s["corpo"], 46, CREME, 880, tipo="arte", caixas=caixas, painel=pid)
        if s.get("assinatura"):
            bloco(d, cw / 2, 1220, AVISO_IA, 26, CINZA, 940, tipo="aviso", caixas=caixas)
            bloco(d, cw / 2, 1300, CRED, 26, CINZA, 940, tipo="credito", caixas=caixas)
        else:
            bloco(d, cw / 2, 1262, "Orientação geral · " + CRISE, 26, CINZA, 940, tipo="aviso", caixas=caixas)
        rgb = im.convert("RGB")
        caminho = os.path.join(saida, "carrossel", f"slide-{i:02d}.png")
        salvar_png(rgb, caminho)
        slides_img.append(rgb)
        arte = [c["texto"] for c in caixas if c["tipo"] in ("arte", "titulo")]
        manifest.append({"id": f"slide-{i:02d}", "titulo": s["titulo"], "caixas": caixas, "paineis": paineis,
                         "palavrasArte": sum(len(t.split()) for t in arte), "dur": 0,
                         "movimento": 1.0})
    pdf_linkedin = os.path.join(saida, "linkedin", "carrossel-linkedin.pdf")
    os.makedirs(os.path.dirname(pdf_linkedin), exist_ok=True)
    slides_img[0].save(pdf_linkedin, "PDF", save_all=True, append_images=slides_img[1:], resolution=96)
    return {"nome": "carrossel", "largura": cw, "altura": ch, "slides": manifest}


# ---------- stories ----------

def gerar_stories(saida):
    sw, sh = 1080, 1920
    resultado = []

    def base():
        im = fundo_gradiente(sw, sh).convert("RGBA")
        return im, ImageDraw.Draw(im)

    # 1 enquete
    im, d = base()
    caixas, paineis = [], []
    bloco(d, sw / 2, 260, "Enquete do cuidador", 52, DOURADO, 900, negrito=True, tipo="rotulo", caixas=caixas)
    pid = painel(d, "enquete", 80, 420, 1000, 1200, paineis, fill=CREME, raio=50)
    bloco(d, sw / 2, 480, "Você tem tido tempo para cuidar de si?", 60, TINTA, 820, negrito=True,
          tipo="arte", caixas=caixas, painel=pid)
    for x0, rotulo in [(120, "Sim"), (580, "Às vezes")]:
        p2 = painel(d, f"opcao-{rotulo}", x0, 900, x0 + 380, 1010, paineis, fill=NAVY_CLARO, raio=50)
        bloco(d, x0 + 190, 930, rotulo, 46, CREME, 340, negrito=True, tipo="arte", caixas=caixas, painel=p2)
    bloco(d, sw / 2, 1100, "Respostas anônimas, sem identificação", 34, TINTA, 800, tipo="aviso",
          caixas=caixas, painel=pid)
    bloco(d, sw / 2, 1600, CRISE, 36, DOURADO, 900, negrito=True, tipo="aviso", caixas=caixas)
    salvar_png(im, os.path.join(saida, "stories", "story-1-enquete.png"))
    resultado.append({"id": "story-1", "caixas": caixas, "paineis": paineis, "palavrasArte": 9, "movimento": 1.0,
                      "titulo": "Enquete do cuidador"})

    # 2 pergunta
    im, d = base()
    caixas, paineis = [], []
    bloco(d, sw / 2, 260, "Pergunta da semana", 52, DOURADO, 900, negrito=True, tipo="rotulo", caixas=caixas)
    pid = painel(d, "pergunta", 80, 420, 1000, 900, paineis, fill=CREME, raio=50)
    bloco(d, sw / 2, 480, "O que mais pesa no seu dia de cuidador?", 62, TINTA, 840, negrito=True,
          tipo="arte", caixas=caixas, painel=pid)
    p2 = painel(d, "caixa-resposta", 80, 980, 1000, 1140, paineis, fill=NAVY_CLARO, raio=50)
    bloco(d, sw / 2, 1040, "Escreva sua resposta", 42, CREME, 860, tipo="arte", caixas=caixas, painel=p2)
    bloco(d, sw / 2, 1600, CRISE, 36, DOURADO, 900, negrito=True, tipo="aviso", caixas=caixas)
    salvar_png(im, os.path.join(saida, "stories", "story-2-pergunta.png"))
    resultado.append({"id": "story-2", "caixas": caixas, "paineis": paineis, "palavrasArte": 12, "movimento": 1.0,
                      "titulo": "Pergunta da semana"})

    # 3 chamada ao áudio narrado
    im, d = base()
    caixas, paineis = [], []
    im.alpha_composite(desenhar_personagem("Teo", "acolhendo", 400), (340, 380))
    bloco(d, sw / 2, 830, "Ouça o texto narrado no portal", 60, CREME, 900, negrito=True, tipo="arte", caixas=caixas)
    link = painel(d, "adesivo-link", 120, 1000, 960, 1110, paineis, fill=DOURADO, raio=50)
    bloco(d, sw / 2, 1035, "Ouvir no portal", 46, TINTA, 800, negrito=True, tipo="arte", caixas=caixas, painel=link)
    bloco(d, sw / 2, 1140, "www.drantoniofelipemedico.com.br", 34, CREME, 900, tipo="arte", caixas=caixas)
    yy = assinatura(d, sw / 2, 1380, caixas, None, 920)
    bloco(d, sw / 2, 1620, CRISE, 36, DOURADO, 900, negrito=True, tipo="aviso", caixas=caixas)
    bloco(d, sw / 2, 1670, AVISO_IA, 26, CINZA, 940, tipo="aviso", caixas=caixas)
    salvar_png(im, os.path.join(saida, "stories", "story-3-chamada-audio.png"))
    resultado.append({"id": "story-3", "caixas": caixas, "paineis": paineis, "palavrasArte": 12, "movimento": 1.0,
                      "titulo": "Ouça o texto narrado"})
    return resultado


# ---------- podcast ----------

def gerar_podcast(saida):
    tam = 3000
    im = fundo_gradiente(tam, tam).convert("RGBA")
    d = ImageDraw.Draw(im)
    caixas, paineis = [], []
    bloco(d, tam / 2, 380, "Relatos da Prática", 230, DOURADO, 2600, negrito=True, tipo="titulo", caixas=caixas)
    bloco(d, tam / 2, 880, "Saúde mental do cuidador", 110, CREME, 2600, tipo="arte", caixas=caixas)
    im.alpha_composite(desenhar_personagem("Dona Ivone", "acolhendo", 1100), (950, 1250))
    bloco(d, tam / 2, 2480, "Narrativas compostas, sem pacientes identificáveis", 80, CREME, 2500, tipo="arte",
          caixas=caixas)
    bloco(d, tam / 2, 2680, CRED, 70, CINZA, 2600, tipo="credito", caixas=caixas)
    salvar_png(im, os.path.join(saida, "podcast", "capa-relatos-da-pratica-3000.png"))
    return {"id": "podcast-capa", "largura": tam, "altura": tam, "caixas": caixas, "paineis": paineis,
            "titulo": "Relatos da Prática"}


def main():
    saida = os.path.abspath(sys.argv[1])
    py_tts = sys.argv[2]
    os.makedirs(saida, exist_ok=True)
    manifesto = {}
    manifesto["fichas"] = gerar_fichas(saida)
    manifesto["reel"] = gerar_reel(saida, py_tts)
    manifesto["carrossel"] = gerar_carrossel(saida)
    manifesto["stories"] = gerar_stories(saida)
    manifesto["podcast"] = gerar_podcast(saida)
    with open(os.path.join(saida, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    print("ok", saida)


if __name__ == "__main__":
    main()
