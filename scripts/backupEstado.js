/**
 * Backup diário do ESTADO OPERACIONAL que saiu do Git (ordem de 20/10/2026).
 * Guarda uma cópia por dia de cada arquivo da LISTA na coleção `backup_estado` (data, hash SHA-256 e conteúdo).
 *  - Nunca apaga, move nem altera os arquivos originais.
 *  - Recusa qualquer arquivo com cara de segredo (token, chave, senha, URL de banco com senha, .env, credenciais).
 *  - Mantém 30 dias: apaga só documentos da coleção com mais de 30 dias.
 * Roda junto da conferência diária das 09:30 (scripts/conferencias/conferenciaDiaria.js). Sem tarefa nova.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const COLECAO = 'backup_estado';
const DIAS_RETENCAO = 30;
const TAMANHO_MAX = 8 * 1024 * 1024; // bytes; acima disso o arquivo não cabe com folga num documento do MongoDB

// Arquivos de estado que saíram do Git. Caminho relativo à raiz do projeto.
const LISTA = [
  'relatorios/linkedin/agendamento-lote.json',
  'relatorios/linkedin/agendamento-lote.md',
  'relatorios/linkedin/agendar-diario-estado.json',
  'relatorios/narracao-progresso.md',
  'relatorios/redes/validacao-carrosseis.json',
  'relatorios/redes/teste-carrossel/estado.json',
  'relatorios/youtube/fila.json',
  'relatorios/youtube/publicacao-log.md',
  'relatorios/youtube/reprovados/estado-regeracao.json',
  'relatorios/links-estado.json',
  'relatorios/linkedin/fila.json',
  'relatorios/youtube/reprovados/REGERAR-FILA.txt',
  'relatorios/CONSUMO.md',
  'relatorios/consumo-claude.json',
];

// Padrões de segredo. Só diz SIM/NÃO; nunca mostra o trecho encontrado.
const PADROES_SEGREDO = [
  /\b(IGAA|EAA)[A-Za-z0-9_-]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /mongodb(\+srv)?:\/\/[^\s/:]+:[^\s@]+@/i,
  /\b(CRON_SECRET|INSTAGRAM_ACCESS_TOKEN|MONGODB_URI|MONGO_URL|RESEND_API_KEY|[A-Z_]*(SECRET|PASSWORD|SENHA|API_KEY|TOKEN))\s*[=:]\s*\S{6,}/,
];

const sha256 = (texto) => crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
const dataISO = (agora) => new Date(agora).toISOString().slice(0, 10);

// Não-segredo? Devolve { ok, motivo }. O motivo nunca contém o conteúdo.
function verificarSeguro(arquivo, conteudo) {
  const nome = path.basename(arquivo);
  if (/^\.env/i.test(nome)) return { ok: false, motivo: 'nome de arquivo de ambiente (.env)' };
  if (/client_secret|credencia|\.pem$|\.key$/i.test(nome)) return { ok: false, motivo: 'nome de arquivo de credencial' };
  if (PADROES_SEGREDO.some((re) => re.test(conteudo))) return { ok: false, motivo: 'conteúdo com padrão de segredo (valor omitido)' };
  return { ok: true };
}

// Lista os arquivos da LISTA que existem no disco (ausentes são normais: ainda não foram gerados).
function arquivosDeEstado(raiz = RAIZ, lista = LISTA) {
  return lista.filter((rel) => fs.existsSync(path.join(raiz, rel))).map((rel) => ({ arquivo: rel, abs: path.join(raiz, rel) }));
}

// Faz o backup do dia. `col` precisa ter findOne e insertOne (coleção do MongoDB ou equivalente).
async function backupDoDia({ col, raiz = RAIZ, agora = new Date(), lista = LISTA } = {}) {
  const data = dataISO(agora);
  const r = { data, gravados: [], ja: [], recusados: [], falhas: [] };
  for (const { arquivo, abs } of arquivosDeEstado(raiz, lista)) {
    try {
      const id = `${data}|${arquivo}`;
      if (await col.findOne({ _id: id })) { r.ja.push(arquivo); continue; }
      const conteudo = fs.readFileSync(abs, 'utf8');
      const seguro = verificarSeguro(arquivo, conteudo);
      if (!seguro.ok) { r.recusados.push({ arquivo, motivo: seguro.motivo }); continue; }
      if (Buffer.byteLength(conteudo, 'utf8') > TAMANHO_MAX) { r.falhas.push({ arquivo, motivo: 'maior que o limite do backup' }); continue; }
      await col.insertOne({ _id: id, data, arquivo, bytes: Buffer.byteLength(conteudo, 'utf8'), sha256: sha256(conteudo), conteudo, criadoEm: agora });
      r.gravados.push(arquivo);
    } catch (e) {
      r.falhas.push({ arquivo, motivo: String(e.message).slice(0, 120) });
    }
  }
  return r;
}

// Apaga só documentos da coleção com mais de DIAS_RETENCAO dias. Nunca toca em arquivos do disco.
async function limparAntigos({ col, agora = new Date(), dias = DIAS_RETENCAO } = {}) {
  const corte = dataISO(new Date(new Date(agora).getTime() - dias * 24 * 3600e3));
  const r = await col.deleteMany({ data: { $lt: corte } });
  return { corte, apagados: r.deletedCount || 0 };
}

// Data do backup mais recente (AAAA-MM-DD) ou null.
async function ultimoBackup({ col }) {
  const docs = await col.find({}, { projection: { data: 1 } }).toArray();
  return docs.length ? docs.map((d) => d.data).sort().at(-1) : null;
}

module.exports = { LISTA, COLECAO, DIAS_RETENCAO, RAIZ, sha256, verificarSeguro, arquivosDeEstado, backupDoDia, limparAntigos, ultimoBackup };

// Execução (chamada pela conferência das 09:30): faz o backup do dia, limpa o que tem mais de 30 dias e imprime o resultado em JSON.
if (require.main === module && process.argv.includes('--executar')) {
  (async () => {
    const db = require('../backend/lib/db');
    const mongoose = require('mongoose');
    await db.connect();
    const col = mongoose.connection.db.collection(COLECAO);
    const r = await backupDoDia({ col });
    const limpeza = await limparAntigos({ col });
    const ultimo = await ultimoBackup({ col });
    console.log(JSON.stringify({ ...r, apagadosAntigos: limpeza.apagados, ultimoBackup: ultimo }));
    await mongoose.disconnect();
  })().catch((e) => { console.log(JSON.stringify({ erro: String(e.message).slice(0, 160) })); process.exit(1); });
}
