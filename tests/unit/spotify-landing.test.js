// Spotify na landing (public/linkedin.html): sem SPOTIFY_SHOW_URL válida o link fica oculto e sem href; com URL, recebe o href.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { aplicar } = require('../../scripts/aplicarMarca');
const { marca } = require('../../backend/lib/marca');

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
