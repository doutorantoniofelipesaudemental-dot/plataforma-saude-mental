/**
 * Rotina semanal (rodar toda segunda-feira): npm run rotina-semanal
 *  1. auditoria completa (inclui retratações Crossref/PubMed);
 *  2. links quebrados em todos os textos (ignora 403/429 de editoras);
 *  3. validade do token do Instagram e freio das redes;
 *  4. próximos 7 posts da fila (capa sem marca d'água, legenda conferida);
 *  5. progresso da narração.
 * Grava relatorios/rotina-AAAAMMDD.md e atualiza o bloco "Rotina semanal" do relatorios/ESTADO-GERAL.md.
 * SOMENTE LEITURA (não publica nem altera textos). Não imprime segredos. Saída 1 se houver problema.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mongoose = require('mongoose');

const RAIZ = path.resolve(__dirname, '..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const BASE = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const envArg = ['--env-file-if-exists=.env'];
const roda = (args, opts = {}) => spawnSync(process.execPath, [...envArg, ...args], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const problemas = [];
// Link oficial alternativo para fontes que caem de vez em quando (decisão de 15/10/2026): se a fonte falhar em 2 semanas seguidas,
// a rotina manda trocar pelo oficial (backend/scripts/trocarLinkAlternativo.js, dry-run por padrão).
const ALTERNATIVAS_OFICIAIS = {
  'https://www.conass.org.br/?p=43106': 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3681_22_05_2024.html', // CONASS (resumo) → Portaria GM/MS 3.681/2024 no texto oficial
};
const ESTADO_LINKS = path.join(RAIZ, 'relatorios', 'links-estado.json');
const sec = []; // seções do relatório

async function passoAuditoria() {
  const r = roda(['backend/scripts/auditoria.js']);
  const saida = `${r.stdout || ''}`;
  const m = saida.match(/textos auditados: (\d+) .*? · com falha: (\d+)/);
  const arq = (saida.match(/Relatório: (.+)/) || [])[1];
  let ret = '';
  if (arq && fs.existsSync(arq.trim())) ret = (fs.readFileSync(arq.trim(), 'utf8').match(/^Retratações[^\n]*/m) || [''])[0];
  const seg = (saida.match(/segurança: (\d+)/) || [])[1];
  if (!m) { problemas.push('auditoria não rodou (ver saída do comando)'); sec.push('## 1. Auditoria completa\n- NÃO RODOU'); return; }
  if (+m[2] > 0) problemas.push(`auditoria: ${m[2]} texto(s) com falha`);
  if (/retratados: [1-9]/.test(ret)) problemas.push(`retratações: ${ret}`);
  if (seg && +seg > 0) problemas.push(`segurança: ${seg} pendência(s)`);
  sec.push(`## 1. Auditoria completa\n- Textos auditados: ${m[1]} · com falha: ${m[2]} · segurança: ${seg ?? '?'} pendência(s)\n- ${ret || 'Retratações: (sem linha no relatório)'}\n- Relatório: ${arq ? path.relative(RAIZ, arq.trim()) : '—'}`);
}

async function passoLinks(col) {
  const urls = new Map(); // url -> Set(origem)
  const add = (u, o) => { if (!/^https?:\/\//.test(u) || /doi\.org\//.test(u)) return; if (!urls.has(u)) urls.set(u, new Set()); urls.get(u).add(o); };
  const slugs = new Set();
  for (const d of await col.find({}, { projection: { slug: 1, conteudo: 1 } }).toArray()) { slugs.add(d.slug); for (const m of String(d.conteudo).matchAll(/href=["']([^"']+)["']/g)) add(m[1], `site:${d.slug}`); }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx$/.test(e.name) ? [path.join(dir, e.name)] : []));
  for (const f of [...walk(path.join(APP, 'src/content')), ...walk(path.join(APP, 'content'))]) for (const m of fs.readFileSync(f, 'utf8').matchAll(/href=["']([^"']+)["']/g)) add(m[1], `next:${path.basename(f, '.mdx')}`);
  // links internos para outros textos
  const internos = [];
  for (const d of await col.find({}, { projection: { slug: 1, conteudo: 1 } }).toArray()) for (const m of String(d.conteudo).matchAll(/href=["']\/artigo\/([a-z0-9-]+)["']/g)) if (!slugs.has(m[1])) internos.push(`site:${d.slug} → /artigo/${m[1]}`);
  const lista = [...urls.keys()];
  const ruins = [];
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < lista.length) {
      const u = lista[i++];
      let status;
      for (let t = 0; t < 2; t++) {
        try { status = (await fetch(u, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 rotina-semanal' }, signal: AbortSignal.timeout(45000) })).status; break; } catch (e) { status = `ERRO ${e.message.slice(0, 25)}`; }
      }
      const ok = typeof status === 'number' && ((status >= 200 && status < 400) || status === 403 || status === 429);
      if (!ok) ruins.push({ u, status, onde: [...urls.get(u)].slice(0, 2).join(', ') });
    }
  }));
  // falhas seguidas por semana (a rotina roda 1x por semana; mesma semana não conta duas vezes)
  let estado = {}; try { estado = JSON.parse(fs.readFileSync(ESTADO_LINKS, 'utf8')); } catch { /* primeira execução */ }
  const hoje = new Date().toISOString().slice(0, 10), novo = {}, trocar = [];
  for (const r of ruins) {
    const ant = estado[r.u] || { falhasSeguidas: 0, ultima: '' };
    const dias = ant.ultima ? (new Date(hoje) - new Date(ant.ultima)) / 864e5 : 99;
    const falhasSeguidas = dias < 1 ? ant.falhasSeguidas : (dias <= 10 ? ant.falhasSeguidas + 1 : 1);
    novo[r.u] = { falhasSeguidas, ultima: dias < 1 ? ant.ultima : hoje };
    if (falhasSeguidas >= 2 && ALTERNATIVAS_OFICIAIS[r.u]) trocar.push(r);
  }
  // fonte que respondeu bem nesta semana zera o contador (não entra em `novo`)
  fs.writeFileSync(ESTADO_LINKS, JSON.stringify(novo, null, 1), 'utf8');
  for (const r of trocar) problemas.push(`link falhou 2 semanas seguidas: ${r.u} → trocar pelo oficial ${ALTERNATIVAS_OFICIAIS[r.u]} (node --env-file=.env backend/scripts/trocarLinkAlternativo.js --aplicar)`);
  if (ruins.length) problemas.push(`links quebrados: ${ruins.length}`);
  if (internos.length) problemas.push(`links internos para texto inexistente: ${internos.length}`);
  sec.push(`## 2. Links\n- Verificados: ${lista.length} links externos distintos (DOIs ficam na varredura do Crossref) · 403/429 de editoras ignorados\n- Quebrados: ${ruins.length}${ruins.length ? '\n' + ruins.slice(0, 30).map((r) => `  - ${r.status} ${r.u} (${r.onde})`).join('\n') : ''}\n- Links internos para texto inexistente: ${internos.length}${internos.length ? '\n' + internos.slice(0, 15).map((x) => `  - ${x}`).join('\n') : ''}`);
}

async function passoTokenFreio() {
  const linhas = [];
  const r = roda(['backend/scripts/redes/verificarToken.js']);
  try {
    const j = JSON.parse(r.stdout);
    linhas.push(`- Token: ${j.veredito} · conta ${j.conta?.usuario || '—'} · vence em ${j.renovacaoAutomatica?.venceEm || '?'} (${j.renovacaoAutomatica?.diasRestantes ?? '?'} dias) · última renovação ${j.renovacaoAutomatica?.ultimaRenovacao || '—'}`);
    if (j.veredito !== 'TOKEN VÁLIDO') problemas.push('token do Instagram inválido');
    if (j.filaPausada) problemas.push('fila do Instagram pausada');
    const dias = j.renovacaoAutomatica?.diasRestantes;
    if (typeof dias === 'number' && dias < 15) problemas.push(`token vence em ${dias} dias`);
    linhas.push(`- Fila pausada: ${j.filaPausada ? 'SIM (' + j.filaPausada.desde + ')' : 'não'}`);
  } catch { problemas.push('não consegui ler o estado do token'); linhas.push('- Token: NÃO VERIFICADO'); }
  try {
    const f = await fetch(`${BASE}/api/admin/freio-redes`, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } }).then((x) => x.json());
    linhas.push(`- Freio REDES_PUBLICACAO_ATIVA: ${f.publicacaoAtiva === true ? 'ATIVO (true)' : 'NÃO ATIVO'}`);
    if (f.publicacaoAtiva !== true) problemas.push('freio das redes não está ativo');
  } catch { problemas.push('não consegui consultar o freio'); linhas.push('- Freio: NÃO VERIFICADO'); }
  // LinkedIn (token de ~60 dias, sem renovação automática) e YouTube
  const vL = process.env.LINKEDIN_TOKEN_VENCE_EM;
  if (vL) {
    const d = Math.round((new Date(`${vL}T23:59:59-03:00`) - Date.now()) / 864e5);
    linhas.push(`- LinkedIn: token vence em ${vL} (${d} dias)`);
    if (d < 15) problemas.push(`token do LinkedIn vence em ${d} dias (npm run linkedin:autorizar e atualizar na Vercel)`);
  } else linhas.push('- LinkedIn: sem token local (fila manual; ver relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md)');
  linhas.push(`- YouTube: ${process.env.YOUTUBE_REFRESH_TOKEN ? 'autorizado' : 'sem autorização (fila manual em uso)'} · freio YOUTUBE_PUBLICACAO_ATIVA ${process.env.YOUTUBE_PUBLICACAO_ATIVA === 'true' ? 'ativo' : 'desligado'}`);
  sec.push(`## 3. Token e freio\n${linhas.join('\n')}`);
}

async function passoFila() {
  const { checarImagemSemMarcaDagua } = require('../backend/lib/checagensAprovacao');
  const { checarEticaCfm } = require('../backend/lib/checagensAprovacao');
  const { IDENTIFICACAO_3_LINHAS } = require('../backend/lib/legendaInstagram');
  const d = mongoose.connection.db;
  const posts = await d.collection('redes_v2').find({ status: 'aprovado-checagem' }).sort({ dataSugerida: 1 }).limit(7).toArray();
  const total = await d.collection('redes_v2').countDocuments({ status: 'aprovado-checagem' });
  const linhas = [];
  for (const p of posts) {
    const im = await d.collection('redes_v2_img').findOne({ postId: p._id, n: 1 });
    const buf = im ? (im.data.buffer ? Buffer.from(im.data.buffer) : Buffer.from(im.data)) : null;
    const w = buf ? await checarImagemSemMarcaDagua(buf) : { ok: false, falhas: ['sem imagem'] };
    const L = p.legenda || '';
    const prob = [];
    if (!w.ok) prob.push(`capa: ${w.falhas.join('; ')}`);
    if (!L.includes(IDENTIFICACAO_3_LINHAS)) prob.push('sem assinatura curta de 3 linhas');
    if (/Antônio Felipe[^.\n]{0,80}\bpsiquiatra\b/i.test(L)) prob.push('"psiquiatra" como título');
    if (/#psiquiatria/i.test(L)) prob.push('#psiquiatria');
    if (/Antonio Felipe/.test(L)) prob.push('"Antonio" sem acento');
    if (/Ã[©¡£§³ª´µ¢]|â€/.test(L)) prob.push('acentos corrompidos');
    if (!/CVV 188/.test(L) || !/SAMU 192/.test(L)) prob.push('sem CVV 188 · SAMU 192');
    for (const f of checarEticaCfm(L, { contexto: 'social' }).falhas) prob.push(`ética: ${f}`);
    if (prob.length) problemas.push(`fila ${p._id}: ${prob.join(' | ')}`);
    linhas.push(`- ${new Date(p.dataSugerida).toISOString().slice(0, 16)}Z · ${p._id} · ${prob.length ? 'PROBLEMA: ' + prob.join(' | ') : 'capa sem marca d\'água, legenda ok'}`);
  }
  sec.push(`## 4. Próximos 7 posts da fila (${total} aprovados no total)\n${linhas.join('\n') || '- fila vazia'}`);
}

function passoNarracao() {
  const r = roda(['backend/scripts/proximoLoteNarracao.js', '--resumo']);
  try {
    const j = JSON.parse(r.stdout.trim().split('\n').pop());
    sec.push(`## 5. Narração\n- ok: ${j.estados.ok || 0} · desatualizadas: ${j.estados.desatualizada || 0} · ausentes: ${j.estados.ausente || 0} · faltam: ${j.faltam} de ${j.total}`);
    return j;
  } catch { problemas.push('não consegui ler o progresso da narração'); sec.push('## 5. Narração\n- NÃO VERIFICADA'); return null; }
}

(async () => {
  const agora = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const carimbo = `${agora.getFullYear()}${p2(agora.getMonth() + 1)}${p2(agora.getDate())}`;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  await passoAuditoria();
  await passoLinks(col);
  await passoTokenFreio();
  await passoFila();
  const nar = passoNarracao();
  const extras = require('./rotinaExtras'); // 6 Blob · 7 vinheta · 8 YouTube · 9 PDF da Resolução CFM
  await extras.passoBlob({ sec, problemas });
  await extras.passoVinheta({ sec, problemas }, col);
  extras.passoYoutube({ sec, problemas });
  await extras.passoAutorizacaoYoutube({ sec, problemas });
  // 11. Tarefas do Windows: última execução, resultado e se o PC estava ligado (grava relatorios/tarefas-estado.md e o bloco do ESTADO-GERAL.md)
  try { const tar = require('./rotinaTarefas').gravar(); sec.push(`## 11. Tarefas do Windows\n${tar.md.replace(/^### .*\n/, '')}`); problemas.push(...tar.problemas); } catch (e) { sec.push(`## 11. Tarefas do Windows\n- não consegui conferir (${e.message.slice(0, 60)})`); }
  await mongoose.disconnect();
  await extras.passoPdfCfm({ sec, problemas });

  const veredito = problemas.length ? `ATENÇÃO (${problemas.length} problema(s))` : 'TUDO OK';
  const md = `# Rotina semanal — ${carimbo.slice(6)}/${carimbo.slice(4, 6)}/${carimbo.slice(0, 4)}\n\n**Resultado: ${veredito}**\n${problemas.length ? '\n' + problemas.map((x) => `- ⚠ ${x}`).join('\n') + '\n' : ''}\n${sec.join('\n\n')}\n`;
  const arq = path.join(RAIZ, 'relatorios', `rotina-${carimbo}.md`);
  fs.writeFileSync(arq, md, 'utf8');

  // ESTADO-GERAL.md: bloco entre marcadores (criado se não existir)
  const eg = path.join(RAIZ, 'relatorios', 'ESTADO-GERAL.md');
  if (fs.existsSync(eg)) {
    let t = fs.readFileSync(eg, 'utf8');
    const bloco = `<!-- ROTINA:INICIO -->\n## Rotina semanal (última: ${carimbo.slice(6)}/${carimbo.slice(4, 6)}/${carimbo.slice(0, 4)}) — ${veredito}\n${problemas.length ? problemas.map((x) => `- ⚠ ${x}`).join('\n') + '\n' : '- Auditoria, retratações, links, token, freio e próximos 7 posts sem problemas.\n'}${nar ? `- Narração: ${nar.estados.ok || 0} ok · faltam ${nar.faltam}.\n` : ''}- Detalhe: \`relatorios/rotina-${carimbo}.md\`. Rodar toda segunda-feira: \`npm run rotina-semanal\`.\n<!-- ROTINA:FIM -->`;
    t = /<!-- ROTINA:INICIO -->[\s\S]*?<!-- ROTINA:FIM -->/.test(t) ? t.replace(/<!-- ROTINA:INICIO -->[\s\S]*?<!-- ROTINA:FIM -->/, bloco) : t.replace(/\n## Pendências que dependem do Dr\. Antônio/, `\n${bloco}\n\n## Pendências que dependem do Dr. Antônio`);
    fs.writeFileSync(eg, t, 'utf8');
  }
  console.log(`${veredito}\n${problemas.map((x) => ' - ' + x).join('\n')}\nRelatório: ${path.relative(RAIZ, arq)}`);
  process.exit(problemas.length ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
