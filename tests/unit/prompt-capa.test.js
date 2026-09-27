// Prompts de capa ilustrada (backend/lib/geradorPromptCapa.js): afirmativos,
// sem pessoas/marcas/fotorrealismo, paleta institucional, 1200×630 exato.
const { test } = require('node:test');
const assert = require('node:assert');
const sharp = require('sharp');
const g = require('../../backend/lib/geradorPromptCapa');

test('tema pelo título, com a categoria como reserva', () => {
  assert.equal(g.detectarTema('Burnout em médicos e enfermeiros', 'Médicos & Enfermeiros').id, 'burnout');
  assert.equal(g.detectarTema('Ansiedade social e medo de julgamento', 'Ansiedade Social & Timidez').id, 'ansiedade');
  assert.equal(g.detectarTema('TDAH no adulto', 'Geral').id, 'tdah');
  assert.equal(g.detectarTema('Quando pedir ajuda', 'Residentes & Estudantes').id, 'saude-profissional');
  assert.equal(g.detectarTema('Relato: o paciente invisível', 'Relatos da Prática').id, 'geral');
  // "Pacientes & Famílias" é de adultos: nada de metáfora de infância pela categoria.
  assert.equal(g.detectarTema('Autoestima: por onde começar a trabalhar de verdade', 'Pacientes & Famílias').id, 'geral');
  assert.equal(g.detectarTema('Terapia pela primeira vez: o que esperar', 'Pacientes & Famílias').id, 'geral');
  assert.equal(g.detectarTema('Disciplina positiva: colocando limites sem gritar ou punir', 'Pais & Famílias').id, 'infancia');
  assert.equal(g.detectarTema('Meu filho está mentindo: o que isso significa', 'Geral').id, 'infancia');
});

test('todo prompt montado passa no padrão, em todos os temas e formatos', () => {
  const titulos = [...g.TEMAS.map((t) => t.id.replace('-', ' ')), 'Burnout', 'Insônia', 'Luto', 'Título sem tema'];
  for (const formato of Object.keys(g.FORMATOS)) {
    for (const titulo of titulos) {
      const r = g.montarPromptCapa({ titulo, categoria: 'Geral', formato });
      assert.deepEqual(g.verificarPrompt(r.prompt), [], `${formato} · ${titulo}`);
      assert.match(r.prompt, /#0d3330/);
      assert.match(r.prompt, /#faf7f2/);
      assert.match(r.prompt, /claymorphism/);
      assert.match(r.prompt, /text-free/);
    }
  }
  const artigo = g.montarPromptCapa({ titulo: 'Burnout', categoria: 'Geral' });
  assert.deepEqual([artigo.largura, artigo.altura], [1200, 630]);
  const vertical = g.montarPromptCapa({ titulo: 'Burnout', categoria: 'Geral', formato: 'video-vertical' });
  assert.deepEqual([vertical.largura, vertical.altura, vertical.proporcaoGerador], [1080, 1920, '9:16']);
});

test('a trava reprova o template original do prompt mestre (negação, estúdio, --ar, 8k)', () => {
  const original =
    '3D stylized conceptual artwork, anime/Ghibli aesthetic, a glowing stylized 3D brain. Pixar style, no realistic human faces, rendered in Octane Render 3D style, 8k resolution --ar 16:9';
  const falhas = g.verificarPrompt(original).join('\n');
  assert.match(falhas, /negação/);
  assert.match(falhas, /marca, estúdio ou motor/);
  assert.match(falhas, /pessoa descrita/);
  assert.match(falhas, /sintaxe de outro gerador/);
  assert.match(g.verificarPrompt('A photorealistic portrait').join(), /fotorrealismo/);
});

test('4:5 (carrossel/feed) não tem capa ilustrada; formato desconhecido falha', () => {
  assert.throws(() => g.montarPromptCapa({ titulo: 'x', formato: 'carrossel' }), /tipográficos e validados por hash/);
  assert.throws(() => g.montarPromptCapa({ titulo: 'x', formato: '4:5' }), /tipográficos/);
  assert.throws(() => g.montarPromptCapa({ titulo: 'x', formato: 'quadrado' }), /desconhecido/);
});

test('imagem gerada em 16:9 sai exatamente 1200×630', async () => {
  const gerada = await sharp({ create: { width: 1344, height: 768, channels: 3, background: '#0d3330' } }).png().toBuffer();
  const meta = await sharp(await g.ajustarDimensao(gerada, 'artigo')).metadata();
  assert.deepEqual([meta.width, meta.height], [1200, 630]);
});
