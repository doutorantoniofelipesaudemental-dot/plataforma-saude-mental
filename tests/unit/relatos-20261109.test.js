// Ordem de 09/11/2026, 20:45: nota de ficção pelo template, caixa "Para entender", bloco CVV e triagem OMS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

const { NOTA_FICCAO_TEXTO } = require('../../backend/lib/relatos');
const { htmlRelato, tocaSuicidio, APOIO_TEXTO } = require('../../backend/lib/relatosTemplate');
const { classificarRelatoSuicidio } = require('../../backend/lib/auditoriaSuicidio');
const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');

const NOTA_EXATA =
  'Relato literário inspirado na prática clínica. Personagens, nomes, lugares e detalhes foram criados para proteger a identidade das pessoas. Qualquer semelhança é coincidência.';

const relato = (conteudo, extra = {}) => ({
  slug: 'relato-teste',
  titulo: 'Relato de teste',
  resumo: 'Resumo.',
  categoria: 'Relatos da Prática',
  conteudo,
  publicadoEm: new Date('2026-11-01'),
  atualizadoEm: new Date('2026-11-01'),
  ...extra,
});
const corpoComum = '<h2>Uma espera</h2><p>A sala estava cheia e a espera foi longa.</p>';
const corpoSuicida = '<p>Ele tentou se matar naquela noite e ninguém percebeu.</p>';

test('nota de ficção: texto exato e igual ao aprovado', () => {
  assert.equal(NOTA_FICCAO_TEXTO, NOTA_EXATA);
});

test('SSR: relato traz a nota no início, sem alterar o conteúdo', () => {
  const art = relato(corpoComum);
  const antes = art.conteudo;
  const html = renderizarArtigoHtml(art);
  assert.equal(art.conteudo, antes, 'conteudo não pode mudar');
  assert.match(html, /data-nota-ficcao/);
  assert.ok(html.includes(NOTA_EXATA), 'texto exato da nota no HTML');
  // a nota vem antes do corpo
  assert.ok(html.indexOf('data-nota-ficcao') < html.indexOf('id="artigo-conteudo"'));
});

test('SSR: artigo comum não recebe nota, caixa nem bloco de relato', () => {
  const art = relato(corpoComum, { categoria: 'Transtornos Mentais', slug: 'artigo-comum' });
  const html = renderizarArtigoHtml(art);
  assert.doesNotMatch(html, /data-nota-ficcao/);
  assert.doesNotMatch(html, /data-para-entender/);
  assert.doesNotMatch(html, /data-apoio-cvv/);
});

test('caixa "Para entender" com link para o tema e para o Blog do tema', () => {
  const r = htmlRelato(relato(corpoComum, { tema: 'transtornos-mentais' }));
  assert.match(r.paraEntender, /data-para-entender/);
  assert.match(r.paraEntender, /href="\/blog\?tema=transtornos-mentais"/);
  assert.match(r.paraEntender, /href="\/pilares\/eixo-5\.html"/);
  // o eixo do link existe no repositório
  assert.ok(fs.existsSync(path.join(RAIZ, 'public', 'pilares', 'eixo-5.html')));
});

test('caixa sem tema cai no Blog, sem link inventado', () => {
  const r = htmlRelato(relato(corpoComum));
  assert.match(r.paraEntender, /href="\/blog"/);
  assert.doesNotMatch(r.paraEntender, /pilares/);
});

test('bloco CVV 188 · SAMU 192 em relato que toca em suicídio, ausente nos demais', () => {
  assert.equal(tocaSuicidio(relato(corpoSuicida)), true);
  const r = htmlRelato(relato(corpoSuicida));
  assert.match(r.apoio, /data-apoio-cvv/);
  assert.ok(r.apoio.includes(APOIO_TEXTO));
  assert.match(APOIO_TEXTO, /CVV 188/);
  assert.match(APOIO_TEXTO, /SAMU 192/);
  assert.equal(htmlRelato(relato(corpoComum)).apoio, '');
});

test('SSR: relato sobre suicídio mostra o bloco CVV no HTML', () => {
  const html = renderizarArtigoHtml(relato(corpoSuicida));
  assert.match(html, /data-apoio-cvv/);
  assert.match(html, /CVV 188/);
});

test('triagem OMS: método/local/detalhe = ALTO; desfecho ou "cometeu" = MÉDIO; sem tema = fora', () => {
  const alto = classificarRelatoSuicidio('<p>Ele tentou suicídio: tomou todos os comprimidos da caixa no banheiro.</p>');
  assert.equal(alto.toca, true);
  assert.equal(alto.nivel, 'ALTO');
  assert.ok(alto.criterios.includes('a') || alto.criterios.includes('b') || alto.criterios.includes('c'));
  assert.ok(alto.evidencia.length > 0 && alto.evidencia.length <= 180);
  assert.ok(!/\n/.test(alto.evidencia));

  const medio = classificarRelatoSuicidio('<p>Ele se suicidou. Ninguém percebeu e não havia saída.</p>');
  assert.equal(medio.nivel, 'MÉDIO');

  const cometeu = classificarRelatoSuicidio('<p>Ela cometeu suicídio em silêncio.</p>');
  assert.equal(cometeu.nivel, 'MÉDIO');
  assert.ok(cometeu.criterios.includes('e'));

  const fora = classificarRelatoSuicidio(corpoComum);
  assert.equal(fora.toca, false);
  assert.equal(fora.nivel, '');
});

test('triagem OMS: banheiro/prédio em cena cotidiana (sem menção a suicídio por perto) não vira ALTO', () => {
  const cotidiano = '<p>Ela chorava no banheiro antes de entrar no prédio. ' + 'Texto neutro. '.repeat(60) + 'Perguntei se tinha pensado em suicídio.</p>';
  const r = classificarRelatoSuicidio(cotidiano);
  assert.equal(r.toca, true);
  assert.notEqual(r.nivel, 'ALTO');
});

test('legenda do Instagram: nota de ficção só em Relatos', () => {
  const { montarLegendaInstagram } = require('../../backend/lib/legendaInstagram');
  const texto = (categoria) =>
    montarLegendaInstagram({ titulo: 'Título', resumo: 'Um resumo curto.', categoria, conteudo: '<p>Abertura da história.</p><p>Segunda parte da história.</p>' }).texto;
  assert.ok(texto('Relatos da Prática').includes(NOTA_EXATA));
  assert.ok(!texto('Transtornos Mentais').includes(NOTA_EXATA));
});

test('carrossel: último slide (CTA) recebe a nota só em Relatos (fonte)', () => {
  const src = ler('backend/lib/carrossel.js');
  assert.match(src, /tipo: 'cta', categoria: artigo\.categoria, nota: artigo\.categoria === RELATOS \? NOTA_FICCAO_TEXTO : ''/);
  assert.match(src, /slide\.nota \? caminhoLinhas\(FONTE_SANS, quebrarLinhas\(FONTE_SANS, slide\.nota/);
});

test('cliente: nota e blocos inseridos ao redor do corpo, sem mexer no texto', () => {
  const src = ler('public/assets/js/artigo.js');
  assert.match(src, /insertAdjacentHTML\('beforebegin', bloco\.nota\)/);
  assert.match(src, /insertAdjacentHTML\('afterend', bloco\.paraEntender \+ bloco\.apoio\)/);
  assert.match(src, /conteudo\.innerHTML = artigo\.conteudo;/);
});

test('rota de detalhe inclui relatoHtml', () => {
  assert.match(ler('backend/routes/artigos.js'), /artigo\.relatoHtml = htmlRelato\(artigo\)/);
});
