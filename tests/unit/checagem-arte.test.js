/** Checagem automática da arte (08/11/2026): regras de tamanho, palavras, contraste, fundo, transbordo e rodapé. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { checarArte, checarLamina, luminancia, contraste } = require('../../backend/lib/redesV2/checagemArte');

const BOA = { n: 1, tituloPx: 92, corpoPx: 44, palavras: 14, corCorpo: '#1B1B1B', fundo: '#F7F1E3', transbordou: false, rodape: { crm: true, rqe: true, assinatura3: true } };

test('lâmina boa passa em todas as regras', () => {
  assert.equal(checarLamina(BOA).aprovado, true);
});

test('título abaixo de 64 px reprova', () => {
  const r = checarLamina({ ...BOA, tituloPx: 60 });
  assert.ok(r.falhas.some((f) => f.regra === 'a-titulo-px'));
});

test('corpo abaixo de 40 px reprova', () => {
  const r = checarLamina({ ...BOA, corpoPx: 36 });
  assert.ok(r.falhas.some((f) => f.regra === 'b-corpo-px'));
});

test('26 palavras reprovam; 25 passam', () => {
  assert.ok(checarLamina({ ...BOA, palavras: 26 }).falhas.some((f) => f.regra === 'c-palavras'));
  assert.equal(checarLamina({ ...BOA, palavras: 25 }).aprovado, true);
});

test('contraste abaixo de 4,5:1 reprova (cinza claro sobre creme)', () => {
  const r = checarLamina({ ...BOA, corCorpo: '#D0D0D0', fundo: '#F7F1E3' });
  assert.ok(r.falhas.some((f) => f.regra === 'd-contraste'));
});

test('fundo escuro do modelo antigo reprova', () => {
  const r = checarLamina({ ...BOA, fundo: '#1B1B1B', corCorpo: '#FFFFFF' });
  assert.ok(r.falhas.some((f) => f.regra === 'e-fundo-escuro'));
});

test('texto que transborda reprova', () => {
  assert.ok(checarLamina({ ...BOA, transbordou: true }).falhas.some((f) => f.regra === 'f-transborda'));
});

test('rodapé incompleto reprova', () => {
  assert.ok(checarLamina({ ...BOA, rodape: { crm: true, rqe: false, assinatura3: true } }).falhas.some((f) => f.regra === 'g-rodape'));
});

test('última lâmina exige CVV 188 · SAMU 192 e aviso de IA', () => {
  const semNada = checarLamina({ ...BOA, final: true });
  assert.ok(semNada.falhas.some((f) => f.regra === 'h-cvv'));
  assert.ok(semNada.falhas.some((f) => f.regra === 'i-aviso-ia'));
  assert.equal(checarLamina({ ...BOA, final: true, cvv: true, aviso: true }).aprovado, true);
});

test('peça: uma lâmina reprovada reprova a peça inteira; peça vazia não passa', () => {
  assert.equal(checarArte([BOA, { ...BOA, n: 2, tituloPx: 50 }]).aprovado, false);
  assert.equal(checarArte([BOA, { ...BOA, n: 2 }]).aprovado, true);
  assert.equal(checarArte([]).aprovado, false);
});

test('luminância e contraste: preto sobre branco = 21:1', () => {
  assert.ok(Math.abs(contraste('#000000', '#FFFFFF') - 21) < 0.01);
  assert.ok(luminancia('#FFFFFF') > 0.9);
});

test('fonte editorial ou ícone que não carregou reprova', () => {
  assert.ok(checarLamina({ ...BOA, fonteOk: false }).falhas.some((f) => f.regra === 'j-fonte'));
  assert.ok(checarLamina({ ...BOA, iconeOk: false }).falhas.some((f) => f.regra === 'k-icone'));
  assert.equal(checarLamina({ ...BOA, fonteOk: true, iconeOk: true }).aprovado, true);
});
