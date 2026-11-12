/**
 * Envio SEGURO à fila de redes (redes_v2). Não altera enviarFila.js.
 * Padrão = DRY-RUN (só lista; não grava). Flags:
 *   --slugs=a,b,c   envia só essas pastas (nome da pasta em conteudo/redes-v2)
 *   --backup        copia redes_v2 para backups/envio-seguro-<data>/ (EJSON)
 *   --aplicar       faz backup e grava (substitui SÓ descartado-*; guarda o anterior)
 *   --conferir      compara banco x pasta; só leitura (sai com 1 se houver divergência)
 *   --reverter      desfaz o registrado (o mais recente, ou --registro=CAMINHO)
 * Dados ignorados pelo Git (conteudo, backups) ficam na pasta principal; DRS_RAIZ_DADOS aponta para lá.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const db = require('../../lib/db');
const { planejarEnvio, paraData } = require('../../lib/redesV2/envioSeguro');
const banco = require('../../lib/redesV2/envioSeguroBanco');

const RAIZ = process.env.DRS_RAIZ_DADOS || path.resolve(__dirname, '../../..');
const DIR_CONTEUDO = path.join(RAIZ, 'conteudo/redes-v2');
const DIR_BACKUPS = path.join(RAIZ, 'backups');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const valor = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const carimbo = () => new Date().toISOString().replace(/[:.]/g, '-');

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
    for (const l of await banco.reverter(mongoose.connection.db, caminho)) console.log(l);
    process.exit(0);
  }
  const pastas = lerPastas();
  await db.connect();
  const dbx = mongoose.connection.db;
  if (flag('conferir')) {
    const r = await banco.conferir(dbx, pastas, slugs);
    for (const l of r.linhas) console.log(l);
    console.log(`conferidos: ${r.conferidos} | divergentes: ${r.divergentes}`);
    process.exit(r.divergentes ? 1 : 0);
  }
  if (flag('backup') && !flag('aplicar')) {
    const b = await banco.fazerBackup(dbx, DIR_BACKUPS, carimbo());
    console.log(`backup: ${b.dir} (redes_v2: ${b.documentos}; redes_v2_img: ${b.imagens} registros de hash)`);
    process.exit(0);
  }

  const plano = planejarEnvio({ pecas: pastas, slugs, agora: new Date() });
  const existentes = new Map();
  for (const p of plano.selecionadas) {
    const ex = await dbx.collection('redes_v2').findOne({ _id: p.id }, { projection: { status: 1 } });
    if (ex) existentes.set(p.id, ex.status);
  }
  const bloqueados = banco.bloqueadosPorStatus(existentes);
  if (!flag('aplicar')) {
    console.log('DRY-RUN: nada foi gravado.');
    mostrarPlano(plano, existentes, slugs);
    if (bloqueados.length) console.log(`ATENÇÃO: não substituível: ${bloqueados.map(([id, st]) => `${id} (${st})`).join('; ')}`);
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
    console.log(`ABORTADO: status não substituível: ${bloqueados.map(([id, st]) => `${id} (${st})`).join('; ')}. Nada foi gravado.`);
    process.exit(1);
  }
  const b = await banco.fazerBackup(dbx, DIR_BACKUPS, carimbo());
  console.log(`backup: ${b.dir}`);
  const registro = await banco.aplicar(dbx, plano, b.dir, existentes);
  console.log(`registro: ${registro}`);
  const r = await banco.conferir(dbx, pastas, plano.selecionadas.map((p) => p.slug));
  for (const l of r.linhas) console.log(l);
  console.log(`conferidos: ${r.conferidos} | divergentes: ${r.divergentes}`);
  process.exit(r.divergentes ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
