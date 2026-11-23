// Destino dos .mdx do importar-reescritas (--mdx-saida) e aviso de .mdx rastreado na pasta principal.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { destinoMdx, avisoMdxRastreado } = require('../../backend/lib/reescritas');

const PADRAO = path.join('C:', 'DRSAUDEMENTAL', 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos');

test('sem --mdx-saida, o destino é a pasta padrão (pasta principal)', () => {
  assert.strictEqual(destinoMdx({ pastaPadrao: PADRAO, saida: undefined }), PADRAO);
});

test('com --mdx-saida, o destino é a pasta informada (resolvida)', () => {
  const saida = path.join('C:', 'DRS-wt-x', 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos');
  assert.strictEqual(destinoMdx({ pastaPadrao: PADRAO, saida }), path.resolve(saida));
});

test('--mdx-saida sem valor (true) é erro claro', () => {
  assert.throws(() => destinoMdx({ pastaPadrao: PADRAO, saida: true }), /exige um caminho/);
});

test('sem --mdx-saida e com .mdx rastreados, o aviso lista os arquivos e a solução', () => {
  const aviso = avisoMdxRastreado(['a.mdx', 'b.mdx'], { saida: undefined });
  assert.match(aviso, /2 \.mdx rastreado\(s\) vão mudar na pasta principal/);
  assert.match(aviso, /a\.mdx, b\.mdx/);
  assert.match(aviso, /--mdx-saida=/);
});

test('sem .mdx a alterar, não há aviso', () => {
  assert.strictEqual(avisoMdxRastreado([], { saida: undefined }), null);
});

test('com --mdx-saida, não há aviso (a pasta principal não muda)', () => {
  assert.strictEqual(avisoMdxRastreado(['a.mdx'], { saida: 'C:/x' }), null);
});
