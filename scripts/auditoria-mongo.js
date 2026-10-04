const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drsaudemental';

async function auditar() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const col = db.collection('artigos');

    const total = await col.countDocuments();
    console.log('\n==================================================');
    console.log(` TOTAL DE ARTIGOS NO BANCO DE DADOS: ${total}`);
    console.log('==================================================\n');

    const porCategoria = await col.aggregate([
      { $group: { _id: "$categoria", total: { $sum: 1 } } },       {$sort: { total: -1 } }
    ]).toArray();

    console.log('--- DISTRIBUIÇÃO POR CATEGORIA ---');
    console.table(porCategoria);

    const porTag = await col.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", total: { $sum: 1 } } },       {$sort: { total: -1 } }
    ]).toArray();

    console.log('\n--- DISTRIBUIÇÃO POR TAGS / PÚBLICOS ---');
    console.table(porTag);

  } catch (err) {
    console.error('Erro na auditoria:', err);
  } finally {
    await mongoose.disconnect();
  }
}

auditar();
