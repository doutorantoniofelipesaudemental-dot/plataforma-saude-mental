const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { expandirPasta, arquivosDeEstado, LISTA } = require('../../scripts/backupEstado');
const { listaProtegida, protegerEstado, verificarEstado } = require('../../scripts/lib/protecaoEstado');

// Pasta temporária DENTRO do projeto (.tmp/), como os outros testes de estado.
function preparar() {
  const raiz = fs.mkdtempSync(path.join(__dirname, '../../.tmp/fila-teste-'));
  const pasta = path.join(raiz, 'relatorios/linkedin/fila-manual/semana-1/01-texto');
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'texto.txt'), 'Texto do post\r\nReferência: X. 2020.', 'utf8');
  fs.writeFileSync(path.join(pasta, 'LEIA-ME.txt'), 'instruções', 'utf8');
  fs.writeFileSync(path.join(pasta, 'carrossel.pdf'), Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff]));
  fs.writeFileSync(path.join(raiz, 'relatorios/linkedin/fila-manual/semana-1/meta.json'), '{"a":1}', 'utf8');
  return raiz;
}

test('expandirPasta: pega os textos (.txt, .md, .json) em todas as subpastas e deixa a mídia de fora', () => {
  const raiz = preparar();
  const achados = expandirPasta(raiz, 'relatorios/linkedin/fila-manual/').sort();
  assert.deepEqual(achados, [
    'relatorios/linkedin/fila-manual/semana-1/01-texto/LEIA-ME.txt',
    'relatorios/linkedin/fila-manual/semana-1/01-texto/texto.txt',
    'relatorios/linkedin/fila-manual/semana-1/meta.json',
  ]);
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('a LISTA do backup inclui a pasta da fila manual do LinkedIn', () => {
  assert.ok(LISTA.includes('relatorios/linkedin/fila-manual/'));
});

test('arquivosDeEstado: pasta vazia ou ausente não quebra o backup', () => {
  const raiz = preparar();
  assert.deepEqual(arquivosDeEstado(raiz, ['relatorios/linkedin/nao-existe/']), []);
  const itens = arquivosDeEstado(raiz, ['relatorios/linkedin/fila-manual/']);
  assert.equal(itens.length, 3);
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('proteção do merge: copia a pasta inteira (inclusive PDF) e restaura um arquivo que sumiu, byte a byte', () => {
  const raiz = preparar();
  const destino = path.join(raiz, '.tmp-estado');
  const lista = listaProtegida(['relatorios/linkedin/fila-manual/']);
  const { manifesto } = protegerEstado({ raiz, lista, destino });
  const pdf = 'relatorios/linkedin/fila-manual/semana-1/01-texto/carrossel.pdf';
  assert.ok(manifesto[pdf], 'PDF da pasta copiado');
  const txt = 'relatorios/linkedin/fila-manual/semana-1/01-texto/texto.txt';
  const original = fs.readFileSync(path.join(raiz, txt));
  fs.rmSync(path.join(raiz, txt)); // simula o arquivo que sumiu depois do merge
  const linhas = verificarEstado({ raiz, manifesto, destino });
  assert.ok(linhas.some((l) => l.startsWith('RESTAURADO') && l.includes('texto.txt')));
  assert.ok(fs.readFileSync(path.join(raiz, txt)).equals(original), 'restaurado com os mesmos bytes (CRLF incluído)');
  fs.rmSync(raiz, { recursive: true, force: true });
});
