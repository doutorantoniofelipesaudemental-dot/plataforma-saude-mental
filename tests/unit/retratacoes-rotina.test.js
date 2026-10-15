const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { extrairDois, extrairPmids } = require('../../backend/lib/retratacoes');
const RAIZ = path.join(__dirname, '..', '..');

test('extrai DOIs (inclusive com parênteses, como os da Lancet) e PMIDs', () => {
  const t = 'doi:10.1016/S0140-6736(22)01470-2. e <a href="https://doi.org/10.1001/jamainternmed.2018.3713">x</a> (veja 10.5271/sjweh.3712). PMID: 36104064 https://pubmed.ncbi.nlm.nih.gov/27785668/';
  assert.deepEqual(extrairDois(t).sort(), ['10.1001/jamainternmed.2018.3713', '10.1016/S0140-6736(22)01470-2', '10.5271/sjweh.3712'].sort());
  assert.deepEqual(extrairPmids(t).sort(), ['27785668', '36104064']);
});

test('a auditoria usa a varredura de retratações e a rotina semanal está registrada (npm e CLAUDE.md)', () => {
  assert.match(fs.readFileSync(path.join(RAIZ, 'backend/scripts/auditoria.js'), 'utf8'), /retratacoes/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'), /"rotina-semanal":\s*"node[^"]*scripts\/rotinaSemanal\.js"/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'CLAUDE.md'), 'utf8'), /rodar toda segunda-feira `npm run rotina-semanal`/);
});

test('nenhum texto do repositório cita as 2 referências retratadas (Panagioti 2018 e Kamal 2016)', () => {
  const alvo = ['apps/plataforma-saude-mental/src/content', 'apps/plataforma-saude-mental/content'];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.mdx$/.test(e.name) ? [path.join(d, e.name)] : []));
  for (const a of alvo) for (const f of walk(path.join(RAIZ, a))) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /jamainternmed\.2018\.3713|jpainsymman\.2015\.10\.020/, f);
});
