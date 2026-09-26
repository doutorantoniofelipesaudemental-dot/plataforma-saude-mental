#!/usr/bin/env node
/**
 * Aprovação rápida dos rascunhos do bot de mídias (scripts/bot-gemini.js).
 *
 *   npm run bot:aprovar -- --slug=<slug>            aprova um rascunho
 *   npm run bot:aprovar -- --lote                   aprova todos os pendentes
 *   ... --revisado                                  "li e resolvi/aceito os alertas e desvios"
 *
 * Quem roda este comando é o médico responsável: ele registra a revisão e a
 * responsabilidade final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).
 * Por isso a aprovação é recusada quando:
 *   - o artigo mudou depois do rascunho (o rascunho precisa ser refeito);
 *   - há alertas estruturais, desvios apontados pelo revisor semântico, ou o
 *     revisor esteve indisponível — sem --revisado, que declara a revisão.
 *
 * Aprovar não publica nada: copia o rascunho para CONTEUDO_INSTAGRAM/aprovados/
 * (fora do git) com o registro da aprovação, pronto para a publicação manual.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
for (const arquivo of ['.env', '.env.local']) {
  if (fs.existsSync(path.join(RAIZ, arquivo))) process.loadEnvFile(path.join(RAIZ, arquivo));
}

const db = require('../backend/lib/db');
const Artigo = require('../backend/models/Artigo');
const { hashArtigo, hashTexto, AVISO_CFM } = require('./bot-gemini');

const RASCUNHOS = path.join(RAIZ, 'CONTEUDO_INSTAGRAM', 'rascunhos');
const APROVADOS = path.join(RAIZ, 'CONTEUDO_INSTAGRAM', 'aprovados');
const RESPONSAVEL = 'Dr. Antônio Felipe · Médico · CRM-BA 41322 · Medicina de Família e Comunidade · RQE 26638';

function argumentos() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [chave, valor] = a.replace(/^--/, '').split('=');
    args[chave] = valor === undefined ? true : valor;
  }
  return args;
}

/** Linhas do rascunho que mudaram desde a geração (comparando com a cópia <slug>.gerado.md). */
function linhasAlteradas(slug, md) {
  const copia = path.join(RASCUNHOS, `${slug}.gerado.md`);
  if (!fs.existsSync(copia)) return null;
  const limpar = (t) => t.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n').map((l) => l.trimEnd());
  const antes = limpar(fs.readFileSync(copia, 'utf8'));
  const depois = limpar(md);
  const vistas = new Set(antes);
  return depois.filter((l) => l && !vistas.has(l));
}

function lerMeta(slug) {
  const arquivo = path.join(RASCUNHOS, `${slug}.json`);
  return fs.existsSync(arquivo) ? { arquivo, meta: JSON.parse(fs.readFileSync(arquivo, 'utf8')) } : null;
}

async function aprovar(slug, { revisado }) {
  const lido = lerMeta(slug);
  const arquivoMd = path.join(RASCUNHOS, `${slug}.md`);
  if (!lido || !fs.existsSync(arquivoMd)) return { slug, ok: false, motivo: 'rascunho não encontrado — gere com npm run bot:gerar-posts' };
  const { arquivo, meta } = lido;
  if (meta.aprovacao) return { slug, ok: false, motivo: `já aprovado em ${meta.aprovacao.aprovadoEm}` };

  const artigo = await Artigo.findOne({ slug }).lean();
  if (!artigo) return { slug, ok: false, motivo: 'artigo não existe mais no banco' };
  if (hashArtigo(artigo) !== meta.hashArtigo) {
    return { slug, ok: false, motivo: 'o artigo mudou depois do rascunho — refaça: npm run bot:gerar-posts -- --slug=' + slug + ' --forcar' };
  }

  const desvios = meta.revisor?.desvios || [];
  const pendencias = [
    ...meta.alertas.map((a) => `estrutural: ${a}`),
    ...desvios.map((x) => `sentido (${x.gravidade}): ${x.peca} — ${x.problema}`),
    ...(meta.revisor?.disponivel ? [] : ['revisor semântico indisponível — revisão de sentido integral pelo médico']),
  ];
  if (pendencias.length && !revisado) {
    return { slug, ok: false, pendencias, motivo: `${pendencias.length} ponto(s) a revisar. Depois de ler (e corrigir no .md, se preciso): npm run bot:aprovar -- --slug=${slug} --revisado` };
  }

  const md = fs.readFileSync(arquivoMd, 'utf8');
  const agora = new Date();
  meta.aprovacao = {
    aprovadoEm: agora,
    responsavel: RESPONSAVEL,
    declaracao: AVISO_CFM,
    hashRascunhoAprovado: hashTexto(md),
    // Rascunhos gerados antes da normalização guardaram o hash do texto cru:
    // aceita os dois formatos, para não acusar edição que não houve.
    editadoAposGeracao: ![hashTexto(md), require('crypto').createHash('sha256').update(md).digest('hex')].includes(meta.hashRascunhoGerado),
    linhasAlteradas: linhasAlteradas(slug, md),
    pendenciasReconhecidas: pendencias,
  };
  fs.writeFileSync(arquivo, JSON.stringify(meta, null, 2));

  fs.mkdirSync(APROVADOS, { recursive: true });
  const registro = `> ✅ **Aprovado** em ${agora.toISOString().slice(0, 16).replace('T', ' ')} UTC por ${RESPONSAVEL}${
    pendencias.length ? ` — ${pendencias.length} ponto(s) revisado(s)` : ''
  }${meta.aprovacao.editadoAposGeracao ? ' — rascunho editado antes da aprovação' : ''}.\n> ${AVISO_CFM}\n`;
  const aprovado = md.replace(/^# RASCUNHO — /, '# APROVADO — ').replace(/\n\n/, `\n\n${registro}\n`);
  fs.writeFileSync(path.join(APROVADOS, `${slug}.md`), aprovado);
  // Metadados junto do aprovado: é o que o bot-publicar.js lê e onde grava os logs de envio.
  fs.writeFileSync(path.join(APROVADOS, `${slug}.json`), JSON.stringify(meta, null, 2));
  return { slug, ok: true, editado: meta.aprovacao.editadoAposGeracao, linhas: meta.aprovacao.linhasAlteradas, pendencias };
}

async function main() {
  const args = argumentos();
  let slugs;
  if (args.slug) slugs = [String(args.slug)];
  else if (args.lote) {
    slugs = fs.existsSync(RASCUNHOS)
      ? fs.readdirSync(RASCUNHOS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((s) => !lerMeta(s).meta.aprovacao)
      : [];
  } else {
    console.log('\n  Use --slug=<slug> ou --lote [--revisado].\n');
    return;
  }
  if (!slugs.length) {
    console.log('\n  Nenhum rascunho pendente de aprovação.\n');
    return;
  }

  await db.connect();
  console.log('');
  for (const slug of slugs) {
    const r = await aprovar(slug, { revisado: Boolean(args.revisado) });
    if (r.ok) {
      const edicao = r.linhas ? `${r.linhas.length} linha(s) alterada(s) por você` : r.editado ? 'editado (sem cópia do texto gerado para detalhar)' : 'sem edições';
      console.log(`  ✅ ${slug}: aprovado (${edicao}) → CONTEUDO_INSTAGRAM/aprovados/${slug}.md`);
    }
    else {
      console.log(`  ⏸  ${slug}: ${r.motivo}`);
      for (const p of r.pendencias || []) console.log(`       - ${p}`);
    }
  }
  console.log(`\n  ${AVISO_CFM}\n  Aprovar não publica: a publicação dessas peças segue manual.\n`);
  await db.mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n  Falha:', err.message, '\n');
  try {
    await db.mongoose.disconnect();
  } catch {
    // conexão já pode ter caído.
  }
  process.exit(1);
});
