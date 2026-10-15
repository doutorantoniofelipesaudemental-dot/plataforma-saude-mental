/**
 * PROPOSTA de vídeo da /mentoria (60–90 s) para aprovação do Dr. Antônio. É publicidade médica: NUNCA entra em fila.json nem é publicada
 * por script. Contato só por e-mail. Sem promessa de resultado. Saída: relatorios/youtube/propostas/mentoria/.
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const { aplicarPronuncia } = require('../../backend/lib/pronunciaTts');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const DIR = path.join(L.REL, 'propostas', 'mentoria'); fs.mkdirSync(DIR, { recursive: true });
const EMAIL = 'doutor.antoniofelipe.saudemental@gmail.com';
const LINHAS = [
  'Mentoria, consultoria e atendimento com o Dr. Antônio Felipe, médico.',
  'Mentoria para profissionais da Atenção Primária: encontros para discutir condutas gerais e a organização do cuidado em saúde mental na rotina da unidade, sempre respeitando os protocolos locais.',
  'Consultoria para empresas e equipes de recursos humanos: apoio para estruturar o cuidado com a saúde mental no trabalho, com o Kit NR-1 e a gestão de riscos psicossociais.',
  'Mentoria e consultoria são atividades de educação e de apoio à organização do cuidado. Elas não oferecem diagnóstico nem tratamento à distância.',
  'O formato de cada trabalho é conversado de forma individual, de acordo com a realidade do serviço ou da empresa.',
  'Atendimento médico, mediante agendamento.',
  'O contato é feito somente por e-mail, informado na página de mentoria. O link está na descrição.',
  'Este conteúdo é informativo e educativo, e não substitui consulta. Em crise, CVV 188 ou SAMU 192.',
];
const DESCRICAO = [
  'Mentoria para profissionais da Atenção Primária, consultoria para empresas e equipes de RH (Kit NR-1) e atendimento médico mediante agendamento.',
  '', `Página de mentoria: ${L.SITE}/mentoria`, `Agendamento e contato somente por e-mail: ${EMAIL}`, '',
  L.AVISO_PROTOCOLOS, L.CRISE, '', L.IDENTIFICACAO_COMPLETA, '', L.AVISO_IA, '', `Todos os links: ${L.SITE}/links`,
].join('\n');

const falhas = [...checarEticaCfm(`${LINHAS.join(' ')}\n${DESCRICAO}`, { contexto: 'social', exigirIdentificacao: false }).falhas, ...L.checarTexto({ slug: 'proposta-mentoria', titulo: 'Mentoria, consultoria e atendimento', descricao: DESCRICAO.replace(EMAIL, 'e-mail na página de mentoria'), tags: [] })];
const tmp = path.join(L.MIDIA, '_proposta'); fs.mkdirSync(tmp, { recursive: true }); for (const f of fs.readdirSync(tmp)) fs.rmSync(path.join(tmp, f), { force: true });
const partes = LINHAS.map((txt, i) => {
  const mp3 = path.join(tmp, `l${i}.mp3`), w = path.join(tmp, `l${i}.wav`);
  fs.writeFileSync(path.join(tmp, `l${i}.txt`), aplicarPronuncia(txt), 'utf8');
  L.run(L.PY, ['-I', '-m', 'edge_tts', '--voice', 'pt-BR-AntonioNeural', '--file', path.join(tmp, `l${i}.txt`), '--write-media', mp3], { timeout: 180000 });
  L.run('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-af', 'apad=pad_dur=0.35', '-ar', '44100', '-ac', '1', w]);
  return { txt, w, dur: L.duracao(w) };
});
fs.writeFileSync(path.join(tmp, 'lista.txt'), partes.map((p) => `file '${path.basename(p.w)}'`).join('\n'));
L.run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c:a', 'pcm_s16le', 'voz.wav'], { cwd: tmp });
const total = L.duracao(path.join(tmp, 'voz.wav'));
const t = (s) => { const cs = Math.round(s * 100); return `${Math.floor(cs / 360000)}:${String(Math.floor((cs % 360000) / 6000)).padStart(2, '0')}:${String(Math.floor((cs % 6000) / 100)).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };
let t0 = 0; const dl = [];
for (const p of partes) { const ps = p.txt.split(/\s+/), gs = []; for (let i = 0; i < ps.length; i += 9) gs.push(ps.slice(i, i + 9).join(' ')); const soma = gs.reduce((s, g) => s + g.length, 0); let x = t0; gs.forEach((g) => { const d = (g.length / soma) * (p.dur - 0.35); const m = g.indexOf(' ', Math.floor(g.length / 2) - 3); dl.push(`Dialogue: 0,${t(x)},${t(x + d)},Cap,,0,0,0,,${m > 0 ? `${g.slice(0, m)}\N${g.slice(m + 1)}` : g}`); x += d; }); t0 += p.dur; }
fs.writeFileSync(path.join(tmp, 'cap.ass'), `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Cap,Segoe UI,52,&H00FFFFFF,&H000000FF,&H00301A0B,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,120,120,300,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n${dl.join('\n')}\n`, 'utf8');
fs.copyFileSync('C:/Windows/Fonts/segoeuib.ttf', path.join(tmp, 'segoeuib.ttf'));
L.arte({ tipo: 'longo', titulo: 'Mentoria, consultoria e atendimento', capa: '', saida: path.join(tmp, 'quadro.png') });
L.run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-i', 'quadro.png', '-i', 'voz.wav', '-f', 'lavfi', '-i', 'color=c=0xC9A24B:s=1920x10:r=30', '-filter_complex', `[0:v]subtitles=cap.ass:fontsdir=.[b];[b][2:v]overlay=x='-1920+1920*t/${total.toFixed(2)}':y=1070:shortest=1,format=yuv420p[v]`, '-map', '[v]', '-map', '1:a', '-t', total.toFixed(2), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart', path.join(DIR, 'video-mentoria-PROPOSTA.mp4')], { cwd: tmp });
fs.writeFileSync(path.join(DIR, 'LEIA-ME.md'), `# PROPOSTA — vídeo da /mentoria (${Math.round(total)} s)\n\n**Status: aguardando a aprovação do Dr. Antônio. NÃO está na fila e nenhum script publica este arquivo.** É publicidade médica (Res. CFM 2.336/2023).\n\nChecagem ética automática: ${falhas.length ? 'FALHAS: ' + falhas.join('; ') : 'aprovada'}.\n\n## Roteiro narrado\n${LINHAS.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n## Descrição proposta\n\`\`\`\n${DESCRICAO}\n\`\`\`\n\nPara aprovar: diga "aprovo o vídeo da mentoria" e a data; o vídeo passa pela Tripla Checagem e entra no calendário.\n`, 'utf8');
console.log(JSON.stringify({ seg: Math.round(total), falhas }));
