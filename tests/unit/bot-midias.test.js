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
      titulos: ['sinais', 'causas', 'cuidado', 'gestão', 'apoio'].map((t) => `Ansiedade no trabalho: ${t}`),
      shorts: [1, 2].map(() => ({
        titulo: 'Ansiedade no trabalho: sinais',
        gancho: 'G',
        desenvolvimento: 'D',
        cta: 'C',
        descricao: 'Ansiedade no trabalho tem sinais que dá para reconhecer. Veja quando buscar ajuda.',
        tags: ['ansiedade', 'trabalho', 'saúde mental', 'estresse no trabalho', 'burnout'],
      })),
      longo: {
        titulo: 'Ansiedade no trabalho: o que observar',
        descricao: 'Ansiedade no trabalho aparece no corpo e na rotina. Neste vídeo, os sinais e os caminhos de cuidado.',
        tags: ['ansiedade', 'trabalho', 'saúde mental', 'estresse', 'burnout', 'rh', 'gestão', 'cuidado'],
        capitulos: [
          { tempo: '0:00', titulo: 'Abertura' },
          { tempo: '1:30', titulo: 'Sinais' },
          { tempo: '6:00', titulo: 'Cuidado' },
        ],
        roteiro: [
          { tempo: '0:00–0:30', bloco: 'gancho', fala: 'Fala.', bRoll: 'mesa de trabalho', textoTela: 'Sinais de alerta' },
          { tempo: '0:30–9:00', bloco: 'conteúdo', fala: 'Fala.', bRoll: 'escritório vazio', textoTela: 'Cuidado' },
        ],
      },
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
  const pequeno = verificar(rascunho({ legenda: 'Durma 8 horas.\n\n🔗 Artigo completo no link da bio\n\nCVV 188 (24h)\n\n#saudemental #ansiedade #trabalho' }), ARTIGO, FONTE).join('\n');
  assert.match(pequeno, /números que não estão no artigo: 8/, 'número pequeno inventado também é acusado');
  const contagem = verificar(rascunho({ ganchos: ['6 sinais de alerta', 'b', 'c', 'd', 'e'] }), ARTIGO, FONTE).join('\n');
  assert.doesNotMatch(contagem, /números/, 'contagem de estrutura não é dado');
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
  const r = rascunho();
  r.youtube = { ...r.youtube, titulos: ['T'], shorts: [] };
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

test('revisor recebe só o que o modelo escreveu, cada frase com a peça de origem', () => {
  const { pecasDoRascunho } = require('../../scripts/bot-gemini');
  const r = rascunho({ legenda: 'Gancho da legenda.\n\nParágrafo do modelo.\n\n🔗 Artigo completo no link da bio\n\nSe precisar de apoio: CVV 188\n\n#saudemental #ansiedade #trabalho' });
  const pecas = pecasDoRascunho(r);
  const legenda = pecas.filter((p) => p.id.startsWith('legenda')).map((p) => p.texto);
  assert.deepEqual(legenda, ['Gancho da legenda.', 'Parágrafo do modelo.']);
  assert.ok(pecas.some((p) => p.id === 'slide 1'));
  assert.ok(!pecas.some((p) => /CVV 188|CRM-BA|link da bio/.test(p.texto)), 'linhas fixas ficam de fora');
});

test('abrir e salvar no editor (CRLF, BOM, espaço no fim) não conta como edição', () => {
  const { hashTexto } = require('../../scripts/bot-gemini');
  const original = '# RASCUNHO\n\n| 5 | Texto do slide |\n';
  assert.equal(hashTexto(`﻿${original.replace(/\n/g, '\r\n')}  `), hashTexto(original));
  assert.notEqual(hashTexto(original.replace('Texto', 'Outro texto')), hashTexto(original));
});

test('publicador: legenda ganha identificação e aviso CFM antes das hashtags; bloqueia hashtag de marca', () => {
  const { montarLegenda, checarTexto } = require('../../scripts/bot-publicar');
  const { IDENTIFICACAO } = require('../../backend/lib/legendaInstagram');
  const { AVISO_CFM } = require('../../scripts/bot-gemini');
  const legenda = montarLegenda('Gancho.\n\nTexto.\n\n🔗 Artigo completo no link da bio\n\nSe precisar de apoio: CVV 188\n\n#saudemental #ansiedade #trabalho');
  assert.ok(legenda.includes(`${IDENTIFICACAO}\n\n${AVISO_CFM}\n\n#saudemental`), 'identificação e aviso logo antes das hashtags');

  const aprovado = { slides: [...Array(7)].map(() => ({ texto: 'Slide curto em português.' })) };
  assert.deepEqual(checarTexto({ aprovado, legenda, artigo: ARTIGO }), []);
  const comMarca = legenda.replace('#trabalho', '#DrAntomioFelipe');
  assert.match(checarTexto({ aprovado, legenda: comMarca, artigo: ARTIGO }).join('\n'), /hashtag de marca "#DrAntomioFelipe"/);
});

test('YouTube: SEO e estrutura do vídeo longo', () => {
  const { verificarYoutube } = require('../../scripts/bot-gemini');
  const yt = rascunho().youtube;
  assert.deepEqual(verificarYoutube(yt), []);

  const ruim = JSON.parse(JSON.stringify(yt));
  ruim.longo.titulo = 'Um título de vídeo longo que passa bastante do limite de sessenta';
  ruim.longo.descricao = 'Veja em https://exemplo.com.';
  ruim.longo.capitulos = [{ tempo: '0:05', titulo: 'A' }, { tempo: '0:10', titulo: 'B' }];
  ruim.longo.roteiro = [{ tempo: '0:00–3:00', bloco: 'x', fala: 'y', bRoll: '', textoTela: 'z' }];
  ruim.shorts[0].tags = ['a'];
  const alertas = verificarYoutube(ruim).join('\n');
  assert.match(alertas, /título com \d+ caracteres/);
  assert.match(alertas, /link na descrição/);
  assert.match(alertas, /2 capítulos \(mínimo 3/);
  assert.match(alertas, /1º capítulo precisa começar em 0:00/);
  assert.match(alertas, /capítulo 2 a menos de 10 s/);
  assert.match(alertas, /YouTube longo com 3 min \(8 a 12\)/);
  assert.match(alertas, /bloco 1 sem B-roll/);
  assert.match(alertas, /Short 1: 1 tags \(5 a 12\)/);
});

test('lista numerada não é número inventado; tags coladas e em inglês viram alerta', () => {
  const { verificarYoutube } = require('../../scripts/bot-gemini');
  const r = rascunho();
  r.linkedin[0].texto = 'Três frentes:\n1. Cuidado individual\n2. Pares\n3. Instituição\nLeia o artigo completo no site.';
  assert.deepEqual(verificar(r, ARTIGO, FONTE), []);

  const yt = rascunho().youtube;
  yt.longo.tags = ['atencaoprimaria', 'saudework', 'saúde mental', 'burnout', 'aps', 'médicos', 'enfermagem', 'cuidado'];
  const alertas = verificarYoutube(yt).join('\n');
  assert.match(alertas, /tags coladas como hashtag \(atencaoprimaria\)/);
  assert.match(alertas, /tag com inglês \("saudework"\)/);
});
