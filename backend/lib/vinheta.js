/**
 * Vinheta de crédito da marca (decisão de 16/10/2026): toda narração e produção audiovisual diz que o conteúdo é do
 * Portal de Saúde Mental Doutor Antônio Felipe Garabito. Aqui: textos, tema sensível, geração das vinhetas (Edge-TTS,
 * mesma voz e mesmo dicionário de pronúncia) e junção por ffmpeg (abertura + narração + encerramento).
 *
 * O texto do artigo e o hash da narração (narracao.js) NÃO mudam: a vinheta é registrada à parte (`vinhetaVersao`).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { VOZ_NARRACAO } = require('./narracao');
const { aplicarPronuncia } = require('./pronunciaTts');

const MARCA = 'Portal de Saúde Mental Doutor Antônio Felipe Garabito';
const SITE = 'www.drantoniofelipemedico.com.br';
const VINHETA_VERSAO = 1;

const TEXTOS = {
  abertura: `Você está ouvindo um conteúdo do ${MARCA}.`,
  encerramento: `Este foi um conteúdo do ${MARCA}. Ele tem caráter educativo e não substitui uma consulta. O texto completo, com as referências, está no portal.`,
  encerramentoSensivel:
    `Este foi um conteúdo do ${MARCA}. Ele tem caráter educativo e não substitui uma consulta. O texto completo, com as referências, está no portal. ` +
    'Se você precisar de apoio agora, ligue 188, o CVV, ligação gratuita, 24 horas. Em emergência, ligue 192, o SAMU.',
  curta: `Conteúdo do ${MARCA}.`,
};

// Mesmo critério da caixa CVV: suicídio, autolesão, violência e crise (título, resumo e corpo).
const RE_SENSIVEL = /suic[ií]d|autoextermin|autoles|automutila|tirar (?:a )?(?:minha |a própria )?vida|desejo de morrer|(?:quer|quero)(?:er)? morrer|n[aã]o (?:quero|queria) mais viver|ideac[aã]o|viol[êe]ncia|abuso sexual|\bcrise\b|overdose/i;

function temaSensivel(artigo) {
  const texto = `${artigo.titulo || ''} ${artigo.resumo || ''} ${String(artigo.conteudo || '').replace(/<[^>]+>/g, ' ')}`;
  return RE_SENSIVEL.test(texto);
}

const RAIZ = path.join(__dirname, '..', '..');
const EDGE_TTS = process.env.EDGE_TTS_BIN || path.join(RAIZ, 'reels_automation', '.venv', process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts');
const PASTA_VINHETAS = path.join(RAIZ, 'narracoes-geradas', '_vinhetas');
const ARQUIVOS = { abertura: 'abertura.mp3', encerramento: 'encerramento.mp3', encerramentoSensivel: 'encerramento-sensivel.mp3', curta: 'curta.mp3' };

/** Pronúncia: "Garabito" fica como está (conferido por transcrição); o dicionário cobre CVV/SAMU. */
function sintetizar(chave, saida) {
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const tmp = `${saida}.txt`;
  fs.writeFileSync(tmp, aplicarPronuncia(TEXTOS[chave]));
  const r = spawnSync(EDGE_TTS, ['--voice', VOZ_NARRACAO, '--file', tmp, '--write-media', saida], { encoding: 'utf8', timeout: 120_000, killSignal: 'SIGKILL' });
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error(`edge-tts falhou: ${(r.stderr || r.error?.message || '').slice(0, 300)}`);
}

/** Gera UMA vez as vinhetas (não regera se já existirem, salvo `forcar`). */
function garantirVinhetas({ pasta = PASTA_VINHETAS, forcar = false } = {}) {
  const out = {};
  for (const [chave, arq] of Object.entries(ARQUIVOS)) {
    out[chave] = path.join(pasta, arq);
    if (forcar || !fs.existsSync(out[chave])) sintetizar(chave, out[chave]);
  }
  return out;
}

/** abertura + pausa + narração + pausa + encerramento, 24 kHz mono 48 kbit/s, volume normalizado. */
function juntar({ base, saida, encerramento, abertura, pausa = 0.7 }) {
  const args = ['-y', '-v', 'error', '-i', abertura, '-i', base, '-i', encerramento,
    '-filter_complex',
    `[0:a]aresample=24000,aformat=channel_layouts=mono,apad=pad_dur=${pausa}[a];[1:a]aresample=24000,aformat=channel_layouts=mono,apad=pad_dur=${pausa}[b];[2:a]aresample=24000,aformat=channel_layouts=mono[c];[a][b][c]concat=n=3:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=24000[o]`,
    '-map', '[o]', '-ac', '1', '-ar', '24000', '-b:a', '48k', saida];
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0 || String(r.stderr).trim()) throw new Error(`ffmpeg falhou: ${String(r.stderr).slice(0, 300)}`);
}

function duracao(arq) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arq], { encoding: 'utf8' });
  return parseFloat(r.stdout);
}

/**
 * Aplica a vinheta ao MP3 de um artigo. O original fica em `<slug>.base.mp3` (é o backup) e `<slug>.mp3` passa a ser o
 * áudio com vinheta; `<slug>.vinheta` guarda a versão. Idempotente: repetir não duplica a vinheta.
 */
function aplicarAoMp3(artigo, pasta, vinhetas = garantirVinhetas()) {
  const mp3 = path.join(pasta, `${artigo.slug}.mp3`);
  const base = path.join(pasta, `${artigo.slug}.base.mp3`);
  const marca = path.join(pasta, `${artigo.slug}.vinheta`);
  if (fs.existsSync(marca) && fs.readFileSync(marca, 'utf8').trim() === String(VINHETA_VERSAO)) return { slug: artigo.slug, estado: 'ja-tinha' };
  if (!fs.existsSync(base)) {
    if (!fs.existsSync(mp3)) return { slug: artigo.slug, estado: 'sem-mp3' };
    fs.renameSync(mp3, base);
  }
  const sens = temaSensivel(artigo);
  juntar({ base, saida: mp3, abertura: vinhetas.abertura, encerramento: sens ? vinhetas.encerramentoSensivel : vinhetas.encerramento });
  const esperada = duracao(base) + duracao(vinhetas.abertura) + duracao(sens ? vinhetas.encerramentoSensivel : vinhetas.encerramento) + 1.4;
  fs.writeFileSync(marca, String(VINHETA_VERSAO));
  return { slug: artigo.slug, estado: 'aplicada', sensivel: sens, segundos: duracao(mp3), esperada };
}

module.exports = { MARCA, SITE, VINHETA_VERSAO, TEXTOS, temaSensivel, garantirVinhetas, juntar, aplicarAoMp3, duracao, PASTA_VINHETAS };
