const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const RP = require('../../scripts/youtube/reaproveitarReprovados');
const REG = require('../../scripts/youtube/regeracao');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'reap-'));
const ok = { status: 'ok', modelos: [] };
const fora = { status: 'fora', motivo: 'sem conexão', modelos: [] };
const meta = { titulo: 't', descricao: 'd' };
const verde = async () => ({ aprovado: true, motivos: [] });
const vermelho = async () => ({ aprovado: false, motivos: ['promessa de cura'] });
const invalido = async () => undefined;

test('Ollama fora: aguardando-ollama, nunca aprovado nem reprovado; o gemma não é chamado', async () => {
  let chamou = false;
  const dec = await RP.avaliarT2T3({ meta, st: fora, chamar: async () => { chamou = true; return { aprovado: true, motivos: [] }; } });
  assert.equal(dec, 'aguardando-ollama');
  assert.equal(chamou, false);
});

test('com Ollama ok: aprovado, reprovado e JSON inválido (incerto)', async () => {
  assert.equal(await RP.avaliarT2T3({ meta, st: ok, chamar: verde }), 'aprovado');
  assert.equal(await RP.avaliarT2T3({ meta, st: ok, chamar: vermelho }), 'reprovado');
  assert.equal(await RP.avaliarT2T3({ meta, st: ok, chamar: invalido }), 'incerto');
});

test('calibração: os 12 primeiros ficam aguardando; a partir do 13º, liberado', () => {
  const itens = [];
  for (let n = 0; n < 14; n++) {
    const estado = RP.promoverCalibracao(itens);
    itens.push({ id: `v${n}`, estado });
  }
  assert.equal(itens.slice(0, 12).every((i) => i.estado === 'aguardando-calibracao'), true);
  assert.equal(itens[12].estado, 'liberado');
  assert.equal(itens[13].estado, 'liberado');
});

test('executar: triagem grava estados; quem já tem estado final não muda (idempotente)', async () => {
  const d = tmp(); const est = path.join(d, 'e.json');
  REG.gravarEstado({ itens: [{ id: 'a', estado: 'regerado-T1-ok' }, { id: 'b', estado: 'reprovado-T2T3' }], noites: [], freioAtivo: false }, est);
  const metaDe = () => meta;
  await RP.executar({ estadoArq: est, metaDe, st: ok, chamar: vermelho, hoje: '2026-10-21' });
  let e = REG.lerEstado(est);
  assert.equal(e.itens.find((i) => i.id === 'a').estado, 'reprovado-T2T3');
  assert.equal(e.itens.find((i) => i.id === 'b').estado, 'reprovado-T2T3');
  await RP.executar({ estadoArq: est, metaDe, st: ok, chamar: verde, hoje: '2026-10-22' });
  e = REG.lerEstado(est);
  assert.equal(e.itens.find((i) => i.id === 'a').estado, 'reprovado-T2T3', 'estado final não muda sozinho');
});

test('executar com Ollama fora mantém aguardando-ollama e não libera nada', async () => {
  const d = tmp(); const est = path.join(d, 'e.json');
  REG.gravarEstado({ itens: [{ id: 'a', estado: 'regerado-T1-ok' }], noites: [], freioAtivo: false }, est);
  await RP.executar({ estadoArq: est, metaDe: () => meta, st: fora, chamar: verde, hoje: '2026-10-21' });
  assert.equal(REG.lerEstado(est).itens[0].estado, 'aguardando-ollama');
});

test('liberarCalibrados só libera quem está aguardando calibração', () => {
  const d = tmp(); const est = path.join(d, 'e.json');
  REG.gravarEstado({ itens: [{ id: 'a', estado: 'aguardando-calibracao' }, { id: 'b', estado: 'aguardando-ollama' }], noites: [], freioAtivo: false }, est);
  RP.liberarCalibrados(est, ['a', 'b']);
  const e = REG.lerEstado(est);
  assert.equal(e.itens.find((i) => i.id === 'a').estado, 'liberado');
  assert.equal(e.itens.find((i) => i.id === 'b').estado, 'aguardando-ollama');
});

test('portão na fila: só "liberado" mantém o status calculado; o resto não publica', () => {
  const itens = [
    { id: 'a', estado: 'liberado' }, { id: 'b', estado: 'regerado-T1-ok' }, { id: 'c', estado: 'aguardando-calibracao' },
    { id: 'd', estado: 'reprovado-T2T3' }, { id: 'e', estado: 'aprovacao-antonio' },
  ];
  assert.equal(REG.statusComGate('a', 'aprovado-checagem', itens), 'aprovado-checagem');
  assert.equal(REG.statusComGate('b', 'aprovado-checagem', itens), 'aguardando-ollama');
  assert.equal(REG.statusComGate('c', 'aprovado-checagem', itens), 'aguardando-calibracao');
  assert.equal(REG.statusComGate('d', 'aprovado-checagem', itens), 'reprovado');
  assert.equal(REG.statusComGate('e', 'aprovado-checagem', itens), 'aguardando-aprovacao-antonio');
  assert.equal(REG.statusComGate('fora-da-regeracao', 'aprovado-checagem', itens), 'aprovado-checagem');
});

test('registrarParaAprovacao: bloco curto com as caixas', () => {
  const d = tmp(); const arq = path.join(d, 'APROVACAO-ANTONIO.md');
  RP.registrarParaAprovacao(arq, { id: 'longo-x', motivo: 'sentido clínico' });
  const t = fs.readFileSync(arq, 'utf8');
  assert.match(t, /\[ \] APROVAR  \[ \] RECUSAR  \[ \] AJUSTAR/);
});
