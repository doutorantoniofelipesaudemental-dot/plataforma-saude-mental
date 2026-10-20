const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('../../backend/lib/instagramHost');

const IGAA = 'IGAA' + 'teste-fictício-0000';
const EAA = 'EAA' + 'teste-fictício-0000';

test('IGAA (Instagram Login) → graph.instagram.com e instagram_business_content_publish', () => {
  assert.equal(H.hostDoToken(IGAA), 'graph.instagram.com');
  assert.equal(H.permissaoDePublicacao(IGAA), 'instagram_business_content_publish');
});

test('qualquer outro token (Página do Facebook) → graph.facebook.com e instagram_content_publish', () => {
  assert.equal(H.hostDoToken(EAA), 'graph.facebook.com');
  assert.equal(H.permissaoDePublicacao(EAA), 'instagram_content_publish');
  assert.equal(H.hostDoToken(''), 'graph.facebook.com');
});

test('INSTAGRAM_GRAPH_HOST coerente com o token não gera aviso', () => {
  assert.deepEqual(H.resolverHost(IGAA, 'graph.instagram.com'), { host: 'graph.instagram.com', aviso: null });
  assert.deepEqual(H.resolverHost(IGAA, 'https://instagram.com/'), { host: 'graph.instagram.com', aviso: null });
  assert.deepEqual(H.resolverHost(EAA, 'facebook.com'), { host: 'graph.facebook.com', aviso: null });
});

test('INSTAGRAM_GRAPH_HOST incoerente: usa o host do token e registra aviso', () => {
  const r = H.resolverHost(IGAA, 'facebook.com');
  assert.equal(r.host, 'graph.instagram.com');
  assert.match(r.aviso, /não combina com o tipo do token/);
  const r2 = H.resolverHost(EAA, 'instagram.com');
  assert.equal(r2.host, 'graph.facebook.com');
  assert.ok(r2.aviso);
});

test('sem INSTAGRAM_GRAPH_HOST: segue o token, sem aviso', () => {
  assert.deepEqual(H.resolverHost(IGAA, ''), { host: 'graph.instagram.com', aviso: null });
});

test('baseGraph: host do token e versão (padrão v21.0 ou a configurada)', () => {
  assert.equal(H.baseGraph(IGAA, {}), 'https://graph.instagram.com/v21.0');
  assert.equal(H.baseGraph(EAA, { INSTAGRAM_GRAPH_VERSAO: 'v22.0' }), 'https://graph.facebook.com/v22.0');
  assert.equal(H.baseGraph(IGAA, { INSTAGRAM_GRAPH_HOST: 'facebook.com' }), 'https://graph.instagram.com/v21.0');
});

test('normalizarDeclarado tira protocolo, barra final e prefixo graph.', () => {
  assert.equal(H.normalizarDeclarado('https://graph.instagram.com/'), 'instagram.com');
  assert.equal(H.normalizarDeclarado('  Facebook.com '), 'facebook.com');
});

test('todos os pontos usam o módulo único (nenhum repete a regra do token)', () => {
  const raiz = path.resolve(__dirname, '../..');
  const arquivos = [
    'backend/lib/operacional/instagram/postPublisher.js',
    'backend/lib/socialPublisher.js',
    'backend/scripts/redes/verificarToken.js',
    'backend/lib/redesV2/relatorio.js',
    'scripts/conferirPrimeiroPost.js',
  ];
  for (const f of arquivos) {
    const txt = fs.readFileSync(path.join(raiz, f), 'utf8');
    assert.match(txt, /instagramHost/, `${f} deve usar instagramHost`);
    assert.doesNotMatch(txt, /startsWith\('IGAA'\)\s*\?\s*'graph\.instagram\.com'/, `${f} repete a regra`);
    assert.doesNotMatch(txt, /graph\.\$\{process\.env\.INSTAGRAM_GRAPH_HOST/, `${f} lê o host direto da variável`);
  }
});
