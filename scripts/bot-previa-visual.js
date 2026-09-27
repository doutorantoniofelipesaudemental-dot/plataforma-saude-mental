#!/usr/bin/env node
/**
 * Prévia visual ANTES da aprovação (CLAUDE.md, 20-undecies).
 *
 *   npm run bot:previa-visual -- --slug=<slug>
 *
 * 1. Desenha os slides do carrossel do pacote (rascunho ou aprovado) e confere
 *    cada PNG: 1080 × 1350.
 * 2. Se existir vídeo em <slug>-videos/*.mp4, confere 1080 × 1920 (ffprobe) e
 *    tira um quadro do meio de cada vídeo.
 * 3. Monta uma folha de contato (HTML) com slides e quadros e fotografa com o
 *    Playwright (Chromium) → <pasta do pacote>/<slug>-previa.png, para o
 *    médico ver o conjunto de uma vez antes do `bot:aprovar`.
 * Sai com código 1 se alguma dimensão estiver errada. Não aprova nem publica.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { chromium } = require('@playwright/test');
const { lerAprovado, renderizarSlides } = require('../backend/lib/carrosselAprovado');

const RAIZ = path.join(__dirname, '..');
const PASTAS = ['aprovados', 'publicados', 'rascunhos'].map((p) => path.join(RAIZ, 'CONTEUDO_INSTAGRAM', p));
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_BIN || 'ffprobe';
const SLIDE = { largura: 1080, altura: 1350 };
const REEL = { largura: 1080, altura: 1920 };

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

/** Falhas de dimensão de uma lista de {nome, largura, altura} contra o esperado. */
function conferirDimensoes(itens, esperado) {
  return itens
    .filter((i) => i.largura !== esperado.largura || i.altura !== esperado.altura)
    .map((i) => `${i.nome}: ${i.largura}×${i.altura} (esperado ${esperado.largura}×${esperado.altura})`);
}

function dimensoesVideo(arquivo) {
  const saida = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation:format=duration', '-of', 'json', arquivo], { encoding: 'utf8' });
  const j = JSON.parse(saida);
  const s = j.streams[0] || {};
  const rotacao = Math.abs(Number((s.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation || 0));
  const [largura, altura] = rotacao === 90 || rotacao === 270 ? [s.height, s.width] : [s.width, s.height];
  return { largura, altura, duracao: Number(j.format?.duration) || 0 };
}

function folhaHtml(slides, quadros, titulo) {
  const img = (src, legenda, classe) => `<figure class="${classe}"><img src="${src}" alt=""><figcaption>${legenda}</figcaption></figure>`;
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
    body{margin:0;padding:48px;background:#faf7f2;font:16px/1.5 Inter,system-ui,sans-serif;color:#0d3330}
    h1{font:600 28px/1.2 Georgia,serif;letter-spacing:-0.01em;margin:0 0 8px}
    p{margin:0 0 32px;opacity:.7}
    .grade{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
    figure{margin:0}
    .slide img{width:216px;height:270px;display:block;border:1px solid #d9e2dd;border-radius:8px}
    .quadro img{width:152px;height:270px;display:block;border:1px solid #d9e2dd;border-radius:8px}
    figcaption{font-size:13px;opacity:.7;margin-top:8px}
  </style><h1>${titulo}</h1><p>Prévia antes da aprovação: ${slides.length} slides${quadros.length ? ` · ${quadros.length} vídeo(s)` : ''}. Nada foi aprovado nem publicado.</p>
  <div class="grade">${slides.map((s) => img(s.src, s.nome, 'slide')).join('')}${quadros.map((q) => img(q.src, q.nome, 'quadro')).join('')}</div></html>`;
}

async function main() {
  const { slug } = argumentos();
  if (!slug) throw new Error('use --slug=<slug>');
  const pasta = PASTAS.find((p) => fs.existsSync(path.join(p, `${slug}.md`)));
  if (!pasta) throw new Error(`pacote "${slug}" não encontrado em aprovados/, publicados/ nem rascunhos/`);

  const aprovado = lerAprovado(fs.readFileSync(path.join(pasta, `${slug}.md`), 'utf8'));
  const renderizados = await renderizarSlides(aprovado);
  const slides = await Promise.all(
    renderizados.map(async (s, i) => {
      const meta = await sharp(s.buffer).metadata();
      return { nome: `slide ${i + 1}`, largura: meta.width, altura: meta.height, src: `data:image/png;base64,${s.buffer.toString('base64')}` };
    })
  );
  const falhas = conferirDimensoes(slides, SLIDE);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'previa-visual-'));
  const quadros = [];
  try {
    const pastaVideos = path.join(pasta, `${slug}-videos`);
    const videos = fs.existsSync(pastaVideos) ? fs.readdirSync(pastaVideos).filter((f) => /\.mp4$/i.test(f)) : [];
    for (const v of videos) {
      const arquivo = path.join(pastaVideos, v);
      const d = dimensoesVideo(arquivo);
      falhas.push(...conferirDimensoes([{ nome: v, ...d }], REEL));
      const quadro = path.join(tmp, `${v}.png`);
      execFileSync(FFMPEG, ['-v', 'error', '-y', '-ss', (d.duracao / 2).toFixed(2), '-i', arquivo, '-frames:v', '1', quadro]);
      quadros.push({ nome: `${v} (${Math.round(d.duracao)} s)`, src: `data:image/png;base64,${fs.readFileSync(quadro).toString('base64')}` });
    }

    const navegador = await chromium.launch();
    try {
      const pagina = await navegador.newPage({ viewport: { width: 1320, height: 800 }, deviceScaleFactor: 1 });
      await pagina.setContent(folhaHtml(slides, quadros, slug), { waitUntil: 'load' });
      const saida = path.join(pasta, `${slug}-previa.png`);
      await pagina.screenshot({ path: saida, fullPage: true });
      console.log(`\n  Folha de contato: ${path.relative(RAIZ, saida)}`);
    } finally {
      await navegador.close();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`  Slides: ${slides.length} × ${SLIDE.largura}×${SLIDE.altura} · vídeos: ${quadros.length}`);
  if (falhas.length) {
    console.log('\n  ❌ Dimensões fora do padrão:');
    falhas.forEach((f) => console.log(`     - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('  ✅ Dimensões conferidas. Veja a folha antes de aprovar (npm run bot:aprovar).\n');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n  Falha:', err.message, '\n');
    process.exit(1);
  });
}

module.exports = { conferirDimensoes, folhaHtml };
