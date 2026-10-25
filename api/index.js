// Entrypoint serverless da Vercel. O app Express fica em backend/index.js.
// Rotas em vercel.json (rewrites) mandam as URLs do backend para esta função.
module.exports = require('../backend/index.js');
