/**
 * Decisões de revisão médica do Dr. Antônio (ordem de 21/10/2026). Grava só em relatorios/revisoes/registro.json.
 *   npm run aviso:aprovar                       aprova o aviso de transparência (depois de checado)
 *   npm run revisao:aprovar -- slug1 slug2       aprova textos (hash do corpo do texto atual)
 *   npm run revisao:reprovar -- slug -- motivo   reprova um texto
 *   node scripts/revisao/revisao.js estado slug  mostra o estado sem gravar
 * Antes de gravar, o texto passa pela checagem do aviso/texto. Nada vai ao ar daqui: o selo depende de checagem depois.
 */
const fs = require('node:fs');
const path = require('node:path');
const R = require('../../backend/lib/revisaoMedica');

const RAIZ = path.resolve(__dirname, '../..');
const REGISTRO = path.join(RAIZ, 'relatorios', 'revisoes', 'registro.json');
const PASTAS = [
  path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos'),
  path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'content', 'blog'),
];

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

function lerRegistro() {
  if (!fs.existsSync(REGISTRO)) return {};
  return JSON.parse(fs.readFileSync(REGISTRO, 'utf8'));
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
  for (const slug of resto) {
    const arq = arquivoDoSlug(slug);
    if (!arq) { console.log(`${slug}: texto não encontrado nas pastas do app`); process.exitCode = 1; continue; }
    const hash = R.hashConteudo(corpoDo(fs.readFileSync(arq, 'utf8')));
    reg[slug] = R.aprovar({ slug, hash, revisor: 'Dr. Antônio Felipe Garabito', data: agora });
    console.log(`${slug}: aprovado (hash ${hash.slice(0, 12)})`);
  }
  gravarRegistro(reg);
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
  const slug = resto[0];
  const arq = arquivoDoSlug(slug);
  const hashAtual = arq ? R.hashConteudo(corpoDo(fs.readFileSync(arq, 'utf8'))) : null;
  console.log(JSON.stringify(R.estadoRevisao({ registro: lerRegistro()[slug], hashAtual })));
} else {
  console.log('comandos: aviso | aviso:aprovar | revisao:aprovar -- <slugs> | revisao:reprovar -- <slug> -- <motivo> | estado <slug>');
  process.exitCode = 1;
}
}

module.exports = { corpoDo, checarAviso };
if (require.main === module) main();
