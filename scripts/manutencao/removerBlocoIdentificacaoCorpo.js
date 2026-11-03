// Remove do CORPO de artigos já publicados o bloco de identificação duplicado (ordem de 02/11/2026).
// A identificação oficial fica só no rodapé do template (public/artigo.html).
// PADRÃO: dry-run (não grava). Com --aplicar: backup do conteúdo atual em backups/ e update no banco.
// Não toca em narração: o texto narrado e o hash são conferidos antes e depois (têm de ser iguais).
// Uso: node --env-file-if-exists=.env scripts/manutencao/removerBlocoIdentificacaoCorpo.js [--aplicar]
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.join(__dirname, '..', '..');
const N = require(path.join(RAIZ, 'backend', 'lib', 'narracao.js'));
const SLUGS = ['burnout-aps', 'professores-saude-mental', 'psicofarmacos-mitos-culturais', 'tmc-aps'];
const RE = /<p\b[^>]*class="identificacao-medico"[^>]*>[\s\S]*?<\/p>/gi;
const aplicar = process.argv.includes('--aplicar');

async function main() {
  const db = require(path.join(RAIZ, 'backend', 'lib', 'db'));
  if (!db.isConfigured()) throw new Error('MONGODB_URI não configurada: nada feito');
  await db.connect();
  const col = require('mongoose').connection.db.collection('artigos');
  const pasta = path.join(RAIZ, 'backups', 'identificacao-corpo-' + new Date().toISOString().replace(/[:.]/g, '-'));
  const plano = [];
  for (const slug of SLUGS) {
    const art = await col.findOne({ slug, publicado: true }, { projection: { slug: 1, conteudo: 1, narracao: 1 } });
    if (!art) { plano.push({ slug, erro: 'não encontrado ou não publicado' }); continue; }
    const antes = String(art.conteudo || '');
    const depois = antes.replace(RE, '');
    const removidos = (antes.match(RE) || []).length;
    const textoIgual = N.textoParaNarracao({ conteudo: antes }) === N.textoParaNarracao({ conteudo: depois });
    plano.push({ slug, removidos, tamanho: [antes.length, depois.length], narracaoIgual: textoIgual, ok: removidos === 1 && textoIgual });
    if (aplicar && removidos === 1 && textoIgual) {
      fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(path.join(pasta, slug + '.html'), antes, 'utf8');
      await col.updateOne({ slug, publicado: true }, { $set: { conteudo: depois } });
    }
  }
  if (aplicar) fs.writeFileSync(path.join(pasta, 'LEIA-ME.txt'), 'Backup do conteúdo antes da remoção do bloco de identificação (02/11/2026). Restaurar: $set conteudo = arquivo.\n', 'utf8');
  console.log(JSON.stringify({ modo: aplicar ? 'APLICAR' : 'DRY-RUN', backup: aplicar ? pasta : null, plano }, null, 1));
  await require('mongoose').disconnect();
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
