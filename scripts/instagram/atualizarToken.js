/**
 * Atualiza o token do Instagram (INSTAGRAM_ACCESS_TOKEN): valida, grava no .env local e na Vercel (produção, projeto drsaudemental) e, só com --redeploy, dispara o deploy.
 * Rodar numa janela do PowerShell, fora do Claude Code:
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js --redeploy
 *   node --env-file-if-exists=.env scripts/instagram/atualizarToken.js --com-secret --app-id=<ID do app do Instagram> [--redeploy]
 * --com-secret: pede também o segredo do app (entrada oculta), confere que o token pertence ao app informado e grava o segredo só no .env local.
 * O token e o segredo são digitados com entrada oculta, vão para a Vercel pela entrada padrão (nunca pela linha de comando) e nunca aparecem na saída.
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

// IGAA = Instagram Login (graph.instagram.com); demais = via Página do Facebook (graph.facebook.com).
function hostDoToken(token) {
  return `https://${require('../../backend/lib/instagramHost').hostDoToken(token)}`;
}

// Nunca deixa um segredo sair em texto: troca qualquer ocorrência por [REDACTED].
function redigir(texto, ...segredos) {
  return segredos.filter(Boolean).reduce((t, s) => t.split(s).join('[REDACTED]'), String(texto));
}

// Valida no /me, com o token no cabeçalho (nunca na URL). Devolve também o user_id da conta.
async function validarMe(token, { buscar = fetch } = {}) {
  const r = await buscar(`${hostDoToken(token)}/me?fields=user_id,username,account_type`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  const id = j.user_id || j.id;
  if (!r.ok || j.error || !id) return { ok: false, erro: redigir(j.error ? `${j.error.code}: ${j.error.message}` : `HTTP ${r.status}`, token) };
  return { ok: true, usuario: j.username || '?', conta: j.account_type || '?', userId: String(id) };
}

// Dados do token pelo debug_token (exige app id e app secret; o token vai no corpo, não na URL).
async function debugToken(token, { appId, appSecret, buscar = fetch } = {}) {
  if (!appId || !appSecret) return { app: 'não verificado (defina INSTAGRAM_APP_ID)', appId: null, expiraEm: null };
  const corpo = new URLSearchParams({ input_token: token, access_token: `${appId}|${appSecret}` });
  const r = await buscar('https://graph.facebook.com/debug_token', { method: 'POST', body: corpo });
  const d = (await r.json().catch(() => ({}))).data || {};
  return { app: d.application || '?', appId: d.app_id ? String(d.app_id) : null, expiraEm: d.expires_at ? new Date(d.expires_at * 1000) : null, valido: d.is_valid === true };
}

// Fecha por padrão: sem app id confirmado pela Meta, o token não é aceito.
function conferirApp(esperado, dbg) {
  if (!esperado) return { ok: false, motivo: 'ID do app não informado (use --app-id=<ID> ou defina INSTAGRAM_APP_ID)' };
  if (!dbg || !dbg.appId) return { ok: false, motivo: 'a Meta não confirmou a qual app o token pertence (debug_token sem app_id)' };
  if (dbg.appId !== String(esperado)) return { ok: false, motivo: 'o token pertence a outro app; recusado' };
  return { ok: true };
}

// Mostra só se o ID da conta mudou, sem revelar o valor antigo nem o novo.
function mudouConta(atual, novo) {
  return String(atual || '') !== String(novo || '');
}

const dataBR = (d) => (d ? `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}` : 'não informada pela API');

// Linha da saída: só status, conta, host, app e validade. Nunca o token nem o segredo.
function resumoValido({ usuario, conta }, { app, appId, expiraEm }, host = '', contaMudou = null) {
  const alvo = appId ? `${app} (id ${appId})` : app;
  const contaTxt = contaMudou === null ? '' : `, ID da conta ${contaMudou ? 'MUDOU (atualizado)' : 'não mudou'}`;
  return `VÁLIDO para @${usuario} (${conta}), host ${host || '?'}, app ${alvo}${contaTxt}, expira em ${dataBR(expiraEm)}`;
}

// Troca (ou acrescenta) uma linha NOME=valor no texto do .env, mantendo as outras linhas e o fim de linha.
function atualizarVariavelEnv(texto, nome, valor) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const linhas = texto.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.startsWith(`${nome}=`));
  if (i >= 0) linhas[i] = `${nome}=${valor}`;
  else if (linhas[linhas.length - 1] === '') linhas.splice(linhas.length - 1, 0, `${nome}=${valor}`);
  else linhas.push(`${nome}=${valor}`);
  return linhas.join(eol);
}

const atualizarEnv = (texto, token) => atualizarVariavelEnv(texto, VAR, token);

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
function atualizarVercelVariavel(nome, valor) {
  spawnSync('vercel', ['env', 'rm', nome, 'production', '--yes'], { cwd: RAIZ, shell: true, encoding: 'utf8', timeout: 120000 });
  const r = spawnSync('vercel', ['env', 'add', nome, 'production'], { cwd: RAIZ, shell: true, encoding: 'utf8', input: `${valor}\n`, timeout: 120000 });
  return r.status === 0;
}

const argumento = (nome) => (process.argv.find((a) => a.startsWith(`--${nome}=`)) || '').split('=').slice(1).join('=');

async function principal() {
  const redeploy = process.argv.includes('--redeploy');
  const comSecret = process.argv.includes('--com-secret');
  let projeto = null;
  try { projeto = JSON.parse(fs.readFileSync(path.join(RAIZ, '.vercel', 'project.json'), 'utf8')); } catch { /* ausente */ }
  const permissao = projetoPermitido(projeto);
  if (!permissao.ok) { console.log(`Recusado: ${permissao.motivo}. Nada foi gravado.`); return 1; }

  const token = await pedirOculto('Cole o token novo (entrada oculta) e tecle Enter: ');
  if (!token) { console.log('Nenhum token informado. Nada feito.'); return 1; }
  const segredo = comSecret ? await pedirOculto('Cole o segredo do app do Instagram (entrada oculta) e tecle Enter: ') : '';
  if (comSecret && !segredo) { console.log('Nenhum segredo informado. Nada feito.'); return 1; }

  const appEsperado = argumento('app-id') || process.env.INSTAGRAM_APP_ID || '';
  const me = await validarMe(token);
  if (!me.ok) { console.log(`INVÁLIDO: ${me.erro}. Nada foi gravado.`); return 1; }

  const dbg = await debugToken(token, { appId: appEsperado || process.env.FACEBOOK_APP_ID, appSecret: segredo || process.env.INSTAGRAM_APP_SECRET });
  if (comSecret) {
    const app = conferirApp(appEsperado, dbg);
    if (!app.ok) { console.log(`RECUSADO: ${redigir(app.motivo, token, segredo)}. Nada foi gravado.`); return 1; }
  }

  const arq = path.join(RAIZ, '.env');
  let texto = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  const contaAtual = (texto.match(/^INSTAGRAM_ACCOUNT_ID=(.*)$/m) || [])[1];
  const contaMudou = comSecret ? mudouConta(contaAtual, me.userId) : null;
  console.log(resumoValido(me, dbg, require('../../backend/lib/instagramHost').hostDoToken(token), contaMudou));

  texto = atualizarVariavelEnv(texto, VAR, token);
  if (comSecret) {
    texto = atualizarVariavelEnv(texto, 'INSTAGRAM_APP_SECRET', segredo);
    texto = atualizarVariavelEnv(texto, 'INSTAGRAM_APP_ID', appEsperado);
    if (contaMudou) texto = atualizarVariavelEnv(texto, 'INSTAGRAM_ACCOUNT_ID', me.userId);
  }
  fs.writeFileSync(arq, texto, 'utf8');
  console.log('.env local: atualizado.');

  let vercelOk = atualizarVercelVariavel(VAR, token);
  if (vercelOk && comSecret && contaMudou) vercelOk = atualizarVercelVariavel('INSTAGRAM_ACCOUNT_ID', me.userId);
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
  principal().then((c) => { process.exitCode = c; }).catch((e) => { console.log(`Erro: ${redigir(e.message, process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_APP_SECRET)}`); process.exitCode = 1; });
}

module.exports = { hostDoToken, redigir, validarMe, debugToken, conferirApp, mudouConta, resumoValido, atualizarEnv, atualizarVariavelEnv, dataBR, projetoPermitido, PROJETO_OFICIAL_ID };
