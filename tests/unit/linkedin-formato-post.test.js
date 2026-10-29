const test = require('node:test');
const assert = require('node:assert/strict');
const f = require('../../scripts/linkedin/formatoPost');

const REF = 'Mata DA, Ramos MA, Bansal N, et al. Prevalence of Depression and Depressive Symptoms Among Resident Physicians: A Systematic Review and Meta-analysis. JAMA . 2015;314(22):2373-83.';

test('referência curta: Autor et al. Revista. Ano;vol(n):páginas, sem espaço antes de pontuação', () => {
  assert.equal(f.referenciaCurta(REF), 'Mata DA et al. JAMA. 2015;314(22):2373-83.');
});

test('referência com até 3 autores lista os autores', () => {
  assert.equal(f.referenciaCurta('Smith J, Doe A. Title. Lancet. 2019;12(3):45-50.'), 'Smith J, Doe A. Lancet. 2019;12(3):45-50.');
});

test('referência não reconhecida volta limpa, sem espaço antes de ponto', () => {
  assert.equal(f.referenciaCurta('Texto solto ,sem formato .'), 'Texto solto,sem formato.');
});

test('"JAMA ." não aparece mais: espaço antes de pontuação é removido', () => {
  assert.equal(f.semEspacoAntesDePontuacao('JAMA . 2015;314'), 'JAMA. 2015;314');
});

test('gancho com mais de 210 caracteres reprova', () => {
  const texto = `${'a'.repeat(211)}\n\nSinais\n• x\n\nO que ajuda, na prática\n• y`;
  assert.ok(f.validarPostNovo(texto).some((x) => /gancho/.test(x)));
});

test('hashtags: 3 a 5, nunca #psiquiatria', () => {
  assert.equal(f.validarHashtags(['#A', '#B']).length, 1);
  assert.equal(f.validarHashtags(['#A', '#B', '#C']).length, 0);
  assert.ok(f.validarHashtags(['#A', '#B', '#psiquiatria']).some((x) => /psiquiatria/.test(x)));
});

test('pergunta é determinística pelo slug e nunca pede relato', () => {
  assert.equal(f.perguntaDoSlug('x'), f.perguntaDoSlug('x'));
  for (const p of ['a', 'b', 'c', 'd']) assert.ok(!/relato|diagn|sintoma/i.test(f.perguntaDoSlug(p)));
});

test('dado numérico só entra com o número no resumo da fonte', () => {
  const resumo = 'Estudo com 1.027 residentes. A prevalência foi de 29,1%. Outra frase.';
  assert.equal(f.dadoVerificado(resumo, '29,1%'), 'A prevalência foi de 29,1%.');
  assert.equal(f.dadoVerificado(resumo, '50%'), null);
  assert.equal(f.dadoVerificado('', '29,1%'), null);
});

test('montagem: ordem do modelo, sem "Pontos práticos", link do artigo uma vez e mentoria só quando permitido', () => {
  const rodape = f.montarRodape({ identificacao: 'Dr. Antônio Felipe · Médico · CRM-BA 41322', avisoIA: 'Conteúdo com IA (Resolução CFM 2.454/2026).', hashtags: ['#A', '#B', '#C'] });
  const texto = f.montarPostNovo({
    gancho: 'Gancho curto sobre residência.', dado: null,
    sinais: ['Exaustão que não melhora', 'Isolamento'], ajuda: ['Pausa curta no plantão', 'Conversar com um colega'],
    pergunta: f.perguntaDoSlug('slug'), linkArtigo: 'https://www.drantoniofelipemedico.com.br/artigo/slug',
    mentoria: false, referencia: REF, rodape, conduta: false,
  });
  assert.ok(texto.indexOf('Sinais') < texto.indexOf('O que ajuda, na prática'));
  assert.ok(!/Pontos práticos/.test(texto));
  assert.equal((texto.match(/\/artigo\//g) || []).length, 1);
  assert.ok(!/\/mentoria/.test(texto));
  assert.deepEqual(f.validarPostNovo(texto, { hashtags: ['#A', '#B', '#C'] }), []);
});

test('montagem recusa "Sinais" com menos de 2 itens ou ajuda fora de 2 a 3', () => {
  assert.throws(() => f.montarPostNovo({ gancho: 'g', sinais: ['só um'], ajuda: ['a', 'b'], pergunta: 'p', linkArtigo: 'https://x/artigo/s', referencia: REF, rodape: 'r' }), /Sinais/);
  assert.throws(() => f.montarPostNovo({ gancho: 'g', sinais: ['a', 'b'], ajuda: ['só uma'], pergunta: 'p', linkArtigo: 'https://x/artigo/s', referencia: REF, rodape: 'r' }), /ações/);
});
