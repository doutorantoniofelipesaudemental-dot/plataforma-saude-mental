/**
 * Vídeo de DEMONSTRAÇÃO DA AUDITORIA DO YOUTUBE (ordem de 30/10/2026): 15 s, sem conteúdo clínico, 4 cenas com transição.
 * Não é conteúdo do Portal: serve só para mostrar o uso da API. Sobe sempre PRIVADO (testeUploadPrivado.js --id=...).
 * FFmpeg local + Edge-TTS (pt-BR-AntonioNeural). Custo zero.
 *   node scripts/youtube/gerarDemoAuditoria.js --saida=<pasta>
 * Saída: <pasta>/demo.mp4, demo-narracao.mp3, meta.json (a entrada da fila é registrada à parte, com status "demo-auditoria").
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const L = require('./lib');

const saidaArg = (process.argv.find((a) => a.startsWith('--saida=')) || '').split('=').slice(1).join('=');
const SAIDA = saidaArg || path.join(L.MIDIA, 'demo-auditoria');
const CENA_SEG = 3.75; // 4 cenas x 3,75 s = 15 s
const FONTE = 'segoeuib.ttf';

const PORTAL = 'Portal de Saúde Mental Doutor Antônio Felipe Garabito';
const CENAS = [
  [PORTAL, 'Vídeo de demonstração técnica'],
  ['Uso da API do YouTube', 'Envio privado ao canal do titular'],
  ['Sem conteúdo clínico', 'Somente para a auditoria do aplicativo'],
  ['Crédito', PORTAL],
];
const NARRACAO = `${PORTAL}. Demonstração técnica da auditoria da API, privada.`;
const TITULO = 'Demonstração técnica — auditoria da API (privado)';
const DESCRICAO = [
  `Conteúdo do ${PORTAL}`,
  '',
  'Vídeo de demonstração técnica para a auditoria da API do YouTube. Não é conteúdo de saúde e não é publicado ao público. Visibilidade: privada.',
  '',
  L.IDENTIFICACAO_COMPLETA,
  L.AVISO_IA,
  L.AVISO_PROTOCOLOS,
  L.CRISE,
].join('\n');

function criarCenas(dir) {
  const partes = [];
  CENAS.forEach(([linha1, linha2], i) => {
    fs.writeFileSync(path.join(dir, `cena${i}-a.txt`), linha1, 'utf8');
    fs.writeFileSync(path.join(dir, `cena${i}-b.txt`), linha2, 'utf8');
    const filtro = [
      `drawtext=fontfile=${FONTE}:textfile=cena${i}-a.txt:fontcolor=0xC9A24B:fontsize=72:x=(w-text_w)/2:y=h/2-120`,
      `drawtext=fontfile=${FONTE}:textfile=cena${i}-b.txt:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=h/2+10`,
      `fade=t=in:st=0:d=0.4`,
      `fade=t=out:st=${(CENA_SEG - 0.4).toFixed(2)}:d=0.4`,
    ].join(',');
    const arq = `cena${i}.mp4`;
    L.run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x0B2A1F:s=1920x1080:r=30:d=${CENA_SEG}`,
      '-vf', filtro, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', arq], { cwd: dir });
    partes.push(arq);
  });
  fs.writeFileSync(path.join(dir, 'lista.txt'), partes.map((p) => `file '${p}'`).join('\n'), 'utf8');
  L.run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', 'visual.mp4'], { cwd: dir });
}

function narrar(dir) {
  fs.writeFileSync(path.join(dir, 'demo-narracao.txt'), NARRACAO, 'utf8');
  L.run(L.PY, ['-I', '-m', 'edge_tts', '--voice', 'pt-BR-AntonioNeural', '--file', 'demo-narracao.txt', '--write-media', 'demo-narracao.mp3'], { cwd: dir, timeout: 180000 });
}

function montar(dir) {
  fs.copyFileSync('C:/Windows/Fonts/segoeuib.ttf', path.join(dir, FONTE));
  criarCenas(dir);
  narrar(dir);
  L.run('ffmpeg', ['-y', '-v', 'error', '-i', 'visual.mp4', '-i', 'demo-narracao.mp3', '-t', '15', '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', 'demo.mp4'], { cwd: dir });
  const meta = { titulo: TITULO, descricao: DESCRICAO, tags: ['auditoria', 'demonstração técnica', 'privado'], arquivos: { video: 'demo.mp4' }, cenas: CENAS.length, privacidade: 'private', geradoEm: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'demo.mp4'))).digest('hex');
  console.log(`demo gerada em ${dir} · cenas: ${CENAS.length} · sha256: ${hash}`);
  return hash;
}

if (require.main === module) {
  fs.mkdirSync(SAIDA, { recursive: true });
  montar(SAIDA);
}
module.exports = { CENAS, TITULO, DESCRICAO };
