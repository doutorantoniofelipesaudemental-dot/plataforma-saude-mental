/**
 * Token do Instagram com renovação automática (Seção 20-ter do CLAUDE.md).
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
 * Chave de cifra: derivada do CRON_SECRET (que as duas rotas de cron já
 * exigem). Se o CRON_SECRET for trocado, o token guardado deixa de ser
 * legível: o erro é logado e o token da variável de ambiente volta a valer —
 * a renovação seguinte regrava tudo com a chave nova.
 *
 * Troca manual: se alguém atualizar INSTAGRAM_ACCESS_TOKEN na Vercel, o hash
 * da variável deixa de bater com `origemHash` e o token da variável passa a
 * valer imediatamente — a cadeia antiga nunca sobrepõe uma troca manual.
 *
 * Nenhuma função daqui escreve o token (nem trecho dele) em log.
 */
const crypto = require('crypto');
const db = require('./db');
const Credencial = require('../models/Credencial');

const CHAVE_DOC = 'instagram_access_token';
const URL_RENOVACAO = 'https://graph.instagram.com/refresh_access_token';
const DIA_MS = 24 * 60 * 60 * 1000;

const tokenDaVariavel = () => (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
const hash = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

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

/** Token mais recente: o renovado no banco, se válido e da mesma origem; senão o da variável. */
async function obterTokenInstagram() {
  const daVariavel = tokenDaVariavel();
  const chave = chaveDeCifra();
  if (!daVariavel || !chave || !db.isConfigured()) return daVariavel;

  try {
    await db.connect();
    const doc = await Credencial.findOne({ chave: CHAVE_DOC }).lean();
    if (!doc || !doc.cifrado) return daVariavel;
    if (doc.origemHash !== hash(daVariavel)) {
      console.log('[token-instagram] INSTAGRAM_ACCESS_TOKEN foi trocado na variável de ambiente — usando o da variável (o renovado antes da troca foi ignorado).');
      return daVariavel;
    }
    return decifrar(doc.cifrado, chave);
  } catch (err) {
    console.error(`[token-instagram] Não foi possível ler o token renovado (${err.message}) — usando o da variável de ambiente. Se o CRON_SECRET foi trocado, a próxima renovação corrige.`);
    return daVariavel;
  }
}

/** Renova o token atual e guarda o novo. Nunca lança: devolve o resultado e loga falhas de forma explícita. */
async function renovarTokenInstagram() {
  const chave = chaveDeCifra();
  if (!chave) return falha('CRON_SECRET ausente — sem chave para cifrar o token renovado.');
  const daVariavel = tokenDaVariavel();
  if (!daVariavel) return falha('INSTAGRAM_ACCESS_TOKEN ausente nas variáveis de ambiente.');

  await db.connect();
  const atual = await obterTokenInstagram();
  if (!atual.startsWith('IGAA')) {
    return falha('o token atual não é do Instagram Login (prefixo IGAA); ig_refresh_token não se aplica. Renove manualmente (npm run renovar-token-instagram).');
  }

  let dados;
  try {
    const resp = await fetch(`${URL_RENOVACAO}?` + new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: atual }));
    dados = await resp.json();
    if (!resp.ok || dados.error || !dados.access_token) {
      const e = dados.error || {};
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
        origemHash: hash(daVariavel),
        renovadoEm: agora,
        expiraEm,
        ultimaTentativaEm: agora,
        ultimoErro: '',
      },
    },
    { upsert: true }
  );
  const dias = Math.round((expiraEm - agora) / DIA_MS);
  console.log(`[token-instagram] Token renovado com sucesso. Vale até ${expiraEm.toISOString().slice(0, 10)} (~${dias} dias).`);
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
  console.error(`[token-instagram] FALHA NA RENOVAÇÃO: ${motivo} — ${prazo}. Sem token válido a fila de publicação para. Ação: gerar um token novo, atualizar INSTAGRAM_ACCESS_TOKEN na Vercel e rodar "npm run renovar-token-instagram -- --verificar".`);
  return { renovado: false, motivo };
}

module.exports = { obterTokenInstagram, renovarTokenInstagram };
