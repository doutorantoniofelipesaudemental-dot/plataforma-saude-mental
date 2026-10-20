const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../../scripts/youtube/travaDuplicidadeYoutube');

function colecao() {
  const docs = [];
  return {
    docs,
    async findOne(f) { return docs.find((d) => d._id === f._id) || null; },
    async insertOne(d) { if (docs.some((x) => x._id === d._id)) throw new Error('duplicado'); docs.push(d); },
  };
}

test('trava: item já registrado no banco não é publicado de novo', async () => {
  const col = colecao();
  assert.equal(await T.jaRegistrado(col, 'yt-1'), false);
  await T.registrar(col, { id: 'yt-1', youtubeId: 'abc', publicadoEm: '2026-10-20T10:00:00Z' });
  assert.equal(await T.jaRegistrado(col, 'yt-1'), true);
});

test('trava: registrar o mesmo item duas vezes falha (não há segunda publicação por engano)', async () => {
  const col = colecao();
  await T.registrar(col, { id: 'yt-2', youtubeId: 'x', publicadoEm: 'a' });
  await assert.rejects(() => T.registrar(col, { id: 'yt-2', youtubeId: 'y', publicadoEm: 'b' }));
});

test('código: o publicador registra no banco ANTES de gravar o status no arquivo e checa o banco antes do upload', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../scripts/youtube/publicarYoutube.js'), 'utf8');
  const iCheca = src.indexOf('TRAVA.jaRegistrado');
  const iEnvia = src.indexOf('yt.enviarVideo');
  const iRegistra = src.indexOf('TRAVA.registrar');
  assert.ok(iCheca > 0 && iEnvia > iCheca, 'checa o banco antes do envio');
  assert.ok(iRegistra > iEnvia, 'registra depois do envio');
  assert.match(src, /NÃO registrado no banco[\s\S]*break/, 'se não registrar, para o lote');
});
