// Entrada GENÉRICA de um pacote de YouTube na fila (relatorios/youtube/fila.json).
// Padrão = DRY-RUN: confere tudo e não grava nada.
//   node scripts/youtube/entrarNaFila.js --pacote=<pasta>                 -> dry-run
//   node scripts/youtube/entrarNaFila.js --pacote=<pasta> --backup        -> copia fila.json para backups/ (SHA-256)
//   node scripts/youtube/entrarNaFila.js --pacote=<pasta> --aplicar       -> grava o item (exige backup de hoje; ação do Dr.)
//   node scripts/youtube/entrarNaFila.js --pacote=<pasta> --conferir      -> confere o item gravado com o pacote (não grava)
// Opções: --slot=<ISO> (padrão: 2026-11-24T12:00:00Z), --tipo=longo|short (padrão: longo).
// A fila e o backup ficam na pasta PRINCIPAL do projeto (DRS_RAIZ, padrão C:/DRSAUDEMENTAL), pois são ignorados pelo Git.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ_PRINCIPAL = process.env.DRS_RAIZ || 'C:/DRSAUDEMENTAL';
const FILA = path.join(RAIZ_PRINCIPAL, 'relatorios/youtube/fila.json');
const BKP = path.join(RAIZ_PRINCIPAL, 'backups/youtube-fila');
const SLOT_PADRAO = '2026-11-24T12:00:00.000Z'; // terça 09:00 BRT; o envio roda às 20:15 (PC ligado)
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const args = process.argv.slice(2);
const opt = (nome, padrao) => { const a = args.find((x) => x.startsWith(`--${nome}=`)); return a ? a.split('=').slice(1).join('=') : padrao; };
const hojeISO = () => new Date().toISOString().slice(0, 10);

// Textos: identificação 1x, CVV, aviso de IA, capítulos e referências. Sem placeholders.
function checarDescricao(meta) {
  const p = [];
  const d = meta.descricao || '';
  if (!d) p.push('descrição vazia');
  if (/\[[^\]]*pendente[^\]]*\]|pendente|LINK DO ARTIGO/i.test(d)) p.push('descrição tem pendência/placeholder');
  if (!d.includes(meta.artigo || '#')) p.push('link do artigo ausente na descrição');
  const n = (d.match(/CRM-BA 41322/g) || []).length;
  if (n !== 1) p.push(`identificação aparece ${n}x (deve ser 1)`);
  if (!/Resolução CFM 2\.454\/2026/.test(d)) p.push('aviso de IA (CFM 2.454/2026) ausente');
  if (!/CVV 188/.test(d) || !/SAMU 192/.test(d)) p.push('CVV 188 · SAMU 192 ausente');
  if (!meta.titulo || meta.titulo.length > 100) p.push('título ausente ou com mais de 100 caracteres');
  const caps = (meta.capitulos || []).map((c) => c.inicio);
  if (caps.length) {
    const seg = (t) => t.split(':').reduce((a, b) => a * 60 + Number(b), 0);
    const s = caps.map(seg);
    if (caps.length < 3) p.push('capítulos: menos de 3');
    if (s[0] !== 0) p.push('capítulos: o 1º não começa em 0:00');
    if (s.some((v, i) => i && v - s[i - 1] < 10)) p.push('capítulos: algum com menos de 10 s');
  }
  return p;
}

function checarPacote(pacote, meta) {
  const p = [];
  for (const [k, v] of Object.entries(meta.arquivos || {})) if (!fs.existsSync(path.join(pacote, v))) p.push(`arquivo ausente (${k}): ${v}`);
  if (!meta.arquivos || !meta.arquivos.video) p.push('meta.arquivos.video ausente');
  if (meta.privacidadeInicial !== 'private') p.push('privacidadeInicial deve ser "private"');
  if (!meta.publicarEm) p.push('publicarEm ausente');
  if (!meta.playlist) p.push('playlist ausente');
  if (meta.conteudoSintetico) p.push('conteúdo sintético marcado (decisão 15/11: não marcar)');
  p.push(...checarDescricao(meta));
  return p;
}

function montarItem(pacote, meta, tipo, slot) {
  const hashVideo = sha(path.join(pacote, meta.arquivos.video));
  const id = `${tipo}-${meta.slug}`;
  return {
    id, tipo, slug: meta.slug, titulo: meta.titulo, tituloYoutube: meta.titulo, slot,
    playlist: meta.playlist, pasta: path.relative(RAIZ_PRINCIPAL, pacote).split(path.sep).join('/'),
    tags: meta.tags || [], hashVideo, duracao: meta.duracaoSegundos || null,
    checagem: { texto: ['entrarNaFila: descrição, identificação 1x, CFM 2.454/2026, CVV, capítulos, link'], video: [`hash ${meta.arquivos.video} = ${hashVideo.slice(0, 12)}`] },
    status: 'aprovado-checagem', aprovadoPor: 'Dr. Antônio Felipe (entrada via entrarNaFila.js)',
  };
}

function lerFila() { return JSON.parse(fs.readFileSync(FILA, 'utf8')); }

function main() {
  const pacoteArg = opt('pacote', null);
  if (!pacoteArg) { console.log('uso: --pacote=<pasta> [--backup|--aplicar|--conferir] [--slot=ISO] [--tipo=longo|short]'); return 2; }
  const pacote = path.resolve(pacoteArg);
  const metaPath = path.join(pacote, 'meta.json');
  if (!fs.existsSync(metaPath)) { console.log('BLOQUEADO: sem meta.json em ' + pacote); return 1; }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const tipo = opt('tipo', 'longo');
  const slot = opt('slot', SLOT_PADRAO);
  const modo = args.includes('--aplicar') ? 'aplicar' : args.includes('--backup') ? 'backup' : args.includes('--conferir') ? 'conferir' : 'dry-run';

  if (modo === 'backup') {
    const problemas = checarPacote(pacote, meta);
    if (problemas.length) { console.log('BLOQUEADO antes do backup:\n - ' + problemas.join('\n - ')); return 1; }
    fs.mkdirSync(BKP, { recursive: true });
    const destino = path.join(BKP, `fila-${hojeISO()}-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.json`);
    fs.copyFileSync(FILA, destino);
    console.log(`backup: ${destino} · SHA-256 ${sha(destino)}`);
    return 0;
  }

  const fila = lerFila();
  const item = montarItem(pacote, meta, tipo, slot);

  if (modo === 'conferir') {
    const it = fila.itens.find((i) => i.id === item.id);
    if (!it) { console.log(`item ${item.id} NÃO está na fila`); return 1; }
    const ok = it.hashVideo === sha(path.join(pacote, meta.arquivos.video));
    console.log(`item encontrado: status=${it.status} slot=${it.slot} hash ${ok ? 'confere' : 'DIFERE'}`);
    return ok ? 0 : 1;
  }

  const problemas = checarPacote(pacote, meta);
  if (fila.itens.some((i) => i.id === item.id)) problemas.push('item já existe na fila (não duplica)');
  console.log(JSON.stringify(item, null, 2).slice(0, 1500));
  if (problemas.length) { console.log('\nBLOQUEADO:\n - ' + problemas.join('\n - ')); return 1; }

  if (modo === 'dry-run') { console.log('\nDRY-RUN: nada gravado. Para gravar: --backup e depois --aplicar (ação do Dr.).'); return 0; }

  // --aplicar: exige backup de hoje
  const backupsHoje = fs.existsSync(BKP) ? fs.readdirSync(BKP).filter((f) => f.startsWith(`fila-${hojeISO()}`)) : [];
  if (!backupsHoje.length) { console.log('BLOQUEADO: sem backup de hoje. Rode --backup antes.'); return 1; }
  fila.itens.push(item);
  fs.writeFileSync(FILA, JSON.stringify(fila, null, 1), 'utf8');
  console.log(`gravado: ${item.id} (slot ${slot}). Confira com --conferir.`);
  return 0;
}

try { process.exitCode = main(); } catch (e) { console.log('ERRO: ' + e.message); process.exitCode = 1; }
