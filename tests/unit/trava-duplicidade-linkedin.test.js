const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../../scripts/linkedin/travaDuplicidade');

test('contagens: separa abertos (aprovado-checagem e manual) de agendados (agendado-linkedin)', () => {
  assert.deepEqual(T.contagens(['aprovado-checagem', 'manual', 'agendado-linkedin', 'publicado-manual', 'agendado-linkedin']), { abertos: 2, agendados: 2 });
});

test('confirmação: só segue se exatamente 1 item saiu de aberto e entrou em agendado', () => {
  const antes = { abertos: 27, agendados: 10 };
  assert.equal(T.confirmarUmAgendado(antes, { abertos: 26, agendados: 11 }), true);
  assert.equal(T.confirmarUmAgendado(antes, { abertos: 27, agendados: 10 }), false, 'nada mudou no banco');
  assert.equal(T.confirmarUmAgendado(antes, { abertos: 25, agendados: 12 }), false, 'dois de uma vez: parar');
  assert.equal(T.confirmarUmAgendado(antes, { abertos: 26, agendados: 10 }), false, 'saiu de aberto sem virar agendado: parar');
});

test('leitura do banco: se a coleção não responder, lança erro (quem chama para, sem agendar)', async () => {
  const falso = { connection: { db: { collection: () => ({ find: () => ({ toArray: async () => { throw new Error('sem conexão'); } }) }) } } };
  await assert.rejects(() => T.lerContagens(falso), /sem conexão/);
});

test('leitura do banco: conta a partir da coleção linkedin_fila', async () => {
  const docs = [{ status: 'manual' }, { status: 'agendado-linkedin' }];
  const falso = { connection: { db: { collection: (n) => { assert.equal(n, 'linkedin_fila'); return { find: () => ({ toArray: async () => docs }) }; } } } };
  assert.deepEqual(await T.lerContagens(falso), { abertos: 1, agendados: 1 });
});

test('lote: 3 STATUS OK e banco +3 = aprovado', () => {
  const r = T.interpretarLote('texto\nSTATUS: OK post 1\nSTATUS: OK post 2\nSTATUS: OK post 3', { antes: { abertos: 27, agendados: 10 }, depois: { abertos: 24, agendados: 13 }, esperados: 3 });
  assert.equal(r.ok, true);
  assert.equal(r.agendados, 3);
});

test('lote: sem nenhuma linha STATUS = parado', () => {
  assert.equal(T.interpretarLote('nada', { antes: { abertos: 1, agendados: 0 }, depois: { abertos: 1, agendados: 0 } }).ok, false);
});

test('lote: um PARAR no meio para tudo', () => {
  const r = T.interpretarLote('STATUS: OK\nSTATUS: PARAR verificação', { antes: { abertos: 2, agendados: 0 }, depois: { abertos: 1, agendados: 1 }, esperados: 3 });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /PARAR/);
});

test('lote: STATUS que não bate com o banco para (duplicidade ou escrita sem marcar)', () => {
  const r = T.interpretarLote('STATUS: OK\nSTATUS: OK', { antes: { abertos: 5, agendados: 0 }, depois: { abertos: 4, agendados: 1 }, esperados: 3 });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /não bate/);
});

test('lote: mais posts que o combinado para', () => {
  const r = T.interpretarLote('STATUS: OK\nSTATUS: OK\nSTATUS: OK\nSTATUS: OK', { antes: { abertos: 9, agendados: 0 }, depois: { abertos: 5, agendados: 4 }, esperados: 3 });
  assert.equal(r.ok, false);
});
