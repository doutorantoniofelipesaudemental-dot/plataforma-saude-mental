const test = require('node:test');
const assert = require('node:assert/strict');
const { criarSeNaoExistir } = require('../../backend/lib/criarTextoNovo');

// Banco simulado: guarda o que foi inserido e responde a find com os documentos existentes.
function bancoSimulado(existentes = []) {
  const inseridos = [];
  return {
    inseridos,
    find: () => ({ toArray: async () => existentes }),
    insertOne: async (d) => { inseridos.push(d); },
  };
}
const SEM_DISCO = []; // isola o teste das fontes reais do site
const doc = (extra = {}) => ({ slug: 'texto-novo', titulo: 'Sono e rotina na adolescência', conteudo: '<p>Texto próprio sobre rotina de sono e telas antes de dormir.</p>', ...extra });

test('texto novo sem duplicado é inserido', async () => {
  const col = bancoSimulado([]);
  const r = await criarSeNaoExistir({ col, doc: doc(), fontesDisco: SEM_DISCO });
  assert.equal(r.criado, true);
  assert.equal(col.inseridos.length, 1);
  assert.equal(col.inseridos[0].slug, 'texto-novo');
});

test('duplicado pelo título no banco é ignorado e nada é inserido', async () => {
  const col = bancoSimulado([{ slug: 'outro', titulo: 'SONO E ROTINA NA ADOLESCÊNCIA', conteudo: '' }]);
  const r = await criarSeNaoExistir({ col, doc: doc(), fontesDisco: SEM_DISCO });
  assert.equal(r.criado, false);
  assert.match(r.motivos.join(' '), /título já existe no banco/);
  assert.equal(col.inseridos.length, 0);
});

test('duplicado pelo slug no banco é ignorado', async () => {
  const col = bancoSimulado([{ slug: 'texto-novo', titulo: 'Outro título', conteudo: '' }]);
  const r = await criarSeNaoExistir({ col, doc: doc(), fontesDisco: SEM_DISCO });
  assert.equal(r.criado, false);
  assert.equal(col.inseridos.length, 0);
});

test('texto quase igual a um do banco (acima de 60%) é ignorado', async () => {
  const base = 'a rotina de sono da criança precisa de horários fixos e de menos telas antes de dormir todas as noites';
  const col = bancoSimulado([{ slug: 'velho', titulo: 'Outro', conteudo: `<p>${base}</p>` }]);
  const r = await criarSeNaoExistir({ col, doc: doc({ conteudo: `<p>${base} com uma frase a mais</p>` }), fontesDisco: SEM_DISCO });
  assert.equal(r.criado, false);
  assert.match(r.motivos.join(' '), /parecido demais/);
  assert.equal(col.inseridos.length, 0);
});
