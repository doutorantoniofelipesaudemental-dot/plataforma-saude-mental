const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const R = require('../../scripts/youtube/regeracao');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'regera-'));
const escrever = (arq, txt) => { fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq, txt, 'utf8'); };

// Gerador falso: escreve um "novo" rascunho na pasta pedida.
const gerarNovo = async (id, dirSaida) => { escrever(path.join(dirSaida, 'longo.mp4'), 'novo'); escrever(path.join(dirSaida, 'meta.json'), '{"novo":1}'); };
const gerarFalha = async (id, dirSaida) => { escrever(path.join(dirSaida, 'longo.mp4'), 'ruim'); escrever(path.join(dirSaida, 'meta.json'), '{"ruim":1}'); };
const okT1 = async () => ({ ok: true, falhas: [] });
const falhaT1 = async () => ({ ok: false, falhas: ['vinheta falada ausente no início'] });

test('lista vazia ou ausente: nada a fazer', () => {
  assert.deepEqual(R.lerLista(path.join(tmp(), 'nao-existe.txt')), []);
  assert.deepEqual(R.escolherLote([], []), []);
});

test('lista: ignora linhas vazias e comentários, sem duplicar', () => {
  const d = tmp(); escrever(path.join(d, 'REGERAR.txt'), 'a\n\n# x\nb\n'); escrever(path.join(d, 'REGERAR-FILA.txt'), 'b\nc\n');
  assert.deepEqual(R.listaCandidatos(d), ['a', 'b', 'c']);
});

test('lote de no máximo 6 e pula quem já tem estado final', () => {
  const c = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const itens = [{ id: '2', estado: 'regerado-T1-ok' }, { id: '3', estado: 'reserva' }];
  assert.deepEqual(R.escolherLote(c, itens), ['1', '4', '5', '6', '7', '8']);
});

test('espaço insuficiente: para o lote antes de gerar', async () => {
  const d = tmp(); escrever(path.join(d, 'REGERAR.txt'), 'longo-x\n'); const pasta = path.join(d, 'pasta'); escrever(path.join(pasta, 'longo.mp4'), 'x'.repeat(100));
  let gerou = false;
  const r = await R.executarNoite({
    gerarItem: async () => { gerou = true; }, conferir: okT1, pastaDe: () => pasta, tamanhoBytes: () => 100, livreBytes: () => 150,
    backupDir: path.join(d, 'bk'), hoje: '2026-10-20', estadoArq: path.join(d, 'e.json'), listaDir: d,
  });
  assert.equal(r.parado, 'espaco');
  assert.equal(gerou, false);
  assert.equal(R.espacoSuficiente(250, 100), true);
  assert.equal(R.espacoSuficiente(249, 100), false);
});

test('T1 passa: original guardado com SHA-256, substituído, rascunho removido', async () => {
  const d = tmp(); const pasta = path.join(d, 'pasta'); const bk = path.join(d, 'bk');
  escrever(path.join(pasta, 'longo.mp4'), 'orig'); escrever(path.join(pasta, 'meta.json'), '{"orig":1}');
  const r = await R.regerarUm({ id: 'longo-x', pasta, prev: undefined, deps: { gerarItem: gerarNovo, conferir: okT1, backupDir: bk } });
  assert.equal(r.estado, 'regerado-T1-ok');
  assert.equal(fs.readFileSync(path.join(pasta, 'longo.mp4'), 'utf8'), 'novo');
  assert.equal(fs.readFileSync(path.join(bk, 'longo.mp4'), 'utf8'), 'orig');
  assert.equal(fs.existsSync(path.join(pasta, R.RASCUNHO)), false);
});

test('T1 falha: original intacto, rascunho renomeado (não apagado), tentativa 1 = falhou', async () => {
  const d = tmp(); const pasta = path.join(d, 'pasta');
  escrever(path.join(pasta, 'longo.mp4'), 'orig');
  const r = await R.regerarUm({ id: 'longo-x', pasta, prev: undefined, deps: { gerarItem: gerarFalha, conferir: falhaT1, backupDir: path.join(d, 'bk') } });
  assert.equal(r.estado, 'falhou');
  assert.equal(r.tentativas, 1);
  assert.equal(fs.readFileSync(path.join(pasta, 'longo.mp4'), 'utf8'), 'orig');
  assert.ok(fs.readdirSync(pasta).some((n) => n.startsWith('_falha-regeracao-')), 'rascunho falho guardado');
});

test('segunda tentativa falha vira reserva', async () => {
  const d = tmp(); const pasta = path.join(d, 'pasta'); escrever(path.join(pasta, 'longo.mp4'), 'orig');
  const r = await R.regerarUm({ id: 'longo-x', pasta, prev: { tentativas: 1 }, deps: { gerarItem: gerarFalha, conferir: falhaT1, backupDir: path.join(d, 'bk') } });
  assert.equal(r.estado, 'reserva');
  assert.equal(r.tentativas, 2);
});

test('nenhum original é sobrescrito sem backup verificado (backup já existente bloqueia)', async () => {
  const d = tmp(); const pasta = path.join(d, 'pasta'); const bk = path.join(d, 'bk');
  escrever(path.join(pasta, 'longo.mp4'), 'orig'); escrever(path.join(bk, 'longo.mp4'), 'backup-antigo');
  const r = await R.regerarUm({ id: 'longo-x', pasta, prev: undefined, deps: { gerarItem: gerarNovo, conferir: okT1, backupDir: bk } });
  assert.notEqual(r.estado, 'regerado-T1-ok');
  assert.equal(fs.readFileSync(path.join(pasta, 'longo.mp4'), 'utf8'), 'orig');
  assert.equal(fs.readFileSync(path.join(bk, 'longo.mp4'), 'utf8'), 'backup-antigo');
});

test('freio: duas noites seguidas com mais de 50% de falha', () => {
  assert.equal(R.freioAtivado([{ tentativas: 2, falhas: 2 }]), false);
  assert.equal(R.freioAtivado([{ tentativas: 2, falhas: 2 }, { tentativas: 2, falhas: 1 }]), false);
  assert.equal(R.freioAtivado([{ tentativas: 2, falhas: 2 }, { tentativas: 2, falhas: 2 }]), true);
  assert.equal(R.freioAtivado([{ tentativas: 4, falhas: 4 }, { tentativas: 4, falhas: 1 }, { tentativas: 4, falhas: 4 }]), false);
});

test('freio parado: noite com freio ativo não gera nada', async () => {
  const d = tmp(); const est = path.join(d, 'e.json');
  R.gravarEstado({ itens: [], noites: [], freioAtivo: true }, est); escrever(path.join(d, 'REGERAR.txt'), 'longo-x\n');
  let gerou = false;
  const r = await R.executarNoite({ gerarItem: async () => { gerou = true; }, conferir: okT1, pastaDe: () => d, tamanhoBytes: () => 1, livreBytes: () => 1e12, backupDir: path.join(d, 'bk'), hoje: '2026-10-21', estadoArq: est, listaDir: d });
  assert.equal(r.parado, 'freio');
  assert.equal(gerou, false);
});

test('executarNoite grava estado, conta noite e ativa freio na 2ª noite ruim', async () => {
  const d = tmp(); const est = path.join(d, 'e.json'); const pasta = path.join(d, 'pasta');
  escrever(path.join(d, 'REGERAR.txt'), 'longo-x\n'); escrever(path.join(pasta, 'longo.mp4'), 'orig');
  const deps = { gerarItem: gerarFalha, conferir: falhaT1, pastaDe: () => pasta, tamanhoBytes: () => 3, livreBytes: () => 1e12, backupDir: path.join(d, 'bk'), estadoArq: est, listaDir: d };
  await R.executarNoite({ ...deps, hoje: '2026-10-20' });
  const r2 = await R.executarNoite({ ...deps, hoje: '2026-10-21' });
  const e = R.lerEstado(est);
  assert.equal(e.noites.length, 2);
  assert.equal(e.freioAtivo, true);
  assert.equal(r2.parado, 'freio');
});

test('alerta no topo não repete a linha', () => {
  const d = tmp(); const f = path.join(d, 'x.md'); escrever(f, 'Corpo\n');
  R.alertarTopo(f, R.ALERTA_FREIO); R.alertarTopo(f, R.ALERTA_FREIO);
  const linhas = fs.readFileSync(f, 'utf8').split('\n');
  assert.equal(linhas[0], R.ALERTA_FREIO);
  assert.equal(linhas.filter((l) => l === R.ALERTA_FREIO).length, 1);
});
