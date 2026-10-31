const test = require('node:test');
const assert = require('node:assert/strict');
const { lerSegundos } = require('../../backend/lib/duracaoAudio');
const P = require('../../backend/lib/podcast');

test('lerSegundos: converte a saída do ffprobe e rejeita valores inválidos', () => {
  assert.equal(lerSegundos('379.8\n'), 379.8);
  assert.equal(lerSegundos('12'), 12);
  assert.equal(lerSegundos(''), null);
  assert.equal(lerSegundos('N/A'), null);
  assert.equal(lerSegundos('0'), null);
  assert.equal(lerSegundos(undefined), null);
});

test('duracaoDoEpisodio: usa a duração medida e cai na estimativa só sem medição', () => {
  assert.equal(P.duracaoDoEpisodio({ narracao: { duracaoSegundos: 380 }, caracteres: 4840 }), 380);
  assert.equal(P.duracaoDoEpisodio({ narracao: { caracteres: 4500 } }), 300);
  assert.equal(P.duracaoDoEpisodio({ narracao: { duracaoSegundos: 0 }, caracteres: 4500 }), 300);
});

test('feed: o itunes:duration do episódio vem da medição quando existe', () => {
  const base = { slug: 'x', titulo: 'T', resumo: 'R', publicado: true, publicadoEm: '2026-10-21T11:00:00Z', narracao: { url: 'https://blob.exemplo.com/a.mp3', bytes: 1, duracaoSegundos: 380 } };
  const eps = P.episodiosDe([base], { base: 'https://www.drantoniofelipemedico.com.br', agora: new Date('2026-10-25T12:00:00Z') });
  assert.equal(eps[0].duracao, 380);
});
