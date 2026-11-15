// Agendamento do YouTube (ordem 15/11/2026): privado + publishAt, legenda SRT. Sem rede, sem credencial, sem freio.
const test = require('node:test');
const assert = require('node:assert/strict');
const yt = require('../../backend/lib/youtube');

test('com publicarEm: privado + publishAt (ISO) e madeForKids falso', () => {
  const s = yt.montarStatus({ privacidade: 'public', publicarEm: '2026-11-23T08:00:00-03:00' });
  assert.equal(s.privacyStatus, 'private');
  assert.equal(s.publishAt, '2026-11-23T11:00:00.000Z');
  assert.equal(s.selfDeclaredMadeForKids, false);
});

test('sem publicarEm: mantém a privacidade pedida (itens antigos inalterados)', () => {
  assert.deepEqual(yt.montarStatus({ privacidade: 'public' }), { privacyStatus: 'public', selfDeclaredMadeForKids: false });
  assert.equal(yt.montarStatus({}).privacyStatus, 'public');
  assert.equal(yt.montarStatus({}).publishAt, undefined);
});

test('publicarEm inválido é recusado antes de qualquer envio', () => {
  assert.throws(() => yt.montarStatus({ publicarEm: 'amanhã cedo' }), /publicarEm inválido/);
});

test('corpo da legenda: metadados com videoId, idioma pt e o SRT íntegro', () => {
  const srt = '1\n00:00:00,000 --> 00:00:02,000\nAnsiedade: nervosismo ou transtorno?\n';
  const corpo = yt.montarCorpoLegenda({ videoId: 'abc123', srt }).toString('utf8');
  assert.match(corpo, /"videoId":"abc123"/);
  assert.match(corpo, /"language":"pt"/);
  assert.ok(corpo.includes(srt), 'o SRT deve estar inteiro no corpo');
  assert.ok(corpo.trimEnd().endsWith('--drsm-legenda-boundary--'), 'fecha o multipart');
});
