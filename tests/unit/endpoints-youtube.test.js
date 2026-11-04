// Endpoints da API do YouTube: só os 7 declarados no formulário de 01/11/2026 (ver scripts/lib/endpointsYoutube.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { analisarTexto } = require('../../scripts/lib/endpointsYoutube');

test('aceita os endpoints do formulário', () => {
  const casos = [
    "fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status')", // videos.insert
    "fetch('https://www.googleapis.com/youtube/v3/videos?part=status', { method: 'PUT' })", // videos.update
    "fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${id}`, { method: 'POST' })", // thumbnails.set
    "fetch('https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet', { method: 'POST' })", // captions.insert
    "fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50')", // playlists.list
    "fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', { method: 'POST' })", // playlists.insert
    "fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', { method: 'POST' })", // playlistItems.insert
  ];
  for (const linha of casos) assert.deepEqual(analisarTexto(linha), [], linha);
});

test('reprova endpoint fora da lista', () => {
  const casos = [
    "fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular')", // videos.list
    "fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&q=x')", // search.list
    "fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet')", // comments
    "fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true')", // channels.list
  ];
  for (const linha of casos) assert.equal(analisarTexto(linha).length, 1, linha);
});

test('informa o arquivo e a linha da violação', () => {
  const texto = 'const a = 1;\nfetch("https://www.googleapis.com/youtube/v3/search?part=snippet")';
  const [v] = analisarTexto(texto, 'scripts/x.js');
  assert.equal(v.arquivo, 'scripts/x.js');
  assert.equal(v.linha, 2);
  assert.match(v.endpoint, /youtube\/v3\/search/);
});
