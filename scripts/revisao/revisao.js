/**
 * Decisões de revisão médica do Dr. Antônio (ordem de 21/10/2026). Grava só em relatorios/revisoes/registro.json.
 *   npm run aviso:aprovar                       aprova o aviso de transparência (depois de checado)
 *   npm run revisao:aprovar -- slug1 slug2       aprova textos (hash do corpo do texto atual)
 *   npm run revisao:aprovar -- rascunho:<slug>   aprova um rascunho de CONTEUDO_INSTAGRAM/pautas/rascunhos (hash do corpo do rascunho)
 *   npm run revisao:reprovar -- slug -- motivo   reprova um texto
 *   npm run revisao:lote                         lista os rascunhos que passaram nas checagens e esperam a revisão
 *   node scripts/revisao/revisao.js estado slug  mostra o estado sem gravar (aceita rascunho:<slug>)
 * Antes de gravar, o texto passa pela checagem do aviso/texto. Nada vai ao ar daqui: o selo depende de checagem depois.
 * Registro corrompido: o comando para antes de gravar.
 */
const fs = require('node:fs');
const path = require('node:path');
const R = require('../../backend/lib/revisaoMedica');
const ing = require('../../backend/scripts/ingestaoRascunhos');

const RAIZ = path.resolve(__dirname, '../..');
const REGISTRO = path.join(RAIZ, 'relatorios', 'revisoes', 'registro.json');
const LOTE = path.join(RAIZ, 'relatorios', 'revisoes', 'LOTE-PENDENTES.md');
const PASTAS = [
  path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos'),
  path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'content', 'blog'),
];
const PREFIXO_RASCUNHO = 'rascunho:';

// Corpo do texto (depois do frontmatter). O hash cobre só o corpo: gravar metadados não muda o hash.
function corpoDo(texto) {
  const partes = String(texto).replace(/\r\n/g, '\n').split(/^---$/m);
  return partes.length >= 3 ? partes.slice(2).join('---') : String(texto);
}

function arquivoDoSlug(slug) {
  for (const dir of PASTAS) {
    for (const ext of ['.mdx', '.md']) {
      const f = path.join(dir, slug + ext);
      if (fs.existsSync(f)) return f;
    }
  }
  return null;
}

// Rascunho pelo slug do Frontmatter (pasta de rascunhos da ingestão). Null se não existir.
function arquivoDoRascunho(slug) {
  if (!fs.existsSync(ing.PASTA_RASCUNHOS)) return null;
  for (const nome of fs.readdirSync(ing.PASTA_RASCUNHOS)) {
    if (!nome.endsWith('.md')) continue;
    const arq = path.join(ing.PASTA_RASCUNHOS, nome);
    const { dados, valido } = ing.lerFrontmatter(fs.readFileSync(arq, 'utf8'));
    if (valido && dados.slug === slug) return arq;
  }
  return null;
}

// Registro corrompido dá erro aqui: o comando para antes de gravar qualquer coisa.
function lerRegistro() {
  return ing.lerRegistroRevisao(REGISTRO);
}

function gravarRegistro(reg) {
  fs.mkdirSync(path.dirname(REGISTRO), { recursive: true });
  fs.writeFileSync(REGISTRO, JSON.stringify(reg, null, 2) + '\n', 'utf8');
}

// Função pura: checagem do aviso antes da aprovação (técnica e ética, mínima).
function checarAviso(texto) {
  const falhas = [];
  if (!/Dr\. Antônio Felipe Garabito/.test(texto)) falhas.push('nome do médico sem acento ou sem "Garabito"');
  if (!/inteligência artificial/.test(texto)) falhas.push('falta o aviso de uso de inteligência artificial (CFM 2.454/2026)');
  if (!/Revisão médica individual: pendente/.test(texto)) falhas.push('falta "Revisão médica individual: pendente"');
  if (/revisad[oa] (pel[oa]|por)/i.test(texto)) falhas.push('o aviso não pode dizer que o texto foi revisado');
  if (/psiquiatra/i.test(texto)) falhas.push('"psiquiatra" não pode aparecer como título do médico');
  if (!/\d{2}\/\d{2}\/\d{4}/.test(texto)) falhas.push('falta a data de atualização');
  return falhas;
}

function main() {
const [comando, ...resto] = process.argv.slice(2);
const agora = new Date();

if (comando === 'aviso:aprovar' || comando === 'aviso') {
  const texto = R.avisoPendente({ atualizadoEm: agora });
  const falhas = checarAviso(texto);
  if (falhas.length) { console.log('AVISO NÃO APROVADO. Falhas:\n- ' + falhas.join('\n- ')); process.exitCode = 1; return; }
  console.log(texto);
  if (comando === 'aviso') return;
  const reg = lerRegistro();
  reg._aviso = { hash: R.hashConteudo(R.avisoPendente({ atualizadoEm: new Date(0) })), aprovadoEm: agora.toISOString(), revisor: 'Dr. Antônio Felipe Garabito' };
  gravarRegistro(reg);
  console.log('Aviso aprovado e registrado.');
} else if (comando === 'revisao:aprovar') {
  const reg = lerRegistro();
  for (const id of resto) {
    const ehRascunho = id.startsWith(PREFIXO_RASCUNHO);
    const slug = ehRascunho ? id.slice(PREFIXO_RASCUNHO.length) : id;
    const arq = ehRascunho ? arquivoDoRascunho(slug) : arquivoDoSlug(slug);
    if (!arq) { console.log(`${id}: texto não encontrado ${ehRascunho ? 'em CONTEUDO_INSTAGRAM/pautas/rascunhos' : 'nas pastas do app'}`); process.exitCode = 1; continue; }
    const chave = ehRascunho ? ing.chaveRascunho(slug) : slug;
    const hash = R.hashConteudo(corpoDo(fs.readFileSync(arq, 'utf8')));
    reg[chave] = R.aprovar({ slug: chave, hash, revisor: 'Dr. Antônio Felipe Garabito', data: agora });
    console.log(`${chave}: aprovado (hash ${hash.slice(0, 12)})`);
  }
  gravarRegistro(reg);
} else if (comando === 'revisao:lote') {
  const reg = lerRegistro();
  const { CATEGORIAS } = require('../../backend/models/Artigo');
  const pasta = ing.PASTA_RASCUNHOS;
  const nomes = fs.existsSync(pasta) ? fs.readdirSync(pasta).filter((n) => n.endsWith('.md')).sort() : [];
  const aguardando = [];
  const reprovados = [];
  for (const nome of nomes) {
    const r = { arquivo: nome, ...ing.lerFrontmatter(fs.readFileSync(path.join(pasta, nome), 'utf8')) };
    const motivos = ing.validarRascunho(r, { categorias: CATEGORIAS, registro: reg });
    const deRevisao = motivos.filter((m) => /revisão médica/.test(m));
    const outros = motivos.filter((m) => !/revisão médica/.test(m));
    if (outros.length) reprovados.push({ nome, motivos: outros });
    else if (deRevisao.length) aguardando.push({ nome, slug: r.dados.slug, titulo: r.dados.titulo || '' });
  }
  const linhas = [
    '# Lote de revisão médica (pendentes)', '',
    `Gerado em ${agora.toISOString()}. Só entram rascunhos que passaram nas checagens automáticas; os reprovados não chegam à revisão.`, '',
    `## Aguardando revisão (${aguardando.length})`,
    ...aguardando.map((a) => `- \`${a.slug}\` — ${a.titulo} — revisar com: npm run revisao:aprovar -- ${PREFIXO_RASCUNHO}${a.slug}`), '',
    `## Reprovados nas checagens (${reprovados.length}) — não chegam à revisão`,
    ...reprovados.map((x) => `- \`${x.nome}\`: ${x.motivos.join('; ')}`), '',
  ];
  fs.mkdirSync(path.dirname(LOTE), { recursive: true });
  fs.writeFileSync(LOTE, linhas.join('\n'), 'utf8');
  console.log(`lote: ${aguardando.length} aguardando revisão, ${reprovados.length} reprovados nas checagens → ${path.relative(RAIZ, LOTE)}`);
} else if (comando === 'revisao:reprovar') {
  const idx = resto.indexOf('--');
  const slug = resto[0];
  const motivo = idx >= 0 ? resto.slice(idx + 1).join(' ') : '';
  if (!slug || !motivo) { console.log('uso: revisao:reprovar -- <slug> -- <motivo>'); process.exitCode = 1; return; }
  const reg = lerRegistro();
  reg[slug] = R.reprovar({ slug, motivo, data: agora });
  gravarRegistro(reg);
  console.log(`${slug}: reprovado (${motivo})`);
} else if (comando === 'estado') {
  const id = resto[0];
  const ehRascunho = id.startsWith(PREFIXO_RASCUNHO);
  const slug = ehRascunho ? id.slice(PREFIXO_RASCUNHO.length) : id;
  const arq = ehRascunho ? arquivoDoRascunho(slug) : arquivoDoSlug(slug);
  const chave = ehRascunho ? ing.chaveRascunho(slug) : slug;
  const hashAtual = arq ? R.hashConteudo(corpoDo(fs.readFileSync(arq, 'utf8'))) : null;
  console.log(JSON.stringify(R.estadoRevisao({ registro: lerRegistro()[chave], hashAtual })));
} else {
  console.log('comandos: aviso | aviso:aprovar | revisao:aprovar -- <slugs ou rascunho:slug> | revisao:lote | revisao:reprovar -- <slug> -- <motivo> | estado <slug ou rascunho:slug>');
  process.exitCode = 1;
}
}

module.exports = { corpoDo, checarAviso, arquivoDoRascunho };
if (require.main === module) main();
