/**
 * Trava de um portão por vez (ordem de 23/10/2026). Arquivo com PID e hora, na pasta principal do repositório.
 * Trava de outro processo vivo e recente bloqueia. Trava de processo morto ou com mais de MAX_IDADE_MS é liberada.
 */
const fs = require('node:fs');
const path = require('node:path');
const { raizPrincipal } = require('./raizRepositorio');

const MAX_IDADE_MS = 90 * 60 * 1000;
const ARQ = path.join(raizPrincipal(), '.tmp', 'portao.lock');

// Função pura: decide o que fazer com a trava existente.
function decidirTrava({ existente, pidVivo, agoraMs, maxIdadeMs = MAX_IDADE_MS }) {
  if (!existente) return { acao: 'adquirir' };
  const idade = agoraMs - Date.parse(existente.inicio);
  if (pidVivo && idade < maxIdadeMs) return { acao: 'bloquear', motivo: `outro portão em andamento (PID ${existente.pid}, desde ${existente.inicio})` };
  return { acao: 'liberar-antiga', motivo: pidVivo ? 'trava com mais de 90 min' : `processo ${existente.pid} não existe mais` };
}

function pidVivo(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function adquirirTrava(arquivo = ARQ) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  let existente = null;
  try { existente = JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { existente = null; }
  const d = decidirTrava({ existente, pidVivo: existente ? pidVivo(existente.pid) : false, agoraMs: Date.now() });
  if (d.acao === 'bloquear') return { ok: false, motivo: d.motivo };
  const travaNova = { pid: process.pid, inicio: new Date().toISOString() };
  fs.writeFileSync(arquivo, JSON.stringify(travaNova), 'utf8');
  return { ok: true, arquivo, aviso: d.acao === 'liberar-antiga' ? `trava antiga liberada: ${d.motivo}` : null };
}

function liberarTrava(arquivo = ARQ) {
  try {
    const t = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    if (t.pid === process.pid) fs.rmSync(arquivo, { force: true });
  } catch { /* sem trava */ }
}

module.exports = { decidirTrava, adquirirTrava, liberarTrava, MAX_IDADE_MS, ARQ };
