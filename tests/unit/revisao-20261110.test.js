// Ordem de 09/11/2026, 23:15: decisões de tema, introduções dos 7 eixos, aplicação em dry-run e pacote de revisão.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
const { TEMAS } = require('../../backend/lib/temas');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const decisoes = JSON.parse(ler('relatorios/revisao-20261110/decisoes-temas.json'));
const NOMES = new Set(TEMAS.flatMap((t) => [t.curto, t.nome]));

const introsDoMd = (md) =>
  md.split('\n').map((l) => l.match(/^\|\s*(\d)\s*—[^|]*\|\s*([^|]+?)\s*\|/)).filter(Boolean).reduce((m, x) => ((m[Number(x[1])] = x[2]), m), {});

test('decisões de tema: 503 artigos, slugs únicos, temas válidos, confiança alta ou média', () => {
  assert.equal(decisoes.length, 503);
  assert.equal(new Set(decisoes.map((d) => d.slug)).size, 503);
  for (const d of decisoes) {
    assert.ok(NOMES.has(d.para), `tema inválido: ${d.para} (${d.slug})`);
    assert.ok(['alta', 'média'].includes(d.confianca), d.slug);
  }
});

test('decisões: nenhuma aprovação registrada (apply só aplica "aprovado")', () => {
  assert.ok(decisoes.every((d) => !d.status || d.status === 'proposto'));
});

test('decisões: Relatos da Prática ficam fora (sem tema)', () => {
  assert.equal(decisoes.filter((d) => d.titulo && /^Relato/.test(d.titulo)).length, 0);
});

test('introduções: 7 eixos, 2 a 3 frases, eixo 5 é o texto-base do Dr. Antônio', () => {
  const novas = introsDoMd(ler('relatorios/plano-diretor/INTRODUCOES-EIXOS.md'));
  assert.equal(Object.keys(novas).length, 7);
  for (const n of [1, 2, 3, 4, 6, 7]) {
    const frases = novas[n].split(/(?<=[.!?])\s+/).filter(Boolean).length;
    assert.ok(frases >= 2 && frases <= 3, `eixo ${n}: ${frases} frases`);
  }
  // eixo 5 mantido como estava na main (texto-base do Dr.)
  const antigas = introsDoMd(require('node:child_process').execFileSync('git', ['show', 'origin/main:relatorios/plano-diretor/INTRODUCOES-EIXOS.md'], { cwd: RAIZ, encoding: 'utf8' }));
  assert.equal(novas[5], antigas[5]);
});

test('introduções: passam no checador ético do CFM e não prometem resultado', () => {
  const novas = introsDoMd(ler('relatorios/plano-diretor/INTRODUCOES-EIXOS.md'));
  for (const n of Object.keys(novas)) {
    assert.equal(checarEticaCfm(novas[n], { contexto: 'portal', exigirIdentificacao: false }).ok, true, `eixo ${n}`);
    assert.doesNotMatch(novas[n], /\b(garante|garantid|cura|curar|sempre resolve|100 ?%)\b/i, `eixo ${n}`);
  }
});

test('páginas de tema regeneradas trazem as introduções novas (eixo 1 e 4)', () => {
  const novas = introsDoMd(ler('relatorios/plano-diretor/INTRODUCOES-EIXOS.md'));
  const e1 = ler('public/pilares/eixo-1.html');
  const e4 = ler('public/pilares/eixo-4.html');
  assert.ok(e1.includes(novas[1].replace(/&/g, '&amp;').slice(0, 60)), 'eixo 1 sem a intro nova');
  assert.ok(e4.includes(novas[4].replace(/&/g, '&amp;').slice(0, 60)), 'eixo 4 sem a intro nova');
});

test('aplicação: dry-run padrão não grava e não exige banco', () => {
  const saida = execFileSync('node', [path.join(RAIZ, 'backend', 'scripts', 'portal', 'aplicarRevisao20261110.js')], { cwd: RAIZ, encoding: 'utf8' });
  const r = JSON.parse(saida);
  assert.equal(r.modo, 'DRY-RUN');
  assert.equal(r.nada_gravado, true);
  assert.equal(r.itens, 503);
  assert.equal(r.relatosAlterados, 0);
});

test('aplicação: grava só itens "aprovado", com slug mapeado e backup obrigatório', () => {
  const src = ler('backend/scripts/portal/aplicarRevisao20261110.js');
  assert.match(src, /d\.status === 'aprovado'/);
  assert.match(src, /Gravação exige --aplicar/);
  assert.match(src, /SLUG_DE\.get\(d\.para\)/);
  assert.match(src, /Informe --backup-dir/);
});

test('pacote de revisão: gerador existe e não toca em public/ nem no banco', () => {
  const src = ler('scripts/plano-diretor/gerarPacoteRevisao20261110.js');
  assert.doesNotMatch(src, /Artigo\.|bulkWrite|updateOne|public\//);
});
