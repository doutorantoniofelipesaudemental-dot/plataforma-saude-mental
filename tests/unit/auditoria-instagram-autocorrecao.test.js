// Falsos positivos da auditoria do Instagram e autocorreção (backend/scripts/auditoriaInstagram.js).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const aud = require('../../backend/scripts/auditoriaInstagram');
const { AVISO_CFM, IDENTIFICACAO_COMPLETA, LINHA_CVV } = require('../../backend/lib/conformidadeCfm');
const { IDENTIFICACAO_3_LINHAS } = require('../../backend/lib/legendaInstagram');

const codigos = (md) => aud.auditarTexto(md).falhas.map((f) => f.codigo);
const RODAPE = `${IDENTIFICACAO_COMPLETA}\n\n${AVISO_CFM}`;

test('"sem soluções milagrosas" e "não promete cura" não são promessa; "resultado milagroso" continua reprovado', () => {
  assert.ok(!codigos(`## Stories\n\nSem soluções milagrosas, com base na literatura. Não promete cura. Agende uma mentoria.\n\n${RODAPE}`).includes('cfm'));
  assert.ok(codigos(`## Stories\n\nUm resultado milagroso para você. Agende uma mentoria.\n\n${RODAPE}`).includes('cfm'));
});

test('caixa alta em direção de cena (texto na tela) não reprova; no corpo do roteiro continua reprovando', () => {
  const cena = `## Reel 1: A\n\n- 0-3s: gancho.\n**Texto na tela:** "MEDO DO REMÉDIO" → "NÃO É TEIMOSIA" → "É CONFIANÇA A CONSTRUIR"\nConvite: mentoria.\n\n${RODAPE}`;
  assert.ok(!codigos(cena).includes('cfm'));
  const gritado = `## Reel 1: A\n\nATENÇÃO URGENTE: PROCURE AGORA. Convite: mentoria.\n\n${RODAPE}`;
  assert.ok(codigos(gritado).includes('cfm'));
});

test('menção meta ao veto ("em nenhum lugar o autor é chamado de psiquiatra") não reprova; a afirmação reprova', () => {
  const meta = `## Stories\n\nEm nenhum lugar o autor é chamado de "psiquiatra" ou "especialista em saúde mental". Mentoria.\n\n${RODAPE}`;
  assert.ok(!codigos(meta).includes('cfm'));
  const veto = `## Stories\n\nDr. Antônio Felipe, especialista em saúde mental, atende no PAP. Mentoria.\n\n${RODAPE}`;
  assert.ok(codigos(veto).includes('cfm'));
});

test('autocorrigirTexto insere a assinatura de 3 linhas e o aviso no fim, uma única vez', () => {
  const md = '## Reel 1: A\n\nTexto simples sobre mentoria.\n';
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, ['assinatura CFM (3 linhas)', 'aviso CFM']);
  assert.ok(r.texto.includes(IDENTIFICACAO_3_LINHAS));
  assert.ok(!r.texto.includes('Pós-graduação'), 'o bloco de 5 linhas é do portal, não das mídias sociais');
  assert.ok(r.texto.includes(AVISO_CFM));
  const de = codigos(r.texto);
  for (const c of ['crm', 'rqe', 'atuacao', 'aviso-cfm']) assert.ok(!de.includes(c), c);
  assert.deepEqual(aud.autocorrigirTexto(r.texto).inseridos, [], 'idempotente');
});

test('autocorrigirTexto: só falta a atuação → insere a linha logo após a linha do RQE', () => {
  const md = `## Stories\n\nMentoria.\n\nDr. Antônio Felipe · Médico · CRM-BA 41322\nEspecialista em Medicina de Família e Comunidade · RQE 26638\n\n${AVISO_CFM}\n`;
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, ['linha de atuação PAP/APS']);
  assert.match(r.texto, /RQE 26638\nAtuo em Pronto Atendimento Psiquiátrico \(PAP\) e Atenção Primária à Saúde \(APS\)\n/);
});

test('autocorrigirTexto: tema sensível sem CVV recebe a linha do CVV 188', () => {
  const md = `## Stories\n\nSinais de depressão e risco de suicídio. Mentoria.\n\n${RODAPE}\n`;
  assert.ok(codigos(md).includes('cvv'));
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, ['CVV 188']);
  assert.ok(r.texto.includes(LINHA_CVV));
});

test('autocorrigirTexto não mexe no CTA de Mentoria nem em termos vetados', () => {
  const md = `## Reel 1: A\n\nResultado milagroso, sem convite.\n\n${RODAPE}\n`;
  const r = aud.autocorrigirTexto(md);
  assert.deepEqual(r.inseridos, []);
  const resto = codigos(r.texto);
  assert.ok(resto.includes('cta-mentoria') && resto.includes('cfm'));
});

test('autocorrigirPasta grava os arquivos alterados e respeita dryRun', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-fix-'));
  fs.writeFileSync(path.join(pasta, 'a.md'), '## Stories\n\nMentoria.\n');
  fs.writeFileSync(path.join(pasta, 'ok.md'), `## Stories\n\nMentoria.\n\n${RODAPE}\n`);
  const seco = aud.autocorrigirPasta({ pasta, dryRun: true });
  assert.deepEqual(seco.map((x) => x.arquivo), ['a.md']);
  assert.ok(!fs.readFileSync(path.join(pasta, 'a.md'), 'utf8').includes('CRM-BA'));
  aud.autocorrigirPasta({ pasta });
  assert.ok(fs.readFileSync(path.join(pasta, 'a.md'), 'utf8').includes('CRM-BA 41322'));
  assert.deepEqual(aud.autocorrigirPasta({ pasta }), []);
});
