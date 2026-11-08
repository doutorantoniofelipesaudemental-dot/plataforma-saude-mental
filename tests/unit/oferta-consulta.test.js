// Oferta de consulta/agendamento/atendimento individual REPROVA (ordem de 08/11/2026).
// O Dr. Antônio Felipe não faz consulta particular: texto, legenda e arte passam por esta regra.
const { test } = require('node:test');
const assert = require('node:assert');

const { checarEticaCfm, LINHAS_SOCIAL } = require('../../backend/lib/checagensAprovacao');
const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');
const { montarLegenda } = require('../../backend/lib/carrossel');

const BASE = `Um texto informativo sobre sinais de alerta no cotidiano.\n\n${LINHAS_SOCIAL.join('\n')}\n\n${AVISO_CFM}\n\nEm crise: CVV 188 · SAMU 192`;

const OFERTAS = [
  'Quer conversar sobre isso? Agende uma consulta — link na bio.',
  'Agendar consulta comigo pelo e-mail.',
  'Marque sua consulta e eu te atendo.',
  'Faço atendimento individual online.',
  'Ofereço consultas particulares.',
  'Consulta particular com o Dr. Antônio Felipe.',
  'Quer conversar sobre atendimento? Escreva por e-mail.',
  'Acesse mailto:doutor.antoniofelipe.saudemental@gmail.com?subject=Agendamento%20de%20consulta',
];

const LIMPOS = [
  'Leia o artigo completo — link na bio.',
  'Na atenção primária, a equipe da UBS acompanha o caso e encaminha ao CAPS quando preciso.',
  'Este conteúdo é informativo e não substitui o atendimento individual na rede de saúde.',
  'Grupos terapêuticos permitem que um profissional cuide de mais pessoas ao mesmo tempo.',
];

for (const trecho of OFERTAS) {
  test(`reprova oferta de consulta: "${trecho.slice(0, 50)}"`, () => {
    const r = checarEticaCfm(`${BASE}\n\n${trecho}`, { contexto: 'social' });
    assert.strictEqual(r.ok, false);
    assert.ok(r.falhas.some((f) => /oferta|agendamento/i.test(f)), r.falhas.join(' | '));
  });
}

for (const trecho of LIMPOS) {
  test(`aprova texto sem oferta: "${trecho.slice(0, 50)}"`, () => {
    const r = checarEticaCfm(`${BASE}\n\n${trecho}`, { contexto: 'social' });
    assert.ok(!r.falhas.some((f) => /oferta/i.test(f)), r.falhas.join(' | '));
  });
}

test('legenda do carrossel não traz oferta de consulta e passa na checagem social', () => {
  const artigo = { titulo: 'Título de teste', resumo: 'Resumo informativo.', categoria: 'saude-mental', tags: [] };
  const { texto: legenda } = montarLegenda(artigo, []);
  assert.ok(legenda.includes('Leia o artigo completo — link na bio.'));
  assert.ok(!/consulta|agend/i.test(legenda), legenda);
  const oferta = checarEticaCfm(legenda, { contexto: 'social', exigirIdentificacao: false }).falhas.filter((f) => /oferta/.test(f));
  assert.deepStrictEqual(oferta, []);
});
