const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../../scripts/instagram/atualizarToken');

const TOKEN = 'IGAAtesteFICTICIOabcdefghijklmnop1234567890'; // segredos:permitir (token fictício de teste)
const resposta = (corpo, ok = true, status = 200) => async () => ({ ok, status, json: async () => corpo });

test('host: IGAA usa graph.instagram.com; EAA usa graph.facebook.com', () => {
  assert.equal(A.hostDoToken(TOKEN), 'https://graph.instagram.com');
  assert.equal(A.hostDoToken('EAAfake'), 'https://graph.facebook.com');
});

test('validarMe: sucesso devolve usuário e tipo de conta, sem o token', async () => {
  const r = await A.validarMe(TOKEN, { buscar: resposta({ user_id: '1', username: 'conta_teste', account_type: 'BUSINESS' }) });
  assert.equal(r.ok, true);
  assert.equal(r.usuario, 'conta_teste');
  assert.equal(JSON.stringify(r).includes(TOKEN), false);
});

test('validarMe: erro da Meta vem sem o token, mesmo se a mensagem o ecoar', async () => {
  const r = await A.validarMe(TOKEN, { buscar: resposta({ error: { code: 190, message: `token ${TOKEN} inválido` } }, false, 400) });
  assert.equal(r.ok, false);
  assert.match(r.erro, /190/);
  assert.equal(r.erro.includes(TOKEN), false);
});

test('validarMe: resposta sem id é recusada', async () => {
  const r = await A.validarMe(TOKEN, { buscar: resposta({}) });
  assert.equal(r.ok, false);
});

test('redigir: troca o token por [REDACTED] e não mexe no texto sem token', () => {
  assert.equal(A.redigir(`x ${TOKEN} y`, TOKEN), 'x [REDACTED] y');
  assert.equal(A.redigir('sem token', ''), 'sem token');
});

test('debugToken: sem app id ou secret não consulta a Meta e avisa', async () => {
  let chamou = false;
  const r = await A.debugToken(TOKEN, { appId: '', appSecret: 'x', buscar: async () => { chamou = true; } });
  assert.equal(chamou, false);
  assert.match(r.app, /não verificado/);
  assert.equal(r.expiraEm, null);
});

test('debugToken: com app id e secret lê validade (o token vai no corpo, não na URL)', async () => {
  let url = ''; let corpo = '';
  const exp = Math.floor(Date.UTC(2026, 11, 19) / 1000);
  const r = await A.debugToken(TOKEN, {
    appId: '999', appSecret: 'segredo-ficticio',
    buscar: async (u, opt) => { url = u; corpo = opt.body.toString(); return { json: async () => ({ data: { application: 'App Teste', expires_at: exp, is_valid: true } }) }; },
  });
  assert.equal(url, 'https://graph.facebook.com/debug_token');
  assert.equal(url.includes(TOKEN), false);
  assert.equal(corpo.includes(TOKEN), true);
  assert.equal(r.app, 'App Teste');
  assert.equal(A.dataBR(r.expiraEm), '19/12/2026');
});

test('resumoValido: não contém o token e traz conta, app e validade', () => {
  const s = A.resumoValido({ usuario: 'conta_teste', conta: 'BUSINESS' }, { app: 'App Teste', appId: '999', expiraEm: new Date(Date.UTC(2026, 11, 19)) }, 'graph.instagram.com');
  assert.equal(s, 'VÁLIDO para @conta_teste (BUSINESS), host graph.instagram.com, app App Teste (id 999), expira em 19/12/2026');
  assert.equal(s.includes(TOKEN), false);
});

test('atualizarEnv: troca a linha existente e preserva as outras', () => {
  const t = 'A=1\nINSTAGRAM_ACCESS_TOKEN=velho\nB=2\n';
  assert.equal(A.atualizarEnv(t, 'novo'), 'A=1\nINSTAGRAM_ACCESS_TOKEN=novo\nB=2\n');
});

test('atualizarEnv: acrescenta a linha quando não existe', () => {
  assert.equal(A.atualizarEnv('A=1\n', 'novo'), 'A=1\nINSTAGRAM_ACCESS_TOKEN=novo\n');
  assert.equal(A.atualizarEnv('A=1', 'novo'), 'A=1\nINSTAGRAM_ACCESS_TOKEN=novo');
});

test('atualizarEnv: mantém fim de linha CRLF', () => {
  assert.equal(A.atualizarEnv('A=1\r\nINSTAGRAM_ACCESS_TOKEN=velho\r\n', 'novo'), 'A=1\r\nINSTAGRAM_ACCESS_TOKEN=novo\r\n');
});

test('projeto: grava só no drsaudemental (ID fixo); outro projeto ou pasta sem vínculo é recusado', () => {
  assert.equal(A.projetoPermitido({ projectId: A.PROJETO_OFICIAL_ID }).ok, true);
  assert.equal(A.PROJETO_OFICIAL_ID, 'prj_uIQsuIIdKas1D6AHlGtHEwcdaFsG');
  const outro = A.projetoPermitido({ projectId: 'prj_1Y76anxudO71uxA3Hil9KsDmc7fQ' });
  assert.equal(outro.ok, false);
  assert.match(outro.motivo, /outro projeto/);
  assert.equal(A.projetoPermitido(null).ok, false);
  assert.equal(A.projetoPermitido({}).ok, false);
});

test('dataBR: formato DD/MM/AAAA e texto quando não há data', () => {
  assert.equal(A.dataBR(null), 'não informada pela API');
  assert.equal(A.dataBR(new Date(Date.UTC(2027, 0, 5))), '05/01/2027');
});

test('obterIdConta: token IGAA lê user_id de /me no graph.instagram.com, sem o token na URL', async () => {
  let url = '';
  const r = await A.obterIdConta(TOKEN, { buscar: async (u) => { url = String(u); return { json: async () => ({ user_id: '17841400000000000', username: 'doutor.antoniofelipe.smental' }) }; } });
  assert.deepEqual(r, { ok: true, id: '17841400000000000', username: 'doutor.antoniofelipe.smental' });
  assert.match(url, /^https:\/\/graph\.instagram\.com\/me\?/);
  assert.doesNotMatch(url, /IGAA/);
});

test('obterIdConta: token via Página (EAA) acha a conta pelo username esperado em /me/accounts', async () => {
  const dados = { data: [{ instagram_business_account: { id: '111', username: 'outra' } }, { instagram_business_account: { id: '222', username: 'doutor.antoniofelipe.smental' } }] };
  const r = await A.obterIdConta('EAAfake', { buscar: async () => ({ json: async () => dados }) });
  assert.equal(r.ok, true);
  assert.equal(r.id, '222');
});

test('obterIdConta: erro da Meta vem sem o token', async () => {
  const r = await A.obterIdConta(TOKEN, { buscar: async () => ({ json: async () => ({ error: { code: 190, message: `token ${TOKEN} inválido` } }) }) });
  assert.equal(r.ok, false);
  assert.doesNotMatch(r.erro, /IGAAtesteFICTICIO/);
});

const contaCerta = async () => ({ json: async () => ({ user_id: '17841415747425012', username: 'doutor.antoniofelipe.smental' }) });

test('soConta --redeploy: grava ID (.env e Vercel) e só então dispara o deploy de produção', async () => {
  const ordem = [];
  const r = await A.soConta({ token: TOKEN, redeploy: true, buscar: contaCerta, escreverEnv: (v) => ordem.push(['env', v]), vercel: (n, v) => { ordem.push(['vercel', n, v]); return true; }, deploy: () => { ordem.push(['deploy']); return true; } });
  assert.equal(r, 0);
  assert.deepEqual(ordem, [['env', '17841415747425012'], ['vercel', 'INSTAGRAM_ACCOUNT_ID', '17841415747425012'], ['deploy']]);
});

test('soConta sem --redeploy: grava o ID e NÃO dispara deploy', async () => {
  let deploys = 0;
  const r = await A.soConta({ token: TOKEN, buscar: contaCerta, escreverEnv: () => {}, vercel: () => true, deploy: () => { deploys++; return true; } });
  assert.equal(r, 0);
  assert.equal(deploys, 0);
});

test('soConta: falha na Vercel não dispara deploy', async () => {
  let deploys = 0;
  const r = await A.soConta({ token: TOKEN, redeploy: true, buscar: contaCerta, escreverEnv: () => {}, vercel: () => false, deploy: () => { deploys++; return true; } });
  assert.equal(r, 1);
  assert.equal(deploys, 0);
});

test('soConta: conta de outro username é recusada sem gravar nada', async () => {
  let gravou = false;
  const outra = async () => ({ json: async () => ({ user_id: '1', username: 'outra_conta' }) });
  const r = await A.soConta({ token: TOKEN, redeploy: true, buscar: outra, escreverEnv: () => { gravou = true; }, vercel: () => { gravou = true; return true; }, deploy: () => { gravou = true; return true; } });
  assert.equal(r, 1);
  assert.equal(gravou, false);
});
