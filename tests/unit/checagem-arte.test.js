/** Checagem automática da arte e do aviso (08/11/2026): tamanhos, palavras, contraste, fundo, transbordo, rodapé, colisão, rótulos, aviso e selo. */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  checarArte, checarLamina, checarAvisoTexto, checarAvisoLegenda, seloValido, temReferenciaNomeada, luminancia, contraste, AVISO_APROVADO,
} = require('../../backend/lib/redesV2/checagemArte');

const BOA = { n: 1, tituloPx: 92, corpoPx: 44, palavras: 14, corCorpo: '#1B1B1B', fundo: '#F7F1E3', transbordou: false, fonteOk: true, iconeOk: true, colisoes: 0, rodape: { crm: true, rqe: true, assinatura3: true }, corpoTexto: 'Passo prático, sem referência.' };
const FINAL = { n: 4, tipo: 'final', final: true, tituloPx: null, corpoPx: 40, palavras: 20, corCorpo: '#1B1B1B', fundo: '#CFF1E4', transbordou: false, fonteOk: true, iconeOk: true, colisoes: 0, cvv: true, rodapeCompleto: true, rodape: { crm: true, rqe: true, assinatura3: true, completo: true }, aviso: `Conteúdo educativo com apoio de IA, ${AVISO_APROVADO}.` };

test('lâmina boa passa em todas as regras', () => {
  assert.equal(checarLamina(BOA).aprovado, true);
});

test('título abaixo de 64 px reprova', () => {
  assert.ok(checarLamina({ ...BOA, tituloPx: 60 }).falhas.some((f) => f.regra === 'a-titulo-px'));
});

test('corpo abaixo de 40 px reprova', () => {
  assert.ok(checarLamina({ ...BOA, corpoPx: 36 }).falhas.some((f) => f.regra === 'b-corpo-px'));
});

test('26 palavras reprovam; 25 passam', () => {
  assert.ok(checarLamina({ ...BOA, palavras: 26 }).falhas.some((f) => f.regra === 'c-palavras'));
  assert.equal(checarLamina({ ...BOA, palavras: 25 }).aprovado, true);
});

test('contraste abaixo de 4,5:1 reprova', () => {
  assert.ok(checarLamina({ ...BOA, corCorpo: '#D0D0D0' }).falhas.some((f) => f.regra === 'd-contraste'));
});

test('fundo escuro do modelo antigo reprova', () => {
  assert.ok(checarLamina({ ...BOA, fundo: '#1B1B1B', corCorpo: '#FFFFFF' }).falhas.some((f) => f.regra === 'e-fundo-escuro'));
});

test('texto que transborda, fonte ou ícone que não carregou reprovam', () => {
  assert.ok(checarLamina({ ...BOA, transbordou: true }).falhas.some((f) => f.regra === 'f-transborda'));
  assert.ok(checarLamina({ ...BOA, fonteOk: false }).falhas.some((f) => f.regra === 'j-fonte'));
  assert.ok(checarLamina({ ...BOA, iconeOk: false }).falhas.some((f) => f.regra === 'k-icone'));
});

test('colisão entre linhas do título reprova (regra nova, ordem de 08/11 00:50)', () => {
  const r = checarLamina({ ...BOA, colisoes: 1, pares: ['DISMÓRFICO / CORPORAL'] });
  assert.ok(r.falhas.some((f) => f.regra === 'm-colisao-linhas'));
});

test('rótulo fora da lista reprova; "Dado" sem referência nomeada reprova; "Dado" com (ano) passa', () => {
  assert.ok(checarLamina({ ...BOA, rotulo: 'Para levar' }).falhas.some((f) => f.regra === 'o-rotulo'));
  assert.ok(checarLamina({ ...BOA, rotulo: 'Dado', corpoTexto: 'A NR-1 inclui o assédio.' }).falhas.some((f) => f.regra === 'n-dado-sem-referencia'));
  assert.equal(checarLamina({ ...BOA, rotulo: 'Dado', corpoTexto: 'Dawes et al. (2016) encontrou X.' }).aprovado, true);
  assert.equal(checarLamina({ ...BOA, rotulo: 'Passo' }).aprovado, true);
});

test('intermediária com rodapé de 3 linhas passa; sem ele reprova', () => {
  assert.equal(checarLamina(BOA).aprovado, true);
  assert.ok(checarLamina({ ...BOA, rodape: { crm: true, rqe: false, assinatura3: true } }).falhas.some((f) => f.regra === 'g-rodape'));
});

test('última lâmina exige bloco completo de 5 linhas, CVV e aviso aprovado', () => {
  assert.equal(checarLamina(FINAL).aprovado, true);
  assert.ok(checarLamina({ ...FINAL, rodapeCompleto: false }).falhas.some((f) => f.regra === 'g2-rodape-completo'));
  assert.ok(checarLamina({ ...FINAL, cvv: false }).falhas.some((f) => f.regra === 'h-cvv'));
  assert.ok(checarLamina({ ...FINAL, aviso: '' }).falhas.some((f) => f.regra === 'i-aviso-ia'));
});

test('aviso com "revisado" reprova sem selo; com selo legítimo (registro + hash) passa', () => {
  const texto = 'Conteúdo educativo com apoio de IA, revisado pelo Dr. Antônio Felipe (CFM 2.454/2026).';
  assert.ok(checarAvisoTexto(texto).some((f) => f.regra === 'l-aviso-revisado'));
  const selo = { registro: 'REG-1', hash: crypto.createHash('sha256').update(texto).digest('hex') };
  assert.equal(seloValido(texto, selo), true);
  assert.equal(checarAvisoTexto(texto, selo).filter((f) => f.regra === 'l-aviso-revisado').length, 0);
  assert.equal(seloValido(texto, { registro: 'REG-1', hash: 'errado' }), false);
});

test('legenda com "revisado" sem selo reprova; aviso aprovado passa', () => {
  assert.ok(checarAvisoLegenda('texto\nRevisado pelo Dr. Antônio Felipe (CFM 2.454/2026).').length >= 1);
  assert.equal(checarAvisoLegenda(`aprovado: ${AVISO_APROVADO}`).length, 0);
});

test('aviso fora do texto aprovado reprova', () => {
  assert.ok(checarAvisoTexto('Conteúdo educativo, sem mais nada.').some((f) => f.regra === 'l-aviso-texto'));
});

test('peça: uma lâmina reprovada reprova a peça; peça vazia não passa', () => {
  assert.equal(checarArte([BOA, { ...BOA, n: 2, tituloPx: 50 }]).aprovado, false);
  assert.equal(checarArte([BOA, FINAL]).aprovado, true);
  assert.equal(checarArte([]).aprovado, false);
});

test('referência nomeada e luminância/contraste', () => {
  assert.equal(temReferenciaNomeada('Dawes et al. (2016)'), true);
  assert.equal(temReferenciaNomeada('a NR-1 inclui'), false);
  assert.ok(Math.abs(contraste('#000000', '#FFFFFF') - 21) < 0.01);
  assert.ok(luminancia('#FFFFFF') > 0.9);
});
