const path = require('path');
const express = require('express');

const db = require('./lib/db');
const agendamentosRouter = require('./routes/agendamentos');
const artigosRouter = require('./routes/artigos');
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
app.get('/artigo/:slug', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'artigo.html')));
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
