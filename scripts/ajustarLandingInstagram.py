"""Transforma public/instagram.html (lista dos artigos dos posts) em landing para quem vem da bio do Instagram.
Mantém a lista dinâmica (#lista-instagram, com as capas dos posts já publicados e link para o artigo). Idempotente."""
import os

p = os.path.join(os.path.dirname(__file__), '..', 'public', 'instagram.html')
s = open(p, encoding='utf8').read()
if 'data-landing-instagram' in s:
    print('já aplicado'); raise SystemExit

def troca(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)

troca('<title>Do Instagram — Saúde Mental · Doutor Antônio Felipe</title>', '<title>Do Instagram ao Portal — Saúde Mental · Doutor Antônio Felipe</title>')
troca('content="Os artigos dos posts mais recentes do Instagram @doutor.antoniofelipe.smental, do Dr. Antônio Felipe, do mais novo para o mais antigo."',
      'content="Veio do Instagram @doutor.antoniofelipe.smental? Aqui estão os artigos completos dos posts, o canal no YouTube e os caminhos de cuidado. Conteúdo educativo em saúde mental."')
troca('<meta property="og:title" content="Do Instagram — Saúde Mental · Doutor Antônio Felipe">', '<meta property="og:title" content="Do Instagram ao Portal — Saúde Mental · Doutor Antônio Felipe">')
troca('<meta property="og:description" content="Os artigos dos posts mais recentes do Instagram.">',
      '<meta property="og:description" content="Os artigos completos dos posts do Instagram, o canal no YouTube e os caminhos de cuidado.">')
troca('<meta property="og:image" content="https://www.drantoniofelipemedico.com.br/assets/img/og-cover.png">',
      '<meta property="og:image" content="https://www.drantoniofelipemedico.com.br/assets/img/og-instagram.png">\n'
      '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
      '<meta property="og:image:alt" content="Do Instagram para o Portal: o artigo completo do post que você viu. Dr. Antônio Felipe, médico.">\n'
      '<meta name="twitter:card" content="summary_large_image">\n'
      '<meta name="twitter:image" content="https://www.drantoniofelipemedico.com.br/assets/img/og-instagram.png">')

troca('''      <p class="hero__texto" style="max-width:38rem;margin-bottom:0;">
        Os artigos dos posts mais recentes de @doutor.antoniofelipe.smental, do mais novo para o mais antigo.
      </p>
    </div>
  </section>
''', '''      <p class="hero__texto" style="max-width:38rem;margin-bottom:1rem;">
        Você chegou pelo perfil <a href="https://instagram.com/doutor.antoniofelipe.smental" target="_blank" rel="noopener noreferrer">@doutor.antoniofelipe.smental</a>.
        Aqui ficam os artigos completos dos posts, do mais novo para o mais antigo, com referências e narração em áudio no topo de cada página.
      </p>
      <p class="hero__texto" style="max-width:38rem;margin-bottom:0;" data-landing-instagram>
        Sou o Dr. Antônio Felipe, médico de família e comunidade. O Portal de Saúde Mental Doutor Antônio Felipe Garabito reúne conteúdo educativo, em linguagem simples,
        sobre saúde mental: o que é, como reconhecer, quando buscar ajuda. É conteúdo geral, que não substitui consulta, diagnóstico ou tratamento.
      </p>
    </div>
  </section>
''')

troca('''  <section class="secao secao--verde">
    <div class="container" style="text-align:center;max-width:42rem;">
      <h2>Reconheceu algo nestes textos?</h2>''', '''  <section class="secao" aria-labelledby="t-temas">
    <div class="container" style="max-width:46rem;">
      <h2 id="t-temas">Temas dos posts</h2>
      <p class="texto-apoio">Os posts do perfil seguem estes assuntos. Escolha um para ler o artigo completo:</p>
      <ul>
        <li><a href="/artigo/ansiedade-social-medo-julgamento">Ansiedade: o medo do julgamento que limita a vida</a></li>
        <li><a href="/artigo/depressao-pos-parto-ansiedade-perinatal">Depressão e perdas: sinais e rede de apoio</a></li>
        <li><a href="/artigo/sinais-alerta-comportamentais-jovens">Crianças e adolescentes: sinais de alerta</a></li>
        <li><a href="/artigo/compulsao-alimentar-compras-compulsivas">Corpo, alimentação e saúde emocional</a></li>
        <li><a href="/artigo/violencia-domestica-impacto-criancas">Violência em casa e proteção das crianças</a></li>
        <li><a href="/artigo/estresse-migratorio-adaptacao-cultural">Migração e recomeço em outro país</a></li>
        <li><a href="/artigo/programa-saude-mental-ocupacional">Saúde mental no trabalho</a></li>
        <li><a href="/blog">Ver todos os artigos</a></li>
      </ul>
    </div>
  </section>

  <section class="secao" aria-labelledby="t-outros">
    <div class="container" style="max-width:46rem;">
      <h2 id="t-outros">Outros caminhos</h2>
      <p style="display:flex;flex-wrap:wrap;gap:.75rem;margin:0;">
        <a class="botao botao--vazado" href="/youtube">Canal no YouTube</a>
        <a class="botao botao--vazado" href="/mentoria">Mentoria e consultoria</a>
        <a class="botao botao--vazado" href="/linkedin">Para profissionais e empresas</a>
        <a class="botao botao--vazado" href="/links">Todos os links</a>
      </p>
      <p class="texto-apoio" style="margin-top:1.25rem;">
        <strong>Precisa de apoio agora?</strong> Ligue para o <a href="tel:188">CVV 188</a> (24 horas, gratuito) ou para o <a href="tel:192">SAMU 192</a>.
        Esta página não atende urgências. Não há promessa de resultado. Para consulta, a solicitação é feita por e-mail; não envie informações de saúde por e-mail.
      </p>
    </div>
  </section>

  <section class="secao secao--verde">
    <div class="container" style="text-align:center;max-width:42rem;">
      <h2>Reconheceu algo nestes textos?</h2>''')

troca('<li><a href="/linkedin">Para profissionais e empresas</a></li>', '<li><a href="/linkedin">Para profissionais e empresas</a></li>\n          <li><a href="/youtube">Canal no YouTube</a></li>')
open(p, 'w', encoding='utf8').write(s)
print('ok')
