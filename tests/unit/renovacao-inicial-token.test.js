const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { principal } = require('../../scripts/instagram/renovacaoInicial');
const { tipoDoToken, idDaConta } = require('../../backend/lib/instagramConta');

const pasta = () => fs.mkdtempSync(path.join(process.cwd(), '.tmp', 'renov-'));

test('renovação inicial: sucesso grava o resultado (sem token) e sai com 0', async () => {
  const dir = pasta();
  const arquivo = path.join(dir, 'r.md');
  const c = await principal({ renovar: async () => ({ renovado: true, expiraEm: new Date('2026-12-20T00:00:00Z') }), arquivo });
  assert.equal(c, 0);
  const texto = fs.readFileSync(arquivo, 'utf8');
  assert.match(texto, /OK — renovado; vale até 2026-12-20/);
  assert.doesNotMatch(texto, /IGAA|EAA/);
});

test('renovação inicial: falha registra o motivo e sai com 1', async () => {
  const dir = pasta();
  const arquivo = path.join(dir, 'r.md');
  const c = await principal({ renovar: async () => ({ renovado: false, motivo: 'CRON_SECRET ausente' }), arquivo });
  assert.equal(c, 1);
  assert.match(fs.readFileSync(arquivo, 'utf8'), /NÃO RENOVADO — CRON_SECRET ausente/);
});

test('renovação inicial: exceção vira falha registrada, sem derrubar o processo', async () => {
  const dir = pasta();
  const arquivo = path.join(dir, 'r.md');
  const c = await principal({ renovar: async () => { throw new Error('rede caiu'); }, arquivo });
  assert.equal(c, 1);
  assert.match(fs.readFileSync(arquivo, 'utf8'), /erro inesperado: rede caiu/);
});

test('classificação: IGAA = Instagram Login (cron se aplica); EAA = não se aplica', () => {
  assert.match(tipoDoToken('IGAAxyz'), /SE APLICA/);
  assert.match(tipoDoToken('EAAxyz'), /NÃO se aplica/);
  assert.equal(tipoDoToken(''), null);
});

test('ID da conta: IGAA usa user_id (nunca o id do app); EAA usa id', () => {
  assert.equal(idDaConta({ id: '122121351129371385', user_id: '17841415747425012' }, 'IGAAx'), '17841415747425012');
  assert.equal(idDaConta({ id: '999' }, 'EAAx'), '999');
  assert.equal(idDaConta({ id: '122' }, 'IGAAx'), null);
});
