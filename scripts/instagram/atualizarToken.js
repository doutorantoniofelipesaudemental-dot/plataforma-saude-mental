/**
 * Atualiza INSTAGRAM_ACCESS_TOKEN: valida o token, grava no .env local e na Vercel (produção) e, só com --redeploy, dispara o deploy.
 * Rodar numa janela do PowerShell, fora do Claude Code:
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js --redeploy
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js --so-conta
 *       Só o INSTAGRAM_ACCOUNT_ID (lido do token do .env, sem pedir token): grava no .env e na Vercel (produção).
 * O token é digitado com entrada oculta, vai para a Vercel pela entrada padrão (não pela linha de comando) e nunca aparece na saída.
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '../..');
const VAR = 'INSTAGRAM_ACCESS_TOKEN';
const PROJETO_OFICIAL_ID = 'prj_uIQsuIIdKas1D6AHlGtHEwcdaFsG'; // drsaudemental (www.drantoniofelipemedico.com.br)

// Grava só no projeto oficial. Lê apenas o projectId de .vercel/project.json; recusa qualquer outro ou arquivo ausente.
function projetoPermitido(projetoLido) {
  const id = projetoLido && projetoLido.projectId;
  if (!id) return { ok: false, motivo: 'pasta sem projeto Vercel vinculado (.vercel/project.json ausente)' };
  if (id !== PROJETO_OFICIAL_ID) return { ok: false, motivo: 'pasta vinculada a outro projeto da Vercel; recusado' };
  return { ok: true };
}

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

// Troca (ou acrescenta) a linha da variável no texto do .env, mantendo as outras linhas e o fim de linha.
function atualizarEnv(texto, valor, variavel = VAR) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const linhas = texto.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.startsWith(`${variavel}=`));
  if (i >= 0) linhas[i] = `${variavel}=${valor}`;
  else if (linhas[linhas.length - 1] === '') linhas.splice(linhas.length - 1, 0, `${variavel}=${valor}`);
  else linhas.push(`${variavel}=${valor}`);
  return linhas.join(eol);
}

// ID da conta profissional do Instagram. Token IGAA: /me (user_id). Token via Página (EAA): /me/accounts. Só leitura.
const CONTA_ESPERADA = 'doutor.antoniofelipe.smental';
async function obterIdConta(token, { buscar = fetch } = {}) {
  const h = { headers: { Authorization: `Bearer ${token}` } };
  if (token.startsWith('IGAA')) {
    const j = await (await buscar(`${hostDoToken(token)}/me?fields=user_id,username`, h)).json().catch(() => ({}));
    if (j.error || !j.user_id) return { ok: false, erro: j.error ? `${j.error.code}: ${redigir(j.error.message, token)}` : 'resposta sem user_id' };
    return { ok: true, id: String(j.user_id), username: j.username || '?' };
  }
  const j = await (await buscar('https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username}', h)).json().catch(() => ({}));
  if (j.error) return { ok: false, erro: `${j.error.code}: ${redigir(j.error.message, token)}` };
  const conta = (j.data || []).map((p) => p.instagram_business_account).find((c) => c && c.username === CONTA_ESPERADA) || (j.data || []).map((p) => p.instagram_business_account).find(Boolean);
  if (!conta) return { ok: false, erro: 'nenhuma conta do Instagram ligada às Páginas deste token' };
  return { ok: true, id: String(conta.id), username: conta.username };
}

// --so-conta: lê o token do .env (sem pedir), descobre o ID da @doutor.antoniofelipe.smental e grava INSTAGRAM_ACCOUNT_ID.
// Roda o CLI da Vercel sem shell. No Windows o `vercel` é um .cmd, que só o cmd.exe executa; os argumentos
// são constantes do script ou um URL validado por regex antes de chegar aqui.
function rodarVercel(args, { input } = {}) {
  const opcoes = { cwd: RAIZ, encoding: 'utf8', timeout: 900000, input };
  if (process.platform === 'win32') return spawnSync('cmd.exe', ['/d', '/s', '/c', ['vercel', ...args].join(' ')], opcoes);
  return spawnSync('vercel', args, opcoes);
}

// URL do deploy de produção atual (o alias oficial aponta para ele). Só aceita *.vercel.app.
function ultimoDeployProducao(rodar = rodarVercel) {
  const r = rodar(['inspect', 'https://drsaudemental.vercel.app']);
  const m = /^\s*url\s+(https:\/\/[a-z0-9-]+\.vercel\.app)\s*$/m.exec(String(r.stdout || ''));
  return m ? m[1] : null;
}

// Redeploy do ÚLTIMO deploy de produção (nunca sobe código da pasta local, mesmo que não esteja mesclado).
function dispararDeploy(rodar = rodarVercel) {
  const url = ultimoDeployProducao(rodar);
  if (!url) return false;
  return rodar(['redeploy', url, '--target', 'production']).status === 0;
}

async function soConta({ token = process.env.INSTAGRAM_ACCESS_TOKEN || '', redeploy = false, buscar = fetch, vercel = atualizarVercelVar, deploy = dispararDeploy, escreverEnv } = {}) {
  if (!token) { console.log('INSTAGRAM_ACCESS_TOKEN ausente no .env. Nada gravado.'); return 1; }
  const achado = await obterIdConta(token, { buscar });
  if (!achado.ok) { console.log(`ID não encontrado: ${achado.erro}. Nada gravado.`); return 1; }
  if (achado.username !== CONTA_ESPERADA) { console.log(`Conta do token é @${achado.username}, não @${CONTA_ESPERADA}. Nada gravado.`); return 1; }
  console.log(`ID encontrado para @${achado.username}.`);
  const gravarLocal = escreverEnv || ((valor) => {
    const arq = path.join(RAIZ, '.env');
    const atual = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
    fs.writeFileSync(arq, atualizarEnv(atual, valor, 'INSTAGRAM_ACCOUNT_ID'), 'utf8');
  });
  gravarLocal(achado.id);
  console.log('.env local: INSTAGRAM_ACCOUNT_ID gravado.');
  const vercelOk = vercel('INSTAGRAM_ACCOUNT_ID', achado.id);
  console.log(`Vercel (produção): ${vercelOk ? 'INSTAGRAM_ACCOUNT_ID gravado' : 'FALHOU (faça login no CLI da Vercel ou atualize pela interface)'}.`);
  if (!vercelOk) return 1;
  if (redeploy) {
    const ok = deploy();
    console.log(`Redeploy de produção: ${ok ? 'disparado' : 'FALHOU'}.`);
    return ok ? 0 : 1;
  }
  console.log('Redeploy não disparado (use --redeploy para disparar).');
  return 0;
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
function atualizarVercelVar(variavel, valor) {
  rodarVercel(['env', 'rm', variavel, 'production', '--yes']);
  const r = rodarVercel(['env', 'add', variavel, 'production'], { input: `${valor}\n` });
  return r.status === 0;
}
const atualizarVercel = (token) => atualizarVercelVar(VAR, token);

async function principal() {
  const redeploy = process.argv.includes('--redeploy');
  let projeto = null;
  try { projeto = JSON.parse(fs.readFileSync(path.join(RAIZ, '.vercel', 'project.json'), 'utf8')); } catch { /* ausente */ }
  const permissao = projetoPermitido(projeto);
  if (!permissao.ok) { console.log(`Recusado: ${permissao.motivo}. Nada foi gravado.`); return 1; }
  if (process.argv.includes('--so-conta')) return soConta({ redeploy });
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
    console.log(`Redeploy de produção: ${dispararDeploy() ? 'disparado' : 'FALHOU'}.`);
  } else if (!redeploy) {
    console.log('Redeploy não disparado (use --redeploy para disparar).');
  }
  return vercelOk ? 0 : 1;
}

if (require.main === module) {
  principal().then((c) => { process.exitCode = c; }).catch((e) => { console.log(`Erro: ${redigir(e.message, process.env.INSTAGRAM_ACCESS_TOKEN || '')}`); process.exitCode = 1; });
}

module.exports = { hostDoToken, redigir, validarMe, debugToken, resumoValido, atualizarEnv, dataBR, projetoPermitido, obterIdConta, soConta, dispararDeploy, PROJETO_OFICIAL_ID };
