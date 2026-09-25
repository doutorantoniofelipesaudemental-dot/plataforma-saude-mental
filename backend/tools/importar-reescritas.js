/**
 * Importa um lote de reescritas aprovadas (backend/data/reescritas/<lote>/)
 * para o MongoDB e para os .mdx do app Next, seguindo o LEIA-ME do lote:
 *
 *   - troca `conteudo` (só o texto antes de "<h2>Ferramenta interativa</h2>"
 *     quando `manter_ferramenta` — o bloco da ferramenta e o script ficam);
 *   - troca `resumo` e `tempoLeitura`;
 *   - mantém slug, título, categoria, capa, narração, visualizações e datas de
 *     publicação;
 *   - backup do estado anterior em backups/reescritas/<lote>/;
 *   - atualiza `atualizadoEm` e grava `reescrita` {lote, hash, importadaEm},
 *     que faz o artigo exibir "Atualizado em" e libera a checagem de conteúdo
 *     da fila de redes.
 *
 *   npm run importar-reescritas -- --lote=semana-1              (prévia)
 *   npm run importar-reescritas -- --lote=semana-1 --confirmar  (grava)
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const db = require('../lib/db');
const Artigo = require('../models/Artigo');
const { listarLotes, montarNovoConteudo } = require('../lib/reescritas');

const RAIZ = path.join(__dirname, '..', '..');
const PASTA_MDX = path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos');
const COMPILADOR_MDX = path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'node_modules', '@mdx-js', 'mdx', 'index.js');

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

/** HTML da reescrita → corpo MDX com os componentes do app (Lead, Callout, RefsNote). */
function htmlParaMdx(html) {
  return html
    .replace(/<p class="lead-para">([\s\S]*?)<\/p>/g, '<Lead>\n$1\n</Lead>')
    .replace(/<p class="refs-note">([\s\S]*?)<\/p>/g, '<RefsNote>\n$1\n</RefsNote>')
    .replace(/<div class="callout"><strong>([\s\S]*?)<\/strong>\s*([\s\S]*?)<\/div>/g, (_, titulo, corpo) => {
      const t = titulo.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<Callout titulo={'${t}'}>\n${corpo.trim()}\n</Callout>`;
    })
    .replace(/ class="/g, ' className="')
    .replace(/<br>/g, '<br />')
    .trim();
}

/** Troca resumo/tempoLeitura, grava atualizadoEm no bloco `metadata` e o corpo. */
function montarMdx(mdxAtual, item, importadaEm) {
  const fim = mdxAtual.indexOf('\n};');
  if (!mdxAtual.startsWith('export const metadata = {') || fim < 0) {
    throw new Error('bloco "export const metadata" não encontrado');
  }
  let meta = mdxAtual.slice(0, fim + 3);
  const tinhaFerramenta = /<CallToTool\s*\/>/.test(mdxAtual.slice(fim));
  const literal = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  meta = meta.replace(/\n  resumo: .*,\n/, `\n  resumo: ${literal(item.resumo)},\n`);
  meta = meta.replace(/\n  tempoLeitura: .*,\n/, `\n  tempoLeitura: ${Number(item.tempoLeitura)},\n`);
  meta = /\n  atualizadoEm: /.test(meta)
    ? meta.replace(/\n  atualizadoEm: .*,\n/, `\n  atualizadoEm: ${literal(importadaEm.toISOString())},\n`)
    : meta.replace(/\n};$/, `\n  atualizadoEm: ${literal(importadaEm.toISOString())},\n};`);

  const corpo = htmlParaMdx(item.html);
  return `${meta}\n\n${corpo}\n${tinhaFerramenta ? '\n<CallToTool />\n' : ''}`;
}

async function validarMdx(texto) {
  const { compile } = await import(pathToFileURL(COMPILADOR_MDX).href);
  await compile(texto);
}

async function main() {
  const args = argumentos();
  const confirmar = Boolean(args.confirmar);
  const lote = listarLotes().find((l) => l.lote === args.lote);
  if (!lote) {
    console.error(`\n  Lote "${args.lote}" não encontrado em backend/data/reescritas/.\n`);
    process.exit(1);
  }

  await db.connect();
  const importadaEm = new Date();
  const pastaBackup = path.join(RAIZ, 'backups', 'reescritas', lote.lote);
  const planos = [];

  // 1) Monta e valida tudo antes de gravar qualquer coisa.
  for (const item of lote.itens) {
    const artigo = await Artigo.findOne({ slug: item.slug }).lean();
    if (!artigo) throw new Error(`artigo "${item.slug}" não existe no banco`);
    const conteudo = montarNovoConteudo(artigo.conteudo, item);

    const arquivoMdx = path.join(PASTA_MDX, `${item.slug}.mdx`);
    let mdx = null;
    if (fs.existsSync(arquivoMdx)) {
      const atual = fs.readFileSync(arquivoMdx, 'utf8').replace(/\r\n/g, '\n');
      mdx = { arquivo: arquivoMdx, atual, novo: montarMdx(atual, item, importadaEm) };
      await validarMdx(mdx.novo);
    }
    planos.push({ item, artigo, conteudo, mdx });
    console.log(
      `  ${item.slug}: conteúdo ${artigo.conteudo.length} → ${conteudo.length} car.` +
        `${item.manter_ferramenta ? ' (ferramenta mantida)' : ''} · tempo ${artigo.tempoLeitura} → ${item.tempoLeitura} min` +
        ` · .mdx ${mdx ? 'válido' : 'inexistente'}`
    );
  }

  if (!confirmar) {
    console.log('\n  PRÉVIA — nada foi gravado. Repita com --confirmar para importar.\n');
    await db.mongoose.disconnect();
    return;
  }

  // 2) Backup de tudo, depois grava.
  fs.mkdirSync(path.join(pastaBackup, 'mdx'), { recursive: true });
  for (const { item, artigo, mdx } of planos) {
    const { conteudo, resumo, tempoLeitura, atualizadoEm, reescrita } = artigo;
    fs.writeFileSync(
      path.join(pastaBackup, `${item.slug}.json`),
      JSON.stringify({ _id: String(artigo._id), slug: item.slug, conteudo, resumo, tempoLeitura, atualizadoEm, reescrita }, null, 2)
    );
    if (mdx) fs.writeFileSync(path.join(pastaBackup, 'mdx', `${item.slug}.mdx`), mdx.atual);
  }

  for (const { item, artigo, conteudo, mdx } of planos) {
    await Artigo.collection.updateOne(
      { _id: artigo._id },
      {
        $set: {
          conteudo,
          resumo: item.resumo,
          tempoLeitura: Number(item.tempoLeitura),
          atualizadoEm: importadaEm,
          reescrita: { lote: lote.lote, hash: item.hash, importadaEm },
        },
      }
    );
    if (mdx) fs.writeFileSync(mdx.arquivo, mdx.novo);
  }
  console.log(`\n  Importado: ${planos.length} artigo(s). Backup em backups/reescritas/${lote.lote}/.\n`);
  await db.mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n  Falha na importação — nada foi gravado se a falha ocorreu na etapa 1:', err.message, '\n');
  try {
    await db.mongoose.disconnect();
  } catch {
    // conexão já pode ter caído.
  }
  process.exit(1);
});
