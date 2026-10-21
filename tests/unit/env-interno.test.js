const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { carregarEnv } = require('../../scripts/carregarEnv');

const RAIZ = path.join(__dirname, '../..');
const TMP = path.join(RAIZ, '.tmp');

test('carregarEnv: preenche process.env a partir do arquivo indicado, sem devolver valores', () => {
  fs.mkdirSync(TMP, { recursive: true });
  const arq = path.join(TMP, 'env-teste-interno.env');
  fs.writeFileSync(arq, 'VAR_TESTE_ENV_INTERNO=valor-de-teste\n', 'utf8');
  delete process.env.VAR_TESTE_ENV_INTERNO;
  assert.equal(carregarEnv(arq), true);
  assert.equal(process.env.VAR_TESTE_ENV_INTERNO, 'valor-de-teste');
  delete process.env.VAR_TESTE_ENV_INTERNO;
});

test('carregarEnv: arquivo ausente não faz nada e não lança erro', () => {
  assert.equal(carregarEnv(path.join(TMP, 'nao-existe-xyz.env')), false);
});

test('agendamento: o pré-checagem é chamado sem --env-file na linha de comando', () => {
  const src = fs.readFileSync(path.join(RAIZ, 'scripts/linkedin/agendarDiario.js'), 'utf8');
  const linha = src.split('\n').find((l) => l.includes('preAgendamento.js'));
  assert.ok(linha, 'linha do pré-checagem encontrada');
  assert.doesNotMatch(linha, /--env-file/, 'nada de --env-file no filho');
  assert.match(src, /carregarEnv\(\)/, 'o agendador carrega o .env por dentro');
});

test('pré-checagem carrega o .env por dentro', () => {
  const src = fs.readFileSync(path.join(RAIZ, 'scripts/linkedin/preAgendamento.js'), 'utf8');
  assert.match(src, /carregarEnv\(\)/);
});

test('npm: existem linkedin:pre e linkedin:agendar sem --env-file', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  assert.doesNotMatch(pkg.scripts['linkedin:pre'], /--env-file/);
  assert.doesNotMatch(pkg.scripts['linkedin:agendar'], /--env-file/);
});
