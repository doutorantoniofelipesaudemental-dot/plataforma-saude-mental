# Esteira offline de pílulas (v1): fila_producao/*.md -> saida_pronta/<nome>/
# Sem API externa. Voz Kokoro pf_dora (local). Montagem pelo montador oficial (producao-audiovisual/montador/montar.js).
# Uso: python scripts/esteira/gerar_lote_offline.py [--so <nome>]
# Não publica nada. Não altera assets/ nem o banco. Temporários só em .tmp/esteira/<item>/.
import json, os, re, shutil, subprocess, sys, time, glob
import numpy as np, soundfile as sf

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS = os.environ.get("ESTEIRA_ASSETS", "C:/DRSAUDEMENTAL/assets/cartoon-higgsfield")
MONTAR = os.environ.get("ESTEIRA_MONTAR", os.path.join(RAIZ, "producao-audiovisual", "montador", "montar.js")).replace("\\", "/")
KOKORO_DIR = "C:/DRSAUDEMENTAL/.tmp/kokoro-modelo"
FILA = os.path.join(RAIZ, "fila_producao")
SAIDA = os.path.join(RAIZ, "saida_pronta")
TMP = os.path.join(RAIZ, ".tmp", "esteira")
EIXOS = ["01-infancia-familia", "02-maternidade-perinatal", "03-vida-adulta-envelhecimento", "04-cuidar-de-quem-cuida",
         "05-transtornos-mentais", "06-habitos-estilo-vida-sono", "07-sociedade-cultura", "08-relatos-da-pratica"]
SIGLAS = {"CVV", "SAMU", "UBS", "SUS", "CAPS", "NR", "TOC", "TCC", "PMID", "CRAS", "PA", "RQE", "CRM", "APS", "PAP", "EMDR"}
ARTIGO_BASE = "https://www.drantoniofelipemedico.com.br/artigo.html?slug="
UTM = "?utm_source=youtube&utm_medium=video&utm_campaign=esteira-offline"


def ler_pauta(caminho):
    txt = open(caminho, encoding="utf-8").read().replace("\r\n", "\n")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", txt, re.S)
    if not m:
        raise ValueError("cabeçalho YAML ausente")
    cab = {}
    for linha in m.group(1).split("\n"):
        if ":" in linha:
            k, v = linha.split(":", 1)
            cab[k.strip()] = v.strip().strip('"')
    frases = [f.strip() for f in m.group(2).split("\n") if f.strip() and not f.startswith("#")]
    erros = []
    for k in ("eixo", "formato", "titulo", "artigo"):
        if not cab.get(k):
            erros.append(f"cabeçalho sem '{k}'")
    if cab.get("eixo") and cab["eixo"] not in EIXOS:
        erros.append(f"eixo desconhecido: {cab['eixo']}")
    if cab.get("formato") not in ("9x16", "16x9", "ambos"):
        erros.append("formato deve ser 9x16, 16x9 ou ambos")
    if not frases:
        erros.append("roteiro vazio")
    for f in frases:
        for sg in re.findall(r"\b[A-Z]{2,}\b", f):
            if sg not in SIGLAS:
                erros.append(f"sigla sem expansão: {sg} (na frase: {f[:50]}...)")
        if re.search(r"\b(psiquiatra|sintétic[oa]|cura|consulta|agendamento)\b", f, re.I):
            erros.append(f"termo proibido na frase: {f[:60]}")
    return cab, frases, erros


def escolher_clipes(eixo, formato, n):
    pasta = os.path.join(ASSETS, eixo, "cenarios")
    alvo = "916" if formato == "9x16" else "169"
    arqs = sorted(glob.glob(os.path.join(pasta, f"*-{alvo}.mp4")))
    if not arqs:
        raise FileNotFoundError(f"sem b-rolls {alvo} em {pasta}")
    return [arqs[i % len(arqs)] for i in range(n)]


def dur_clip(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True)
    return float(r.stdout.strip() or 10)


def srt_t(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}".replace(".", ",")


def processar(md, kokoro, pf):
    nome = os.path.splitext(os.path.basename(md))[0]
    cab, frases, erros = ler_pauta(md)
    rel = {"nome": nome, "erros": erros, "inicio": time.time()}
    if erros:
        rel["status"] = "REPROVADO_VALIDACAO"
        return rel
    trab = os.path.join(TMP, nome); os.makedirs(os.path.join(trab, "clipes"), exist_ok=True); os.makedirs(os.path.join(trab, "narr"), exist_ok=True)
    out = os.path.join(SAIDA, nome); os.makedirs(out, exist_ok=True)
    import numpy as _np
    # 1) narração por frase (Kokoro pf_dora)
    partes, plano, t = [], [], 0.0
    for i, f in enumerate(frases):
        s, sr = kokoro.create(f, voice="pf_dora", speed=1.0, lang="pt-br")
        s = _np.asarray(s, dtype=_np.float32); L = len(s) / sr
        dur = max(4.0, L + 0.4)
        partes.append((t, s, sr)); plano.append({"ini": t, "dur": dur, "frase": f, "fala": L})
        t += dur
    total = t
    buf = _np.zeros(int((total + 0.5) * 24000), dtype=_np.float32)
    for ini, s, sr in partes:
        i0 = int(ini * 24000); buf[i0:i0 + len(s)] += s[: len(buf) - i0]
    narr = os.path.join(trab, "narracao.wav"); sf.write(narr, buf[: int(total * 24000)], 24000)
    # 2) clipes (cena = frase), trilha sintética
    clipes_fonte = escolher_clipes(cab["eixo"], "9x16" if cab["formato"] != "16x9" else "16x9", len(frases))
    cenas = []
    for i, (p, src) in enumerate(zip(plano, clipes_fonte)):
        cid = f"P{i+1}"; cd = dur_clip(src); extra = max(0.0, p["dur"] - cd) + 0.5
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-vf", f"tpad=stop_mode=clone:stop_duration={extra:.3f}",
                        "-t", f"{p['dur']:.3f}", "-an", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", os.path.join(trab, "clipes", cid + ".mp4")], check=True)
        cenas.append({"cena_id": cid, "tipo": "animacao", "duracao_s": round(p["dur"], 2), "clip": cid, "fala": p["frase"], "texto_tela": "", "fonte_pmid": None})
    fim_dur = 6.0
    cenas.append({"cena_id": "FIM", "tipo": "cartela", "duracao_s": fim_dur, "fala": "", "texto_tela": "", "fonte_pmid": None, "cartao": CARTAO_LINHAS()})
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"aevalsrc=0.05*sin(2*PI*220*t)+0.03*sin(2*PI*330*t)|0.05*sin(2*PI*220*t)+0.03*sin(2*PI*330*t):s=48000",
                    "-t", f"{total + fim_dur:.3f}", "-c:a", "pcm_s16le", os.path.join(trab, "trilha.wav")], check=True)
    # roteiro + legenda por frase (texto do roteiro, tempos do plano)
    ass = os.path.join(trab, "legenda.ass")
    with open(ass, "w", encoding="utf-8") as fa:
        fa.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\n")
        fa.write("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n")
        fa.write("Style: Padrao,Arial,52,&H00FFFFFF,&H00FFFFFF,&H00000000,&H66000000,-1,0,0,0,100,100,0,0,3,3,1,2,60,60,300,1\n\n[Events]\n")
        fa.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for p in plano:
            fa.write(f"Dialogue: 0,{ass_t(p['ini'])},{ass_t(p['ini'] + p['dur'] - 0.2)},Padrao,,0,0,0,,{p['frase']}\n")
    roteiro = {"slug": nome, "fonteArtigo": cab["artigo"], "serie": "Saúde Mental em Um Minuto", "formato": "animacao-9x16", "titulo": cab["titulo"],
               "identificacao": True, "avisos": {"ia": True, "cvvSamu": True, "orientacaoGeral": True}, "personagens": [], "cenas": cenas,
               "legenda": ass.replace("\\", "/"), "pendencias": ["trilha sintética (FluidSynth não usado nesta v1)"]}
    rj = os.path.join(trab, "roteiro.json"); json.dump(roteiro, open(rj, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # 3) montagem (montador oficial) + medição
    pasta_m = os.path.join(trab, "montagem")
    r = subprocess.run(["node", MONTAR, rj.replace("\\", "/"), os.path.join(trab, "clipes").replace("\\", "/"), narr.replace("\\", "/"),
                        os.path.join(trab, "trilha.wav").replace("\\", "/"), pasta_m.replace("\\", "/")], capture_output=True, text=True)
    if r.returncode != 0:
        rel["status"] = "REPROVADO_MONTAGEM"; rel["log"] = (r.stdout + r.stderr)[-600:]
        return rel
    f916 = os.path.join(pasta_m, "out", nome + "-9x16.mp4"); f169 = os.path.join(pasta_m, "out", nome + "-16x9.mp4")
    if cab["formato"] in ("9x16", "ambos"):
        normalizar(f916, os.path.join(out, "video-9x16.mp4"))
    if cab["formato"] in ("16x9", "ambos"):
        shutil.copy(f169, os.path.join(out, "video-16x9.mp4"))
    lufs = subprocess.run(["ffmpeg", "-hide_banner", "-i", os.path.join(out, "video-9x16.mp4"), "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=summary", "-f", "null", "-"], capture_output=True, text=True).stderr
    med = dict(re.findall(r"Input (Integrated|True Peak):\s+(-?[\d.]+)", lufs))
    # 4) descrição, legendas.srt, relatório
    with open(os.path.join(out, "legendas.srt"), "w", encoding="utf-8") as fs_:
        for i, p in enumerate(plano):
            fs_.write(f"{i+1}\n{srt_t(p['ini'])} --> {srt_t(p['ini'] + p['dur'] - 0.2)}\n{p['frase']}\n\n")
    descricao = (f"{cab['titulo']}\n\n" + " ".join(frases) + "\n\n" +
                 "Fonte: Portal de Saúde Mental Doutor Antônio Felipe Garabito · drantoniofelipemedico.com.br\n" +
                 f"Artigo completo: {ARTIGO_BASE}{cab['artigo']}{UTM}\n\n" +
                 "Conteúdo produzido com apoio de Inteligência Artificial.\nImagens e voz criadas com IA. Personagens ilustrativos.\n" +
                 "Orientação geral: respeite sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.\n" +
                 "Em crise: CVV 188 · SAMU 192\n\n" + "\n".join(CARTAO_LINHAS()[:5]) + "\n")
    open(os.path.join(out, "descricao.txt"), "w", encoding="utf-8").write(descricao)
    json.dump({"arquivos": {"video": "video-9x16.mp4"}, "descricao": descricao, "artigo": ARTIGO_BASE + cab["artigo"]},
              open(os.path.join(out, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    rel.update({"status": "GERADO", "medicao": med, "saida": out, "frases": len(frases), "duracao_s": round(total + fim_dur, 2),
                "tempo_s": round(time.time() - rel["inicio"], 1)})
    json.dump(rel, open(os.path.join(out, "relatorio.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # 5) mover a pauta para concluídos (mover, não apagar)
    conc = os.path.join(FILA, "concluidos"); os.makedirs(conc, exist_ok=True)
    shutil.move(md, os.path.join(conc, os.path.basename(md)))
    return rel


def ass_t(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def CARTAO_LINHAS():
    # Cartão de 5 linhas (identificação oficial lida de backend/lib/identificacaoCfm.js, pelo montador) + linhas obrigatórias da pauta
    return ["Dr. Antônio Felipe — Médico — CRM-BA 41322",
            "Especialista em Medicina de Família e Comunidade — RQE 26638",
            "Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)",
            "Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho",
            "NÃO ESPECIALISTA",
            "Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito",
            "Conteúdo produzido com apoio de Inteligência Artificial.",
            "Em crise: CVV 188 · SAMU 192",
            "Imagens e voz criadas com IA. Personagens ilustrativos.",
            "Orientação geral: respeite sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.",
            "Leia o artigo completo no Portal"]


def normalizar(entrada, saida):
    # 2 passagens de loudnorm (−14 LUFS, TP −2), vídeo sem recodificar
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", entrada, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    err = r.stderr; j = json.loads(err[err.rfind("{"):err.rfind("}") + 1])
    af = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", entrada, "-af", af, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", saida], check=True)


def main(argv):
    so = argv[argv.index("--so") + 1] if "--so" in argv else None
    os.makedirs(FILA, exist_ok=True); os.makedirs(SAIDA, exist_ok=True)
    pautas = sorted(p for p in glob.glob(os.path.join(FILA, "*.md")) if not os.path.basename(p).startswith("exemplo"))
    if so:
        pautas = [p for p in pautas if os.path.splitext(os.path.basename(p))[0] == so]
    if not pautas:
        print("fila vazia"); return 0
    import importlib
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(os.path.join(KOKORO_DIR, "kokoro-v1.0.onnx").replace("\\", "/"), os.path.join(KOKORO_DIR, "voices-v1.0.bin").replace("\\", "/"))
    for md in pautas:
        rel = processar(md, kokoro, None)
        print(rel["nome"], rel["status"], rel.get("erros") or rel.get("medicao") or "")
        with open(os.path.join(SAIDA, rel["nome"] + "-log.txt"), "a", encoding="utf-8") as lg:
            lg.write(json.dumps(rel, ensure_ascii=False, default=str) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
