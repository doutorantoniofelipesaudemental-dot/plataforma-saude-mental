/**
 * Identidade do canal em relatorios/youtube/canal/: nome, "Sobre", banner 2560x1440, foto de perfil 800x800 e trailer (até 60 s) com
 * narração Edge-TTS e legenda queimada. Sem marca d'água, sem promessa, sem custo.
 *   node --env-file=.env scripts/youtube/gerarCanal.js
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const { aplicarPronuncia } = require('../../backend/lib/pronunciaTts');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const DIR = path.join(L.REL, 'canal');
fs.mkdirSync(DIR, { recursive: true });
const NOME = 'Dr. Antônio Felipe · Saúde Mental';
const SOBRE = [
  'Saúde mental explicada com linguagem simples, a partir da prática no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde.',
  '',
  'Cada vídeo traz o texto completo no site, as referências científicas e orientações gerais. Respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.',
  '',
  'Conteúdo educativo, não substitui consulta. Em crise: CVV 188 · SAMU 192.',
  '',
  L.IDENTIFICACAO_COMPLETA,
  '',
  `Portal, mentoria e consultoria: ${L.SITE}/links`,
].join('\n');
const TRAILER = [
  'Este é o canal do Dr. Antônio Felipe, médico.',
  'Aqui você encontra saúde mental explicada com linguagem simples, a partir da prática no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde.',
  'Cada vídeo tem o texto completo no site, as referências científicas e orientações gerais, sempre respeitando os protocolos locais.',
  'Para profissionais da Atenção Primária e para empresas, há também mentoria e consultoria. Os detalhes estão na página de mentoria, link na descrição.',
  L.vinheta.TEXTOS.encerramentoSensivel,
];
TRAILER.unshift(L.vinheta.TEXTOS.abertura); // crédito de marca, na fala (16/10/2026)

const falhas = checarEticaCfm(`${SOBRE}\n${TRAILER.join(' ')}`, { contexto: 'social', exigirIdentificacao: false }).falhas;
if (/psiquiatra/i.test(`${SOBRE} ${TRAILER.join(' ')}`)) falhas.push('"psiquiatra" no texto do canal');
if (SOBRE.length > 1000) falhas.push(`"Sobre" com ${SOBRE.length} caracteres (limite 1000)`);
fs.writeFileSync(path.join(DIR, 'nome-e-sobre.md'), `# Canal do YouTube — identidade\n\n**Nome do canal:** ${NOME}\n**Identificador sugerido (@):** @drantoniofelipe.saudemental (se ocupado, @doutorantoniofelipe)\n**Link do canal na descrição dos vídeos:** ${L.SITE}/links\n**Público:** não é conteúdo para crianças.\n**País:** Brasil · **Idioma:** português (Brasil)\n\n## Sobre (colar em Personalização > Informações básicas > Descrição; ${SOBRE.length} caracteres)\n\n\`\`\`\n${SOBRE}\n\`\`\`\n\n## Links do canal (Personalização > Links)\n- Portal e conteúdos: ${L.SITE}/links\n- Mentoria e consultoria: ${L.SITE}/mentoria\n- Instagram: https://instagram.com/doutor.antoniofelipe.smental\n\n## Arquivos\n- banner.png (2560×1440; conteúdo importante na área central 1546×423)\n- perfil.png (800×800)\n- trailer.mp4 (apresentação do canal e da mentoria, até 60 s, sem promessa)\n\n## Checagem ética do texto: ${falhas.length ? 'FALHOU: ' + falhas.join('; ') : 'aprovado'}\n`, 'utf8');
if (falhas.length) { console.log('FALHAS', falhas); process.exit(1); }

L.arte({ tipo: 'banner', saida: path.join(DIR, 'banner.png') });
L.arte({ tipo: 'perfil', saida: path.join(DIR, 'perfil.png') });

// trailer 1920x1080: quadro estático + legenda + voz
const tmp = path.join(L.MIDIA, '_trailer'); fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(tmp)) fs.rmSync(path.join(tmp, f), { force: true });
const partes = [];
TRAILER.forEach((txt, i) => {
  const mp3 = path.join(tmp, `l${i}.mp3`); fs.writeFileSync(path.join(tmp, `l${i}.txt`), aplicarPronuncia(txt), 'utf8');
  L.run(L.PY, ['-I', '-m', 'edge_tts', '--voice', 'pt-BR-AntonioNeural', '--file', path.join(tmp, `l${i}.txt`), '--write-media', mp3], { timeout: 180000 });
  const w = path.join(tmp, `l${i}.wav`); L.run('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-af', 'apad=pad_dur=0.35', '-ar', '44100', '-ac', '1', w]);
  partes.push({ txt, w, dur: L.duracao(w) });
});
fs.writeFileSync(path.join(tmp, 'lista.txt'), partes.map((p) => `file '${path.basename(p.w)}'`).join('\n'));
L.run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c:a', 'pcm_s16le', 'voz.wav'], { cwd: tmp });
const total = L.duracao(path.join(tmp, 'voz.wav'));
if (total > 90) { console.log(`trailer com ${total.toFixed(1)} s (> 90 s)`); process.exit(1); }
const t = (s) => { const cs = Math.round(s * 100); return `${Math.floor(cs / 360000)}:${String(Math.floor((cs % 360000) / 6000)).padStart(2, '0')}:${String(Math.floor((cs % 6000) / 100)).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };
let t0 = 0; const dl = [];
for (const p of partes) {
  const ps = p.txt.split(/\s+/), gs = [];
  for (let i = 0; i < ps.length; i += 9) gs.push(ps.slice(i, i + 9).join(' '));
  const soma = gs.reduce((s, g) => s + g.length, 0); let x = t0;
  gs.forEach((g) => { const d = (g.length / soma) * (p.dur - 0.35); const m = g.indexOf(' ', Math.floor(g.length / 2) - 3); dl.push(`Dialogue: 0,${t(x)},${t(x + d)},Cap,,0,0,0,,${m > 0 ? `${g.slice(0, m)}\\N${g.slice(m + 1)}` : g}`); x += d; });
  t0 += p.dur;
}
fs.writeFileSync(path.join(tmp, 'credito.ass'), L.creditoAss(total), 'utf8');
fs.writeFileSync(path.join(tmp, 'cap.ass'), `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Cap,Segoe UI,52,&H00FFFFFF,&H000000FF,&H00301A0B,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,120,120,300,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n${dl.join('\n')}\n`, 'utf8');
fs.copyFileSync('C:/Windows/Fonts/segoeuib.ttf', path.join(tmp, 'segoeuib.ttf'));
L.arte({ tipo: 'longo', titulo: 'Saúde mental no Pronto Atendimento e na Atenção Primária', capa: '', saida: path.join(tmp, 'quadro.png') });
L.run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-i', 'quadro.png', '-i', 'voz.wav', '-f', 'lavfi', '-i', 'color=c=0xC9A24B:s=1920x10:r=30',
  '-filter_complex', `[0:v]subtitles=cap.ass:fontsdir=.,subtitles=credito.ass:fontsdir=.[b];[b][2:v]overlay=x='-1920+1920*t/${total.toFixed(2)}':y=1070:shortest=1,format=yuv420p[v]`,
  '-map', '[v]', '-map', '1:a', '-t', total.toFixed(2), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart', path.join(DIR, 'trailer.mp4')], { cwd: tmp });
const m = L.sondar(path.join(DIR, 'trailer.mp4'));
console.log(JSON.stringify({ trailerSeg: Math.round(total), dim: `${m.largura}x${m.altura}`, fps: m.fps, audio: m.temAudio, bytes: m.bytes }));
