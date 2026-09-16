/**
 * Popula o banco com os artigos iniciais do blog.
 *
 *   npm run seed          -> insere/atualiza os artigos (idempotente, por slug)
 *   npm run seed:reset    -> apaga TODOS os artigos antes de inserir
 *
 * Nunca toca na coleção de agendamentos.
 */
const db = require('./lib/db');
const Artigo = require('./models/Artigo');
const artigos = require('./seed-artigos');

const reset = process.argv.includes('--reset');

async function main() {
  if (!db.isConfigured()) {
    console.error('\n  MONGODB_URI não está definida.');
    console.error('  Copie .env.example para .env e preencha a string de conexão.\n');
    process.exit(1);
  }

  await db.connect();
  console.log('  Conectado ao MongoDB.');

  if (reset) {
    const { deletedCount } = await Artigo.deleteMany({});
    console.log(`  --reset: ${deletedCount} artigo(s) removido(s).`);
  }

  let criados = 0;
  let atualizados = 0;

  for (const dados of artigos) {
    const existente = await Artigo.findOne({ slug: dados.slug });
    if (existente) {
      // Preserva o contador de visualizações ao reaplicar o seed.
      Object.assign(existente, dados);
      await existente.save();
      atualizados += 1;
      console.log(`  ~ atualizado: ${dados.slug}`);
    } else {
      await Artigo.create(dados);
      criados += 1;
      console.log(`  + criado:     ${dados.slug}`);
    }
  }

  console.log(`\n  Pronto: ${criados} criado(s), ${atualizados} atualizado(s).\n`);
  await db.mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n  Falha no seed:', err.message, '\n');
  try {
    await db.mongoose.disconnect();
  } catch {
    // conexão já pode ter caído; nada a fazer.
  }
  process.exit(1);
});
