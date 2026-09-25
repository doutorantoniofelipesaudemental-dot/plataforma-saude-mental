const mongoose = require('mongoose');

/**
 * Conexão com o MongoDB preparada para ambiente serverless (Vercel).
 *
 * Em serverless a mesma instância é reaproveitada entre invocações, mas o
 * módulo pode ser reavaliado. Guardamos a promessa da conexão em um cache
 * global para que múltiplas requisições simultâneas compartilhem um único
 * pool em vez de abrir uma conexão por requisição.
 */

const cache = globalThis.__mongooseCache || (globalThis.__mongooseCache = {
  conn: null,
  promise: null,
});

mongoose.set('strictQuery', true);

function getUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URL || '';
}

/** Indica se há string de conexão configurada no ambiente. */
function isConfigured() {
  return Boolean(getUri());
}

/**
 * Conecta (ou reaproveita a conexão) com o MongoDB.
 * @returns {Promise<import('mongoose').Mongoose>}
 * @throws {Error} se MONGODB_URI não estiver definida ou a conexão falhar.
 */
async function connect() {
  const uri = getUri();
  if (!uri) {
    const err = new Error('MONGODB_URI não configurada.');
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }

  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        // Falha rápido em vez de pendurar a requisição serverless até o timeout.
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        maxPoolSize: 10,
        // Sem padrão, uma URI sem nome de banco caía em "test" (vazio) e scripts
        // locais liam 0 artigos sem erro. O banco da aplicação é "drsaudemental".
        dbName: process.env.MONGODB_DB || 'drsaudemental',
      })
      .catch((err) => {
        // Sem isso uma falha transitória deixaria a promessa rejeitada em cache
        // para sempre, quebrando todas as requisições seguintes.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

module.exports = { connect, isConfigured, mongoose };
