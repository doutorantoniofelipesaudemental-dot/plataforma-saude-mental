const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../../backend/lib/existeConteudo');

const TMP = path.join(__dirname, '../../.tmp');
const frase = 'a ansiedade no trabalho aparece quando a pessoa perde o controle da rotina e da comunicacao com a equipe';
const CORPO = `${frase} e cresce com a sobrecarga constante de informacao sobre o futuro profissional e as comparacoes sociais`;

test('banco: slug existente é bloqueado', () => {
  const r = E.avaliar({ slug: 'x', titulo: 'Outro', bancoDocs: [{ slug: 'x', titulo: 'Outro' }] });
  assert.equal(r.existe, true);
  assert.match(r.motivos.join(' '), /slug já existe no banco/);
});

test('banco: título igual, sem acento e sem caixa, é bloqueado', () => {
  const r = E.avaliar({ slug: 'novo', titulo: 'Ansiedade na Era Digital', bancoDocs: [{ slug: 'outro', titulo: 'ANSIEDADE NA ERA DIGITAL' }] });
  assert.equal(r.existe, true);
  assert.match(r.motivos.join(' '), /título já existe no banco/);
});

test('MDX: slug e título de arquivo do site são bloqueados', () => {
  const fontes = [{ origem: 'mdx', slug: 'tdah-x', titulo: 'TDAH na infância', corpo: '' }];
  assert.equal(E.avaliar({ slug: 'tdah-x', titulo: 'Outro', fontes }).existe, true);
  assert.match(E.avaliar({ slug: 'novo', titulo: 'tdah na infancia', fontes }).motivos.join(' '), /título já existe em MDX/);
});

test('rota compilada: slug de página já gerada é bloqueado', () => {
  const fontes = [{ origem: 'rota', slug: 'sinal-x', titulo: '', corpo: '' }];
  assert.match(E.avaliar({ slug: 'sinal-x', titulo: 'Outro', fontes }).motivos.join(' '), /rota compilada/);
});

test('similaridade: texto quase igual (acima de 60%) é bloqueado; texto próprio passa', () => {
  const fontes = [{ origem: 'mdx', slug: 'base', titulo: 'Base', corpo: CORPO }];
  const quase = E.avaliar({ slug: 'novo', titulo: 'Novo', corpo: CORPO + ' com um detalhe a mais', fontes });
  assert.equal(quase.existe, true);
  assert.ok(quase.similaridade > 0.6);
  const proprio = E.avaliar({ slug: 'novo', titulo: 'Novo', corpo: 'Cuidar da saude bucal de criancas exige rotina diaria de escovacao e consultas regulares com o dentista de confianca', fontes });
  assert.equal(proprio.existe, false);
  assert.ok(proprio.similaridade < 0.6);
});

test('similaridade: compara também com textos do banco', () => {
  const r = E.avaliar({ slug: 'novo', titulo: 'Novo', corpo: CORPO, bancoDocs: [{ slug: 'velho', titulo: 'Velho', corpo: CORPO }] });
  assert.equal(r.existe, true);
  assert.equal(r.comQuem, 'velho');
});

test('leitura do disco: lê MDX e rotas compiladas; pasta ausente não quebra', () => {
  fs.mkdirSync(path.join(TMP, 'ex-mdx'), { recursive: true });
  fs.mkdirSync(path.join(TMP, 'ex-rota'), { recursive: true });
  fs.writeFileSync(path.join(TMP, 'ex-mdx', 'slug-a.mdx'), "export const metadata = {\n titulo: 'Titulo A',\n};\n<p>texto</p>", 'utf8');
  fs.writeFileSync(path.join(TMP, 'ex-rota', 'slug-b.html'), '<html></html>', 'utf8');
  const itens = E.lerFontesDisco({ pastasMdx: [path.join(TMP, 'ex-mdx'), path.join(TMP, 'nao-existe')], pastasCompiladas: [path.join(TMP, 'ex-rota')] });
  assert.deepEqual(itens.map((i) => `${i.origem}:${i.slug}`).sort(), ['mdx:slug-a', 'rota:slug-b']);
  assert.equal(itens.find((i) => i.slug === 'slug-a').titulo, 'Titulo A');
});

test('ponto de entrada: sem banco (col nulo) ainda confere as fontes do disco', async () => {
  const fontes = [{ origem: 'mdx', slug: 'ja-existe', titulo: 'Ja existe', corpo: '' }];
  const r = await E.verificarConteudo({ slug: 'ja-existe', titulo: 'x', corpo: '', col: null, fontesDisco: fontes });
  assert.equal(r.existe, true);
});
