/** Sobe a fila aprovada (conteudo/redes-v2/) para o banco (redes_v2 + redes_v2_img). Idempotente. */
const db = require('../../lib/db');
const { enviarParaBanco } = require('../../lib/redesV2/fila');
(async () => {
  await db.connect();
  console.log(JSON.stringify(await enviarParaBanco(), null, 2));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(2); });
