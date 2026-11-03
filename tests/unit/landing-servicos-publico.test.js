const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ler = (arq) => fs.readFileSync(path.join(__dirname, '..', '..', 'public', arq), 'utf8');
const TERMOS_PROIBIDOS = [
  'Agendar consulta', 'Agendar avaliação', 'Consultas online', 'Sigilo Total', 'Quem vai te atender',
  'Agenda aberta', 'Situações que acompanhamos', 'Como funciona', 'Agendamento de consulta', '#agendar',
  '#atendimento', '#como-funciona', '#perguntas', 'MedicalClinic', 'Revisão de tratamento',
];

test('home sem serviços de consulta, agenda ou fluxo de atendimento particular', () => {
  const html = ler('index.html');
  for (const t of TERMOS_PROIBIDOS) assert.ok(!html.includes(t), `index.html contém: ${t}`);
});

test('home com estrutura nova: Temas, Para quem é, Sobre, Contato e linha PAP/APS no rodapé', () => {
  const html = ler('index.html');
  for (const id of ['id="temas"', 'id="para-quem-e"', 'id="sobre"', 'id="contato-servicos"']) assert.ok(html.includes(id), id);
  assert.ok(html.includes('Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)'));
  assert.ok(html.includes('Portal de Saúde Mental Doutor Antônio Felipe Garabito: saúde mental explicada com ciência e acolhimento'));
});

test('contato da home só por e-mail e com a orientação de casos individuais', () => {
  const html = ler('index.html');
  assert.ok(html.includes('Somente por e-mail'));
  assert.ok(html.includes('procure a UBS, o CAPS ou um profissional de confiança'));
});

test('mentoria sem "Agendamento de consulta" nem atendimento individual oferecido', () => {
  const html = ler('mentoria.html');
  assert.ok(!html.includes('Agendamento%20de%20consulta'));
  assert.ok(!html.includes('Agendamento de consulta'));
  assert.ok(!html.includes('Atendimento</h3>'));
});

test('artigo sem links para a agenda removida', () => {
  const html = ler('artigo.html');
  assert.ok(!html.includes('/#agendar'));
  assert.ok(html.includes('procure a UBS, o CAPS ou um profissional de confiança'));
});

test('PHQ-9: aviso de crise com o texto exigido, também antes do envio', () => {
  const js = ler('assets/js/extras.js');
  const texto = 'Se você tem pensado em se ferir ou em morrer, procure ajuda agora: <a href="tel:188">CVV 188</a> (24 h, gratuito), <a href="tel:192">SAMU 192</a> ou o pronto-socorro mais próximo.';
  assert.ok(js.includes(texto));
  assert.ok(js.includes('plano-alerta-9'), 'alerta imediato ao marcar o item 9');
});
