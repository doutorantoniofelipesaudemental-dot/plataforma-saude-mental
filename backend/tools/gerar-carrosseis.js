/**
 * Gera carrosséis de Instagram (imagens 1080x1350 + legenda/hashtags) para
 * os artigos do blog, em lote, salvando tudo em disco.
 *
 *   npm run carrosseis                  -> gera os 65 artigos publicados
 *   npm run carrosseis -- --slug=X      -> gera só um artigo (pelo slug)
 *   npm run carrosseis -- --categoria="Médicos & Enfermeiros"
 *   npm run carrosseis -- --saida=./pasta
 *
 * Cada artigo vira uma subpasta em `carrosseis-instagram/<slug>/` com as
 * imagens numeradas, `legenda.txt` (legenda + hashtags) e `info.txt`.
 * Não empacota em zip — para uso em lote é mais rápido revisar pastas soltas
 * do que abrir 65 arquivos .zip. O painel admin, esse sim, baixa em .zip.
 */
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');
const Artigo = require('../models/Artigo');
const { gerarCarrossel } = require('../lib/carrossel');

function lerArgumentos() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] === undefined ? true : m[2];
  }
  return args;
}

async function main() {
  const args = lerArgumentos();
  const pastaSaida = path.resolve(args.saida || './carrosseis-instagram');

  if (!db.isConfigured()) {
    console.error('\n  MONGODB_URI não está definida.');
    console.error('  Copie .env.example para .env e preencha a string de conexão.\n');
    process.exit(1);
  }

  await db.connect();

  const filtro = { publicado: true };
  if (args.slug) filtro.slug = args.slug;
  if (args.categoria) filtro.categoria = args.categoria;

  const artigos = await Artigo.find(filtro).sort({ publicadoEm: 1 }).lean();
  if (artigos.length === 0) {
    console.log('  Nenhum artigo encontrado com esse filtro.');
    await db.mongoose.disconnect();
    return;
  }

  fs.mkdirSync(pastaSaida, { recursive: true });
  console.log(`  Gerando ${artigos.length} carrossel(is) em: ${pastaSaida}\n`);

  let ok = 0;
  let falhas = 0;
  const inicio = Date.now();

  for (const [i, artigo] of artigos.entries()) {
    process.stdout.write(`  [${i + 1}/${artigos.length}] ${artigo.slug} ... `);
    try {
      const resultado = await gerarCarrossel(artigo);
      const pastaArtigo = path.join(pastaSaida, artigo.slug);
      fs.mkdirSync(pastaArtigo, { recursive: true });

      resultado.imagens.forEach((img) => {
        const nome = `${String(img.indice + 1).padStart(2, '0')}-${img.tipo}.png`;
        fs.writeFileSync(path.join(pastaArtigo, nome), img.buffer);
      });

      fs.writeFileSync(
        path.join(pastaArtigo, 'legenda.txt'),
        `${resultado.legenda}\n\n${resultado.hashtags.join(' ')}\n`,
        'utf8'
      );
      fs.writeFileSync(
        path.join(pastaArtigo, 'info.txt'),
        `titulo: ${resultado.titulo}\nslug: ${resultado.slug}\nslides: ${resultado.imagens.length}\ngerado em: ${new Date().toISOString()}\n`,
        'utf8'
      );

      console.log(`ok (${resultado.imagens.length} slides)`);
      ok++;
    } catch (err) {
      console.log(`FALHA: ${err.message}`);
      falhas++;
    }
  }

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`\n  Concluído em ${segundos}s: ${ok} ok, ${falhas} falha(s).\n`);

  await db.mongoose.disconnect();
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\n  Erro inesperado:', err);
  try { await db.mongoose.disconnect(); } catch { /* já pode ter caído */ }
  process.exit(1);
});
