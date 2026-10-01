/**
 * Ingestão dos rascunhos de CONTEUDO_INSTAGRAM/pautas/rascunhos/*.md no MongoDB Atlas.
 *
 * Só entra o rascunho que o Dr. Antônio Felipe já revisou: `revisaoMedica: aprovada` no
 * Frontmatter, checagens automáticas aprovadas, categoria válida, sem marcadores
 * [... A CONFIRMAR] e com referências já verificadas. Os demais são listados com o motivo
 * e não são gravados. O upsert é por `slug`; ao inserir, o artigo nasce NÃO publicado
 * (`publicado: false`, status de redes "rascunho"), e ao atualizar não mexe nesses campos.
 *
 *   npm run ingestao:rascunhos -- --dry-run               (valida, não conecta nem grava)
 *   npm run ingestao:rascunhos -- --lote=4 --dry-run
 *   npm run ingestao:rascunhos -- --lote=4                (upsert no MongoDB)
 *   npm run ingestao:rascunhos -- --lote=4 --aprovar-revisao [--dry-run]
 *       marca `revisaoMedica: aprovada` no Frontmatter (e em pautas.json) dos rascunhos do lote
 *       (ou de --slug=...) sem marcadores "A CONFIRMAR"; não toca no banco. Exige --lote ou --slug.
 */
const fs = require('fs');
const path = require('path');
const { escapeHtml, slugify } = require('../lib/texto');

const PASTA_RASCUNHOS = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM', 'pautas', 'rascunhos');
const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RE_MARCADOR = /\[(?:DOSE|DADO|PMID)[^\]]*A CONFIRMAR\]/i;

/** Separa o Frontmatter (chave: valor, valores entre aspas em JSON) do corpo. */
function lerFrontmatter(texto) {
  const m = String(texto).replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { dados: {}, corpo: String(texto), valido: false };
  const dados = {};
  for (const linha of m[1].split('\n')) {
    const i = linha.indexOf(':');
    if (i < 1) continue;
    const valor = linha.slice(i + 1).trim();
    let v = valor;
    if (/^".*"$/.test(valor)) {
      try { v = JSON.parse(valor); } catch { v = valor.slice(1, -1); }
    }
    dados[linha.slice(0, i).trim()] = v;
  }
  return { dados, corpo: m[2], valido: true };
}

const inline = (s) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');

/** Markdown (subconjunto usado nos rascunhos) → HTML. */
function markdownParaHtml(md) {
  const saida = [];
  let lista = null; // 'ul' | 'ol'
  let paragrafo = [];
  const fecharParagrafo = () => { if (paragrafo.length) saida.push(`<p>${inline(paragrafo.join(' '))}</p>`); paragrafo = []; };
  const fecharLista = () => { if (lista) saida.push(`</${lista}>`); lista = null; };
  for (const bruta of String(md).replace(/\r\n/g, '\n').split('\n')) {
    const l = bruta.trim();
    let m;
    if (!l) { fecharParagrafo(); fecharLista(); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) {
      fecharParagrafo(); fecharLista();
      const nivel = Math.min(m[1].length + 1, 6); // o título do artigo é o <h1> da página
      saida.push(`<h${nivel}>${inline(m[2])}</h${nivel}>`);
    } else if ((m = l.match(/^[-*]\s+(.*)$/)) || (m = l.match(/^\d+\.\s+(.*)$/))) {
      fecharParagrafo();
      const tipo = /^\d/.test(l) ? 'ol' : 'ul';
      if (lista !== tipo) { fecharLista(); saida.push(`<${tipo}>`); lista = tipo; }
      saida.push(`<li>${inline(m[1])}</li>`);
    } else if (/^---+$/.test(l)) {
      fecharParagrafo(); fecharLista(); saida.push('<hr>');
    } else if ((m = l.match(/^>\s?(.*)$/))) {
      fecharParagrafo(); fecharLista();
      if (m[1]) saida.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else {
      fecharLista();
      paragrafo.push(l);
    }
  }
  fecharParagrafo(); fecharLista();
  return saida.join('\n');
}

const contarPalavras = (s) => String(s).split(/\s+/).filter((p) => /[\p{L}\d]/u.test(p)).length;

/**
 * Corpo publicável: sem o aviso de RASCUNHO (blockquote inicial), sem o H1 (vira `titulo`) e
 * com a linha em itálico logo abaixo do H1 separada como `resumo`.
 */
function extrairCorpo(corpo) {
  const linhas = String(corpo).replace(/\r\n/g, '\n').split('\n');
  const semAviso = [];
  let noAviso = false;
  for (const l of linhas) {
    if (/^>\s*\*\*RASCUNHO/.test(l)) { noAviso = true; continue; }
    if (noAviso && /^>/.test(l)) continue;
    noAviso = false;
    semAviso.push(l);
  }
  let texto = semAviso.join('\n').replace(/^\s*#\s+[^\n]*\n/, '');
  let resumo = '';
  const m = texto.match(/^\s*\*([^*\n]+)\*\s*\n/);
  if (m) { resumo = m[1].trim(); texto = texto.slice(m[0].length); }
  return { resumo, markdown: texto.trim() };
}

const temMarcadorPendente = (corpo) => RE_MARCADOR.test(extrairCorpo(corpo).markdown);

/**
 * Marca `revisaoMedica: aprovada` (e `revisadoEm`) no Frontmatter. Só é permitido sem marcadores
 * "A CONFIRMAR" (dose, dado ou PMID) e com as checagens automáticas aprovadas.
 * Retorna { texto, motivos }; com motivos não vazios o texto volta intacto.
 */
function aprovarRevisaoTexto(texto, agora = new Date()) {
  const r = lerFrontmatter(texto);
  if (!r.valido) return { texto, motivos: ['Frontmatter ausente ou malformado'] };
  const motivos = [];
  if (/^aprovad[oa]$/i.test(r.dados.revisaoMedica || '')) motivos.push('revisão médica já aprovada');
  if (!/^aprovado/i.test(r.dados.checagensAutomaticas || '')) motivos.push('checagens automáticas não aprovadas');
  if (temMarcadorPendente(r.corpo)) motivos.push('há marcadores "A CONFIRMAR" (dose, dado ou PMID) pendentes');
  if (!/^revisaoMedica:/m.test(texto)) motivos.push('campo revisaoMedica ausente no Frontmatter');
  if (motivos.length) return { texto, motivos };
  const novo = texto
    .replace(/^revisaoMedica:.*$/m, 'revisaoMedica: aprovada')
    .replace(/^(revisaoMedica: aprovada)$/m, `$1\nrevisadoEm: ${agora.toISOString()}`);
  return { texto: novo, motivos: [] };
}

/** Aprova a revisão dos rascunhos informados, gravando o arquivo (salvo em dryRun). */
function aprovarRevisoes(rascunhos, { pasta = PASTA_RASCUNHOS, dryRun = false, agora = new Date() } = {}) {
  const resultado = { aprovados: [], ignorados: [] };
  for (const r of rascunhos) {
    const { texto, motivos } = aprovarRevisaoTexto(r.texto, agora);
    if (motivos.length) { resultado.ignorados.push({ arquivo: r.arquivo, pautaId: r.dados.pautaId, motivos }); continue; }
    if (!dryRun) fs.writeFileSync(path.join(pasta, r.arquivo), texto);
    resultado.aprovados.push({ arquivo: r.arquivo, pautaId: r.dados.pautaId });
  }
  return resultado;
}

/** Motivos pelos quais o rascunho NÃO pode ser gravado (lista vazia = pode). */
function validarRascunho(rascunho, { categorias = null } = {}) {
  const { dados, corpo, valido } = rascunho;
  const motivos = [];
  if (!valido) return ['Frontmatter ausente ou malformado'];
  if (!dados.slug || !RE_SLUG.test(dados.slug)) motivos.push('slug ausente ou inválido');
  if (!dados.titulo) motivos.push('título ausente');
  else if (dados.titulo.length > 180) motivos.push('título acima de 180 caracteres');
  if (!/^aprovad[oa]$/i.test(dados.revisaoMedica || '')) motivos.push(`revisão médica ${dados.revisaoMedica || 'ausente'} (exige "aprovada")`);
  if (!/^aprovado/i.test(dados.checagensAutomaticas || '')) motivos.push('checagens automáticas não aprovadas');
  if (categorias && !categorias.includes(dados.categoria)) motivos.push(`categoria "${dados.categoria || ''}" fora de CATEGORIAS do modelo Artigo`);
  const { resumo, markdown } = extrairCorpo(corpo);
  if (!resumo) motivos.push('resumo (linha em itálico após o título) ausente');
  else if (resumo.length > 320) motivos.push('resumo acima de 320 caracteres');
  if (!markdown) motivos.push('corpo vazio');
  if (RE_MARCADOR.test(markdown)) motivos.push('há marcadores "A CONFIRMAR" (dose, dado ou PMID) pendentes');
  return motivos;
}

/** Documento do modelo Artigo (campos de conteúdo; os de publicação ficam em $setOnInsert). */
function montarArtigo(rascunho) {
  const { dados, corpo } = rascunho;
  const { resumo, markdown } = extrairCorpo(corpo);
  return {
    titulo: dados.titulo,
    slug: dados.slug || slugify(dados.titulo),
    resumo,
    conteudo: markdownParaHtml(markdown),
    categoria: dados.categoria,
    tempoLeitura: Math.min(60, Math.max(1, Math.round(contarPalavras(markdown) / 200))),
  };
}

function lerRascunhos(pasta = PASTA_RASCUNHOS) {
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const texto = fs.readFileSync(path.join(pasta, f), 'utf8');
      return { arquivo: f, texto, ...lerFrontmatter(texto) };
    });
}

/** Filtra pelo lote da pauta (o Frontmatter só traz `pautaId`; o lote vem de pautas.json). */
function filtrarPorLote(rascunhos, lote, registros) {
  const ids = new Set(registros.filter((r) => Number(r.lote) === Number(lote)).map((r) => r.id));
  return rascunhos.filter((r) => ids.has(r.dados.pautaId));
}

/**
 * Valida e faz o upsert por slug. `modelo` é o Artigo (ou um dublê com `updateOne`).
 * Em dryRun nada é gravado. Retorna { gravados, ignorados, falhas }.
 */
async function ingerir(rascunhos, { modelo, dryRun = false, categorias = null } = {}) {
  const resultado = { gravados: [], ignorados: [], falhas: [] };
  const vistos = new Set();
  for (const r of rascunhos) {
    const motivos = validarRascunho(r, { categorias });
    if (r.dados.slug && vistos.has(r.dados.slug)) motivos.push('slug duplicado entre os rascunhos');
    if (motivos.length) { resultado.ignorados.push({ arquivo: r.arquivo, motivos }); continue; }
    vistos.add(r.dados.slug);
    const artigo = montarArtigo(r);
    if (dryRun) { resultado.gravados.push({ arquivo: r.arquivo, slug: artigo.slug, acao: 'simulado' }); continue; }
    try {
      const { slug, ...campos } = artigo;
      const res = await modelo.updateOne(
        { slug },
        { $set: campos, $setOnInsert: { slug, publicado: false, status: 'rascunho' } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      resultado.gravados.push({ arquivo: r.arquivo, slug, acao: res.upsertedCount ? 'inserido' : 'atualizado' });
    } catch (e) {
      resultado.falhas.push({ arquivo: r.arquivo, erro: e.message });
    }
  }
  return resultado;
}

function argumentos(argv = process.argv.slice(2)) {
  const args = {};
  for (const a of argv) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

async function main() {
  const args = argumentos();
  const dryRun = Boolean(args['dry-run']);
  const ideacao = require('../lib/ideacao');
  let rascunhos = lerRascunhos();
  if (args.lote) rascunhos = filtrarPorLote(rascunhos, args.lote, ideacao.lerRegistros());
  if (args.slug) rascunhos = rascunhos.filter((r) => r.dados.slug === args.slug);
  if (args['aprovar-revisao']) {
    if (!args.lote && !args.slug) throw new Error('--aprovar-revisao exige --lote=N ou --slug=...');
    const r = aprovarRevisoes(rascunhos, { dryRun });
    for (const a of r.aprovados) console.log(`  [${dryRun ? 'a aprovar' : 'aprovada'}] ${a.arquivo}`);
    for (const i of r.ignorados) console.log(`  [ignorado] ${i.arquivo}\n      ${i.motivos.join('\n      ')}`);
    if (!dryRun && r.aprovados.length) {
      // PAUTAS.md mostra a revisão médica a partir de pautas.json: mantém os dois em sincronia.
      const registros = ideacao.lerRegistros();
      const ids = new Set(r.aprovados.map((a) => a.pautaId));
      for (const reg of registros) if (reg.rascunho && ids.has(reg.id)) reg.rascunho.revisaoMedica = 'aprovada';
      ideacao.gravarRegistros(registros);
    }
    console.log(`\n${r.aprovados.length} ${dryRun ? 'a aprovar' : 'aprovada(s)'}, ${r.ignorados.length} ignorado(s).`);
    return;
  }
  const Artigo = require('../models/Artigo');
  console.log(`${rascunhos.length} rascunho(s) lido(s)${args.lote ? ` do lote ${args.lote}` : ''}${dryRun ? ' (dry-run: nada será gravado)' : ''}.`);
  const db = require('../lib/db');
  if (!dryRun) await db.connect();
  try {
    const r = await ingerir(rascunhos, { modelo: Artigo, dryRun, categorias: Artigo.CATEGORIAS });
    for (const g of r.gravados) console.log(`  [${g.acao}] ${g.slug}`);
    for (const i of r.ignorados) console.log(`  [ignorado] ${i.arquivo}\n      ${i.motivos.join('\n      ')}`);
    for (const f of r.falhas) console.log(`  [falha] ${f.arquivo}: ${f.erro}`);
    console.log(`\n${r.gravados.length} ${dryRun ? 'a gravar' : 'gravado(s)'}, ${r.ignorados.length} ignorado(s), ${r.falhas.length} falha(s).`);
    if (r.falhas.length) process.exitCode = 1;
  } finally {
    if (!dryRun) await db.mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(`Erro: ${e.message}`); process.exit(1); });
}

module.exports = { aprovarRevisaoTexto, aprovarRevisoes, lerFrontmatter, markdownParaHtml, extrairCorpo, validarRascunho, montarArtigo, lerRascunhos, filtrarPorLote, ingerir, argumentos };
