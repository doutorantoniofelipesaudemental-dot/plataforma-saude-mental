const test = require('node:test');
const assert = require('node:assert/strict');
const { checarPost } = require('../../backend/lib/linkedinChecagem');

// Texto-base que passa em todas as regras, exceto as de tamanho e de referência, que cada teste ajusta.
const REF = 'Referência: Penttilä M, Jääskeläinen E, et al. Duration of untreated psychosis. Br J Psychiatry. 2014;205(2):88-94.';
function texto({ ref = REF, alvo = 1500 } = {}) {
  const base = [
    'Gancho sobre o cuidado na saúde mental.',
    'Sinais',
    '• Primeiro sinal',
    '• Segundo sinal',
    'O que ajuda, na prática',
    '• Ação um',
    '• Ação dois',
    'Texto completo: https://www.drantoniofelipemedico.com.br/artigo/exemplo',
    ref,
    'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.',
    'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito. Em crise: CVV 188 · SAMU 192. Conteúdo produzido com IA (Resolução CFM 2.454/2026).',
    'Dr. Antônio Felipe · Médico · CRM-BA 41322',
    'Especialista em Medicina de Família e Comunidade · RQE 26638',
  ].join('\n\n');
  return base + '\n' + 'x'.repeat(alvo - base.length - 1);
}

test('tamanho: aceita de 1.000 a 2.200 caracteres', () => {
  const falha = (t) => checarPost({ tipo: 'texto', texto: t }).some((f) => /caracteres/.test(f));
  assert.equal(falha(texto({ alvo: 1000 })), false);
  assert.equal(falha(texto({ alvo: 2200 })), false);
  assert.equal(falha(texto({ alvo: 999 })), true);
  assert.equal(falha(texto({ alvo: 2201 })), true);
});

test('referência específica (com ano) passa', () => {
  assert.equal(checarPost({ tipo: 'texto', texto: texto() }).some((f) => /referência/.test(f)), false);
});

test('referência genérica ou ausente reprova', () => {
  const generica = 'Referência: Revisão sobre intervenção precoce na psicose (ver referências do artigo).';
  assert.equal(checarPost({ tipo: 'texto', texto: texto({ ref: generica }) }).some((f) => /genérica|ausente/.test(f)), true);
  const semAno = 'Referência: Autor A. Título sem ano.';
  assert.equal(checarPost({ tipo: 'texto', texto: texto({ ref: semAno }) }).some((f) => /genérica|ausente/.test(f)), true);
  const sem = texto().replace(REF + '\n\n', '');
  assert.equal(checarPost({ tipo: 'texto', texto: sem }).some((f) => /genérica|ausente/.test(f)), true);
});
