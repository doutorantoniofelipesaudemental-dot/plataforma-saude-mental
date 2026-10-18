"""Gera public/youtube.html a partir do padrão visual de public/linkedin.html (CSS, cabeçalho e rodapé idênticos).
Sem player do YouTube (sem iframe, sem script de terceiros): só miniatura/link quando houver vídeo público.
Uso: python scripts/gerarLandingYoutube.py"""
import json, os

RAIZ = os.path.join(os.path.dirname(__file__), '..')
src = open(os.path.join(RAIZ, 'public', 'linkedin.html'), encoding='utf8').read()
marca = json.load(open(os.path.join(RAIZ, 'config', 'marca.json'), encoding='utf8'))
CANAL = marca['YOUTUBE_CANAL_URL']

head_end = src.index('<main id="conteudo">')
foot_start = src.index('<footer class="rodape">')
head, foot = src[:head_end], src[foot_start:]

head = head.replace('Saúde Mental para Profissionais de Saúde, Gestores e Empresas · Dr. Antônio Felipe', 'Canal no YouTube: saúde mental em vídeo · Dr. Antônio Felipe')
head = head.replace('Mentoria para profissionais da APS, consultoria para empresas e RH (Kit NR-1) e artigos para gestores e equipes de saúde. Contato por e-mail.',
                    'Canal de conteúdo educativo em saúde mental do Portal de Saúde Mental Doutor Antônio Felipe Garabito: playlists por tema e os artigos correspondentes, com linguagem simples.')
head = head.replace('Mentoria para profissionais da APS, consultoria para empresas e RH (Kit NR-1) e artigos para gestores e equipes de saúde.',
                    'Conteúdo educativo em saúde mental, em vídeo: playlists por tema e os artigos correspondentes.')
head = head.replace('/linkedin"', '/youtube"').replace('og-linkedin.png', 'og-youtube.png').replace('content="627"', 'content="630"')
head = head.replace('Saúde mental na prática, do Pronto Atendimento Psiquiátrico à Atenção Primária. Dr. Antônio Felipe, médico.',
                    'Canal no YouTube: saúde mental em vídeo, com linguagem simples. Dr. Antônio Felipe, médico.')
head = head.replace('  @media (min-width:720px)', '  .cartao .artigos { margin:.75rem 0 0; }\n  .cartao .artigos a { font-size:.95rem; }\n  @media (min-width:720px)', 1)
assert 'og-youtube.png' in head and 'canonical" href="https://www.drantoniofelipemedico.com.br/youtube"' in head

TEMAS = [
    ('Ansiedade', 'Como reconhecer a ansiedade que limita a vida e quando buscar ajuda.',
     [('ansiedade-social-medo-julgamento', 'Ansiedade social: quando o medo do julgamento limita a vida'),
      ('primeiro-dia-escola-ansiedade', 'Primeiro dia de escola: lidando com a ansiedade de separação')]),
    ('Depressão', 'Tristeza, luto e depressão: sinais, rede de apoio e caminhos de cuidado.',
     [('depressao-pos-parto-ansiedade-perinatal', 'Depressão pós-parto e ansiedade perinatal: reconhecendo os sinais'),
      ('reorganizacao-emocional-luto-divorcio', 'Luto e divórcio: reorganizar a vida depois de uma perda')]),
    ('Saúde Mental na APS', 'O cuidado em saúde mental no SUS e na Atenção Primária, perto de casa.',
     [('sinais-alerta-comportamentais-jovens', 'Sinais de alerta em crianças e adolescentes: o que observar'),
      ('envelhecimento-ativo-isolamento-social', 'Saúde mental na terceira idade: isolamento social')]),
    ('Urgências', 'O que observar numa crise e como pedir ajuda a tempo.',
     [('manejo-crise-psiquiatrica', 'Manejo da crise psiquiátrica aguda: o que fazer nos primeiros minutos')]),
    ('Trabalho e NR-1', 'Saúde mental no trabalho, esgotamento e riscos psicossociais.',
     [('programa-saude-mental-ocupacional', 'Como estruturar um programa de saúde mental ocupacional'),
      ('burnout-academico-pos-graduacao-concursos', 'Burnout acadêmico: quando mestrado, doutorado ou concurso cobram um preço')]),
    ('Cuidados Paliativos', 'Cuidar de quem está em fim de vida e de quem cuida.', []),
    ('Violência', 'Violência em casa, impacto nas crianças e rede de proteção.',
     [('violencia-domestica-impacto-criancas', 'Crianças que presenciam violência em casa: impacto, sinais e como proteger')]),
    ('Migração', 'Estresse migratório e adaptação a um novo país.',
     [('estresse-migratorio-adaptacao-cultural', 'Estresse migratório: o que ninguém conta sobre recomeçar em outro país')]),
    ('Corpo e Saúde Mental', 'A relação entre imagem corporal, alimentação e saúde emocional.',
     [('compulsao-alimentar-compras-compulsivas', 'Compulsão alimentar e compras compulsivas: quando o alívio vira um padrão')]),
    ('Relatos da Prática', 'Narrativas compostas da prática clínica, sem pessoas identificáveis.', []),
]

cards = ''
for nome, desc, arts in TEMAS:
    if arts:
        lis = ''.join(f'\n            <li><a href="/artigo/{s}">{t}</a></li>' for s, t in arts)
        lista = f'\n          <ul class="artigos">{lis}\n          </ul>'
    else:
        lista = '\n          <p class="apoio">Os textos desta série chegam em breve. Enquanto isso, <a href="/blog">veja todos os artigos</a>.</p>'
    cards += f'''
        <article class="cartao">
          <h3>{nome}</h3>
          <p class="apoio">{desc}</p>{lista}
        </article>
'''

MAIL = 'mailto:doutor.antoniofelipe.saudemental@gmail.com?subject=Contato%20pelo%20canal%20do%20YouTube'
main = f'''<main id="conteudo">
  <section>
    <div class="container">
      <p class="etiqueta">Canal no YouTube · conteúdo educativo</p>
      <h1>Saúde mental em vídeo, com linguagem simples</h1>
      <p class="apoio" style="margin-top:1rem;">
        Este é o canal do Portal de Saúde Mental Doutor Antônio Felipe Garabito. Os vídeos explicam, com calma e sem termos difíceis, temas de saúde mental
        que aparecem no consultório, no Pronto Atendimento e na Atenção Primária: o que é, como reconhecer, quando buscar ajuda e como cuidar de quem está ao seu lado.
      </p>
      <p class="apoio">
        Esta página é para pacientes, famílias e para quem quer entender melhor o assunto. Cada tema tem o artigo correspondente no portal, com referências e narração em áudio no topo.
      </p>
      <div class="acoes">
        <a class="botao" data-youtube-canal href="{CANAL}" target="_blank" rel="noopener noreferrer">Ir para o canal no YouTube</a>
        <a class="botao botao--vazado" href="/blog">Ler os artigos</a>
      </div>
      <p class="aviso-saude" role="note">Conteúdo educativo: não substitui consulta, diagnóstico ou tratamento. Condutas, fluxos e protocolos seguem sempre as regras do serviço, do Pronto Atendimento e da rede de saúde locais.</p>
    </div>
  </section>

  <section class="faixa" aria-labelledby="t-playlists">
    <div class="container">
      <h2 id="t-playlists">Playlists por tema</h2>
      <p class="apoio">As mesmas playlists do canal. Cada uma traz, abaixo, os artigos do portal sobre o assunto.</p>
      <div class="grade grade--2">{cards}      </div>
    </div>
  </section>

  <section aria-labelledby="t-videos">
    <div class="container">
      <h2 id="t-videos">Vídeos</h2>
      <p class="apoio">Os vídeos aparecem aqui assim que forem publicados no canal. Esta página não carrega o player do YouTube, para não trazer cookies de terceiros: o vídeo abre no próprio YouTube.</p>
    </div>
  </section>

  <section class="cta" aria-labelledby="t-cta">
    <div class="container">
      <h2 id="t-cta">Quer conversar sobre atendimento?</h2>
      <p>Escreva por e-mail, contando apenas o que você busca. A resposta vem por e-mail, com os próximos passos. Não envie informações de saúde por e-mail.</p>
      <p><a class="botao" href="{MAIL}">Enviar e-mail</a></p>
      <p>Outros caminhos: <a href="/instagram">Instagram</a> · <a href="/mentoria">Mentoria e consultoria</a> · <a href="/linkedin">Profissionais e empresas</a>.</p>
    </div>
  </section>

  <section>
    <div class="container">
      <p class="emergencia" role="note"><strong>Precisa de apoio agora?</strong> Ligue para o <a href="tel:188">CVV 188</a> (24 horas, gratuito) ou para o <a href="tel:192">SAMU 192</a>. Esta página não atende urgências. Não há promessa de resultado.</p>
    </div>
  </section>
</main>

'''

ant = '<a href="/mentoria">Mentoria e consultoria</a> · <a href="/links">Links</a>'
assert ant in foot
foot = foot.replace(ant, '<a href="/mentoria">Mentoria e consultoria</a> · <a href="/youtube">YouTube</a> · <a href="/instagram">Do Instagram</a> · <a href="/links">Links</a>')
open(os.path.join(RAIZ, 'public', 'youtube.html'), 'w', encoding='utf8').write(head + main + foot)
print('ok')
