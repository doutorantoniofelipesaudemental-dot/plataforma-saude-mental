const test = require('node:test');
const assert = require('node:assert/strict');
const { decidirPelaSaida, publicar, precisaShell, MAXIMO_REPETICOES } = require('../../scripts/publicarBranch');

test('shell: só npm no Windows; gh e git sem shell (título com espaços e acentos não pode ser cortado)', () => {
  assert.equal(precisaShell('npm', 'win32'), true);
  assert.equal(precisaShell('gh', 'win32'), false);
  assert.equal(precisaShell('git', 'win32'), false);
  assert.equal(precisaShell('npm', 'linux'), false);
});

const APROVADA = 'algo\nPORTÃO APROVADO · relatório: relatorios\\portao-20261021-1000.md\n';
const REPROVADA = 'algo\nPORTÃO REPROVADO · relatório: relatorios\\portao-20261021-1001.md\n';
const INFRA = 'Error: getaddrinfo ENOTFOUND ac-x.mongodb.net\n' + REPROVADA;

function dublê(sequencia) {
  const chamadas = { portao: 0, push: 0, pr: 0, esperas: 0 };
  let i = 0;
  return {
    chamadas,
    rodarPortao: async () => { chamadas.portao++; const s = sequencia[Math.min(i++, sequencia.length - 1)]; return s; },
    empurrar: async () => { chamadas.push++; },
    abrirOuAtualizarPR: async () => { chamadas.pr++; return 'PR #1'; },
    esperar: async () => { chamadas.esperas++; },
    log: () => {},
  };
}

test('decide: só aprova com PORTÃO APROVADO e código 0', () => {
  assert.equal(decidirPelaSaida(APROVADA, 0).aprovado, true);
  assert.equal(decidirPelaSaida(APROVADA, 1).aprovado, false);
  assert.equal(decidirPelaSaida(REPROVADA, 0).aprovado, false);
  assert.equal(decidirPelaSaida('', 0).aprovado, false);
});

test('portão reprovado: NÃO faz push nem abre PR, e mostra o relatório', async () => {
  const d = dublê([{ saida: REPROVADA, codigo: 1 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, false);
  assert.equal(d.chamadas.push, 0, 'push não pode acontecer com portão reprovado');
  assert.equal(d.chamadas.pr, 0, 'PR não pode ser aberto com portão reprovado');
  assert.match(res.relatorio, /portao-20261021-1001/);
});

test('texto "APROVADO" com código de saída diferente de 0 não publica', async () => {
  const d = dublê([{ saida: APROVADA, codigo: 1 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, false);
  assert.equal(d.chamadas.push, 0);
});

test('portão aprovado: faz push e abre o PR, uma vez', async () => {
  const d = dublê([{ saida: APROVADA, codigo: 0 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, true);
  assert.equal(d.chamadas.push, 1);
  assert.equal(d.chamadas.pr, 1);
});

test('falha de infraestrutura: espera 5 min e repete; aprova na segunda tentativa', async () => {
  const d = dublê([{ saida: INFRA, codigo: 1 }, { saida: APROVADA, codigo: 0 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, true);
  assert.equal(d.chamadas.portao, 2);
  assert.equal(d.chamadas.esperas, 1);
});

test('falha de infraestrutura persistente: repete no máximo 2 vezes e não abre PR', async () => {
  const d = dublê([{ saida: INFRA, codigo: 1 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, false);
  assert.equal(res.motivo, 'falha de infraestrutura');
  assert.equal(d.chamadas.portao, 1 + MAXIMO_REPETICOES);
  assert.equal(d.chamadas.esperas, MAXIMO_REPETICOES);
  assert.equal(d.chamadas.push, 0);
  assert.equal(d.chamadas.pr, 0);
});

test('reprovação que não é de rede não é repetida', async () => {
  const d = dublê([{ saida: REPROVADA, codigo: 1 }]);
  await publicar(d);
  assert.equal(d.chamadas.portao, 1);
  assert.equal(d.chamadas.esperas, 0);
});
