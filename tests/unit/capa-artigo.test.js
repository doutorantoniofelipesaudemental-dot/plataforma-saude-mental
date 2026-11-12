const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const cap = require('../../backend/lib/capaArtigo');
const { TEMAS, RELATOS } = require('../../backend/lib/temas');

const CORPO = '#1B1B1B';

function luminancia(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const base = (extra) => ({
  titulo: 'Título de teste para a capa',
  resumo: 'Resumo do artigo de teste para a capa, com frase suficientemente longa.',
  categoria: 'Crianças',
  tema: 'infancia-familia',
  tempoLeitura: 3,
  ...extra,
});

test('todo tema tem tom claro com contraste AAA (>= 7:1) para o texto #1B1B1B', () => {
  for (const t of TEMAS) {
    const cor = cap.PALETA_TEMA[t.slug];
    assert.ok(cor, `sem cor para ${t.slug}`);
    assert.ok(contraste(cor, CORPO) >= 7, `${t.slug} ${cor} abaixo de 7:1`);
  }
  assert.ok(contraste('#faf7f2', CORPO) >= 7, 'papel do relato abaixo de 7:1');
});

test('cada tema tem um ícone CC0 próprio, existente e sem repetição', () => {
  const nomes = TEMAS.map((t) => cap.ICONE_TEMA[t.slug]);
  assert.equal(new Set(nomes).size, TEMAS.length, 'ícone repetido entre temas');
  for (const n of nomes) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'backend', 'assets', 'icones-cc0', n)), `falta ${n}`);
  }
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'backend', 'assets', 'icones-cc0', 'LICENSE-3dicons-CC0.txt')));
});

test('dado-chave só com marcador de referência que aponta para entrada identificável', () => {
  const conteudo = '<p>Uma meta-análise estimou depressão em cerca de 20% dos migrantes por trabalho, e mais entre refugiados<sup>2</sup>.</p>' +
    '<h2>Referências</h2><ol><li>Polanczyk GV, Salum GA, 2015. Título A.</li>' +
    '<li>Lindert J, 2009. Título B.</li></ol>';
  const v = cap.dadoChave(base({ conteudo, slug: 'estresse-migratorio-adaptacao-cultural' }));
  assert.ok(v, 'deveria haver dado-chave');
  assert.equal(v.numero, '20%');
  assert.equal(v.fonte, 'Lindert, 2009');
});

test('dado-chave exige artigo VERIFICADO na fonte: sem slug na lista, usa frase-chave', () => {
  const conteudo = '<p>Um estudo mostrou que cerca de 13% das crianças têm transtorno mental<sup>2</sup>.</p>' +
    '<h2>Referências</h2><ol><li>Polanczyk GV, Salum GA, 2015. Título A.</li>' +
    '<li>Kessler RC, 2005. Título B.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo })), null);
  assert.equal(cap.dadoChave(base({ conteudo, slug: 'artigo-nao-verificado' })), null);
});

test('dado verificado com fonte ou frase diferente do texto atual não vira dado-chave', () => {
  // Texto ainda com a referência errada (Cox, 1987): só entra depois da correção aprovada em staging.
  const conteudo = '<p>No Brasil, um estudo de validação em Pelotas avaliou vários pontos de corte: acima de 13 pontos, a especificidade foi de 88% e a sensibilidade de 60%<sup>2</sup>.</p>' +
    '<h2>Referências</h2><ol><li>Cox JL, Holden JM, 1987. Título.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo, slug: 'saude-mental-perinatal-consulta' })), null);
});

test('frase verificada que o texto atual não reproduz exatamente fica de fora', () => {
  // Mata 2015: o texto atual ainda tem a cláusula sem fonte; a lista só aceita a frase corrigida.
  const conteudo = '<p>Uma meta-análise estimou que cerca de 29% dos médicos residentes apresentam depressão ou sintomas depressivos, e entre estudantes de medicina a proporção é parecida<sup>2</sup>.</p>' +
    '<h2>Referências</h2><ol><li>Mata DA, Ramos MA, 2015. Título.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo, slug: 'saude-mental-residencia' })), null);
});

test('sem marcador <sup>, não há dado-chave mesmo com número e referências', () => {
  const conteudo = '<p>Cerca de 13% das crianças têm transtorno mental.</p>' +
    '<h2>Referências</h2><ol><li>Polanczyk GV, 2015. Título.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo })), null);
});

test('tamanho de amostra ("10 mil pessoas") não vira dado-chave', () => {
  const conteudo = '<p>Um estudo com mais de 10 mil adolescentes mostrou resultados.<sup>1</sup></p>' +
    '<h2>Referências</h2><ol><li>Riehm, 2019. Título.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo })), null);
});

test('palavra de alarme não entra na capa (CFM 2.336/2023)', () => {
  const conteudo = '<p>Um dado chocante: 40% dos casos passam sem diagnóstico.<sup>1</sup></p>' +
    '<h2>Referências</h2><ol><li>Autor, 2020. Título.</li></ol>';
  assert.equal(cap.dadoChave(base({ conteudo })), null);
  const v = cap.escolherVisual(base({ conteudo, resumo: 'Um resumo sem termos de alarme e com tamanho razoável.' }));
  assert.notEqual(v.frase && /chocante/i.test(v.frase), true);
});

test('relato usa papel próprio e etiqueta "Relato literário"', () => {
  const v = cap.escolherVisual(base({ categoria: RELATOS, conteudo: '<p>Ele já tinha passado por mim umas seis vezes, sem que eu visse.</p>' }));
  assert.equal(v.tipo, 'relato');
  assert.equal(v.cor, '#faf7f2');
  assert.equal(v.rotulo, 'Relato literário');
});

test('SVG da capa não usa gradiente e tem o selo de áudio', () => {
  const svg = cap.montarSvgCapaArtigo(base({ conteudo: '<p>Texto.</p>' }), { formato: 'og' });
  assert.ok(!/gradient/i.test(svg), 'não pode haver gradiente');
  assert.ok(svg.includes('#C9A227'), 'filete do selo de áudio ausente');
  assert.ok(svg.includes('width="1200" height="630"'));
  const blog = cap.montarSvgCapaArtigo(base({ conteudo: '<p>Texto.</p>' }), { formato: 'blog' });
  assert.ok(blog.includes('width="1200" height="800"'));
});

test('texto alternativo cita o título e o tipo da capa', () => {
  const alt = cap.altCapa(base({ conteudo: '<p>Texto.</p>' }));
  assert.ok(alt.includes('Título de teste para a capa'));
  assert.ok(alt.includes('Tema'));
});

test('renderização gera PNG com as dimensões do formato', async () => {
  const png = await cap.renderizarCapaArtigo(base({ conteudo: '<p>Texto.</p>' }), { formato: 'blog' });
  const meta = await sharp(png).metadata();
  assert.equal(meta.format, 'png');
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 800);
});
