const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { gravar } = require('../../scripts/conferencias/resumoDoDia');

const BLOB = 'PRECISA DO DR. ANTÔNIO: SIM — Blob: rotina não apagou nada';
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'drs-resumo-')), 'RESUMO-DO-DIA.md');
const agora = new Date(2026, 9, 28, 9, 30);
const nova = ['PRECISA DO DR. ANTÔNIO: NÃO', 'Resumo de 2026-10-28 (Portal e redes)', 'Alertas: nenhum'];

test('alerta do Blob gravado hoje continua no topo depois da conferência das 09:30', () => {
  const arq = tmp();
  fs.writeFileSync(arq, `${BLOB}\nlinha antiga\n`, 'utf8');
  fs.utimesSync(arq, agora, agora);
  gravar(nova, { arquivo: arq, agora });
  const linhas = fs.readFileSync(arq, 'utf8').split('\n');
  assert.equal(linhas[0], BLOB);
  assert.equal(linhas.filter((l) => l.startsWith('PRECISA DO DR.')).length, 1);
  assert.equal(linhas[1], 'Resumo de 2026-10-28 (Portal e redes)');
});

test('alerta do Blob de outro dia não é mantido', () => {
  const arq = tmp();
  fs.writeFileSync(arq, `${BLOB}\n`, 'utf8');
  const ontem = new Date(2026, 9, 27, 3, 0);
  fs.utimesSync(arq, ontem, ontem);
  gravar(nova, { arquivo: arq, agora });
  assert.equal(fs.readFileSync(arq, 'utf8').includes('Blob:'), false);
});

test('sem alerta do Blob, grava o resumo normalmente', () => {
  const arq = tmp();
  fs.writeFileSync(arq, 'outra coisa\n', 'utf8');
  fs.utimesSync(arq, agora, agora);
  gravar(nova, { arquivo: arq, agora });
  assert.equal(fs.readFileSync(arq, 'utf8'), `${nova.join('\n')}\n`);
});
