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
