// "Onde me acompanhar" (home do app): Spotify e Facebook só aparecem com URL válida; Instagram é o perfil oficial.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { itensOndeMeAcompanhar, INSTAGRAM_OFICIAL } = require('../../apps/plataforma-saude-mental/app/ondeMeAcompanharModelo');
const { marca } = require('../../backend/lib/marca');

const BASE = { YOUTUBE_CANAL_URL: 'https://www.youtube.com/channel/UCFToj3Wg77mhK_0MJSpBr-w', LINKEDIN_HREF: 'https://www.linkedin.com/in/doutor-ant%C3%B4nio-felipe-70990b438', SPOTIFY_SHOW_URL: '', FACEBOOK_URL: '' };
const ids = (cfg) => itensOndeMeAcompanhar(cfg).map((i) => i.id);

test('sem Spotify e sem Facebook (padrão): aparecem só Instagram, YouTube e LinkedIn', () => {
  assert.deepStrictEqual(ids(BASE), ['instagram', 'youtube', 'linkedin']);
});

test('Instagram é sempre o perfil oficial', () => {
  const ig = itensOndeMeAcompanhar(BASE)[0];
  assert.equal(ig.href, 'https://instagram.com/doutor.antoniofelipe.smental');
  assert.equal(INSTAGRAM_OFICIAL, ig.href);
});

test('Facebook aparece só com URL válida do domínio facebook.com', () => {
  assert.ok(ids({ ...BASE, FACEBOOK_URL: 'https://www.facebook.com/doutorantoniofelipe' }).includes('facebook'));
  assert.ok(ids({ ...BASE, FACEBOOK_URL: 'https://facebook.com/doutorantoniofelipe' }).includes('facebook'));
  assert.ok(!ids({ ...BASE, FACEBOOK_URL: 'http://facebook.com/x' }).includes('facebook'), 'sem https não aparece');
  assert.ok(!ids({ ...BASE, FACEBOOK_URL: 'https://exemplo.com/facebook' }).includes('facebook'), 'domínio errado não aparece');
  assert.ok(!ids({ ...BASE, FACEBOOK_URL: 'https://www.facebook.com/x" onmouseover="y' }).includes('facebook'), 'aspas não passam');
});

test('Spotify aparece só com open.spotify.com', () => {
  assert.ok(ids({ ...BASE, SPOTIFY_SHOW_URL: 'https://open.spotify.com/show/abc123' }).includes('spotify'));
  assert.ok(!ids({ ...BASE, SPOTIFY_SHOW_URL: 'https://exemplo.com/show' }).includes('spotify'));
});

test('YouTube e LinkedIn com domínio errado não aparecem', () => {
  assert.ok(!ids({ ...BASE, YOUTUBE_CANAL_URL: 'https://evil.com/youtube.com' }).includes('youtube'));
  assert.ok(!ids({ ...BASE, LINKEDIN_HREF: 'javascript:alert(1)' }).includes('linkedin'));
});

test('config/marca.json: FACEBOOK_URL existe e vem vazio por padrão', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'marca.json'), 'utf8'));
  assert.equal(raw.FACEBOOK_URL, '');
  assert.equal(marca({}).FACEBOOK_URL, '');
});

test('componente: nova aba com rel noopener, nome acessível e alvo de 44 px; sem mensageria de terceiros', () => {
  const jsx = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental', 'app', 'OndeMeAcompanhar.jsx'), 'utf8');
  assert.ok(jsx.includes('rel="noopener noreferrer"'));
  assert.ok(jsx.includes('target="_blank"'));
  assert.ok(jsx.includes('aria-label={i.ariaLabel}'));
  assert.ok(jsx.includes('min-h-11'));
  assert.ok(!/wa\.me|whatsapp|api\.whatsapp|t\.me|telegram/i.test(jsx), 'sem mensageria');
  assert.ok(!/agendar|consulta particular/i.test(jsx), 'sem oferta de consulta');
});

test('nome de cada item traz "abre em nova aba" para leitor de tela', () => {
  for (const i of itensOndeMeAcompanhar({ ...BASE, FACEBOOK_URL: 'https://www.facebook.com/x' })) {
    assert.match(i.ariaLabel, /abre em nova aba$/);
  }
});
