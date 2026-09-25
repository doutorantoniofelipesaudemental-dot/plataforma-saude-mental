/**
 * Popula o banco com os artigos iniciais do blog.
 *
 *   npm run seed          -> insere/atualiza os artigos (idempotente, por slug)
 *   npm run seed:reset    -> apaga TODOS os artigos antes de inserir
 *
 * Em banco que já tem artigos, os dois exigem `-- --confirmar`.
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

  const conexao = await db.connect();
  const banco = conexao.connection.db.databaseName;
  console.log(`  Conectado ao MongoDB (banco "${banco}").`);

  // O seed sobrescreve artigos existentes (e --reset apaga todos). Como db.js
  // agora aponta para "drsaudemental" por padrão, rodar isto localmente atinge
  // produção — só prossegue em banco com artigos se pedido explicitamente.
  const existentes = await Artigo.countDocuments();
  if (existentes > 0 && !process.argv.includes('--confirmar')) {
    console.error(`\n  O banco "${banco}" já tem ${existentes} artigo(s).`);
    console.error(
      reset
        ? '  --reset apagaria TODOS eles antes de inserir o seed.'
        : '  O seed sobrescreveria os que têm o mesmo slug com o texto do seed-artigos.js.'
    );
    console.error('  Nada foi alterado. Para prosseguir mesmo assim, repita com --confirmar.\n');
    await db.mongoose.disconnect();
    process.exit(1);
  }

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
