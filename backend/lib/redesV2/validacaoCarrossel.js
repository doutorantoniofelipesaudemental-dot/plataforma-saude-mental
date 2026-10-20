/**
 * Validação de UM carrossel pela Graph API SEM publicar (ordem 18/10/2026; usada pelo teste supervisionado e pelo diagnóstico da Vercel, 20/10/2026).
 * Nunca publica: só confere o post, as URLs públicas das imagens e cria os containers até FINISHED (expiram em 24 h).
 */
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { conferir } = require('./fila');
const { MIN_CARROSSEL, MAX_CARROSSEL } = require('./roteamento');

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
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


async function validarPostNoInstagram(post) {
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

/** Próximo post da fila (o mais cedo a partir de agora) para o diagnóstico. null se não houver. */
async function proximoPostParaDiagnostico(agora = new Date()) {
  return col('redes_v2').findOne({ status: { $in: ['aprovado-checagem', 'fila-manual'] }, dataSugerida: { $gte: agora } }, { sort: { dataSugerida: 1 } });
}

module.exports = { validarPostNoInstagram, proximoPostParaDiagnostico, falhasDaLegenda, conferirUrl };
