/**
 * Token do Instagram com renovação automática e pausa por token inválido
 * (Seção 20-ter e seção "Segredos" do CLAUDE.md).
 *
 * O token do Instagram Login (prefixo IGAA) vale 60 dias. Um Vercel Cron
 * semanal chama `renovarTokenInstagram()`, que troca o token atual por um novo
 * via `ig_refresh_token` e o guarda CIFRADO no MongoDB (model Credencial).
 * A publicação lê sempre `obterTokenInstagram()`, que devolve o mais recente.
 *
 * Por que MongoDB e não a variável da Vercel via API: gravar variável exige um
 * token da API da Vercel com poder sobre a conta inteira, e o valor novo só
 * vale depois de um redeploy. Aqui o token novo vale na próxima chamada.
 *
 * Chave de cifra: derivada do CRON_SECRET, nunca gravada no banco nem no
 * repositório. Se o CRON_SECRET for trocado, o token guardado deixa de ser
 * legível: o erro é logado e o token da variável de ambiente volta a valer.
 *
 * Troca manual: se alguém atualizar INSTAGRAM_ACCESS_TOKEN na Vercel, a
 * impressão digital da variável deixa de bater com `origemHash` e o token da
 * variável passa a valer imediatamente.
 *
 * Pausa: se a Meta recusar o token (revogado, inválido, sem permissão), a
 * fila e a renovação param — em vez de repetir chamadas com um token morto —
 * até a impressão digital do token em uso mudar (token novo configurado).
 *
 * O token viaja só no cabeçalho Authorization, nunca na URL, e nenhum log
 * daqui contém o token: tudo passa pelo redator (lib/log.js).
 */
const crypto = require('crypto');
const db = require('./db');
const Credencial = require('../models/Credencial');
const { log } = require('./log');

const CHAVE_DOC = 'instagram_access_token';
const URL_RENOVACAO = 'https://graph.instagram.com/refresh_access_token';
const DIA_MS = 24 * 60 * 60 * 1000;

const tokenDaVariavel = () => (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();

/** Impressão digital de um token: SHA-256 truncado em 16 hex. Não permite reconstruí-lo. */
const impressaoDigital = (token) => (token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16) : '');

/**
 * Erro da Meta que significa "este token não serve mais": 190 (inválido,
 * expirado, revogado, senha trocada), 102 (sessão), 10 e 200–299 (permissão).
 * Limites de taxa (4, 17, 32, 613) e falhas temporárias NÃO pausam.
 */
function ehErroDeToken(erroMeta) {
  const codigo = Number(erroMeta && erroMeta.code);
  return codigo === 190 || codigo === 102 || codigo === 10 || (codigo >= 200 && codigo <= 299);
}

function chaveDeCifra() {
  const segredo = process.env.CRON_SECRET;
  return segredo ? crypto.createHash('sha256').update(`instagram-token:${segredo}`).digest() : null;
}

function cifrar(texto, chave) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv('aes-256-gcm', chave, iv);
  const corpo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString('base64');
}

function decifrar(base64, chave) {
  const dados = Buffer.from(base64, 'base64');
  const decifra = crypto.createDecipheriv('aes-256-gcm', chave, dados.subarray(0, 12));
  decifra.setAuthTag(dados.subarray(12, 28));
  return Buffer.concat([decifra.update(dados.subarray(28)), decifra.final()]).toString('utf8');
}

async function lerDoc() {
  if (!db.isConfigured()) return null;
  await db.connect();
  return Credencial.findOne({ chave: CHAVE_DOC }).lean();
}

/** Token em uso e de onde veio: 'renovado' (banco, cifrado), 'variavel' ou 'ausente'. */
async function resolverToken() {
  const daVariavel = tokenDaVariavel();
  if (!daVariavel) return { token: '', origem: 'ausente' };
  const chave = chaveDeCifra();
  if (!chave || !db.isConfigured()) return { token: daVariavel, origem: 'variavel' };

  try {
    const doc = await lerDoc();
    if (!doc || !doc.cifrado) return { token: daVariavel, origem: 'variavel' };
    if (doc.origemHash !== impressaoDigital(daVariavel)) {
      log.info('[token-instagram] INSTAGRAM_ACCESS_TOKEN foi trocado na variável de ambiente — usando o da variável (o renovado antes da troca foi ignorado).');
      return { token: daVariavel, origem: 'variavel' };
    }
    return { token: decifrar(doc.cifrado, chave), origem: 'renovado' };
  } catch (err) {
    log.erro(`[token-instagram] Não foi possível ler o token renovado (${err.message}) — usando o da variável de ambiente. Se o CRON_SECRET foi trocado, a próxima renovação corrige.`);
    return { token: daVariavel, origem: 'variavel' };
  }
}

/** Token mais recente: o renovado no banco, se válido e da mesma origem; senão o da variável. */
async function obterTokenInstagram() {
  return (await resolverToken()).token;
}

/**
 * Registra que a Meta recusou o token em uso e pausa a fila. Nunca lança.
 * @param {{ origem: string, codigo?: number, subcodigo?: number, mensagem?: string }} detalhe
 */
async function registrarTokenInvalido({ origem, codigo, subcodigo, mensagem }) {
  const { token } = await resolverToken();
  const impressao = impressaoDigital(token);
  const motivo = `${origem}: Meta recusou o token (código ${codigo ?? '?'}${subcodigo ? `/${subcodigo}` : ''}${mensagem ? ` — ${mensagem}` : ''})`;
  log.erro(`[token-instagram] ALERTA: ${motivo}. Token em uso (impressão ${impressao || 'nenhuma'}) está revogado, inválido ou sem permissão. FILA DE PUBLICAÇÃO PAUSADA até um token novo ser configurado em INSTAGRAM_ACCESS_TOKEN na Vercel (+ redeploy). Nenhuma nova tentativa será feita com este token.`);
  try {
    if (db.isConfigured()) {
      await db.connect();
      await Credencial.updateOne(
        { chave: CHAVE_DOC },
        { $set: { pausadoEm: new Date(), motivoPausa: motivo, impressaoPausada: impressao, ultimoErro: motivo, ultimaTentativaEm: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    log.erro(`[token-instagram] ALERTA: não foi possível gravar a pausa no banco (${err.message}).`);
  }
}

/**
 * Pausa vigente, ou null. Se o token em uso mudou desde a pausa (token novo
 * configurado), a pausa é removida aqui e a fila volta a andar.
 */
async function estadoPausa() {
  let doc;
  try {
    doc = await lerDoc();
  } catch (err) {
    log.erro(`[token-instagram] Não foi possível ler o estado de pausa (${err.message}).`);
    return null;
  }
  if (!doc || !doc.pausadoEm) return null;

  const { token } = await resolverToken();
  if (impressaoDigital(token) !== doc.impressaoPausada) {
    await Credencial.updateOne({ chave: CHAVE_DOC }, { $set: { pausadoEm: null, motivoPausa: '', impressaoPausada: '' } });
    log.info(`[token-instagram] Token novo detectado (impressão ${impressaoDigital(token)}) — fila de publicação retomada.`);
    return null;
  }
  return { desde: doc.pausadoEm, motivo: doc.motivoPausa };
}

/** Resumo sem segredos para o /admin: origem, impressão digital, validade, pausa. */
async function resumoToken() {
  const { token, origem } = await resolverToken();
  const doc = await lerDoc().catch(() => null);
  return {
    origem,
    impressaoDigital: impressaoDigital(token),
    renovadoEm: doc?.renovadoEm || null,
    expiraEm: doc?.expiraEm || null,
    ultimoErro: doc?.ultimoErro || null,
    pausa: await estadoPausa(),
  };
}

/** Renova o token atual e guarda o novo. Nunca lança: devolve o resultado e loga falhas de forma explícita. */
async function renovarTokenInstagram() {
  const chave = chaveDeCifra();
  if (!chave) return falha('CRON_SECRET ausente — sem chave para cifrar o token renovado.');
  const daVariavel = tokenDaVariavel();
  if (!daVariavel) return falha('INSTAGRAM_ACCESS_TOKEN ausente nas variáveis de ambiente.');

  await db.connect();
  const pausa = await estadoPausa();
  if (pausa) {
    log.aviso(`[token-instagram] Renovação pulada: a fila está pausada por token inválido desde ${new Date(pausa.desde).toISOString()}. Configure um token novo.`);
    return { renovado: false, motivo: 'pausada por token inválido', pausa };
  }

  const atual = await obterTokenInstagram();
  if (!atual.startsWith('IGAA')) {
    return falha('o token atual não é do Instagram Login (prefixo IGAA); ig_refresh_token não se aplica. Renove manualmente (npm run renovar-token-instagram).');
  }

  let dados;
  try {
    const resp = await fetch(`${URL_RENOVACAO}?grant_type=ig_refresh_token`, {
      headers: { Authorization: `Bearer ${atual}` },
    });
    dados = await resp.json();
    if (!resp.ok || dados.error || !dados.access_token) {
      const e = dados.error || {};
      if (ehErroDeToken(e)) {
        await registrarTokenInvalido({ origem: 'renovação', codigo: e.code, subcodigo: e.error_subcode, mensagem: e.message });
        return { renovado: false, motivo: 'token recusado pela Meta — fila pausada' };
      }
      throw new Error(`HTTP ${resp.status}${e.code ? ` / código ${e.code}` : ''}: ${e.message || 'resposta sem access_token'}`);
    }
  } catch (err) {
    return falha(`a Meta recusou a renovação — ${err.message}`);
  }

  const agora = new Date();
  const expiraEm = new Date(agora.getTime() + (Number(dados.expires_in) || 0) * 1000);
  await Credencial.updateOne(
    { chave: CHAVE_DOC },
    {
      $set: {
        cifrado: cifrar(dados.access_token, chave),
        origemHash: impressaoDigital(daVariavel),
        impressaoDigital: impressaoDigital(dados.access_token),
        renovadoEm: agora,
        expiraEm,
        ultimaTentativaEm: agora,
        ultimoErro: '',
      },
    },
    { upsert: true }
  );
  const dias = Math.round((expiraEm - agora) / DIA_MS);
  log.info(`[token-instagram] Token renovado com sucesso (impressão ${impressaoDigital(dados.access_token)}). Vale até ${expiraEm.toISOString().slice(0, 10)} (~${dias} dias).`);
  return { renovado: true, expiraEm };
}

/** Registra a falha no banco e no log (vercel logs), com o prazo que ainda resta. */
async function falha(motivo) {
  let prazo = 'validade do token atual desconhecida';
  try {
    if (db.isConfigured()) {
      await db.connect();
      const doc = await Credencial.findOneAndUpdate(
        { chave: CHAVE_DOC },
        { $set: { ultimaTentativaEm: new Date(), ultimoErro: motivo } },
        { upsert: true, returnDocument: 'after' }
      ).lean();
      if (doc && doc.expiraEm) {
        const dias = Math.floor((new Date(doc.expiraEm) - Date.now()) / DIA_MS);
        prazo = dias >= 0 ? `o token atual ainda vale ~${dias} dias (até ${new Date(doc.expiraEm).toISOString().slice(0, 10)})` : 'o token atual JÁ VENCEU';
      }
    }
  } catch (err) {
    prazo += ` (e o registro da falha no banco também falhou: ${err.message})`;
  }
  log.erro(`[token-instagram] FALHA NA RENOVAÇÃO: ${motivo} — ${prazo}. Sem token válido a fila de publicação para. Ação: gerar um token novo, atualizar INSTAGRAM_ACCESS_TOKEN na Vercel e rodar "npm run renovar-token-instagram -- --verificar".`);
  return { renovado: false, motivo };
}

module.exports = {
  obterTokenInstagram,
  renovarTokenInstagram,
  registrarTokenInvalido,
  estadoPausa,
  resumoToken,
  impressaoDigital,
  ehErroDeToken,
};
