const test = require('node:test');
const assert = require('node:assert/strict');
const a = require('../../scripts/youtube/montarAnexoAuditoria');

// Bytes de exemplo: o teste não decodifica a imagem.
const IMAGEM_DE_EXEMPLO = Buffer.from('bytes de exemplo, sem conteúdo real');

test('classifica as imagens pelo prefixo e ignora o que não é imagem', () => {
  const g = a.classificarCapturas(['oauth-02-escopos.png', 'site-termos.png', 'oauth-01-consentimento.jpg', 'notas.txt', 'foto-solta.png']);
  assert.deepEqual(g.oauth, ['oauth-01-consentimento.jpg', 'oauth-02-escopos.png']);
  assert.deepEqual(g.site, ['site-termos.png']);
  assert.deepEqual(g.outras, ['foto-solta.png']);
});

test('legenda sai do nome do arquivo', () => {
  assert.equal(a.rotuloDaCaptura('oauth-02-escopos-solicitados.png'), '02 escopos solicitados');
  assert.equal(a.rotuloDaCaptura('site-privacidade.jpeg'), 'privacidade');
  assert.equal(a.rotuloDaCaptura('site_privacidade.jpeg'), 'site privacidade');
});

test('sem link, o HTML mostra o espaço a preencher; com link, mostra o link', () => {
  const sem = a.montarHtml({});
  assert.match(sem, /PASTE THE SCREENCAST LINK HERE/);
  const com = a.montarHtml({ link: 'https://youtu.be/exemplo' });
  assert.match(com, /href="https:\/\/youtu\.be\/exemplo"/);
  assert.doesNotMatch(com, /PASTE THE SCREENCAST LINK HERE/);
});

test('imagem entra no HTML como data URI, sem caminho de arquivo', () => {
  const uri = a.imagemComoDataUri(IMAGEM_DE_EXEMPLO, 'oauth-01.png');
  assert.match(uri, /^data:image\/png;base64,/);
  const html = a.montarHtml({ oauth: ['oauth-01.png'], imagens: { 'oauth-01.png': uri } });
  assert.ok(html.includes(uri));
  assert.doesNotMatch(html, /C:\|\.DRSAUDEMENTAL/);
});

test('limite de 10 MB do formulário', () => {
  assert.equal(a.LIMITE_BYTES, 10 * 1024 * 1024);
  assert.equal(a.dentroDoLimite(10 * 1024 * 1024), true);
  assert.equal(a.dentroDoLimite(10 * 1024 * 1024 + 1), false);
});

test('resumo em inglês cita o escopo único e a retenção acordada', () => {
  assert.match(a.RESUMO_EN, /youtube\.force-ssl/);
  assert.match(a.RESUMO_EN, /within 30 days after access is revoked/);
  assert.doesNotMatch(a.RESUMO_EN, /youtube\.upload/);
});
