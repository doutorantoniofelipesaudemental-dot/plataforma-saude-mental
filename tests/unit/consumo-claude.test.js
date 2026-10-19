const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { avaliar, podeChamarClaude, registrarChamada, avisarTeto, segundaDaSemana, diaSalvador, TETO } = require('../../scripts/consumoClaude');

// Horários em Salvador (UTC-3). 19/10/2026 é segunda-feira.
const quando = (iso) => new Date(`${iso}-03:00`);
const reg = (dia, semana = segundaDaSemana(dia)) => ({ quando: `${dia}T12:00:00.000Z`, dia, semana, origem: 'teste' });

test('abaixo do teto: pode chamar e mostra o uso', () => {
  const a = avaliar([reg('2026-10-19'), reg('2026-10-19')], quando('2026-10-19T14:00:00'));
  assert.equal(a.pode, true);
  assert.deepEqual(a.uso, { dia: 2, semana: 2 });
});

test('no teto diário: não pode chamar', () => {
  const a = avaliar([reg('2026-10-19'), reg('2026-10-19'), reg('2026-10-19')], quando('2026-10-19T14:00:00'));
  assert.equal(a.pode, false);
  assert.equal(a.motivo, 'teto diário');
});

test('no teto semanal: 15 chamadas na semana (3 por dia, 5 dias) bloqueiam no sábado', () => {
  const registros = ['19', '20', '21', '22', '23'].flatMap((d) => [1, 2, 3].map(() => reg(`2026-10-${d}`)));
  const a = avaliar(registros, quando('2026-10-24T10:00:00'));
  assert.equal(a.pode, false);
  assert.equal(a.motivo, 'teto semanal');
  assert.equal(a.uso.semana, TETO.semana);
});

test('virada de dia: o teto diário zera à meia-noite de Salvador', () => {
  const registros = [reg('2026-10-19'), reg('2026-10-19'), reg('2026-10-19')];
  assert.equal(avaliar(registros, quando('2026-10-19T23:59:00')).pode, false);
  assert.equal(avaliar(registros, quando('2026-10-20T00:01:00')).pode, true);
});

test('virada de semana: domingo 23:30 ainda é a semana antiga; segunda 00:30 começa outra', () => {
  const antiga = ['12', '13', '14', '15', '16'].flatMap((d) => [1, 2, 3].map(() => reg(`2026-10-${d}`, '2026-10-12')));
  antiga.push(reg('2026-10-18', '2026-10-12'));
  assert.equal(avaliar(antiga, quando('2026-10-18T23:30:00')).pode, false);
  assert.equal(avaliar(antiga, quando('2026-10-19T00:30:00')).pode, true);
  assert.equal(segundaDaSemana('2026-10-18'), '2026-10-12');
  assert.equal(diaSalvador(new Date('2026-10-19T02:30:00Z')), '2026-10-18');
});

test('arquivo corrompido: não chama e não sobrescreve o contador', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-'));
  try {
    const arquivos = { json: path.join(pasta, 'c.json'), md: path.join(pasta, 'CONSUMO.md'), estado: path.join(pasta, 'EG.md') };
    fs.writeFileSync(arquivos.json, '{ruim');
    const pode = podeChamarClaude({ agora: quando('2026-10-19T14:00:00'), arquivos });
    assert.equal(pode.pode, false);
    assert.match(pode.motivo, /ilegível/);
    const grava = registrarChamada({ agora: quando('2026-10-19T14:00:00'), arquivos });
    assert.equal(grava.gravado, false);
    assert.equal(fs.readFileSync(arquivos.json, 'utf8'), '{ruim');
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('registro com formato errado também conta como ilegível', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-'));
  try {
    const arquivos = { json: path.join(pasta, 'c.json'), md: path.join(pasta, 'CONSUMO.md'), estado: path.join(pasta, 'EG.md') };
    fs.writeFileSync(arquivos.json, JSON.stringify({ chamadas: [{ quando: 'ontem', dia: 'x', semana: 'y' }] }));
    assert.equal(podeChamarClaude({ agora: quando('2026-10-19T14:00:00'), arquivos }).pode, false);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('ausência do arquivo: começa do zero; registrar grava JSON e resumo', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-'));
  try {
    const arquivos = { json: path.join(pasta, 'sub', 'c.json'), md: path.join(pasta, 'sub', 'CONSUMO.md'), estado: path.join(pasta, 'EG.md') };
    const agora = quando('2026-10-19T14:00:00');
    assert.equal(podeChamarClaude({ agora, arquivos }).pode, true);
    assert.deepEqual(registrarChamada({ agora, origem: 'teste', arquivos }), { gravado: true });
    assert.equal(podeChamarClaude({ agora, arquivos }).uso.dia, 1);
    assert.match(fs.readFileSync(arquivos.md, 'utf8'), /Hoje: 1\/3/);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('simulação não grava nada', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-'));
  try {
    const arquivos = { json: path.join(pasta, 'c.json'), md: path.join(pasta, 'CONSUMO.md'), estado: path.join(pasta, 'EG.md') };
    const r = registrarChamada({ agora: quando('2026-10-19T14:00:00'), simular: true, arquivos });
    assert.equal(r.gravado, false);
    assert.equal(fs.existsSync(arquivos.json), false);
    assert.equal(fs.existsSync(arquivos.md), false);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('aviso de teto: um bloco só no topo do ESTADO-GERAL, repetir substitui', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'consumo-'));
  try {
    const arquivos = { json: path.join(pasta, 'c.json'), md: path.join(pasta, 'CONSUMO.md'), estado: path.join(pasta, 'EG.md') };
    fs.writeFileSync(arquivos.estado, '# Estado\n\nresto\n');
    avisarTeto('teto diário', quando('2026-10-19T14:00:00'), arquivos);
    avisarTeto('teto semanal', quando('2026-10-19T14:00:00'), arquivos);
    const t = fs.readFileSync(arquivos.estado, 'utf8');
    assert.equal(t.split('ALERTA-CLAUDE-P:INICIO').length - 1, 1);
    assert.match(t, /teto semanal/);
    assert.doesNotMatch(t, /teto diário/);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});
