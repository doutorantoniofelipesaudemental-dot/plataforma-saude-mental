const path = require('path');
const express = require('express');

const db = require('./lib/db');
const Artigo = require('./models/Artigo');
const { renderizarArtigoHtml } = require('./lib/renderizarArtigo');
const agendamentosRouter = require('./routes/agendamentos');
const artigosRouter = require('./routes/artigos');
const midiaRouter = require('./routes/midia');
const carrosselRouter = require('./routes/carrossel');
const adminRouter = require('./routes/admin');

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
app.use('/api/artigos', artigosRouter);
// Mesmo prefixo de artigosRouter: as rotas de mídia (PUT .../midia/audio e
// .../midia/capa) usadas pelo backend Python de automação vivem sob
// /api/artigos/:slug/midia/*.
app.use('/api/artigos', midiaRouter);
app.use('/api/carrossel', carrosselRouter);
app.use('/api/admin', adminRouter);

// Qualquer outra rota sob /api é 404 em JSON — nunca cai no HTML do site.
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Endpoint não encontrado.' });
});

/* -------------------------------- Site ----------------------------------- */
// Em produção na Vercel os estáticos são servidos pela CDN (ver vercel.json);
// isto aqui atende o desenvolvimento local e serve de fallback.

app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  })
);

app.get('/blog', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'blog.html')));

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
      .select('titulo slug resumo imagemCapa autor publicadoEm atualizadoEm')
      .lean();

    if (!artigo) return shellEstatico();

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderizarArtigoHtml(artigo));
  } catch (err) {
    console.error('[artigo] falha ao pré-renderizar, caindo para o shell estático:', err.message);
    shellEstatico();
  }
});

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
