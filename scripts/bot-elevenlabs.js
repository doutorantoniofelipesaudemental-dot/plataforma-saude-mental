#!/usr/bin/env node
/**
 * ElevenLabs no bot de mídias (backend/lib/elevenlabs.js) — CLAUDE.md, 20-undecies.
 *
 *   npm run bot:elevenlabs -- --desenhar-voz [--descricao="..."] [--texto="..."]
 *       Voice Design: grava as prévias em narracoes-geradas/elevenlabs/voz-design/
 *       para o médico ouvir. Nada é salvo na conta.
 *   npm run bot:elevenlabs -- --salvar-voz=<generated_voice_id> [--nome="..."]
 *       Salva a prévia escolhida e mostra o voice_id para ELEVENLABS_VOICE_ID no .env.
 *   npm run bot:elevenlabs -- --efeito="<descrição do som>" [--duracao=30] [--loop] [--nome=<arquivo>]
 *       Efeito/ambiente sonoro → assets/audio/<nome>.mp3 (entra na escolha automática
 *       de trilha do bot:video-carrossel). Só com plano pago (licença comercial).
 *   npm run bot:elevenlabs -- --dublar --slug=<slug> --peca=reel-carrossel --idioma=en|es
 *       Dubla o vídeo APROVADO da peça → <slug>-videos/dublagens/<peça>.<idioma>.mp4.
 *       Estrutura de internacionalização: a dublagem NÃO é aprovada nem publicada
 *       por este fluxo (o bot:publicar recusa arquivos de dublagens/).
 *
 * Narrar um vídeo com a voz salva: npm run bot:video-carrossel -- --slug=<slug> --narrar --provedor=elevenlabs
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}
const el = require('../backend/lib/elevenlabs');
const { sha256Arquivo } = require('../backend/lib/videoRedes');
const { PASTA_TRILHAS } = require('../backend/lib/trilhas');

const PASTA_SAIDA = path.join(RAIZ, 'narracoes-geradas', 'elevenlabs');
const PASTAS_PACOTE = ['aprovados', 'publicados'].map((p) => path.join(RAIZ, 'CONTEUDO_INSTAGRAM', p));
const AVISO_LICENCA = '⚠️  Uso comercial (Instagram/YouTube) exige plano pago da ElevenLabs — o gratuito não dá licença comercial.';

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

/** Nome de arquivo seguro a partir de um texto livre. */
function nomeArquivo(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'efeito';
}

async function desenharVoz(args) {
  const previas = await el.desenharVoz({
    descricao: args.descricao ? String(args.descricao) : undefined,
    texto: args.texto ? String(args.texto) : undefined,
  });
  const pasta = path.join(PASTA_SAIDA, 'voz-design');
  fs.mkdirSync(pasta, { recursive: true });
  console.log(`\n  ${previas.length} prévia(s) — ouça antes de escolher:`);
  previas.forEach((p, i) => {
    const arquivo = path.join(pasta, `previa-${i + 1}.mp3`);
    fs.writeFileSync(arquivo, p.audio);
    console.log(`    ${i + 1}. ${path.relative(RAIZ, arquivo)}\n       npm run bot:elevenlabs -- --salvar-voz=${p.id}`);
  });
  console.log(`\n  Voz sintética desenhada por descrição (não é clonagem da voz do médico).\n  ${AVISO_LICENCA}\n`);
}

async function salvarVoz(args) {
  const vozId = await el.salvarVoz({ generatedVoiceId: String(args['salvar-voz']), nome: args.nome ? String(args.nome) : undefined });
  console.log(`\n  ✅ Voz salva. Coloque no .env local:\n     ELEVENLABS_VOICE_ID="${vozId}"\n`);
}

async function efeito(args) {
  const texto = String(args.efeito);
  const buffer = await el.gerarEfeito(texto, { duracao: args.duracao ? Number(args.duracao) : undefined, loop: Boolean(args.loop) });
  fs.mkdirSync(PASTA_TRILHAS, { recursive: true });
  const arquivo = path.join(PASTA_TRILHAS, `elevenlabs-${args.nome ? nomeArquivo(args.nome) : nomeArquivo(texto)}.mp3`);
  fs.writeFileSync(arquivo, buffer);
  console.log(`\n  ✅ ${path.relative(RAIZ, arquivo)} (${(buffer.length / 1024).toFixed(0)} KB) — entra na escolha automática de trilha.\n  ${AVISO_LICENCA}\n`);
}

async function dublar(args) {
  const slug = String(args.slug || '');
  const peca = String(args.peca || 'reel-carrossel');
  const idioma = String(args.idioma || '');
  el.validarIdioma(idioma);
  const pasta = PASTAS_PACOTE.find((p) => fs.existsSync(path.join(p, `${slug}.json`)));
  if (!pasta) throw new Error(`pacote "${slug}" não encontrado em aprovados/ nem publicados/`);
  const meta = JSON.parse(fs.readFileSync(path.join(pasta, `${slug}.json`), 'utf8'));
  const arquivo = path.join(pasta, `${slug}-videos`, `${peca}.mp4`);
  if (!fs.existsSync(arquivo)) throw new Error(`vídeo não encontrado: ${path.relative(RAIZ, arquivo)}`);
  // Só se dubla o que o médico aprovou em português — pelo hash do arquivo.
  const hash = sha256Arquivo(arquivo);
  if (!(meta.aprovacao?.midias || []).some((m) => m.peca === peca && m.sha256 === hash)) {
    throw new Error(`${peca}.mp4 não tem aprovação médica (bot:aprovar --midia) — só se dubla o vídeo aprovado`);
  }

  const { id, duracaoEsperada } = await el.criarDublagem({ arquivo, idiomaDestino: idioma, nome: `${slug}-${peca}-${idioma}` });
  console.log(`\n  Dublagem ${id} criada (~${Math.round(duracaoEsperada || 0)} s). Aguardando…`);
  for (let i = 0; i < 120; i++) {
    const s = await el.statusDublagem(id);
    if (s.status === 'dubbed') break;
    if (s.status === 'failed') throw new Error(`dublagem falhou: ${s.erro || 'sem detalhe'}`);
    if (i === 119) throw new Error(`dublagem ainda em "${s.status}" após 10 min — consulte depois pelo id ${id}`);
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  const destino = path.join(pasta, `${slug}-videos`, 'dublagens', `${peca}.${idioma}.mp4`);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, await el.baixarDublagem(id, idioma));
  console.log(`\n  ✅ ${path.relative(RAIZ, destino)}`);
  console.log('  Só estrutura de internacionalização: não é aprovado nem publicado por este fluxo.');
  console.log('  Publicar em outro idioma exige decisão do dono da conta (Regra 17: artes em português; identificação CRM/CFM).\n');
}

async function main() {
  const args = argumentos();
  if (args['desenhar-voz']) return desenharVoz(args);
  if (args['salvar-voz']) return salvarVoz(args);
  if (args.efeito) return efeito(args);
  if (args.dublar) return dublar(args);
  console.log('\n  Use --desenhar-voz | --salvar-voz=<id> | --efeito="<som>" [--duracao=30 --loop] | --dublar --slug=<slug> --peca=<peça> --idioma=en|es\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n  Falha:', err.message, '\n');
    process.exit(1);
  });
}

module.exports = { nomeArquivo };
