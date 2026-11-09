/** Pendências da prévia 11–17/11 (ordem de 08/11/2026, itens A2, A3, A4): texto padrão, trecho entre aspas, referência nomeada, rótulo "Para refletir", 5 linhas nas legendas. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { checarZeroGenerico, ehTextoPadrao, TEXTOS_PADRAO_SEGURANCA } = require('../../backend/lib/redesV2/zeroGenerico');
const { temReferenciaNomeada, ROTULOS, checarLamina } = require('../../backend/lib/redesV2/checagemArte');
const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/identificacaoCfm');
const { montarLegendaInstagram } = require('../../backend/lib/legendaInstagram');
const { montarLegenda } = require('../../backend/lib/carrossel');
const { LINHAS_SOCIAL } = require('../../backend/lib/checagensAprovacao');

const CORPO = '<p>A NR-1 inclui o assédio entre os riscos psicossociais que devem ser gerenciados.</p><p>Dawes et al. (2016) mostraram que depois da cirurgia a prevalência de depressão diminui.</p>';
const post = (pontos) => ({
  eixo: 'E6', tipo: 'artigo', slug: 'assedio-sexual-trabalho-prevencao', legenda: 'Gancho.\n\nCorpo.\n\nTexto completo no link da bio.',
  frasesClinicas: [], pontos,
  artigo: { publicado: true, slug: 'assedio-sexual-trabalho-prevencao', link: 'https://www.drantoniofelipemedico.com.br/artigo/assedio-sexual-trabalho-prevencao', corpo: CORPO, resumo: '' },
});
const semFalhaDeConcreto = (pontos) => checarZeroGenerico({ post: post(pontos), dataISO: '2026-11-16', historico: [] }).falhas.filter((f) => /ponto concreto/.test(f.msg));

test('texto padrão de segurança é isento da literalidade (lista aprovada)', () => {
  assert.ok(TEXTOS_PADRAO_SEGURANCA.includes('Se surgirem pensamentos de morte, procure ajuda: CVV 188 · SAMU 192.'));
  assert.equal(ehTextoPadrao('Se surgirem pensamentos de morte, procure ajuda: CVV 188 · SAMU 192.'), true);
  assert.equal(semFalhaDeConcreto([{ tipo: 'passo', texto: 'Se surgirem pensamentos de morte, procure ajuda: CVV 188 · SAMU 192.' }]).length, 0);
});

test('trecho entre «aspas» é comparado sozinho: literal passa, fora do artigo reprova', () => {
  assert.equal(semFalhaDeConcreto([{ tipo: 'sinal', texto:'Segundo a NR-1 (Portaria MTE 1.419/2024): «inclui o assédio entre os riscos psicossociais que devem ser gerenciados»' }]).length, 0);
  assert.equal(semFalhaDeConcreto([{ tipo: 'sinal', texto: 'Segundo Dawes et al., 2016: «depois da cirurgia, a prevalência de depressão e a intensidade dos sintomas costumam diminuir»' }]).length, 1);
});

test('referência nomeada aceita autor et al., ano e norma com número e ano', () => {
  assert.equal(temReferenciaNomeada('Segundo a NR-1 (Portaria MTE 1.419/2024): «x»'), true);
  assert.equal(temReferenciaNomeada('Segundo Harrison et al. (2016): «x»'), true);
  assert.equal(temReferenciaNomeada('A NR-1 inclui o assédio.'), false);
});

test('rótulo "Para refletir" existe e passa na checagem de lâmina', () => {
  assert.ok(ROTULOS.includes('Para refletir'));
  const r = checarLamina({ n: 2, tituloPx: null, corpoPx: 48, palavras: 12, corCorpo: '#1B1B1B', fundo: '#E8EAEC', transbordou: false, fonteOk: true, iconeOk: true, colisoes: 0, rodape: { crm: true, rqe: true, assinatura3: true }, rotulo: 'Para refletir', corpoTexto: 'Seu Carlos não está sozinho nessa experiência.' });
  assert.equal(r.aprovado, true, JSON.stringify(r.falhas));
});

test('legendas do Instagram, do carrossel e as checagens sociais usam as 5 linhas', () => {
  const artigo = { titulo: 'Sono e cuidado', resumo: 'Como o sono muda.', categoria: 'Geral', conteudo: '<p>Dormir mal cansa.</p>' };
  assert.ok(montarLegendaInstagram(artigo).texto.includes(IDENTIFICACAO_COMPLETA));
  assert.ok(montarLegenda(artigo, []).texto.includes(IDENTIFICACAO_COMPLETA));
  assert.equal(LINHAS_SOCIAL.length, 5);
});

test('ícones: todo ícone usado está no banco CC0 com licença, e nenhum repete na semana (ordem de 08/11, item 5)', () => {
  const { ICONE_POR_TEMA, BANCO_ICONES_CC0 } = require('../../backend/lib/redesV2/arteEditorial');
  const usados = Object.values(ICONE_POR_TEMA);
  assert.equal(new Set(usados).size, usados.length, 'ícone repetido entre os temas da semana');
  for (const i of usados) assert.ok(BANCO_ICONES_CC0[i], 'sem licença registrada: ' + i);
  assert.ok(!usados.includes('hand.png'), 'polegar não pode ser usado');
});
