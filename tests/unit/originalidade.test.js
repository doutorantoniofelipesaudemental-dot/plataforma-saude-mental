// Originalidade e não duplicidade (backend/lib/originalidade.js + integração na ideação e nas
// checagens de aprovação). Sem banco: o acervo é sintético, no mesmo estilo do acervo real
// (títulos com fórmulas repetidas: "como rastrear na consulta de rotina", "o que toda família precisa saber").
const { test } = require('node:test');
const assert = require('node:assert');

const { checarOriginalidade, similaridade } = require('../../backend/lib/originalidade');
const ideacao = require('../../backend/lib/ideacao');
const { executarChecagensAprovacao } = require('../../backend/lib/checagensAprovacao');

const ASSUNTOS = ['insônia', 'jogo patológico', 'compulsão alimentar', 'tabagismo', 'luto', 'timidez', 'fobia social', 'burnout docente',
  'depressão pós-parto', 'psicose inicial', 'demência', 'autismo adulto', 'dependência de álcool', 'ansiedade de desempenho', 'tempo de tela',
  'bullying escolar', 'violência doméstica', 'estresse migratório', 'medo de agulha', 'anorexia', 'bulimia', 'transtorno bipolar', 'pânico',
  'tricotilomania', 'dor crônica', 'menopausa', 'aposentadoria', 'solidão do idoso', 'trabalho por turnos', 'assédio moral', 'jogos online',
  'sedentarismo', 'uso de benzodiazepínicos', 'fadiga da compaixão', 'esgotamento do cuidador', 'sofrimento no vestibular', 'ciúme patológico',
  'procrastinação', 'perfeccionismo', 'luto perinatal'];
const ACERVO = ASSUNTOS.map((a, i) => ({
  titulo: `${a[0].toUpperCase()}${a.slice(1)}: como rastrear na consulta de rotina`,
  resumo: `Guia sobre ${a}, sinais de alerta na consulta e o que a família precisa saber.`,
  categoria: i % 2 ? 'Médicos & Enfermeiros' : 'Pacientes & Famílias',
  tags: i % 5 === 0 ? ['atenção primária'] : [],
}));

test('original: assunto novo com as mesmas fórmulas de título do acervo é aceito', () => {
  const r = checarOriginalidade({ titulo: 'Hipocondria: como rastrear na consulta de rotina', pauta: 'Guia sobre hipocondria, sinais de alerta na consulta e o que a família precisa saber.' }, ACERVO);
  assert.strictEqual(r.ok, true, JSON.stringify(r.maisProximo));
  assert.strictEqual(r.veredito, 'original');
});

test('cópia: título idêntico ou quase idêntico é rejeitado', () => {
  const identico = checarOriginalidade({ titulo: ACERVO[0].titulo, resumo: ACERVO[0].resumo }, ACERVO);
  assert.strictEqual(identico.ok, false);
  assert.strictEqual(identico.veredito, 'copia');
  const quase = checarOriginalidade({ titulo: 'Insônia: como rastrear na consulta de rotina!' }, ACERVO);
  assert.strictEqual(quase.ok, false);
  assert.match(quase.motivos[0], /Insônia: como rastrear/);
});

test('paráfrase: mesmo assunto com outras palavras é rejeitado', () => {
  const r = checarOriginalidade(
    { titulo: 'Tratamento da insônia crônica: além do remédio', pauta: 'Como conduzir a insônia crônica na consulta e o que a família precisa saber.' },
    ACERVO
  );
  assert.strictEqual(r.ok, false);
  assert.ok(['redundante', 'copia'].includes(r.veredito));
  assert.match(r.motivos[0], /Insônia/);
});

test('redundância: mesmo assunto em outra formulação, e título reordenado, também são pegos', () => {
  const r = checarOriginalidade({ titulo: 'Esgotamento de professores: burnout docente na escola' }, ACERVO);
  assert.strictEqual(r.ok, false);
  const s = similaridade({ titulo: 'Sono e luto' }, { titulo: 'Luto e sono' });
  assert.ok(s.simTitulo > 0.85, 'mesmas palavras, ordem diferente');
});

test('categoria e resumo entram na comparação (mesmo assunto, categoria igual pesa mais)', () => {
  const a = { titulo: 'Tabagismo na consulta', resumo: 'Cessação do tabagismo na atenção primária', categoria: 'Pacientes & Famílias' };
  const b = { titulo: 'Tabagismo na consulta', resumo: 'Cessação do tabagismo na atenção primária', categoria: 'Pacientes & Famílias' };
  const c = { ...b, categoria: 'Outra' };
  assert.ok(similaridade(a, b).score > similaridade(a, c).score);
});

test('`ignorar` exclui o próprio artigo ao validar um artigo já publicado', () => {
  const proprio = ACERVO[3];
  assert.strictEqual(checarOriginalidade(proprio, ACERVO).ok, false);
  assert.strictEqual(checarOriginalidade(proprio, ACERVO, { ignorar: (x) => x === proprio }).ok, true);
});

/* --------------------------- ideação: rejeição automática ---------------- */

const PAUTA_OK = {
  tipo: 'artigo-cientifico',
  titulo: 'Hipocondria: como rastrear na consulta de rotina',
  pauta: 'Guia prático para o médico de família sobre avaliação e manejo da hipocondria na consulta, com base em revisões e diretrizes, e quando encaminhar.',
  publicoAlvo: 'médicos da APS',
  angulo: 'abordagem cognitivo-comportamental na primeira linha',
  sensivel: false,
  referencias: [
    { consultaPubMed: 'hypochondriasis primary care systematic review', tipoDeEstudo: 'revisão sistemática' },
    { consultaPubMed: 'health anxiety cognitive behavioral therapy', tipoDeEstudo: 'ensaio clínico' },
    { consultaPubMed: 'illness anxiety disorder guideline', tipoDeEstudo: 'diretriz' },
  ],
};
const PAUTA_DUPLICADA = { ...PAUTA_OK, titulo: 'Tratamento da insônia crônica: além do remédio', pauta: 'Como conduzir a insônia crônica na consulta, com base em revisões, e o que a família precisa saber sobre o sono.' };

test('ideação: pauta duplicada é rejeitada automaticamente e não pode ser aprovada', () => {
  const [ok, dup] = ideacao.criarPropostas([PAUTA_OK, PAUTA_DUPLICADA], { acervo: ACERVO });
  assert.strictEqual(ok.status, 'proposta');
  assert.strictEqual(ok.originalidade.veredito, 'original');
  assert.strictEqual(dup.status, 'rejeitada');
  assert.strictEqual(dup.rejeicaoAutomatica, 'originalidade');
  assert.ok(dup.problemas.some((p) => /^originalidade:/.test(p)));
  assert.throws(() => ideacao.mudarStatus([dup], dup.id, 'aprovada'), /corrija antes de aprovar/);
});

test('ideação: duas pautas do mesmo lote sobre o mesmo assunto — a segunda é rejeitada', () => {
  const [a, b] = ideacao.criarPropostas([PAUTA_OK, { ...PAUTA_OK, titulo: 'Como rastrear a hipocondria na rotina da consulta' }], { acervo: ACERVO });
  assert.strictEqual(a.status, 'proposta');
  assert.strictEqual(b.status, 'rejeitada');
});

test('ideação: pauta repetindo uma proposta anterior é rejeitada; se a anterior foi rejeitada pelo médico, não conta', () => {
  const [anterior] = ideacao.criarPropostas([PAUTA_OK], { acervo: ACERVO });
  const [repetida] = ideacao.criarPropostas([{ ...PAUTA_OK }], { acervo: ACERVO, existentes: [anterior] });
  assert.strictEqual(repetida.status, 'rejeitada');
  const [liberada] = ideacao.criarPropostas([{ ...PAUTA_OK }], { acervo: ACERVO, existentes: [{ ...anterior, status: 'rejeitada' }] });
  assert.strictEqual(liberada.status, 'proposta');
});

test('ideação: acervo indisponível não aprova às cegas', () => {
  const [p] = ideacao.criarPropostas([PAUTA_OK], { acervo: [], acervoIndisponivel: true });
  assert.ok(p.problemas.some((x) => /originalidade NÃO verificada/.test(x)));
  assert.throws(() => ideacao.mudarStatus([p], p.id, 'aprovada'), /corrija antes de aprovar/);
});

test('ideação: reverificar rejeita propostas antigas que duplicam o acervo', () => {
  const [ok, dup] = ideacao.criarPropostas([PAUTA_OK, PAUTA_DUPLICADA]); // criadas sem acervo
  assert.strictEqual(dup.status, 'proposta');
  const alteradas = ideacao.reverificarOriginalidade([ok, dup], ACERVO);
  assert.deepStrictEqual(alteradas.map((x) => x.id), [dup.id]);
  assert.strictEqual(dup.status, 'rejeitada');
  assert.strictEqual(ok.status, 'proposta');
});

/* ------------------------- validação de artigo (checagens) --------------- */

test('checagens de aprovação: eixo "originalidade" bloqueia artigo redundante', async () => {
  const texto = 'Se você anda dormindo mal, saiba que isso é comum e não é fraqueza. Seu corpo pede cuidado, e tudo bem buscar ajuda. Vamos entender juntos, no seu ritmo, com escuta e respeito.';
  const base = { texto, contexto: 'social', sensivel: false, exigirIdentificacao: false };
  const boa = await executarChecagensAprovacao({ ...base, originalidade: { candidato: { titulo: 'Hipocondria: como rastrear na consulta de rotina' }, acervo: ACERVO } });
  assert.strictEqual(boa.originalidade.ok, true, boa.motivo);
  const ruim = await executarChecagensAprovacao({ ...base, originalidade: { candidato: { titulo: ACERVO[0].titulo }, acervo: ACERVO } });
  assert.strictEqual(ruim.aprovado, false);
  assert.match(ruim.motivo, /originalidade:/);
});
