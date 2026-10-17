const test = require('node:test');
const assert = require('node:assert/strict');
const { publicarDevidos } = require('../../backend/lib/linkedinFila');

const RODAPE = 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.\nConteúdo educativo, não substitui consulta. Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.\nEm crise: CVV 188 · SAMU 192\nConteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).\n\nDr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)';
const TEXTO = `Cuidar de quem cuida começa por reconhecer o cansaço.\n${'Ponto prático com informação útil para a equipe de saúde. '.repeat(14)}\nTexto completo: https://www.drantoniofelipemedico.com.br/artigo/x\n\n${RODAPE}`;

function banco({ itens, artigos = {} }) {
  const atualizados = [];
  return {
    atualizados,
    collection: (nome) => nome === 'linkedin_fila'
      ? { find: () => ({ sort: () => ({ limit: () => ({ toArray: async () => itens }) }) }), updateOne: async (f, u) => atualizados.push({ f, u }) }
      : { findOne: async (f) => artigos[f.slug] || null },
  };
}
const ENV = ['LINKEDIN_PUBLICACAO_ATIVA', 'REDES_PUBLICACAO_ATIVA', 'LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AUTHOR_URN', 'LINKEDIN_TOKEN_VENCE_EM'];
function comEnv(vars, fn) {
  const antes = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  for (const k of ENV) delete process.env[k];
  Object.assign(process.env, vars);
  return Promise.resolve(fn()).finally(() => { for (const k of ENV) { if (antes[k] === undefined) delete process.env[k]; else process.env[k] = antes[k]; } });
}
const item = (extra = {}) => ({ _id: 'li-1', tipo: 'texto', status: 'aprovado-checagem', slot: '2026-10-28T22:30:00.000Z', titulo: 'T', texto: TEXTO, url: 'https://www.drantoniofelipemedico.com.br/artigo/x', slug: 'x', ...extra });
const AGORA = new Date('2026-10-28T23:00:00Z');
const OK = { LINKEDIN_PUBLICACAO_ATIVA: 'true', LINKEDIN_ACCESS_TOKEN: 't', LINKEDIN_AUTHOR_URN: 'urn:li:person:1' };

test('freio próprio: sem LINKEDIN_PUBLICACAO_ATIVA=true nada é publicado', () => comEnv({}, async () => {
  const r = await publicarDevidos({ db: banco({ itens: [item()] }), agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.equal(r.publicado, false); assert.match(r.motivo, /LINKEDIN_PUBLICACAO_ATIVA/);
}));

test('freio geral REDES_PUBLICACAO_ATIVA=false também bloqueia', () => comEnv({ ...OK, REDES_PUBLICACAO_ATIVA: 'false' }, async () => {
  const r = await publicarDevidos({ db: banco({ itens: [item()] }), agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.equal(r.publicado, false); assert.match(r.motivo, /REDES_PUBLICACAO_ATIVA/);
}));

test('token vencido bloqueia com instrução', () => comEnv({ ...OK, LINKEDIN_TOKEN_VENCE_EM: '2026-10-01' }, async () => {
  const r = await publicarDevidos({ db: banco({ itens: [item()] }), agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.match(r.motivo, /token vencido/);
}));

test('texto do site ainda não publicado: espera', () => comEnv(OK, async () => {
  const r = await publicarDevidos({ db: banco({ itens: [item()], artigos: { x: { publicado: false } } }), agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.equal(r.publicado, false); assert.match(r.motivo, /aguardando a publicação/);
}));

test('tudo certo: publica 1 e marca como publicado', () => comEnv(OK, async () => {
  const db = banco({ itens: [item()], artigos: { x: { publicado: true } } });
  let chamadas = 0;
  const r = await publicarDevidos({ db, agora: AGORA, publicar: async () => { chamadas++; return { id: 'urn:li:share:1' }; } });
  assert.equal(r.publicado, true); assert.equal(chamadas, 1);
  assert.equal(db.atualizados[0].u.$set.status, 'publicado');
}));

test('checagem falha de novo na hora: bloqueia e não publica', () => comEnv(OK, async () => {
  const db = banco({ itens: [item({ texto: TEXTO.replace('CVV 188 · SAMU 192', '') })], artigos: { x: { publicado: true } } });
  const r = await publicarDevidos({ db, agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.equal(r.publicado, false); assert.equal(db.atualizados[0].u.$set.status, 'bloqueado');
}));

test('item com mais de 3 dias de atraso expira em vez de publicar', () => comEnv(OK, async () => {
  const db = banco({ itens: [item({ slot: '2026-10-20T22:30:00.000Z' })], artigos: { x: { publicado: true } } });
  const r = await publicarDevidos({ db, agora: AGORA, publicar: async () => assert.fail('não deveria publicar') });
  assert.equal(r.publicado, false); assert.equal(db.atualizados[0].u.$set.status, 'expirado');
}));

test('post sem o crédito do Portal é reprovado', () => {
  const { checarPost } = require('../../backend/lib/linkedinChecagem');
  assert.ok(checarPost({ tipo: 'texto', texto: TEXTO.replace('Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.', '') }).some((f) => /crédito do Portal/.test(f)));
});

test('"psiquiatra" como nome da profissão passa; ligado ao autor ou #psiquiatria reprova', () => {
  const { checarPost } = require('../../backend/lib/linkedinChecagem');
  const veto = (t) => checarPost({ tipo: 'texto', texto: t }).some((f) => /psiquiatra|#psiquiatria/.test(f));
  assert.equal(veto(`${TEXTO}\nA carta que nunca foi enviada ao psiquiatra: quando encaminhar ao psiquiatra.`), false);
  assert.equal(veto(`${TEXTO}\nDr. Antônio Felipe, psiquiatra, explica.`), true);
  assert.equal(veto(`${TEXTO}\nSou psiquiatra e aqui vai a dica.`), true);
  assert.equal(veto(`${TEXTO}\n#psiquiatria`), true);
});
