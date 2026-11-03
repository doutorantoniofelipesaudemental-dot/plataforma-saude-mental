// Páginas-pilar estáticas (public/pilares/eixo-1..7.html): sem script de terceiros, identificação única, sem mensageria.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '..', '..', 'public', 'pilares');
const ARQUIVOS = [1, 2, 3, 4, 5, 6, 7].map((n) => `eixo-${n}.html`);

test('existem as 7 páginas-pilar', () => {
  for (const f of ARQUIVOS) assert.ok(fs.existsSync(path.join(DIR, f)), `falta ${f}`);
});

test('cada página tem a identificação de 5 linhas exatamente uma vez', () => {
  for (const f of ARQUIVOS) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.equal(html.split('CRM-BA 41322').length - 1, 1, f);
    assert.equal(html.split('RQE 26638').length - 1, 1, f);
    assert.equal(html.split('NÃO ESPECIALISTA').length - 1, 1, f);
    assert.equal(html.split('Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)').length - 1, 1, f);
  }
});

test('sem script de terceiros nem mensageria', () => {
  for (const f of ARQUIVOS) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.equal(/<script\b/i.test(html), false, `${f} tem script`);
    assert.equal(/wa\.me|whatsapp|api\.whatsapp/i.test(html), false, `${f} tem mensageria`);
    assert.equal(/#psiquiatria/i.test(html), false, `${f} tem #psiquiatria`);
  }
});

test('contato só por e-mail do consultório, nunca por consulta online', () => {
  for (const f of ARQUIVOS) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.equal(/href="mailto:[^"]*doutor\.antoniofelipe\.saudemental/.test(html) || !/agendamento/i.test(html), true, f);
  }
});

test('todas trazem o aviso de orientação geral e CVV/SAMU', () => {
  for (const f of ARQUIVOS) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    assert.match(html, /Orientação geral/, f);
    assert.match(html, /CVV 188 · SAMU 192/, f);
  }
});
