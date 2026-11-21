// Portão zero genérico: trechos fixos oficiais (aviso de IA nas duas redações, pergunta P4) não entram na
// conferência de literalidade (ordem de 21/11/2026, 00:32). Regras b, c e h continuam iguais para o corpo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { derivarFrases, avaliarZeroGenerico } = require('../../backend/lib/redesV2/zgGate');
const { AVISO_CFM, AVISO_IA_UNICO } = require('../../backend/lib/conformidadeCfm');

const CLINICA = 'Burnout moderado a grave aparece em 25% a 74% dos professores, dependendo do contexto estudado.';
const P4 = 'Como está o seu semestre, professor: o cansaço já virou rotina?';
const URL = 'https://www.drantoniofelipemedico.com.br/artigo/exemplo-de-pauta';
const ART = '<p>Burnout moderado a grave aparece em 25% a 74% dos professores, dependendo do contexto estudado.</p>';
const DOC = { slug: 'exemplo-de-pauta', publicado: true, conteudo: ART, resumo: 'Resumo qualquer sobre outro assunto.' };

const legenda = (aviso) => [
  'O adoecimento de professores é frequente, tem causas conhecidas.',
  '',
  CLINICA,
  '',
  P4,
  '',
  'Texto completo no link da bio.',
  '',
  'Em crise: CVV 188 · SAMU 192',
  '',
  aviso,
  '',
  '#saudemental',
].join('\n');

test('a pergunta P4 e o aviso de IA (redação única) não viram frase clínica', () => {
  const frases = derivarFrases(legenda(AVISO_IA_UNICO));
  assert.ok(!frases.some((f) => f.includes('Como está o seu semestre')), 'pergunta P4 ficou');
  assert.ok(!frases.some((f) => f.includes('inteligência artificial')), 'aviso de IA ficou');
  assert.ok(frases.includes(CLINICA), 'frase clínica sumiu');
});

test('o aviso antigo e o novo dão a mesma lista de frases clínicas', () => {
  assert.deepEqual(derivarFrases(legenda(AVISO_CFM)), derivarFrases(legenda(AVISO_IA_UNICO)));
});

test('controle: frase clínica que não é literal do artigo continua reprovando (regra b)', () => {
  const r = avaliarZeroGenerico({ doc: DOC, legenda: legenda(AVISO_IA_UNICO), ov: { eixo: 'E1' }, dataISO: '2026-12-10', historico: [], urlTexto: URL });
  assert.ok(!r.falhas.some((f) => f.msg.includes(CLINICA)), 'frase literal do artigo foi reprovada');
  const naoLiteral = legenda(AVISO_IA_UNICO).replace(CLINICA, 'Outra afirmação clínica que não existe no artigo, com número de 40%.');
  const r2 = avaliarZeroGenerico({ doc: DOC, legenda: naoLiteral, ov: { eixo: 'E1' }, dataISO: '2026-12-10', historico: [], urlTexto: URL });
  assert.ok(r2.falhas.some((f) => f.regra === 'b-frase-clinica' && f.msg.includes('Outra afirmação clínica')));
});
