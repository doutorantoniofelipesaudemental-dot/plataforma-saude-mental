const test = require('node:test');
const assert = require('node:assert/strict');
const { COLECAO, gravarRevisao, lerRevisao, entradasDoJson, migrarJson } = require('../../backend/lib/revisaoRepo');
const R = require('../../backend/lib/revisaoMedica');
const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');

// Coleção falsa com a mesma interface usada (updateOne com upsert, findOne com projeção).
function colecaoFalsa() {
  const docs = new Map();
  return {
    docs,
    async updateOne(filtro, { $set }, { upsert } = {}) {
      const atual = docs.get(filtro.slug);
      if (!atual && !upsert) return { modifiedCount: 0 };
      docs.set(filtro.slug, { ...(atual || {}), ...$set });
      return { modifiedCount: 1 };
    },
    async findOne(filtro) {
      const d = docs.get(filtro.slug);
      return d ? { ...d } : null;
    },
  };
}

test('nome da coleção é revisoes_medicas', () => {
  assert.equal(COLECAO, 'revisoes_medicas');
});

test('gravar e ler a revisão pelo slug', async () => {
  const col = colecaoFalsa();
  await gravarRevisao(col, { slug: 'x', status: 'aprovada', hash: 'h1', revisor: 'Dr.', aprovadoEm: '2026-11-02T10:00:00.000Z' });
  const r = await lerRevisao(col, 'x');
  assert.equal(r.status, 'aprovada');
  assert.equal(r.hash, 'h1');
  assert.equal(await lerRevisao(col, 'nao-existe'), null);
});

test('aprovação sem hash não é gravada', async () => {
  await assert.rejects(gravarRevisao(colecaoFalsa(), { slug: 'x', status: 'aprovada' }), /sem hash/);
});

test('entradasDoJson ignora chaves de metadado (_aviso)', () => {
  const e = entradasDoJson({ _aviso: { hash: 'z' }, 'artigo-a': { status: 'aprovada', hash: 'h' } });
  assert.deepEqual(e.map((x) => x.slug), ['artigo-a']);
});

test('migração em dry-run não grava nada', async () => {
  const col = colecaoFalsa();
  const r = await migrarJson(col, { _aviso: {}, 'a': { status: 'aprovada', hash: 'h' } }, { aplicar: false });
  assert.equal(r.aplicado, false);
  assert.equal(r.gravaveis, 1);
  assert.equal(col.docs.size, 0);
});

test('migração com aplicar grava só entradas válidas e aponta as inválidas', async () => {
  const col = colecaoFalsa();
  const r = await migrarJson(col, { _aviso: {}, 'ok': { status: 'aprovada', hash: 'h' }, 'sem-hash': { status: 'aprovada' } }, { aplicar: true });
  assert.deepEqual(r.invalidas, ['sem-hash']);
  assert.deepEqual(r.ignorados, ['_aviso']);
  assert.equal(col.docs.has('ok'), true);
  assert.equal(col.docs.has('sem-hash'), false);
});

const BASE = { titulo: 'Teste', slug: 'teste', resumo: 'Resumo', categoria: 'Geral', autor: 'Dr. Antônio Felipe', tempoLeitura: 2, publicadoEm: new Date('2026-10-05'), atualizadoEm: new Date('2026-10-06'), conteudo: '<p>Texto do artigo.</p>' };
const visivel = (html) => html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');

test('render: sem registro, mostra "pendente" e nenhum selo', () => {
  const v = visivel(renderizarArtigoHtml({ ...BASE, revisao: null }));
  assert.ok(v.includes('Os textos revisados individualmente pelo autor exibem o selo “Revisado pelo Dr. Antônio Felipe”.'));
  assert.ok(!v.includes('Revisado pelo Dr. Antônio Felipe Garabito em'));
});

test('render: aprovação com o mesmo hash mostra o selo com a data de Salvador', () => {
  const hash = R.hashConteudo(BASE.conteudo);
  const revisao = R.aprovar({ slug: 'teste', hash, revisor: 'Dr. Antônio Felipe', data: '2026-11-02T13:00:00.000Z' });
  const v = visivel(renderizarArtigoHtml({ ...BASE, revisao }));
  assert.ok(v.includes('Revisado pelo Dr. Antônio Felipe Garabito em 02/11/2026.'));
  assert.ok(!v.includes('Os textos revisados individualmente pelo autor exibem o selo “Revisado pelo Dr. Antônio Felipe”.'));
});

test('render: texto mudou depois da aprovação volta a "pendente"', () => {
  const revisao = R.aprovar({ slug: 'teste', hash: R.hashConteudo('outro texto'), revisor: 'Dr.', data: '2026-11-02T13:00:00.000Z' });
  const v = visivel(renderizarArtigoHtml({ ...BASE, revisao }));
  assert.ok(v.includes('Os textos revisados individualmente pelo autor exibem o selo “Revisado pelo Dr. Antônio Felipe”.'));
});
