'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  reprovaEstatico, reprovaTextoCortado, reprovaTituloDuplicado, reprovaCaixaVazia,
  reprovaExcessoPalavras, checar, LIMITE_MOVIMENTO,
} = require('../../scripts/padraoVisual/checagemVisual.js');

test('reprova vídeo estático e aceita cena com movimento', () => {
  assert.match(reprovaEstatico({ id: 's1', movimento: 0 }), /estático/);
  assert.match(reprovaEstatico({ id: 's1' }), /estático/);
  assert.equal(reprovaEstatico({ id: 's1', movimento: LIMITE_MOVIMENTO + 0.01 }), null);
});

test('reprova texto fora da área segura ou cortado pelo painel', () => {
  const paineis = [{ id: 'p', x0: 60, y0: 100, x1: 1020, y1: 300 }];
  const ok = [{ texto: 'ok', x0: 100, y0: 120, x1: 300, y1: 160, painel: 'p' }];
  assert.deepEqual(reprovaTextoCortado(ok, paineis, 1080, 1920), []);
  const foraDoPainel = [{ texto: 'corta', x0: 100, y0: 120, x1: 300, y1: 340, painel: 'p' }];
  assert.equal(reprovaTextoCortado(foraDoPainel, paineis, 1080, 1920).length, 1);
  const bordaDireita = [{ texto: 'borda', x0: 900, y0: 120, x1: 1060, y1: 160, painel: null }];
  assert.equal(reprovaTextoCortado(bordaDireita, paineis, 1080, 1920).length, 1);
  const painelInexistente = [{ texto: 'x', x0: 100, y0: 120, x1: 200, y1: 150, painel: 'nao-existe' }];
  assert.equal(reprovaTextoCortado(painelInexistente, paineis, 1080, 1920).length, 1);
});

test('reprova título duplicado dentro da mesma peça e aceita títulos distintos', () => {
  assert.deepEqual(reprovaTituloDuplicado([{ id: 'a', titulo: 'Sinais' }, { id: 'b', titulo: 'Pausas' }]), []);
  const dup = reprovaTituloDuplicado([{ id: 'a', titulo: 'Sinais' }, { id: 'b', titulo: ' sinais ' }]);
  assert.equal(dup.length, 1);
  assert.match(dup[0], /duplicado/);
});

test('reprova caixa vazia (painel sem texto ou texto em branco)', () => {
  const paineis = [{ id: 'p', x0: 0, y0: 0, x1: 10, y1: 10 }];
  assert.equal(reprovaCaixaVazia(paineis, []).length, 1);
  assert.equal(reprovaCaixaVazia(paineis, [{ texto: '   ', painel: 'p' }]).length, 2);
  assert.deepEqual(reprovaCaixaVazia(paineis, [{ texto: 'Sim', painel: 'p' }]), []);
});

test('reprova mais de 25 palavras de arte por quadro, sem contar assinatura, aviso e marcadores', () => {
  const vinte = Array.from({ length: 20 }, (_, i) => `p${i}`).join(' ');
  assert.deepEqual(reprovaExcessoPalavras([{ texto: vinte, tipo: 'arte' }]), []);
  const muitas = Array.from({ length: 26 }, (_, i) => `p${i}`).join(' ');
  assert.equal(reprovaExcessoPalavras([{ texto: muitas, tipo: 'arte' }]).length, 1);
  assert.deepEqual(reprovaExcessoPalavras([{ texto: muitas, tipo: 'aviso' }]), []);
  assert.deepEqual(reprovaExcessoPalavras([{ texto: '• • • • • • • • • • • • • • • • • • • • • • • • • • • • • •', tipo: 'arte' }]), []);
});

test('checar: manifest reprovado por estático e aprovado quando tudo confere', () => {
  const caixasOk = [{ texto: 'Título', x0: 100, y0: 200, x1: 500, y1: 260, tipo: 'titulo', painel: null }];
  const base = (movimento, titulo) => ({
    reel: {
      largura: 1080, altura: 1920,
      cenas: [{ id: 's1', movimento }],
      caixas: [{ cena: 's1', titulo, caixas: caixasOk, paineis: [] }],
    },
  });
  assert.equal(checar(base(0.5, 'Um')).aprovado, true);
  const reprovado = checar(base(0, 'Um'));
  assert.equal(reprovado.aprovado, false);
  assert.match(reprovado.motivos.join(' '), /estático/);
});

test('amostras geradas (quando existem) passam na checagem automática', () => {
  const caminho = path.join(__dirname, '..', '..', '..', 'DRSAUDEMENTAL', '.tmp', 'amostras-novo-padrao', 'manifest.json');
  const alt = 'C:/DRSAUDEMENTAL/.tmp/amostras-novo-padrao/manifest.json';
  const arquivo = fs.existsSync(alt) ? alt : caminho;
  if (!fs.existsSync(arquivo)) return;
  const resultado = checar(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
  assert.deepEqual(resultado.motivos, []);
  assert.equal(resultado.aprovado, true);
});

test('trilha: ganho calculado deixa a música 22 dB abaixo da voz (RMS), não em valor absoluto', () => {
  const { spawnSync } = require('child_process');
  const dir = path.join(__dirname, '..', '..', 'scripts', 'padraoVisual');
  const codigo = [
    'import sys, json',
    'sys.path.insert(0, sys.argv[1])',
    'from ganhoTrilha import ganho_trilha_db, combinar_rms_db',
    'print(json.dumps({',
    '  "ganho": ganho_trilha_db(-20.0, -40.0),',
    '  "ganhoSemAlvo": ganho_trilha_db(-20.0, -40.0, -20.0),',
    '  "mediaIgual": combinar_rms_db([(-20.0, 3.0), (-20.0, 7.0)]),',
    '  "mediaPonderada": combinar_rms_db([(-20.0, 1.0), (-30.0, 1.0)]),',
    '}))',
  ].join('\n');
  const r = spawnSync('python', ['-c', codigo, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const v = JSON.parse(r.stdout);
  // voz -20 dB, alvo -22 => trilha final -42; bruta -40 => ganho -2 dB
  assert.equal(v.ganho, -2);
  assert.equal(v.ganhoSemAlvo, 0);
  assert.ok(Math.abs(v.mediaIgual + 20) < 1e-9);
  // média de potência de -20 e -30 dB (iguais em duração): 10*log10((0.01+0.001)/2) = -22.5963
  assert.ok(Math.abs(v.mediaPonderada - (-22.5963)) < 1e-3);
});
