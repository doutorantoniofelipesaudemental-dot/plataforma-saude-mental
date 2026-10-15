/**
 * Fila NOVA de redes no banco (coleções redes_v2, redes_v2_img, redes_v2_log, redes_v2_relatorios).
 * - enviarParaBanco: sobe os posts aprovados na checagem (conteudo/redes-v2/) com as imagens e os hashes;
 * - publicarDevidos: publica 1 post por execução, SEM pedir autorização, mas só se TUDO bater de novo
 *   (status aprovado-checagem, hash de cada imagem, sem marca d'água, texto do site no ar, auditoria do texto,
 *   freio REDES_PUBLICACAO_ATIVA). Qualquer divergência → não publica e registra no log.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { redesAtivas } = require('../freioRedes');
const { checarTexto } = require('../auditoriaTexto');
const { checarEticaCfm, checarImagemSemMarcaDagua } = require('../checagensAprovacao');

const RAIZ = path.resolve(__dirname, '../../..');
const BASE_SITE = () => process.env.SITE_BASE_URL || 'https://drantoniofelipemedico.com.br';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const col = (n) => mongoose.connection.db.collection(n);
const bufferDe = (b) => (b && b.buffer ? Buffer.from(b.buffer) : Buffer.from(b));

async function log(nivel, postId, mensagem, extra = {}) {
  await col('redes_v2_log').insertOne({ em: new Date(), nivel, postId, mensagem, ...extra });
}

async function enviarParaBanco(dirBase = path.join(RAIZ, 'conteudo/redes-v2')) {
  const r = { enviados: 0, ignorados: 0, falhas: [] };
  for (const nome of fs.readdirSync(dirBase)) {
    const dir = path.join(dirBase, nome);
    if (nome === 'revisar' || !fs.existsSync(path.join(dir, 'meta.json'))) continue;
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    if (meta.status !== 'aprovado-checagem') { r.ignorados += 1; continue; }
    const existente = await col('redes_v2').findOne({ _id: meta.id }, { projection: { status: 1 } });
    if (existente && existente.status === 'publicado') { r.ignorados += 1; continue; }
    const imagens = [];
    let divergiu = false;
    for (let i = 0; i < meta.checagem.hashes.length; i += 1) {
      const buf = fs.readFileSync(path.join(dir, `tela-${i + 1}.png`));
      if (sha(buf) !== meta.checagem.hashes[i]) { r.falhas.push(`${meta.id}: imagem ${i + 1} diferente da checada`); divergiu = true; break; }
      imagens.push(buf);
    }
    if (divergiu) continue;
    const legenda = fs.readFileSync(path.join(dir, 'legenda.txt'), 'utf8');
    const alts = fs.readFileSync(path.join(dir, 'alt.txt'), 'utf8').split('\n').map((l) => l.replace(/^\d+\.\s*/, ''));
    await col('redes_v2').replaceOne({ _id: meta.id }, { _id: meta.id, ...meta, dataSugerida: new Date(meta.dataSugerida), legenda, alts, status: 'aprovado-checagem', enviadoEm: new Date() }, { upsert: true });
    await col('redes_v2_img').deleteMany({ postId: meta.id });
    await col('redes_v2_img').insertMany(imagens.map((data, i) => ({ postId: meta.id, n: i + 1, hash: meta.checagem.hashes[i], data })));
    r.enviados += 1;
  }
  return r;
}

async function imagemPublica(id, n) {
  const d = await col('redes_v2_img').findOne({ postId: id, n: +n });
  return d ? { buffer: bufferDe(d.data), hash: d.hash } : null;
}

/** Confere tudo de novo antes de publicar. Devolve a lista de problemas (vazia = pode publicar). */
async function conferir(post) {
  const problemas = [];
  if (post.status !== 'aprovado-checagem') problemas.push(`status ${post.status} (esperado aprovado-checagem)`);
  const imgs = await col('redes_v2_img').find({ postId: post._id }).sort({ n: 1 }).toArray();
  if (imgs.length !== post.checagem.hashes.length) problemas.push('quantidade de imagens diferente da checada');
  for (const im of imgs) {
    const buf = bufferDe(im.data);
    if (sha(buf) !== post.checagem.hashes[im.n - 1]) { problemas.push(`imagem ${im.n}: hash diferente do checado`); continue; }
    const m = await checarImagemSemMarcaDagua(buf);
    if (!m.ok) problemas.push(`imagem ${im.n}: marca d'água/ruído (${m.falhas.join('; ')})`);
  }
  const art = await col('artigos').findOne({ slug: post.slug });
  if (!art || !art.publicado) problemas.push('texto de origem ainda não está no ar no site');
  else {
    for (const f of checarTexto({ origem: 'mongo', slug: art.slug, titulo: art.titulo, resumo: art.resumo, tempoLeitura: art.tempoLeitura, corpo: art.conteudo })) problemas.push(`auditoria do texto: ${f.msg}`);
  }
  for (const f of checarEticaCfm(post.legenda, { contexto: 'social' }).falhas) problemas.push(`legenda: ${f}`);
  return problemas;
}

async function publicarDevidos({ agora = new Date(), simular = false } = {}) {
  if (!redesAtivas()) return { publicado: false, motivo: 'REDES_PUBLICACAO_ATIVA=false (freio de emergência)' };
  const devidos = await col('redes_v2').find({ status: 'aprovado-checagem', dataSugerida: { $lte: agora } }).toArray();
  if (!devidos.length) return { publicado: false, motivo: 'nenhum post devido' };
  // critério de engajamento: entre os devidos, o texto mais lido primeiro (empate: o mais antigo)
  const lidosDocs = await col('artigos').find({ slug: { $in: devidos.map((d) => d.slug) } }, { projection: { slug: 1, visualizacoes: 1 } }).toArray();
  const lidos = new Map(lidosDocs.map((a) => [a.slug, a.visualizacoes || 0]));
  devidos.sort((a, b) => (lidos.get(b.slug) || 0) - (lidos.get(a.slug) || 0) || a.dataSugerida - b.dataSugerida);
  const bloqueados = [];
  for (const post of devidos) {
    const problemas = await conferir(post);
    if (problemas.length) { bloqueados.push({ id: post._id, problemas }); if (!simular) await log('bloqueado', post._id, problemas.join(' | ')); continue; }
    const imagensUrls = post.checagem.hashes.map((_, i) => `${BASE_SITE()}/api/redes-v2/img/${post._id}/${i + 1}.png`);
    if (simular) return { publicado: false, simulado: true, publicaria: post._id, imagensUrls, bloqueados };
    if (!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID)) { await log('bloqueado', post._id, 'sem credencial do Instagram'); return { publicado: false, motivo: 'sem credencial do Instagram', bloqueados }; }
    try {
      const { publicarCarrosselNoInstagram } = require('../socialPublisher');
      const r = await publicarCarrosselNoInstagram({ imagensUrls, legenda: post.legenda, alts: post.alts });
      await col('redes_v2').updateOne({ _id: post._id }, { $set: { status: 'publicado', publicadoEm: new Date(), instagramId: r.id || null } });
      await log('publicado', post._id, `Instagram ${r.id || ''}`);
      return { publicado: true, id: post._id, instagramId: r.id || null, bloqueados };
    } catch (e) {
      await log('erro', post._id, e.message);
      return { publicado: false, motivo: `erro ao publicar: ${e.message}`, id: post._id, bloqueados };
    }
  }
  return { publicado: false, motivo: 'todos os posts devidos foram bloqueados na conferência', bloqueados };
}

async function previaHtml({ dias = 14, agora = new Date() } = {}) {
  const ate = new Date(agora.getTime() + dias * 86400e3);
  const posts = await col('redes_v2').find({ dataSugerida: { $lte: ate } }, { projection: { legenda: 1, slug: 1, titulo: 1, status: 1, dataSugerida: 1, publico: 1, telas: 1 } }).sort({ dataSugerida: 1 }).limit(40).toArray();
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cartoes = posts.map((p) => `<article><img src="/api/redes-v2/img/${esc(p._id)}/1.png" alt="Capa de ${esc(p.titulo)}" loading="lazy" width="270"><div><p class="d">${new Date(p.dataSugerida).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'full', timeStyle: 'short' })}</p><h2>${esc(p.titulo)}</h2><p>${esc(p.publico)} · ${p.telas} telas · <b class="s-${esc(p.status)}">${esc(p.status)}</b></p><pre>${esc(p.legenda.split('\n').slice(0, 6).join('\n'))}…</pre></div></article>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia das redes</title><style>body{font:16px/1.5 system-ui;margin:0;background:#0b1f3a;color:#fff;padding:16px}h1{font-size:1.2rem}article{display:flex;gap:16px;background:#13315c;border-radius:12px;padding:12px;margin:12px 0}img{border-radius:8px;height:auto}.d{color:#d4af37;margin:0}h2{font-size:1rem;margin:.2rem 0}pre{white-space:pre-wrap;font:inherit;color:#d8e1f0}.s-publicado{color:#7fdc9b}.s-aprovado-checagem{color:#d4af37}</style></head><body><h1>Prévia — próximos ${dias} dias (só para acompanhar, não para aprovar)</h1>${cartoes || '<p>Nada na fila.</p>'}</body></html>`;
}

module.exports = { enviarParaBanco, publicarDevidos, conferir, imagemPublica, previaHtml, log };
