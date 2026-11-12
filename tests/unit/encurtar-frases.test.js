// Regras de texto das lâminas (ordem de 11/11/2026): nunca cortar frase no meio; checagem reprova o que sobra quebrado.
const { test } = require('node:test');
const assert = require('node:assert');
const { encurtar, palavras } = require('../../backend/lib/redesV2/conteudo.js');
const { falhasDeTexto } = require('../../backend/lib/redesV2/checagem.js');

test('encurtar junta frases inteiras que cabem no limite', () => {
  assert.strictEqual(encurtar('Um dois três. Quatro cinco seis sete.', 4), 'Um dois três.');
  assert.strictEqual(encurtar('Um dois três. Quatro cinco seis sete.', 8), 'Um dois três. Quatro cinco seis sete.');
});

test('encurtar nunca corta no meio de uma frase', () => {
  const r = encurtar('Dormir mal aumenta o risco de ansiedade e de depressão ao longo do tempo. Segunda frase curta.', 6);
  assert.ok(r.endsWith('.'), 'termina em ponto');
  assert.ok(!/\bdo tempo\b/.test(r) || r.includes('ao longo do tempo.'), 'não corta o fim da primeira frase');
  assert.ok(!r.includes('(Lei.'));
});

test('encurtar com primeira frase maior que o limite devolve a frase inteira (checagem reprova, não corta)', () => {
  const frase = 'Primeira frase longa com muitas palavras que passam do limite.';
  assert.strictEqual(encurtar(frase, 3), frase);
});

test('encurtar sem pontuação final não inventa corte: devolve o trecho como está', () => {
  assert.strictEqual(encurtar('lista sem ponto final de nenhum tipo aqui', 3), 'lista sem ponto final de nenhum tipo aqui');
});

test('regra: frase sem pontuação final reprova', () => {
  const f = falhasDeTexto([{ tipo: 'capa', titulo: 'Título', texto: 'Texto que termina sem ponto' }]);
  assert.ok(f.some((m) => /sem pontuação final/.test(m)));
});

test('regra: parêntese aberto (corte de "(Lei") reprova', () => {
  const f = falhasDeTexto([{ tipo: 'ideia', titulo: '', texto: 'Em 2026, entrou em vigor o ECA Digital (Lei nº 15.211/2025.' }]);
  assert.ok(f.some((m) => /parêntese/.test(m)));
});

test('regra: conector sem antecedente ("Nesses casos", "Isso", "Por isso") reprova', () => {
  for (const t of ['Nesses casos, procure ajuda.', 'Isso melhora com tempo.', 'Por isso, observar o filho ajuda.']) {
    const f = falhasDeTexto([{ tipo: 'ideia', titulo: 'Título', texto: t }]);
    assert.ok(f.some((m) => /conector/.test(m)), t);
  }
});

test('regra: "Dr." solto no fim reprova', () => {
  const f = falhasDeTexto([{ tipo: 'ideia', titulo: '', texto: 'Consulte o Dr.' }]);
  assert.ok(f.some((m) => /"Dr\."/.test(m)));
});

test('regra: título sem texto reprova (exceto capa)', () => {
  assert.ok(falhasDeTexto([{ tipo: 'ideia', titulo: 'Só título', texto: '' }]).some((m) => /título sem texto/.test(m)));
  assert.strictEqual(falhasDeTexto([{ tipo: 'capa', titulo: 'Capa', texto: 'Gancho.' }]).length, 0);
});

test('texto correto passa sem falhas', () => {
  const telas = [
    { tipo: 'capa', titulo: 'Saúde mental do idoso', texto: 'Como reconhecer sinais de sofrimento.' },
    { tipo: 'ideia', titulo: 'Sinais de alerta', texto: 'Isolamento social crescente, recusa em participar de atividades antes apreciadas.' },
  ];
  assert.deepStrictEqual(falhasDeTexto(telas), []);
  assert.ok(palavras(telas[1].texto).length > 0);
});
