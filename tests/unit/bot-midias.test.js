// Bot de mídias (scripts/bot-gemini.js) e cliente de LLM (backend/lib/llm.js),
// sem chamar nenhuma API: o rascunho é um objeto fixo e a verificação roda sobre ele.
const { test } = require('node:test');
const assert = require('node:assert');
const { verificar } = require('../../scripts/bot-gemini');

const ARTIGO = {
  slug: 'teste',
  titulo: 'Ansiedade no trabalho',
  resumo: 'O que observar.',
  categoria: 'Empresas & RH',
  conteudo: '<p>Uma revisão encontrou ansiedade em 38% a 41% dos trabalhadores.</p>',
};
const FONTE = `${ARTIGO.titulo} ${ARTIGO.resumo} Uma revisão encontrou ansiedade em 38% a 41% dos trabalhadores.`;

function rascunho(ajustes = {}) {
  return {
    ganchos: ['Ansiedade no trabalho tem sinais claros', 'a', 'b', 'c', 'd'],
    carrossel: [...Array(7)].map((_, i) => ({ texto: i === 6 ? 'Precisa de apoio agora? CVV 188 · SAMU 192' : `Slide ${i + 1} sobre ansiedade de 38% a 41%`, visual: 'fundo verde' })),
    legenda: 'Gancho.\n\nTexto.\n\n🔗 Artigo completo no link da bio\n\nCVV 188\n\n#saudemental #ansiedade #saudementalnotrabalho',
    reels: [1, 2].map(() => ({ titulo: 'R', duracaoSegundos: 30, cenas: [{ tempo: '0–3 s', cena: 'mesa', textoTela: 'Sinais de alerta', fala: 'Fala.' }] })),
    stories: [1, 2, 3, 4, 5].map(() => ({ texto: 'Enquete', recurso: 'enquete' })),
    linkedin: ['autoridade', 'educativo'].map((tipo) => ({ tipo, texto: 'Post curto.\nLeia o artigo completo no site.' })),
    youtube: {
      titulos: [1, 2, 3, 4, 5].map((n) => `Ansiedade no trabalho: sinal ${n}`),
      shorts: [1, 2].map(() => ({ titulo: 'S', gancho: 'G', desenvolvimento: 'D', cta: 'C' })),
    },
    ...ajustes,
  };
}

test('rascunho fiel e dentro das regras não gera alerta', () => {
  assert.deepEqual(verificar(rascunho(), ARTIGO, FONTE), []);
});

test('alerta número inventado, termo do CFM, "Antonio" e inglês nas artes', () => {
  const r = rascunho({
    ganchos: ['70% dos trabalhadores sofrem', 'Mindset para trabalhar melhor', 'c', 'd', 'e'],
    legenda: 'Dr. Antonio Felipe garante a cura.\n\n🔗 Artigo completo no link da bio\n\nCVV 188\n\n#saudemental #ansiedade #trabalho',
  });
  const alertas = verificar(r, ARTIGO, FONTE).join('\n');
  assert.match(alertas, /números que não estão no artigo: 70/);
  assert.match(alertas, /CFM: promessa de cura/);
  assert.match(alertas, /"Antonio" sem acento/);
  assert.match(alertas, /inglês nas artes: "Mindset"/);
});

test('alerta limites de tamanho e CVV ausente em tema sensível', () => {
  const r = rascunho({
    ganchos: ['um dois três quatro cinco seis sete oito nove dez onze', 'b', 'c', 'd', 'e'],
    carrossel: [...Array(5)].map(() => ({ texto: 'Slide curto', visual: 'x' })),
    legenda: 'Sem apoio.\n\n🔗 Artigo completo no link da bio\n\n#saudemental #ansiedade #trabalho',
  });
  const alertas = verificar(r, ARTIGO, FONTE).join('\n');
  assert.match(alertas, /gancho 1 com 11 palavras/);
  assert.match(alertas, /carrossel com 5 slides/);
  assert.match(alertas, /legenda sem CVV 188/);
  assert.match(alertas, /último slide sem CVV 188/);
});

test('alerta faixa citada só pelo teto e quantidade errada; CVV entra pelo código', () => {
  const { garantirLinhasFixas } = require('../../scripts/bot-gemini');
  const r = rascunho({ youtube: { titulos: ['T'], shorts: [] } });
  r.stories[0].texto = 'O burnout atinge até 41% dos trabalhadores.';
  const alertas = verificar(r, ARTIGO, FONTE).join('\n');
  assert.match(alertas, /só pelo limite de cima/);
  assert.match(alertas, /1 títulos \(esperado 5\)/);
  assert.match(alertas, /0 shorts \(esperado 2\)/);

  const semApoio = rascunho({ legenda: 'Gancho.\n\n🔗 Artigo completo no link da bio\n\n#saudemental #ansiedade #trabalho' });
  semApoio.carrossel.at(-1).texto = 'Leia o artigo.';
  garantirLinhasFixas(semApoio, ARTIGO);
  assert.match(semApoio.legenda, /CVV 188[\s\S]*#saudemental/, 'CVV antes das hashtags');
  assert.match(semApoio.carrossel.at(-1).texto, /CVV 188 · SAMU 192/);
});

test('cliente de LLM sem nenhuma chave explica o que falta', async () => {
  const antes = { g: process.env.GEMINI_API_KEY, q: process.env.GROQ_API_KEY };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  const { gerarJson } = require('../../backend/lib/llm');
  await assert.rejects(gerarJson({ sistema: 's', usuario: 'u', schema: {} }), /GEMINI_API_KEY e\/ou GROQ_API_KEY/);
  if (antes.g !== undefined) process.env.GEMINI_API_KEY = antes.g;
  if (antes.q !== undefined) process.env.GROQ_API_KEY = antes.q;
});
