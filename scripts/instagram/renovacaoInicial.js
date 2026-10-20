/**
 * Renovação ÚNICA do token do Instagram Login (ig_refresh_token), para registrar a validade real (expiraEm) no banco.
 * Tarefa DrSM-Renovar-Token-Inicial (21/10/2026, 11:30, StartWhenAvailable). Depois disso o cron semanal assume.
 * Usa o mesmo caminho do cron de produção (backend/lib/tokenInstagram.js): grava renovadoEm, expiraEm e o token CIFRADO.
 * Não imprime token. Registra o resultado em relatorios/conferencias/renovacao-inicial-token.md.
 *   node --env-file-if-exists=.env scripts/instagram/renovacaoInicial.js
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const RAIZ = path.resolve(__dirname, '../..');
const RELATORIO = path.join(RAIZ, 'relatorios/conferencias/renovacao-inicial-token.md');

async function principal({ renovar = require('../../backend/lib/tokenInstagram').renovarTokenInstagram, agora = new Date(), arquivo = RELATORIO } = {}) {
  let r;
  try {
    r = await renovar();
  } catch (e) {
    r = { renovado: false, motivo: `erro inesperado: ${String(e.message).slice(0, 120)}` };
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
  const linha = r.renovado
    ? `OK — renovado; vale até ${new Date(r.expiraEm).toISOString().slice(0, 10)}`
    : `NÃO RENOVADO — ${r.motivo}`;
  const texto = `# Renovação inicial do token do Instagram — ${agora.toISOString().slice(0, 16).replace('T', ' ')} UTC\n\n${linha}\n`;
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, texto, 'utf8');
  console.log(linha);
  return r.renovado ? 0 : 1;
}

if (require.main === module) {
  principal().then((c) => { process.exitCode = c; });
}

module.exports = { principal };
