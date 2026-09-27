#!/usr/bin/env node
/**
 * Matriz multimídia obrigatória por artigo (backend/lib/matrizMidia.js).
 *
 *   npm run bot:matriz                                  todos os pacotes: formatos entregues e pendentes
 *   npm run bot:matriz -- --slug=<slug>                 detalhe de um pacote
 *   npm run bot:matriz -- --slug=<slug> --marcar=instagram.stories [--link=<url>] [--nota="..."]
 *
 * Os formatos com API (carrossel, Reel, Shorts, vídeo longo, LinkedIn) são
 * lidos do que o bot:publicar registrou — não precisam ser marcados. --marcar
 * serve para o que é publicado à mão (Stories com enquete) ou para um formato
 * de API que tenha saído manualmente (ex.: LinkedIn antes de haver token).
 * Marcar exige o pacote aprovado pelo médico e não publica nada.
 *
 * Cada execução recalcula e grava a matriz no .json (inclusive nos pacotes
 * anteriores a ela). "totalmente_concluido" só com os seis formatos entregues.
 */
const fs = require('fs');
const path = require('path');
const { FORMATOS, calcularMatriz, marcarExecutado } = require('../backend/lib/matrizMidia');

const RAIZ = path.join(__dirname, '..');
// Ordem de preferência: o pacote mais adiantado vence (publicados > aprovados > rascunhos).
const PASTAS = ['publicados', 'aprovados', 'rascunhos'].map((p) => path.join(RAIZ, 'CONTEUDO_INSTAGRAM', p));
const ICONE = { publicado: '✅', executado: '☑️ ', pendente: '⬜' };

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

function localizar(slug) {
  for (const pasta of PASTAS) {
    const arquivo = path.join(pasta, `${slug}.json`);
    if (fs.existsSync(arquivo)) return { arquivo, pasta: path.basename(pasta) };
  }
  return null;
}

function todosOsSlugs() {
  const slugs = new Set();
  for (const pasta of PASTAS) {
    if (!fs.existsSync(pasta)) continue;
    for (const f of fs.readdirSync(pasta)) if (f.endsWith('.json')) slugs.add(f.slice(0, -5));
  }
  return [...slugs].sort();
}

function lerEAtualizar(slug) {
  const local = localizar(slug);
  if (!local) return null;
  const meta = JSON.parse(fs.readFileSync(local.arquivo, 'utf8'));
  meta.matriz = calcularMatriz(meta);
  fs.writeFileSync(local.arquivo, JSON.stringify(meta, null, 2));
  return { ...local, meta };
}

function detalhe(slug, { meta, pasta }) {
  const m = meta.matriz;
  console.log(`\n  ${slug} (${pasta}${meta.aprovacao ? ', aprovado' : ', NÃO aprovado'})`);
  for (const f of FORMATOS) {
    const e = m.formatos[f.id];
    const extra = e.status === 'pendente' ? (f.via === 'manual' ? ' — manual: publicar e marcar com --marcar=' + f.id : '') : ` — ${e.em ? String(e.em).slice(0, 10) : ''}${e.ref ? ` · ${e.ref}` : ''}${e.nota ? ` · ${e.nota}` : ''}`;
    console.log(`    ${ICONE[e.status]} ${f.rede}: ${f.rotulo} [${e.status}]${extra}`);
  }
  console.log(m.totalmente_concluido ? `\n    🎯 totalmente_concluido desde ${m.concluidoEm.slice(0, 10)}\n` : `\n    Faltam ${m.pendentes.length} de ${FORMATOS.length} formatos.\n`);
}

function main() {
  const args = argumentos();
  if (args.slug) {
    const slug = String(args.slug);
    if (args.marcar) {
      const local = localizar(slug);
      if (!local) throw new Error(`pacote "${slug}" não encontrado em ${PASTAS.map((p) => path.basename(p)).join('/')}`);
      const meta = JSON.parse(fs.readFileSync(local.arquivo, 'utf8'));
      marcarExecutado(meta, String(args.marcar), { ref: args.link ? String(args.link) : null, nota: args.nota ? String(args.nota) : null });
      fs.writeFileSync(local.arquivo, JSON.stringify(meta, null, 2));
      console.log(`\n  Registrado: ${args.marcar} executado.`);
    }
    const r = lerEAtualizar(slug);
    if (!r) throw new Error(`pacote "${slug}" não encontrado`);
    return detalhe(slug, r);
  }

  const slugs = todosOsSlugs();
  if (!slugs.length) return console.log('\n  Nenhum pacote em CONTEUDO_INSTAGRAM/.\n');
  console.log(`\n  Matriz multimídia · ${slugs.length} pacote(s) · colunas: ${FORMATOS.map((f) => f.id).join(', ')}\n`);
  let concluidos = 0;
  for (const slug of slugs) {
    const { meta } = lerEAtualizar(slug);
    const m = meta.matriz;
    if (m.totalmente_concluido) concluidos++;
    const linha = FORMATOS.map((f) => ICONE[m.formatos[f.id].status].trim()).join(' ');
    console.log(`  ${linha}  ${slug}${m.totalmente_concluido ? '  🎯 totalmente_concluido' : `  (faltam ${m.pendentes.length})`}`);
  }
  console.log(`\n  ${concluidos} de ${slugs.length} totalmente concluídos.\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('\n  Falha:', err.message, '\n');
    process.exit(1);
  }
}
