// Rascunho de pauta aprovada (backend/lib/rascunhoArtigo.js): as 3 checagens automáticas,
// disclaimer de narrativa composta, vínculo com slug/ID e status "redigida". Sem rede: o gerador é injetado.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const rascunhos = require('../../backend/lib/rascunhoArtigo');
const ideacao = require('../../backend/lib/ideacao');
const { IDENTIFICACAO_COMPLETA, AVISO_CFM } = require('../../backend/lib/conformidadeCfm');

const FRASES = [
  'Você não precisa enfrentar isso sozinho, e pedir ajuda é um gesto de cuidado com a sua saúde.',
  'Vamos entender juntos o que costuma acontecer, no seu ritmo e com respeito à sua história.',
  'A escuta atenta faz diferença, e o apoio da equipe de saúde e da família ajuda no caminho.',
  'Observe com calma os sinais do corpo e do humor, sem se cobrar respostas imediatas.',
  'Conversar com o médico da unidade de saúde permite avaliar com cuidado o que sua situação pede.',
  'Pequenos passos, repetidos aos poucos, costumam ser mais sustentáveis do que grandes mudanças.',
];
const paragrafo = (n, off = 0) => Array.from({ length: n }, (_, i) => FRASES[(i + off) % FRASES.length]).join(' ');

const ARTIGO_BOM = {
  resumo: 'Um guia acolhedor para entender os sinais, o que ajuda e quando procurar avaliação.',
  introducao: paragrafo(6),
  guiaPratico: `${paragrafo(10, 1)}\n\n- Observe o sono e o ritmo do dia.\n- Converse com quem você confia.`,
  fisiopatologia: paragrafo(14, 2),
  manejoClinico: `${paragrafo(14, 3)}\n\nOs medicamentos, quando indicados, são escolhidos por classe e princípio, com dose [DOSE A CONFIRMAR]. Em caso de risco imediato ou agitação intensa, procure a emergência ou ligue para o SAMU 192.`,
  pontosChave: ['Você merece cuidado.', 'Peça ajuda cedo.', 'A avaliação é sempre individual.'],
};
const CRONICA_BOA = {
  resumo: 'Uma crônica sobre acolhimento, feita de gestos pequenos numa manhã de UBS.',
  texto: `Esta crônica é uma narrativa composta: personagens e situações são fictícios, inspirados em vivências comuns.\n\n${paragrafo(12)}\n\n${paragrafo(12, 2)}\n\n${paragrafo(12, 4)}`,
};

const PAUTA_ARTIGO = {
  id: '2026-09-30-99-artigo-teste', tipo: 'artigo-cientifico', titulo: 'Hipocondria: como rastrear na consulta de rotina', categoria: 'Residentes & Estudantes',
  pauta: 'Guia para o médico de família sobre avaliação e manejo da hipocondria na consulta.', publicoAlvo: 'médicos da APS', angulo: 'primeira linha', sensivel: false, status: 'aprovada',
  referencias: [{ consultaPubMed: 'hypochondriasis primary care', tipoDeEstudo: 'revisão sistemática' }],
};
const PAUTA_CRONICA = { id: '2026-09-30-98-cronica-teste', tipo: 'cronica', titulo: 'O idioma do afeto: acolhendo quem chegou de longe', categoria: 'Relatos da Prática', pauta: 'Crônica em narrativa composta sobre acolhimento na UBS.', publicoAlvo: 'público geral', angulo: 'barreira do idioma', sensivel: false, status: 'aprovada' };

const ACERVO_OUTRO = [{ titulo: 'Tabagismo: como abordar a cessação na consulta', resumo: 'Cessação do tabagismo na atenção primária', categoria: 'Pacientes & Famílias' }];

test('artigo científico: passa nas 3 checagens, traz as 3 seções, as 5 linhas do CFM e o vínculo ao ID/slug', async () => {
  const r = await rascunhos.gerarRascunho(PAUTA_ARTIGO, { gerar: async () => ARTIGO_BOM, acervo: ACERVO_OUTRO });
  assert.strictEqual(r.ok, true, r.checagens.motivo);
  assert.deepStrictEqual([r.checagens.humanizacao, r.checagens.etica, r.checagens.originalidade], [true, true, true]);
  for (const s of ['## Guia Prático', '## Fisiopatologia', '## Manejo Clínico', '## Referências (a confirmar)']) assert.ok(r.md.includes(s), s);
  assert.ok(r.md.includes(IDENTIFICACAO_COMPLETA) && r.md.includes(AVISO_CFM));
  assert.match(r.md, /pautaId: 2026-09-30-99-artigo-teste/);
  assert.match(r.md, new RegExp(`slug: ${r.slug}`));
  assert.match(r.md, /revisaoMedica: pendente/);
  assert.match(r.md, /\[PMID A CONFIRMAR\]/);
  assert.match(r.md, /Trechos de conduta farmacológica e de emergência a conferir/);
});

test('crônica: exige e inclui o aviso legal de narrativa composta', async () => {
  const r = await rascunhos.gerarRascunho(PAUTA_CRONICA, { gerar: async () => CRONICA_BOA, acervo: ACERVO_OUTRO });
  assert.strictEqual(r.ok, true, r.checagens.motivo);
  assert.ok(r.md.includes(rascunhos.AVISO_NARRATIVA_COMPOSTA));
  const sem = await rascunhos.gerarRascunho(PAUTA_CRONICA, { gerar: async () => ({ resumo: 'x', texto: paragrafo(40) }), acervo: [], tentativas: 1 });
  assert.strictEqual(sem.ok, false);
  assert.match(sem.checagens.motivo, /narrativa composta/);
});

test('reprovação e nova tentativa: as falhas voltam ao modelo e a 2ª tentativa passa', async () => {
  const prompts = [];
  let n = 0;
  const gerar = async ({ usuario }) => {
    prompts.push(usuario);
    n++;
    return n === 1 ? { ...ARTIGO_BOM, guiaPratico: 'Prezado usuário, cura garantida em sete dias. É só força de vontade.' } : ARTIGO_BOM;
  };
  const r = await rascunhos.gerarRascunho(PAUTA_ARTIGO, { gerar, acervo: ACERVO_OUTRO });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.tentativas, 2);
  assert.match(prompts[1], /REPROVADA/);
  assert.match(prompts[1], /promessa de cura|robótico|invalidante/);
});

test('originalidade: rascunho de tema já publicado reprova nas 3 tentativas', async () => {
  const acervo = [{ titulo: PAUTA_ARTIGO.titulo, resumo: ARTIGO_BOM.resumo, categoria: 'Residentes & Estudantes' }];
  const r = await rascunhos.gerarRascunho(PAUTA_ARTIGO, { gerar: async () => ARTIGO_BOM, acervo });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.tentativas, 3);
  assert.strictEqual(r.checagens.originalidade, false);
  assert.match(r.checagens.motivo, /originalidade/);
});

test('ética/CFM: promessa de cura e apresentação como psiquiatra reprovam o rascunho', async () => {
  const ruim = { ...ARTIGO_BOM, introducao: 'O psiquiatra Dr. Antônio Felipe garante cura definitiva.' };
  const r = await rascunhos.gerarRascunho(PAUTA_ARTIGO, { gerar: async () => ruim, acervo: [], tentativas: 1 });
  assert.strictEqual(r.ok, false);
  assert.match(r.checagens.motivo, /ética\/CFM/);
});

test('slug: único e vinculado; colisão ganha sufixo', async () => {
  const usados = new Set([ideacao.slugDe(PAUTA_ARTIGO.titulo)]);
  const r = await rascunhos.gerarRascunho(PAUTA_ARTIGO, { gerar: async () => ARTIGO_BOM, acervo: [], slugsUsados: usados });
  assert.match(r.slug, /-2$/);
});

test('status "redigida": só pauta aprovada com checagens aprovadas; PAUTAS.md mostra o vínculo', async () => {
  const [p] = ideacao.criarPropostas([{ ...PAUTA_ARTIGO, referencias: [...PAUTA_ARTIGO.referencias, { consultaPubMed: 'a', tipoDeEstudo: 'b' }, { consultaPubMed: 'c', tipoDeEstudo: 'd' }], pauta: `${PAUTA_ARTIGO.pauta} Com base em revisões e diretrizes, e quando encaminhar.`, tipo: 'artigo-cientifico' }], { categoria: 'Residentes & Estudantes', lote: 1 });
  assert.throws(() => ideacao.marcarRedigida([p], p.id, { arquivo: 'x.md', slug: 'x', checagens: { aprovado: true } }), /só pauta aprovada/);
  ideacao.mudarStatus([p], p.id, 'aprovada');
  assert.throws(() => ideacao.marcarRedigida([p], p.id, { arquivo: 'x.md', slug: 'x', checagens: { aprovado: false } }), /não passou/);

  const r = await rascunhos.gerarRascunho({ ...PAUTA_ARTIGO, id: p.id }, { gerar: async () => ARTIGO_BOM, acervo: [] });
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'rasc-'));
  const arquivo = rascunhos.gravarRascunho(r.slug, r.md, pasta);
  assert.ok(fs.existsSync(arquivo));
  ideacao.marcarRedigida([p], p.id, { arquivo: `rascunhos/${r.slug}.md`, slug: r.slug, checagens: r.checagens });
  assert.strictEqual(p.status, 'redigida');
  assert.strictEqual(p.rascunho.revisaoMedica, 'pendente');
  const md = ideacao.renderizarMd([p]);
  assert.match(md, /\| Categoria \| Propostas \| Aprovadas \| Redigidas \|/);
  assert.ok(md.includes(`slug: \`${r.slug}\``) && md.includes(`pauta: \`${p.id}\``));
  assert.match(md, /revisão médica: pendente/);
});
