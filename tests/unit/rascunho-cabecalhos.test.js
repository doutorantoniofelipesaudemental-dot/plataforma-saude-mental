// Cabeçalhos de seção do rascunho: o título que o modelo repete no início do texto não pode gerar
// dois "##" seguidos (backend/lib/rascunhoArtigo.js).
const { test } = require('node:test');
const assert = require('node:assert');

const { montarCorpo } = require('../../backend/lib/rascunhoArtigo');

const PAUTA = { tipo: 'artigo-cientifico' };
const base = { introducao: 'Introdução acolhedora.', guiaPratico: 'Passos.', fisiopatologia: 'Mecanismos.', manejoClinico: 'Condutas.', pontosChave: [] };
const h2 = (md) => md.split('\n').filter((l) => /^## /.test(l));

test('título repetido no início do texto da seção é removido', () => {
  const md = montarCorpo(PAUTA, { ...base, guiaPratico: '## Guia Prático\n\nPassos.', fisiopatologia: '**Fisiopatologia**\n\nMecanismos.', manejoClinico: '## Manejo Clínico:\n\nCondutas.' });
  assert.deepStrictEqual(h2(md), ['## Guia Prático', '## Fisiopatologia', '## Manejo Clínico']);
  assert.ok(!/### /.test(md));
});

test('título diferente no início vira subtítulo (###), sem segundo ##', () => {
  const md = montarCorpo(PAUTA, { ...base, guiaPratico: '## Guia Prático para a Equipe\n\nPassos.', manejoClinico: '### Manejo na Atenção Básica\n\nCondutas.' });
  assert.deepStrictEqual(h2(md), ['## Guia Prático', '## Fisiopatologia', '## Manejo Clínico']);
  assert.match(md, /### Guia Prático para a Equipe\n\nPassos\./);
  assert.match(md, /### Manejo na Atenção Básica\n\nCondutas\./);
});

test('texto sem título no início fica intacto', () => {
  const md = montarCorpo(PAUTA, base);
  assert.match(md, /## Guia Prático\n\nPassos\./);
  assert.ok(!/### /.test(md));
});
