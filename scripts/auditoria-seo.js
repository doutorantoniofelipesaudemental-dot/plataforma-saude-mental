#!/usr/bin/env node
/**
 * Auditoria de SEO dos artigos pré-renderizados (CLAUDE.md, Seção 19).
 *
 *   npm run auditoria:seo                       produção (https://drsaudemental.vercel.app)
 *   AUDITORIA_BASE_URL=http://localhost:3000 npm run auditoria:seo
 *
 * Lê o HTML REAL de /artigo/:slug (o que o Google recebe, sem JS) e confere:
 *   - title com o sufixo da marca; meta description limpa (sem HTML, marcador
 *     estrutural, entidade quebrada, "undefined"/"null") e com 50–170 caracteres;
 *   - canonical = og:url = https://drsaudemental.vercel.app/artigo/<slug>, exato;
 *   - og:image absoluta, igual à imagemCapa do artigo, respondendo imagem 1200×630;
 *   - JSON-LD válido com MedicalWebPage;
 *   - links internos: /artigo/<slug> tem de existir; /blog?categoria= tem de ser
 *     categoria real; demais caminhos internos têm de responder 200.
 * Sai com código 1 se houver falha. Só lê: não altera nada.
 */
const sharp = require('sharp');

const BASE = (process.env.AUDITORIA_BASE_URL || 'https://drsaudemental.vercel.app').replace(/\/+$/, '');
const CANONICO = 'https://drsaudemental.vercel.app';
const SUFIXO_TITULO = '— Saúde Mental · Doutor Antônio Felipe';
const CONCORRENCIA = 8;

const decodificar = (s) =>
  String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const meta = (html, atributo, nome) => {
  const re = new RegExp(`<meta[^>]+${atributo}="${nome}"[^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag ? decodificar(tag.match(/content="([^"]*)"/i)?.[1]) : null;
};

/**
 * Problemas de uma meta description (pura — testável). Longa demais é AVISO,
 * não falha: o Google corta em ~155–160 caracteres no resultado, não penaliza.
 */
function problemasDescricao(d) {
  if (!d) return { falhas: ['meta description ausente'], avisos: [] };
  const p = [];
  const avisos = [];
  const n = [...d].length;
  if (n < 50) p.push(`meta description curta demais (${n} caracteres, mín. 50)`);
  if (n > 170) avisos.push(`meta description com ${n} caracteres — cortada no Google (~160)`);
  if (/<[a-z/][^>]*>/i.test(d)) p.push('meta description com HTML');
  if (/\*\*|^\s*(slide|item)\s*\d+\s*[-:]/i.test(d)) p.push('meta description com marcador estrutural');
  if (/&(amp|lt|gt|quot|#\d+);/i.test(d)) p.push('meta description com entidade HTML dupla');
  if (/\b(undefined|null|NaN)\b/.test(d)) p.push('meta description com valor vazio de código');
  return { falhas: p, avisos };
}

async function emLotes(itens, fn) {
  const saida = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCORRENCIA }, async () => {
      while (i < itens.length) {
        const k = i++;
        saida[k] = await fn(itens[k]);
      }
    })
  );
  return saida;
}

async function main() {
  const artigos = [];
  for (let p = 1; ; p++) {
    const r = await (await fetch(`${BASE}/api/artigos?limite=24&pagina=${p}`)).json();
    artigos.push(...r.itens);
    if (p >= r.paginacao.paginas) break;
  }
  const slugs = new Set(artigos.map((a) => a.slug));
  const categorias = new Set(((await (await fetch(`${BASE}/api/artigos/categorias`)).json()).categorias || []).map((c) => c.nome));
  console.log(`\n  Auditoria de SEO · ${BASE} · ${artigos.length} artigos · ${categorias.size} categorias\n`);

  const imagens = new Map(); // url → Promise<{ok, largura, altura, tipo}>
  const conferirImagem = (url) => {
    if (!imagens.has(url)) {
      imagens.set(
        url,
        (async () => {
          const r = await fetch(url);
          if (!r.ok) return { ok: false, motivo: `HTTP ${r.status}` };
          const m = await sharp(Buffer.from(await r.arrayBuffer())).metadata();
          return { ok: true, largura: m.width, altura: m.height, tipo: r.headers.get('content-type') };
        })().catch((e) => ({ ok: false, motivo: e.message }))
      );
    }
    return imagens.get(url);
  };

  const linksInternos = new Map(); // caminho → [slugs de origem]
  const falhas = [];
  const avisos = [];
  const descricoes = new Map();

  await emLotes(artigos, async (a) => {
    const falhar = (m) => falhas.push(`${a.slug}: ${m}`);
    const r = await fetch(`${BASE}/artigo/${a.slug}`);
    if (!r.ok) return falhar(`HTTP ${r.status}`);
    const html = await r.text();
    if (!/<article[^>]*data-ssr="1"/.test(html)) falhar('sem data-ssr (corpo não pré-renderizado)');

    const titulo = decodificar(html.match(/<title>([^<]*)<\/title>/i)?.[1]);
    if (!titulo) falhar('sem <title>');
    else if (!titulo.endsWith(SUFIXO_TITULO)) falhar(`title sem o sufixo da marca: "${titulo.slice(-50)}"`);

    const descricao = meta(html, 'name', 'description');
    const pd = problemasDescricao(descricao);
    pd.falhas.forEach(falhar);
    pd.avisos.forEach((m) => avisos.push(`${a.slug}: ${m}`));
    if (descricao) (descricoes.get(descricao) || descricoes.set(descricao, []).get(descricao)).push(a.slug);

    const esperado = `${CANONICO}/artigo/${a.slug}`;
    const canonical = decodificar(html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i)?.[1] || html.match(/<link[^>]+href="([^"]*)"[^>]*rel="canonical"/i)?.[1]);
    if (canonical !== esperado) falhar(`canonical "${canonical}" ≠ "${esperado}"`);
    const ogUrl = meta(html, 'property', 'og:url');
    if (ogUrl !== esperado) falhar(`og:url "${ogUrl}" ≠ canonical`);
    if (!meta(html, 'property', 'og:title')) falhar('sem og:title');
    if (!meta(html, 'property', 'og:description')) falhar('sem og:description');

    const ogImage = meta(html, 'property', 'og:image');
    if (!ogImage) falhar('sem og:image');
    else {
      if (!/^https:\/\//.test(ogImage)) falhar(`og:image não é URL https absoluta: ${ogImage}`);
      if (a.imagemCapa && ogImage !== a.imagemCapa) falhar('og:image diferente da imagemCapa do artigo');
      const img = await conferirImagem(ogImage);
      if (!img.ok) falhar(`og:image não carrega (${img.motivo})`);
      else if (img.largura !== 1200 || img.altura !== 630) falhar(`og:image ${img.largura}×${img.altura} (esperado 1200×630)`);
    }

    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
    try {
      const j = JSON.parse(ld || 'null');
      const tipos = [].concat(j?.['@type'] || []);
      if (!tipos.includes('MedicalWebPage')) falhar('JSON-LD sem @type MedicalWebPage');
    } catch {
      falhar('JSON-LD ausente ou inválido');
    }

    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      let h = decodificar(m[1]);
      if (h.startsWith(CANONICO)) h = h.slice(CANONICO.length) || '/';
      if (!h.startsWith('/') || h.startsWith('//') || h.startsWith('/assets/')) continue;
      const caminho = h.split('#')[0] || '/';
      (linksInternos.get(caminho) || linksInternos.set(caminho, []).get(caminho)).push(a.slug);
    }
  });

  // Links internos: artigos e categorias pela lista real; o resto por HTTP.
  const caminhos = [...linksInternos.keys()];
  await emLotes(caminhos, async (caminho) => {
    const origem = linksInternos.get(caminho);
    const onde = `${origem.length} página(s), ex.: ${origem[0]}`;
    const artigo = caminho.match(/^\/artigo\/([^/?#]+)\/?$/);
    if (artigo) {
      if (!slugs.has(decodeURIComponent(artigo[1]))) falhas.push(`link quebrado ${caminho} (${onde})`);
      return;
    }
    const url = new URL(caminho, BASE);
    const cat = url.pathname.replace(/\/$/, '') === '/blog' ? url.searchParams.get('categoria') : null;
    if (cat !== null && cat !== '' && !categorias.has(cat)) falhas.push(`categoria inexistente "${cat}" em ${caminho} (${onde})`);
    const r = await fetch(url, { redirect: 'manual' });
    if (r.status >= 400) falhas.push(`link interno ${caminho} → HTTP ${r.status} (${onde})`);
  });

  const duplicadas = [...descricoes.values()].filter((l) => l.length > 1);
  const imgs = [...imagens.values()];
  const dimsOk = (await Promise.all(imgs)).filter((i) => i.ok && i.largura === 1200 && i.altura === 630).length;
  console.log(`  og:image únicas conferidas: ${imgs.length} (${dimsOk} em 1200×630)`);
  console.log(`  links internos distintos conferidos: ${caminhos.length}`);
  console.log(`  meta descriptions repetidas entre artigos: ${duplicadas.length}${duplicadas.length ? ` (ex.: ${duplicadas[0].slice(0, 3).join(', ')})` : ''}`);
  if (avisos.length) console.log(`  ⚠️  ${avisos.length} aviso(s): meta description acima de 170 caracteres (o Google corta; não é erro). Liste com AUDITORIA_AVISOS=1.`);
  if (process.env.AUDITORIA_AVISOS) avisos.sort().forEach((m) => console.log(`     · ${m}`));
  if (falhas.length) {
    console.log(`\n  ❌ ${falhas.length} falha(s):`);
    falhas.sort().forEach((f) => console.log(`     - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('\n  ✅ Nenhuma falha: title, description, canonical, og:*, JSON-LD e links internos em ordem.');
  }
  console.log('');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n  Falha:', err.message, '\n');
    process.exit(1);
  });
}

module.exports = { problemasDescricao };
