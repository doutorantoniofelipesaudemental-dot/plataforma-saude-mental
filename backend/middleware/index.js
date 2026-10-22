const crypto = require('crypto');
const db = require('../lib/db');

/**
 * Garante que há conexão com o MongoDB antes de a rota rodar.
 * Responde 503 (e não 500) quando o banco não está configurado, para deixar
 * claro que é ambiente e não bug.
 */
async function exigirBanco(req, res, next) {
  try {
    await db.connect();
    next();
  } catch (err) {
    if (err.code === 'DB_NOT_CONFIGURED') {
      return res.status(503).json({
        erro: 'Banco de dados não configurado.',
        detalhe: 'Defina MONGODB_URI nas variáveis de ambiente.',
      });
    }
    console.error('[db] falha ao conectar:', err.message);
    return res.status(503).json({ erro: 'Serviço temporariamente indisponível.' });
  }
}

/**
 * Protege rotas administrativas com um token estático enviado em
 * `Authorization: Bearer <token>` ou no header `x-admin-token`.
 *
 * É proposital que seja simples: a área administrativa é usada só pela clínica.
 * Se um dia houver múltiplos usuários, troque por sessão/JWT.
 */
function exigirAdmin(req, res, next) {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) {
    return res.status(503).json({
      erro: 'Área administrativa desativada.',
      detalhe: 'Defina ADMIN_TOKEN nas variáveis de ambiente.',
    });
  }

  const header = req.get('authorization') || '';
  const recebido = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : (req.get('x-admin-token') || '').trim();

  if (!recebido || !comparacaoSegura(recebido, esperado)) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }
  next();
}

/** Comparação em tempo constante, resistente a timing attack. */
function comparacaoSegura(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // timingSafeEqual exige mesmo tamanho; compara contra si mesmo para manter
    // o custo constante e mesmo assim retornar falso.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Limite de requisições por IP (janela fixa) nas rotas que gravam ou disparam ações.
 * Com UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN, o contador é compartilhado entre as instâncias da Vercel
 * (Upstash via REST, sem dependência extra). Sem essas variáveis, ou se o Redis falhar, usa o contador em memória de
 * cada instância (atenuação, não limite global) e registra o motivo uma vez. Falha do limitador nunca bloqueia o pedido.
 */
let sequenciaLimitador = 0;
let avisoSemRedis = false;

async function contarNoRedis({ chave, janelaSeg, fetchFn, url, token }) {
  const resp = await fetchFn(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', chave],
      ['EXPIRE', chave, janelaSeg, 'NX'],
    ]),
    signal: AbortSignal.timeout(1500),
  });
  if (!resp.ok) throw new Error(`Upstash respondeu HTTP ${resp.status}`);
  const [incr] = await resp.json();
  if (incr.error) throw new Error(incr.error);
  return Number(incr.result);
}

function limitarTaxa({ janelaMs = 60_000, maximo = 10, nome, fetchFn = fetch } = {}) {
  const prefixo = `rl:${nome || `r${++sequenciaLimitador}`}:`;
  const janelaSeg = Math.ceil(janelaMs / 1000);
  const acessos = new Map();

  function contarEmMemoria(chave, agora) {
    // Limpeza preguiçosa para a Map não crescer indefinidamente.
    if (acessos.size > 5000) {
      for (const [k, v] of acessos) {
        if (agora - v.inicio > janelaMs) acessos.delete(k);
      }
    }
    const registro = acessos.get(chave);
    if (!registro || agora - registro.inicio > janelaMs) {
      acessos.set(chave, { inicio: agora, contagem: 1 });
      return { contagem: 1, esperarSeg: 0 };
    }
    registro.contagem += 1;
    return { contagem: registro.contagem, esperarSeg: Math.ceil((janelaMs - (agora - registro.inicio)) / 1000) };
  }

  return async function rateLimit(req, res, next) {
    const chave = ipDoPedido(req);
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    let resultado;
    if (url && token) {
      try {
        const contagem = await contarNoRedis({ chave: prefixo + chave, janelaSeg, fetchFn, url, token });
        resultado = { contagem, esperarSeg: janelaSeg };
      } catch (err) {
        console.error('[rate-limit] Redis indisponível, usando contador da instância:', err.message);
      }
    } else if (!avisoSemRedis) {
      avisoSemRedis = true;
      console.error('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes: limite só por instância.');
    }
    resultado ??= contarEmMemoria(chave, Date.now());

    if (resultado.contagem > maximo) {
      res.set('Retry-After', String(resultado.esperarSeg));
      return res.status(429).json({
        erro: 'Muitas solicitações. Tente novamente em instantes.',
      });
    }
    next();
  };
}

function ipDoPedido(req) {
  const fwd = req.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'desconhecido';
}

/** Converte erros de validação do Mongoose em resposta 400 legível. */
function tratarErroValidacao(err, res) {
  if (err.name === 'ValidationError') {
    const campos = {};
    for (const [campo, detalhe] of Object.entries(err.errors)) {
      campos[campo] = detalhe.message;
    }
    res.status(400).json({ erro: 'Dados inválidos.', campos });
    return true;
  }
  if (err.code === 11000) {
    res.status(409).json({ erro: 'Registro já existe.', campos: err.keyValue });
    return true;
  }
  return false;
}

module.exports = {
  exigirBanco,
  exigirAdmin,
  comparacaoSegura,
  limitarTaxa,
  tratarErroValidacao,
  ipDoPedido,
};
