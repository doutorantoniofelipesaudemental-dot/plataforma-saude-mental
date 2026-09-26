#!/usr/bin/env node
/**
 * Obtém o YOUTUBE_REFRESH_TOKEN (OAuth 2.0, escopo youtube.upload) e grava
 * direto no .env local — o token nunca aparece no terminal nem no chat.
 *
 *   npm run youtube:autorizar
 *
 * Pré-requisitos no .env: YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET de um
 * cliente OAuth do tipo "App para computador" (Desktop) no Google Cloud, com a
 * YouTube Data API v3 ativada. Entre com a conta Google DONA do canal.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const RAIZ = path.join(__dirname, '..');
const ARQUIVO_ENV = path.join(RAIZ, '.env');
if (fs.existsSync(ARQUIVO_ENV)) process.loadEnvFile(ARQUIVO_ENV);

const PORTA = 53682;
const REDIRECT = `http://127.0.0.1:${PORTA}/callback`;
const { YOUTUBE_CLIENT_ID: id, YOUTUBE_CLIENT_SECRET: segredo } = process.env;

if (!id || !segredo) {
  console.error('\n  Coloque YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET no .env antes (ver CLAUDE.md, 20-nonies).\n');
  process.exit(1);
}

function gravarNoEnv(chave, valor) {
  let env = fs.existsSync(ARQUIVO_ENV) ? fs.readFileSync(ARQUIVO_ENV, 'utf8') : '';
  const linha = `${chave}="${valor}"`;
  env = new RegExp(`^${chave}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${chave}=.*$`, 'm'), linha) : `${env.replace(/\n*$/, '\n')}${linha}\n`;
  fs.writeFileSync(ARQUIVO_ENV, env);
}

const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
url.search = new URLSearchParams({
  client_id: id,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/youtube.upload',
  access_type: 'offline',
  prompt: 'consent',
}).toString();

const servidor = http.createServer(async (req, res) => {
  const recebido = new URL(req.url, REDIRECT);
  if (recebido.pathname !== '/callback') return res.writeHead(404).end();
  const codigo = recebido.searchParams.get('code');
  const erro = recebido.searchParams.get('error');
  const responder = (texto) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<p style="font-family:sans-serif">${texto}</p>`);
    servidor.close();
  };
  if (!codigo) return responder(`Autorização não concluída (${erro || 'sem código'}). Pode fechar esta aba.`);

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: codigo, client_id: id, client_secret: segredo, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.refresh_token) {
    console.error(`\n  O Google não devolveu refresh token (${d.error || r.status}). Tente de novo; se persistir, remova o acesso do app em myaccount.google.com/permissions.\n`);
    return responder('Não foi possível obter o token. Veja o terminal.');
  }
  gravarNoEnv('YOUTUBE_REFRESH_TOKEN', d.refresh_token);
  console.log('\n  ✅ YOUTUBE_REFRESH_TOKEN gravado no .env (valor não exibido).\n');
  responder('Pronto: autorização gravada no .env. Pode fechar esta aba.');
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log('\n  Abra este endereço no navegador, entre com a conta dona do canal e autorize:\n');
  console.log(`  ${url}\n`);
});
