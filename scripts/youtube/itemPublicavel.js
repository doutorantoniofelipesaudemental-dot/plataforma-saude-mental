/**
 * Quem pode subir ao YouTube (ordem de 30/10/2026).
 * - Item REPROVADO nunca sobe, por nenhum caminho (publicação, teste ou demonstração).
 * - Item com menos de 2 cenas (imagem parada) não é publicável. Itens antigos não têm o campo `cenas`: contam como 1.
 * - Vídeo de demonstração da auditoria (`status: 'demo-auditoria'`) só sobe PRIVADO e só com `--id` explícito.
 */
const { MINIMO_CENAS } = require('./cenasMinimas');

const STATUS_DEMO = 'demo-auditoria';

function cenasDoItem(it) {
  return Number.isInteger(it.cenas) ? it.cenas : 1;
}

// Publicação normal: só aprovado-checagem, com cenas suficientes.
function itemPublicavel(it) {
  return it.status === 'aprovado-checagem' && cenasDoItem(it) >= MINIMO_CENAS;
}

// Demonstração da auditoria: sempre privada, com cenas suficientes.
function itemDemoAuditoria(it) {
  return it.status === STATUS_DEMO && it.privacidade === 'private' && cenasDoItem(it) >= MINIMO_CENAS;
}

module.exports = { STATUS_DEMO, cenasDoItem, itemPublicavel, itemDemoAuditoria };
