// Autoavaliação "Meu Plano de Cuidado": PHQ-9 + GAD-7 com fontes visíveis, aviso de não-diagnóstico, CVV/SAMU no item 9, nada enviado ou gravado.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(RAIZ, 'public', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(RAIZ, 'public', 'assets', 'js', 'extras.js'), 'utf8');
const plano = js.slice(js.lastIndexOf('Meu Plano de Cuidado'));

test('9 itens do PHQ-9 e 7 do GAD-7, cada um em fieldset com legenda e 4 opções', () => {
  assert.equal((html.match(/name="phq\d"/g) || []).length, 9 * 4);
  assert.equal((html.match(/name="gad\d"/g) || []).length, 7 * 4);
  assert.match(html, /name="phq9"/);
});

test('fontes validadas visíveis, aviso "não é diagnóstico" e CVV 188 · SAMU 192 em destaque', () => {
  for (const doi of ['10.1046/j.1525-1497.2001.016009606.x', '10.1590/s0102-311x2013001200006', '10.1001/archinte.166.10.1092', '10.9788/tp2016.1-25']) assert.ok(html.includes(doi), doi);
  assert.match(html, /Não é diagnóstico e não substitui consulta/);
  assert.match(html, /plano__aviso[\s\S]{0,700}CVV 188[\s\S]{0,60}SAMU 192/);
});

test('item 9 positivo mostra CVV 188 / SAMU 192; nada é enviado, guardado ou registrado', () => {
  assert.match(plano, /phq9[\s\S]{0,300}Number\(item9\.value\) > 0/);
  assert.match(plano, /CVV 188[\s\S]{0,200}SAMU 192/);
  assert.doesNotMatch(plano, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|gtag|dataLayer/);
});

test('resultado em linguagem acolhedora ("sugerem sintomas"), crise antes da pontuação, período e botão de limpar', () => {
  assert.doesNotMatch(plano, /você tem (depress|ansiedade)/i);
  assert.match(plano, /suas respostas sugerem sintomas/);
  assert.ok(plano.indexOf('plano__crise') < plano.indexOf('Seu resultado'), 'caixa de crise antes da pontuação');
  assert.match(plano, /cvv\.org\.br/);
  assert.match(plano, /UPA[\s\S]{0,60}pronto-socorro[\s\S]{0,60}CAPS/);
  assert.match(html, /Nas últimas 2 semanas/);
  assert.match(html, /id="plano-limpar"/);
});
