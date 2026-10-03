// completarReferencias (backend/lib/ideacao.js): pauta científica sem as 3 consultas PubMed recebe as
// consultas por uma chamada curta; os problemas são recalculados. Gerador injetado, sem rede.
const { test } = require('node:test');
const assert = require('node:assert');

const ideacao = require('../../backend/lib/ideacao');

const SEM_REFS = {
  tipo: 'artigo-cientifico',
  titulo: 'Delirium no pronto-atendimento: avaliação e manejo para residentes',
  pauta: 'Guia de conduta e raciocínio clínico para residentes sobre a avaliação e o manejo do delirium no pronto-atendimento, com sinais de gravidade.',
  publicoAlvo: 'residentes',
  angulo: 'diagnóstico diferencial na primeira hora',
  sensivel: false,
};
const REFS = [
  { consultaPubMed: 'delirium emergency department management', tipoDeEstudo: 'revisão sistemática' },
  { consultaPubMed: 'delirium diagnosis screening tools', tipoDeEstudo: 'metanálise' },
  { consultaPubMed: 'delirium guideline older adults', tipoDeEstudo: 'diretriz' },
];

test('pauta científica sem referências recebe as consultas e deixa de ter problema', async () => {
  const [p] = ideacao.criarPropostas([SEM_REFS]);
  assert.ok(p.problemas.some((x) => /3 a 6 referências/.test(x)));
  let chamadas = 0;
  const corrigidas = await ideacao.completarReferencias([p], async ({ usuario }) => {
    chamadas++;
    assert.match(usuario, /Delirium/);
    return { referencias: REFS };
  });
  assert.strictEqual(chamadas, 1);
  assert.deepStrictEqual(corrigidas.map((x) => x.id), [p.id]);
  assert.strictEqual(p.referencias.length, 3);
  assert.deepStrictEqual(p.problemas, []);
  assert.strictEqual(ideacao.mudarStatus([p], p.id, 'aprovada').status, 'aprovada');
});

test('não chama o modelo para crônica, pauta rejeitada ou pauta que já tem referências', async () => {
  const [ok] = ideacao.criarPropostas([{ ...SEM_REFS, referencias: REFS }]);
  const [cronica] = ideacao.criarPropostas([{ ...SEM_REFS, tipo: 'cronica', titulo: 'A chave que girou devagar', pauta: `${SEM_REFS.pauta} Narrativa composta.` }]);
  const [rej] = ideacao.criarPropostas([SEM_REFS]);
  rej.status = 'rejeitada';
  let chamadas = 0;
  await ideacao.completarReferencias([ok, cronica, rej], async () => { chamadas++; return { referencias: REFS }; });
  assert.strictEqual(chamadas, 0);
});

test('resposta com menos de 3 consultas não altera a pauta; o problema de referências continua', async () => {
  const [p] = ideacao.criarPropostas([SEM_REFS]);
  const corrigidas = await ideacao.completarReferencias([p], async () => ({ referencias: REFS.slice(0, 2) }));
  assert.strictEqual(corrigidas.length, 0);
  assert.ok(p.problemas.some((x) => /3 a 6 referências/.test(x)));
});

test('problemas de originalidade são preservados ao recalcular', async () => {
  const [p] = ideacao.criarPropostas([SEM_REFS]);
  p.problemas.push('originalidade: paráfrase/redundância de "X" (similaridade 0.40, título 0.50)');
  await ideacao.completarReferencias([p], async () => ({ referencias: REFS }));
  assert.deepStrictEqual(p.problemas.length, 1);
  assert.match(p.problemas[0], /^originalidade/);
});
