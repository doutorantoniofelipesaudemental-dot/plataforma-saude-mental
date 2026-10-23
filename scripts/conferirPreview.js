/**
 * Confere o preview de um deploy protegido pela Vercel (ordem de 21/10/2026, PR #138).
 *   node scripts/conferirPreview.js <url-do-preview> [relatorio.md]
 * Usa VERCEL_AUTOMATION_BYPASS_SECRET do .env, carregado por scripts/carregarEnv.js. A chave nunca é impressa
 * nem gravada: só o nome da variável aparece no relatório. Só leitura: não publica nem altera nada.
 * Confere: 24 caminhos de texto com HTTP 200 e conteúdo real; páginas principais; CSS, JS, imagens e áudio referenciados.
 */
const path = require('node:path');
const fs = require('node:fs');
const { carregarEnv } = require('./carregarEnv');

const RAIZ = path.resolve(__dirname, '..');
const TIMEOUT_MS = 30000;
const PRINCIPAIS = ['/', '/links', '/blog', '/mentoria', '/privacidade'];

// Função pura: os 24 caminhos (artigos e blog) que hoje dão 404 no www e são servidos pelo app antigo.
function caminhosDoDominio(lerDir = fs.readdirSync, dirs = null) {
  const pastas = dirs || [
    [path.join(RAIZ, 'apps/plataforma-saude-mental/src/content/artigos'), 'artigo'],
    [path.join(RAIZ, 'apps/plataforma-saude-mental/content/blog'), 'blog'],
  ];
  const lista = new Set(JSON.parse(fs.readFileSync(path.join(RAIZ, 'apps/plataforma-saude-mental/app/slugsDominioPrincipal.js'), 'utf8').match(/new Set\((\[[\s\S]*?\])\)/)[1].replace(/'/g, '"')));
  const caminhos = [];
  for (const [dir, tipo] of pastas) {
    for (const f of lerDir(dir).filter((n) => /\.mdx?$/.test(n))) {
      const slug = f.replace(/\.mdx?$/, '');
      if (!lista.has(slug)) caminhos.push({ tipo, slug, caminho: tipo === 'artigo' ? `/artigo/${slug}` : `/blog/${slug}` });
    }
  }
  return caminhos;
}

// Função pura: lê do HTML os recursos que a página precisa para funcionar.
function recursosDoHtml(html) {
  const pegar = (re) => [...new Set([...html.matchAll(re)].map((m) => m[1]))];
  return {
    css: pegar(/<link[^>]+href="(\/_next\/static\/[^"]+\.css)"/g),
    js: pegar(/<script[^>]+src="(\/_next\/static\/[^"]+\.js)"/g),
    imagens: pegar(/<img[^>]+src="(\/[^"]+)"/g),
    audios: pegar(/<(?:audio|source)[^>]+src="([^"]+)"/g),
  };
}

// Função pura: a resposta é a página de verdade (não a tela de login da Vercel nem um redirecionamento).
function paginaValida(status, html) {
  if (status !== 200) return { ok: false, motivo: `status ${status}` };
  if (/vercel\.com\/sso|Authentication Required|Deployment Protection/i.test(html)) return { ok: false, motivo: 'tela de proteção da Vercel' };
  if (!/<html/i.test(html) || html.length < 2000) return { ok: false, motivo: 'HTML curto ou ausente' };
  if (!/<h1[\s>]/i.test(html)) return { ok: false, motivo: 'sem título (h1): página vazia ou não renderizada' };
  return { ok: true };
}

// Primeira chamada com a chave: a Vercel responde 307 e grava o cookie _vercel_jwt. Esse cookie
// é o que vale nas chamadas seguintes. Só o nome e o valor vão para o cabeçalho; nada é impresso.
async function obterCookie(base, bypass) {
  const r = await fetch(base + '/', {
    headers: { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' },
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const par = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('_vercel_jwt='));
  return par || null;
}

async function buscar(url, cookie) {
  const r = await fetch(url, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const tipo = r.headers.get('content-type') || '';
  const corpo = /text|json|xml|javascript|css/.test(tipo) ? await r.text() : '';
  return { status: r.status, tipo, corpo };
}

async function conferir(base, bypass) {
  const cookie = await obterCookie(base, bypass);
  if (!cookie) throw new Error('a Vercel não concedeu o cookie de acesso (chave recusada ou preview fora)');
  const resultados = [];
  const textos = caminhosDoDominio();
  const assetsVistos = new Map();
  const pular = (u) => /^(https?:)?\/\//.test(u) && !u.startsWith(base);

  for (const t of textos) {
    const r = await buscar(base + t.caminho, cookie);
    const v = paginaValida(r.status, r.corpo);
    const rec = v.ok ? recursosDoHtml(r.corpo) : { css: [], js: [], imagens: [], audios: [] };
    resultados.push({ caminho: t.caminho, ok: v.ok, motivo: v.motivo, rec });
    for (const a of [...rec.css, ...rec.js, ...rec.imagens]) if (!pular(a) && !assetsVistos.has(a)) assetsVistos.set(a, null);
  }

  for (const a of [...assetsVistos.keys()]) {
    const r = await buscar(base + a, cookie);
    assetsVistos.set(a, r.status);
  }

  const principais = [];
  for (const p of PRINCIPAIS) principais.push({ caminho: p, status: (await buscar(base + p, cookie)).status });

  return { textos: resultados, assets: assetsVistos, principais };
}

function relatorio({ base, res, nomeVar }) {
  const ok = res.textos.filter((t) => t.ok).length;
  const falhas = res.textos.filter((t) => !t.ok);
  const assetsFalhos = [...res.assets.entries()].filter(([, s]) => s !== 200);
  const audios = res.textos.flatMap((t) => t.rec.audios.map((a) => ({ pagina: t.caminho, src: a })));
  const principaisFalhas = res.principais.filter((p) => p.status !== 200);
  const linhas = [
    '# Conferência do preview (PR #138, domínio único etapa 1)',
    '',
    `Preview: ${base}`,
    `Chave de bypass: variável \`${nomeVar}\` do .env (valor não registrado).`,
    '',
    `## Textos (${res.textos.length} caminhos): ${ok} OK`,
    ...(falhas.length ? falhas.map((f) => `- ${f.caminho}: ${f.motivo}`) : ['- todos com HTTP 200 e página real']),
    '',
    `## Recursos (${res.assets.size} únicos): ${res.assets.size - assetsFalhos.length} OK`,
    ...(assetsFalhos.length ? assetsFalhos.map(([a, s]) => `- ${a}: status ${s}`) : ['- CSS, JS e imagens carregando']),
    '',
    `## Áudio referenciado nas páginas: ${audios.length} elementos`,
    ...(audios.length ? audios.slice(0, 5).map((a) => `- ${a.pagina}: ${a.src}`) : ['- nenhum elemento <audio> ou <source> encontrado no HTML (confira no navegador)']),
    '',
    '## Páginas principais (não devem mudar)',
    ...res.principais.map((p) => `- ${p.caminho}: ${p.status}`),
    '',
    `Resultado: ${falhas.length === 0 && assetsFalhos.length === 0 && principaisFalhas.length === 0 ? 'APROVADO' : 'REPROVADO'}`,
  ];
  return linhas.join('\n') + '\n';
}

if (require.main === module) {
  (async () => {
    const base = (process.argv[2] || '').replace(/\/$/, '');
    const saida = process.argv[3] || path.join(RAIZ, 'relatorios', 'preview-138-24.md');
    if (!/^https:\/\/[a-z0-9.-]+\.vercel\.app$/.test(base)) { console.error('uso: node scripts/conferirPreview.js https://<preview>.vercel.app [relatorio.md]'); process.exitCode = 1; return; }
    carregarEnv();
    const nomeVar = 'VERCEL_AUTOMATION_BYPASS_SECRET';
    const bypass = process.env[nomeVar];
    if (!bypass) { console.error(`${nomeVar} ausente no .env`); process.exitCode = 1; return; }
    const res = await conferir(base, bypass);
    const texto = relatorio({ base, res, nomeVar });
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, texto, 'utf8');
    process.stdout.write(texto.split('\n').slice(0, 8).join('\n') + '\n');
    process.exitCode = /Resultado: APROVADO/.test(texto) ? 0 : 1;
  })().catch((e) => { console.error('ERRO:', e.message.slice(0, 200)); process.exitCode = 1; });
}

module.exports = { caminhosDoDominio, recursosDoHtml, paginaValida, relatorio };
