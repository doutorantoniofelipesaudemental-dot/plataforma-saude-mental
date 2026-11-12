// Ordem de 09/11/2026: Portal (topo e temas), Blog (topo e filtros), Relatos da Prática e regra editorial.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/\r\n/g, '\n');
const semEspacos = (s) => s.replace(/\s+/g, ' ').trim();

const { TEMAS, RELATOS, RELATOS_FRASE, categoriasDoTema, temaEfetivo } = require('../../backend/lib/temas');
const { CATEGORIAS } = require('../../backend/models/Artigo');
const { EIXOS_OFICIAIS } = require('../../scripts/plano-diretor/pilares');
const { NOTA_FICCAO, NOTA_FICCAO_TEXTO, checarRelato } = require('../../backend/lib/relatos');
const { normalizarQuery, filtroDoTema } = require('../../backend/lib/listarArtigos');
const { renderizarBlogHtml } = require('../../backend/lib/renderizarBlog');

const index = semEspacos(ler('public/index.html'));
const blog = ler('public/blog.html');
const blogJs = ler('public/assets/js/blog.js');
const claudeMd = ler('CLAUDE.md');

// ---------------------------------------------------------------- Portal (página inicial)
test('topo da página inicial: etiqueta, título e textos exatos da ordem', () => {
  assert.ok(index.includes('<p class="etiqueta">PORTAL DE SAÚDE MENTAL</p>'));
  assert.ok(index.includes('<h1>Portal de Saúde Mental Doutor Antônio Felipe: um lugar para entender o que se sente, com ciência e acolhimento</h1>'));
  assert.ok(index.includes('Seja qual for o seu momento, este é um lugar para você. Não é preciso saber explicar o que sente para começar.'));
  assert.ok(index.includes('organizados pelas fases da vida, da infância ao envelhecimento.'));
  assert.ok(index.includes('que atua no Pronto Atendimento Psiquiátrico e na Atenção Primária, para quem sofre, para quem cuida de alguém e para quem trabalha cuidando de pessoas.'));
  assert.ok(index.includes('Conteúdo educativo. Ele não substitui uma avaliação. Para cuidado, procure a UBS, o CAPS da sua região ou o seu plano de saúde.'));
});

test('topo da página inicial: botões exatos e faixa CVV/SAMU mantida', () => {
  assert.ok(index.includes('<a class="botao" href="#temas">Começar pelo meu momento</a>'));
  assert.ok(index.includes('>Ouvir as narrações</a>'));
  assert.ok(index.includes('>Mentoria, consultoria e formação</a>'));
  assert.ok(index.includes('Ligue <a href="tel:188">188</a> (CVV, gratuito, 24h) ou <a href="tel:192">192</a> (SAMU)'));
  assert.ok(index.includes('Preciso de ajuda agora'));
});

test('identificação completa (CRM-BA e RQE) continua visível na página inicial', () => {
  assert.ok(index.includes('CRM-BA 41322'));
  assert.ok(index.includes('RQE 26638'));
});

test('a frase de Transtornos Mentais foi trocada e as demais mantidas', () => {
  assert.ok(index.includes('O que são os transtornos mentais, como é feito o diagnóstico e quais condutas têm respaldo científico, explicados com clareza.'));
  assert.equal(index.includes('Transtornos mentais são condições de saúde'), false);
});

test('Relatos da Prática é bloco independente, depois dos 7 temas, com botão Ler os relatos', () => {
  const temas = index.indexOf('id="temas"');
  const relatos = index.indexOf('class="relatos-bloco"');
  const paraQuem = index.indexOf('id="para-quem-e"');
  assert.ok(temas > 0 && relatos > temas && relatos < paraQuem, 'bloco Relatos deve vir depois dos temas');
  assert.ok(index.includes('Artigos literários inspirados na prática clínica, com identidades protegidas, que mostram o lado humano do cuidado.'));
  assert.ok(index.includes('href="/blog?formato=relatos">Ler os relatos</a>'));
});

// ---------------------------------------------------------------- 7 temas: fonte única
test('os 7 temas são os mesmos da seção Temas do Portal e dos eixos do plano-diretor (mesma ordem)', () => {
  const cards = [...index.matchAll(/<article class="cartao"> ?<h3>(.*?)<\/h3> ?<p>(.*?)<\/p>/g)].map((m) => [
    m[1].replace(/&amp;/g, '&'),
    m[2],
  ]);
  assert.equal(cards.length, 7);
  assert.deepEqual(cards.map(([nome]) => nome), TEMAS.map((t) => t.nome));
  assert.deepEqual(TEMAS.map((t) => t.nome), EIXOS_OFICIAIS);
  cards.forEach(([, frase], i) => assert.equal(frase, TEMAS[i].frase, `frase do tema ${i + 1}`));
});

test('nomes curtos dos filtros exatos e um slug por tema', () => {
  assert.deepEqual(
    TEMAS.map((t) => t.curto),
    ['Infância & Família', 'Maternidade & Perinatal', 'Vida Adulta & Envelhecimento', 'Cuidar de Quem Cuida (NR-1)', 'Transtornos Mentais', 'Hábitos & Sono', 'Sociedade & Cultura']
  );
  assert.equal(new Set(TEMAS.map((t) => t.slug)).size, 7);
});

test('toda categoria do banco cai em exatamente um tema, ou é Relatos (nenhum artigo fica sem tema)', () => {
  const todas = TEMAS.flatMap((t) => t.categorias);
  const sobrando = CATEGORIAS.filter((c) => c !== RELATOS && !todas.includes(c));
  assert.deepEqual(sobrando, []);
  const duplicadas = todas.filter((c, i, arr) => arr.indexOf(c) !== i);
  assert.deepEqual(duplicadas, []);
});

test('soma dos 7 temas + Relatos = total publicado (cada artigo conta uma vez)', () => {
  const publicados = [];
  CATEGORIAS.forEach((categoria, i) => {
    for (let n = 0; n < i % 3 + 1; n++) publicados.push({ categoria, tema: '' });
  });
  const contagem = Object.fromEntries(TEMAS.map((t) => [t.slug, 0]));
  let relatos = 0;
  for (const a of publicados) {
    const t = temaEfetivo(a);
    if (t) contagem[t] += 1;
    else if (a.categoria === RELATOS) relatos += 1;
  }
  const somaTemas = Object.values(contagem).reduce((s, n) => s + n, 0);
  assert.equal(somaTemas + relatos, publicados.length);
});

test('ponte órfã provisória: artigos de categoria órfã entram num tema, não só em Todos', () => {
  assert.equal(temaEfetivo({ categoria: 'Médicos & Enfermeiros', tema: '' }), 'cuidar-de-quem-cuida');
  assert.equal(temaEfetivo({ categoria: 'Geral', tema: '' }), 'sociedade-cultura');
  assert.equal(temaEfetivo({ categoria: RELATOS, tema: '' }), '');
  assert.equal(temaEfetivo({ categoria: 'Geral', tema: 'transtornos-mentais' }), 'transtornos-mentais');
});

test('indicador de rolagem: classes de degradê ligadas por JS e definidas no CSS', () => {
  assert.ok(blog.includes('.filtros--temas.filtros--mais-direita {'));
  assert.ok(blog.includes('.filtros--temas.filtros--mais-esquerda {'));
  assert.ok(blogJs.includes("classList.toggle('filtros--mais-direita'"));
  assert.ok(blogJs.includes("classList.toggle('filtros--mais-esquerda'"));
});

test('scripts de temas gravam relatórios e backups só em relatorios/logs (ignorado pelo Git)', () => {
  const lev = ler('backend/scripts/portal/levantamentoTemas.js');
  const rec = ler('backend/scripts/portal/reclassificarTemas.js');
  assert.ok(lev.includes("path.join(RAIZ, 'relatorios', 'logs')"));
  assert.ok(rec.includes("path.join(RAIZ, 'relatorios', 'logs', 'backups-temas')"));
  assert.equal(/writeFileSync\(path\.join\(RAIZ, 'relatorios', '[^l]/.test(lev), false);
});

test('páginas de tema não exibem aviso de aprovação pendente', () => {
  const pilares = fs.readdirSync(path.join(RAIZ, 'public', 'pilares')).filter((f) => f.endsWith('.html'));
  assert.equal(pilares.length, 7);
  for (const f of pilares) {
    assert.equal(ler(path.join('public', 'pilares', f)).includes('Introdução em aprovação'), false, f);
  }
  assert.equal(ler('scripts/plano-diretor/gerarPaginasPilar.js').includes('Introdução em aprovação'), false);
});

// ---------------------------------------------------------------- Blog
test('topo do Blog: etiqueta, título e texto exatos; sem "consultório"', () => {
  assert.ok(blog.includes('<p class="etiqueta">ARTIGOS</p>'));
  assert.ok(blog.includes('<h1 style="font-size:clamp(2rem,4.6vw,3.1rem);">Saúde mental em cada fase da vida, explicada com clareza e empatia</h1>'));
  assert.ok(semEspacos(blog).includes('Artigos com referências científicas e narração em áudio, organizados nos mesmos temas do Portal. Nos temas, psicoeducação e cuidados para o dia a dia. Em Transtornos Mentais, conceito, diagnóstico e conduta. E nos Relatos da Prática, artigos literários que mostram o lado humano do cuidado, com identidades protegidas.'));
  for (const [nome, texto] of [['blog.html', blog], ['blog.js', blogJs], ['renderizarBlog.js', ler('backend/lib/renderizarBlog.js')]]) {
    assert.equal(/consult[óo]rio/i.test(texto), false, `"consultório" em ${nome}`);
  }
});

test('filtros do Blog: Todos com data-tema e aria-pressed; linha única com rolagem no celular', () => {
  assert.ok(blog.includes('data-tema="" aria-pressed="true">Todos</button>'));
  assert.ok(blog.includes('filtros--temas'));
  assert.ok(blog.includes('.filtros--temas { flex-wrap: nowrap; overflow-x: auto;'));
  assert.ok(blog.includes('.filtros--temas .filtro { white-space: nowrap;'));
  assert.ok(blogJs.includes("'/artigos/temas'"));
  assert.ok(blogJs.includes('aria-pressed'));
  assert.ok(blogJs.includes("data-formato=\"relatos\""));
  assert.equal(/data-categoria/.test(blogJs), false, 'filtro antigo por categoria removido do JS');
});

test('SSR do Blog: 7 temas com nome curto visível e completo em title/aria-label, divisor e Relatos fora dos temas', () => {
  const filtros = {
    temas: TEMAS.map((t, i) => ({ slug: t.slug, nome: t.nome, curto: t.curto, total: i })),
    relatos: { nome: RELATOS, total: 9 },
  };
  const html = renderizarBlogHtml({ itens: [], paginacao: { pagina: 1, paginas: 1, total: 0 }, tema: 'transtornos-mentais', formato: '', busca: '', filtros });
  for (const t of TEMAS) {
    assert.ok(html.includes(`data-tema="${t.slug}" title="${t.nome.replace(/&/g, '&amp;')}" aria-label="${t.nome.replace(/&/g, '&amp;')}"`), t.slug);
  }
  assert.ok(html.includes('data-tema="transtornos-mentais" title="Transtornos Mentais" aria-label="Transtornos Mentais" aria-pressed="true"'));
  assert.ok(html.includes('<span class="filtros__divisor" aria-hidden="true"></span>'));
  assert.ok(html.includes('data-formato="relatos"'));
  assert.ok(html.includes('aria-pressed="false">Relatos da Prática'));
  assert.equal(html.includes('data-tema="" aria-pressed="true">Todos'), false, 'Todos não fica ativo com tema escolhido');
});

test('SSR com formato=relatos ativa Relatos e não ativa tema', () => {
  const filtros = { temas: TEMAS.map((t) => ({ ...t, total: 0 })), relatos: { nome: RELATOS, total: 2 } };
  const html = renderizarBlogHtml({ itens: [], paginacao: { pagina: 1, paginas: 1, total: 0 }, tema: '', formato: 'relatos', busca: '', filtros });
  assert.ok(html.includes('data-formato="relatos" title="Relatos da Prática" aria-label="Relatos da Prática" aria-pressed="true"'));
  assert.equal(/data-tema="[a-z-]+" title="[^"]*" aria-label="[^"]*" aria-pressed="true"/.test(html), false);
});

// ---------------------------------------------------------------- Consulta (API)
test('normalizarQuery: formato=relatos vira categoria Relatos; tema vira filtro sem Relatos', () => {
  assert.equal(normalizarQuery({ formato: 'relatos' }).filtro.categoria, RELATOS);
  const porTema = normalizarQuery({ tema: 'maternidade-perinatal' });
  assert.equal(porTema.tema, 'maternidade-perinatal');
  assert.ok(porTema.filtro.$and.some((c) => c.categoria && c.categoria.$ne === RELATOS));
  assert.equal(normalizarQuery({ tema: 'inexistente' }).tema, '');
  assert.equal(normalizarQuery({ tema: 'transtornos-mentais', formato: 'relatos' }).tema, '');
});

test('filtroDoTema: tema próprio OU categoria-ponte quando o tema estiver vazio', () => {
  const f = filtroDoTema('habitos-sono');
  assert.deepEqual(f.$or[0], { tema: 'habitos-sono' });
  assert.deepEqual(f.$or[1].$and[1], { categoria: { $in: categoriasDoTema('habitos-sono') } });
});

// ---------------------------------------------------------------- Relatos da Prática
test('nota de ficção exibida é exatamente o texto aprovado, sem citação', () => {
  const aprovado = 'Relato literário inspirado na prática clínica. Personagens, nomes, lugares e detalhes foram criados para proteger a identidade das pessoas. Qualquer semelhança é coincidência.';
  assert.equal(NOTA_FICCAO_TEXTO, aprovado);
  assert.equal(NOTA_FICCAO, aprovado);
  assert.equal(NOTA_FICCAO.includes('Código de Ética'), false);
  assert.equal(RELATOS_FRASE, 'Artigos literários inspirados na prática clínica, com identidades protegidas, que mostram o lado humano do cuidado.');
});

test('checarRelato: aprova relato com nota; reprova sem nota, com referências, sem caixa, sem CVV e "cometeu"', () => {
  assert.deepEqual(checarRelato(`Era uma vez.\n\n${NOTA_FICCAO}`), []);
  assert.deepEqual(checarRelato('Era uma vez.'), ['nota-ficcao-ausente']);
  assert.ok(checarRelato(`${NOTA_FICCAO}\n\n## Referências\n1. Algo`).includes('lista-de-referencias-na-narrativa'));
  assert.ok(checarRelato(`${NOTA_FICCAO}\n\nO diagnóstico veio tarde.`).includes('informacao-clinica-sem-caixa-para-entender'));
  assert.deepEqual(checarRelato(`${NOTA_FICCAO}\n\nO diagnóstico veio tarde.\n\nPara entender: [1].`).includes('informacao-clinica-sem-caixa-para-entender'), false);
  assert.ok(checarRelato(`${NOTA_FICCAO}\n\nFalou em suicídio.`).includes('suicidio-sem-CVV-SAMU'));
  assert.deepEqual(checarRelato(`${NOTA_FICCAO}\n\nFalou em suicídio. CVV 188 · SAMU 192.`), []);
  assert.ok(checarRelato(`${NOTA_FICCAO}\n\nEla cometeu suicídio.`).includes('linguagem-cometeu-suicidio'));
});

// ---------------------------------------------------------------- Regra editorial no CLAUDE.md
test('regra editorial e de Relatos registradas no CLAUDE.md', () => {
  assert.ok(claudeMd.includes('"Transtornos Mentais" = conceito, diagnóstico e conduta'));
  assert.ok(claudeMd.includes('Links cruzados'));
  assert.ok(claudeMd.includes('Relatos da Prática:** (a) sem lista de referências'));
});
