// Identificação ÚNICA por página (15/10/2026): o bloco oficial (5 linhas, com a TCC) vive SÓ no rodapé do template;
// o corpo do texto não leva CRM, RQE, "NÃO ESPECIALISTA" nem a linha de pós-graduações.
const { test } = require('node:test');
const assert = require('node:assert');
const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');
const { checarTexto } = require('../../backend/lib/auditoriaTexto');

const BASE = { titulo: 'Teste', slug: 'teste', resumo: 'Resumo', categoria: 'Geral', autor: 'Dr. Antônio Felipe', tempoLeitura: 2, publicadoEm: new Date('2026-10-05'), atualizadoEm: new Date('2026-10-05') };
const BLOCO = '<p class="identificacao-medico">Dr. Antônio Felipe — Médico — CRM-BA 41322<br>Especialista em Medicina de Família e Comunidade — RQE 26638<br>NÃO ESPECIALISTA</p>';
const visivel = (html) => html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
const conta = (t, s) => t.split(s).length - 1;

test('página renderizada: CRM-BA 41322, RQE 26638 e NÃO ESPECIALISTA aparecem exatamente 1 vez, e a TCC no rodapé', () => {
  const v = visivel(renderizarArtigoHtml({ ...BASE, conteudo: '<p>Texto sem bloco de identificação.</p>' }));
  assert.equal(conta(v, 'CRM-BA 41322'), 1);
  assert.equal(conta(v, 'RQE 26638'), 1);
  assert.equal(conta(v, 'NÃO ESPECIALISTA'), 1);
  assert.ok(v.includes('Terapia Cognitivo-Comportamental'));
  assert.ok(!/Atuo em Pronto/.test(v), 'sem a redação antiga');
});

test('se o corpo ainda tiver o bloco, a página renderizada duplica (a auditoria precisa pegar isso)', () => {
  const v = visivel(renderizarArtigoHtml({ ...BASE, conteudo: `<p>Texto.</p>${BLOCO}` }));
  assert.equal(conta(v, 'CRM-BA 41322'), 2);
});

test('auditoria do texto reprova bloco de identificação no corpo e aceita o corpo limpo', () => {
  const comRefs = '<h2>Referências</h2><ol><li>a</li><li>b</li><li>c</li><li>d</li></ol>';
  const f = (c) => checarTexto({ origem: 'mongo', slug: 'x', titulo: 't', resumo: 'r', tempoLeitura: 1, corpo: c }).map((x) => x.msg);
  assert.ok(f(`<p>Texto.</p>${BLOCO}${comRefs}`).some((m) => /bloco de identificação no corpo/.test(m)));
  assert.deepEqual(f(`<p>Texto.</p>${comRefs}`), []);
});

test('"Antonio Felipe Garabito Jr." (dedicatória ao filho) não é acusado; "Dr. Antonio Felipe" continua sendo erro', () => {
  const comRefs = '<h2>Referências</h2><ol><li>a</li><li>b</li><li>c</li><li>d</li></ol>';
  const f = (c) => checarTexto({ origem: 'mongo', slug: 'x', titulo: 't', resumo: 'r', tempoLeitura: 1, corpo: c }).map((x) => x.msg);
  assert.deepEqual(f(`<p>Para Antonio Felipe Garabito Jr., com amor.</p>${comRefs}`), []);
  assert.ok(f(`<p>Dr. Antonio Felipe diz.</p>${comRefs}`).some((m) => /sem acento/.test(m)));
});

test('app Next: o rodapé único traz a assinatura padrão de 5 linhas e nenhum .mdx traz o bloco no corpo', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
  const RAIZ = path.join(__dirname, '..', '..');
  const rodape = fs.readFileSync(path.join(RAIZ, 'apps/plataforma-saude-mental/app/RodapeIdentificacao.jsx'), 'utf8');
  for (const linha of IDENTIFICACAO_COMPLETA.split('\n')) assert.ok(rodape.includes(linha), `rodapé do app Next sem: ${linha}`);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.mdx$/.test(e.name) ? [path.join(d, e.name)] : []));
  const mdx = [...walk(path.join(RAIZ, 'apps/plataforma-saude-mental/src/content')), ...walk(path.join(RAIZ, 'apps/plataforma-saude-mental/content'))];
  assert.ok(mdx.length >= 80);
  for (const f of mdx) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /identificacao-medico|CRM-BA 41322|NÃO ESPECIALISTA/, path.basename(f));
});
