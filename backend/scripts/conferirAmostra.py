import json,re,sys
from faster_whisper import WhisperModel
itens=json.load(open('scratchpad/amostra.json',encoding='utf-8'))
m=WhisperModel('base',device='cpu',compute_type='int8')
ok_geral=True
def norm(s): return re.sub(r'[^a-z0-9ôáéíóúãõç ]+',' ',s.lower())
for it in itens:
    seg,_=m.transcribe(f"narracoes-geradas/{it['slug']}.mp3",language='pt',beam_size=1)
    tr=norm(' '.join(s.text for s in seg)); t=it['texto']
    achados=[]
    if 'Antônio' in t: achados.append(('Antônio', bool(re.search(r'ant[ôo]nio',tr))))
    for sg in ['CRM','RQE','APS','CVV','SAMU','CAPS','SUS','PAP']:
        if re.search(r'\b'+sg+r'\b',t):
            letras=' '.join(sg.lower()); ok=bool(re.search(r'\b'+sg.lower()+r'\b',tr) or letras in tr or sg.lower() in tr.replace(' ',''))
            achados.append((sg,ok))
    for num in sorted(set(re.findall(r'\b(188|192|\d{4})\b',t)))[:3]:
        extenso={'188':'cento e oitenta e oito|um oito oito','192':'cento e noventa e dois|um nove dois'}.get(num,'')
        achados.append((num,bool(num in tr or (extenso and re.search(extenso,tr)) or (len(num)==4 and re.search(r'mil',tr)))))
    falhas=[a for a,ok in achados if not ok]
    ok_geral&=not falhas
    print(it['slug'],'| conferidos:',', '.join(f"{a}{'ok' if ok else 'FALHA'}" for a,ok in achados) or 'nada a conferir')
print('AMOSTRA',('OK' if ok_geral else 'COM DIVERGÊNCIAS (ver FALHA; pode ser limitação do transcritor)'))
