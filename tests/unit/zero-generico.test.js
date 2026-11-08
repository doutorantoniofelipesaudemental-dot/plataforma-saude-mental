/** Checagem "zero genérico" das redes (06/11/2026). Exemplos de aprovação e de reprovação por regra. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { checarZeroGenerico, GANCHOS_PROIBIDOS, LIMITE_SIMILARIDADE } = require('../../backend/lib/redesV2/zeroGenerico');
const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');

const CRISE = 'Em crise: CVV 188 · SAMU 192';
const CORPO = 'A insônia que persiste por mais de duas semanas merece avaliação na Atenção Primária. Sinais de alerta incluem perda de peso e humor persistentemente baixo.';
const ART = { slug: 'insonia-aps', link: 'https://www.drantoniofelipemedico.com.br/artigo/insonia-aps', publicado: true, corpo: CORPO };
const LEGENDA_BOA = `Insônia por mais de duas semanas pede avaliação, e a APS é o primeiro lugar para isso.\n\nSinais de alerta: perda de peso e humor baixo que não passa.\n\n${CRISE}\n\n${AVISO_CFM}`;
const BASE = {
  legenda: LEGENDA_BOA,
  eixo: 'E4', // segunda-feira
  artigo: ART,
  frasesClinicas: ['A insônia que persiste por mais de duas semanas merece avaliação na Atenção Primária'],
  pontos: [{ tipo: 'sinal', texto: 'perda de peso e humor baixo persistentes' }],
};
const DATA = '2026-11-09'; // segunda

test('post válido passa em todas as regras', () => {
  const r = checarZeroGenerico({ post: BASE, dataISO: DATA, historico: [] });
  assert.equal(r.aprovado, true, JSON.stringify(r.falhas));
  assert.equal(r.limite, LIMITE_SIMILARIDADE);
});

test('(a) reprova post sem artigo publicado, sem slug ou com link fora do site', () => {
  const naoPub = checarZeroGenerico({ post: { ...BASE, artigo: { ...ART, publicado: false } }, dataISO: DATA });
  assert.ok(naoPub.falhas.some((f) => f.regra === 'a-origem'));
  const linkErrado = checarZeroGenerico({ post: { ...BASE, artigo: { ...ART, link: 'https://exemplo.com/x' } }, dataISO: DATA });
  assert.ok(linkErrado.falhas.some((f) => f.regra === 'a-origem'));
});

test('(b) reprova frase clínica que não é literal do artigo', () => {
  const r = checarZeroGenerico({ post: { ...BASE, frasesClinicas: ['Insônia cura em uma semana com chá'] }, dataISO: DATA });
  assert.ok(r.falhas.some((f) => f.regra === 'b-frase-clinica'));
});

test('(b) aceita frase literal mesmo com acento e caixa diferentes', () => {
  const r = checarZeroGenerico({ post: { ...BASE, frasesClinicas: ['INSÔNIA que persiste por mais de duas semanas'] }, dataISO: DATA });
  assert.equal(r.falhas.filter((f) => f.regra === 'b-frase-clinica').length, 0);
});

test('(c) reprova post sem ponto concreto e dado sem fonte https', () => {
  const vazio = checarZeroGenerico({ post: { ...BASE, pontos: [] }, dataISO: DATA });
  assert.ok(vazio.falhas.some((f) => f.regra === 'c-ponto-concreto'));
  const semFonte = checarZeroGenerico({ post: { ...BASE, pontos: [{ tipo: 'dado', texto: '40%' }] }, dataISO: DATA });
  assert.ok(semFonte.falhas.some((f) => f.regra === 'c-ponto-concreto'));
  const comFonte = checarZeroGenerico({ post: { ...BASE, pontos: [{ tipo: 'dado', texto: '40%', fonte: 'https://doi.org/10.1000/x' }] }, dataISO: DATA });
  assert.equal(comFonte.falhas.filter((f) => f.regra === 'c-ponto-concreto').length, 0);
});

test('(d) reprova gancho da lista proibida e aceita gancho concreto', () => {
  const generico = `Você sabia que a saúde mental é importante?\n\n${CRISE}\n\n${AVISO_CFM}`;
  const r = checarZeroGenerico({ post: { ...BASE, legenda: generico }, dataISO: DATA });
  assert.ok(r.falhas.some((f) => f.regra === 'd-gancho-generico'));
  assert.ok(GANCHOS_PROIBIDOS.includes('voce sabia'));
  const ok = checarZeroGenerico({ post: BASE, dataISO: DATA });
  assert.equal(ok.falhas.filter((f) => f.regra === 'd-gancho-generico').length, 0);
});

test('(e) reprova post parecido com o das últimas 8 semanas e ignora o de fora da janela', () => {
  const hist = [{ slug: 'outro', legenda: LEGENDA_BOA, dataISO: '2026-10-20' }];
  const r = checarZeroGenerico({ post: BASE, dataISO: DATA, historico: hist });
  assert.ok(r.falhas.some((f) => f.regra === 'e-parecido'));
  assert.equal(r.similaridadeMax, 1);
  const foraJanela = checarZeroGenerico({ post: BASE, dataISO: DATA, historico: [{ slug: 'outro', legenda: LEGENDA_BOA, dataISO: '2026-08-01' }] });
  assert.equal(foraJanela.falhas.filter((f) => f.regra === 'e-parecido').length, 0);
});

test('(e) rodapé fixo igual não torna o post parecido: só o corpo conta', () => {
  const { LINHA_CREDITO, ORIENTACAO } = require('../../backend/lib/redesV2/conteudo');
  const rodape = [LINHA_CREDITO, ORIENTACAO, CRISE, AVISO_CFM, '#saudemental #cuidado'].join('\n\n');
  const legendaOutra = `Ansiedade no trabalho começa com sinais simples no dia a dia.\n\n${rodape}`;
  const hist = [{ slug: 'outro', legenda: `Insônia persistente pede avaliação na Atenção Primária sem alarme.\n\n${rodape}`, dataISO: '2026-10-20' }];
  const r = checarZeroGenerico({ post: { ...BASE, legenda: legendaOutra }, dataISO: DATA, historico: hist });
  assert.equal(r.falhas.filter((f) => f.regra === 'e-parecido').length, 0);
  assert.ok(r.similaridadeMax < LIMITE_SIMILARIDADE);
});

test('(f) reprova eixo fora do eixo do dia (segunda exige E4)', () => {
  const r = checarZeroGenerico({ post: { ...BASE, eixo: 'E1' }, dataISO: DATA });
  assert.ok(r.falhas.some((f) => f.regra === 'f-eixo-do-dia'));
  const dom = checarZeroGenerico({ post: { ...BASE, eixo: 'Relato' }, dataISO: '2026-11-08' });
  assert.equal(dom.falhas.filter((f) => f.regra === 'f-eixo-do-dia').length, 0);
});

test('(g) reprova sem CVV/SAMU ou sem o aviso de IA', () => {
  const semCrise = checarZeroGenerico({ post: { ...BASE, legenda: `Insônia.\n\n${AVISO_CFM}` }, dataISO: DATA });
  assert.ok(semCrise.falhas.some((f) => f.regra === 'g-crise'));
  const semAviso = checarZeroGenerico({ post: { ...BASE, legenda: `Insônia.\n\n${CRISE}` }, dataISO: DATA });
  assert.ok(semAviso.falhas.some((f) => f.regra === 'g-aviso'));
});
