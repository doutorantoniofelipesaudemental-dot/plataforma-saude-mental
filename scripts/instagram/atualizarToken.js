/**
 * Atualiza INSTAGRAM_ACCESS_TOKEN: valida o token, grava no .env local e na Vercel (produção) e, só com --redeploy, dispara o deploy.
 * Rodar numa janela do PowerShell, fora do Claude Code:
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js --redeploy
 * O token é digitado com entrada oculta, vai para a Vercel pela entrada padrão (não pela linha de comando) e nunca aparece na saída.
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '../..');
const VAR = 'INSTAGRAM_ACCESS_TOKEN';

// IGAA = Instagram Login (graph.instagram.com); EAA = via Página do Facebook (graph.facebook.com).
function hostDoToken(token) {
  return `https://${require('../../backend/lib/instagramHost').hostDoToken(token)}`;
}

// Nunca deixa o token sair em texto: troca qualquer ocorrência por [REDACTED].
function redigir(texto, token) {
  return token ? String(texto).split(token).join('[REDACTED]') : String(texto);
}

// Valida no /me, com o token no cabeçalho (nunca na URL).
async function validarMe(token, { buscar = fetch } = {}) {
  const r = await buscar(`${hostDoToken(token)}/me?fields=user_id,username,account_type`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  const id = j.user_id || j.id;
  if (!r.ok || j.error || !id) return { ok: false, erro: redigir(j.error ? `${j.error.code}: ${j.error.message}` : `HTTP ${r.status}`, token) };
  return { ok: true, usuario: j.username || '?', conta: j.account_type || '?' };
}

// Dados do token pelo debug_token (exige app id e app secret; o token vai no corpo, não na URL).
async function debugToken(token, { appId, appSecret, buscar = fetch } = {}) {
  if (!appId || !appSecret) return { app: 'não verificado (defina INSTAGRAM_APP_ID)', expiraEm: null };
  const corpo = new URLSearchParams({ input_token: token, access_token: `${appId}|${appSecret}` });
  const r = await buscar('https://graph.facebook.com/debug_token', { method: 'POST', body: corpo });
  const d = (await r.json().catch(() => ({}))).data || {};
  return { app: d.application || '?', appId: d.app_id || appId, expiraEm: d.expires_at ? new Date(d.expires_at * 1000) : null, valido: d.is_valid === true };
}

const dataBR = (d) => (d ? `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}` : 'não informada pela API');

// Linha da saída: só status, conta, app e validade. Nunca o token.
function resumoValido({ usuario, conta }, { app, appId, expiraEm }, host = '') {
  const alvo = appId ? `${app} (id ${appId})` : app;
  return `VÁLIDO para @${usuario} (${conta}), host ${host || '?'}, app ${alvo}, expira em ${dataBR(expiraEm)}`;
}

// Troca (ou acrescenta) a linha INSTAGRAM_ACCESS_TOKEN no texto do .env, mantendo as outras linhas e o fim de linha.
function atualizarEnv(texto, token) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const linhas = texto.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.startsWith(`${VAR}=`));
  if (i >= 0) linhas[i] = `${VAR}=${token}`;
  else if (linhas[linhas.length - 1] === '') linhas.splice(linhas.length - 1, 0, `${VAR}=${token}`);
  else linhas.push(`${VAR}=${token}`);
  return linhas.join(eol);
}

// Pergunta com entrada oculta: só o texto da pergunta aparece na tela.
function pedirOculto(pergunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const escreve = rl._writeToOutput;
    rl._writeToOutput = (s) => { if (s.includes(pergunta)) escreve.call(rl, s); };
    rl.question(pergunta, (resposta) => { rl.close(); process.stdout.write('\n'); resolve(resposta.trim()); });
  });
}

// Vercel: remove a variável de produção (se existir) e recria com o valor pela entrada padrão. Retorna true/false.
function atualizarVercel(token) {
  spawnSync('vercel', ['env', 'rm', VAR, 'production', '--yes'], { cwd: RAIZ, shell: true, encoding: 'utf8', timeout: 120000 });
  const r = spawnSync('vercel', ['env', 'add', VAR, 'production'], { cwd: RAIZ, shell: true, encoding: 'utf8', input: `${token}\n`, timeout: 120000 });
  return r.status === 0;
}

async function principal() {
  const redeploy = process.argv.includes('--redeploy');
  const token = await pedirOculto('Cole o token novo (entrada oculta) e tecle Enter: ');
  if (!token) { console.log('Nenhum token informado. Nada feito.'); return 1; }
  const me = await validarMe(token);
  if (!me.ok) { console.log(`INVÁLIDO: ${me.erro}. Nada foi gravado.`); return 1; }
  const dbg = await debugToken(token, { appId: process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID, appSecret: process.env.INSTAGRAM_APP_SECRET });
  console.log(resumoValido(me, dbg, require('../../backend/lib/instagramHost').hostDoToken(token)));
  const arq = path.join(RAIZ, '.env');
  const atual = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  fs.writeFileSync(arq, atualizarEnv(atual, token), 'utf8');
  console.log('.env local: atualizado.');
  const vercelOk = atualizarVercel(token);
  console.log(`Vercel (produção): ${vercelOk ? 'atualizada' : 'FALHOU (faça login no CLI da Vercel ou atualize pela interface)'}.`);
  if (redeploy && vercelOk) {
    const d = spawnSync('vercel', ['deploy', '--prod', '--yes'], { cwd: RAIZ, shell: true, encoding: 'utf8', timeout: 900000 });
    console.log(`Redeploy de produção: ${d.status === 0 ? 'disparado' : 'FALHOU'}.`);
  } else if (!redeploy) {
    console.log('Redeploy não disparado (use --redeploy para disparar).');
  }
  return vercelOk ? 0 : 1;
}

if (require.main === module) {
  principal().then((c) => { process.exitCode = c; }).catch((e) => { console.log(`Erro: ${redigir(e.message, process.env.INSTAGRAM_ACCESS_TOKEN || '')}`); process.exitCode = 1; });
}

module.exports = { hostDoToken, redigir, validarMe, debugToken, resumoValido, atualizarEnv, dataBR };
