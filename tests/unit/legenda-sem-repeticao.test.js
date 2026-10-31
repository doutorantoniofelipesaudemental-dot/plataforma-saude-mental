// Legenda e telas do fluxo de redes não repetem o gancho (auditoria da fila de 30/10/2026, forma).
const { test } = require('node:test');
const assert = require('node:assert');
const { planejarPost } = require('../../backend/lib/redesV2/conteudo');

const GANCHO = 'Ele já tinha passado por mim umas seis vezes.';

test('relato: gancho não aparece duas vezes na legenda nem nas telas', () => {
  const artigo = {
    slug: 'x',
    titulo: 'O paciente que ninguém via',
    resumo: `${GANCHO} Hoje a história era outra, com detalhes do cuidado.`,
    categoria: 'Relatos da Prática',
    conteudo: `<h2>Algo</h2><p>${GANCHO} Hoje a história era outra, com detalhes do cuidado.</p>`,
  };
  const plano = planejarPost(artigo, { tipo: 'relato' });
  assert.strictEqual(plano.legendaCorpo.split(GANCHO).length - 1, 1, 'gancho repetido na legenda');
  const textos = plano.telas.map((t) => t.texto || '');
  assert.ok(textos.filter((t) => t.startsWith(GANCHO)).length <= 1, 'gancho repetido nas telas');
});

test('legenda: bloco de resumo que começa igual ao gancho não é repetido', () => {
  const artigo = {
    slug: 'y',
    titulo: 'Ansiedade no trabalho',
    resumo: 'A pessoa sente o coração acelerar antes de cada reunião. Isso pode ser sinal de ansiedade.',
    categoria: 'Empresas & RH',
    conteudo: '<h2>Sinais</h2><p>A pessoa sente o coração acelerar antes de cada reunião e evita falar.</p>',
  };
  const plano = planejarPost(artigo);
  const corpo = plano.legendaCorpo;
  const ocorrencias = corpo.split('A pessoa sente o coração acelerar').length - 1;
  assert.ok(ocorrencias <= 1, `trecho repetido ${ocorrencias} vezes`);
});
