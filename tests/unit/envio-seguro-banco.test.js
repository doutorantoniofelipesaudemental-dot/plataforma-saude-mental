const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EJSON } = require('bson');
const { planejarEnvio } = require('../../backend/lib/redesV2/envioSeguro');
const banco = require('../../backend/lib/redesV2/envioSeguroBanco');

// Driver falso (mock) para o teste. Não conecta em nenhum MongoDB.
const igual = (d, q) => Object.keys(q).every((k) => JSON.stringify(d[k]) === JSON.stringify(q[k]));
class Colecao {
  constructor() { this.docs = []; }
  find(q = {}) {
    const lista = this.docs.filter((d) => igual(d, q)).map((d) => ({ ...d }));
    const cur = { sort: () => cur, toArray: async () => lista };
    return cur;
  }
  async findOne(q) { const d = this.docs.find((x) => igual(x, q)); return d ? ({ ...d }) : null; }
  async insertOne(doc) {
    if (doc._id !== undefined && this.docs.some((d) => d._id === doc._id)) throw new Error('chave duplicada');
    this.docs.push(({ ...doc }));
    return { insertedId: doc._id };
  }
  async insertMany(arr) { for (const d of arr) this.docs.push(({ ...d })); return { insertedCount: arr.length }; }
  async replaceOne(q, doc) {
    const i = this.docs.findIndex((x) => igual(x, q));
    if (i < 0) return { matchedCount: 0 };
    this.docs[i] = ({ ...doc });
    return { matchedCount: 1 };
  }
  async deleteOne(q) { const i = this.docs.findIndex((x) => igual(x, q)); if (i >= 0) this.docs.splice(i, 1); return { deletedCount: i >= 0 ? 1 : 0 }; }
  async deleteMany(q) { const antes = this.docs.length; this.docs = this.docs.filter((d) => !igual(d, q)); return { deletedCount: antes - this.docs.length }; }
  async countDocuments(q) { return this.docs.filter((d) => igual(d, q)).length; }
}
function novoBanco() {
  const cols = {};
  return { collection: (n) => (cols[n] = cols[n] || new Colecao()), cols };
}
const bytes = (s) => Buffer.from(s);
const AGORA = new Date('2026-11-12T03:50:00Z');
const ID = '2026-11-13-insonia-consulta-rotina';

function peca(imagens = [bytes('tela-a'), bytes('tela-b')], extra = {}) {
  const { createHash } = require('node:crypto');
  const hashes = imagens.map((b) => createHash('sha256').update(b).digest('hex'));
  return {
    slug: ID,
    id: ID,
    hashes,
    imagens,
    erroImagem: null,
    legenda: 'legenda nova',
    alts: ['alt 1', 'alt 2'],
    meta: { id: ID, status: 'aprovado-checagem', dataSugerida: '2026-11-13T08:00:00-03:00', checagem: { ok: true, hashes } },
    ...extra,
  };
}
function plano(p) { return planejarEnvio({ pecas: [p], agora: AGORA }); }
function dirTemp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'envio-seguro-')); }

test('inserir novo: aplica, confere, e o reverter remove só o que criou', async () => {
  const dbx = novoBanco();
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-novo');
  const reg = await banco.aplicar(dbx, plano(peca()), b.dir, new Map());
  const doc = await dbx.collection('redes_v2').findOne({ _id: ID });
  assert.equal(doc.status, 'aprovado-checagem');
  assert.equal(doc.legenda, 'legenda nova');
  assert.equal(await dbx.collection('redes_v2_img').countDocuments({ postId: ID }), 2);
  const r = JSON.parse(fs.readFileSync(reg, 'utf8'));
  assert.equal(r.inseridos[0].substituiu, false);

  const c = await banco.conferir(dbx, [peca()], [ID]);
  assert.equal(c.divergentes, 0, c.linhas.join('\n'));

  const linhas = await banco.reverter(dbx, reg);
  assert.match(linhas[0], /removido/);
  assert.equal(await dbx.collection('redes_v2').findOne({ _id: ID }), null);
  assert.equal(await dbx.collection('redes_v2_img').countDocuments({ postId: ID }), 0);
});

test('substituir descartado-*: guarda o anterior e o reverter restaura exatamente', async () => {
  const dbx = novoBanco();
  const antigo = { _id: ID, id: ID, status: 'descartado-metodologia-antiga-20261107', legenda: 'antiga', alts: [], dataSugerida: new Date('2026-11-13T11:00:00Z') };
  await dbx.collection('redes_v2').insertOne(antigo);
  const bytesAntigos = [bytes('antiga-1'), bytes('antiga-2'), bytes('antiga-3')];
  for (let i = 0; i < 3; i += 1) await dbx.collection('redes_v2_img').insertOne({ postId: ID, n: i + 1, hash: `h${i}`, data: bytesAntigos[i] });

  const existentes = new Map([[ID, antigo.status]]);
  assert.deepEqual(banco.bloqueadosPorStatus(existentes), []);
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-subst');
  const reg = await banco.aplicar(dbx, plano(peca()), b.dir, existentes);

  const novo = await dbx.collection('redes_v2').findOne({ _id: ID });
  assert.equal(novo.status, 'aprovado-checagem');
  assert.equal(novo.legenda, 'legenda nova');
  assert.equal(await dbx.collection('redes_v2_img').countDocuments({ postId: ID }), 2);
  assert.equal(JSON.parse(fs.readFileSync(reg, 'utf8')).inseridos[0].substituiu, true);

  const linhas = await banco.reverter(dbx, reg);
  assert.match(linhas[0], /restaurado o anterior/);
  const volta = await dbx.collection('redes_v2').findOne({ _id: ID });
  assert.equal(volta.status, antigo.status);
  assert.equal(volta.legenda, 'antiga');
  const imgs = await dbx.collection('redes_v2_img').find({ postId: ID }).sort({ n: 1 }).toArray();
  assert.equal(imgs.length, 3);
  imgs.forEach((im, i) => assert.equal(Buffer.from(im.data).toString(), bytesAntigos[i].toString()));
});

test('status publicado não pode ser substituído (bloqueado antes de gravar)', () => {
  const bloq = banco.bloqueadosPorStatus(new Map([[ID, 'publicado']]));
  assert.deepEqual(bloq, [[ID, 'publicado']]);
});

test('reverter não remove peça que já saiu da fila (status mudou)', async () => {
  const dbx = novoBanco();
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-saiu');
  const reg = await banco.aplicar(dbx, plano(peca()), b.dir, new Map());
  await dbx.collection('redes_v2').replaceOne({ _id: ID }, { ...(await dbx.collection('redes_v2').findOne({ _id: ID })), status: 'publicado' });
  const linhas = await banco.reverter(dbx, reg);
  assert.match(linhas[0], /NÃO DESFAÇO/);
  assert.equal((await dbx.collection('redes_v2').findOne({ _id: ID })).status, 'publicado');
});

test('reverter não toca em documento que não está no registro', async () => {
  const dbx = novoBanco();
  await dbx.collection('redes_v2').insertOne({ _id: 'outro', status: 'publicado', legenda: 'x' });
  await dbx.collection('redes_v2_img').insertOne({ postId: 'outro', n: 1, hash: 'h', data: bytes('x') });
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-outro');
  const reg = await banco.aplicar(dbx, plano(peca()), b.dir, new Map());
  await banco.reverter(dbx, reg);
  assert.ok(await dbx.collection('redes_v2').findOne({ _id: 'outro' }));
  assert.equal(await dbx.collection('redes_v2_img').countDocuments({ postId: 'outro' }), 1);
});

test('conferir acusa divergência de legenda depois do envio', async () => {
  const dbx = novoBanco();
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-diverge');
  await banco.aplicar(dbx, plano(peca()), b.dir, new Map());
  const c = await banco.conferir(dbx, [peca(undefined, { legenda: 'legenda alterada depois' })], [ID]);
  assert.equal(c.divergentes, 1);
  assert.match(c.linhas[0], /legenda diferente/);
});

test('backup relê o mesmo número de documentos e preserva o conteúdo', async () => {
  const dbx = novoBanco();
  await dbx.collection('redes_v2').insertOne({ _id: 'x', status: 'publicado', dataSugerida: new Date('2026-11-01T00:00:00Z') });
  const b = await banco.fazerBackup(dbx, dirTemp(), 'teste-backup');
  const lido = EJSON.parse(fs.readFileSync(path.join(b.dir, 'redes_v2.ejson'), 'utf8'));
  assert.equal(lido.length, 1);
  assert.ok(lido[0].dataSugerida instanceof Date);
  assert.equal(b.documentos, 1);
});
