/**
 * Operações de banco do envio seguro (redes_v2 e redes_v2_img). Recebem a conexão (dbx) como
 * parâmetro, para o teste usar um driver falso. Regras: backup antes de gravar; substitui SÓ
 * documentos descartado-*; guarda a cópia completa do anterior; --reverter desfaz só o registrado.
 */
const fs = require('node:fs');
const path = require('node:path');
const { EJSON } = require('bson');
const { conferirPar, paraData } = require('./envioSeguro');

const STATUS_SUBSTITUIVEL = /^descartado-/;
const gravarJson = (f, obj) => fs.writeFileSync(f, JSON.stringify(obj, null, 1));
/** Bytes de um campo binário: Buffer (driver falso) ou Binary do bson (driver real). */
function bytesDe(x) {
  if (Buffer.isBuffer(x)) return x;
  return Buffer.from(x.buffer).subarray(0, x.position ?? x.buffer.length);
}

/** Lista de { id, status } que impedem o envio (existem com status que não pode ser substituído). */
function bloqueadosPorStatus(existentes) {
  return [...existentes].filter(([, st]) => !STATUS_SUBSTITUIVEL.test(st));
}

async function fazerBackup(dbx, dirBackups, carimbo) {
  const dir = path.join(dirBackups, `envio-seguro-${carimbo}`);
  fs.mkdirSync(dir, { recursive: true });
  const docs = await dbx.collection('redes_v2').find({}).toArray();
  const imgs = await dbx.collection('redes_v2_img').find({}, { projection: { postId: 1, n: 1, hash: 1 } }).toArray();
  fs.writeFileSync(path.join(dir, 'redes_v2.ejson'), EJSON.stringify(docs));
  gravarJson(path.join(dir, 'redes_v2_img_hashes.json'), imgs);
  const relidos = EJSON.parse(fs.readFileSync(path.join(dir, 'redes_v2.ejson'), 'utf8')).length;
  if (relidos !== docs.length) throw new Error('backup não confere ao reler');
  return { dir, documentos: docs.length, imagens: imgs.length };
}

/** plano.selecionadas: peças de envioSeguro.planejarEnvio. existentes: Map id -> status atual. */
async function aplicar(dbx, plano, dirBackup, existentes) {
  const caminhoRegistro = path.join(dirBackup, 'registro.json');
  const registro = { criadoEm: new Date().toISOString(), backup: dirBackup, inseridos: [] };
  gravarJson(caminhoRegistro, registro);
  for (const p of plano.selecionadas) {
    const substitui = existentes.has(p.id);
    let arquivoPrevio = null;
    if (substitui) {
      const previo = await dbx.collection('redes_v2').findOne({ _id: p.id });
      const imgsPrevias = await dbx.collection('redes_v2_img').find({ postId: p.id }).toArray();
      arquivoPrevio = `previo-${p.id}.ejson`;
      // EJSON não serializa Buffer de forma reversível: a imagem vai como base64 explícito.
      const imgsB64 = imgsPrevias.map((i) => ({ postId: i.postId, n: i.n, hash: i.hash, dataB64: bytesDe(i.data).toString('base64') }));
      fs.writeFileSync(path.join(dirBackup, arquivoPrevio), EJSON.stringify({ doc: previo, imgs: imgsB64 }));
      await dbx.collection('redes_v2_img').deleteMany({ postId: p.id });
    }
    const novo = {
      _id: p.id,
      ...p.meta,
      dataSugerida: paraData(p.meta.dataSugerida),
      legenda: p.legenda,
      alts: p.alts,
      status: 'aprovado-checagem',
      enviadoEm: new Date(),
    };
    if (substitui) await dbx.collection('redes_v2').replaceOne({ _id: p.id }, novo);
    else await dbx.collection('redes_v2').insertOne(novo);
    registro.inseridos.push({ slug: p.slug, id: p.id, substituiu: substitui, arquivoPrevio });
    gravarJson(caminhoRegistro, registro);
    if (p.imagens.length) {
      await dbx.collection('redes_v2_img').insertMany(p.imagens.map((data, i) => ({ postId: p.id, n: i + 1, hash: p.hashes[i], data })));
    }
  }
  return caminhoRegistro;
}

/** Compara banco x pasta. Devolve { conferidos, divergentes, linhas }. */
async function conferir(dbx, pastas, slugs) {
  const alvo = slugs
    ? pastas.filter((p) => slugs.includes(p.slug))
    : pastas.filter((p) => p.meta.status === 'aprovado-checagem');
  const linhas = [];
  let divergentes = 0;
  for (const p of alvo) {
    const banco = await dbx.collection('redes_v2').findOne({ _id: p.id });
    const imgs = banco ? await dbx.collection('redes_v2_img').find({ postId: p.id }).sort({ n: 1 }).toArray() : [];
    const d = conferirPar({
      banco: banco && { status: banco.status, legenda: banco.legenda, dataSugerida: banco.dataSugerida, hashes: imgs.map((i) => i.hash) },
      pasta: { status: p.meta.status, legenda: p.legenda, dataSugerida: p.meta.dataSugerida, hashes: p.hashes },
    });
    if (d.length) divergentes += 1;
    linhas.push(`${d.length ? 'DIVERGE' : 'OK     '} ${p.slug}${d.length ? ` | ${d.join(' | ')}` : ''}`);
  }
  return { conferidos: alvo.length, divergentes, linhas };
}

/** Desfaz o registrado: remove o criado; restaura o substituído a partir do backup. */
async function reverter(dbx, caminhoRegistro) {
  const dirBackup = path.dirname(caminhoRegistro);
  const reg = JSON.parse(fs.readFileSync(caminhoRegistro, 'utf8'));
  const linhas = [];
  for (const e of reg.inseridos) {
    const atual = await dbx.collection('redes_v2').findOne({ _id: e.id }, { projection: { status: 1 } });
    if (!atual) { linhas.push(`ausente (nada a desfazer): ${e.slug}`); continue; }
    if (atual.status !== 'aprovado-checagem') { linhas.push(`NÃO DESFAÇO ${e.slug}: status ${atual.status} (já saiu da fila)`); continue; }
    await dbx.collection('redes_v2_img').deleteMany({ postId: e.id });
    if (e.substituiu) {
      const { doc, imgs } = EJSON.parse(fs.readFileSync(path.join(dirBackup, e.arquivoPrevio), 'utf8'));
      await dbx.collection('redes_v2').replaceOne({ _id: e.id }, doc);
      const restauradas = imgs.map((i) => ({ postId: i.postId, n: i.n, hash: i.hash, data: Buffer.from(i.dataB64, 'base64') }));
      if (restauradas.length) await dbx.collection('redes_v2_img').insertMany(restauradas);
      linhas.push(`restaurado o anterior: ${e.slug} (imagens: ${imgs.length})`);
    } else {
      await dbx.collection('redes_v2').deleteOne({ _id: e.id });
      linhas.push(`removido: ${e.slug}`);
    }
  }
  return linhas;
}

module.exports = { bloqueadosPorStatus, fazerBackup, aplicar, conferir, reverter };
