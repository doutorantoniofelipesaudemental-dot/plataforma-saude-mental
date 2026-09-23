const path = require('path');
const express = require('express');

const db = require('./lib/db');
const Artigo = require('./models/Artigo');
const { renderizarArtigoHtml } = require('./lib/renderizarArtigo');
const { listarArtigos, listarCategorias } = require('./lib/listarArtigos');
const { renderizarBlogHtml } = require('./lib/renderizarBlog');
const { gerarSitemapArtigosXml, gerarSitemapIndexXml } = require('./lib/sitemap');
const agendamentosRouter = require('./routes/agendamentos');
const contatoRouter = require('./routes/contato');
const artigosRouter = require('./routes/artigos');
const midiaRouter = require('./routes/midia');
const carrosselRouter = require('./routes/carrossel');
const adminRouter = require('./routes/admin');
const cronRouter = require('./routes/cron');

const app = express();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Na Vercel o app roda atrás de proxy; sem isso req.ip vem sempre do proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Cabeçalhos de segurança básicos (evita dependência extra tipo helmet).
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

/* ---------------------------------- API ---------------------------------- */

app.get('/api/health', async (req, res) => {
  const resposta = {
    ok: true,
    servico: 'Doutor Saúde Mental',
    ambiente: process.env.VERCEL ? 'vercel' : 'local',
    banco: 'desconectado',
  };

  if (!db.isConfigured()) {
    resposta.banco = 'nao-configurado';
    return res.json(resposta);
  }

  try {
    await db.connect();
    resposta.banco = 'conectado';
  } catch (err) {
    resposta.ok = false;
    resposta.banco = 'erro';
    resposta.detalhe = err.message;
    return res.status(503).json(resposta);
  }
  res.json(resposta);
});

app.use('/api/agendamentos', agendamentosRouter);
app.use('/api/contato', contatoRouter);
app.use('/api/artigos', artigosRouter);
// Mesmo prefixo de artigosRouter: as rotas de mídia (PUT .../midia/audio e
// .../midia/capa) usadas pelo backend Python de automação vivem sob
// /api/artigos/:slug/midia/*.
app.use('/api/artigos', midiaRouter);
app.use('/api/carrossel', carrosselRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cron', cronRouter);

// Qualquer outra rota sob /api é 404 em JSON — nunca cai no HTML do site.
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Endpoint não encontrado.' });
});

/* -------------------------------- Site ----------------------------------- */
// As duas rotas de SSR abaixo precisam vir ANTES do express.static: com
// `extensions: ['html']`, o static shadowia /blog (existe public/blog.html)
// e serviria o shell sem nunca chegar nos handlers — foi exatamente o bug
// que fez o SSR do blog cair sempre no fallback em produção.

/**
 * Pré-renderiza a primeira página da listagem (respeitando ?categoria/
 * ?busca/?pagina) para que crawlers sem JS vejam os links dos artigos em vez
 * de um grid de skeleton vazio. Sem banco configurado ou qualquer erro na
 * consulta, cai para o shell estático de sempre e o client-side assume a
 * listagem inteira, como sempre.
 */
app.get('/blog', async (req, res) => {
  const shellEstatico = () => res.sendFile(path.join(PUBLIC_DIR, 'blog.html'));

  if (!db.isConfigured()) return shellEstatico();

  try {
    await db.connect();
    const [{ itens, paginacao, categoria, busca }, categorias] = await Promise.all([
      listarArtigos(req.query),
      listarCategorias(),
    ]);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderizarBlogHtml({ itens, paginacao, categoria, busca, categorias }));
  } catch (err) {
    console.error('[blog] falha ao pré-renderizar, caindo para o shell estático:', err.message);
    shellEstatico();
  }
});

/**
 * Pré-renderiza meta tags OpenGraph/canonical/JSON-LD para bots de preview e
 * crawlers, que não executam o JS que hoje monta o conteúdo do artigo.
 * O corpo do artigo continua vindo do client-side via /api/artigos/:slug —
 * aqui só o <head> muda. Sem banco configurado, artigo não encontrado, ou
 * qualquer erro na consulta, cai para o shell estático de sempre e o
 * client-side assume a renderização (inclusive a tela de "não encontrado").
 */
app.get('/artigo/:slug', async (req, res) => {
  const shellEstatico = () => res.sendFile(path.join(PUBLIC_DIR, 'artigo.html'));

  if (!db.isConfigured()) return shellEstatico();

  try {
    await db.connect();
    const artigo = await Artigo.findOne({ slug: req.params.slug, publicado: true })
      .select('titulo slug resumo conteudo categoria autor imagemCapa audioNarracaoUrl tempoLeitura publicadoEm atualizadoEm')
      .lean();

    if (!artigo) return shellEstatico();

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderizarArtigoHtml(artigo));
  } catch (err) {
    console.error('[artigo] falha ao pré-renderizar, caindo para o shell estático:', err.message);
    shellEstatico();
  }
});

/**
 * Sitemap dos artigos + índice — gerados direto do MongoDB a cada request,
 * então artigo novo aparece sozinho, sem precisar de rebuild/redeploy.
 * Em produção a Vercel só chega a rotear aqui por causa das entradas
 * dedicadas em vercel.json (sem isso, cairia no catch-all de index.html).
 */
app.get('/sitemap-artigos.xml', async (req, res) => {
  if (!db.isConfigured()) return res.status(503).send('Sitemap indisponível: banco não configurado.');
  try {
    await db.connect();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(await gerarSitemapArtigosXml());
  } catch (err) {
    console.error('[sitemap] falha ao gerar sitemap-artigos.xml:', err.message);
    res.status(500).send('Não foi possível gerar o sitemap.');
  }
});

app.get('/sitemap-index.xml', async (req, res) => {
  if (!db.isConfigured()) return res.status(503).send('Sitemap indisponível: banco não configurado.');
  try {
    await db.connect();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(await gerarSitemapIndexXml());
  } catch (err) {
    console.error('[sitemap] falha ao gerar sitemap-index.xml:', err.message);
    res.status(500).send('Não foi possível gerar o sitemap.');
  }
});

// Em produção na Vercel os estáticos são servidos pela CDN (ver vercel.json);
// isto aqui atende o desenvolvimento local e serve de fallback para o resto.
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  })
);

app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));

// SPA-ish fallback: qualquer rota desconhecida devolve a home.
app.use((req, res) => {
  res.status(200).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* ----------------------------- Erros gerais ------------------------------ */

app.use((err, req, res, next) => {
  console.error('[erro não tratado]', err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
  res.status(500).send('Erro interno no servidor.');
});

module.exports = app;

if (!process.env.VERCEL && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  Doutor Saúde Mental — Dr. Antônio Felipe`);
    console.log(`  Site:  http://localhost:${PORT}`);
    console.log(`  API:   http://localhost:${PORT}/api/health`);
    console.log(`  Banco: ${db.isConfigured() ? 'MONGODB_URI definida' : 'MONGODB_URI ausente'}\n`);
  });
}
