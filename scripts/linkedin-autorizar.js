#!/usr/bin/env node
/**
 * Obtém o token do LinkedIn (OAuth 2.0, produto "Share on LinkedIn" = escopo w_member_social, mais openid/profile para saber o ID do perfil)
 * e grava no .env local: LINKEDIN_ACCESS_TOKEN, LINKEDIN_AUTHOR_URN, LINKEDIN_TOKEN_VENCE_EM. Nenhum valor aparece no terminal.
 *   npm run linkedin:autorizar
 * Pré-requisitos no .env: LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET do app criado em linkedin.com/developers, com os produtos
 * "Share on LinkedIn" e "Sign In with LinkedIn using OpenID Connect" e o redirect http://127.0.0.1:53683/callback.
 * O token de apps comuns dura ~60 dias e NÃO tem renovação automática: o avisa a rotina semanal; repita este comando antes de vencer.
 * Depois, copie as 3 variáveis (e LINKEDIN_PUBLICACAO_ATIVA=true) para Vercel > Project Settings > Environment Variables e faça o redeploy.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ARQUIVO_ENV = path.join(__dirname, '..', '.env');
if (fs.existsSync(ARQUIVO_ENV)) process.loadEnvFile(ARQUIVO_ENV);
const PORTA = 53683;
const REDIRECT = `http://127.0.0.1:${PORTA}/callback`;
const { LINKEDIN_CLIENT_ID: id, LINKEDIN_CLIENT_SECRET: segredo } = process.env;
if (!id || !segredo) { console.error('\n  Coloque LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET no .env antes (ver relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md).\n'); process.exit(1); }

function gravarNoEnv(chave, valor) {
  let env = fs.existsSync(ARQUIVO_ENV) ? fs.readFileSync(ARQUIVO_ENV, 'utf8') : '';
  const linha = `${chave}="${valor}"`;
  env = new RegExp(`^${chave}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${chave}=.*$`, 'm'), linha) : `${env.replace(/\n*$/, '\n')}${linha}\n`;
  fs.writeFileSync(ARQUIVO_ENV, env);
}

const estado = require('crypto').randomBytes(12).toString('hex');
const url = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({ response_type: 'code', client_id: id, redirect_uri: REDIRECT, scope: 'openid profile w_member_social', state: estado })}`;

const servidor = http.createServer(async (req, res) => {
  const r = new URL(req.url, REDIRECT);
  if (r.pathname !== '/callback') return res.writeHead(404).end();
  const responder = (t) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<p style="font-family:sans-serif">${t}</p>`); servidor.close(); };
  if (r.searchParams.get('state') !== estado || !r.searchParams.get('code')) return responder('Autorização não concluída. Pode fechar esta aba.');
  const t = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: r.searchParams.get('code'), redirect_uri: REDIRECT, client_id: id, client_secret: segredo }) }).then((x) => x.json()).catch(() => ({}));
  if (!t.access_token) { console.error(`\n  O LinkedIn não devolveu o token (${t.error || 'erro'}). Confira o redirect e os produtos do app.\n`); return responder('Não foi possível obter o token. Veja o terminal.'); }
  const u = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${t.access_token}` } }).then((x) => x.json()).catch(() => ({}));
  if (!u.sub) { console.error('\n  Token obtido, mas não consegui ler o ID do perfil (produto OpenID ativo?).\n'); return responder('Falha ao ler o perfil. Veja o terminal.'); }
  gravarNoEnv('LINKEDIN_ACCESS_TOKEN', t.access_token);
  gravarNoEnv('LINKEDIN_AUTHOR_URN', `urn:li:person:${u.sub}`);
  const vence = new Date(Date.now() + (Number(t.expires_in) || 5184000) * 1000).toISOString().slice(0, 10);
  gravarNoEnv('LINKEDIN_TOKEN_VENCE_EM', vence);
  if (t.refresh_token) gravarNoEnv('LINKEDIN_REFRESH_TOKEN', t.refresh_token);
  console.log(`\n  ✅ Token do LinkedIn gravado no .env (valores não exibidos). Vence em ${vence}.\n`);
  responder('Pronto: autorização gravada no .env. Pode fechar esta aba.');
});
servidor.listen(PORTA, '127.0.0.1', () => { console.log('\n  Abra este endereço no navegador, entre no LinkedIn do Dr. Antônio e autorize:\n'); console.log(`  ${url}\n`); });
