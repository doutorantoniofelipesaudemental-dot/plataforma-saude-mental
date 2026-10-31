const test = require('node:test');
const assert = require('node:assert/strict');
const { decidirPelaSaida, resumirFalhaSemRelatorio, ehQueda, publicar, precisaShell, MAXIMO_REPETICOES } = require('../../scripts/publicarBranch');

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

// Falha de 30/10/2026: o portão caiu no carregamento (sem relatório). O publicador mostrava só as 6 últimas linhas
// (pilha e "Node.js v26.8.1"), sem a mensagem. Agora a mensagem é extraída da saída completa.
const CRASH = "node:internal/modules/cjs/loader:1386\n  throw err;\n  ^\n\nError: Cannot find module 'C:\\DRS-decidido-32\\scripts\\lib\\ausente.js'\nRequire stack:\n- C:\\DRS-decidido-32\\scripts\\portao.js\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1383:15)\n    at Module.load (node:internal/modules/cjs/loader:1656:32)\n    at Module._load (node:internal/modules/cjs/loader:1448:12)\n    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)\n    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)\n    at node:internal/main/run_main_module:33:47\n\nNode.js v26.8.1\n";

test('falha sem relatório: a mensagem do erro é reportada (não só a pilha)', () => {
  const r = resumirFalhaSemRelatorio(CRASH, 1);
  assert.ok(r, 'crash de carregamento deve ser detectado');
  assert.match(r.mensagem, /^Error: Cannot find module/);
});

test('falha sem relatório: sem a mensagem, a linha "Node.js vX" ainda acusa o crash', () => {
  const r = resumirFalhaSemRelatorio(CRASH.split('\n').slice(-3).join('\n'), 1);
  assert.ok(r);
  assert.match(r.mensagem, /erro sem mensagem/);
});

// Ordem de 31/10/2026: queda do processo (sem relatório, código anormal) repete UMA vez.
test('queda repete uma vez; aprova na segunda tentativa', async () => {
  const d = dublê([{ saida: CRASH, codigo: 1 }, { saida: APROVADA, codigo: 0 }]);
  const logs = [];
  const res = await publicar({ ...d, log: (m) => logs.push(m) });
  assert.equal(res.publicado, true);
  assert.equal(d.chamadas.portao, 2);
  assert.equal(d.chamadas.push, 1);
  assert.equal(d.chamadas.esperas, 0, 'queda não espera como infraestrutura');
  assert.equal(res.tentativas, 2);
  assert.ok(logs.some((m) => /Tentativa 1 do portão/.test(m)), 'a 1ª tentativa fica no log');
  assert.ok(logs.some((m) => /Tentativa 2 do portão/.test(m)), 'a 2ª tentativa fica no log');
});

test('queda duas vezes não publica e registra as duas tentativas', async () => {
  const d = dublê([{ saida: CRASH, codigo: 1 }]);
  const logs = [];
  const res = await publicar({ ...d, log: (m) => logs.push(m) });
  assert.equal(res.publicado, false);
  assert.equal(d.chamadas.portao, 2);
  assert.equal(d.chamadas.push, 0);
  assert.equal(d.chamadas.pr, 0);
  assert.equal(res.tentativas, 2);
  assert.match(res.motivo, /terminou com erro antes do relatório: Error: Cannot find module/);
  assert.ok(logs.some((m) => /NÃO publicado após 2 tentativa/.test(m)));
});

test('queda sem mensagem (saída vazia, código de sinal) também é repetida uma vez', async () => {
  const d = dublê([{ saida: '', codigo: null }]);
  const res = await publicar(d);
  assert.equal(res.publicado, false);
  assert.equal(d.chamadas.portao, 2);
  assert.match(res.motivo, /portão caiu sem relatório/);
});

test('teste reprovado sem relatório nunca é repetido', async () => {
  const d = dublê([{ saida: 'ok 1\nnot ok 2 - casa\n# fail 1\n', codigo: 1 }]);
  const res = await publicar(d);
  assert.equal(res.publicado, false);
  assert.equal(d.chamadas.portao, 1);
  assert.equal(d.chamadas.push, 0);
});

test('queda só é detectada sem relatório e sem teste reprovado', () => {
  assert.equal(ehQueda(CRASH, 1), true);
  assert.equal(ehQueda(REPROVADA, 1), false);
  assert.equal(ehQueda('# fail 1\n', 1), false);
  assert.equal(ehQueda(CRASH, 0), false);
});

test('portão com relatório (reprovado ou aprovado) não é tratado como falha sem relatório', () => {
  assert.equal(resumirFalhaSemRelatorio(REPROVADA, 1), null);
  assert.equal(resumirFalhaSemRelatorio(APROVADA, 0), null);
  assert.equal(decidirPelaSaida(REPROVADA, 1).falhaSemRelatorio, null);
});
