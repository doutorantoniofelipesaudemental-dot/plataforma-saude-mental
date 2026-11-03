const test = require('node:test');
const assert = require('node:assert/strict');
const { alvosDoDia, avaliarPublicacao, diaAnterior } = require('../../scripts/conferencias/publicacaoAgendada');

const HOJE = '2026-11-02';
const AGORA = '2026-11-02T20:00:00.000Z';

test('diaAnterior volta um dia', () => {
  assert.equal(diaAnterior('2026-11-01'), '2026-10-31');
  assert.equal(diaAnterior('2026-03-01'), '2026-02-28');
});

test('alvosDoDia pega só ontem e hoje (America/Bahia), em ordem de horário', () => {
  const artigos = [
    { slug: 'hoje-14h', agendamento: { slot: '2026-11-02T17:00:00.000Z' } }, // 14:00 de 02/11
    { slug: 'hoje-08h', agendamento: { slot: '2026-11-02T11:00:00.000Z' } }, // 08:00 de 02/11
    { slug: 'ontem-08h', agendamento: { slot: '2026-11-01T11:00:00.000Z' } }, // 08:00 de 01/11
    { slug: 'anteontem', agendamento: { slot: '2026-10-31T11:00:00.000Z' } },
    { slug: 'amanha', agendamento: { slot: '2026-11-03T11:00:00.000Z' } },
    { slug: 'sem-slot', agendamento: {} },
  ];
  const slugs = alvosDoDia({ hoje: HOJE, artigos }).map((a) => a.slug);
  assert.deepEqual(slugs, ['ontem-08h', 'hoje-08h', 'hoje-14h']);
});

test('agendado e não publicado, horário já passou: falha', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: false, agendamento: { slot: '2026-11-02T11:00:00.000Z', falha: 'erro de rede' } }, agora: AGORA, statusHttp: null });
  assert.equal(r.nivel, 'falha');
  assert.match(r.texto, /NÃO publicado/);
  assert.match(r.texto, /erro de rede/);
});

test('agendado e não publicado, horário ainda não chegou: aviso (não falha)', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: false, agendamento: { slot: '2026-11-02T22:00:00.000Z' } }, agora: AGORA, statusHttp: null });
  assert.equal(r.nivel, 'aviso');
});

test('publicado no horário e página 200: ok', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: true, publicadoEm: '2026-11-02T11:02:00.000Z', agendamento: { slot: '2026-11-02T11:00:00.000Z' } }, agora: AGORA, statusHttp: 200 });
  assert.equal(r.nivel, 'ok');
});

test('publicado com página fora do ar: falha', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: true, publicadoEm: '2026-11-02T11:00:00.000Z', agendamento: { slot: '2026-11-02T11:00:00.000Z' } }, agora: AGORA, statusHttp: 404 });
  assert.equal(r.nivel, 'falha');
  assert.match(r.texto, /HTTP 404/);
});

test('publicado com mais de 60 min de diferença do horário: aviso', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: true, publicadoEm: '2026-11-02T13:30:00.000Z', agendamento: { slot: '2026-11-02T11:00:00.000Z' } }, agora: AGORA, statusHttp: 200 });
  assert.equal(r.nivel, 'aviso');
});

test('publicado sem data de publicação: falha', () => {
  const r = avaliarPublicacao({ artigo: { slug: 'x', publicado: true, agendamento: { slot: '2026-11-02T11:00:00.000Z' } }, agora: AGORA, statusHttp: 200 });
  assert.equal(r.nivel, 'falha');
});
