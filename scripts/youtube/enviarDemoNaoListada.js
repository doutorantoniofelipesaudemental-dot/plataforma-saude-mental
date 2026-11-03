/**
 * Envio ÚNICO do vídeo de demonstração como NÃO LISTADO (ordem do Dr. Antônio, 03/11/2026).
 * Não é conteúdo de saúde. Nunca "public". Nunca outro vídeo. Uma vez só (trava pelo registro no log).
 *   node --env-file-if-exists=.env scripts/youtube/enviarDemoNaoListada.js                                  mostra o que faria (não envia)
 *   node --env-file-if-exists=.env scripts/youtube/enviarDemoNaoListada.js --id=demo-auditoria-20261030 --confirmar
 * Usa o caminho normal do cliente (backend/lib/youtube.js), que respeita o freio geral REDES_PUBLICACAO_ATIVA.
 * Não liga nem desliga freio, não edita .env.
 */
const fs = require('node:fs');
const path = require('node:path');

const ID = 'demo-auditoria-20261030';
const TITULO = 'Demonstração técnica — teste de envio (não listado)';
const PRIVACIDADE = 'unlisted';
const DESCRICAO = 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito\n\n' +
  'Vídeo de demonstração técnica para teste de envio pela API do YouTube. Não é conteúdo de saúde. Visibilidade: não listado.\n\n' +
  'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';
const RAIZ = path.resolve(__dirname, '..', '..');
// A demo fica fora do Git (pasta ignorada); DRSM_DEMO_DIR aponta para ela quando o script roda num worktree.
const DEMO_DIR = process.env.DRSM_DEMO_DIR || path.join(RAIZ, 'carrosseis-instagram', 'youtube', 'demo-auditoria');
const ARQUIVO = path.join(DEMO_DIR, 'demo.mp4');
const LOG = path.join(RAIZ, 'relatorios', 'youtube', 'privacidade-teste-log.md');
const MARCA = 'ENVIO-DEMO-NAO-LISTADA';

// Regra pura (testada em tests/unit/enviar-demo-nao-listada.test.js).
function podeEnviar({ id, arquivo, privacidade, titulo, confirmar, jaEnviado }) {
  if (id !== ID) return { ok: false, motivo: 'id diferente do vídeo de demonstração' };
  if (!confirmar) return { ok: false, motivo: 'falta --confirmar' };
  if (privacidade !== PRIVACIDADE) return { ok: false, motivo: `privacidade "${privacidade}" não permitida (só "${PRIVACIDADE}")` };
  if (titulo !== TITULO) return { ok: false, motivo: 'título diferente do aprovado' };
  if (!String(arquivo).endsWith(path.join('demo-auditoria', 'demo.mp4'))) return { ok: false, motivo: 'arquivo fora da demonstração' };
  if (jaEnviado) return { ok: false, motivo: 'envio único já registrado no log' };
  return { ok: true };
}

async function main() {
  const yt = require('../../backend/lib/youtube');
  const confirmar = process.argv.includes('--confirmar');
  const idArg = (process.argv.find((a) => a.startsWith('--id=')) || '').split('=')[1];
  const jaEnviado = fs.existsSync(LOG) && fs.readFileSync(LOG, 'utf8').includes(MARCA);
  const regra = podeEnviar({ id: idArg, arquivo: ARQUIVO, privacidade: PRIVACIDADE, titulo: TITULO, confirmar, jaEnviado });
  console.log(`Vídeo ${ID}: ${fs.existsSync(ARQUIVO) ? (fs.statSync(ARQUIVO).size / 1024).toFixed(0) + ' KB' : 'ARQUIVO AUSENTE'} · privacidade ${PRIVACIDADE}`);
  if (!regra.ok) { console.log(`Nada enviado: ${regra.motivo}.`); return; }
  if (!yt.credenciaisYoutube()) throw new Error('sem credenciais do YouTube no ambiente');

  const r = await yt.enviarVideo({ arquivo: ARQUIVO, titulo: TITULO, descricao: DESCRICAO, tags: [], privacidade: PRIVACIDADE, short: false });
  const token = await yt.obterAccessToken();
  const lista = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${r.id}`, { headers: { Authorization: `Bearer ${token}` } }).then((x) => x.json());
  const conferido = lista.items?.[0]?.status?.privacyStatus || 'n/d';
  const linha = `- ${new Date().toISOString()} ${MARCA} ${r.id} (${r.link}) · upload HTTP ${r.statusHttp} · privacidade pedida ${PRIVACIDADE} · privacidade aplicada ${r.privacidade} · videos.list: ${conferido}`;
  fs.appendFileSync(LOG, (fs.existsSync(LOG) ? '' : '# Teste de privacidade do YouTube (03/11/2026)\n\n') + linha + '\n', 'utf8');
  console.log(linha);
  if (conferido !== PRIVACIDADE) throw new Error(`o YouTube não manteve "${PRIVACIDADE}": estado = ${conferido}`);
}

if (require.main === module) main().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
module.exports = { podeEnviar, ID, TITULO, PRIVACIDADE };
