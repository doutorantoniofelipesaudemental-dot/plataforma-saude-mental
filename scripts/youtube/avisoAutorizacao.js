/**
 * Validade da autorização do YouTube. Enquanto o app do Google estiver em modo "Testando", a autorização vence em 7 dias.
 *   node --env-file=.env scripts/youtube/avisoAutorizacao.js                  confere e grava/remove relatorios/youtube/AVISO-REAUTORIZAR.md
 *   node --env-file=.env scripts/youtube/avisoAutorizacao.js --registrar testando|producao   registra a data de hoje (rode depois de cada autorização)
 * Estado em relatorios/youtube/autorizacao.json (sem segredo). Roda todo dia dentro do montarFila (tarefa das 23:30) e na rotina semanal.
 * Aviso a partir de 2 dias antes do vencimento; se o Google já recusou o token (invalid_grant), avisa na hora.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const ESTADO = path.join(RAIZ, 'relatorios/youtube/autorizacao.json');
const AVISO = path.join(RAIZ, 'relatorios/youtube/AVISO-REAUTORIZAR.md');
const DIA = 86400e3;

const hojeBahia = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / DIA);

function registrar(modo) {
  if (!['testando', 'producao'].includes(modo)) throw new Error('modo: testando | producao');
  const e = { autorizadoEm: hojeBahia(), modoApp: modo, nota: modo === 'testando' ? 'App em "Testando": a autorização vence 7 dias depois de autorizadoEm.' : 'App publicado ("Em produção"): a autorização não vence em 7 dias.' };
  fs.writeFileSync(ESTADO, JSON.stringify(e, null, 1) + '\n', 'utf8');
  return e;
}

function lerEstado() { try { return JSON.parse(fs.readFileSync(ESTADO, 'utf8')); } catch { return null; } }

const PASSOS = `Como reautorizar (5 minutos):
1. No terminal do Claude Code digite: \`! npm run youtube:autorizar\` e abra o endereço que aparecer, neste computador.
2. Entre com a conta dona do canal. Se aparecer "O Google não verificou este app": Avançado → Acessar Portal Saúde Mental (não seguro) → Continuar.
3. Quando o navegador disser que a autorização foi concluída, volte ao terminal: deve aparecer "YOUTUBE_REFRESH_TOKEN gravado no .env".
4. Registre a nova data: \`! node --env-file=.env scripts/youtube/avisoAutorizacao.js --registrar testando\` (use \`producao\` se o app já estiver publicado).
Para a autorização parar de vencer: publique o app (seção "Publicar o app" de relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md).`;

/** Bloco visível no topo do ESTADO-GERAL.md enquanto houver aviso (some sozinho quando a autorização estiver em dia). */
function marcarEstadoGeral(problema) {
  const eg = path.join(RAIZ, 'relatorios/ESTADO-GERAL.md');
  if (!fs.existsSync(eg)) return;
  let t = fs.readFileSync(eg, 'utf8');
  const re = /<!-- AVISO-YT:INICIO -->[\s\S]*?<!-- AVISO-YT:FIM -->\n?/;
  const bloco = problema ? `<!-- AVISO-YT:INICIO -->\n> ⚠ **YouTube: ${problema}.** Passo a passo em relatorios/youtube/AVISO-REAUTORIZAR.md\n<!-- AVISO-YT:FIM -->\n` : '';
  if (re.test(t)) t = t.replace(re, bloco);
  else if (bloco) { const i = t.indexOf('\n'); t = t.slice(0, i + 1) + bloco + t.slice(i + 1); }
  fs.writeFileSync(eg, t, 'utf8');
}

/** Devolve { situacao, dias, venceEm, modo, problema } e grava/remove o arquivo de aviso. */
async function conferir({ testarToken = true } = {}) {
  const e = lerEstado();
  const out = { modo: e && e.modoApp, autorizadoEm: e && e.autorizadoEm, dias: null, venceEm: null, problema: '' };
  if (!e) { out.problema = 'sem registro da data da autorização (rode --registrar)'; out.situacao = 'sem-registro'; return out; }
  if (e.modoApp === 'testando') {
    const venc = new Date(new Date(`${e.autorizadoEm}T00:00:00Z`).getTime() + 7 * DIA).toISOString().slice(0, 10);
    out.venceEm = venc; out.dias = diasEntre(hojeBahia(), venc);
    if (out.dias < 0) out.problema = `a autorização VENCEU em ${venc} (app em modo "Testando")`;
    else if (out.dias <= 2) out.problema = `a autorização vence em ${out.dias} dia(s) (${venc}; app em modo "Testando")`;
  }
  if (testarToken && process.env.YOUTUBE_REFRESH_TOKEN) {
    try { await require('../../backend/lib/youtube').obterAccessToken(); }
    catch (err) { if (/invalid_grant|expired|revoked/i.test(err.message)) out.problema = `o Google recusou a autorização (${err.message.slice(0, 80)})`; }
  }
  out.situacao = out.problema ? 'reautorizar' : 'ok';
  if (out.problema) {
    fs.writeFileSync(AVISO, `# ⚠ Reautorizar o YouTube\n\n${out.problema}.\n\n${PASSOS}\n\n(Gerado em ${hojeBahia()} por scripts/youtube/avisoAutorizacao.js; este arquivo some sozinho quando a autorização estiver em dia.)\n`, 'utf8');
  } else fs.rmSync(AVISO, { force: true });
  marcarEstadoGeral(out.problema);
  return out;
}

module.exports = { conferir, registrar, lerEstado, PASSOS };

if (require.main === module) {
  (async () => {
    const i = process.argv.indexOf('--registrar');
    if (i > -1) { console.log('registrado:', JSON.stringify(registrar(process.argv[i + 1]))); return; }
    console.log(JSON.stringify(await conferir()));
  })().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
}
