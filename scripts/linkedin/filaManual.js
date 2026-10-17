/**
 * Fila MANUAL do LinkedIn (perfil pessoal do Dr. Antônio; sem API, sem credencial do Developer Portal).
 * Decisão de 17/10/2026: os posts saem à mão, às segundas, quartas e sextas, 19:30 (Bahia), a partir de 28/10/2026.
 *   node --env-file=.env scripts/linkedin/filaManual.js hoje [--data=AAAA-MM-DD] [--copiar] [--abrir] [--linkedin]
 *        monta relatorios/linkedin/POST-DE-HOJE.md (texto pronto, passo a passo, link do texto no site conferido);
 *        --copiar: copia o texto para a área de transferência; --abrir: abre o arquivo no Bloco de Notas;
 *        --linkedin: abre o navegador na caixa "Começar publicação" do LinkedIn (você só cola e clica em Publicar)
 *   node --env-file=.env scripts/linkedin/filaManual.js estado     atualiza relatorios/linkedin/FILA-MANUAL.md, fila.json e o bloco do ESTADO-GERAL.md
 *   node --env-file=.env scripts/linkedin/filaManual.js marcar <id> [AAAA-MM-DD]   marca como "publicado-manual" (a fila automática, se um dia for ligada, não repete)
 * NÃO publica nada sozinho e não automatiza o navegador: publicar por robô no perfil pessoal viola os termos do LinkedIn e arrisca a conta.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const mongoose = require('mongoose');

const RAIZ = path.resolve(__dirname, '../..');
const REL = path.join(RAIZ, 'relatorios', 'linkedin');
const PERFIL = 'https://www.linkedin.com/in/doutor-antonio-felipe-undefined-70990b438';
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const ABERTOS = ['aprovado-checagem', 'manual'];

const bahia = (d) => new Date(new Date(d).getTime() - 3 * 3600e3);
const dataBahia = (d) => bahia(d).toISOString().slice(0, 10);
const br = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const agoraBahia = () => dataBahia(new Date());

async function abrirBanco() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  return mongoose.connection.db;
}

/** Pasta do item em fila-manual (texto.txt e, nos carrosséis, carrossel.pdf). */
function pastaDoItem(it) {
  const dd = `${br(dataBahia(it.slot)).replace('/', '-')}-`;
  const base = path.join(REL, 'fila-manual');
  for (const sem of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    for (const p of fs.readdirSync(path.join(base, sem))) {
      const sufixo = it.tipo === 'carrossel' ? 'carrossel' : 'texto';
      if (p.startsWith(dd) && p.includes(sufixo) && fs.existsSync(path.join(base, sem, p, 'texto.txt'))) return path.join(base, sem, p);
    }
  }
  return null;
}

async function carregar(db) {
  const docs = await db.collection('linkedin_fila').find({}).sort({ slot: 1 }).toArray();
  return docs.map((d) => ({ ...d, dia: dataBahia(d.slot) }));
}

function copiar(texto) {
  const tmp = path.join(process.env.TEMP || RAIZ, 'linkedin-post-do-dia.txt');
  fs.writeFileSync(tmp, texto, 'utf8');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', `Get-Content -Raw -Encoding UTF8 '${tmp}' | Set-Clipboard`], { encoding: 'utf8' });
  fs.rmSync(tmp, { force: true });
  return r.status === 0;
}

async function hoje(db, args) {
  const alvo = (args.find((a) => a.startsWith('--data=')) || '').split('=')[1] || agoraBahia();
  const itens = await carregar(db);
  const doDia = itens.filter((i) => i.dia === alvo && ABERTOS.includes(i.status));
  const atrasados = itens.filter((i) => i.dia < alvo && ABERTOS.includes(i.status));
  const proximo = itens.find((i) => i.dia > alvo && ABERTOS.includes(i.status));
  const it = doDia[0];
  const linhas = [];
  if (!it) {
    linhas.push(`# Post de hoje — ${br(alvo)}`, '', `**Hoje não há post do LinkedIn na fila** (a fila é segunda, quarta e sexta, 19:30 Bahia).`, '', proximo ? `Próximo: **${DIAS[bahia(proximo.slot).getUTCDay()]}, ${br(proximo.dia)}, 19:30** — ${proximo.titulo} (\`${proximo.id}\`).` : 'Não há mais posts abertos na fila.');
    if (atrasados.length) linhas.push('', `⚠ **Atrasados** (a data passou e não foram marcados como publicados): ${atrasados.map((a) => `${br(a.dia)} (${a.id})`).join(', ')}. Se já publicou: \`! npm run linkedin:marcar -- <id>\`.`);
  } else {
    const slugSite = (it.slug || (String(it.url || '').match(/\/artigo\/([^/?#]+)/) || [])[1] || '');
    let noAr = null;
    if (slugSite) { const a = await db.collection('artigos').findOne({ slug: slugSite }, { projection: { publicado: 1 } }); noAr = !!(a && a.publicado === true); }
    const pasta = pastaDoItem(it);
    const pdf = it.pdf ? path.join(RAIZ, it.pdf) : (pasta && fs.existsSync(path.join(pasta, 'carrossel.pdf')) ? path.join(pasta, 'carrossel.pdf') : '');
    linhas.push(
      `# Post de hoje — ${DIAS[bahia(it.slot).getUTCDay()]}, ${br(alvo)}, às 19:30 (Bahia)`, '',
      `- **Item:** \`${it.id}\` · ${it.tipo === 'carrossel' ? 'carrossel em PDF' : 'texto'} · tema ${it.tema}`,
      `- **Título:** ${it.titulo}`,
      `- **Texto do site citado no post:** ${it.url || '—'} → (conferido agora) ${noAr === null ? 'sem link' : noAr ? '✅ já está no ar' : '⚠ **AINDA NÃO PUBLICADO**: o link do post daria página inexistente; espere o texto sair (08:00) ou adie o post'}`,
      `- **Perfil onde publicar:** ${PERFIL}`,
      pdf ? `- **Anexar o PDF:** \`${pdf}\` (no LinkedIn: Começar publicação → ícone de documento → escolha esse arquivo)` : '',
      '', '## Como publicar (2 minutos)',
      '1. Copie o bloco "Texto para colar" abaixo (se rodou com `--copiar`, o texto já está na área de transferência).',
      '2. Abra o LinkedIn no perfil pessoal → **Começar publicação** (ou `! npm run linkedin:hoje -- --linkedin` abre essa caixa).',
      '3. Cole (Ctrl + V), confira o texto e clique em **Publicar**.',
      `4. Marque como feito: \`! npm run linkedin:marcar -- ${it.id}\``, '',
      '## Texto para colar', '', '```', it.texto || '(sem texto: veja a pasta fila-manual)', '```');
    if (atrasados.length) linhas.push('', `⚠ **Atrasados** (não marcados como publicados): ${atrasados.map((a) => `${br(a.dia)} (${a.id})`).join(', ')}.`);
    if (args.includes('--copiar')) linhas.push('', copiar(it.texto || '') ? '_Texto copiado para a área de transferência._' : '_Não consegui copiar automaticamente: copie o bloco acima._');
  }
  const arq = path.join(REL, 'POST-DE-HOJE.md');
  fs.writeFileSync(arq, linhas.filter((l) => l !== undefined).join('\n') + '\n', 'utf8');
  console.log(linhas.filter(Boolean).join('\n').slice(0, 2400));
  if (args.includes('--abrir') && (it || atrasados.length)) spawn('notepad.exe', [arq], { detached: true, stdio: 'ignore' }).unref();
  if (args.includes('--linkedin') && it) spawn('cmd.exe', ['/c', 'start', '', 'https://www.linkedin.com/feed/?shareActive=true'], { detached: true, stdio: 'ignore' }).unref();
  return { it, atrasados, proximo };
}

/** fila.json (sem texto), FILA-MANUAL.md (calendário) e bloco do ESTADO-GERAL.md. */
async function estado(db) {
  const itens = await carregar(db);
  const hojeB = agoraBahia();
  const abertos = itens.filter((i) => ABERTOS.includes(i.status));
  const feitos = itens.filter((i) => i.status === 'publicado-manual');
  const atrasados = abertos.filter((i) => i.dia < hojeB);
  const prox = abertos.filter((i) => i.dia >= hojeB).slice(0, 7);
  fs.writeFileSync(path.join(REL, 'fila.json'), JSON.stringify({ geradoEm: new Date().toISOString(), regra: 'seg/qua/sex 19:30 (Bahia), publicação MANUAL no perfil pessoal (sem API)', itens: itens.map(({ texto, _id, dia, ...r }) => ({ ...r, caracteres: (texto || '').length })) }, null, 1), 'utf8');
  const lin = (i) => `| ${DIAS[bahia(i.slot).getUTCDay()].slice(0, 3)} ${br(i.dia)} | ${i.tipo === 'carrossel' ? 'carrossel PDF' : 'texto'} | ${i.titulo} | ${i.status === 'publicado-manual' ? `✅ publicado (${i.publicadoManualEm || ''})` : i.dia < hojeB ? '⚠ atrasado' : 'aberto'} |`;
  const cal = `# Fila manual do LinkedIn — perfil pessoal\n\nPerfil: ${PERFIL}\nQuando: segunda, quarta e sexta, 19:30 (Bahia), de ${br(itens[0].dia)}/${itens[0].dia.slice(0, 4)} a ${br(itens[itens.length - 1].dia)}/${itens[itens.length - 1].dia.slice(0, 4)}. Total ${itens.length} · publicados à mão ${feitos.length} · abertos ${abertos.length} · atrasados ${atrasados.length}.\nNo dia: \`! npm run linkedin:hoje -- --copiar --abrir\` (a tarefa \`DrSM-LinkedIn-Lembrete\` faz isso sozinha às 19:25).\n\n| Dia | Tipo | Título | Situação |\n|---|---|---|---|\n${itens.map(lin).join('\n')}\n`;
  fs.writeFileSync(path.join(REL, 'FILA-MANUAL.md'), cal, 'utf8');
  const bloco = `<!-- LINKEDIN-MANUAL:INICIO -->\n## Fila manual do LinkedIn (perfil pessoal, sem API)\n- Seg/qua/sex 19:30 (Bahia), ${br(itens[0].dia)} a ${br(itens[itens.length - 1].dia)}: **${itens.length} posts** · publicados à mão **${feitos.length}** · abertos **${abertos.length}** · atrasados **${atrasados.length}**. Perfil: ${PERFIL}\n- Próximos: ${prox.length ? prox.map((i) => `${DIAS[bahia(i.slot).getUTCDay()].slice(0, 3)} ${br(i.dia)} (${i.tipo === 'carrossel' ? 'carrossel' : 'texto'})`).join(' · ') : 'nenhum'}\n- No dia: \`! npm run linkedin:hoje -- --copiar --abrir\` · depois \`! npm run linkedin:marcar -- <id>\` · calendário completo em \`relatorios/linkedin/FILA-MANUAL.md\`. A tarefa \`DrSM-LinkedIn-Lembrete\` (seg/qua/sex 19:25) abre o post do dia.\n<!-- LINKEDIN-MANUAL:FIM -->\n`;
  const eg = path.join(RAIZ, 'relatorios', 'ESTADO-GERAL.md');
  if (fs.existsSync(eg)) {
    let t = fs.readFileSync(eg, 'utf8');
    const re = /<!-- LINKEDIN-MANUAL:INICIO -->[\s\S]*?<!-- LINKEDIN-MANUAL:FIM -->\n?/;
    if (re.test(t)) t = t.replace(re, bloco);
    else if (t.includes('## Freios das publicações automáticas')) t = t.replace('## Freios das publicações automáticas', `${bloco}\n## Freios das publicações automáticas`);
    else t = `${t.trimEnd()}\n\n${bloco}`;
    fs.writeFileSync(eg, t, 'utf8');
  }
  console.log(`fila manual: ${itens.length} itens · publicados ${feitos.length} · abertos ${abertos.length} · atrasados ${atrasados.length} · próximos: ${prox.map((i) => br(i.dia)).join(', ')}`);
  return { itens, feitos, abertos, atrasados, prox };
}

async function marcar(db, id, data) {
  const r = await db.collection('linkedin_fila').updateOne({ _id: id, status: { $in: ABERTOS } }, { $set: { status: 'publicado-manual', publicadoManualEm: data || agoraBahia(), atualizadoEm: new Date() } });
  if (!r.matchedCount) throw new Error(`item "${id}" não encontrado ou já marcado`);
  console.log(`marcado como publicado à mão: ${id}`);
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  if (!['hoje', 'estado', 'marcar'].includes(cmd)) { console.error('uso: filaManual.js hoje|estado|marcar <id>'); process.exit(2); }
  const db = await abrirBanco();
  if (cmd === 'hoje') await hoje(db, args);
  if (cmd === 'marcar') { await marcar(db, args[0], args[1]); await estado(db); }
  if (cmd === 'estado') await estado(db);
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
