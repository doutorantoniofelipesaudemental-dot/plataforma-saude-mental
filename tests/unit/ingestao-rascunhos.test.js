// Ingestão de rascunhos (backend/scripts/ingestaoRascunhos.js): Frontmatter, trava de revisão médica,
// upsert por slug, --dry-run e --lote. Sem rede nem MongoDB: o modelo é um dublê.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ing = require('../../backend/scripts/ingestaoRascunhos');
const { CATEGORIAS } = require('../../backend/models/Artigo');

const rascunho = (extra = {}, corpo = null) => `---
pautaId: ${extra.pautaId || 'p-1'}
slug: ${extra.slug || 'guia-pratico-de-teste'}
titulo: "Guia prático de teste"
categoria: "${extra.categoria || 'Residentes & Estudantes'}"
tipo: artigo-cientifico
status: rascunho
checagensAutomaticas: ${extra.checagens || 'aprovado (humanização, ética/CFM, originalidade)'}
revisaoMedica: ${extra.revisao || 'aprovada'}
---

# Guia prático de teste

*Resumo acolhedor do guia.*

> **RASCUNHO — não publicar sem revisão do Dr. Antônio Felipe.** Passar nas checagens não valida.
> - trecho a conferir

${corpo ?? 'Abertura **clara** do texto.\n\n## Guia Prático\n\n- passo um\n- passo dois\n\n## Referências (a confirmar)\n\n1. `consulta` — Revisão — PMID 123'}
`;

const ler = (txt, arquivo = 'a.md') => ({ arquivo, ...ing.lerFrontmatter(txt) });

function modeloFalso() {
  const chamadas = [];
  const existentes = new Set(['ja-existe']);
  return {
    chamadas,
    async updateOne(filtro, update, opts) {
      chamadas.push({ filtro, update, opts });
      return { upsertedCount: existentes.has(filtro.slug) ? 0 : 1 };
    },
  };
}

test('lerFrontmatter lê chaves, valores entre aspas e o corpo', () => {
  const r = ing.lerFrontmatter(rascunho());
  assert.equal(r.valido, true);
  assert.equal(r.dados.slug, 'guia-pratico-de-teste');
  assert.equal(r.dados.titulo, 'Guia prático de teste');
  assert.equal(r.dados.categoria, 'Residentes & Estudantes');
  assert.match(r.corpo, /# Guia prático de teste/);
  assert.equal(ing.lerFrontmatter('sem cabeçalho').valido, false);
});

test('extrairCorpo tira o aviso de rascunho e o H1 e separa o resumo', () => {
  const { resumo, markdown } = ing.extrairCorpo(ing.lerFrontmatter(rascunho()).corpo);
  assert.equal(resumo, 'Resumo acolhedor do guia.');
  assert.doesNotMatch(markdown, /RASCUNHO|trecho a conferir|^# /m);
  assert.match(markdown, /^Abertura/);
});

test('markdownParaHtml: títulos descem um nível, listas, ênfase e escape de HTML', () => {
  const html = ing.markdownParaHtml('## Seção\n\nTexto **forte** e *leve* <b>x</b>.\n\n- a\n- b\n\n1. um\n2. dois');
  assert.match(html, /<h3>Seção<\/h3>/);
  assert.match(html, /<strong>forte<\/strong>/);
  assert.match(html, /<em>leve<\/em>/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /<ul>\n<li>a<\/li>\n<li>b<\/li>\n<\/ul>/);
  assert.match(html, /<ol>\n<li>um<\/li>\n<li>dois<\/li>\n<\/ol>/);
});

test('validarRascunho exige revisão médica aprovada, checagens, categoria e ausência de marcadores', () => {
  const ok = ler(rascunho());
  assert.deepEqual(ing.validarRascunho(ok, { categorias: CATEGORIAS }), []);
  assert.ok(ing.validarRascunho(ler(rascunho({ revisao: 'pendente' }))).some((m) => /revisão médica pendente/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ checagens: 'reprovado — ética' }))).some((m) => /checagens/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ categoria: 'Inexistente' })), { categorias: CATEGORIAS }).some((m) => /categoria/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({}, 'Dose [DOSE A CONFIRMAR].')), {}).some((m) => /A CONFIRMAR/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ slug: 'Slug Ruim' }))).some((m) => /slug/.test(m)));
});

test('ingerir faz upsert por slug, só do que foi aprovado, e nasce não publicado', async () => {
  const modelo = modeloFalso();
  const lista = [
    ler(rascunho({ slug: 'novo-artigo' }), 'novo.md'),
    ler(rascunho({ slug: 'ja-existe' }), 'existe.md'),
    ler(rascunho({ slug: 'pendente', revisao: 'pendente' }), 'pendente.md'),
  ];
  const r = await ing.ingerir(lista, { modelo, categorias: CATEGORIAS });
  assert.deepEqual(r.gravados.map((g) => [g.slug, g.acao]), [['novo-artigo', 'inserido'], ['ja-existe', 'atualizado']]);
  assert.equal(r.ignorados.length, 1);
  assert.equal(r.ignorados[0].arquivo, 'pendente.md');
  assert.equal(modelo.chamadas.length, 2);
  const c = modelo.chamadas[0];
  assert.deepEqual(c.filtro, { slug: 'novo-artigo' });
  assert.equal(c.opts.upsert, true);
  assert.equal(c.update.$setOnInsert.publicado, false);
  assert.equal(c.update.$setOnInsert.status, 'rascunho');
  assert.equal(c.update.$set.categoria, 'Residentes & Estudantes');
  assert.equal(c.update.$set.resumo, 'Resumo acolhedor do guia.');
  assert.match(c.update.$set.conteudo, /<h3>Guia Prático<\/h3>/);
  assert.equal(c.update.$set.slug, undefined, 'slug só entra em $setOnInsert');
});

test('--dry-run não chama o modelo', async () => {
  const modelo = modeloFalso();
  const r = await ing.ingerir([ler(rascunho())], { modelo, dryRun: true });
  assert.equal(modelo.chamadas.length, 0);
  assert.equal(r.gravados[0].acao, 'simulado');
});

test('slug duplicado entre rascunhos é ignorado; falha do banco vai para falhas', async () => {
  const modelo = modeloFalso();
  const r = await ing.ingerir([ler(rascunho(), 'a.md'), ler(rascunho(), 'b.md')], { modelo });
  assert.equal(r.gravados.length, 1);
  assert.match(r.ignorados[0].motivos.join(), /duplicado/);
  const ruim = { async updateOne() { throw new Error('conexão recusada'); } };
  const f = await ing.ingerir([ler(rascunho())], { modelo: ruim });
  assert.equal(f.falhas[0].erro, 'conexão recusada');
});

test('filtrarPorLote usa o lote registrado em pautas.json; lerRascunhos lê a pasta', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'rasc-'));
  fs.writeFileSync(path.join(pasta, 'a.md'), rascunho({ pautaId: 'p-4', slug: 'a' }));
  fs.writeFileSync(path.join(pasta, 'b.md'), rascunho({ pautaId: 'p-5', slug: 'b' }));
  fs.writeFileSync(path.join(pasta, 'nota.txt'), 'ignorar');
  const todos = ing.lerRascunhos(pasta);
  assert.equal(todos.length, 2);
  const registros = [{ id: 'p-4', lote: 4 }, { id: 'p-5', lote: 5 }];
  assert.deepEqual(ing.filtrarPorLote(todos, '4', registros).map((r) => r.dados.slug), ['a']);
  assert.deepEqual(ing.argumentos(['--lote=4', '--dry-run']), { lote: '4', 'dry-run': true });
});

test('aprovarRevisaoTexto troca revisaoMedica para aprovada e registra revisadoEm', () => {
  const agora = new Date('2026-10-02T12:00:00.000Z');
  const { texto, motivos } = ing.aprovarRevisaoTexto(rascunho({ revisao: 'pendente' }), agora);
  assert.deepEqual(motivos, []);
  assert.match(texto, /^revisaoMedica: aprovada\nrevisadoEm: 2026-10-02T12:00:00.000Z$/m);
  assert.equal(ing.lerFrontmatter(texto).dados.revisaoMedica, 'aprovada');
  assert.deepEqual(ing.validarRascunho(ler(texto), { categorias: CATEGORIAS }), []);
});

test('aprovarRevisaoTexto recusa marcadores A CONFIRMAR, checagens reprovadas e revisão já aprovada', () => {
  const comMarcador = rascunho({}, 'Dose [DOSE A CONFIRMAR].\n\n1. `q` — Revisão — [PMID A CONFIRMAR]');
  const a = ing.aprovarRevisaoTexto(comMarcador);
  assert.match(a.motivos.join(), /A CONFIRMAR/);
  assert.equal(a.texto, comMarcador, 'texto intacto');
  assert.match(ing.aprovarRevisaoTexto(rascunho({ checagens: 'reprovado — ética' })).motivos.join(), /checagens/);
  assert.match(ing.aprovarRevisaoTexto(rascunho({ revisao: 'aprovada' })).motivos.join(), /já aprovada/);
  assert.match(ing.aprovarRevisaoTexto('sem cabeçalho').motivos.join(), /Frontmatter/);
});

test('aprovarRevisoes grava só os elegíveis e respeita dryRun', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'aprov-'));
  fs.writeFileSync(path.join(pasta, 'ok.md'), rascunho({ pautaId: 'p-ok', slug: 'ok', revisao: 'pendente' }));
  fs.writeFileSync(path.join(pasta, 'pend.md'), rascunho({ pautaId: 'p-pend', slug: 'pend', revisao: 'pendente' }, 'Dose [DOSE A CONFIRMAR].'));
  const lista = ing.lerRascunhos(pasta);

  const seco = ing.aprovarRevisoes(lista, { pasta, dryRun: true });
  assert.equal(seco.aprovados.length, 1);
  assert.match(fs.readFileSync(path.join(pasta, 'ok.md'), 'utf8'), /revisaoMedica: pendente/, 'dry-run não grava');

  const real = ing.aprovarRevisoes(lista, { pasta });
  assert.deepEqual(real.aprovados.map((a) => a.arquivo), ['ok.md']);
  assert.equal(real.ignorados.length, 1);
  assert.equal(real.ignorados[0].arquivo, 'pend.md');
  assert.match(real.ignorados[0].motivos.join(), /A CONFIRMAR/);
  assert.match(fs.readFileSync(path.join(pasta, 'ok.md'), 'utf8'), /revisaoMedica: aprovada/);
  assert.match(fs.readFileSync(path.join(pasta, 'pend.md'), 'utf8'), /revisaoMedica: pendente/);
});
