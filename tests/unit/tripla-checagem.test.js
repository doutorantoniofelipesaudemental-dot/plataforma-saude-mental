// Tripla checagem da fila (backend/lib/checagemRedes.js), legenda do feed
// (legendaInstagram.js) e capa 4:5 (capaRedes.js) — sem banco nem rede: a
// capa é desenhada em memória e a contagem de hashes repetidos é injetada.
const { test } = require('node:test');
const assert = require('node:assert');
const sharp = require('sharp');

const { montarLegendaInstagram, IDENTIFICACAO, LINHA_BIO } = require('../../backend/lib/legendaInstagram');
const { renderizarCapaRedes } = require('../../backend/lib/capaRedes');
const { executarTriplaChecagem } = require('../../backend/lib/checagemRedes');

const ARTIGO = {
  _id: 'x1',
  slug: 'artigo-de-teste-sem-reescrita',
  titulo: 'Ansiedade no trabalho: quando o cansaço vira sinal',
  resumo: 'O que a ansiedade ligada ao trabalho costuma mostrar e quando procurar ajuda, por Dr. Antônio Felipe.',
  categoria: 'Empresas & RH',
  conteudo: `
    <p class="lead-para">Prazos apertados e cobrança constante cobram um preço. Muita gente só percebe quando o corpo reclama.</p>
    <p>Dor de cabeça, insônia e irritação aparecem antes de a pessoa dar nome ao que sente.</p>
    <h2>Referências</h2><ol><li>Fonte qualquer. https://doi.org/10.0/x</li></ol>`,
};

async function checar(artigo, { legenda, capa, repetidos = 0 } = {}) {
  const l = legenda || montarLegendaInstagram(artigo);
  const r = await renderizarCapaRedes(artigo);
  const c = capa || { buffer: r.buffer, meta: { modelo: r.modelo, titulo: r.titulo } };
  return executarTriplaChecagem(artigo, { legenda: l, capa: c, contarOutrosComHash: async () => repetidos });
}

function comTexto(legenda, texto) {
  return { ...legenda, texto };
}

test('legenda no formato do feed e aprovada nas três checagens', async () => {
  const legenda = montarLegendaInstagram(ARTIGO);
  const linhas = legenda.texto.split('\n\n');
  assert.equal(linhas[0], 'Prazos apertados e cobrança constante cobram um preço.');
  assert.ok(legenda.texto.includes(LINHA_BIO));
  assert.ok(legenda.texto.includes(IDENTIFICACAO));
  assert.ok(legenda.texto.includes('CVV 188'), 'tema sensível (ansiedade) leva CVV');
  assert.ok(!/por Dr\. Antônio Felipe/.test(legenda.texto), 'assinatura antiga sai do resumo');
  assert.ok(!/https?:\/\//.test(legenda.texto), 'referências e links não entram');

  const c = await checar(ARTIGO);
  assert.equal(c.aprovado, true, c.motivo);
});

test('capa 4:5 com 1080×1350 e hash diferente para títulos diferentes', async () => {
  const a = await renderizarCapaRedes(ARTIGO);
  const b = await renderizarCapaRedes({ ...ARTIGO, titulo: 'Outro título' });
  const meta = await sharp(a.buffer).metadata();
  assert.deepEqual([meta.width, meta.height], [1080, 1350]);
  assert.notEqual(a.hash, b.hash);
});

test('reprova legenda com "Antonio" sem acento, #psiquiatria, URL solta ou sem link da bio', async () => {
  const base = montarLegendaInstagram(ARTIGO);
  const casos = [
    [base.texto.replace('Antônio', 'Antonio'), /sem acento/],
    [`${base.texto} #psiquiatria`, /#psiquiatria/],
    [base.texto.replace(LINHA_BIO, 'Leia em https://drsaudemental.vercel.app/artigo/x'), /URL solta/],
    [base.texto.replace(LINHA_BIO, ''), /link da bio/],
    [base.texto.replace(IDENTIFICACAO, ''), /identificação resumida/],
    [base.texto.replace(/#[^\s]+/g, ''), /hashtags/],
  ];
  for (const [texto, esperado] of casos) {
    const c = await checar(ARTIGO, { legenda: comTexto(base, texto) });
    assert.equal(c.aprovado, false);
    assert.match(c.motivo, esperado);
  }
});

test('reprova tema sensível sem CVV 188 e promessa de cura (CFM)', async () => {
  const base = montarLegendaInstagram(ARTIGO);
  const semCvv = await checar(ARTIGO, { legenda: comTexto(base, base.texto.replace(/Se precisar de apoio:[^\n]*/, '')) });
  assert.match(semCvv.motivo, /CVV 188/);

  const cura = await checar(ARTIGO, { legenda: comTexto(base, `${base.texto}\n\nTratamento que garante a cura.`) });
  assert.match(cura.motivo, /CFM: promessa de cura/);
});

test('reprova capa fora de 4:5, repetida ou sem o título atual', async () => {
  const horizontal = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0d3330' } }).png().toBuffer();
  const c1 = await checar(ARTIGO, { capa: { buffer: horizontal, meta: { modelo: 'capa-4x5-v1', titulo: ARTIGO.titulo } } });
  assert.match(c1.motivo, /não é 4:5/);

  const c2 = await checar(ARTIGO, { repetidos: 1 });
  assert.match(c2.motivo, /repetida/);

  const r = await renderizarCapaRedes(ARTIGO);
  const c3 = await checar(ARTIGO, { capa: { buffer: r.buffer, meta: { modelo: r.modelo, titulo: 'Título antigo' } } });
  assert.match(c3.motivo, /sem o título atual/);
});

test('reprova artigo com reescrita aprovada ainda não importada', async () => {
  // professores-saude-mental tem reescrita no lote semana-1 (backend/data/reescritas).
  const pendente = { ...ARTIGO, slug: 'professores-saude-mental', reescrita: undefined };
  const c = await checar(pendente);
  assert.match(c.motivo, /reescrita aprovada \(lote semana-1\) ainda não importada/);
});

test('relato clínico leva a declaração de narrativa composta do próprio artigo', async () => {
  const relato = {
    ...ARTIGO,
    slug: 'relato-teste',
    categoria: 'Relatos da Prática',
    conteudo: `${ARTIGO.conteudo.split('<h2>')[0]}<p>Nota sobre este relato: composição construída a partir de padrões recorrentes observados na prática clínica, sem corresponder a nenhuma pessoa real ou identificável.</p>`,
  };
  const legenda = montarLegendaInstagram(relato);
  assert.match(legenda.texto, /composição construída a partir de padrões/);
  assert.equal((await checar(relato)).aprovado, true);

  const semAviso = await checar(relato, { legenda: comTexto(legenda, legenda.texto.replace(/Nota sobre este relato[^\n]*/, '')) });
  assert.match(semAviso.motivo, /narrativa composta/);
});

test('inglês: permite burnout, online, home office e feedback; reprova o resto', async () => {
  for (const titulo of ['Burnout em professores', 'Terapia online funciona?', 'Home office e saúde mental', 'Feedback sem ansiedade']) {
    const c = await checar({ ...ARTIGO, titulo });
    assert.ok(!/inglês/.test(c.motivo || ''), `${titulo}: ${c.motivo}`);
  }
  const mindset = await checar({ ...ARTIGO, titulo: 'Mindset de crescimento no trabalho' });
  assert.match(mindset.motivo, /inglês na capa: "Mindset"/);
});

test('"Free Fire" passa como nome próprio; "free" solto não', async () => {
  const base = montarLegendaInstagram(ARTIGO);
  const jogo = await checar(ARTIGO, { legenda: comTexto(base, base.texto.replace(LINHA_BIO, `Roblox, Fortnite ou Free Fire.

` + LINHA_BIO)) });
  assert.ok(!/inglês/.test(jogo.motivo || ''), jogo.motivo);
  const solto = await checar(ARTIGO, { legenda: comTexto(base, base.texto.replace(LINHA_BIO, `Teste free.

` + LINHA_BIO)) });
  assert.match(solto.motivo, /inglês na legenda: "free"/);
});

test('selo da capa: categoria "Geral" vira o tema do título ou some', () => {
  const { textoDoSelo } = require('../../backend/lib/capaRedes');
  assert.equal(textoDoSelo({ categoria: 'Geral', titulo: 'Saúde mental de professores' }), 'Professores');
  assert.equal(textoDoSelo({ categoria: 'Geral', titulo: 'Um tema qualquer' }), '');
  // Limites de palavra (\b) dos padrões de tema — já saíram corrompidos uma vez.
  assert.equal(textoDoSelo({ categoria: 'Geral', titulo: 'Burnout em médicos' }), 'Médicos & Enfermeiros');
  assert.equal(textoDoSelo({ categoria: 'Geral', titulo: 'Quando o luto demora' }), 'Luto');
  assert.equal(textoDoSelo({ categoria: 'Geral', titulo: 'Saúde mental na APS' }), 'Atenção primária');
  const tags = montarLegendaInstagram({ ...ARTIGO, categoria: 'Geral', titulo: 'Luto no RH' }).partes.hashtags;
  assert.ok(tags.includes('#luto') && tags.includes('#saudementalnotrabalho'), tags.join(' '));
  assert.equal(textoDoSelo({ categoria: 'Luto & Divórcio', titulo: 'x' }), 'Luto & Divórcio');
});
