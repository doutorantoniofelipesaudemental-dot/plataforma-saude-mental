"""Liga a landing /youtube: rota (vercel.json + backend), sitemap, link no rodapé das páginas e botões na /links (com destaque da /instagram no topo). Idempotente."""
import os, re

R = os.path.join(os.path.dirname(__file__), '..')
def ler(f): return open(os.path.join(R, f), encoding='utf8').read()
def gravar(f, s): open(os.path.join(R, f), 'w', encoding='utf8').write(s)

# rota
v = ler('vercel.json')
if '/youtube/?' not in v:
    a = '''    {
      "src": "/linkedin/?",
      "dest": "/public/linkedin.html"
    },'''
    assert a in v
    v = v.replace(a, a + '''
    {
      "src": "/youtube/?",
      "dest": "/public/youtube.html"
    },''', 1)
    gravar('vercel.json', v)

b = ler('backend/index.js')
if "app.get('/youtube'" not in b:
    ln = "app.get('/linkedin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'linkedin.html')));"
    assert ln in b
    b = b.replace(ln, ln + "\napp.get('/youtube', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'youtube.html')));", 1)
    gravar('backend/index.js', b)

# sitemap (/instagram já é rota do backend; entra na lista de páginas estáticas do sitemap)
sm = ler('backend/lib/sitemap.js')
if "'/youtube'" not in sm:
    sm = sm.replace("const PAGINAS_ESTATICAS = ['/mentoria', '/linkedin'];", "const PAGINAS_ESTATICAS = ['/mentoria', '/linkedin', '/youtube', '/instagram'];", 1)
    sm = sm.replace("const DATA_PAGINAS = '2026-10-17T00:00:00.000Z';", "const DATA_PAGINAS = '2026-10-18T00:00:00.000Z';", 1)
    gravar('backend/lib/sitemap.js', sm)

# rodapé das páginas (lista "Navegação" do template)
li = '<li><a href="/linkedin">Para profissionais e empresas</a></li>'
for f in ['index.html', 'blog.html', 'artigo.html']:
    s = ler(f'public/{f}')
    if 'href="/youtube"' not in s:
        assert li in s, f
        s = s.replace(li, li + '\n          <li><a href="/youtube">Canal no YouTube</a></li>', 1)
        gravar(f'public/{f}', s)
# páginas que também precisam do /instagram interno no rodapé
for f in ['index.html', 'blog.html', 'artigo.html']:
    s = ler(f'public/{f}')
    if 'href="/instagram"' not in s:
        s = s.replace('<li><a href="/youtube">Canal no YouTube</a></li>', '<li><a href="/youtube">Canal no YouTube</a></li>\n          <li><a href="/instagram">Do Instagram ao Portal</a></li>', 1)
        gravar(f'public/{f}', s)

s = ler('public/mentoria.html')
if 'href="/youtube"' not in s:
    a = '<a href="/linkedin">Para profissionais e empresas</a>'
    assert a in s
    s = s.replace(a, a + ' · <a href="/youtube">YouTube</a> · <a href="/instagram">Do Instagram</a>', 1)
    gravar('public/mentoria.html', s)

s = ler('public/privacidade.html')
if 'href="/youtube"' not in s:
    a = '<a href="/linkedin">Profissionais e empresas</a>'
    assert a in s
    s = s.replace(a, a + ' · <a href="/youtube">YouTube</a> · <a href="/instagram">Do Instagram</a>', 1)
    gravar('public/privacidade.html', s)

# /links: destaque da /instagram no topo + botão do YouTube
s = ler('public/links.html')
if 'href="/instagram"' not in s:
    dest = '''      <li><a class="botao botao--destaque" href="/instagram">
        <span class="emoji" aria-hidden="true">📱</span>
        <span><span class="nome">Veio do Instagram? Comece por aqui</span><span class="detalhe">Os artigos completos dos posts e os caminhos de cuidado</span></span></a></li>
'''
    a = '    <ul>\n      <li><a class="botao botao--destaque" href="mailto:'
    assert a in s
    s = s.replace(a, '    <ul>\n' + dest + '      <li><a class="botao botao--destaque" href="mailto:', 1)
    yt = '''      <li><a class="botao" href="/youtube">
        <span class="emoji" aria-hidden="true">▶️</span>
        <span><span class="nome">Canal no YouTube</span><span class="detalhe">Saúde mental em vídeo, playlists por tema</span></span></a></li>
'''
    b2 = '      <li><a class="botao" href="/linkedin">'
    assert b2 in s
    s = s.replace(b2, yt + b2, 1)
    gravar('public/links.html', s)
print('ok')
