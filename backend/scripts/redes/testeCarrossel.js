/**
 * Teste SUPERVISIONADO do carrossel pela Meta Graph (decisão do Dr. Antônio, 18/10/2026).
 *   node --env-file=.env backend/scripts/redes/testeCarrossel.js [--id=<post>]
 *       PREPARA (não publica): conferência completa do post (mesma do publicador), imagens no Blob com URL pública,
 *       confere cada URL (HTTP 200, imagem, hash igual ao checado) e grava a prévia em relatorios/redes/teste-carrossel/.
 *   node --env-file=.env backend/scripts/redes/testeCarrossel.js --validar [--proximos=7] [--id=<post>]
 *       VALIDA SEM PUBLICAR (ordem do Dr. Antônio, 18/10/2026; substitui o teste supervisionado): para cada post, a conferência completa,
 *       containers dos itens e do carrossel na Graph API até FINISHED (NUNCA chama media_publish; os containers expiram em 24 h),
 *       confere itens (ordem e quantidade), legenda (créditos, link oficial) e grava o resultado em relatorios/redes/validacao-carrosseis.json.
 *   node --env-file=.env backend/scripts/redes/testeCarrossel.js --publicar --ordem="publicar teste de carrossel"
 *       PUBLICA o carrossel preparado. Só com a ordem escrita do Dr. Antônio (texto exato) e com o freio REDES_PUBLICACAO_ATIVA ligado.
 *   node --env-file=.env backend/scripts/redes/testeCarrossel.js --liberar --ordem="liberar carrossel automático"
 *       Depois do teste conferido pelo Dr. Antônio: grava redes_v2_config/instagram.carrosselLiberado=true. Nunca liga sozinho.
 * Reels e Stories continuam SEMPRE na fila manual (roteamento.js). Este script não muda nenhum freio.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const db = require('../../lib/db');
const { conferir } = require('../../lib/redesV2/fila');
const { MIN_CARROSSEL, MAX_CARROSSEL } = require('../../lib/redesV2/roteamento');

const DIR = path.resolve(__dirname, '../../../relatorios/redes/teste-carrossel');
const ESTADO = path.join(DIR, 'estado.json');
const VALIDACAO = path.resolve(__dirname, '../../../relatorios/redes/validacao-carrosseis.json');
const ORDEM_PUBLICAR = 'publicar teste de carrossel';
const ORDEM_LIBERAR = 'liberar carrossel automático';
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const tem = (n) => process.argv.includes(`--${n}`);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const bufferDe = (b) => (b && b.buffer ? Buffer.from(b.buffer) : Buffer.from(b));
const col = (n) => mongoose.connection.db.collection(n);

async function conferirUrl(url, hashEsperado) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const buf = Buffer.from(await r.arrayBuffer());
  const tipo = r.headers.get('content-type') || '';
  const falhas = [];
  if (r.status !== 200) falhas.push(`HTTP ${r.status}`);
  if (!/^image\//.test(tipo)) falhas.push(`content-type ${tipo}`);
  if (sha(buf) !== hashEsperado) falhas.push('hash diferente do checado');
  return falhas;
}

/** Legenda: link só do domínio oficial/perfil, créditos, CVV/SAMU, aviso de IA e assinatura de 3 linhas. */
function falhasDaLegenda(legenda) {
  const f = [];
  for (const u of legenda.match(/https?:\/\/[^\s)]+/g) || []) if (!/^https?:\/\/(www\.drantoniofelipemedico\.com\.br|instagram\.com\/doutor\.antoniofelipe\.smental)/.test(u)) f.push(`link fora do domínio oficial: ${u.slice(0, 60)}`);
  if (!/Portal de Saúde Mental Doutor Antônio Felipe Garabito/.test(legenda)) f.push('sem o crédito do Portal');
  if (!/CVV 188 · SAMU 192/.test(legenda)) f.push('sem CVV 188 · SAMU 192');
  if (!/Resolução CFM 2\.454\/2026/.test(legenda)) f.push('sem o aviso de IA (CFM 2.454/2026)');
  if (!/Dr\. Antônio Felipe · Médico · CRM-BA 41322/.test(legenda)) f.push('sem a assinatura de 3 linhas');
  if (/#psiquiatria|(sou|médico|Dr\. Antônio Felipe[^\n]{0,40}) psiquiatra/i.test(legenda)) f.push('"psiquiatra" como título / #psiquiatria');
  return f;
}

/** Valida UM post sem publicar. Devolve { id, ok, falhas, itens, container }. */
async function validarPost(post) {
  const falhas = [];
  const imgs = await col('redes_v2_img').find({ postId: post._id }).sort({ n: 1 }).toArray();
  if (imgs.length < MIN_CARROSSEL || imgs.length > MAX_CARROSSEL) falhas.push(`o carrossel precisa de ${MIN_CARROSSEL} a ${MAX_CARROSSEL} imagens (tem ${imgs.length})`);
  imgs.forEach((im, i) => { if (im.n !== i + 1) falhas.push(`imagem fora de ordem (posição ${i + 1} = tela ${im.n})`); });
  // mesma conferência do publicador; "texto ainda não está no ar" é esperado para posts futuros (o publicador espera o texto sair)
  const art = await col('artigos').findOne({ slug: post.slug }, { projection: { publicado: 1, agendamento: 1 } });
  for (const p of await conferir(post)) {
    if (/texto de origem ainda não está no ar/.test(p) && art && !art.publicado) continue;
    falhas.push(p);
  }
  if (!art) falhas.push('texto de origem inexistente no banco');
  else if (!art.publicado && !(art.agendamento && art.agendamento.agendado)) falhas.push('texto de origem não publicado nem agendado');
  falhas.push(...falhasDaLegenda(post.legenda));
  const BASE = process.env.SITE_BASE_URL || 'https://www.drantoniofelipemedico.com.br';
  const imagensUrls = imgs.map((im) => `${BASE}/api/redes-v2/img/${post._id}/${im.n}.png`);
  for (const [i, u] of imagensUrls.entries()) { const f = await conferirUrl(u, post.checagem.hashes[i]); if (f.length) falhas.push(`URL pública da imagem ${i + 1}: ${f.join('; ')}`); }
  let itens = 0, container = null;
  if (!falhas.length) {
    try {
      const r = await require('../../lib/socialPublisher').validarCarrosselNoInstagram({ imagensUrls, legenda: post.legenda, alts: post.alts });
      itens = r.itens; container = r.container;
      if (r.itens !== imgs.length) falhas.push(`itens no container ${r.itens} (esperado ${imgs.length})`);
    } catch (e) { falhas.push(`Graph API: ${e.message}`); }
  }
  return { id: post._id, titulo: post.titulo, data: post.dataSugerida, ok: !falhas.length, falhas, itens, container, status: falhas.length ? 'FALHOU' : 'FINISHED', publicado: false };
}

async function validar() {
  const id = arg('id');
  const n = Number(arg('proximos') || 7);
  const filtro = { status: { $in: ['aprovado-checagem', 'fila-manual'] }, ...(id ? { _id: id } : {}) };
  const posts = await col('redes_v2').find(filtro).sort({ dataSugerida: 1 }).limit(id ? 1 : n).toArray();
  if (!posts.length) throw new Error('nenhum post para validar');
  const resultados = [];
  for (const p of posts) { const r = await validarPost(p); resultados.push(r); console.log(`${r.ok ? 'OK    ' : 'FALHOU'} ${r.id} · ${r.itens} itens${r.falhas.length ? ' · ' + r.falhas.join(' | ').slice(0, 300) : ''}`); }
  const geral = { validadoEm: new Date().toISOString(), total: resultados.length, aprovados: resultados.filter((r) => r.ok).length, todosOk: resultados.every((r) => r.ok), publicouAlgo: false, resultados };
  fs.mkdirSync(path.dirname(VALIDACAO), { recursive: true });
  fs.writeFileSync(VALIDACAO, JSON.stringify(geral, null, 1), 'utf8');
  console.log(JSON.stringify({ validados: geral.total, aprovados: geral.aprovados, todosOk: geral.todosOk, publicouAlgo: false, arquivo: path.relative(process.cwd(), VALIDACAO) }, null, 1));
}

async function preparar() {
  const id = arg('id');
  const filtro = { status: 'aprovado-checagem', ...(id ? { _id: id } : {}) };
  const post = (await col('redes_v2').find(filtro).sort({ dataSugerida: 1 }).limit(1).toArray())[0];
  if (!post) throw new Error('nenhum post aprovado-checagem encontrado');
  const imgs = await col('redes_v2_img').find({ postId: post._id }).sort({ n: 1 }).toArray();
  if (imgs.length < MIN_CARROSSEL || imgs.length > MAX_CARROSSEL) throw new Error(`o carrossel precisa de ${MIN_CARROSSEL} a ${MAX_CARROSSEL} imagens (tem ${imgs.length})`);
  const problemas = await conferir(post); // hash, marca d'água, texto no ar, auditoria do texto, ética da legenda
  if (problemas.length) throw new Error(`post reprovado na conferência: ${problemas.join(' | ')}`);
  if (!process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no ambiente');
  const BASE_API = process.env.BOT_API_BASE || 'https://drsaudemental.vercel.app';
  const urls = [];
  for (const im of imgs) {
    // mesma rota do bot de mídias: grava no Blob de produção (redes/<slug>/<nome>.png) e devolve a URL pública
    const r = await fetch(`${BASE_API}/api/admin/redes-midia/teste-${post._id}/tela-${im.n}`, { method: 'PUT', headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'image/png' }, body: bufferDe(im.data) });
    const corpo = await r.json().catch(() => ({}));
    if (!r.ok || !corpo.url) throw new Error(`upload da imagem ${im.n} falhou (HTTP ${r.status}: ${corpo.erro || ''})`);
    const falhas = await conferirUrl(corpo.url, post.checagem.hashes[im.n - 1]);
    if (falhas.length) throw new Error(`imagem ${im.n} no Blob: ${falhas.join('; ')}`);
    urls.push(corpo.url);
  }
  fs.mkdirSync(DIR, { recursive: true });
  const estado = { id: post._id, titulo: post.titulo, slug: post.slug, preparadoEm: new Date().toISOString(), imagens: urls, hashes: post.checagem.hashes, legenda: post.legenda, alts: post.alts, publicado: false };
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 1), 'utf8');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  fs.writeFileSync(path.join(DIR, 'PREVIA.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia do carrossel de teste</title><style>body{font:16px/1.5 system-ui;max-width:1100px;margin:0 auto;padding:16px}.g{display:flex;gap:12px;overflow:auto}img{width:270px;height:auto;border:1px solid #ccc;border-radius:8px}pre{white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:8px}</style></head><body><h1>Carrossel de teste (NÃO publicado)</h1><p>${esc(post.titulo)} · ${urls.length} imagens · aprovado na conferência completa</p><div class="g">${urls.map((u, i) => `<img src="${esc(u)}" alt="${esc(post.alts?.[i] || `Tela ${i + 1}`)}">`).join('')}</div><h2>Legenda</h2><pre>${esc(post.legenda)}</pre><p>Para publicar, a ordem escrita é: <b>${ORDEM_PUBLICAR}</b></p></body></html>`, 'utf8');
  console.log(JSON.stringify({ preparado: true, id: post._id, imagens: urls.length, previa: path.relative(process.cwd(), path.join(DIR, 'PREVIA.html')), publicado: false }, null, 1));
}

async function publicar() {
  if (arg('ordem') !== ORDEM_PUBLICAR) throw new Error(`sem a ordem escrita do Dr. Antônio ("${ORDEM_PUBLICAR}"): nada publicado`);
  const e = JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
  if (e.publicado) throw new Error('o teste já foi publicado');
  const post = await col('redes_v2').findOne({ _id: e.id });
  if (!post || post.status !== 'aprovado-checagem') throw new Error(`post ${e.id} não está aprovado-checagem (status ${post && post.status})`);
  const problemas = await conferir(post);
  if (problemas.length) throw new Error(`post reprovado na conferência: ${problemas.join(' | ')}`);
  for (let i = 0; i < e.imagens.length; i += 1) { const f = await conferirUrl(e.imagens[i], e.hashes[i]); if (f.length) throw new Error(`imagem ${i + 1} no Blob: ${f.join('; ')}`); }
  const sp = require('../../lib/socialPublisher'); // exige o freio REDES_PUBLICACAO_ATIVA ligado
  const r = await sp.publicarCarrosselNoInstagram({ imagensUrls: e.imagens, legenda: post.legenda, alts: post.alts });
  await col('redes_v2').updateOne({ _id: post._id }, { $set: { status: 'publicado', publicadoEm: new Date(), instagramId: r.id || null, publicadoVia: 'teste-carrossel' } });
  await col('redes_v2_config').updateOne({ _id: 'instagram' }, { $set: { testeCarrosselEm: new Date(), testeCarrosselId: post._id, testeCarrosselInstagramId: r.id || null } }, { upsert: true });
  fs.writeFileSync(ESTADO, JSON.stringify({ ...e, publicado: true, publicadoEm: new Date().toISOString(), instagramId: r.id || null, permalink: r.permalink || null }, null, 1), 'utf8');
  console.log(JSON.stringify({ publicado: true, id: r.id, permalink: r.permalink || null }, null, 1));
}

async function liberar() {
  if (arg('ordem') !== ORDEM_LIBERAR) throw new Error(`sem a ordem escrita do Dr. Antônio ("${ORDEM_LIBERAR}"): nada alterado`);
  // ordem de 18/10/2026: a validação sem publicar (--validar) substitui o teste supervisionado; só libera se TODOS os posts validados passaram
  let v = null; try { v = JSON.parse(fs.readFileSync(VALIDACAO, 'utf8')); } catch { /* sem validação */ }
  const cfg = await col('redes_v2_config').findOne({ _id: 'instagram' });
  const testePublicado = Boolean(cfg && cfg.testeCarrosselEm);
  if (!testePublicado && !(v && v.todosOk && v.total >= 1 && v.publicouAlgo === false)) throw new Error('sem validação aprovada em todos os posts (--validar) nem teste publicado: carrossel continua não liberado');
  if (v && !v.todosOk) throw new Error('a última validação teve post reprovado: não libero');
  const resumo = v ? { validacaoEm: v.validadoEm, validados: v.total, aprovados: v.aprovados } : null;
  await col('redes_v2_config').updateOne({ _id: 'instagram' }, { $set: { carrosselLiberado: true, liberadoEm: new Date(), validacao: resumo } }, { upsert: true });
  const lido = await col('redes_v2_config').findOne({ _id: 'instagram' });
  console.log(JSON.stringify({ carrosselLiberado: lido.carrosselLiberado === true, liberadoEm: lido.liberadoEm, validacao: lido.validacao || null }, null, 1));
}

(async () => {
  await db.connect();
  if (tem('liberar')) await liberar(); else if (tem('publicar')) await publicar(); else if (tem('validar')) await validar(); else await preparar();
  process.exit(0);
})().catch((e) => { console.error(`ERRO: ${e.message}`); process.exit(2); });
