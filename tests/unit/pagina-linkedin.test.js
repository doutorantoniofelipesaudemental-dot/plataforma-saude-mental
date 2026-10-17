// Página /linkedin (landing para profissionais de saúde, gestores e RH): identificação única, contato só por e-mail, sem mensageria,
// CVV/SAMU, sem promessa, rota, sitemap, links no rodapé e na /links, imagem OG 1200x627 e a variável única do perfil do LinkedIn.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { gerarSitemapPaginasXml } = require('../../backend/lib/sitemap');
const { marca } = require('../../backend/lib/marca');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const html = ler('public/linkedin.html');
const conta = (t, s) => t.split(s).length - 1;

test('identificação de 5 linhas uma vez (rodapé), crédito do Portal e aviso de IA', () => {
  for (const l of IDENTIFICACAO_COMPLETA.split('\n')) assert.equal(conta(html, l), 1, l);
  assert.equal(conta(html, 'CRM-BA 41322'), 1);
  assert.equal(conta(html, 'NÃO ESPECIALISTA'), 1);
  assert.match(html, /Portal de Saúde Mental Doutor Antônio Felipe Garabito/);
  assert.match(html, /Resolução CFM 2\.454\/2026/);
});

test('contato só por e-mail, aviso de não enviar saúde, sem mensageria/formulário/chatbot, sem promessa nem "psiquiatra" como título do autor', () => {
  assert.doesNotMatch(html, /wa\.me|whatsapp|<form|<input|<textarea|chatbot/i);
  assert.match(html, /mailto:doutor\.antoniofelipe\.saudemental@gmail\.com/);
  assert.match(html, /Não envie informações de saúde por e-mail/);
  assert.doesNotMatch(html, /Antonio Felipe/);
  assert.doesNotMatch(html, /Dr\. Antônio Felipe[^.\n]{0,80}psiquiatra|#psiquiatria/);
  assert.doesNotMatch(html, /depoimento|antes e depois|garantid|100%|cura|promoção|desconto/i);
  assert.match(html, /CVV 188/); assert.match(html, /SAMU 192/);
  assert.match(html, /não há promessa de resultado/i);
});

test('SEO e compartilhamento: canonical no www, Open Graph 1200x627 e imagem própria', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.drantoniofelipemedico\.com\.br\/linkedin">/);
  assert.match(html, /og:image" content="https:\/\/www\.drantoniofelipemedico\.com\.br\/assets\/img\/og-linkedin\.png"/);
  assert.match(html, /og:image:width" content="1200"/); assert.match(html, /og:image:height" content="627"/);
  const png = fs.readFileSync(path.join(RAIZ, 'public/assets/img/og-linkedin.png'));
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 627);
  assert.match(html, /<html lang="pt-BR">/); assert.match(html, /name="viewport"/); assert.match(html, /name="description"/);
});

test('artigos do seletor existem e os links apontam para a /mentoria', () => {
  const slugs = [...html.matchAll(/href="\/artigo\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.ok(slugs.length >= 6 && slugs.length <= 9, `de 6 a 9 artigos (tem ${slugs.length})`);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.match(html, /href="\/mentoria"/);
});

test('rota, sitemap e links no rodapé e na /links', () => {
  assert.match(ler('vercel.json'), /"\/linkedin\/\?"[\s\S]{0,40}public\/linkedin\.html/);
  assert.match(ler('backend/index.js'), /app\.get\('\/linkedin'/);
  assert.match(gerarSitemapPaginasXml(), /\/linkedin<\/loc>/);
  for (const f of ['index.html', 'blog.html', 'artigo.html', 'instagram.html', 'mentoria.html', 'privacidade.html', 'links.html']) assert.match(ler(`public/${f}`), /href="\/linkedin"/, f);
});

test('variável única do perfil do LinkedIn: landing e /links mostram o link; rodapé, /mentoria e YouTube só quando for personalizado', () => {
  const m = marca();
  assert.ok(/^https:\/\/www\.linkedin\.com\/in\//.test(m.LINKEDIN_PERFIL_URL));
  // todas as páginas com marcador estão iguais à variável (rode `npm run marca:aplicar` ao trocar o link)
  for (const f of fs.readdirSync(path.join(RAIZ, 'public')).filter((x) => x.endsWith('.html'))) {
    for (const tag of ler(`public/${f}`).match(/<a\b[^>]*data-linkedin-perfil="[^"]*"[^>]*>/g) || []) assert.ok(tag.includes(`href="${m.LINKEDIN_PERFIL_URL}"`), `${f}: ${tag.slice(0, 80)}`);
  }
  assert.match(html, /data-linkedin-perfil="indispensavel"/);
  assert.match(ler('public/links.html'), /data-linkedin-perfil="indispensavel"/);
  for (const f of ['index.html', 'mentoria.html']) {
    const s = ler(`public/${f}`);
    assert.match(s, /<(li|span)[^>]*data-linkedin-perfil-item/);
    if (!m.LINKEDIN_PERFIL_LIMPO) assert.match(s, /<(li|span) hidden[^>]*data-linkedin-perfil-item/, `${f}: item opcional deve estar oculto enquanto o link tiver "undefined"`);
  }
  const lib = require('../../scripts/youtube/lib');
  const a = { slug: 'x', titulo: 'T', resumo: 'R', conteudo: '' };
  assert.equal(lib.descricaoShort(a).includes('LinkedIn:'), m.LINKEDIN_PERFIL_LIMPO);
});
