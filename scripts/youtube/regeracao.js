/**
 * Regeração segura da mídia dos reprovados. Nunca apaga nem move a pasta original:
 *  1) gera num rascunho <pasta>/_regerado/ (o gerador já aceita dirSaida);
 *  2) confere (T1, o mesmo conferirVideo);
 *  3) se passou: guarda os originais em backups/reprovados-originais-AAAAMMDD/<id>/ com SHA-256 verificado e só então copia por cima;
 *     depois remove o próprio _regerado/ (única remoção permitida);
 *  4) se falhou: renomeia o rascunho para _falha-regeracao-<stamp>/ e conta a tentativa (2 = reserva).
 * Listas: REGERAR.txt (piloto) e REGERAR-FILA.txt (resto), um id de fila por linha. Sem lista = nada muda.
 * Estado: relatorios/youtube/reprovados/estado-regeracao.json (ignorado pelo git).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RAIZ = path.resolve(__dirname, '../..');
const REL = path.join(RAIZ, 'relatorios/youtube/reprovados');
const ESTADO = path.join(REL, 'estado-regeracao.json');
const BACKUPS = path.join(RAIZ, 'backups');
const LOTE = 6;
const FATOR_ESPACO = 2.5;
const LIMITE_FALHA = 0.5;
const MAX_TENTATIVAS = 2;
const RASCUNHO = '_regerado';
const FALHA = '_falha-regeracao-';
const ALERTA_FREIO = 'PRECISA DE VOCÊ: regeração dos vídeos PARADA (freio de 50% de falha em duas noites). Não continua sem ordem do Dr. Antônio.';

function lerLista(arquivo) {
  try {
    return fs.readFileSync(arquivo, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  } catch {
    return [];
  }
}

function listaCandidatos(dir = REL) {
  return [...new Set([...lerLista(path.join(dir, 'REGERAR.txt')), ...lerLista(path.join(dir, 'REGERAR-FILA.txt'))])];
}

function lerEstado(arquivo = ESTADO) {
  try {
    const e = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    return { itens: e.itens || [], noites: e.noites || [], freioAtivo: Boolean(e.freioAtivo) };
  } catch {
    return { itens: [], noites: [], freioAtivo: false };
  }
}

function gravarEstado(estado, arquivo = ESTADO) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, `${JSON.stringify(estado, null, 1)}\n`, 'utf8');
}

// Espaço: livre >= 2,5 vezes o tamanho do vídeo em processamento.
function espacoSuficiente(livreBytes, tamanhoBytes) {
  return livreBytes >= FATOR_ESPACO * tamanhoBytes;
}

// Freio: as duas últimas noites com mais de 50% de falha na T1.
function freioAtivado(noites) {
  const ult = noites.slice(-2);
  if (ult.length < 2) return false;
  return ult.every((n) => n.tentativas > 0 && n.falhas / n.tentativas > LIMITE_FALHA);
}

function sha256(arquivo) {
  return crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
}

// Próximos do lote: sem estado final (regerado-T1-ok ou reserva), na ordem da lista.
function escolherLote(candidatos, itens, n = LOTE) {
  const feitos = new Set(itens.filter((i) => i.estado === 'regerado-T1-ok' || i.estado === 'reserva').map((i) => i.id));
  return candidatos.filter((id) => !feitos.has(id)).slice(0, n);
}

// Resultado de uma tentativa: 1ª falha = falhou; 2ª = reserva.
function decidir(anterior, ok, motivo = '') {
  const tentativas = (anterior?.tentativas || 0) + 1;
  if (ok) return { estado: 'regerado-T1-ok', tentativas, motivo: '' };
  return { estado: tentativas >= MAX_TENTATIVAS ? 'reserva' : 'falhou', tentativas, motivo };
}

// Copia os arquivos do rascunho por cima da pasta, depois de guardar os originais com SHA-256 verificado.
// Lança erro antes de sobrescrever qualquer coisa se o backup não puder ser verificado.
function substituirComBackup({ pasta, rascunho, backupDir }) {
  const arquivos = fs.readdirSync(rascunho).filter((f) => fs.statSync(path.join(rascunho, f)).isFile());
  fs.mkdirSync(backupDir, { recursive: true });
  for (const f of arquivos) {
    const orig = path.join(pasta, f);
    if (!fs.existsSync(orig)) continue;
    const copia = path.join(backupDir, f);
    if (fs.existsSync(copia)) throw new Error(`backup já existe, não sobrescrevo: ${copia}`);
    fs.copyFileSync(orig, copia);
    if (sha256(copia) !== sha256(orig)) throw new Error(`backup não confere (SHA-256): ${f}`);
  }
  for (const f of arquivos) {
    const novo = path.join(rascunho, f);
    fs.copyFileSync(novo, path.join(pasta, f));
    if (sha256(path.join(pasta, f)) !== sha256(novo)) throw new Error(`cópia não confere (SHA-256): ${f}`);
  }
}

function renomearFalha(rascunho) {
  const destino = path.join(path.dirname(rascunho), `${FALHA}${Date.now()}`);
  fs.renameSync(rascunho, destino);
  return destino;
}

// Uma regeração. deps: { gerarItem(id, dirSaida), conferir(dir, meta), backupDir }.
async function regerarUm({ id, pasta, prev, deps }) {
  const rascunho = path.join(pasta, RASCUNHO);
  if (fs.existsSync(rascunho)) return { ...decidir(prev, false, 'rascunho anterior existe; não apago'), id };
  try {
    await deps.gerarItem(id, rascunho);
    const meta = JSON.parse(fs.readFileSync(path.join(rascunho, 'meta.json'), 'utf8'));
    const conf = await deps.conferir(rascunho, meta);
    if (conf.ok) {
      substituirComBackup({ pasta, rascunho, backupDir: deps.backupDir });
      fs.rmSync(rascunho, { recursive: true, force: true });
      return { ...decidir(prev, true), id };
    }
    renomearFalha(rascunho);
    return { ...decidir(prev, false, conf.falhas.join('; ').slice(0, 300)), id };
  } catch (e) {
    if (fs.existsSync(rascunho)) renomearFalha(rascunho);
    return { ...decidir(prev, false, String(e.message).slice(0, 300)), id };
  }
}

// Noite: lote de até 6, freio, espaço e estado. deps: { gerarItem, conferir, pastaDe(id), livreBytes(), tamanhoBytes(id), hoje, backupDir, estadoArq, listaDir }.
async function executarNoite(deps) {
  const estado = lerEstado(deps.estadoArq);
  if (estado.freioAtivo) return { parado: 'freio', feitos: 0 };
  const candidatos = listaCandidatos(deps.listaDir);
  const lote = escolherLote(candidatos, estado.itens, LOTE);
  if (!lote.length) return { parado: 'sem-lista', feitos: 0 };
  let tentativas = 0; let falhas = 0; let parado = '';
  for (const id of lote) {
    const tamanho = deps.tamanhoBytes(id);
    if (!espacoSuficiente(deps.livreBytes(), tamanho)) { parado = 'espaco'; break; }
    const prev = estado.itens.find((i) => i.id === id);
    const r = await regerarUm({ id, pasta: deps.pastaDe(id), prev, deps: { ...deps, backupDir: path.join(deps.backupDir, id) } });
    tentativas++;
    if (r.estado !== 'regerado-T1-ok') falhas++;
    const novo = { id, estado: r.estado, tentativas: r.tentativas, motivo: r.motivo, atualizadoEm: deps.hoje };
    const i = estado.itens.findIndex((x) => x.id === id);
    if (i >= 0) estado.itens[i] = novo; else estado.itens.push(novo);
  }
  estado.noites.push({ data: deps.hoje, tentativas, falhas });
  if (freioAtivado(estado.noites)) { estado.freioAtivo = true; parado = parado || 'freio'; }
  gravarEstado(estado, deps.estadoArq);
  return { parado, feitos: tentativas, falhas, espacoLivreGB: Math.round(deps.livreBytes() / 1e8) / 10 };
}

// Coloca a linha no topo do arquivo, sem repetir se já estiver lá.
function alertarTopo(arquivo, linha) {
  const atual = fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8') : '';
  if (atual.split('\n')[0].trim() === linha) return;
  fs.writeFileSync(arquivo, `${linha}\n${atual}`, 'utf8');
}

// Linha de resumo da noite no RESUMO-DO-DIA.md: vai logo abaixo da primeira linha (PRECISA DE VOCÊ), sem repetir.
function resumoNoite(arquivo, linha) {
  const linhas = fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8').split('\n') : [''];
  const sem = linhas.filter((l, i) => i === 0 || !l.startsWith('Regeração dos vídeos:'));
  sem.splice(1, 0, linha);
  fs.writeFileSync(arquivo, sem.join('\n'), 'utf8');
}

// Portão do status na fila: item regerado só publica (aprovado-checagem) depois de liberado.
// Itens fora da regeração mantêm o status calculado (comportamento atual).
function statusComGate(id, statusCalculado, itensEstado) {
  const it = itensEstado.find((i) => i.id === id);
  if (!it) return statusCalculado;
  if (it.estado === 'liberado') return statusCalculado;
  const mapa = { 'regerado-T1-ok': 'aguardando-ollama', 'aguardando-ollama': 'aguardando-ollama', 'aguardando-calibracao': 'aguardando-calibracao', 'aprovacao-antonio': 'aguardando-aprovacao-antonio', 'reprovado-T2T3': 'reprovado', incerto: 'incerto', falhou: 'reprovado', reserva: 'reserva' };
  return mapa[it.estado] || 'reprovado';
}

module.exports = {
  lerLista, listaCandidatos, lerEstado, gravarEstado, espacoSuficiente, freioAtivado, sha256,
  escolherLote, decidir, substituirComBackup, regerarUm, executarNoite, alertarTopo, resumoNoite, statusComGate,
  LOTE, RASCUNHO, ALERTA_FREIO, ESTADO, BACKUPS, REL,
};
