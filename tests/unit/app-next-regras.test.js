// App Next: mesmas regras do site principal (contato só por e-mail, sem mensageiros, sem coleta, CVV/SAMU, privacidade).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const APP = path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental');
const ler = (rel) => fs.readFileSync(path.join(APP, rel), 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === 'node_modules' || e.name === '.next' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : /\.(jsx?|mdx)$/.test(e.name) ? [path.join(d, e.name)] : []));

test('sem mensageiros de terceiros, formulários que enviam dados, chatbot nem requisições de envio', () => {
  for (const f of [...walk(path.join(APP, 'app')), ...walk(path.join(APP, 'src')), ...walk(path.join(APP, 'content'))]) {
    if (f.endsWith('slugsDominioPrincipal.js')) continue;
    const t = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /wa\.me|whatsapp|t\.me\/|telegram|chatbot|<form\b|sendBeacon|XMLHttpRequest|\bfetch\(/i, path.relative(APP, f));
  }
});

test('rodapé geral com CVV/SAMU e e-mail; página de privacidade com LGPD e canonical para o www', () => {
  const r = ler('app/RodapeGeral.jsx');
  assert.match(r, /188/); assert.match(r, /192/); assert.match(r, /mailto:doutor\.antoniofelipe\.saudemental@gmail\.com/);
  assert.match(ler('app/layout.js'), /<RodapeGeral \/>/);
  const p = ler('app/privacidade/page.js');
  assert.match(p, /13\.709\/2018/); assert.match(p, /canonical: 'https:\/\/www\.drantoniofelipemedico\.com\.br\/privacidade'/);
});

test('componentes MDX que recebem children não usam <p> como invólucro (p dentro de p quebra a hidratação)', () => {
  const t = ler('mdx-components.js');
  assert.doesNotMatch(t, /<p[^>]*>\s*\{children\s*(\|\||\})/);
  assert.match(t, /function Lead[\s\S]{0,120}<div/);
});

test('páginas de texto do Next têm landmark main', () => {
  for (const f of ['app/artigos/[slug]/page.js', 'app/blog/[slug]/page.js']) assert.match(ler(f), /<main className="flex-1">/);
});
