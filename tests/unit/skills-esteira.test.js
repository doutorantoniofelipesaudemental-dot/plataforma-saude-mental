// Skills de formato da esteira audiovisual (ordem de 10/11/2026, B6): frontmatter válido e regras fixas embutidas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../..');
const SKILLS = ['explicativo-portal', 'transtornos-clinico', 'frase-chave', 'relato-animado', 'nr1-empresas'];
const ler = (s) => fs.readFileSync(path.join(RAIZ, '.claude', 'skills', s, 'SKILL.md'), 'utf8');

for (const s of SKILLS) {
  test(`skill ${s}: frontmatter com name igual à pasta e description`, () => {
    const t = ler(s);
    const fm = t.match(/^---\nname: (.+)\ndescription: (.+)\n---/);
    assert.ok(fm, 'frontmatter ausente');
    assert.equal(fm[1].trim(), s);
    assert.ok(fm[2].length > 40, 'description curta');
  });

  test(`skill ${s}: lê o DESIGN.md e embute as regras fixas`, () => {
    const t = ler(s);
    assert.match(t, /docs\/DESIGN\.md/, 'não cita o DESIGN.md');
    assert.match(t, /CVV 188/, 'CVV ausente');
    assert.match(t, /SAMU 192/, 'SAMU ausente');
    assert.match(t, /CFM 2\.454\/2026/, 'aviso CFM 2.454 ausente');
    assert.match(t, /IDENTIFICACAO_COMPLETA/, 'assinatura de 5 linhas (referência) ausente');
    assert.match(t, /[-−]14 LUFS/, '−14 LUFS ausente');
    assert.match(t, /SRT/, 'legenda SRT ausente');
    assert.match(t, /adulto/i, 'público adulto ausente');
    assert.match(t, /Dr\. Antônio Felipe/, 'nome do Dr. sem acento ou ausente');
  });

  test(`skill ${s}: sem termos proibidos como recomendação`, () => {
    const t = ler(s);
    for (const linha of t.split(String.fromCharCode(10)).filter((l) => /cometeu suicídio/i.test(l))) assert.match(linha, /nunca|não/i, '"cometeu suicídio" aparece como recomendação: ' + linha);
    assert.doesNotMatch(t, /#psiquiatria/i, 'hashtag proibida');
    assert.doesNotMatch(t, /wa\.me|whatsapp/i, 'mensageria de terceiros');
  });
}

test('skills: transtornos-clinico exige fonte nomeada para o rótulo "Dado"', () => {
  assert.match(ler('transtornos-clinico'), /Dado[\s\S]{0,200}fonte/i);
});

test('skills: relato-animado traz a nota de ficção (CEM art. 75) e a regra OMS 2023', () => {
  const t = ler('relato-animado');
  assert.match(t, /CEM art\. 75/);
  assert.match(t, /OMS 2023/);
});

test('skills: nr1-empresas não afirma norma sem fonte oficial', () => {
  const t = ler('nr1-empresas');
  assert.match(t, /fonte oficial/i);
  assert.match(t, /Portaria 1\.999\/2023/);
});
