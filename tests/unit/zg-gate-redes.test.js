// Portão zero genérico no pipeline das redes (ordem de 10/11/2026, 06:15). Testes determinísticos, sem rede nem banco.
const test = require('node:test');
const assert = require('node:assert/strict');
const { derivarFrases, aplicarOverride, avaliarZeroGenerico, historicoDe, carregarOverrides } = require('../../backend/lib/redesV2/zgGate');
const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');
const { LINHA_CREDITO, ORIENTACAO } = require('../../backend/lib/redesV2/conteudo');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CORPO = '<p>Dormir mal cansa o corpo e a mente.</p><p>Horários regulares para deitar e para acordar ajudam o sono a voltar.</p>';
const DOC = { slug: 'exemplo-de-pauta', publicado: true, conteudo: CORPO, resumo: 'Resumo qualquer.' };
const URL = 'https://www.drantoniofelipemedico.com.br/artigo/exemplo-de-pauta';
const LEG = [
  'Dormir mal cansa o corpo e a mente.',
  '',
  '• Horários regulares para deitar e para acordar ajudam o sono a voltar.',
  '',
  'Texto completo no link da bio.',
  '',
  'Em crise: CVV 188 · SAMU 192',
  '',
  AVISO_CFM,
  '',
  '#saudemental #sono #bemestar',
].join('\n');

test('derivarFrases lê só o corpo: sem bullets, sem rodapé fixo, sem hashtags', () => {
  const frases = derivarFrases(LEG);
  assert.deepEqual(frases, ['Dormir mal cansa o corpo e a mente.', 'Horários regulares para deitar e para acordar ajudam o sono a voltar.']);
});

test('aplicarOverride troca só os campos presentes e não muta o plano original', () => {
  const plano = { legendaCorpo: 'A', telas: [{ tipo: 'capa' }], refs: [] };
  const novo = aplicarOverride(plano, { legendaCorpo: 'B' });
  assert.equal(novo.legendaCorpo, 'B');
  assert.deepEqual(novo.telas, plano.telas);
  assert.equal(plano.legendaCorpo, 'A');
  assert.equal(aplicarOverride(plano, null), plano);
});

test('avaliarZeroGenerico aprova texto literal, com eixo e ponto concreto do override', () => {
  const ov = { eixo: 'E6', pontos: [{ tipo: 'passo', texto: 'Horários regulares para deitar e para acordar ajudam o sono a voltar.' }] };
  // 2026-11-13 é sexta: eixo do dia = E6
  const r = avaliarZeroGenerico({ doc: DOC, legenda: LEG, ov, dataISO: '2026-11-13', historico: [], urlTexto: URL });
  assert.deepEqual(r.falhas.filter((f) => f.regra !== 'h-numero-sem-referencia'), []);
  assert.equal(r.aprovado, true);
});

test('frase que não é literal do artigo reprova (regra b), mesmo sem override', () => {
  const legRuim = LEG.replace('Dormir mal cansa o corpo e a mente.', 'Dormir mal destrói a sua vida inteira por completo.');
  const r = avaliarZeroGenerico({ doc: DOC, legenda: legRuim, ov: { eixo: 'E6', pontos: [] }, dataISO: '2026-11-13', historico: [], urlTexto: URL });
  assert.ok(r.falhas.some((f) => f.regra === 'b-frase-clinica'));
  assert.equal(r.aprovado, false);
});

test('eixo fora do dia reprova (regra f)', () => {
  const r = avaliarZeroGenerico({ doc: DOC, legenda: LEG, ov: { eixo: 'E1', pontos: [{ tipo: 'passo', texto: 'Horários regulares para deitar e para acordar ajudam o sono a voltar.' }] }, dataISO: '2026-11-13', historico: [], urlTexto: URL });
  assert.ok(r.falhas.some((f) => f.regra === 'f-eixo-do-dia'));
});

test('historicoDe ignora a própria pasta e a pasta revisar', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zg-'));
  for (const nome of ['2026-11-02-a', '2026-11-09-b', '2026-11-13-atual', 'revisar']) fs.mkdirSync(path.join(dir, nome), { recursive: true });
  fs.writeFileSync(path.join(dir, '2026-11-02-a', 'meta.json'), JSON.stringify({ slug: 'a', dataSugerida: '2026-11-02T08:00:00-03:00' }));
  fs.writeFileSync(path.join(dir, '2026-11-02-a', 'legenda.txt'), 'x');
  fs.writeFileSync(path.join(dir, '2026-11-09-b', 'meta.json'), JSON.stringify({ slug: 'b', dataSugerida: '2026-11-09T08:00:00-03:00' }));
  fs.writeFileSync(path.join(dir, '2026-11-09-b', 'legenda.txt'), 'y');
  fs.writeFileSync(path.join(dir, '2026-11-13-atual', 'meta.json'), JSON.stringify({ slug: 'c', dataSugerida: '2026-11-13T08:00:00-03:00' }));
  fs.writeFileSync(path.join(dir, '2026-11-13-atual', 'legenda.txt'), 'z');
  const h = historicoDe(dir, { excluirId: '2026-11-13-atual' });
  assert.deepEqual(h.map((x) => x.slug).sort(), ['a', 'b']);
  assert.equal(h[0].dataISO.length, 10);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('carregarOverrides: arquivo ausente = vazio; presente = lido', () => {
  assert.deepEqual(carregarOverrides(path.join(os.tmpdir(), 'nao-existe-zg.json')), { ovs: {}, trocas: {} });
});

test('fixos do rodapé (crédito e orientação) não contam como frase clínica', () => {
  const leg = `Texto de corpo com frase suficientemente longa.\n\n${LINHA_CREDITO}\n\n${ORIENTACAO}`;
  assert.deepEqual(derivarFrases(leg), ['Texto de corpo com frase suficientemente longa.']);
});
