/**
 * Renova (ou valida) o token do Instagram usado pela fila de publicação e
 * atualiza `.env.local`. Detecta o tipo de token pelo prefixo — os dois
 * fluxos da Meta são incompatíveis entre si:
 *
 *   IGAA… — Instagram Login (o token atual da conta). Vive em
 *           graph.instagram.com. Renovar = `ig_refresh_token` sobre o PRÓPRIO
 *           token de longa duração, sem app secret. Regras da Meta: o token
 *           precisa ter pelo menos 24h e ainda não ter vencido (60 dias).
 *   EAA…  — Login via Página do Facebook. Vive em graph.facebook.com.
 *           Renovar = trocar um token CURTO do Graph API Explorer por um longo
 *           (`fb_exchange_token`), com FACEBOOK_APP_ID/FACEBOOK_APP_SECRET.
 *
 * Uso:
 *   npm run renovar-token-instagram -- --verificar
 *       Só valida o token atual (conta, cota de publicação). Não muda nada.
 *   npm run renovar-token-instagram
 *       IGAA: renova o INSTAGRAM_ACCESS_TOKEN atual por mais 60 dias.
 *   npm run renovar-token-instagram -- --token=<token>
 *       IGAA de longa duração: renova esse token.
 *       IGAA curto (recém-saído do login): acrescente --curto; troca por um
 *       longo com `ig_exchange_token` (exige INSTAGRAM_APP_SECRET).
 *       EAA curto: fluxo antigo, com FACEBOOK_APP_ID/FACEBOOK_APP_SECRET.
 *
 * IMPORTANTE: a fila diária roda na Vercel e lê o token das variáveis de
 * ambiente de PRODUÇÃO, não deste `.env.local`. Se o token mudar, atualize
 * também INSTAGRAM_ACCESS_TOKEN no painel da Vercel (o script avisa).
 */
const fs = require('fs');
const path = require('path');

const GRAPH_API_VERSION = 'v21.0';
const INSTAGRAM_BASE = 'https://graph.instagram.com';
const FACEBOOK_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const ARQUIVO_ENV_LOCAL = path.join(__dirname, '..', '..', '.env.local');
const SEGUNDOS_POR_DIA = 86400;

function lerArgumentos() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  }
  return args;
}

async function getJson(url) {
  const resp = await fetch(url);
  const dados = await resp.json();
  if (!resp.ok || dados.error) {
    const erro = dados.error ? `${dados.error.code}: ${dados.error.message}` : `HTTP ${resp.status}`;
    throw new Error(erro);
  }
  return dados;
}

const ehInstagramLogin = (token) => token.startsWith('IGAA');

/* ------------------------ Instagram Login (IGAA) ------------------------- */

/** Troca um token curto do Instagram Login por um de longa duração. */
async function trocarCurtoInstagram(tokenCurto, appSecret) {
  const dados = await getJson(`${INSTAGRAM_BASE}/access_token?` + new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: appSecret,
    access_token: tokenCurto,
  }));
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in || 0 };
}

/** Renova um token de longa duração do Instagram Login por mais 60 dias. */
async function renovarInstagram(tokenLongo) {
  const dados = await getJson(`${INSTAGRAM_BASE}/refresh_access_token?` + new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: tokenLongo,
  }));
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in || 0 };
}

async function validarInstagram(token, contaId) {
  const base = `${INSTAGRAM_BASE}/${GRAPH_API_VERSION}`;
  const qs = `access_token=${encodeURIComponent(token)}`;
  const conta = await getJson(`${base}/${contaId}?fields=username,media_count&${qs}`);
  const limite = await getJson(`${base}/${contaId}/content_publishing_limit?fields=config,quota_usage&${qs}`);
  const cota = (limite.data || [])[0] || {};
  return {
    conta: `@${conta.username} (${conta.media_count} posts)`,
    cota: cota.config ? `${cota.quota_usage}/${cota.config.quota_total} posts usados nas últimas 24h` : 'indisponível',
  };
}

/* ---------------------- Via Página do Facebook (EAA) --------------------- */

async function trocarCurtoFacebook(tokenCurto, appId, appSecret) {
  const dados = await getJson(`${FACEBOOK_BASE}/oauth/access_token?` + new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: tokenCurto,
  }));
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in || 0 };
}

async function validarFacebook(token, contaId) {
  const qs = `access_token=${encodeURIComponent(token)}`;
  const permissoes = (await getJson(`${FACEBOOK_BASE}/me/permissions?${qs}`)).data || [];
  const publica = permissoes.some((p) => p.permission === 'instagram_content_publish' && p.status === 'granted');
  const conta = await getJson(`${FACEBOOK_BASE}/${contaId}?fields=username&${qs}`);
  return {
    conta: `@${conta.username}`,
    cota: publica ? 'instagram_content_publish concedida' : 'AVISO: instagram_content_publish NÃO concedida — publicações vão falhar',
  };
}

/* --------------------------------- CLI ----------------------------------- */

/** Substitui (ou adiciona) a linha INSTAGRAM_ACCESS_TOKEN= em .env.local, preservando o resto do arquivo. */
function atualizarEnvLocal(novoToken) {
  let conteudo = fs.existsSync(ARQUIVO_ENV_LOCAL) ? fs.readFileSync(ARQUIVO_ENV_LOCAL, 'utf8') : '';
  const linha = `INSTAGRAM_ACCESS_TOKEN="${novoToken}"`;
  if (/^INSTAGRAM_ACCESS_TOKEN=.*$/m.test(conteudo)) {
    conteudo = conteudo.replace(/^INSTAGRAM_ACCESS_TOKEN=.*$/m, linha);
  } else {
    conteudo = conteudo.replace(/\n?$/, '') + `\n${linha}\n`;
  }
  fs.writeFileSync(ARQUIVO_ENV_LOCAL, conteudo, 'utf8');
}

function sair(mensagem) {
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

async function main() {
  const args = lerArgumentos();
  const contaId = process.env.INSTAGRAM_ACCOUNT_ID;
  const tokenAtual = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  const tokenEntrada = typeof args.token === 'string' ? args.token.trim() : tokenAtual;

  if (!contaId) sair('INSTAGRAM_ACCOUNT_ID ausente em .env.local.');
  if (!tokenEntrada) sair('Nenhum token: defina INSTAGRAM_ACCESS_TOKEN em .env.local ou passe --token=<token>.');

  const instagram = ehInstagramLogin(tokenEntrada);
  const validar = instagram ? validarInstagram : validarFacebook;
  console.log(`Tipo de token: ${instagram ? 'Instagram Login (graph.instagram.com)' : 'via Página do Facebook (graph.facebook.com)'}`);

  try {
    if (args.verificar) {
      const v = await validar(tokenEntrada, contaId);
      console.log(`Token válido. Conta ${v.conta}. ${v.cota}.`);
      return;
    }

    let novo;
    if (instagram && args.curto) {
      const appSecret = process.env.INSTAGRAM_APP_SECRET;
      if (!appSecret) sair('INSTAGRAM_APP_SECRET ausente — necessário para trocar um token curto do Instagram Login.');
      console.log('Trocando token curto do Instagram Login por um de longa duração...');
      novo = await trocarCurtoInstagram(tokenEntrada, appSecret);
    } else if (instagram) {
      console.log('Renovando o token de longa duração do Instagram Login...');
      novo = await renovarInstagram(tokenEntrada);
    } else {
      const { FACEBOOK_APP_ID: appId, FACEBOOK_APP_SECRET: appSecret } = process.env;
      if (!args.token) sair('Token via Facebook: passe --token=<user-token-curto> do Graph API Explorer.');
      if (!appId || !appSecret) sair('FACEBOOK_APP_ID e/ou FACEBOOK_APP_SECRET ausentes em .env.local.');
      console.log('Trocando token curto do Facebook por um de longa duração...');
      novo = await trocarCurtoFacebook(tokenEntrada, appId, appSecret);
    }

    const dias = Math.round(novo.expiraEmSegundos / SEGUNDOS_POR_DIA);
    const vence = new Date(Date.now() + novo.expiraEmSegundos * 1000).toISOString().slice(0, 10);
    console.log(`OK — o token vale por mais ~${dias} dias (até ${vence}).`);

    const v = await validar(novo.token, contaId);
    console.log(`Conta ${v.conta}. ${v.cota}.`);

    atualizarEnvLocal(novo.token);
    console.log('.env.local atualizado.');
    if (novo.token !== tokenAtual) {
      console.log('\n  O token MUDOU. Atualize INSTAGRAM_ACCESS_TOKEN também no painel da Vercel');
      console.log('  (Settings -> Environment Variables, ambiente Production) — é de lá que a fila diária lê.\n');
    } else {
      console.log('\n  O texto do token não mudou (só a validade): nada a atualizar na Vercel.\n');
    }
  } catch (err) {
    sair(`Falha: ${err.message}`);
  }
}

main();
