/**
 * Carrega o .env da raiz do projeto dentro do próprio script (ordem de 20/10/2026, modo automático sem --env-file na linha de comando).
 * Não imprime nem devolve valores: só preenche process.env. Se o arquivo não existir, não faz nada.
 */
const fs = require('node:fs');
const path = require('node:path');

function carregarEnv(arquivo = path.resolve(__dirname, '..', '.env')) {
  if (!fs.existsSync(arquivo)) return false;
  process.loadEnvFile(arquivo);
  return true;
}

module.exports = { carregarEnv };
