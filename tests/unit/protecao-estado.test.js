const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { listaProtegida, planejarProtecao, avaliarRestauracao, protegerEstado, verificarEstado, ESTADO_FIXO } = require('../../scripts/lib/protecaoEstado');
const { avisosArquivosIgnorados } = require('../../scripts/lib/prontoMerge');

test('lista protegida: união sem repetição, com os arquivos fixos de estado', () => {
  const l = listaProtegida(['relatorios/linkedin/fila.json', 'relatorios/PENDENTES.md']);
  for (const f of ESTADO_FIXO) assert.ok(l.includes(f), `falta ${f}`);
  assert.equal(l.filter((f) => f === 'relatorios/PENDENTES.md').length, 1);
  assert.ok(l.includes('relatorios/linkedin/fila.json'));
});

test('planejar: só copia o que existe', () => {
  const p = planejarProtecao(['a', 'b'], { a: true, b: false });
  assert.deepEqual(p, [{ rel: 'a', copiar: true }, { rel: 'b', copiar: false }]);
});

test('avaliar: sumiu = restaurar; mudou = divergente; igual = ok', () => {
  const r = avaliarRestauracao({ a: 'x', b: 'y', c: 'z' }, { a: null, b: 'outro', c: 'z' });
  assert.deepEqual(r.restaurar, ['a']);
  assert.deepEqual(r.divergentes, ['b']);
  assert.deepEqual(r.ok, ['c']);
});

function cenario() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'protecao-'));
  const destino = path.join(raiz, '.tmp', 'estado-teste');
  fs.mkdirSync(path.join(raiz, 'relatorios', 'linkedin'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'relatorios', 'PENDENTES.md'), 'pendentes v1');
  fs.writeFileSync(path.join(raiz, 'relatorios', 'linkedin', 'fila.json'), '{"itens":[1,2,3]}');
  return { raiz, destino };
}

test('sumiu depois do merge: restaura byte a byte e relata', () => {
  const { raiz, destino } = cenario();
  const lista = ['relatorios/PENDENTES.md', 'relatorios/linkedin/fila.json'];
  const { manifesto } = protegerEstado({ raiz, lista, destino });
  fs.rmSync(path.join(raiz, 'relatorios', 'PENDENTES.md'));
  const linhas = verificarEstado({ raiz, manifesto, destino });
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios', 'PENDENTES.md'), 'utf8'), 'pendentes v1');
  assert.ok(linhas.some((l) => /RESTAURADO.*PENDENTES/.test(l)));
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('mudou depois do merge: não sobrescreve, só relata como divergente', () => {
  const { raiz, destino } = cenario();
  const lista = ['relatorios/PENDENTES.md'];
  const { manifesto } = protegerEstado({ raiz, lista, destino });
  fs.writeFileSync(path.join(raiz, 'relatorios', 'PENDENTES.md'), 'pendentes alterado pela main');
  const linhas = verificarEstado({ raiz, manifesto, destino });
  assert.equal(fs.readFileSync(path.join(raiz, 'relatorios', 'PENDENTES.md'), 'utf8'), 'pendentes alterado pela main');
  assert.ok(linhas.some((l) => /DIVERGENTE.*PENDENTES/.test(l)));
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('aviso: PR rastreia arquivo que a main ignora = aviso; rastreado e não ignorado = sem aviso', () => {
  const a = avisosArquivosIgnorados({ rastreadosNoPr: ['relatorios/PENDENTES.md'], ignoradosNaMain: ['relatorios/PENDENTES.md'] });
  assert.equal(a.length, 1);
  assert.match(a[0], /merge-seguro protege/);
  assert.deepEqual(avisosArquivosIgnorados({ rastreadosNoPr: ['relatorios/PENDENTES.md'], ignoradosNaMain: [] }), []);
});
