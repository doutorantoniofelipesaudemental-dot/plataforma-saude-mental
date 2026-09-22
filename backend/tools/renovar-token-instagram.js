/**
 * Troca um User Token CURTO do Meta Graph API Explorer por um Token de Longa
 * Duração (~60 dias) para o Instagram, valida a conta/permissões, e atualiza
 * `.env.local` automaticamente com o resultado.
 *
 * Pré-requisitos em `.env.local`:
 *   FACEBOOK_APP_ID=<id do app em developers.facebook.com/apps>
 *   FACEBOOK_APP_SECRET=<app secret do mesmo app>
 *   INSTAGRAM_ACCOUNT_ID=<ja deve estar la>
 *
 * Onde conseguir o token curto (passo manual — só um humano logado consegue):
 *   1. https://developers.facebook.com/tools/explorer/
 *   2. Selecione o app certo em "Meta App"
 *   3. Em "User or Page", escolha "User Token"
 *   4. Marque as permissões: instagram_basic, instagram_content_publish,
 *      pages_show_list, pages_read_engagement, business_management
 *   5. "Generate Access Token" → autorize → copie o token gerado
 *
 * Uso:
 *   npm run renovar-token-instagram -- --token=<user-token-curto>
 *
 * Mesmo fluxo (`fb_exchange_token`) já usado por
 * `renovar_token_longa_duracao()` em publicar_instagram.py — esta versão
 * Node só adiciona a validação de permissões e a escrita automática em
 * .env.local que aquela função (de propósito) não fazia.
 */
const fs = require('fs');
const path = require('path');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const ARQUIVO_ENV_LOCAL = path.join(__dirname, '..', '..', '.env.local');

function lerArgumentos() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  }
  return args;
}

/** Passo 1: troca o token curto por um de longa duração (grant_type=fb_exchange_token). */
async function trocarPorTokenLongo(tokenCurto, appId, appSecret) {
  const url = `${GRAPH_BASE}/oauth/access_token?` + new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: tokenCurto,
  });
  const resp = await fetch(url);
  const dados = await resp.json();
  if (!resp.ok || !dados.access_token) {
    throw new Error(`Troca de token falhou: HTTP ${resp.status} ${JSON.stringify(dados)}`);
  }
  return { token: dados.access_token, expiraEmSegundos: dados.expires_in || 0 };
}

/** Passo 2: valida o token novo — páginas visíveis, permissões concedidas, e a conta do Instagram alvo. */
async function validarToken(tokenLongo, contaId) {
  const respContas = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${tokenLongo}`);
  const dadosContas = await respContas.json();
  if (!respContas.ok) {
    throw new Error(`Falha ao validar via /me/accounts: ${JSON.stringify(dadosContas)}`);
  }

  const respPermissoes = await fetch(`${GRAPH_BASE}/me/permissions?access_token=${tokenLongo}`);
  const dadosPermissoes = await respPermissoes.json();
  const permissoes = respPermissoes.ok ? dadosPermissoes.data || [] : [];
  const publishConcedida = permissoes.some((p) => p.permission === 'instagram_content_publish' && p.status === 'granted');

  const respConta = await fetch(`${GRAPH_BASE}/${contaId}?fields=username,name&access_token=${tokenLongo}`);
  const dadosConta = await respConta.json();
  if (!respConta.ok) {
    throw new Error(`INSTAGRAM_ACCOUNT_ID (${contaId}) não respondeu com este token: ${JSON.stringify(dadosConta)}`);
  }

  return {
    paginas: dadosContas.data || [],
    permissoes,
    instagramContentPublishConcedida: publishConcedida,
    contaInstagram: dadosConta,
  };
}

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

async function main() {
  const args = lerArgumentos();
  if (!args.token) {
    console.error('\n  Informe --token=<user-token-curto-do-graph-api-explorer>');
    console.error('  Consiga em: https://developers.facebook.com/tools/explorer/\n');
    process.exit(1);
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const contaId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!appId || !appSecret) {
    console.error('\n  FACEBOOK_APP_ID e/ou FACEBOOK_APP_SECRET ausentes em .env.local.');
    console.error('  Pegue em https://developers.facebook.com/apps/ -> seu app -> Configurações > Básico.\n');
    process.exit(1);
  }
  if (!contaId) {
    console.error('\n  INSTAGRAM_ACCOUNT_ID ausente em .env.local.\n');
    process.exit(1);
  }

  try {
    console.log('Trocando token curto por token de longa duração...');
    const { token, expiraEmSegundos } = await trocarPorTokenLongo(args.token, appId, appSecret);
    console.log(`OK — novo token expira em ~${Math.round(expiraEmSegundos / 86400)} dias.`);

    console.log('\nValidando o novo token (páginas, permissões, conta do Instagram)...');
    const validacao = await validarToken(token, contaId);
    console.log('Páginas visíveis para este token:', validacao.paginas.map((p) => p.name).join(', ') || '(nenhuma)');
    console.log('instagram_content_publish concedida?', validacao.instagramContentPublishConcedida);
    console.log('Conta do Instagram (INSTAGRAM_ACCOUNT_ID) confirmada:', JSON.stringify(validacao.contaInstagram));

    if (!validacao.instagramContentPublishConcedida) {
      console.warn('\n  AVISO: a permissão "instagram_content_publish" não aparece como concedida.');
      console.warn('  Publicações vão continuar falhando até essa permissão ser revisada/reautorizada.\n');
    }

    atualizarEnvLocal(token);
    console.log('\n.env.local atualizado com o novo INSTAGRAM_ACCESS_TOKEN.\n');
  } catch (err) {
    console.error('\nFalha na renovação:', err.message, '\n');
    process.exit(1);
  }
}

main();
