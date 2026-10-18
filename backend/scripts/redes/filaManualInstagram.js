/**
 * Fila MANUAL do Instagram (carrosséis enquanto o teste supervisionado não foi liberado; Reels e Stories sempre).
 * Só leitura do banco; grava arquivos prontos em relatorios/redes/fila-manual/ (fora do Git) para o Dr. Antônio postar pelo celular.
 *   node --env-file=.env backend/scripts/redes/filaManualInstagram.js [--dias=14]
 * Por post: tela-1.png … (na ordem), legenda.txt (com as hashtags permitidas e os avisos), alt.txt e INSTRUCOES.txt (curtas).
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const db = require('../../lib/db');
const { rotaDaMidia } = require('../../lib/redesV2/roteamento');

const SAIDA = path.resolve(__dirname, '../../../relatorios/redes/fila-manual');
const dias = Number((process.argv.find((a) => a.startsWith('--dias=')) || '--dias=14').split('=')[1]);
const bahia = (d) => new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const bufferDe = (b) => (b && b.buffer ? Buffer.from(b.buffer) : Buffer.from(b));

const INSTRUCOES = (p, rota) => `Postar pelo celular (${rota.tipo}) — ${p.titulo}
Data sugerida: ${new Date(p.dataSugerida).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'full', timeStyle: 'short' })}
1. Passe os arquivos para o celular (ordem: tela-1, tela-2, ...).
2. Instagram → + → Publicação → selecione as imagens NA ORDEM → Avançar.
3. Cole a legenda de legenda.txt (inteira, com a assinatura de 3 linhas, CVV 188 · SAMU 192 e as hashtags).
4. Em "Texto alternativo", cole a linha correspondente de alt.txt (opcional).
5. Compartilhar. Depois marque como postado: node --env-file=.env backend/scripts/redes/filaManualInstagram.js --postado=${p._id}
Não publique se a legenda ou as imagens parecerem diferentes do que você aprovou.
`;

(async () => {
  await db.connect();
  const col = (n) => mongoose.connection.db.collection(n);
  const marcar = (process.argv.find((a) => a.startsWith('--postado=')) || '').split('=')[1];
  if (marcar) {
    const r = await col('redes_v2').updateOne({ _id: marcar, status: { $in: ['fila-manual', 'aprovado-checagem'] } }, { $set: { status: 'publicado', publicadoEm: new Date(), publicadoVia: 'manual' } });
    console.log(r.modifiedCount ? `marcado como postado: ${marcar}` : `nada alterado (id inexistente ou já publicado): ${marcar}`);
    return process.exit(0);
  }
  const config = (await col('redes_v2_config').findOne({ _id: 'instagram' })) || {};
  const ate = new Date(Date.now() + dias * 86400e3);
  const posts = await col('redes_v2').find({ status: { $in: ['fila-manual', 'aprovado-checagem'] }, dataSugerida: { $lte: ate } }).sort({ dataSugerida: 1 }).toArray();
  let n = 0;
  for (const p of posts) {
    const rota = rotaDaMidia(p, config);
    if (rota.via !== 'manual') continue;
    const imgs = await col('redes_v2_img').find({ postId: p._id }).sort({ n: 1 }).toArray();
    const dir = path.join(SAIDA, `${bahia(p.dataSugerida)}-${p._id}`);
    fs.mkdirSync(dir, { recursive: true });
    imgs.forEach((im) => fs.writeFileSync(path.join(dir, `tela-${im.n}.png`), bufferDe(im.data)));
    fs.writeFileSync(path.join(dir, 'legenda.txt'), p.legenda, 'utf8');
    fs.writeFileSync(path.join(dir, 'alt.txt'), (p.alts || []).map((a, i) => `${i + 1}. ${a}`).join('\n'), 'utf8');
    fs.writeFileSync(path.join(dir, 'INSTRUCOES.txt'), INSTRUCOES(p, rota), 'utf8');
    n += 1;
  }
  console.log(`fila manual do Instagram: ${n} post(s) nos próximos ${dias} dias → ${path.relative(process.cwd(), SAIDA)}`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(2); });
