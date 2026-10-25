// Conferência diária das redes (09:30 de Salvador): SOMENTE LEITURA. Não publica, não apaga, não grava no banco e não mexe em freios.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const codigo = ler('scripts/conferencias/conferenciaDiaria.js');
// só o código (sem os comentários de cabeçalho, que descrevem o que NÃO faz)
const semComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('a conferência diária não escreve no banco, não publica, não apaga e não altera freios', () => {
  assert.doesNotMatch(semComentarios, /\b(insertOne|insertMany|updateOne|updateMany|replaceOne|deleteOne|deleteMany|findOneAndUpdate|bulkWrite|drop)\b/);
  assert.doesNotMatch(semComentarios, /media_publish|publicarCarrosselNoInstagram|publicarNoInstagram|publicarReelNoInstagram|enviarVideo|publicarDevidos/);
  assert.doesNotMatch(semComentarios, /method:\s*['"](POST|PUT|DELETE|PATCH)['"]/i);
  assert.doesNotMatch(semComentarios, /PUBLICACAO_ATIVA\s*=[^=]/);
  assert.doesNotMatch(semComentarios, /\.env['"]\s*,\s*['"]utf8|readFileSync\([^)]*\.env/);
  // só escreve o relatório do dia e o bloco de alerta do ESTADO-GERAL
  const escritas = [...semComentarios.matchAll(/writeFileSync\(([^,]+),/g)].map((m) => m[1].trim());
  assert.equal(escritas.length, 2);
  assert.ok(escritas.some((e) => /conferencias|pasta/.test(e)) && escritas.some((e) => /^eg$/.test(e)));
});

test('o relatório vai para relatorios/conferencias/AAAA-MM-DD.md e o alerta fica no topo do ESTADO-GERAL (sem e-mail configurado)', () => {
  assert.match(codigo, /relatorios\/conferencias/);
  assert.match(codigo, /ALERTA-REDES:INICIO/);
  assert.match(codigo, /não há envio de e-mail configurado/);
  assert.match(codigo, /hoje >= '2026-10-19'/);
  assert.match(codigo, /hoje >= '2026-10-26'/);
});

test('tarefa DrSM-Conferencia-Diaria em janelas de Salvador (17:35 seg a sex), oculta (S4U), com retry, e o instalador aceita registrar só uma tarefa', () => {
  const ps = ler('scripts/agendar-tarefas-windows.ps1');
  assert.match(ps, /DrSM-Conferencia-Diaria[\s\S]{0,400}-At 17:35/);
  assert.match(ps, /LogonType S4U/);
  assert.match(ps, /-RestartCount 3/);
  assert.match(ps, /-Hidden/);
  assert.match(ps, /\[string\]\$So/);
});
