/**
 * Trava de "um portão por vez" (ordem de 28/10/2026): dois portões ao mesmo tempo brigam pela porta do e2e.
 * O arquivo de trava (.tmp/portao.lock) guarda o pid e o momento. Quem chega com a trava ocupada espera.
 * Trava de processo morto ou com mais de 2 horas é tomada (com aviso). Vale para `npm run portao` em qualquer caminho.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const TRAVA = path.join(RAIZ, '.tmp', 'portao.lock');
const VELHA_MS = 2 * 60 * 60 * 1000;

const processoVivo = (pid) => {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};

const lerTrava = (arquivo) => {
  try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { return null; }
};

/** Tenta pegar a trava de forma atômica. Devolve { pegou, dono?, motivo? }. */
function tentarTrava({ arquivo = TRAVA, pid = process.pid, vivo = processoVivo, agora = Date.now() } = {}) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const criar = () => {
    const fd = fs.openSync(arquivo, 'wx');
    fs.writeSync(fd, JSON.stringify({ pid, desde: agora }));
    fs.closeSync(fd);
    return { pegou: true };
  };
  try { return criar(); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  const dono = lerTrava(arquivo);
  if (dono && vivo(dono.pid) && agora - dono.desde < VELHA_MS) return { pegou: false, dono };
  fs.rmSync(arquivo, { force: true }); // dono morto, ilegível ou velho: a trava é tomada
  try { return { ...criar(), motivo: dono ? `trava antiga (pid ${dono.pid}) tomada` : 'trava ilegível tomada' }; } catch (e) { if (e.code === 'EEXIST') return { pegou: false, dono: lerTrava(arquivo) }; throw e; }
}

/** Solta a trava só se ela ainda é deste processo. */
function soltarTrava({ arquivo = TRAVA, pid = process.pid } = {}) {
  const dono = lerTrava(arquivo);
  if (dono && dono.pid === pid) fs.rmSync(arquivo, { force: true });
}

/** Espera (sem gastar CPU) até pegar a trava. Lança erro se passar de `limiteMs`. */
function aguardarTravaSync({ arquivo = TRAVA, pid = process.pid, intervaloMs = 15000, limiteMs = 60 * 60 * 1000, aviso = () => {} } = {}) {
  const inicio = Date.now();
  const dormir = new Int32Array(new SharedArrayBuffer(4));
  let r = tentarTrava({ arquivo, pid });
  let avisou = false;
  while (!r.pegou) {
    if (Date.now() - inicio > limiteMs) throw new Error(`portão em uso por outro processo (pid ${r.dono?.pid}) há mais de ${Math.round(limiteMs / 60000)} min`);
    if (!avisou) { aviso(`outro portão em execução (pid ${r.dono?.pid}): esperando a vez`); avisou = true; }
    Atomics.wait(dormir, 0, 0, intervaloMs);
    r = tentarTrava({ arquivo, pid });
  }
  if (r.motivo) aviso(r.motivo);
  return r;
}

module.exports = { tentarTrava, soltarTrava, aguardarTravaSync, TRAVA };
