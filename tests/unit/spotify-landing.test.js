// Spotify na landing (public/linkedin.html) e na home do app Next: sem SPOTIFY_SHOW_URL válida nada aparece; com URL, o link aparece.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { aplicar } = require('../../scripts/aplicarMarca');
const { marca } = require('../../backend/lib/marca');
const { propsSpotify } = require('../../apps/plataforma-saude-mental/app/spotifyLinkModelo');

function contraste(a, b) {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test('modelo do Next: URL vazia não produz props (nada renderiza); URL válida produz props', () => {
  assert.equal(propsSpotify(''), null);
  assert.equal(propsSpotify('https://exemplo.com/x'), null);
  const p = propsSpotify(URL_OK);
  assert.equal(p.href, URL_OK);
  assert.equal(p.rotulo, 'Ouça no Spotify');
  assert.match(p.ariaLabel, /abre em nova aba/);
});

test('arquivo gerado para o Next acompanha config/marca.json (fonte única)', () => {
  const gerado = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental', 'app', 'spotifyShow.generated.js'), 'utf8');
  assert.ok(gerado.includes(`SPOTIFY_SHOW_URL: ${JSON.stringify(marca({}).SPOTIFY_SHOW_URL)}`));
});

test('contraste ≥ 4,5:1 nos pares usados (texto sobre fundo)', () => {
  assert.ok(contraste('#ffffff', '#0d3330') >= 4.5, 'landing: link branco sobre verde-escuro');
  assert.ok(contraste('#e3ece9', '#0d3330') >= 4.5, 'landing: texto legal sobre verde-escuro');
  assert.ok(contraste('#0d3330', '#ffffff') >= 4.5, 'home: link verde-escuro sobre branco');
  assert.ok(contraste('#45564f', '#ffffff') >= 4.5, 'rodapé: texto tinta-media sobre branco');
});

const PAGINA = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'linkedin.html'), 'utf8');
const URL_OK = 'https://open.spotify.com/show/abc123';

function ancora(html) {
  const m = html.match(/<a\b[^>]*\bdata-spotify-show\b[^>]*>/);
  return m ? m[0] : null;
}

test('com URL vazia: o link do Spotify fica oculto e sem href', () => {
  const tag = ancora(aplicar(PAGINA, { SPOTIFY_SHOW_URL: '' }));
  assert.ok(tag, 'a âncora data-spotify-show deve existir');
  assert.match(tag, /\shidden[\s>]/);
  assert.doesNotMatch(tag, /\shref=/);
});

test('com URL válida: o link aparece com o href da URL', () => {
  const tag = ancora(aplicar(PAGINA, { SPOTIFY_SHOW_URL: URL_OK }));
  assert.ok(tag);
  assert.doesNotMatch(tag, /\shidden[\s>]/);
  assert.match(tag, new RegExp(`href="${URL_OK.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"`));
});

test('a âncora tem aria-label e rel/target seguros', () => {
  const tag = ancora(PAGINA);
  assert.match(tag, /aria-label="Ouça no Spotify/);
  assert.match(tag, /target="_blank"/);
  assert.match(tag, /rel="noopener noreferrer"/);
});

test('aplicar é idempotente: aplicar duas vezes dá o mesmo resultado', () => {
  const m = { SPOTIFY_SHOW_URL: URL_OK };
  const uma = aplicar(PAGINA, m);
  assert.equal(aplicar(uma, m), uma);
});

test('marca(): URL vazia por padrão e URL fora de open.spotify.com é descartada', () => {
  assert.equal(marca({}).SPOTIFY_SHOW_URL, '');
  assert.equal(marca({ SPOTIFY_SHOW_URL: 'https://exemplo.com/x' }).SPOTIFY_SHOW_URL, '');
  assert.equal(marca({ SPOTIFY_SHOW_URL: URL_OK }).SPOTIFY_SHOW_URL, URL_OK);
});
