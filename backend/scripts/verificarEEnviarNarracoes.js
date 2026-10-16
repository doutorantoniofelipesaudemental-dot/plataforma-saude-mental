/**
 * Confere os MP3 gerados (narracoes-geradas/) e só então os envia. Edge-TTS é gratuito; lote diário de até 50.
 *   node --env-file=.env backend/scripts/verificarEEnviarNarracoes.js --slugs=a,b,c            só confere (dry-run)
 *   node --env-file=.env backend/scripts/verificarEEnviarNarracoes.js --slugs=a,b,c --enviar   confere e envia os aprovados
 * Conferência por áudio: (1) duração real (ffprobe) compatível com o texto (caracteres ÷ ~13,7 por segundo, ±30%); (2) decodificação
 * completa sem nenhum erro/corte (ffmpeg -v error); (3) tamanho coerente com 48 kbit/s mono; (4) cabe no limite de envio. Depois do envio,
 * confere que o estado da narração no banco virou "ok". Cada áudio só aparece no site depois de enviado e conferido.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mongoose = require('mongoose');
const { textoParaNarracao, hashNarracao, estadoNarracao, VOZ_NARRACAO } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const PASTA = path.join(RAIZ, 'narracoes-geradas');
const BASE_API = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const CPS = 13.7, FAIXA = [0.7, 1.3], LIMITE_BYTES = 4400 * 1024;
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const enviar = process.argv.includes('--enviar');

function duracao(arq) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arq], { encoding: 'utf8' });
  return parseFloat(r.stdout);
}
function decodificaSemErro(arq) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', arq, '-f', 'null', '-'], { encoding: 'utf8' });
  return { ok: r.status === 0 && !String(r.stderr).trim(), erro: String(r.stderr).trim().slice(0, 120) };
}

(async () => {
  const slugs = arg('slugs').split(',').filter(Boolean);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const rel = { aprovados: [], reprovados: [], enviados: [], falhaEnvio: [] };
  for (const slug of slugs) {
    const arq = path.join(PASTA, `${slug}.mp3`);
    const d = await col.findOne({ slug });
    if (!d || !fs.existsSync(arq)) { rel.reprovados.push(`${slug}: sem documento ou sem mp3`); continue; }
    const texto = textoParaNarracao(d);
    const bytes = fs.statSync(arq).size, seg = duracao(arq), esperado = texto.length / CPS, razao = seg / esperado;
    const dec = decodificaSemErro(arq);
    const motivos = [];
    if (!(razao >= FAIXA[0] && razao <= FAIXA[1])) motivos.push(`duração ${seg.toFixed(0)} s vs ~${esperado.toFixed(0)} s esperados (razão ${razao.toFixed(2)})`);
    if (!dec.ok) motivos.push(`decodificação com erro/corte: ${dec.erro}`);
    if (Math.abs(bytes / 6000 - seg) / seg > 0.15) motivos.push('tamanho incoerente com 48 kbit/s');
    if (bytes > LIMITE_BYTES) motivos.push('acima do limite de envio (4,4 MB)');
    if (motivos.length) { rel.reprovados.push(`${slug}: ${motivos.join('; ')}`); continue; }
    rel.aprovados.push({ slug, seg: Math.round(seg), razao: +razao.toFixed(2) });
    if (!enviar) continue;
    const resp = await fetch(`${BASE_API}/api/artigos/${encodeURIComponent(slug)}/midia/narracao`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'audio/mpeg', 'X-Narracao-Hash': hashNarracao(texto, VOZ_NARRACAO), 'X-Narracao-Caracteres': String(texto.length), 'X-Narracao-Provedor': 'edge', 'X-Narracao-Vinheta': fs.existsSync(path.join(PASTA, `${slug}.vinheta`)) ? '1' : '0', 'X-Narracao-Voz': VOZ_NARRACAO },
      body: fs.readFileSync(arq),
    });
    if (!resp.ok) { rel.falhaEnvio.push(`${slug}: HTTP ${resp.status}`); continue; }
    const depois = estadoNarracao(await col.findOne({ slug })).estado;
    (depois === 'ok' ? rel.enviados : rel.falhaEnvio).push(depois === 'ok' ? slug : `${slug}: enviado mas estado ${depois}`);
  }
  console.log(`${enviar ? 'ENVIAR' : 'CONFERIR'} · aprovados na conferência: ${rel.aprovados.length} · reprovados: ${rel.reprovados.length} · enviados e "ok" no banco: ${rel.enviados.length} · falhas de envio: ${rel.falhaEnvio.length}`);
  if (rel.aprovados.length) console.log(`duração: ${Math.min(...rel.aprovados.map((a) => a.seg))}–${Math.max(...rel.aprovados.map((a) => a.seg))} s · razão duração/esperado: ${Math.min(...rel.aprovados.map((a) => a.razao))}–${Math.max(...rel.aprovados.map((a) => a.razao))}`);
  rel.reprovados.forEach((r) => console.log('  REPROVADO', r)); rel.falhaEnvio.forEach((r) => console.log('  FALHA', r));
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
