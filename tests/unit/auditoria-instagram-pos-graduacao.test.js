// Rol de pós-graduações com Terapia Cognitivo-Comportamental (TCC) na auditoria e na landing de Mentoria.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const aud = require('../../backend/scripts/auditoriaInstagram');
const { IDENTIFICACAO_COMPLETA, AVISO_CFM } = require('../../backend/lib/conformidadeCfm');

const LINHA_NOVA = 'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho.';
const LINHA_ANTIGA = 'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho.';

test('a identificação completa do CFM traz a TCC, na ordem pedida', () => {
  assert.ok(IDENTIFICACAO_COMPLETA.split('\n').includes(LINHA_NOVA));
});

test('auditoria reprova a linha antiga (sem TCC) e aprova a nova', () => {
  const base = (linha) => `## Stories\n\nMentoria.\n\nDr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)\n${linha}\nNÃO ESPECIALISTA\n\n${AVISO_CFM}\n`;
  assert.ok(aud.auditarTexto(base(LINHA_ANTIGA)).falhas.some((f) => f.codigo === 'pos-graduacao'));
  assert.deepEqual(aud.auditarTexto(base(LINHA_NOVA)).falhas, []);
});

test('autocorreção troca a linha antiga pela nova, sem duplicar', () => {
  const md = `## Stories\n\nMentoria.\n\nDr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)\n${LINHA_ANTIGA}\nNÃO ESPECIALISTA\n\n${AVISO_CFM}\n`;
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, ['pós-graduações (com TCC)']);
  assert.ok(r.texto.includes(LINHA_NOVA));
  assert.ok(!r.texto.includes(LINHA_ANTIGA));
  assert.equal(r.texto.split('Pós-graduação em').length - 1, 1);
  assert.deepEqual(aud.autocorrigirTexto(r.texto).inseridos, []);
});

test('autocorreção sem nenhuma linha de pós-graduação a insere logo após a atuação', () => {
  const md = `## Stories\n\nMentoria.\n\nDr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)\n\n${AVISO_CFM}\n`;
  const r = aud.autocorrigirTexto(md);
  assert.match(r.texto, new RegExp(`Atenção Primária à Saúde \\(APS\\)\\n${LINHA_NOVA.replace(/[()]/g, '\\$&')}\\n`));
});

test('landing de Mentoria e metadados citam a TCC', () => {
  const pasta = path.join(__dirname, '..', '..', 'apps', 'plataforma-saude-mental', 'app', 'mentoria');
  assert.ok(fs.readFileSync(path.join(pasta, 'LandingMentoria.jsx'), 'utf8').includes(LINHA_NOVA));
  assert.match(fs.readFileSync(path.join(pasta, 'page.js'), 'utf8'), /Terapia Cognitivo-Comportamental/);
});
