/**
 * Narração dos artigos (backend/lib/narracao.js). Roda na máquina local.
 *
 *   npm run narrar -- --estimar                           situação + caracteres
 *   npm run narrar -- --slugs=tmc-aps,burnout-aps         gera os MP3 em narracoes-geradas/
 *   npm run narrar -- --pendentes --limite=20             os que não estão "ok": legado primeiro, depois ausentes
 *   ... --enviar                                          e envia para produção
 *   ... --provedor=edge                                   Edge-TTS em vez do Azure (padrão)
 *
 * Provedor padrão: Azure Speech (voz pt-BR-AntonioNeural), com
 * AZURE_SPEECH_KEY e AZURE_SPEECH_REGION no .env LOCAL — nunca no
 * repositório nem na Vercel. Camada gratuita (F0): 500 mil caracteres/mês e
 * 20 requisições por minuto; cada requisição rende no máximo 10 min de áudio,
 * por isso o texto vai em partes de até LIMITE_PARTE caracteres, e o MP3
 * final é a concatenação (mesmo formato, 48 kbit/s mono).
 *
 * O envio usa PUT /api/artigos/:slug/midia/narracao (ADMIN_TOKEN do .env),
 * que confere o hash contra o texto atual e grava no Blob. Arquivos acima
 * de 4,4 MB (limite de corpo da Vercel, ~12 min de áudio) são recusados aqui.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const db = require('../lib/db');
const Artigo = require('../models/Artigo');
const { textoParaNarracao, hashNarracao, estadoNarracao, VOZ_NARRACAO } = require('../lib/narracao');

const RAIZ = path.join(__dirname, '..', '..');
const PASTA_SAIDA = path.join(RAIZ, 'narracoes-geradas');
const EDGE_TTS =
  process.env.EDGE_TTS_BIN ||
  path.join(RAIZ, 'reels_automation', '.venv', process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts');
const BASE_API = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const LIMITE_BYTES = 4400 * 1024;
// MP3 mono 48 kbit/s (Edge e Azure, no formato pedido abaixo): 6 000 bytes por segundo.
const BYTES_POR_SEGUNDO = 6000;
// Medido nos 4 artigos da semana 1 (atualizar se a voz ou a velocidade mudar).
const CARACTERES_POR_SEGUNDO_AUDIO = 13.7;
// ~4,9 min de áudio por parte: folga grande sob o teto de 10 min por requisição.
const LIMITE_PARTE = 4000;
// F0 aceita 20 requisições por minuto: uma a cada 3,1 s fica abaixo disso.
const INTERVALO_AZURE_MS = 3100;
const COTA_GRATUITA_MENSAL = 500_000;

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

const minutos = (s) => {
  const total = Math.round(s);
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`;
};
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Ordem do lote: áudios antigos (legado) primeiro, depois os artigos sem áudio. */
const ORDEM_ESTADO = { legado: 0, desatualizada: 1, ausente: 2 };

async function estimar(artigos) {
  const porEstado = { ok: [], legado: [], desatualizada: [], ausente: [] };
  for (const a of artigos) porEstado[estadoNarracao(a).estado].push(textoParaNarracao(a).length);
  const soma = (l) => l.reduce((s, n) => s + n, 0);
  console.log(`\n  Publicados: ${artigos.length}`);
  for (const estado of ['ok', 'legado', 'desatualizada', 'ausente']) {
    console.log(`  ${estado.padEnd(13)} ${String(porEstado[estado].length).padStart(3)} artigos · ${soma(porEstado[estado]).toLocaleString('pt-BR')} caracteres`);
  }
  const total = soma([...porEstado.legado, ...porEstado.desatualizada, ...porEstado.ausente]);
  const segundos = total / CARACTERES_POR_SEGUNDO_AUDIO;
  console.log(`  A narrar: ${total.toLocaleString('pt-BR')} caracteres · ${(segundos / 3600).toFixed(1)} h de áudio · ${((segundos * BYTES_POR_SEGUNDO) / 1024 / 1024).toFixed(0)} MB no Blob`);
  console.log(`  Azure F0: ${COTA_GRATUITA_MENSAL.toLocaleString('pt-BR')} caracteres/mês grátis — excedente: ${Math.max(0, total - COTA_GRATUITA_MENSAL).toLocaleString('pt-BR')}\n`);
}

/** Divide nas quebras de linha (cada linha é um bloco do artigo), sem passar de LIMITE_PARTE. */
function dividirEmPartes(texto) {
  const partes = [];
  let atual = '';
  for (const linha of texto.split('\n')) {
    if (atual && atual.length + linha.length + 1 > LIMITE_PARTE) {
      partes.push(atual);
      atual = '';
    }
    atual = atual ? `${atual}\n${linha}` : linha;
  }
  if (atual) partes.push(atual);
  return partes;
}

const escaparXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function ssml(parte) {
  const corpo = parte.split('\n').map(escaparXml).join('<break time="450ms"/>');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR"><voice name="${VOZ_NARRACAO}">${corpo}</voice></speak>`;
}

async function sintetizarAzure(texto) {
  const chave = process.env.AZURE_SPEECH_KEY;
  const regiao = process.env.AZURE_SPEECH_REGION;
  if (!chave || !regiao) throw new Error('AZURE_SPEECH_KEY e AZURE_SPEECH_REGION precisam estar no .env local');
  const trechos = [];
  for (const parte of dividirEmPartes(texto)) {
    for (let tentativa = 1; ; tentativa++) {
      const resp = await fetch(`https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': chave,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'User-Agent': 'drsaudemental-narracao',
        },
        body: ssml(parte),
      });
      if (resp.ok) {
        trechos.push(Buffer.from(await resp.arrayBuffer()));
        break;
      }
      // 429: limite da F0 ou capacidade da voz na região — espera e tenta de novo.
      if ((resp.status === 429 || resp.status >= 500) && tentativa < 5) {
        await esperar(tentativa * 15_000);
        continue;
      }
      throw new Error(`Azure respondeu HTTP ${resp.status} (${(await resp.text()).slice(0, 200)})`);
    }
    await esperar(INTERVALO_AZURE_MS);
  }
  return Buffer.concat(trechos);
}

function sintetizarEdge(arquivoTexto, arquivoMp3) {
  const r = spawnSync(EDGE_TTS, ['--voice', VOZ_NARRACAO, '--file', arquivoTexto, '--write-media', arquivoMp3], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`edge-tts falhou: ${(r.stderr || r.error?.message || '').slice(0, 300)}`);
}

async function gerarMp3(artigo, provedor) {
  const texto = textoParaNarracao(artigo);
  const hash = hashNarracao(texto);
  fs.mkdirSync(PASTA_SAIDA, { recursive: true });
  const arquivoTexto = path.join(PASTA_SAIDA, `${artigo.slug}.txt`);
  const arquivoMp3 = path.join(PASTA_SAIDA, `${artigo.slug}.mp3`);
  fs.writeFileSync(arquivoTexto, texto);

  const inicio = Date.now();
  if (provedor === 'edge') sintetizarEdge(arquivoTexto, arquivoMp3);
  else fs.writeFileSync(arquivoMp3, await sintetizarAzure(texto));
  const bytes = fs.statSync(arquivoMp3).size;
  return { slug: artigo.slug, texto, hash, provedor, arquivoMp3, bytes, segundosAudio: bytes / BYTES_POR_SEGUNDO, segundosGeracao: (Date.now() - inicio) / 1000 };
}

async function enviar(gerado) {
  if (gerado.bytes > LIMITE_BYTES) return { ok: false, erro: `${(gerado.bytes / 1024 / 1024).toFixed(1)} MB — acima do limite de envio` };
  const resp = await fetch(`${BASE_API}/api/artigos/${encodeURIComponent(gerado.slug)}/midia/narracao`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      'Content-Type': 'audio/mpeg',
      'X-Narracao-Hash': gerado.hash,
      'X-Narracao-Caracteres': String(gerado.texto.length),
      'X-Narracao-Provedor': gerado.provedor,
    },
    body: fs.readFileSync(gerado.arquivoMp3),
  });
  const corpo = await resp.json().catch(() => ({}));
  return resp.ok ? { ok: true, url: corpo.narracao?.url } : { ok: false, erro: `HTTP ${resp.status}: ${corpo.erro || ''}` };
}

async function main() {
  const args = argumentos();
  const provedor = args.provedor === 'edge' ? 'edge' : 'azure';
  await db.connect();
  const publicados = await Artigo.find({ publicado: true }).lean();

  if (args.estimar) {
    await estimar(publicados);
    return db.mongoose.disconnect();
  }

  let alvo;
  if (args.slugs) {
    const slugs = String(args.slugs).split(',');
    alvo = slugs.map((s) => publicados.find((a) => a.slug === s)).filter(Boolean);
    if (alvo.length !== slugs.length) throw new Error('algum slug não existe ou não está publicado');
  } else if (args.pendentes) {
    alvo = publicados
      .map((a) => ({ a, estado: estadoNarracao(a).estado }))
      .filter((x) => x.estado !== 'ok')
      .sort((x, y) => ORDEM_ESTADO[x.estado] - ORDEM_ESTADO[y.estado] || x.a.slug.localeCompare(y.a.slug))
      .slice(0, Number(args.limite) || Infinity)
      .map((x) => x.a);
  } else {
    console.log('\n  Use --estimar, --slugs=a,b ou --pendentes [--limite=N] [--enviar] [--provedor=edge].\n');
    return db.mongoose.disconnect();
  }
  if (args.enviar && !process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no .env — necessário para --enviar');

  console.log(`\n  Provedor: ${provedor} · ${alvo.length} artigo(s)\n`);
  let caracteres = 0;
  let falhas = 0;
  for (const [i, artigo] of alvo.entries()) {
    const estado = estadoNarracao(artigo).estado;
    try {
      const g = await gerarMp3(artigo, provedor);
      caracteres += g.texto.length;
      let envio = '';
      if (args.enviar) {
        const r = await enviar(g);
        if (!r.ok) falhas++;
        envio = r.ok ? ' · enviado' : ` · NÃO enviado (${r.erro})`;
      }
      console.log(
        `  [${i + 1}/${alvo.length}] ${g.slug} (${estado}): ${g.texto.length} car. · ${minutos(g.segundosAudio)} · ${(g.bytes / 1024 / 1024).toFixed(2)} MB · ${g.segundosGeracao.toFixed(0)} s${envio}`
      );
    } catch (err) {
      falhas++;
      console.log(`  [${i + 1}/${alvo.length}] ${artigo.slug} (${estado}): FALHOU — ${err.message}`);
      // Chave inválida ou cota esgotada: parar em vez de repetir o erro 20 vezes.
      if (/HTTP 40[13]/.test(err.message)) break;
    }
  }
  console.log(`\n  Caracteres enviados ao provedor nesta execução: ${caracteres.toLocaleString('pt-BR')} · falhas: ${falhas}\n`);
  await db.mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n  Falha:', err.message, '\n');
  try {
    await db.mongoose.disconnect();
  } catch {
    // conexão já pode ter caído.
  }
  process.exit(1);
});
