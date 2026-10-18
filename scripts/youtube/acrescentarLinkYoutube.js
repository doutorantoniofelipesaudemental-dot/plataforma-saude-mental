/**
 * Acrescenta "Canal e playlists: <site>/youtube" às descrições já geradas (meta.json e fila-manual/descricao.txt), sem refazer vídeo.
 * O hash do vídeo não muda (a descrição não entra nele). Idempotente.
 *   node scripts/youtube/acrescentarLinkYoutube.js [--aplicar]
 */
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');

const aplicar = process.argv.includes('--aplicar');
const LINHA = `Canal e playlists: ${L.SITE}/youtube`;

function ajusta(d) {
  if (!d || d.includes('/youtube')) return d;
  const linhas = d.split('\n');
  const i = linhas.findIndex((l) => /^#\w/.test(l)); // Shorts terminam com hashtags: a linha entra antes delas
  if (i >= 0) linhas.splice(i, 0, LINHA); else linhas.push(LINHA);
  return linhas.join('\n');
}

const fila = JSON.parse(fs.readFileSync(path.join(L.REL, 'fila.json'), 'utf8'));
let metas = 0, manuais = 0;
for (const it of fila.itens) {
  if (!it.pasta) continue;
  const m = path.join(L.RAIZ, it.pasta, 'meta.json');
  if (!fs.existsSync(m)) continue;
  const meta = JSON.parse(fs.readFileSync(m, 'utf8'));
  const nova = ajusta(meta.descricao);
  if (nova !== meta.descricao) { metas++; if (aplicar) { meta.descricao = nova; fs.writeFileSync(m, JSON.stringify(meta, null, 1), 'utf8'); } }
}
const base = path.join(L.REL, 'fila-manual');
const varre = (dir) => { for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) { const p = path.join(dir, e.name); if (e.isDirectory()) varre(p); else if (e.name === 'descricao.txt') { const t = fs.readFileSync(p, 'utf8'); const n = ajusta(t); if (n !== t) { manuais++; if (aplicar) fs.writeFileSync(p, n, 'utf8'); } } } };
varre(base);
console.log(`${aplicar ? 'APLICADO' : 'DRY-RUN'} · meta.json a atualizar: ${metas} · descricao.txt (fila manual): ${manuais}`);
