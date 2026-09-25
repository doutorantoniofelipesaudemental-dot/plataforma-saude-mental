/**
 * Dispara a publicação de um artigo aprovado no Instagram/LinkedIn, com a
 * tripla checagem de backend/lib/socialPublisher.js.
 *
 *   npm run publicar-redes -- --slug=algum-artigo            -> dry-run (mostra os payloads, não publica)
 *   npm run publicar-redes -- --slug=algum-artigo --confirmar -> publica de verdade
 *   npm run publicar-redes -- --id=<ObjectId> --confirmar
 *   npm run publicar-redes -- --slug=X --redes=instagram --confirmar
 *
 * O artigo precisa estar com status "aprovado" no banco (aprove antes via
 * `PUT /api/artigos/:slug` com `{ "status": "aprovado" }`).
 */
const db = require('../lib/db');
const Artigo = require('../models/Artigo');
const { publicarArtigoNasRedes, ErroPublicacao } = require('../lib/socialPublisher');
const { log } = require('../lib/log');

function lerArgumentos() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  }
  return args;
}

async function main() {
  const args = lerArgumentos();

  if (!args.id && !args.slug) {
    log.erro('\n  Informe --id=<ObjectId> ou --slug=<slug-do-artigo>.\n');
    process.exit(1);
  }

  if (!db.isConfigured()) {
    log.erro('\n  MONGODB_URI não está definida.');
    log.erro('  Copie .env.example para .env e preencha a string de conexão.\n');
    process.exit(1);
  }

  await db.connect();

  let artigoId = args.id;
  if (!artigoId) {
    const artigo = await Artigo.findOne({ slug: args.slug }).select('_id').lean();
    if (!artigo) {
      log.erro(`\n  Nenhum artigo encontrado com slug "${args.slug}".\n`);
      await db.mongoose.disconnect();
      process.exit(1);
    }
    artigoId = String(artigo._id);
  }

  const redes = args.redes ? String(args.redes).split(',').map((r) => r.trim()) : undefined;
  const confirmar = Boolean(args.confirmar);

  try {
    const resultado = await publicarArtigoNasRedes(artigoId, { redes, confirmar, origem: 'cli' });

    if (!resultado.executado) {
      log.info(`\n  DRY-RUN — nada foi publicado. ${resultado.motivo}\n`);
      log.info(`  Artigo: ${resultado.artigo.titulo} (${resultado.artigo.slug})`);
      log.info(`  URL:    ${resultado.url}\n`);
      log.info(`  Tripla checagem: ${resultado.checagem.aprovado ? 'APROVADA' : `REPROVADA — ${resultado.checagem.motivo}`}\n`);
      log.info('  Legenda do Instagram:\n');
      log.info(`  ${resultado.legendaInstagram.replace(/\n/g, '\n  ')}\n`);
      log.info('  Payloads que seriam enviados:\n');
      log.info(JSON.stringify(resultado.payloads, null, 2));
      log.info('\n  Rode de novo com --confirmar para publicar de verdade.\n');
    } else {
      log.info(`\n  Publicado com sucesso: ${resultado.artigo.titulo}`);
      log.info(JSON.stringify(resultado.resultados, null, 2));
      log.info('');
    }

    await db.mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    if (err instanceof ErroPublicacao) {
      log.erro(`\n  Bloqueado [${err.codigo}]: ${err.message}\n`);
    } else {
      log.erro('\n  Erro inesperado:', err);
    }
    await db.mongoose.disconnect();
    process.exit(1);
  }
}

main().catch(async (err) => {
  log.erro('\n  Erro inesperado:', err);
  try { await db.mongoose.disconnect(); } catch { /* já pode ter caído */ }
  process.exit(1);
});
