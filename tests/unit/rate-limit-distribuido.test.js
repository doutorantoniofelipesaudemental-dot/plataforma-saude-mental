const { test } = require('node:test');
const assert = require('node:assert/strict');
const { limitarTaxa } = require('../../backend/middleware');

const VARS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];

function comVariaveis(valores, fn) {
  const antes = Object.fromEntries(VARS.map((v) => [v, process.env[v]]));
  for (const v of VARS) {
    if (valores[v] === undefined) delete process.env[v];
    else process.env[v] = valores[v];
  }
  return Promise.resolve(fn()).finally(() => {
    for (const v of VARS) {
      if (antes[v] === undefined) delete process.env[v];
      else process.env[v] = antes[v];
    }
  });
}

function respostaFalsa() {
  return {
    code: 200,
    body: null,
    headers: {},
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
    set(k, v) { this.headers[k] = v; return this; },
  };
}

async function chamar(mw, ip = '10.0.0.1') {
  const res = respostaFalsa();
  let passou = false;
  await mw({ get: () => undefined, ip, socket: {} }, res, () => { passou = true; });
  return { passou, status: passou ? 200 : res.code, res };
}

test('sem variáveis do Upstash: limite em memória por IP', () => comVariaveis({}, async () => {
  const mw = limitarTaxa({ nome: 'teste-memoria', maximo: 2, janelaMs: 60_000 });
  assert.equal((await chamar(mw)).passou, true);
  assert.equal((await chamar(mw)).passou, true);
  const barrado = await chamar(mw);
  assert.equal(barrado.status, 429);
  assert.equal(barrado.res.headers['Retry-After'], '60');
  assert.equal((await chamar(mw, '10.0.0.2')).passou, true, 'outro IP tem contador próprio');
}));

test('com Upstash: contador compartilhado via pipeline REST, com autenticação e janela', () => comVariaveis({ UPSTASH_REDIS_REST_URL: 'https://redis.exemplo', UPSTASH_REDIS_REST_TOKEN: 'tok' }, async () => {
  const chamadas = [];
  let n = 0;
  const fetchFn = async (url, opts) => {
    chamadas.push({ url, opts });
    n += 1;
    return { ok: true, json: async () => [{ result: n }, { result: 1 }] };
  };
  const mw = limitarTaxa({ nome: 'teste-redis', maximo: 2, janelaMs: 60_000, fetchFn });
  assert.equal((await chamar(mw)).passou, true);
  assert.equal((await chamar(mw)).passou, true);
  const barrado = await chamar(mw);
  assert.equal(barrado.status, 429);
  assert.equal(barrado.res.headers['Retry-After'], '60');
  assert.equal(chamadas[0].url, 'https://redis.exemplo/pipeline');
  assert.equal(chamadas[0].opts.headers.Authorization, 'Bearer tok');
  const comandos = JSON.parse(chamadas[0].opts.body);
  assert.deepEqual(comandos[0], ['INCR', 'rl:teste-redis:10.0.0.1']);
  assert.deepEqual(comandos[1], ['EXPIRE', 'rl:teste-redis:10.0.0.1', 60, 'NX']);
}));

test('Upstash fora do ar: cai no contador da instância, sem derrubar o pedido', () => comVariaveis({ UPSTASH_REDIS_REST_URL: 'https://redis.exemplo', UPSTASH_REDIS_REST_TOKEN: 'tok' }, async () => {
  const erroOriginal = console.error;
  console.error = () => {};
  try {
    const fetchFn = async () => { throw new Error('rede caiu'); };
    const mw = limitarTaxa({ nome: 'teste-fallback', maximo: 1, janelaMs: 60_000, fetchFn });
    assert.equal((await chamar(mw, '10.0.0.9')).passou, true);
    assert.equal((await chamar(mw, '10.0.0.9')).status, 429);
  } finally {
    console.error = erroOriginal;
  }
}));
