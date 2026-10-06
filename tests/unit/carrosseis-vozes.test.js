// Narração dos carrosséis: cada fala do mapa `voiceovers` aponta para um MP3 que existe e para um slide que existe;
// no modo de revisão (?revisao=1), o mapa alternativo `voiceoversAlt` cobre exatamente os mesmos slides.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM');
const PASTA = path.join(RAIZ, 'carrosseis');
const arquivos = fs.readdirSync(PASTA).filter((f) => /^pacote-\d{3}-.+\.html$/.test(f));

function config(arquivo) {
  const html = fs.readFileSync(path.join(PASTA, arquivo), 'utf8');
  const m = html.match(/CarrosselAnimado\.init\((\{[\s\S]*\})\);/);
  assert.ok(m, `${arquivo}: não achei o CarrosselAnimado.init`);
  return JSON.parse(m[1]);
}
const existe = (url) => fs.existsSync(path.join(PASTA, url));

test('os 114 carrosséis existem, um por pacote', () => {
  const numeros = arquivos.map((f) => Number(f.slice(7, 10))).sort((a, b) => a - b);
  assert.deepStrictEqual(numeros, Array.from({ length: 114 }, (_, i) => i + 1));
});

test('todas as falas (voiceovers) apontam para MP3 existente e para um slide existente', () => {
  for (const arq of arquivos) {
    const cfg = config(arq);
    const falas = cfg.voiceovers || {};
    assert.ok(Object.keys(falas).length > 0, `${arq}: sem narração`);
    for (const [i, url] of Object.entries(falas)) {
      assert.ok(Number(i) < cfg.slides.length, `${arq}: fala do slide ${i}, que não existe`);
      assert.ok(existe(url), `${arq}: falta ${url}`);
    }
  }
});

test('modo de revisão: voiceoversAlt cobre os mesmos slides, com MP3 existente e voz diferente', () => {
  let comAlt = 0;
  for (const arq of arquivos) {
    const cfg = config(arq);
    if (!cfg.voiceoversAlt) continue;
    comAlt++;
    assert.deepStrictEqual(Object.keys(cfg.voiceoversAlt).sort(), Object.keys(cfg.voiceovers).sort(), `${arq}: slides diferentes entre as vozes`);
    for (const [i, url] of Object.entries(cfg.voiceoversAlt)) {
      assert.ok(existe(url), `${arq}: falta ${url}`);
      assert.notStrictEqual(url, cfg.voiceovers[i], `${arq}: as duas vozes apontam para o mesmo arquivo no slide ${i}`);
    }
    assert.ok(cfg.vozes && cfg.vozes.principal && cfg.vozes.alternativa, `${arq}: faltam os nomes das vozes`);
  }
  assert.strictEqual(comAlt, 28, 'os 28 carrosséis sensíveis devem ter o modo de revisão');
});

test('o motor expõe o modo de revisão só com ?revisao=1 e o AudioPlayer sabe trocar o mapa de falas', () => {
  const motor = fs.readFileSync(path.join(RAIZ, 'interativos', 'js', 'CarrosselAnimado.js'), 'utf8');
  const player = fs.readFileSync(path.join(RAIZ, 'interativos', 'js', 'AudioPlayer.js'), 'utf8');
  assert.ok(/revisao=1/.test(motor) && /voiceoversAlt/.test(motor), 'motor sem o modo de revisão');
  assert.ok(/AudioPlayer\.prototype\.setVoiceovers/.test(player), 'AudioPlayer sem setVoiceovers');
});
