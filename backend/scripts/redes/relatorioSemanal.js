/** Gera relatorios/redes-semana-AAAA-WW.md (semana anterior). node --env-file=.env backend/scripts/redes/relatorioSemanal.js [--agora=ISO] */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../../lib/db');
const { gerarRelatorio } = require('../../lib/redesV2/relatorio');
(async () => {
  await db.connect();
  const a = process.argv.find((x) => x.startsWith('--agora='));
  const r = await gerarRelatorio({ agora: a ? new Date(a.split('=')[1]) : new Date() });
  const dir = path.resolve(__dirname, '../../../relatorios');
  fs.mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, `redes-semana-${r.ano}-${String(r.semana).padStart(2, '0')}.md`);
  fs.writeFileSync(arq, `${r.md}\n`, 'utf8');
  console.log(arq);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(2); });
