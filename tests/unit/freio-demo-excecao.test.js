const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { exigirRedesAtivas } = require('../../backend/lib/freioRedes');
const { excecaoFreioDemo, itemDemoAuditoria } = require('../../scripts/youtube/itemPublicavel');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

const DEMO = { id: 'demo-auditoria-20261030', status: 'demo-auditoria', privacidade: 'private', conteudoClinico: false, cenas: 4 };
const ok = { confirmar: true, idArg: DEMO.id, privacidade: 'private' };

let antes;
beforeEach(() => { antes = process.env.REDES_PUBLICACAO_ATIVA; process.env.REDES_PUBLICACAO_ATIVA = 'false'; });
afterEach(() => { if (antes === undefined) delete process.env.REDES_PUBLICACAO_ATIVA; else process.env.REDES_PUBLICACAO_ATIVA = antes; });

test('demo + private + --id + --confirmar: exceção vale e o freio deixa passar', () => {
  assert.equal(excecaoFreioDemo(DEMO, ok), true);
  assert.doesNotThrow(() => exigirRedesAtivas('upload no YouTube', { excecao: true }));
});

test('sem a exceção, o freio continua bloqueando (REDES=false)', () => {
  assert.throws(() => exigirRedesAtivas('upload no YouTube'), /freio de emergência/);
  assert.throws(() => exigirRedesAtivas('upload no YouTube', { excecao: false }), /freio de emergência/);
});

test('item aprovado, pausado-estatico ou reprovado não tem exceção', () => {
  for (const status of ['aprovado-checagem', 'pausado-estatico', 'reprovado']) {
    assert.equal(excecaoFreioDemo({ ...DEMO, status }, ok), false, status);
  }
});

test('demo sem --id não tem exceção', () => {
  assert.equal(excecaoFreioDemo(DEMO, { ...ok, idArg: '' }), false);
});

test('demo sem --confirmar não tem exceção', () => {
  assert.equal(excecaoFreioDemo(DEMO, { ...ok, confirmar: false }), false);
});

test('tentativa de public ou unlisted não tem exceção', () => {
  assert.equal(excecaoFreioDemo(DEMO, { ...ok, privacidade: 'public' }), false);
  assert.equal(excecaoFreioDemo(DEMO, { ...ok, privacidade: 'unlisted' }), false);
});

test('demo com conteúdo clínico (ou sem a marcação) não tem exceção', () => {
  assert.equal(itemDemoAuditoria({ ...DEMO, conteudoClinico: true }), false);
  assert.equal(excecaoFreioDemo({ ...DEMO, conteudoClinico: undefined }, ok), false);
});

test('publicador das 20:15 não concede a exceção e enviarVideo só aceita excecao para private', () => {
  const pub = ler('scripts/youtube/publicarYoutube.js');
  assert.doesNotMatch(pub, /excecaoFreio/, 'publicarYoutube não passa a exceção');
  const yt = ler('backend/lib/youtube.js');
  assert.match(yt, /excecao: excecaoFreio === true && privacidade === 'private'/);
});
