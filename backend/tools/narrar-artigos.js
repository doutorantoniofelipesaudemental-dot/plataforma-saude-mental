/**
 * Narração dos artigos (backend/lib/narracao.js). Roda na máquina local:
 * o Edge-TTS é um executável Python e não roda nas funções da Vercel.
 *
 *   npm run narrar -- --estimar                         situação + custo/tempo
 *   npm run narrar -- --slugs=tmc-aps,burnout-aps       gera os MP3 em narracoes-geradas/
 *   npm run narrar -- --pendentes --limite=20           gera os que não estão "ok"
 *   ... --enviar                                        e envia para produção
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
// Edge-TTS sai em MP3 mono 48 kbit/s: 6 000 bytes por segundo.
const BYTES_POR_SEGUNDO = 6000;
// Medido nos 4 artigos da semana 1 (atualizar se a voz ou a velocidade mudar).
const CARACTERES_POR_SEGUNDO_AUDIO = 13.7;

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

async function estimar(artigos) {
  const contagem = { ok: 0, legado: 0, desatualizada: 0, ausente: 0 };
  let caracteres = 0;
  let acimaDoLimite = 0;
  for (const a of artigos) {
    const { estado } = estadoNarracao(a);
    contagem[estado]++;
    if (estado !== 'ok') {
      const n = textoParaNarracao(a).length;
      caracteres += n;
      if ((n / CARACTERES_POR_SEGUNDO_AUDIO) * BYTES_POR_SEGUNDO > LIMITE_BYTES) acimaDoLimite++;
    }
  }
  const segundosAudio = caracteres / CARACTERES_POR_SEGUNDO_AUDIO;
  console.log(`\n  Publicados: ${artigos.length}`);
  console.log(`  ok: ${contagem.ok} · legado (sem hash): ${contagem.legado} · desatualizada: ${contagem.desatualizada} · ausente: ${contagem.ausente}`);
  console.log(`  A narrar: ${artigos.length - contagem.ok} artigos, ${caracteres.toLocaleString('pt-BR')} caracteres`);
  console.log(`  Áudio total estimado: ${(segundosAudio / 3600).toFixed(1)} h · ${((segundosAudio * BYTES_POR_SEGUNDO) / 1024 / 1024).toFixed(0)} MB no Blob`);
  console.log(`  Acima de 4,4 MB (não cabem no envio): ${acimaDoLimite}\n`);
}

function gerarMp3(artigo) {
  const texto = textoParaNarracao(artigo);
  const hash = hashNarracao(texto);
  fs.mkdirSync(PASTA_SAIDA, { recursive: true });
  const arquivoTexto = path.join(PASTA_SAIDA, `${artigo.slug}.txt`);
  const arquivoMp3 = path.join(PASTA_SAIDA, `${artigo.slug}.mp3`);
  fs.writeFileSync(arquivoTexto, texto);

  const inicio = Date.now();
  const r = spawnSync(EDGE_TTS, ['--voice', VOZ_NARRACAO, '--file', arquivoTexto, '--write-media', arquivoMp3], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`edge-tts falhou em ${artigo.slug}: ${(r.stderr || r.error?.message || '').slice(0, 300)}`);
  const bytes = fs.statSync(arquivoMp3).size;
  return { slug: artigo.slug, texto, hash, arquivoMp3, bytes, segundosAudio: bytes / BYTES_POR_SEGUNDO, segundosGeracao: (Date.now() - inicio) / 1000 };
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
    },
    body: fs.readFileSync(gerado.arquivoMp3),
  });
  const corpo = await resp.json().catch(() => ({}));
  return resp.ok ? { ok: true, url: corpo.narracao?.url } : { ok: false, erro: `HTTP ${resp.status}: ${corpo.erro || ''}` };
}

async function main() {
  const args = argumentos();
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
    alvo = publicados.filter((a) => estadoNarracao(a).estado !== 'ok').slice(0, Number(args.limite) || Infinity);
  } else {
    console.log('\n  Use --estimar, --slugs=a,b ou --pendentes [--limite=N] [--enviar].\n');
    return db.mongoose.disconnect();
  }
  if (args.enviar && !process.env.ADMIN_TOKEN) throw new Error('ADMIN_TOKEN ausente no .env — necessário para --enviar');

  for (const artigo of alvo) {
    const g = gerarMp3(artigo);
    let envio = '';
    if (args.enviar) {
      const r = await enviar(g);
      envio = r.ok ? ` · enviado: ${r.url}` : ` · NÃO enviado (${r.erro})`;
    }
    console.log(
      `  ${g.slug}: ${g.texto.length} car. · áudio ${minutos(g.segundosAudio)} · ${(g.bytes / 1024 / 1024).toFixed(2)} MB · gerado em ${g.segundosGeracao.toFixed(0)} s${envio}`
    );
  }
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
