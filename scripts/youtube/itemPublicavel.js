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

// Demonstração da auditoria: sempre privada, sem conteúdo clínico, com cenas suficientes.
function itemDemoAuditoria(it) {
  return it.status === STATUS_DEMO && it.privacidade === 'private' && it.conteudoClinico === false && cenasDoItem(it) >= MINIMO_CENAS;
}

// Única exceção ao freio REDES_PUBLICACAO_ATIVA (ordem de 30/10/2026): envio de TESTE da demo, com --confirmar, --id explícito
// e privacidade private. Qualquer outro caso mantém o freio.
function excecaoFreioDemo(it, { confirmar = false, idArg = '', privacidade = '' } = {}) {
  return Boolean(it) && confirmar === true && Boolean(idArg) && it.id === idArg && privacidade === 'private' && itemDemoAuditoria(it);
}

module.exports = { STATUS_DEMO, cenasDoItem, itemPublicavel, itemDemoAuditoria, excecaoFreioDemo };
