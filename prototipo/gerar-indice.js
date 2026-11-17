// Gera assets/indice.json com títulos e URLs EXISTENTES em public/ (sem criar conteúdo). Roda só localmente.
const fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const paginas = [];
for (const f of fs.readdirSync(PUB)) {
  if (!f.endsWith('.html') || /^(admin|404|artigo).html$/.test(f)) continue;
  const t = fs.readFileSync(path.join(PUB, f), 'utf8');
  const m = t.match(/<title>([^<]+)<\/title>/i);
  if (!m) continue;
  paginas.push({ titulo: m[1].trim(), url: f === 'index.html' ? '/' : '/' + f.replace(/.html$/, '') });
}
for (const [n, nome] of [['1','Ansiedade e rotina'],['2','Saúde mental perinatal'],['3','Idosos'],['4','Cuidar de quem cuida'],['5','Transtornos mentais'],['6','Sono e hábitos'],['7','Sociedade e cultura']]) {
  paginas.push({ titulo: `Pilar ${n}: ${nome}`, url: `/pilares/eixo-${n}.html` });
}
fs.writeFileSync(path.join(__dirname, 'assets', 'indice.json'), JSON.stringify(paginas, null, 1), 'utf8');
console.log(JSON.stringify({ itens: paginas.length }));
