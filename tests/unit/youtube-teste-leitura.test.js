const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { urlPlaylists, resumirPlaylists, interpretarErroApi } = require('../../scripts/youtube/testeLeituraPlaylists');

const FONTE = fs.readFileSync(path.join(__dirname, '../../scripts/youtube/testeLeituraPlaylists.js'), 'utf8');

test('URL é de leitura: playlists.list com mine=true e snippet', () => {
  const u = new URL(urlPlaylists());
  assert.equal(u.origin + u.pathname, 'https://www.googleapis.com/youtube/v3/playlists');
  assert.equal(u.searchParams.get('mine'), 'true');
  assert.equal(u.searchParams.get('part'), 'snippet');
});

test('resumo conta as playlists e usa títulos, sem IDs', () => {
  const r = resumirPlaylists([{ id: 'SEGREDO-NAO-PODE-SAIR', snippet: { title: 'Ansiedade' } }, { id: 'x', snippet: {} }]);
  assert.equal(r.total, 2);
  assert.deepEqual(r.titulos, ['Ansiedade', '(sem título)']);
  assert.doesNotMatch(JSON.stringify(r), /SEGREDO-NAO-PODE-SAIR/);
});

test('resumo limita a 20 títulos na impressão', () => {
  const itens = Array.from({ length: 25 }, (_, i) => ({ snippet: { title: `P${i}` } }));
  const r = resumirPlaylists(itens);
  assert.equal(r.total, 25);
  assert.equal(r.titulos.length, 20);
});

test('erro da API vira motivo curto com o reason', () => {
  const motivo = interpretarErroApi(403, { error: { message: 'Insufficient Permission', errors: [{ reason: 'insufficientPermissions' }] } });
  assert.equal(motivo, 'insufficientPermissions: Insufficient Permission');
});

test('erro sem corpo ainda gera motivo', () => {
  assert.equal(interpretarErroApi(500, null), 'HTTP 500');
});

test('mensagem de erro é cortada em 200 caracteres', () => {
  const longa = 'x'.repeat(500);
  const motivo = interpretarErroApi(400, { error: { message: longa, errors: [{ reason: 'r' }] } });
  assert.ok(motivo.length <= 'r: '.length + 200);
});

test('script só lê: sem POST, PUT, DELETE nem inserts, e não imprime o token', () => {
  assert.doesNotMatch(FONTE, /method:\s*'(POST|PUT|DELETE|PATCH)'/);
  assert.doesNotMatch(FONTE, /playlists\.insert|playlistItems\.insert|videos\.insert/);
  assert.doesNotMatch(FONTE, /console\.log\([^)]*token/);
});
