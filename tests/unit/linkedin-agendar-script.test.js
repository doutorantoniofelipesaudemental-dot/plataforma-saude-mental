// Gerador do agendamento nativo do LinkedIn: nunca clica em "Publicar", para em erro/limite e só conta sucesso com o aviso "Publicação agendada".
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'linkedin', 'gerarScriptAgendar.js'), 'utf8');

test('o script gerado nunca clica no botão Publicar', () => {
  const cliques = [...src.matchAll(/(\w+)\.click\(\)/g)].map((m) => m[1]);
  assert.ok(cliques.length > 0);
  assert.ok(!cliques.includes('pub'), 'o botão Publicar (pub) só é usado para localizar o relógio');
  assert.match(src, /=== 'Agendar'/);
});

test('para em erro, limite diário ou verificação e exige o aviso de sucesso', () => {
  // a decisão sucesso/limite/bloqueio vive em classificarAviso.js (testada em linkedin-aviso.test.js) e é embutida no script
  const aviso = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'linkedin', 'classificarAviso.js'), 'utf8');
  assert.match(src, /classificarAviso\.toString\(\)/);
  assert.match(aviso, /atingiu o limite/);
  assert.match(aviso, /Publicação agendada/);
  assert.match(src, /r\.estado !== 'sucesso'/);
  assert.match(src, /não vou escrever por cima/);
  assert.match(src, /fase: 'agendar'/);
});

test('não lê nem guarda credenciais, cookies ou tokens', () => {
  const codigo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, /document\.cookie|localStorage|sessionStorage|password|type="password"/i);
});
