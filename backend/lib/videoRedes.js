/**
 * Vídeos do bot de mídias (Reels, Shorts e YouTube longo): inspeção com
 * ffprobe, validação por tipo e hash do arquivo — a aprovação médica de um
 * vídeo é presa ao SHA-256 do arquivo aprovado (scripts/bot-aprovar.js
 * --midia), e o publicador só envia o arquivo com aquele hash.
 *
 * Limites conservadores (conferir nas especificações atuais de cada rede):
 *   reel   9:16, 3 s a 15 min, até 300 MB   (Instagram Reels, API)
 *   short  vertical, até 3 min              (YouTube Shorts)
 *   longo  16:9 horizontal, até 12 h        (YouTube)
 * Todos: vídeo H.264/HEVC com áudio AAC.
 */
const crypto = require('crypto');
const fs = require('fs');
const { spawnSync } = require('child_process');

const FFPROBE = process.env.FFPROBE_BIN || 'ffprobe';

const REGRAS = {
  reel: { proporcao: 9 / 16, orientacao: 'vertical', minSeg: 3, maxSeg: 15 * 60, maxMB: 300, nome: 'Reel (Instagram)' },
  short: { proporcao: 9 / 16, orientacao: 'vertical', minSeg: 1, maxSeg: 180, maxMB: 1024, nome: 'Short (YouTube)' },
  longo: { proporcao: 16 / 9, orientacao: 'horizontal', minSeg: 60, maxSeg: 12 * 3600, maxMB: 256 * 1024, nome: 'vídeo longo (YouTube)' },
};

function sha256Arquivo(arquivo) {
  return crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
}

/** Metadados reais do arquivo (considera rotação: vídeo de celular gravado "de pé"). */
function inspecionarVideo(arquivo) {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', arquivo], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffprobe não conseguiu ler ${arquivo}: ${(r.stderr || r.error?.message || '').slice(0, 200)}`);
  return interpretarFfprobe(JSON.parse(r.stdout), fs.statSync(arquivo).size);
}

function interpretarFfprobe(dados, bytes) {
  const video = (dados.streams || []).find((s) => s.codec_type === 'video');
  const audio = (dados.streams || []).find((s) => s.codec_type === 'audio');
  let largura = video?.width || 0;
  let altura = video?.height || 0;
  const rotacao = Math.abs(Number(video?.tags?.rotate || video?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation || 0));
  if (rotacao === 90 || rotacao === 270) [largura, altura] = [altura, largura];
  return {
    largura,
    altura,
    duracao: Number(dados.format?.duration || video?.duration || 0),
    codecVideo: video?.codec_name || null,
    codecAudio: audio?.codec_name || null,
    bytes,
  };
}

/** Lista de problemas do arquivo para o tipo de peça (vazia = ok). */
function validarVideo(info, tipo) {
  const regra = REGRAS[tipo];
  if (!regra) return [`tipo de vídeo desconhecido: ${tipo}`];
  const falhas = [];
  if (!info.largura || !info.altura) return ['arquivo sem trilha de vídeo'];
  const proporcao = info.largura / info.altura;
  if (Math.abs(proporcao - regra.proporcao) / regra.proporcao > 0.03) {
    falhas.push(`${info.largura}×${info.altura} não é ${regra.orientacao === 'vertical' ? '9:16' : '16:9'} (${regra.nome})`);
  }
  if (info.duracao < regra.minSeg || info.duracao > regra.maxSeg) {
    falhas.push(`duração ${Math.round(info.duracao)} s fora de ${regra.minSeg} s a ${regra.maxSeg} s (${regra.nome})`);
  }
  if (info.bytes / 1024 / 1024 > regra.maxMB) falhas.push(`${(info.bytes / 1024 / 1024).toFixed(0)} MB acima de ${regra.maxMB} MB`);
  if (!['h264', 'hevc'].includes(info.codecVideo)) falhas.push(`vídeo em ${info.codecVideo || 'codec desconhecido'} (use H.264)`);
  if (info.codecAudio !== 'aac') falhas.push(info.codecAudio ? `áudio em ${info.codecAudio} (use AAC)` : 'vídeo sem áudio (as redes exigem trilha de áudio AAC)');
  return falhas;
}

module.exports = { inspecionarVideo, interpretarFfprobe, validarVideo, sha256Arquivo, REGRAS_VIDEO: REGRAS };
