#!/usr/bin/env node
/**
 * Vídeo 9:16 (Reel) a partir do carrossel APROVADO de um artigo.
 *
 *   npm run bot:video-carrossel -- --slug=<slug> --narrar [--provedor=azure|edge|openai|elevenlabs] [--voz=onyx|echo]
 *   npm run bot:video-carrossel -- --slug=<slug>                      só trilha (automática, de assets/audio/)
 *   npm run bot:video-carrossel -- --slug=<slug> --audio="<faixa licenciada.mp3>"
 *   ... --sem-trilha   narração pura, sem trilha de fundo
 *   ... --saida="<arquivo.mp4>"   (padrão: <pasta do aprovado>/<slug>-videos/reel-carrossel.mp4)
 *
 * Slides: desenhados do .md aprovado (mesmo desenho do carrossel,
 * backend/lib/carrosselAprovado.js), centralizados em 1080×1920 com faixas na
 * cor do próprio slide (#0d3330 nos escuros, #faf7f2 nos claros).
 *   --narrar: cada slide dura o tempo da sua narração + 0,5 s; o vídeo abre com
 *     "Narração em voz sintética." (transparência, como o player do site).
 *     Provedor (backend/lib/tts.js): azure (padrão, pt-BR-AntonioNeural, trava
 *     da cota mensal), edge (mesma voz, sem chave) ou openai (onyx/echo,
 *     OPENAI_API_KEY) ou elevenlabs (voz desenhada em ELEVENLABS_VOICE_ID).
 *     A trilha de fundo entra baixa, por baixo da voz.
 *   Trilha: --audio, ou a escolhida automaticamente em assets/audio/ pelo slug
 *     (backend/lib/trilhas.js). Precisa ter LICENÇA para uso comercial (a API
 *     não dá acesso à biblioteca de músicas do Instagram). Sem narração, o
 *     tempo da trilha é dividido igualmente entre os slides.
 * Saída H.264 + AAC, 30 fps. O vídeo NÃO é publicado: segue o fluxo de
 * aprovação do arquivo (bot:aprovar --midia --peca=reel-carrossel) e
 * publicação como Reel (bot:publicar --tipo=reel --peca=reel-carrossel).
 * Provedor, voz e trilha usados ficam em `producao` no .json do aprovado.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}

const { lerAprovado, renderizarSlides } = require('../backend/lib/carrosselAprovado');
const { sintetizar, validarProvedor, vozPadrao } = require('../backend/lib/tts');
const { escolherTrilha, PASTA_TRILHAS } = require('../backend/lib/trilhas');

const exec = promisify(execFile);
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_BIN || 'ffprobe';
const PASTAS = ['aprovados', 'publicados'].map((p) => path.join(RAIZ, 'CONTEUDO_INSTAGRAM', p));
const COR_ESCURA = '0x0d3330';
const COR_CLARA = '0xfaf7f2';
const RESPIRO = 0.5;
const ABERTURA = 'Narração em voz sintética.';
// Trilha por baixo da narração: ~ -18 dB, para não competir com a voz.
const VOLUME_TRILHA_SOB_VOZ = 0.12;
const FADE_FINAL = 2;

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

async function duracao(arquivo) {
  const { stdout } = await exec(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', arquivo]);
  return parseFloat(stdout.trim());
}

/** Texto que o slide diz em voz alta: o mesmo do slide, sem os "·" de separação. */
function textoFalado(texto) {
  return String(texto).replace(/\s*·\s*/g, ', ').replace(/\s+/g, ' ').trim();
}

/** Filtro de um slide: 4:5 centralizado em 9:16, faixa na cor do slide. */
function filtroSlide(i, total) {
  const cor = i === 0 || i === total - 1 ? COR_ESCURA : COR_CLARA;
  return `[${i}:v]scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=${cor},setsar=1,fps=30,format=yuv420p[v${i}]`;
}

/** Faixa do vídeo: --audio, ou a automática de assets/audio/ (null com --sem-trilha ou pasta vazia). */
function resolverTrilha(args, slug) {
  if (args.audio) {
    const faixa = path.resolve(String(args.audio));
    if (!fs.existsSync(faixa)) throw new Error(`faixa não encontrada: ${faixa}`);
    return { arquivo: faixa, origem: 'manual' };
  }
  if (args['sem-trilha']) return null;
  const auto = escolherTrilha(slug);
  return auto ? { arquivo: auto, origem: 'automatica' } : null;
}

/** Trilha sob a voz: volume baixo, cortada no fim do vídeo, com fade. Entrada [voz], saída [outa]. */
function filtroTrilhaSobVoz(indice, total) {
  const inicioFade = Math.max(0, total - FADE_FINAL).toFixed(2);
  return [
    `[${indice}:a]volume=${VOLUME_TRILHA_SOB_VOZ},atrim=0:${total.toFixed(2)},afade=t=out:st=${inicioFade}:d=${FADE_FINAL}[bg]`,
    '[voz][bg]amix=inputs=2:duration=first:normalize=0[outa]',
  ];
}

async function main() {
  const args = argumentos();
  const slug = args.slug && String(args.slug);
  if (!slug) {
    console.log('\n  Use --slug=<slug> [--narrar --provedor=azure|edge|openai|elevenlabs --voz=onyx|echo] [--audio="<faixa.mp3>" | --sem-trilha] [--saida=<arquivo.mp4>].\n');
    process.exit(1);
  }
  const provedor = String(args.provedor || 'azure');
  const voz = args.voz ? String(args.voz) : vozPadrao(provedor);
  if (args.narrar) validarProvedor(provedor, voz);
  const pasta = PASTAS.find((p) => fs.existsSync(path.join(p, `${slug}.md`)));
  if (!pasta) throw new Error(`"${slug}" não está em aprovados/ nem em publicados/ — só vira vídeo o carrossel aprovado`);
  const arquivoMeta = path.join(pasta, `${slug}.json`);
  const meta = JSON.parse(fs.readFileSync(arquivoMeta, 'utf8'));
  if (!meta.aprovacao) throw new Error('carrossel sem aprovação médica registrada');

  const trilha = resolverTrilha(args, slug);
  if (!args.narrar && !trilha) {
    throw new Error(`sem narração e sem trilha: use --narrar, --audio="<faixa.mp3>" ou coloque faixas licenciadas em ${path.relative(RAIZ, PASTA_TRILHAS)}`);
  }

  const aprovado = lerAprovado(fs.readFileSync(path.join(pasta, `${slug}.md`), 'utf8'));
  const slides = await renderizarSlides(aprovado);
  // --saida sem .mp4 é PASTA (ex.: --saida=scratchpad → scratchpad/reel-carrossel.mp4):
  // antes virava um arquivo sem extensão e o ffmpeg recusava — depois de gastar a síntese.
  const saida = !args.saida
    ? path.join(pasta, `${slug}-videos`, 'reel-carrossel.mp4')
    : /\.mp4$/i.test(String(args.saida))
      ? path.resolve(String(args.saida))
      : path.resolve(String(args.saida), 'reel-carrossel.mp4');
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'video-carrossel-'));

  try {
    const imagens = slides.map((s, i) => {
      const f = path.join(tmp, `slide-${String(i + 1).padStart(2, '0')}.png`);
      fs.writeFileSync(f, s.buffer);
      return f;
    });
    const entradas = [];
    const filtros = imagens.map((_, i) => filtroSlide(i, imagens.length));
    const concatV = imagens.map((_, i) => `[v${i}]`).join('');

    if (args.narrar) {
      console.log(`\n  Narrando ${imagens.length} slides (${provedor}, ${voz})…`);
      const audios = [];
      for (const [i, slide] of aprovado.slides.entries()) {
        const texto = i === 0 ? `${ABERTURA} ${textoFalado(slide.texto)}` : textoFalado(slide.texto);
        const f = path.join(tmp, `audio-${i + 1}.mp3`);
        fs.writeFileSync(f, await sintetizar(texto, { provedor, voz }));
        audios.push({ f, d: (await duracao(f)) + RESPIRO });
      }
      imagens.forEach((img, i) => entradas.push('-loop', '1', '-t', audios[i].d.toFixed(2), '-i', img));
      audios.forEach((a) => entradas.push('-i', a.f));
      const concatA = audios.map((_, i) => `[${imagens.length + i}:a]apad=pad_dur=${RESPIRO}[a${i}]`);
      const rotuloVoz = trilha ? 'voz' : 'outa';
      filtros.push(...concatA, `${concatV}concat=n=${imagens.length}:v=1:a=0[outv]`, `${audios.map((_, i) => `[a${i}]`).join('')}concat=n=${audios.length}:v=0:a=1[${rotuloVoz}]`);
      if (trilha) {
        entradas.push('-stream_loop', '-1', '-i', trilha.arquivo);
        filtros.push(...filtroTrilhaSobVoz(imagens.length + audios.length, audios.reduce((soma, a) => soma + a.d, 0)));
      }
      await exec(FFMPEG, ['-y', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', saida], { maxBuffer: 64 * 1024 * 1024 });
    } else {
      const porSlide = (await duracao(trilha.arquivo)) / imagens.length;
      if (porSlide < 2) throw new Error(`faixa curta demais: ${porSlide.toFixed(1)} s por slide (mínimo 2 s)`);
      imagens.forEach((img) => entradas.push('-loop', '1', '-t', porSlide.toFixed(2), '-i', img));
      entradas.push('-i', trilha.arquivo);
      filtros.push(`${concatV}concat=n=${imagens.length}:v=1:a=0[outv]`);
      await exec(FFMPEG, ['-y', ...entradas, '-filter_complex', filtros.join(';'), '-map', '[outv]', '-map', `${imagens.length}:a`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-shortest', saida], { maxBuffer: 64 * 1024 * 1024 });
    }
    if (trilha) {
      console.log(`\n  Trilha (${trilha.origem === 'manual' ? '--audio' : 'automática'}): ${path.basename(trilha.arquivo)}`);
      console.log('  ⚠️  Confirme que a licença da faixa permite uso comercial em redes sociais.');
    }

    // Rastro de produção: o que entrou no vídeo (a aprovação do arquivo vem depois, por hash).
    meta.producao = {
      ...(meta.producao || {}),
      'reel-carrossel': {
        arquivo: path.relative(RAIZ, saida),
        narracao: args.narrar ? { provedor, voz } : null,
        trilha: trilha ? { arquivo: path.basename(trilha.arquivo), origem: trilha.origem } : null,
        geradoEm: new Date(),
      },
    };
    fs.writeFileSync(arquivoMeta, JSON.stringify(meta, null, 2));

    const total = await duracao(saida);
    console.log(`\n  ✅ Vídeo gerado: ${path.relative(RAIZ, saida)} (${imagens.length} slides, ${Math.round(total)} s, 1080×1920)`);
    console.log(`\n  Próximos passos (o vídeo ainda não está aprovado nem publicado):`);
    console.log(`    npm run bot:aprovar -- --slug=${slug} --midia="${path.relative(RAIZ, saida)}" --peca=reel-carrossel`);
    console.log(`    npm run bot:publicar -- --slug=${slug} --tipo=reel --peca=reel-carrossel\n`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n  Falha:', err.message, '\n');
    process.exit(1);
  });
}

module.exports = { textoFalado, filtroSlide, filtroTrilhaSobVoz, resolverTrilha };
