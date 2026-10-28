const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { decidirSincronia, relacaoEntre, lerSincronia } = require('../../scripts/lib/branchSincronizado');

test('decisão por relação: à frente passa; igual passa; atrás e divergente bloqueiam; sem remoto não bloqueia', () => {
  assert.equal(decidirSincronia({ local: 'aaa1111', remoto: 'bbb2222', relacao: 'a-frente' }).ok, true);
  assert.equal(decidirSincronia({ local: 'aaa1111', remoto: 'aaa1111', relacao: 'igual' }).ok, true);
  assert.equal(decidirSincronia({ local: 'aaa1111', remoto: 'bbb2222', relacao: 'atras' }).ok, false);
  assert.equal(decidirSincronia({ local: 'aaa1111', remoto: 'bbb2222', relacao: 'divergente' }).ok, false);
  assert.equal(decidirSincronia({ local: 'aaa1111', remoto: null, relacao: 'divergente' }).ok, true);
});

test('relação: ordem de checagem', () => {
  assert.equal(relacaoEntre({ local: 'x', remoto: 'x', remotoEhAntepassadoDoLocal: true, localEhAntepassadoDoRemoto: true }), 'igual');
  assert.equal(relacaoEntre({ local: 'a', remoto: 'b', remotoEhAntepassadoDoLocal: true, localEhAntepassadoDoRemoto: false }), 'a-frente');
  assert.equal(relacaoEntre({ local: 'a', remoto: 'b', remotoEhAntepassadoDoLocal: false, localEhAntepassadoDoRemoto: true }), 'atras');
  assert.equal(relacaoEntre({ local: 'a', remoto: 'b', remotoEhAntepassadoDoLocal: false, localEhAntepassadoDoRemoto: false }), 'divergente');
});

// Repositórios reais: remoto (bare) + clone de trabalho com a branch rastreando origin/teste.
function cenario() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'sincronia-'));
  const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
  const remoto = path.join(raiz, 'remoto.git');
  const trabalho = path.join(raiz, 'trabalho');
  git(raiz, 'init', '-q', '--bare', remoto);
  git(raiz, 'clone', '-q', remoto, trabalho);
  git(trabalho, 'config', 'user.email', 't@t');
  git(trabalho, 'config', 'user.name', 't');
  git(trabalho, 'checkout', '-q', '-b', 'teste');
  const commit = (msg) => {
    fs.writeFileSync(path.join(trabalho, 'a.txt'), msg);
    git(trabalho, 'add', '.');
    git(trabalho, 'commit', '-q', '-m', msg);
  };
  commit('base');
  git(trabalho, 'push', '-q', '-u', 'origin', 'teste');
  return { raiz, trabalho, git, commit, remoto };
}

// Outro clone que empurra um commit para o remoto (faz o remoto andar).
function empurrarDeOutro(c, nomeArquivo) {
  const outro = path.join(c.raiz, `outro-${nomeArquivo}`);
  c.git(c.raiz, 'clone', '-q', '-b', 'teste', c.remoto, outro);
  c.git(outro, 'config', 'user.email', 't@t');
  c.git(outro, 'config', 'user.name', 't');
  fs.writeFileSync(path.join(outro, nomeArquivo), 'remoto avançou');
  c.git(outro, 'add', '.');
  c.git(outro, 'commit', '-q', '-m', 'remoto');
  c.git(outro, 'push', '-q', 'origin', 'teste');
}

test('real: local à frente do remoto passa (estado normal antes do push)', () => {
  const c = cenario();
  c.commit('novo local');
  assert.equal(lerSincronia(c.trabalho).ok, true);
});

test('real: local atrás do remoto bloqueia', () => {
  const c = cenario();
  empurrarDeOutro(c, 'b.txt');
  c.git(c.trabalho, 'fetch', '-q', 'origin');
  assert.equal(lerSincronia(c.trabalho).ok, false);
});

test('real: local divergente do remoto bloqueia', () => {
  const c = cenario();
  c.commit('local');
  empurrarDeOutro(c, 'b.txt');
  c.git(c.trabalho, 'fetch', '-q', 'origin');
  assert.equal(lerSincronia(c.trabalho).ok, false);
});
