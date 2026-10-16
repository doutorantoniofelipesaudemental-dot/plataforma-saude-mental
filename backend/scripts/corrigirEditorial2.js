/**
 * Decisões do Dr. Antônio de 15/10/2026 (PARTE A):
 *  A.1 jogos-online-criancas: a tabela de classificações sai; entra orientação geral com link do ClassInd (gov.br/mj).
 *      No site (Mongo) o texto não tem tabela: só o link na orientação "respeitar a classificação indicativa".
 *  A.2 selo "Narrativa composta" só onde há personagem, cena ou caso clínico.
 * DRY-RUN POR PADRÃO. Com --aplicar: backup (Mongo + .mdx) e gravação. Cada troca exige ocorrência exata.
 *   node --env-file=.env backend/scripts/corrigirEditorial2.js [--aplicar]
 */
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
const CLASSIND = 'https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1';

const SELO = 'Narrativa composta, construída a partir de padrões observados na prática clínica. Nomes, idades e circunstâncias foram criados ou alterados, e nenhum personagem corresponde a uma pessoa real. ';
const SLUGS_SELO = ['violencia-juventude-e-homicidios', 'violencia-sexual-na-universidade', 'violencia-perdao-e-reparacao', 'migracao-lingua-e-cuidado', 'migracao-maternidade-longe-da-rede', 'ficar-igual-a-foto-com-filtro', 'parei-a-caneta-e-engordei-de-novo', 'compulsao-alimentar-e-obesidade'];

const SITE_JOGOS = { slug: 'jogos-online-criancas', velho: '<li>respeitar a classificação indicativa;</li>', novo: `<li>respeitar a <a href="${CLASSIND}" target="_blank" rel="noopener">classificação indicativa;</a></li>` };

const MDX_JOGOS = 'src/content/artigos/jogos-online-criancas.mdx';
const TROCAS_MDX = [
  [`    <p>Com a entrada em vigor do ECA Digital (Lei nº 15.211/2025) em março de 2026, o Ministério da Justiça e Segurança Pública revisou a classificação indicativa de diversos jogos amplamente usados por crianças:</p>

<table className="game-table">
      <tr><th>Jogo</th><th>Nova classificação</th><th>Motivo principal</th></tr>
      <tr><td>Roblox</td><td>NR16 (não recomendado &lt;16 anos)</td><td>Engajamento contínuo, sistemas de recomendação algorítmica</td></tr>
      <tr><td>Fortnite</td><td>NR16</td><td>Engajamento contínuo, sistemas de recomendação algorítmica</td></tr>
      <tr><td>Free Fire</td><td>NR16</td><td>Engajamento contínuo, sistemas de recomendação algorítmica</td></tr>
      <tr><td>Minecraft</td><td>NR14 (não recomendado &lt;14 anos)</td><td>Presença de compras dentro do jogo</td></tr>
      <tr><td>EA Sports FC, NBA 2K, WWE 2K</td><td>NR18</td><td>Presença de loot boxes (caixas de recompensa por sorteio)</td></tr>
    </table>`,
   `    <p>Com a entrada em vigor do ECA Digital (Lei nº 15.211/2025) em março de 2026, jogos e plataformas passaram a ter novas obrigações de proteção a crianças e adolescentes. Para saber a faixa etária de cada jogo, a orientação geral é:</p>

<ul>
  <li>acompanhar o que a criança joga, com quem joga e como se sente depois;</li>
  <li>conferir a classificação indicativa na embalagem ou na loja de aplicativos e consultar a página oficial do <a href="${CLASSIND}" target="_blank" rel="noopener">ClassInd (Ministério da Justiça)</a>;</li>
  <li>conversar sobre o que acontece nos jogos, sem julgamento;</li>
  <li>combinar limites de tempo de tela.</li>
</ul>`],
];

const conta = (t, s) => t.split(s).length - 1;

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const problemas = [], registro = [], mud = new Map();
  for (const d of await col.find({}).toArray()) {
    let t = d.conteudo;
    if (SLUGS_SELO.includes(d.slug)) {
      const marca = '<p class="refs-note">';
      if (/Narrativa composta/i.test(t)) problemas.push(`site:${d.slug}: já tem o selo`);
      else if (conta(t, marca) !== 1) problemas.push(`site:${d.slug}: ${conta(t, marca)} parágrafos refs-note (esperado 1)`);
      else { t = t.replace(marca, marca + SELO); registro.push(`site:${d.slug}: selo "Narrativa composta"`); }
    }
    if (d.slug === SITE_JOGOS.slug) {
      if (conta(t, SITE_JOGOS.velho) !== 1) problemas.push(`site:${d.slug}: bullet da classificação ocorre ${conta(t, SITE_JOGOS.velho)}x`);
      else { t = t.replace(SITE_JOGOS.velho, SITE_JOGOS.novo); registro.push(`site:${d.slug}: link do ClassInd na orientação (o texto do site não tem tabela)`); }
    }
    if (t !== d.conteudo) mud.set(d.slug, { d, novo: t, antes: estadoNarracao(d).estado, depois: estadoNarracao({ ...d, conteudo: t }).estado });
  }
  for (const s of [...SLUGS_SELO, SITE_JOGOS.slug]) if (!mud.has(s)) problemas.push(`site:${s}: sem mudança (slug inexistente?)`);

  const arquivos = [];
  const arq = path.join(APP, MDX_JOGOS);
  const orig = fs.readFileSync(arq, 'utf8');
  let t = orig;
  {
    const eol = t.includes(String.fromCharCode(13, 10)) ? String.fromCharCode(13, 10) : String.fromCharCode(10);
    const i = t.indexOf('<p>Com a entrada em vigor do ECA Digital (Lei nº 15.211/2025) em março de 2026, o Ministério');
    const fim = t.indexOf('</table>');
    if (i < 0 || fim < i || conta(t, '</table>') !== 1) problemas.push('next:' + MDX_JOGOS + ': bloco da tabela não localizado');
    else t = t.slice(0, i) + TROCAS_MDX[0][1].trimStart().split(String.fromCharCode(10)).join(eol) + t.slice(fim + '</table>'.length);
  }
  if (/NR1[468]|game-table/.test(t)) problemas.push(`next:${MDX_JOGOS}: ainda há NR/tabela`);
  if (t !== orig) { arquivos.push({ arq, rel: MDX_JOGOS, orig, novo: t }); registro.push(`next:${MDX_JOGOS}: tabela de classificações trocada por orientação geral + ClassInd`); }

  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · textos do site: ${mud.size} · .mdx do Next: ${arquivos.length}`);
  registro.forEach((r) => console.log('  •', r));
  for (const m of mud.values()) console.log(`  narração ${m.d.slug}: ${m.antes} → ${m.depois}`);
  problemas.forEach((p) => console.log('  PROBLEMA', p));
  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const dir = path.join(RAIZ, 'backups', `editorial2-${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}-${p2(dl.getHours())}${p2(dl.getMinutes())}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify([...mud.values()].map((m) => m.d)));
    for (const a of arquivos) { const alvo = path.join(dir, 'mdx', a.rel); fs.mkdirSync(path.dirname(alvo), { recursive: true }); fs.writeFileSync(alvo, a.orig, 'utf8'); }
    const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8'));
    if (lido.length !== mud.size) throw new Error('backup não confere');
    for (const m of mud.values()) await col.updateOne({ _id: m.d._id }, { $set: { conteudo: m.novo, ...(m.d.publicado ? { atualizadoEm: new Date() } : {}) } });
    for (const a of arquivos) fs.writeFileSync(a.arq, a.novo, 'utf8');
    console.log(`GRAVADO. Backup em ${path.relative(RAIZ, dir)} (${lido.length} documentos + ${arquivos.length} .mdx).`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
