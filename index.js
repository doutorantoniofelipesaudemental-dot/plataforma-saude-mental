/**
 * Ponto de entrada local. O app em si vive em backend/index.js — este arquivo
 * existe para que `npm start` na raiz funcione e para manter compatibilidade
 * com configurações antigas que apontavam para /index.js.
 */
const app = require('./backend/index.js');

module.exports = app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;

  const iniciar = async () => {
    // npm start -> --carregar-banco: banco vazio recebe os artigos iniciais antes de abrir a porta.
    const { carregarBancoSeVazio, pedido } = require('./backend/lib/carregarBanco');
    if (pedido()) {
      try {
        await carregarBancoSeVazio();
      } catch (err) {
        console.error(`  --carregar-banco falhou (${err.message}); o portal sobe mesmo assim.`);
      }
    }
    app.listen(PORT, () => {
      console.log(`\n  Portal de Saúde Mental Doutor Antônio Felipe Garabito`);
      console.log(`  Site:  http://localhost:${PORT}`);
      console.log(`  API:   http://localhost:${PORT}/api/health\n`);
    });
  };

  iniciar();
}
