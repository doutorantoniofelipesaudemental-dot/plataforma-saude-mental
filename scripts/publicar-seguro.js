/**
 * PUBLICAR SEGURO (CLAUDE.md): publicação manual fora dos crons. Roda a tripla checagem do item e respeita os freios.
 *   npm run publicar-seguro -- <rede> <id> [--simular]
 *   rede: instagram (post da fila redes_v2) | youtube (id em relatorios/youtube/fila.json) | linkedin (id em linkedin_fila)
 * Instagram e YouTube: usam os mesmos publicadores dos crons, restritos ao item (conferência completa, hashes, freios).
 * LinkedIn: a publicação é pelo agendador NATIVO (skill agendar-linkedin); aqui só se roda a checagem do item e imprime o veredito.
 * Não altera freios, não apaga nada. Reprovou ou freio desligado: não publica.
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const RAIZ = path.resolve(__dirname, '..');
const [rede, id] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const simular = process.argv.includes('--simular');
if (!rede || !id) { console.error('Uso: npm run publicar-seguro -- <instagram|youtube|linkedin> <id> [--simular]'); process.exit(2); }

(async () => {
  if (rede === 'youtube') {
    const r = spawnSync(process.execPath, ['--env-file-if-exists=.env', 'scripts/youtube/publicarYoutube.js', `--id=${id}`, ...(simular ? ['--simular'] : [])], { cwd: RAIZ, stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }
  const db = require('../backend/lib/db');
  await db.connect();
  const mongoose = require('mongoose');
  if (rede === 'instagram') {
    const { publicarDevidos } = require('../backend/lib/redesV2/fila');
    const r = await publicarDevidos({ agora: new Date(Date.now() + 100 * 365 * 864e5), simular, apenasId: id });
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.publicado || r.simulado ? 0 : 1);
  }
  if (rede === 'linkedin') {
    const { checarPost } = require('../backend/lib/linkedinChecagem');
    const it = await mongoose.connection.db.collection('linkedin_fila').findOne({ $or: [{ _id: id }, { id }] });
    if (!it) { console.error(`item ${id} não encontrado em linkedin_fila`); process.exit(1); }
    const falhas = checarPost({ ...it, tipo: it.tipo === 'carrossel' ? 'carrossel' : 'texto' });
    console.log(falhas.length ? `REPROVADO:\n- ${falhas.join('\n- ')}` : 'APROVADO na tripla checagem. Agende pelo agendador NATIVO (skill agendar-linkedin).');
    process.exit(falhas.length ? 1 : 0);
  }
  console.error(`rede desconhecida: ${rede}`); process.exit(2);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
