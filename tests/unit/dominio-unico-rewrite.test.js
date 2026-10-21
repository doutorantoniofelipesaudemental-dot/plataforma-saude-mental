const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Etapa 1 do domínio único (ordem de 21/10/2026): rewrites SÓ para os textos que o www ainda não serve.
const RAIZ = path.resolve(__dirname, '../..');
const STEEL = 'https://plataforma-saude-mental-steel.vercel.app';

function slugsForaDoDominioPrincipal() {
  const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
  const lista = new Set(JSON.parse(ler('apps/plataforma-saude-mental/app/slugsDominioPrincipal.js').match(/new Set\((\[[\s\S]*?\])\)/)[1].replace(/'/g, '"')));
  const pastas = [['apps/plataforma-saude-mental/src/content/artigos', 'artigo'], ['apps/plataforma-saude-mental/content/blog', 'blog']];
  const saida = [];
  for (const [dir, tipo] of pastas) {
    for (const f of fs.readdirSync(path.join(RAIZ, dir)).filter((n) => /\.mdx?$/.test(n))) {
      const slug = f.replace(/\.mdx?$/, '');
      if (!lista.has(slug)) saida.push({ tipo, slug });
    }
  }
  return saida;
}

const rotas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8')).routes;
const rotaDoAssets = rotas.find((r) => r.src === '^/_next/(.*)$');
const rotaArtigo = rotas.find((r) => r.dest === `${STEEL}/artigos/$1`);
const rotaBlog = rotas.find((r) => r.dest === `${STEEL}/blog/$1`);

test('os 24 textos fora do domínio principal estão cobertos pelos rewrites (12 artigos + 12 blog)', () => {
  const textos = slugsForaDoDominioPrincipal();
  assert.equal(textos.length, 24);
  for (const { tipo, slug } of textos) {
    const caminho = tipo === 'artigo' ? `/artigo/${slug}` : `/blog/${slug}`;
    const rota = tipo === 'artigo' ? rotaArtigo : rotaBlog;
    assert.ok(rota, `sem rota para ${tipo}`);
    assert.match(caminho, new RegExp(rota.src), `não casa: ${caminho}`);
  }
});

test('os rewrites não casam com textos que já estão no domínio principal nem com caminhos inventados', () => {
  const fs2 = fs.readFileSync(path.join(RAIZ, 'apps/plataforma-saude-mental/app/slugsDominioPrincipal.js'), 'utf8');
  const noPrincipal = JSON.parse(fs2.match(/new Set\((\[[\s\S]*?\])\)/)[1].replace(/'/g, '"'));
  const primeiro = noPrincipal[0];
  assert.doesNotMatch(`/artigo/${primeiro}`, new RegExp(rotaArtigo.src), 'texto do domínio principal não pode ser reescrito');
  assert.doesNotMatch('/artigo/nao-existe-no-site', new RegExp(rotaArtigo.src));
  assert.doesNotMatch('/artigo/', new RegExp(rotaArtigo.src));
  assert.doesNotMatch('/blog/nao-existe-no-site', new RegExp(rotaBlog.src));
});

test('o proxy dos assets do app antigo é só para /_next/ (o www não tem essa pasta)', () => {
  assert.ok(rotaDoAssets, 'falta a rota de /_next/');
  assert.equal(rotaDoAssets.dest, `${STEEL}/_next/$1`);
  assert.equal(fs.existsSync(path.join(RAIZ, 'public', '_next')), false, 'public/_next não pode existir (conflito)');
  assert.match('/_next/static/chunks/a.js', new RegExp(rotaDoAssets.src));
  assert.doesNotMatch('/artigos/x', new RegExp(rotaDoAssets.src));
});

test('as rotas novas vêm antes do catch-all do Express para /artigo/ e /blog/', () => {
  const idxArtigoExpress = rotas.findIndex((r) => r.src === '/artigo/[^/]+/?');
  const idxArtigo = rotas.indexOf(rotaArtigo);
  assert.ok(idxArtigo >= 0 && idxArtigoExpress >= 0);
  assert.ok(idxArtigo < idxArtigoExpress, 'o rewrite precisa vir antes do Express');
});
