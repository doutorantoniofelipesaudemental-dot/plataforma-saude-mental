/**
 * Reverte o status de aprovação sem registro com hash (ordem de 21/10/2026, falha ética).
 *   node scripts/revisao/reverterAprovadasSemRegistro.js            dry-run: conta e mostra, não grava
 *   node scripts/revisao/reverterAprovadasSemRegistro.js --aplicar  faz backup com SHA-256 e reverte para "pendente"
 * Escopo: rascunhos em CONTEUDO_INSTAGRAM/pautas/rascunhos (frontmatter) e registros JSON de pautas.
 * Não toca no registro novo (relatorios/revisoes/registro.json) nem em textos publicados.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RAIZ = path.resolve(__dirname, '..', '..');
const ROTULO = `revisao-aprovada-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
const PASTA_CONTEUDO = path.join(RAIZ, 'CONTEUDO_INSTAGRAM');
const PASTA_PAUTAS = path.join(RAIZ, 'CONTEUDO_INSTAGRAM', 'pautas');
const BACKUP = path.join(RAIZ, 'backups', ROTULO);
const RELATORIO = path.join(RAIZ, 'relatorios', 'revisoes', `REVERSAO-APROVADA-${ROTULO.slice(-8)}.md`);

// [ \t]* e o lookahead preservam o final de linha (CRLF): a troca não pode deixar a linha com LF só.
const RE_FRONT_APROVADA = /^revisaoMedica:[ \t]*aprovad[oa][ \t]*(?=\r?$)/m;
const RE_JSON_APROVADA = /"revisaoMedica"\s*:\s*"aprovada"/g;

// Função pura: troca no frontmatter, remove o "revisadoEm" que acompanhava a aprovação, e não toca no resto.
function reverterTexto(texto) {
  if (!RE_FRONT_APROVADA.test(texto)) return { texto, mudou: false };
  const novo = texto
    .replace(/^revisaoMedica:[ \t]*aprovad[oa][ \t]*(?=\r?$)/m, 'revisaoMedica: pendente')
    .replace(/^revisadoEm:.*\r?\n/m, '');
  return { texto: novo, mudou: true };
}

// Função pura: troca nos registros JSON de pautas (campo rascunho.revisaoMedica).
function reverterJson(texto) {
  const n = (texto.match(RE_JSON_APROVADA) || []).length;
  return { texto: texto.replace(RE_JSON_APROVADA, '"revisaoMedica": "pendente"'), mudou: n };
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Lista recursiva por extensão, sem node_modules e sem backups.
function listar(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const saida = [];
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) { if (n.name !== 'node_modules') saida.push(...listar(p, ext)); continue; }
    if (n.name.endsWith(ext)) saida.push(p);
  }
  return saida;
}

function planejar() {
  const itens = [];
  for (const f of listar(PASTA_CONTEUDO, '.md')) {
    const orig = fs.readFileSync(f, 'utf8');
    const r = reverterTexto(orig);
    if (r.mudou) itens.push({ arquivo: f, tipo: 'texto', original: orig, novo: r.texto });
  }
  for (const f of listar(PASTA_PAUTAS, '.json')) {
    const orig = fs.readFileSync(f, 'utf8');
    const r = reverterJson(orig);
    if (r.mudou) itens.push({ arquivo: f, tipo: 'registro', original: orig, novo: r.texto, trocas: r.mudou });
  }
  return itens;
}

function aplicar(itens) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const manifesto = [];
  for (const it of itens) {
    const rel = path.relative(RAIZ, it.arquivo);
    const destino = path.join(BACKUP, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, it.original, 'utf8');
    if (sha(fs.readFileSync(destino, 'utf8')) !== sha(it.original)) throw new Error(`backup não confere: ${rel}`);
    manifesto.push({ arquivo: rel.replace(/\\/g, '/'), sha256Antes: sha(it.original), sha256Depois: sha(it.novo) });
  }
  fs.writeFileSync(path.join(BACKUP, 'manifesto.json'), JSON.stringify(manifesto, null, 2) + '\n', 'utf8');
  for (const it of itens) fs.writeFileSync(it.arquivo, it.novo, 'utf8');
  return manifesto;
}

function contarRestantes() {
  const textos = listar(PASTA_CONTEUDO, '.md').filter((f) => RE_FRONT_APROVADA.test(fs.readFileSync(f, 'utf8'))).length;
  const registros = listar(PASTA_PAUTAS, '.json').reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(RE_JSON_APROVADA) || []).length, 0);
  return { textos, registros };
}

if (require.main === module) {
  const aplicarDeVerdade = process.argv.includes('--aplicar');
  const antes = contarRestantes();
  const itens = planejar();
  const linhas = [
    `# Reversão da aprovação médica sem registro com hash (${new Date().toISOString().slice(0, 10)})`,
    '',
    `Antes: ${antes.textos} arquivo(s) de texto e ${antes.registros} entrada(s) de pauta com "aprovada".`,
    `Alvo: ${itens.filter((i) => i.tipo === 'texto').length} arquivo(s) de texto e ${itens.filter((i) => i.tipo === 'registro').length} arquivo(s) de registro.`,
    `Modo: ${aplicarDeVerdade ? 'APLICADO (backup em ' + path.relative(RAIZ, BACKUP) + ')' : 'dry-run (nada gravado)'}`,
  ];
  if (aplicarDeVerdade) {
    if (!itens.length) { linhas.push('Nada a reverter.'); }
    else {
      const man = aplicar(itens);
      linhas.push(`Backup verificado: ${man.length} arquivo(s), manifesto com SHA-256.`);
    }
    const depois = contarRestantes();
    linhas.push(`Depois: ${depois.textos} arquivo(s) de texto e ${depois.registros} entrada(s) de pauta com "aprovada".`);
  }
  fs.mkdirSync(path.dirname(RELATORIO), { recursive: true });
  fs.writeFileSync(RELATORIO, linhas.join('\n') + '\n', 'utf8');
  console.log(linhas.join('\n'));
}

module.exports = { reverterTexto, reverterJson, planejar };
