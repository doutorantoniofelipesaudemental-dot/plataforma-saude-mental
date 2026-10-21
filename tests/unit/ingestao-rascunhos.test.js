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

// Registro com hash (relatorios/revisoes/registro.json): aprovação só vale com o hash do corpo atual.
const R = require('../../backend/lib/revisaoMedica');
const aprovadoNoRegistro = (slugs, corpo = null) => Object.fromEntries(slugs.map((slug) => [slug, R.aprovar({
  slug, hash: R.hashConteudo(ler(rascunho({ slug }, corpo)).corpo), revisor: 'teste', data: new Date(),
})]));

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

test('validarRascunho exige revisão médica aprovada no registro com hash, checagens, categoria e ausência de marcadores', () => {
  const ok = ler(rascunho());
  const reg = aprovadoNoRegistro(['guia-pratico-de-teste']);
  assert.deepEqual(ing.validarRascunho(ok, { categorias: CATEGORIAS, registro: reg }), []);
  // Frontmatter "aprovada" sem registro não vale (qualquer um escreve esse campo).
  assert.ok(ing.validarRascunho(ok, { categorias: CATEGORIAS }).some((m) => /sem aprovação registrada/.test(m)));
  // Texto mudou depois da aprovação: a aprovação cai.
  const mudou = ler(rascunho({}, 'Texto novo, outro conteúdo.'));
  assert.ok(ing.validarRascunho(mudou, { categorias: CATEGORIAS, registro: reg }).some((m) => /sem aprovação registrada/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ revisao: 'pendente' })), { categorias: CATEGORIAS, registro: reg }).length === 0, 'o campo do Frontmatter é ignorado');
  assert.ok(ing.validarRascunho(ler(rascunho({ checagens: 'reprovado — ética' })), { registro: reg }).some((m) => /checagens/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ categoria: 'Inexistente' })), { categorias: CATEGORIAS, registro: reg }).some((m) => /categoria/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({}, 'Dose [DOSE A CONFIRMAR].')), { registro: aprovadoNoRegistro(['guia-pratico-de-teste'], 'Dose [DOSE A CONFIRMAR].') }).some((m) => /A CONFIRMAR/.test(m)));
  assert.ok(ing.validarRascunho(ler(rascunho({ slug: 'Slug Ruim' })), { registro: reg }).some((m) => /slug/.test(m)));
});

test('ingerir faz upsert por slug, só do que foi aprovado, e nasce não publicado', async () => {
  const modelo = modeloFalso();
  const lista = [
    ler(rascunho({ slug: 'novo-artigo' }), 'novo.md'),
    ler(rascunho({ slug: 'ja-existe' }), 'existe.md'),
    ler(rascunho({ slug: 'pendente', revisao: 'pendente' }), 'pendente.md'),
  ];
  const registro = aprovadoNoRegistro(['novo-artigo', 'ja-existe']);
  const r = await ing.ingerir(lista, { modelo, categorias: CATEGORIAS, registro });
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
  const r = await ing.ingerir([ler(rascunho())], { modelo, dryRun: true, registro: aprovadoNoRegistro(['guia-pratico-de-teste']) });
  assert.equal(modelo.chamadas.length, 0);
  assert.equal(r.gravados[0].acao, 'simulado');
});

test('slug duplicado entre rascunhos é ignorado; falha do banco vai para falhas', async () => {
  const modelo = modeloFalso();
  const registro = aprovadoNoRegistro(['guia-pratico-de-teste']);
  const r = await ing.ingerir([ler(rascunho(), 'a.md'), ler(rascunho(), 'b.md')], { modelo, registro });
  assert.equal(r.gravados.length, 1);
  assert.match(r.ignorados[0].motivos.join(), /duplicado/);
  const ruim = { async updateOne() { throw new Error('conexão recusada'); } };
  const f = await ing.ingerir([ler(rascunho())], { modelo: ruim, registro });
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

test('o fluxo antigo não grava revisão aprovada: a aprovação médica só pelo registro com hash (21/10/2026)', () => {
  assert.equal(ing.aprovarRevisaoTexto, undefined);
  assert.equal(ing.aprovarRevisoes, undefined);
});

test('texto novo que já existe no banco (mesmo título) é recusado antes de gravar (fonte única, 20/10/2026)', async () => {
  const modelo = modeloFalso();
  modelo.collection = {
    findOne: async () => null,
    find: () => ({ toArray: async () => [{ slug: 'outro-slug', titulo: 'Guia prático de teste' }] }),
  };
  const r = await ing.ingerir([ler(rascunho({ slug: 'slug-novo' }))], { modelo, registro: aprovadoNoRegistro(['slug-novo']) });
  assert.equal(r.gravados.length, 0);
  assert.match(r.ignorados[0].motivos.join(), /título já existe no banco/);
  assert.equal(modelo.chamadas.length, 0, 'nada gravado');
});

test('texto que já existe no banco com o mesmo slug é atualizado normalmente (fluxo de atualização preservado)', async () => {
  const modelo = modeloFalso();
  modelo.collection = {
    findOne: async () => ({ _id: 'x' }),
    find: () => ({ toArray: async () => [{ slug: 'mesmo', titulo: 'Guia prático de teste' }] }),
  };
  const r = await ing.ingerir([ler(rascunho({ slug: 'mesmo' }))], { modelo, registro: aprovadoNoRegistro(['mesmo']) });
  assert.equal(r.gravados.length, 1);
  assert.equal(modelo.chamadas.length, 1);
});
