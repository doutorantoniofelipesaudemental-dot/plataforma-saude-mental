// Assinatura de mídias sociais (3 linhas), trilha a -22 dB e Podcast na auditoria do Instagram;
// o bloco de 5 linhas com as pós-graduações fica para a landing page e o rodapé do portal.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const aud = require('../../backend/scripts/auditoriaInstagram');
const { IDENTIFICACAO_COMPLETA, AVISO_CFM } = require('../../backend/lib/conformidadeCfm');
const { IDENTIFICACAO_3_LINHAS } = require('../../backend/lib/legendaInstagram');

const RAIZ = path.join(__dirname, '..', '..');
const peca = (rodape, extra = '') => `## Stories\n\nConvite para a mentoria.\n${extra}\n\n${rodape}\n\n${AVISO_CFM}\n`;
const codigos = (md) => aud.auditarTexto(md).falhas.map((f) => f.codigo);

test('as 3 linhas do padrão social são as três primeiras do bloco completo', () => {
  assert.deepEqual(IDENTIFICACAO_3_LINHAS.split('\n'), IDENTIFICACAO_COMPLETA.split('\n').slice(0, 3));
});

test('assinatura de 3 linhas passa, sem exigir as pós-graduações', () => {
  assert.deepEqual(codigos(peca(IDENTIFICACAO_3_LINHAS)), []);
  assert.deepEqual(codigos(peca(IDENTIFICACAO_COMPLETA)), []);
});

test('assinatura abreviada ou fora do padrão é reprovada, e a autocorreção acrescenta o padrão', () => {
  const abreviada = 'Dr. Antônio Felipe — CRM-BA 41322 | RQE 26638\nMédico Esp. em Medicina de Família e Comunidade\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)';
  const md = peca(abreviada);
  assert.deepEqual(codigos(md), ['assinatura']);
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, ['assinatura CFM (3 linhas)']);
  assert.deepEqual(codigos(r.texto), []);
});

test('trilha só pode estar a -22 dB', () => {
  assert.deepEqual(codigos(peca(IDENTIFICACAO_3_LINHAS, '**Trilha de fundo:** lo-fi suave, -22 dB.')), []);
  const ruim = aud.auditarTexto(peca(IDENTIFICACAO_3_LINHAS, '**Trilha de fundo:** lo-fi suave a -18dB.')).falhas.filter((f) => f.codigo === 'trilha');
  assert.equal(ruim.length, 1);
  assert.match(ruim[0].mensagem, /-18 dB/);
  assert.ok(codigos(peca(IDENTIFICACAO_3_LINHAS, 'Trilha a -12 dB.')).includes('trilha'));
});

test('Podcast e "Vídeo" são peças e exigem o CTA de Mentoria', () => {
  const md = `## Podcast (3 min)\n\nSem convite.\n\n## Vídeo\n\nAgende uma mentoria.\n\n${IDENTIFICACAO_3_LINHAS}\n\n${AVISO_CFM}\n`;
  const r = aud.auditarTexto(md);
  assert.deepEqual(r.formatos, ['Podcast', 'Reels']);
  assert.deepEqual(r.falhas.map((f) => f.peca), ['Podcast: Podcast (3 min)']);
});

test('roteiro-modelo multimídia: quatro formatos, -22 dB, aviso de IA, CVV 188/SAMU 192 e auditoria limpa', () => {
  const md = fs.readFileSync(path.join(RAIZ, 'CONTEUDO_INSTAGRAM', 'MODELO_ROTEIRO_MULTIMIDIA.md'), 'utf8');
  const r = aud.auditarTexto(md);
  assert.deepEqual(r.falhas, []);
  assert.deepEqual(r.formatos, ['Carrossel', 'Reels', 'Stories', 'Podcast']);
  assert.ok(md.includes(AVISO_CFM));
  assert.match(md, /CVV 188/);
  assert.match(md, /SAMU 192/);
  assert.ok(md.includes(IDENTIFICACAO_3_LINHAS));
  assert.ok(!md.includes('Pós-graduação'));
  assert.doesNotMatch(md, /Antonio/);
});

test('landing page e portal mantêm o bloco de 5 linhas com as pós-graduações', () => {
  const landing = fs.readFileSync(path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'app', 'mentoria', 'LandingMentoria.jsx'), 'utf8');
  for (const linha of IDENTIFICACAO_COMPLETA.split('\n')) assert.ok(landing.includes(linha), `landing sem: ${linha}`);
  const index = fs.readFileSync(path.join(RAIZ, 'public', 'index.html'), 'utf8');
  assert.ok(index.includes('Terapia Cognitivo-Comportamental'));
});

test('o nome do médico leva acento nos arquivos de identidade do projeto', () => {
  for (const rel of ['CLAUDE.md', 'post_instagram.py', 'reels_automation/src/llm_ollama.py']) {
    assert.doesNotMatch(fs.readFileSync(path.join(RAIZ, rel), 'utf8'), /Antonio Felipe|ANTONIO FELIPE/, rel);
  }
});
