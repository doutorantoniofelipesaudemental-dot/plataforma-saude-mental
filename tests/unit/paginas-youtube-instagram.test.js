// Landings /youtube (canal) e /instagram (bio): identificação única, contato só por e-mail, CVV/SAMU, sem promessa, sem player/cookies de terceiros,
// Open Graph 1200x630, canonical no www, rota, sitemap, links no rodapé e na /links, e lista de links oficiais do conferidor do YouTube.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { gerarSitemapPaginasXml } = require('../../backend/lib/sitemap');
const { marca } = require('../../backend/lib/marca');
const lib = require('../../scripts/youtube/lib');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const conta = (t, s) => t.split(s).length - 1;
const PAGINAS = { youtube: ler('public/youtube.html'), instagram: ler('public/instagram.html') };

for (const [nome, html] of Object.entries(PAGINAS)) {
  test(`/${nome}: identificação de 5 linhas uma vez, crédito do Portal e aviso de IA`, () => {
    for (const l of IDENTIFICACAO_COMPLETA.split('\n')) assert.equal(conta(html, l), 1, l);
    assert.equal(conta(html, 'CRM-BA 41322'), 1);
    assert.equal(conta(html, 'NÃO ESPECIALISTA'), 1);
    assert.match(html, /Portal de Saúde Mental Doutor Antônio Felipe Garabito/);
    assert.match(html, /Resolução CFM 2\.454\/2026/);
  });

  test(`/${nome}: e-mail como único contato, CVV/SAMU, sem promessa, sem "psiquiatra" como título e sem terceiros embutidos`, () => {
    assert.doesNotMatch(html, /wa\.me|whatsapp|<form|<input|<textarea|chatbot/i);
    assert.doesNotMatch(html, /<iframe|youtube-nocookie|connect\.facebook|instagram\.com\/embed|embed\.js|platform\.instagram/i);
    assert.doesNotMatch(html, /Antonio Felipe/);
    assert.doesNotMatch(html, /Dr\. Antônio Felipe[^.\n]{0,80}psiquiatra|#psiquiatria/);
    assert.doesNotMatch(html, /depoimento|antes e depois|garantid|100%|\bcura\b|promoção|desconto/i);
    assert.match(html, /CVV 188/); assert.match(html, /SAMU 192/);
    assert.match(html, /não há promessa de resultado/i);
    assert.match(html, /não substitui consulta/i);
  });

  test(`/${nome}: canonical no www, Open Graph 1200x630 com imagem própria, idioma e viewport`, () => {
    assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.drantoniofelipemedico\\.com\\.br/${nome}">`));
    assert.match(html, new RegExp(`og:image" content="https://www\\.drantoniofelipemedico\\.com\\.br/assets/img/og-${nome}\\.png"`));
    assert.match(html, /og:image:width" content="1200"/); assert.match(html, /og:image:height" content="630"/);
    const png = fs.readFileSync(path.join(RAIZ, `public/assets/img/og-${nome}.png`));
    assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
    assert.match(html, /<html lang="pt-BR">/); assert.match(html, /name="viewport"/); assert.match(html, /name="description"/);
  });
}

test('/youtube: botão do canal usa YOUTUBE_CANAL_URL e as playlists são as do canal', () => {
  const m = marca();
  assert.match(m.YOUTUBE_CANAL_URL, /^https:\/\/www\.youtube\.com\/channel\/UC[\w-]{22}$/);
  assert.ok(PAGINAS.youtube.includes(`data-youtube-canal href="${m.YOUTUBE_CANAL_URL}"`));
  for (const p of lib.PLAYLISTS) assert.ok(PAGINAS.youtube.includes(`<h3>${p}</h3>`), p);
  assert.match(PAGINAS.youtube, /mailto:doutor\.antoniofelipe\.saudemental@gmail\.com/);
});

test('artigos citados nas landings têm link no formato /artigo/<slug> e sem repetição por página', () => {
  for (const [nome, html] of Object.entries(PAGINAS)) {
    const slugs = [...html.matchAll(/href="\/artigo\/([a-z0-9-]+)"/g)].map((x) => x[1]);
    assert.ok(slugs.length >= 5, `${nome}: poucos artigos`);
    assert.equal(new Set(slugs).size, slugs.length, `${nome}: repetido`);
  }
});

test('/instagram: link para /mentoria, /youtube e /linkedin; mantém a lista dos posts', () => {
  for (const r of ['/mentoria', '/youtube', '/linkedin']) assert.match(PAGINAS.instagram, new RegExp(`href="${r}"`));
  assert.match(PAGINAS.instagram, /id="lista-instagram"/);
  assert.match(PAGINAS.instagram, /https:\/\/instagram\.com\/doutor\.antoniofelipe\.smental/);
});

test('rota, sitemap e links no rodapé e na /links', () => {
  assert.match(ler('vercel.json'), /"\/youtube\/\?"[\s\S]{0,40}public\/youtube\.html/);
  assert.match(ler('backend/index.js'), /app\.get\('\/youtube'/);
  const sm = gerarSitemapPaginasXml();
  assert.match(sm, /\/youtube<\/loc>/); assert.match(sm, /\/instagram<\/loc>/);
  for (const f of ['index.html', 'blog.html', 'artigo.html', 'instagram.html', 'mentoria.html', 'privacidade.html', 'links.html', 'linkedin.html']) assert.match(ler(`public/${f}`), /href="\/youtube"/, f);
  for (const f of ['index.html', 'blog.html', 'artigo.html', 'mentoria.html', 'privacidade.html', 'youtube.html', 'linkedin.html']) assert.match(ler(`public/${f}`), /href="\/instagram"/, f);
  const links = ler('public/links.html');
  assert.ok(links.indexOf('href="/instagram"') < links.indexOf('href="mailto:'), '/instagram em destaque no topo da /links');
  assert.match(links, /instagram\.com\/doutor\.antoniofelipe\.smental/);
});

test('conferidor do YouTube: links oficiais (canal, landings, perfil) aceitos; terceiros e parecidos falsos reprovados', () => {
  const m = marca();
  for (const u of [m.YOUTUBE_CANAL_URL, m.YOUTUBE_LANDING_URL, m.INSTAGRAM_LANDING_URL, m.LINKEDIN_PERFIL_URL, m.LINKEDIN_LANDING_URL]) assert.ok(lib.linkOficialMarca(u), u);
  assert.equal(lib.linkOficialMarca('https://www.youtube.com/channel/UCoutroCanalQualquer00000'), false);
  assert.equal(lib.linkOficialMarca(`${m.YOUTUBE_CANAL_URL}-falso`), false);
  assert.equal(lib.linkOficialMarca('https://exemplo.com'), false);
});

test('descrições do YouTube terminam com o link da /youtube (antes das hashtags nos Shorts)', () => {
  const a = { slug: 'x', titulo: 'T', resumo: 'R', conteudo: '' };
  assert.match(lib.descricaoShort(a), /Canal e playlists: https:\/\/www\.drantoniofelipemedico\.com\.br\/youtube\n#saudemental/);
});
