// Auditoria de roteiros do Instagram (backend/scripts/auditoriaInstagram.js) e conformidade da landing de Mentoria.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const aud = require('../../backend/scripts/auditoriaInstagram');
const { AVISO_CFM, IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const RODAPE = `${IDENTIFICACAO_COMPLETA}\n\n${AVISO_CFM}`;
const COMPLETO = `# Peça\n\n## Carrossel (4:5)\n\n1. Gancho acolhedor.\n2. Quer apoio? Agende uma mentoria.\n\n## Reel 1: Tema (30 s)\n\nFale com calma. Convite: mentoria no link da bio.\n\n## Stories\n\n| # | Texto |\n|---|---|\n| 1 | Mentoria aberta |\n\n## LinkedIn 1\n\nTexto sem relação.\n\n${RODAPE}\n`;

test('extrairPecas separa Carrossel, Reels e Stories e ignora ganchos, LinkedIn e YouTube', () => {
  const md = `## Ganchos para Reels\n\n1. x\n\n${COMPLETO.split('\n').slice(2).join('\n')}\n\n## YouTube\n\ntexto`;
  const pecas = aud.extrairPecas(md);
  assert.deepEqual(pecas.map((p) => p.formato), ['Carrossel', 'Reels', 'Stories']);
  assert.match(pecas[1].texto, /mentoria no link/);
  assert.doesNotMatch(pecas[2].texto, /LinkedIn|Texto sem relação/);
});

test('subseções (###) ficam dentro da peça; Reels em ### são peças separadas', () => {
  const md = '## Carrossel\n\nslide\n\n### Legenda\n\nAgende a mentoria.\n\n### Reel 1 — A\n\nsem cta\n\n### Reel 2 — B\n\nmentoria';
  const pecas = aud.extrairPecas(md);
  assert.equal(pecas.length, 3);
  assert.match(pecas[0].texto, /Agende a mentoria/);
  assert.deepEqual(pecas.slice(1).map((p) => p.formato), ['Reels', 'Reels']);
});

test('peça completa passa em tudo', () => {
  const r = aud.auditarTexto(COMPLETO);
  assert.deepEqual(r.falhas, []);
  assert.deepEqual(r.formatos, ['Carrossel', 'Reels', 'Stories']);
});

test('aponta CRM/RQE, atuação, aviso CFM e CTA de Mentoria ausentes', () => {
  const r = aud.auditarTexto('## Reel 1: Tema\n\nFale com calma e agende uma consulta.\n');
  const codigos = r.falhas.map((f) => f.codigo);
  for (const c of ['crm', 'rqe', 'atuacao', 'aviso-cfm', 'cta-mentoria']) assert.ok(codigos.includes(c), c);
  assert.equal(r.falhas.find((f) => f.codigo === 'cta-mentoria').peca, 'Reels: Reel 1: Tema');
});

test('CTA de Mentoria é cobrado por peça, não pelo arquivo', () => {
  const md = `## Reel 1: A\n\nsem convite\n\n## Reel 2: B\n\nagende uma mentoria\n\n${RODAPE}`;
  const r = aud.auditarTexto(md);
  assert.deepEqual(r.falhas.map((f) => f.peca), ['Reels: Reel 1: A']);
});

test('normas CFM: promessa de cura e veto de "psiquiatra" reprovam', () => {
  const ruim = `## Stories\n\nVocê vai se curar com a mentoria!\n\nDr. Antônio Felipe, psiquiatra, atende no PAP.\n\n${RODAPE}`;
  const cfm = aud.auditarTexto(ruim).falhas.filter((f) => f.codigo === 'cfm').map((f) => f.mensagem).join(' | ');
  assert.match(cfm, /veto|psiquiatra/i);
});

test('listarMarkdown percorre as subpastas e deixa pautas/ de fora; auditarPasta lê os arquivos', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-'));
  for (const d of ['aprovados', 'pautas']) fs.mkdirSync(path.join(pasta, d));
  fs.writeFileSync(path.join(pasta, 'aprovados', 'a.md'), COMPLETO);
  fs.writeFileSync(path.join(pasta, 'pautas', 'p.md'), 'artigo');
  fs.writeFileSync(path.join(pasta, 'raiz.md'), '## Stories\n\nsem nada');
  fs.writeFileSync(path.join(pasta, 'nota.txt'), 'x');
  assert.deepEqual(aud.listarMarkdown(pasta), ['aprovados/a.md', 'raiz.md']);
  const r = aud.auditarPasta({ pasta });
  assert.equal(r.find((x) => x.arquivo === 'aprovados/a.md').falhas.length, 0);
  assert.ok(r.find((x) => x.arquivo === 'raiz.md').falhas.length > 0);
  assert.deepEqual(aud.argumentos(['--detalhe', '--arquivo=a/b.md']), { detalhe: true, arquivo: 'a/b.md' });
});

test('landing de Mentoria: identificação completa, atuação PAP/APS, CTA de Mentoria, aviso CFM e CVV', () => {
  const fonte = fs.readFileSync(path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental', 'app', 'mentoria', 'LandingMentoria.jsx'), 'utf8');
  for (const linha of IDENTIFICACAO_COMPLETA.split('\n')) assert.ok(fonte.includes(linha), `falta: ${linha}`);
  assert.ok(fonte.includes(AVISO_CFM));
  assert.match(fonte, /Agendar uma mentoria/);
  assert.match(fonte, /Pronto Atendimento Psiquiátrico \(PAP\)/);
  assert.match(fonte, /Atenção Primária à Saúde \(APS\)/);
  // Só o texto que o leitor vê (nós de texto do JSX e strings), sem nomes de constantes nem classes.
  const visivel = [...fonte.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).concat([...fonte.matchAll(/'([^'\n]{15,})'/g)].map((m) => m[1])).join('\n');
  assert.deepEqual(checarEticaCfm(visivel, { contexto: 'portal' }).falhas, []);
});
