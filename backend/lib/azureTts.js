/**
 * Síntese de voz pelo Azure Speech (REST), para trechos curtos — usada pelo
 * vídeo do carrossel (scripts/bot-video-carrossel.js). A narração dos
 * artigos (backend/tools/narrar-artigos.js) usa a mesma voz e o MESMO
 * registro de uso mensal, para a trava da cota gratuita valer para os dois.
 *
 * AZURE_SPEECH_KEY / AZURE_SPEECH_REGION só no .env local.
 */
const fs = require('fs');
const path = require('path');
const { VOZ_NARRACAO } = require('./narracao');

const COTA_GRATUITA_MENSAL = 500_000;
const PASTA_USO = path.join(__dirname, '..', '..', 'narracoes-geradas');

const escaparXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function arquivoUsoDoMes(data = new Date()) {
  return path.join(PASTA_USO, `uso-azure-${data.toISOString().slice(0, 7)}.json`);
}

/** Caracteres já enviados ao Azure neste mês (registro local compartilhado). */
function usoDoMes() {
  try {
    return JSON.parse(fs.readFileSync(arquivoUsoDoMes(), 'utf8')).caracteres || 0;
  } catch {
    return 0;
  }
}

function registrarUso(caracteres) {
  fs.mkdirSync(PASTA_USO, { recursive: true });
  const total = usoDoMes() + caracteres;
  fs.writeFileSync(arquivoUsoDoMes(), JSON.stringify({ mes: new Date().toISOString().slice(0, 7), caracteres: total, atualizadoEm: new Date() }));
  return total;
}

/** MP3 (24 kHz, 48 kbit/s, mono) de um trecho curto. Lança em erro do Azure. */
async function sintetizar(texto, { voz = VOZ_NARRACAO } = {}) {
  const chave = process.env.AZURE_SPEECH_KEY;
  const regiao = process.env.AZURE_SPEECH_REGION;
  if (!chave || !regiao) throw new Error('AZURE_SPEECH_KEY e AZURE_SPEECH_REGION precisam estar no .env local');
  if (usoDoMes() + texto.length > COTA_GRATUITA_MENSAL) {
    throw new Error(`cota gratuita do Azure no mês estouraria (${usoDoMes()} + ${texto.length} > ${COTA_GRATUITA_MENSAL} caracteres)`);
  }
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR"><voice name="${voz}">${escaparXml(texto)}</voice></speak>`;
  for (let tentativa = 1; ; tentativa++) {
    const resp = await fetch(`https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': chave,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'drsaudemental-video',
      },
      body: ssml,
    });
    if (resp.ok) {
      registrarUso(texto.length);
      return Buffer.from(await resp.arrayBuffer());
    }
    if ((resp.status === 429 || resp.status >= 500) && tentativa < 4) {
      await new Promise((ok) => setTimeout(ok, tentativa * 15_000));
      continue;
    }
    throw new Error(`Azure respondeu HTTP ${resp.status} (${(await resp.text()).slice(0, 200)})`);
  }
}

module.exports = { sintetizar, usoDoMes, registrarUso, escaparXml, COTA_GRATUITA_MENSAL };
