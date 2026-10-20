const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { executarDiagnostico, sanear } = require('../../backend/lib/diagnosticoPublicacao');

const AGORA = new Date('2026-10-25T23:00:00Z');

test('diagnóstico: post válido = ok, sem publicar, e salva o resultado', async () => {
  let salvo = null;
  const r = await executarDiagnostico({ agora: AGORA, proximo: async () => ({ _id: '2026-10-26-saude-mental-cuidador' }), validar: async () => ({ ok: true, falhas: [] }), salvar: async (x) => { salvo = x; } });
  assert.equal(r.ok, true);
  assert.equal(r.publicou, false);
  assert.equal(salvo.postId, '2026-10-26-saude-mental-cuidador');
});

test('diagnóstico: fila sem post futuro = reprovado com motivo', async () => {
  const r = await executarDiagnostico({ agora: AGORA, proximo: async () => null, validar: async () => { throw new Error('não deveria validar'); } });
  assert.equal(r.ok, false);
  assert.match(r.falhas[0], /nenhum post futuro/);
});

test('diagnóstico: falha da Graph API vem saneada (sem token nem ID longo)', async () => {
  const r = await executarDiagnostico({ agora: AGORA, proximo: async () => ({ _id: 'x' }), validar: async () => ({ ok: false, falhas: ['Graph API: token IGAAabc123 recusado para 17841415747425012'] }) });
  assert.equal(r.ok, false);
  assert.doesNotMatch(r.falhas[0], /IGAAabc123|17841415747425012/);
  assert.match(r.falhas[0], /\[REDIGIDO\]/);
  assert.match(r.falhas[0], /\[ID\]/);
});

test('diagnóstico: exceção vira reprovação, sem derrubar', async () => {
  const r = await executarDiagnostico({ agora: AGORA, proximo: async () => { throw new Error('banco fora'); } });
  assert.equal(r.ok, false);
  assert.equal(r.publicou, false);
});

test('sanear: troca tokens e IDs longos', () => {
  assert.equal(sanear('EAAxyz e 12345678901234'), '[REDIGIDO] e [ID]');
});

test('garantia: o caminho de validação e o diagnóstico nunca chamam media_publish', () => {
  const sp = fs.readFileSync(path.join(__dirname, '../../backend/lib/socialPublisher.js'), 'utf8');
  const bloco = sp.slice(sp.indexOf('async function validarCarrosselNoInstagram'), sp.indexOf('async function conferirPublicacaoInstagram'));
  assert.ok(bloco.length > 100, 'bloco da validação localizado');
  assert.doesNotMatch(bloco, /media_publish/);
  for (const f of ['backend/lib/diagnosticoPublicacao.js', 'backend/lib/redesV2/validacaoCarrossel.js']) {
    assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../..', f), 'utf8'), /media_publish/, f);
  }
});
