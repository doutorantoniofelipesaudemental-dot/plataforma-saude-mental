// Ordem de 08/11/2026: nenhum canal oferece consulta, agendamento ou atendimento individual.
// Contato institucional (mentoria, consultoria e formação) só por e-mail.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..', '..');
const ler = (arquivo) => fs.readFileSync(path.join(raiz, arquivo), 'utf8');

const PROIBIDOS = [/Agendamento de Consulta/i, /Agendamento%20de%20consulta/i, /Agendamento de consulta/, /Solicite seu horário/i];

test('/links (public/links.html) não tem botão de agendamento e tem o contato institucional', () => {
  const html = ler('public/links.html');
  for (const re of PROIBIDOS) assert.doesNotMatch(html, re, `links.html: ${re}`);
  assert.match(html, /Contato: mentoria, consultoria e formação/);
  assert.match(html, /mailto:doutor\.antoniofelipe\.saudemental@gmail\.com\?subject=Contato%20mentoria%20e%20consultoria/);
});

test('/links do app Next (app/links/page.js) sem agendamento', () => {
  const js = ler('apps/plataforma-saude-mental/app/links/page.js');
  for (const re of PROIBIDOS) assert.doesNotMatch(js, re, `app/links: ${re}`);
  assert.match(js, /Contato: mentoria, consultoria e formação/);
});

test('termos.html não oferece agendamento de consulta', () => {
  const html = ler('public/termos.html');
  for (const re of PROIBIDOS) assert.doesNotMatch(html, re, `termos: ${re}`);
  assert.match(html, /não faz consulta particular/);
});

test('skill de encaminhamento humano não oferece agendamento', () => {
  const js = ler('backend/lib/skills/skillRegistry.js');
  assert.doesNotMatch(js, /Para agendar/);
  assert.doesNotMatch(js, /Agendamento de consulta/);
  assert.match(js, /O Portal não agenda consultas/);
});

test('CLAUDE.md registra a ordem de 08/11/2026 e a voz Kokoro autorizada para vídeos novos', () => {
  const md = ler('CLAUDE.md');
  assert.match(md, /Ordem de 08\/11\/2026:\*\* o Dr\. Antônio NÃO faz consulta particular/);
  assert.match(md, /Kokoro \(Apache-2\.0, local, sem custo\) AUTORIZADO para VÍDEOS NOVOS/);
  assert.match(md, /IA externa desativada \(ordem de 08\/11\/2026\)/);
});
