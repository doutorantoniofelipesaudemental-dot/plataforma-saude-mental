/** Publica (ou simula) o próximo post devido: node --env-file=.env backend/scripts/redes/publicarRedes.js [--simular] [--agora=ISO] */
const db = require('../../lib/db');
const { publicarDevidos } = require('../../lib/redesV2/fila');
(async () => {
  await db.connect();
  const a = process.argv.find((x) => x.startsWith('--agora='));
  console.log(JSON.stringify(await publicarDevidos({ agora: a ? new Date(a.split('=')[1]) : new Date(), simular: process.argv.includes('--simular') }), null, 2));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(2); });
