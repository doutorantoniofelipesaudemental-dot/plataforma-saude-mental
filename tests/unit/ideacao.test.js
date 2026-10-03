// Ideação editorial (backend/lib/ideacao.js): propostas com aprovação prévia do médico,
// demanda direta, estrutura científica/PubMed e peças omnichannel opcionais do bot-gemini.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ideacao = require('../../backend/lib/ideacao');

const CIENTIFICO = {
  tipo: 'artigo-cientifico',
  titulo: 'Insônia na Atenção Primária: o que a evidência recomenda como primeira linha',
  pauta: 'Guia prático para o médico de família sobre avaliação e manejo da insônia crônica, com base em revisões sistemáticas e diretrizes, e quando encaminhar.',
  publicoAlvo: 'médicos e enfermeiros da APS',
  angulo: 'terapia cognitivo-comportamental como primeira linha, antes do fármaco',
  sensivel: false,
  referencias: [
    { consultaPubMed: '"Sleep Initiation and Maintenance Disorders/therapy"[MeSH] AND systematic review', tipoDeEstudo: 'revisão sistemática' },
    { consultaPubMed: 'cognitive behavioral therapy insomnia primary care', tipoDeEstudo: 'ensaio clínico randomizado' },
    { consultaPubMed: 'insomnia clinical practice guideline', tipoDeEstudo: 'diretriz', pmid: '[PMID A CONFIRMAR]' },
  ],
};
const CRONICA = {
  tipo: 'cronica',
  titulo: 'A luz da cozinha às três da manhã',
  pauta: 'Crônica em narrativa composta sobre uma noite sem sono e o pequeno gesto de pedir ajuda no dia seguinte, com o aviso de que a personagem é fictícia.',
  publicoAlvo: 'público geral',
  angulo: 'o sono visto pela intimidade da casa',
  sensivel: false,
};

test('ideação: propostas nascem "proposta" e só viram "aprovada" por decisão explícita', () => {
  const [a, b] = ideacao.criarPropostas([CIENTIFICO, CRONICA]);
  assert.deepStrictEqual([a.status, b.status], ['proposta', 'proposta']);
  assert.deepStrictEqual(a.problemas, []);
  assert.deepStrictEqual(a.secoes, ['Guia Prático', 'Fisiopatologia', 'Manejo Clínico', 'Referências']);
  assert.strictEqual(b.secoes, undefined);
  const registros = [a, b];
  ideacao.mudarStatus(registros, a.id, 'aprovada');
  ideacao.mudarStatus(registros, b.id, 'rejeitada');
  assert.strictEqual(a.status, 'aprovada');
  assert.strictEqual(b.status, 'rejeitada');
  assert.throws(() => ideacao.mudarStatus(registros, 'inexistente', 'aprovada'), /não encontrada/);
});

test('ideação: artigo científico exige 3+ referências PubMed e PMID válido; nunca PMID inventado em formato torto', () => {
  const [p] = ideacao.criarPropostas([{ ...CIENTIFICO, referencias: CIENTIFICO.referencias.slice(0, 2) }]);
  assert.ok(p.problemas.some((x) => /3 a 6 referências/.test(x)));
  const [q] = ideacao.criarPropostas([{ ...CIENTIFICO, referencias: [...CIENTIFICO.referencias, { consultaPubMed: 'x', tipoDeEstudo: 'y', pmid: 'ABC123' }] }]);
  assert.ok(q.problemas.some((x) => /PMID/.test(x)));
});

test('ideação: pauta com promessa de cura ou sensacionalismo não pode ser aprovada', () => {
  const [p] = ideacao.criarPropostas([{ ...CRONICA, pauta: 'Crônica milagrosa: cura garantida da ansiedade em uma semana, você não vai acreditar nesse método.' }]);
  assert.ok(p.problemas.length > 0);
  assert.throws(() => ideacao.mudarStatus([p], p.id, 'aprovada'), /corrija antes de aprovar/);
});

test('ideação: título já publicado é sinalizado', () => {
  const [p] = ideacao.criarPropostas([CRONICA], { publicados: ['A luz da cozinha às três da manhã'] });
  assert.ok(p.problemas.includes('título já publicado'));
});

test('ideação: demanda direta do médico preserva o pedido e aguarda aprovação', () => {
  const d = ideacao.criarDemanda('Crônica sobre o cuidador que esquece de si', { tipo: 'cronica' });
  assert.strictEqual(d.origem, 'demanda-medico');
  assert.strictEqual(d.status, 'proposta');
  assert.match(d.pauta, /Crônica sobre o cuidador que esquece de si/);
});

test('ideação: grava e relê pautas.json e PAUTAS.md', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pautas-'));
  const registros = ideacao.criarPropostas([CIENTIFICO, CRONICA]);
  ideacao.gravarRegistros(registros, pasta);
  assert.strictEqual(ideacao.lerRegistros(pasta).length, 2);
  const md = fs.readFileSync(path.join(pasta, 'PAUTAS.md'), 'utf8');
  assert.match(md, /PubMed/);
  assert.match(md, /Guia Prático · Fisiopatologia · Manejo Clínico · Referências/);
  assert.strictEqual(ideacao.lerRegistros(path.join(pasta, 'nao-existe')).length, 0);
});

test('bot-gemini: esquema traz podcast, newsletter e miniapp como peças OPCIONAIS; instruções pedem tom acolhedor e -22 dB', () => {
  const { SCHEMA, SISTEMA, pecasDoRascunho } = require('../../scripts/bot-gemini');
  for (const k of ['podcast', 'newsletter', 'miniapp']) {
    assert.ok(SCHEMA.properties[k], `${k} no esquema`);
    assert.ok(!SCHEMA.required.includes(k), `${k} opcional (retrocompatível)`);
  }
  assert.match(SISTEMA, /acolhedor, empático e terapêutico/);
  assert.match(SISTEMA, /-22 dB/);
  assert.match(SISTEMA, /3 linhas/);
  const base = { ganchos: [], carrossel: [], legenda: '', reels: [], stories: [], linkedin: [], youtube: { titulos: [], shorts: [], longo: { titulo: 't', descricao: 'd', roteiro: [] } } };
  assert.doesNotThrow(() => pecasDoRascunho(base));
  const com = pecasDoRascunho({ ...base, podcast: { titulo: 'Sono', abertura: 'Oi, você.', blocos: [{ titulo: 'B', fala: 'Fala.' }], encerramento: 'Cuide-se.' }, newsletter: { assunto: 'A', preCabecalho: 'P', blocos: [{ titulo: 'T', texto: 'X' }], chamada: 'Leia.' }, miniapp: { titulo: 'M', passos: [{ pergunta: 'Como dormiu?', opcoes: ['bem'], devolutiva: 'Tudo bem.' }] } });
  assert.ok(com.some((p) => /^Podcast/.test(p.id)) && com.some((p) => /^Newsletter/.test(p.id)) && com.some((p) => /^Miniapp/.test(p.id)));
});
