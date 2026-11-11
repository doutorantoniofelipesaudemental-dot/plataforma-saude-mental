// Testes do sistema de design (ordem de 10/11/2026, A1–A2): tokens em dia, valores da arte inalterados,
// contraste WCAG AA dos pares declarados e tokens do site iguais ao :root de public/assets/css/style.css.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../..');
const { extrair } = require('../../scripts/design/gerarTokens');
const { TOKENS } = require('../../backend/lib/redesV2/tokens');
const { PALETA, AVISO_CURTO } = require('../../backend/lib/redesV2/arteEditorial');

const lerRaiz = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

function lum(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('tokens.json está em dia com DESIGN.md (seção 9)', () => {
  const gerado = extrair(lerRaiz('docs/DESIGN.md'));
  assert.deepEqual(TOKENS, gerado);
  assert.equal(lerRaiz('docs/tokens.json'), JSON.stringify(gerado, null, 2) + '\n');
});

test('arte: cores e limites iguais aos valores anteriores à refatoração (visual inalterado)', () => {
  assert.deepEqual(PALETA, ['#F7F1E3', '#ECEEF0', '#DDEFD9', '#CFF1E4', '#FBE0CF']);
  assert.equal(TOKENS.arte.corpo, '#1B1B1B');
  assert.equal(TOKENS.arte.rodape, '#1B1B1B');
  assert.equal(TOKENS.arte.rodapeTexto, '#FFFFFF');
  assert.equal(TOKENS.arte.rodapeFilete, '#C9A227');
  assert.equal(TOKENS.arte.marcaTexto, '#FFE46B');
  assert.equal(TOKENS.arte.tamanhos.tituloMinPx, 64);
  assert.equal(TOKENS.arte.tamanhos.corpoMinPx, 40);
  assert.equal(TOKENS.arte.palavrasMax, 25);
  assert.equal(AVISO_CURTO, 'Conteúdo educativo com apoio de IA, aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026).');
});

test('contraste WCAG AA: corpo da arte sobre todos os fundos e texto do rodapé', () => {
  for (const f of TOKENS.arte.fundos) assert.ok(contraste(TOKENS.arte.corpo, f) >= 4.5, `corpo sobre ${f}`);
  assert.ok(contraste(TOKENS.arte.rodapeTexto, TOKENS.arte.rodape) >= 4.5, 'rodapé');
});

test('contraste WCAG AA: pares de texto do site', () => {
  const c = TOKENS.site.cores;
  const pares = [['tinta', 'areia-50'], ['tinta', 'papel'], ['tinta-media', 'papel'], ['tinta-media', 'areia-100'], ['tinta-fraca', 'areia-50'], ['tinta-fraca', 'papel'], ['papel', 'verde-700'], ['papel', 'verde-900']];
  // Achados abertos (REVISAO.md): tinta-fraca sobre areia-100 (4,41:1) e verde-100 (4,19:1) reprovam AA.
  // Ficam registrados aqui para não sumirem; a correção no CSS depende de ordem do Dr. (public/ protegido).
  assert.ok(contraste(c['tinta-fraca'], c['areia-100']) < 4.5 && contraste(c['tinta-fraca'], c['verde-100']) < 4.5, 'achado registrado');
  for (const [a, b] of pares) assert.ok(contraste(c[a], c[b]) >= 4.5, `${a} sobre ${b}: ${contraste(c[a], c[b]).toFixed(2)}`);
});

test('site: tokens iguais ao :root de public/assets/css/style.css (sem alterar o CSS)', () => {
  const css = lerRaiz('public/assets/css/style.css');
  for (const [nome, valor] of Object.entries(TOKENS.site.cores)) {
    const re = new RegExp(`--${nome}:\\s*${valor.replace('#', '#')}\\b`, 'i');
    assert.match(css, re, `--${nome} = ${valor}`);
  }
});

test('DESIGN.md: seções obrigatórias e padrões proibidos listados', () => {
  const d = lerRaiz('docs/DESIGN.md');
  for (const titulo of ['## 1. Cores', '## 2. Tipografia', '## 3. Espaçamento', '## 4. Ícones', '## 5. Componentes', '## 6. Regras fixas', '## 7. Acessibilidade', '## 8. Padrões proibidos', '## 9. Bloco de tokens']) assert.ok(d.includes(titulo), titulo);
  for (const p of ['gradiente roxo', 'cérebro', 'fotos geradas por ia', 'promessa de cura', 'visual infantil']) assert.ok(d.toLowerCase().includes(p), p);
});
