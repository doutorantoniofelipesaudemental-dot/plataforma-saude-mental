/**
 * Envio SEGURO à fila de redes (redes_v2). Não altera enviarFila.js.
 * Padrão = DRY-RUN (só lista; não grava). Flags:
 *   --slugs=a,b,c   envia só essas pastas (nome da pasta em conteudo/redes-v2)
 *   --backup        copia redes_v2 para backups/envio-seguro-<data>/ (com EJSON, preserva datas e imagens)
 *   --aplicar       faz backup, grava as peças e registra o que foi criado ou substituído
 *                   (substitui SÓ documentos com status descartado-*; guarda a cópia completa do anterior)
 *   --conferir      compara banco x pasta (legenda, data, status, hashes); só leitura
 *   --reverter      desfaz SÓ o que o registro diz: remove o criado e restaura o substituído (--registro=CAMINHO ou o mais recente)
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const db = require('../../lib/db');
const { planejarEnvio, conferirPar, paraData } = require('../../lib/redesV2/envioSeguro');

const RAIZ = process.env.DRS_RAIZ_DADOS || path.resolve(__dirname, '../../..'); // conteudo e backups são ignorados pelo Git: ficam na pasta principal
const DIR_CONTEUDO = path.join(RAIZ, 'conteudo/redes-v2');
const DIR_BACKUPS = path.join(RAIZ, 'backups');
const STATUS_SUBSTITUIVEL = /^descartado-/;
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const valor = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const carimbo = () => new Date().toISOString().replace(/[:.]/g, '-');
const gravarJson = (f, obj) => fs.writeFileSync(f, JSON.stringify(obj, null, 1));

function lerPastas() {
  return fs.readdirSync(DIR_CONTEUDO)
    .filter((n) => n !== 'revisar' && fs.existsSync(path.join(DIR_CONTEUDO, n, 'meta.json')))
    .sort()
    .map((n) => {
      const dir = path.join(DIR_CONTEUDO, n);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
      const hashes = (meta.checagem && meta.checagem.hashes) || [];
      const imagens = [];
      let erroImagem = null;
      for (let i = 0; i < hashes.length && !erroImagem; i += 1) {
        const f = path.join(dir, `tela-${i + 1}.png`);
        if (!fs.existsSync(f)) {
          erroImagem = `tela ${i + 1} ausente`;
        } else {
          const buf = fs.readFileSync(f);
          if (sha(buf) !== hashes[i]) erroImagem = `imagem ${i + 1} diferente da checada`;
          else imagens.push(buf);
        }
      }
      const lp = path.join(dir, 'legenda.txt');
      const ap = path.join(dir, 'alt.txt');
      return {
        slug: n,
        id: meta.id,
        meta,
        hashes,
        imagens,
        erroImagem,
        legenda: fs.existsSync(lp) ? fs.readFileSync(lp, 'utf8') : null,
        alts: fs.existsSync(ap) ? fs.readFileSync(ap, 'utf8').split('\n').map((l) => l.replace(/^\d+\.\s*/, '')) : [],
      };
    });
}

function slugsPedidos() {
  const v = valor('slugs');
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;
}

const resumoHash = (hashes) => sha(hashes.join('')).slice(0, 12);

function mostrarPlano(plano, existentes, slugs) {
  for (const p of plano.selecionadas) {
    const data = paraData(p.meta.dataSugerida).toISOString();
    const ex = existentes.get(p.id);
    const nota = ex ? ` | SUBSTITUI banco (${ex})` : '';
    console.log(`OK        ${p.slug} | ${data} | ${p.meta.status} | telas ${p.hashes.length} | hash ${resumoHash(p.hashes)}${nota}`);
  }
  if (slugs) for (const r of plano.recusadas) console.log(`RECUSADA  ${r.slug} | ${r.motivo}`);
  else console.log(`fora do envio (não aprovadas ou com data passada): ${plano.recusadas.length} pastas`);
}

async function fazerBackup(dbx) {
  const dir = path.join(DIR_BACKUPS, `envio-seguro-${carimbo()}`);
  fs.mkdirSync(dir, { recursive: true });
  const docs = await dbx.collection('redes_v2').find({}).toArray();
  const imgs = await dbx.collection('redes_v2_img').find({}, { projection: { postId: 1, n: 1, hash: 1 } }).toArray();
  fs.writeFileSync(path.join(dir, 'redes_v2.ejson'), EJSON.stringify(docs));
  gravarJson(path.join(dir, 'redes_v2_img_hashes.json'), imgs);
  const relidos = EJSON.parse(fs.readFileSync(path.join(dir, 'redes_v2.ejson'), 'utf8')).length;
  if (relidos !== docs.length) throw new Error('backup não confere ao reler');
  console.log(`backup: ${dir} (redes_v2: ${docs.length} documentos; redes_v2_img: ${imgs.length} registros de hash)`);
  return dir;
}

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
      fs.writeFileSync(path.join(dirBackup, arquivoPrevio), EJSON.stringify({ doc: previo, imgs: imgsPrevias }));
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
    await dbx.collection('redes_v2_img').insertMany(p.imagens.map((data, i) => ({ postId: p.id, n: i + 1, hash: p.hashes[i], data })));
    console.log(`${substitui ? 'substituído' : 'enviado'}: ${p.slug} (${p.id})`);
  }
  console.log(`registro: ${caminhoRegistro}`);
}

async function conferir(dbx, pastas, slugs) {
  const alvo = slugs
    ? pastas.filter((p) => slugs.includes(p.slug))
    : pastas.filter((p) => p.meta.status === 'aprovado-checagem');
  let divergentes = 0;
  for (const p of alvo) {
    const banco = await dbx.collection('redes_v2').findOne({ _id: p.id });
    const imgs = banco ? await dbx.collection('redes_v2_img').find({ postId: p.id }).sort({ n: 1 }).toArray() : [];
    const d = conferirPar({
      banco: banco && { status: banco.status, legenda: banco.legenda, dataSugerida: banco.dataSugerida, hashes: imgs.map((i) => i.hash) },
      pasta: { status: p.meta.status, legenda: p.legenda, dataSugerida: p.meta.dataSugerida, hashes: p.hashes },
    });
    if (d.length) divergentes += 1;
    console.log(`${d.length ? 'DIVERGE' : 'OK     '} ${p.slug}${d.length ? ` | ${d.join(' | ')}` : ''}`);
  }
  console.log(`conferidos: ${alvo.length} | divergentes: ${divergentes}`);
  return divergentes;
}

async function reverter(dbx, caminho) {
  const dirBackup = path.dirname(caminho);
  const reg = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  for (const e of reg.inseridos) {
    const atual = await dbx.collection('redes_v2').findOne({ _id: e.id }, { projection: { status: 1 } });
    if (!atual) { console.log(`ausente (nada a desfazer): ${e.slug}`); continue; }
    if (atual.status !== 'aprovado-checagem') { console.log(`NÃO DESFAÇO ${e.slug}: status ${atual.status} (já saiu da fila)`); continue; }
    await dbx.collection('redes_v2_img').deleteMany({ postId: e.id });
    if (e.substituiu) {
      const { doc, imgs } = EJSON.parse(fs.readFileSync(path.join(dirBackup, e.arquivoPrevio), 'utf8'));
      await dbx.collection('redes_v2').replaceOne({ _id: e.id }, doc);
      if (imgs.length) await dbx.collection('redes_v2_img').insertMany(imgs);
      console.log(`restaurado o anterior: ${e.slug} (imagens: ${imgs.length})`);
    } else {
      await dbx.collection('redes_v2').deleteOne({ _id: e.id });
      console.log(`removido: ${e.slug}`);
    }
  }
}

function registroMaisRecente() {
  const pastas = fs.existsSync(DIR_BACKUPS)
    ? fs.readdirSync(DIR_BACKUPS).filter((n) => n.startsWith('envio-seguro-')).sort()
    : [];
  if (!pastas.length) throw new Error('nenhum envio-seguro-* em backups/');
  return path.join(DIR_BACKUPS, pastas[pastas.length - 1], 'registro.json');
}

(async () => {
  const slugs = slugsPedidos();
  if (flag('reverter')) {
    const caminho = valor('registro') || registroMaisRecente();
    console.log(`desfazendo pelo registro: ${caminho}`);
    await db.connect();
    await reverter(mongoose.connection.db, caminho);
    process.exit(0);
  }
  const pastas = lerPastas();
  await db.connect();
  const dbx = mongoose.connection.db;
  if (flag('conferir')) process.exit((await conferir(dbx, pastas, slugs)) ? 1 : 0);
  if (flag('backup') && !flag('aplicar')) { await fazerBackup(dbx); process.exit(0); }

  const plano = planejarEnvio({ pecas: pastas, slugs, agora: new Date() });
  const existentes = new Map();
  for (const p of plano.selecionadas) {
    const ex = await dbx.collection('redes_v2').findOne({ _id: p.id }, { projection: { status: 1 } });
    if (ex) existentes.set(p.id, ex.status);
  }
  const bloqueados = [...existentes].filter(([, st]) => !STATUS_SUBSTITUIVEL.test(st));
  if (!flag('aplicar')) {
    console.log('DRY-RUN: nada foi gravado.');
    mostrarPlano(plano, existentes, slugs);
    if (bloqueados.length) console.log(`ATENÇÃO: já existem com status que não pode ser substituído: ${bloqueados.map(([id, st]) => `${id} (${st})`).join('; ')}`);
    process.exit(0);
  }
  if (slugs && plano.recusadas.length) {
    mostrarPlano(plano, existentes, slugs);
    console.log('ABORTADO: há pedido recusado; nada foi gravado.');
    process.exit(1);
  }
  if (!plano.selecionadas.length) { console.log('ABORTADO: nenhuma peça válida.'); process.exit(1); }
  if (bloqueados.length) {
    mostrarPlano(plano, existentes, slugs);
    console.log(`ABORTADO: já existe com status não substituível: ${bloqueados.map(([id, st]) => `${id} (${st})`).join('; ')}. Nada foi gravado.`);
    process.exit(1);
  }
  const dirBackup = await fazerBackup(dbx);
  await aplicar(dbx, plano, dirBackup, existentes);
  const diverg = await conferir(dbx, pastas, plano.selecionadas.map((p) => p.slug));
  process.exit(diverg ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
