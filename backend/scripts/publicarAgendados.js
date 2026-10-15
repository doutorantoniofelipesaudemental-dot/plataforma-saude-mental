/** CLI do agendador: node --env-file=.env backend/scripts/publicarAgendados.js [--simular] [--agora=2026-10-19T11:00:00Z] */
const { publicarVencidos } = require('../lib/publicarAgendados');
const db = require('../lib/db');
(async () => {
  await db.connect();
  const a = process.argv.find((x) => x.startsWith('--agora='));
  const r = await publicarVencidos({ agora: a ? new Date(a.split('=')[1]) : new Date(), simular: process.argv.includes('--simular') });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(2); });
