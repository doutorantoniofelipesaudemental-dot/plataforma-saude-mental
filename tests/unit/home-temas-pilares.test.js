// Cada cartão de "Temas do Portal" aponta para a página-pilar do seu eixo (ordem de 03/11/2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'index.html'), 'utf8');
const bloco = html.slice(html.indexOf('id="temas-titulo"'), html.indexOf('id="para-quem-e"') > 0 ? html.indexOf('id="para-quem-e"') : undefined);

test('sete cartões de Temas apontam para /pilares/eixo-1..7', () => {
  const links = [...bloco.matchAll(/href="(\/pilares\/eixo-\d\.html)"/g)].map((m) => m[1]);
  assert.deepEqual(links, [1, 2, 3, 4, 5, 6, 7].map((n) => `/pilares/eixo-${n}.html`));
});
test('nenhum cartão de Temas aponta para /blog', () => {
  assert.equal(/href="\/blog"/.test(bloco.slice(0, bloco.indexOf('</section>') > 0 ? bloco.indexOf('</section>') : bloco.length)), false);
});
