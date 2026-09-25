// Texto narrado, hash e estado da narração (backend/lib/narracao.js), sem banco.
const { test } = require('node:test');
const assert = require('node:assert');
const {
  textoParaNarracao,
  hashNarracao,
  estadoNarracao,
  urlNarracaoTocavel,
  AVISO_REFERENCIAS,
} = require('../../backend/lib/narracao');

const ARTIGO = {
  slug: 'teste',
  titulo: 'Sono e ansiedade',
  conteudo: `
    <p class="lead-para">Dormir mal piora a ansiedade<sup>1</sup>.</p>
    <h2>O que fazer</h2>
    <ul><li><strong>Rotina:</strong> horário fixo para deitar</li><li>Menos tela à noite</li></ul>
    <div class="callout"><strong>Se você precisar de apoio agora:</strong> CVV — 188 · SAMU — 192.</div>
    <h2>Ferramenta interativa</h2>
    <div class="ferramenta-embutida" id="ferramenta-sono"><h3>Diário do sono</h3><button>Calcular</button><div><input type="range"></div></div>
    <script>document.querySelector('#x')</script>
    <h2>Referências</h2>
    <ol class="referencias"><li>Autor. Título. <a href="https://doi.org/10.1/x">doi:10.1/x</a></li></ol>
    <p class="refs-note">Conteúdo educativo. Não substitui avaliação individual.</p>
    <p class="identificacao-medico">Dr. Antônio Felipe<br>NÃO ESPECIALISTA</p>`,
};

test('narra só o texto: sem ferramenta, código, links nem lista de referências', () => {
  const t = textoParaNarracao(ARTIGO);
  assert.match(t, /^Sono e ansiedade\.\nNarração em voz sintética\./);
  assert.match(t, /Dormir mal piora a ansiedade\./);
  assert.ok(!/ansiedade1/.test(t), 'chamada de referência some');
  assert.match(t, /O que fazer\./, 'título de seção vira frase com pausa');
  assert.match(t, /Rotina: horário fixo para deitar\./);
  assert.ok(!/Diário do sono|Calcular|querySelector|Ferramenta interativa/.test(t), 'ferramenta e script não são lidos');
  assert.ok(!/https?:|doi/.test(t), 'links não são lidos');
  assert.ok(t.includes(AVISO_REFERENCIAS));
  assert.match(t, /CVV — 188/);
  assert.match(t, /SAMU — 192/);
  assert.match(t, /Não especialista\./, 'caixa alta longa vira caixa normal');
});

test('hash muda quando o conteúdo muda; estado segue o hash', () => {
  const texto = textoParaNarracao(ARTIGO);
  const narracao = { url: 'https://blob/x.mp3', hash: hashNarracao(texto) };

  assert.equal(estadoNarracao({ ...ARTIGO, narracao }).estado, 'ok');
  assert.equal(urlNarracaoTocavel({ ...ARTIGO, narracao }), 'https://blob/x.mp3');

  const corrigido = { ...ARTIGO, conteudo: ARTIGO.conteudo.replace('piora', 'costuma piorar'), narracao };
  assert.equal(estadoNarracao(corrigido).estado, 'desatualizada');
  assert.equal(urlNarracaoTocavel(corrigido), '', 'narração desatualizada não toca');
});

test('áudio antigo sem hash: toca se o artigo não foi reescrito, não toca se foi', () => {
  const legado = { ...ARTIGO, audioNarracaoUrl: 'https://blob/antigo.mp3' };
  assert.equal(estadoNarracao(legado).estado, 'legado');
  assert.equal(urlNarracaoTocavel(legado), 'https://blob/antigo.mp3');

  const reescrito = { ...legado, reescrita: { lote: 'semana-1', importadaEm: new Date() } };
  assert.equal(estadoNarracao(reescrito).estado, 'desatualizada');
  assert.equal(urlNarracaoTocavel(reescrito), '');

  assert.equal(estadoNarracao(ARTIGO).estado, 'ausente');
});
