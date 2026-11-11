const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../../backend/lib/podcast');
const R = require('../../backend/lib/revisaoMedica');
const V = require('../../scripts/podcast/validarFeed');

const BASE = 'https://www.drantoniofelipemedico.com.br';
const AGORA = new Date('2026-10-25T12:00:00Z');
// Revisão aprovada para o texto de teste (hash igual ao do corpo).
const HASH = 'hash-do-corpo';
const REVISADO = { revisaoDe: () => ({ status: R.STATUS.APROVADA, hash: HASH }), hashDe: () => HASH };
const texto = (extra = {}) => ({
  slug: 'texto-um', titulo: 'Rotina de sono na adolescência', resumo: 'Sono e telas.', publicado: true,
  publicadoEm: '2026-10-21T11:00:00Z', narracao: { url: 'https://blob.exemplo.com/a.mp3', bytes: 5000, caracteres: 3000 }, ...extra,
});

test('só entra texto publicado, com narração e já no ar (trava B)', () => {
  const eps = P.episodiosDe([
    texto(),
    texto({ slug: 'agendado', publicado: false }),
    texto({ slug: 'sem-narracao', narracao: undefined }),
    texto({ slug: 'futuro', publicadoEm: '2026-12-01T11:00:00Z' }),
  ], { base: BASE, agora: AGORA, ...REVISADO });
  assert.deepEqual(eps.map((e) => e.guid), [`${BASE}/artigo/texto-um`]);
});

test('episódio traz aviso educativo, link do texto e frase de voz sintética', () => {
  const [e] = P.episodiosDe([texto()], { base: BASE, agora: AGORA, ...REVISADO });
  assert.match(e.descricao, /protocolos hospitalares/);
  assert.match(e.descricao, /Texto completo: https:\/\/www\.drantoniofelipemedico\.com\.br\/artigo\/texto-um/);
  assert.match(e.descricao, /Narração com voz sintética\./);
});

test('CVV 188 · SAMU 192 só entra quando o tema pede', () => {
  const comum = P.episodiosDe([texto()], { base: BASE, agora: AGORA, ...REVISADO })[0];
  assert.doesNotMatch(comum.descricao, /CVV 188/);
  const sensivel = P.episodiosDe([texto({ titulo: 'Quando a crise chega', resumo: 'Sinais de risco.' })], { base: BASE, agora: AGORA, ...REVISADO })[0];
  assert.match(sensivel.descricao, /CVV 188 · SAMU 192/);
  assert.equal(P.temaSensivel('Plano de autolesão na escola'), true);
  assert.equal(P.temaSensivel('Sono e telas'), false);
});

test('XML: escapa &, < e aspas no conteúdo', () => {
  assert.equal(P.escapar('A & B <C> "D"'), 'A &amp; B &lt;C&gt; &quot;D&quot;');
});

test('feed gerado passa no validador de estrutura', () => {
  const eps = P.episodiosDe([texto()], { base: BASE, agora: AGORA, ...REVISADO });
  const xml = P.montarFeed({ canal: P.CANAL, episodios: eps });
  assert.deepEqual(V.validarXml(xml), []);
  assert.match(xml, /<itunes:explicit>false<\/itunes:explicit>/);
  assert.match(xml, /<language>pt-br<\/language>/);
  assert.match(xml, /doutor\.antoniofelipe\.saudemental@gmail\.com/);
});

test('validador reprova feed sem e-mail do dono e episódio sem tamanho de áudio', () => {
  const eps = P.episodiosDe([texto()], { base: BASE, agora: AGORA, ...REVISADO });
  const xml = P.montarFeed({ canal: P.CANAL, episodios: eps });
  const semDono = xml.replace(/<itunes:owner>[\s\S]*?<\/itunes:owner>/, '');
  assert.ok(V.validarXml(semDono).some((x) => /dono/.test(x)));
  const semTamanho = xml.replace('length="5000"', 'length="0"');
  assert.ok(V.validarXml(semTamanho).some((x) => /tamanho/.test(x)));
});

test('capa: 3000 px RGB sem alfa passa; pequena, não quadrada ou com alfa reprova', () => {
  assert.deepEqual(V.validarCapa({ largura: 3000, altura: 3000, canais: 3, temAlfa: false }), []);
  assert.ok(V.validarCapa({ largura: 1000, altura: 1000, canais: 3, temAlfa: false }).length > 0);
  assert.ok(V.validarCapa({ largura: 2000, altura: 1500, canais: 3, temAlfa: false }).some((x) => /quadrada/.test(x)));
  assert.ok(V.validarCapa({ largura: 2000, altura: 2000, canais: 4, temAlfa: true }).some((x) => /alfa|transpar/.test(x)));
});

test('sem revisão aprovada, o feed fica vazio (trava C)', () => {
  assert.deepEqual(P.episodiosDe([texto()], { base: BASE, agora: AGORA }), []);
});

test('texto alterado depois da aprovação sai do feed (trava C)', () => {
  const eps = P.episodiosDe([texto()], { base: BASE, agora: AGORA, revisaoDe: () => ({ status: R.STATUS.APROVADA, hash: 'antigo' }), hashDe: () => HASH });
  assert.deepEqual(eps, []);
});
