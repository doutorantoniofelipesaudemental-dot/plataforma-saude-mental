/**
 * Ponto de entrada local. O app em si vive em backend/index.js — este arquivo
 * existe para que `npm start` na raiz funcione e para manter compatibilidade
 * com configurações antigas que apontavam para /index.js.
 */
const app = require('./backend/index.js');

module.exports = app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  Doutor Saúde Mental — Dr. Antônio Felipe`);
    console.log(`  Site:  http://localhost:${PORT}`);
    console.log(`  API:   http://localhost:${PORT}/api/health\n`);
  });
}
