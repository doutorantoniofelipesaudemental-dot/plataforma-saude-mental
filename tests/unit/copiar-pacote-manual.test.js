const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { copiarPacote } = require('../../scripts/youtube/copiarPacoteManual');

const TMP = path.join(__dirname, '../../.tmp');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const novaPasta = (nome) => { fs.mkdirSync(TMP, { recursive: true }); return fs.mkdtempSync(path.join(TMP, nome + '-')); };
const meta = { arquivos: { video: 'short.mp4', capa: 'thumb.png' } };

function pacoteOriginal() {
  const orig = novaPasta('orig');
  fs.writeFileSync(path.join(orig, 'short.mp4'), 'video-de-teste');
  fs.writeFileSync(path.join(orig, 'thumb.png'), 'capa-de-teste');
  fs.writeFileSync(path.join(orig, 'cap.ass'), '[Script Info]\nlegenda queimada de teste');
  fs.writeFileSync(path.join(orig, 'credito.ass'), '[Script Info]\ncredito de teste');
  return orig;
}

test('cópia do pacote inclui cap.ass e credito.ass, com o mesmo conteúdo da original', () => {
  const orig = pacoteOriginal();
  const dir = path.join(novaPasta('manual'), 'pacote');
  const r = copiarPacote({ orig, dir, meta });
  assert.ok(r.copiados.includes('cap.ass') && r.copiados.includes('credito.ass'));
  assert.equal(sha(path.join(dir, 'cap.ass')), sha(path.join(orig, 'cap.ass')));
  assert.equal(sha(path.join(dir, 'credito.ass')), sha(path.join(orig, 'credito.ass')));
  assert.equal(sha(path.join(dir, 'short.mp4')), sha(path.join(orig, 'short.mp4')));
});

test('completar pasta existente: adiciona o que falta e não sobrescreve o que já existe', () => {
  const orig = pacoteOriginal();
  const dir = path.join(novaPasta('manual2'), 'pacote');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'cap.ass'), 'versao antiga da pasta manual');
  copiarPacote({ orig, dir, meta });
  assert.equal(fs.readFileSync(path.join(dir, 'cap.ass'), 'utf8'), 'versao antiga da pasta manual', 'não sobrescreve');
  assert.ok(fs.existsSync(path.join(dir, 'credito.ass')), 'adiciona o que faltava');
});

test('arquivo ausente na origem é informado, não quebra a cópia', () => {
  const orig = novaPasta('orig-sem');
  fs.writeFileSync(path.join(orig, 'short.mp4'), 'v');
  fs.writeFileSync(path.join(orig, 'thumb.png'), 'c');
  const dir = path.join(novaPasta('manual3'), 'pacote');
  const r = copiarPacote({ orig, dir, meta });
  assert.ok(r.copiados.includes('short.mp4'));
  assert.deepEqual(r.faltando, []);
});
