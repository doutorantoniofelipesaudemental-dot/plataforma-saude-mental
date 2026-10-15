/** Escolhe 5 áudios do lote com mais siglas/nome/números e grava o texto narrado em scratchpad/amostra.json (para conferir a pronúncia por transcrição). */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { textoParaNarracao } = require('../lib/narracao');
const slugs = (process.argv.find((a) => a.startsWith('--slugs=')) || '').split('=')[1].split(',').filter(Boolean);
const RE = /Antônio|\b(CRM|RQE|APS|CVV|SAMU|CAPS|SUS|PAP|NR-1)\b|\b\d{2,4}\b/g;
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental' });
  const col = mongoose.connection.db.collection('artigos');
  const itens = [];
  for (const slug of slugs) {
    const d = await col.findOne({ slug });
    const t = textoParaNarracao(d);
    itens.push({ slug, texto: t, pontos: (t.match(RE) || []).length });
  }
  itens.sort((a, b) => b.pontos - a.pontos);
  const dir = path.join(__dirname, '../../scratchpad');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'amostra.json'), JSON.stringify(itens.slice(0, 5)));
  console.log('amostra:', itens.slice(0, 5).map((i) => `${i.slug}(${i.pontos})`).join(' '));
  await mongoose.disconnect();
})();
