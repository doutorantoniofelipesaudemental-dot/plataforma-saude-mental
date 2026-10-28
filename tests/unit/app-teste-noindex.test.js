const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const layout = fs.readFileSync(path.join(__dirname, '../../apps/plataforma-saude-mental/app/layout.js'), 'utf8');

test('app de teste do Next declara noindex nos metadados raiz (Opção A)', () => {
  assert.match(layout, /robots:\s*\{\s*index:\s*false/);
  assert.match(layout, /googleBot:\s*\{\s*index:\s*false/);
});
