#!/usr/bin/env node
/*
 * Levantamento SÓ DE LEITURA (ordem de 09/11/2026, itens 6 e 7). Não grava no banco nem altera textos.
 * Gera: relatorios/reclassificacao-temas-20261109.md e relatorios/levantamento-relatos-20261109.md
 * Uso: node --env-file-if-exists=.env backend/scripts/portal/levantamentoTemas.js
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../../lib/db');
const Artigo = require('../../models/Artigo');
const { TEMAS, SEM_TEMA, RELATOS } = require('../../lib/temas');
const { checarRelato } = require('../../lib/relatos');
const { parseCsv } = require('../../../scripts/plano-diretor/pilares');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const SAIDA_TEMAS = path.join(RAIZ, 'relatorios', 'reclassificacao-temas-20261109.md');
const SAIDA_RELATOS = path.join(RAIZ, 'relatorios', 'levantamento-relatos-20261109.md');

/** Tema proposto pelo plano-diretor (eixo_nome do inventário) → slug do tema. */
function propostaDoInventario(inventario) {
  const mapa = new Map();
  for (const linha of inventario) {
    const tema = TEMAS.find((t) => t.nome === (linha.eixo_nome || '').trim());
    if (tema) mapa.set(linha.slug, tema.slug);
  }
  return mapa;
}

/** Tema que o Blog mostra hoje: campo `tema` ou, sem ele, a categoria-ponte. */
function temaAtual(artigo) {
  if (artigo.tema) return artigo.tema;
  if (artigo.categoria === RELATOS) return '';
  const tema = TEMAS.find((t) => t.categorias.includes(artigo.categoria));
  return tema ? tema.slug : '';
}

function motivo(artigo, proposto) {
  if (artigo.categoria === RELATOS) return 'Relatos da Prática: independente, sem tema (regra 5)';
  if (!proposto) return SEM_TEMA.includes(artigo.categoria) ? 'público profissional/geral: fora dos temas' : 'sem tema proposto no inventário: revisar';
  return 'tema proposto pelo inventário (plano-diretor)';
}

/** Sem banco (--sem-banco): mesmos artigos publicados/agendados, a partir do inventário (categoria = coluna publico). */
function artigosDoInventario(inventario) {
  return inventario
    .filter((l) => ['publicado', 'agendado'].includes((l.status || '').trim()))
    .map((l) => ({ slug: l.slug, titulo: l.titulo, categoria: l.publico, tema: '', conteudo: null, publicado: l.status === 'publicado' }));
}

async function main() {
  const semBanco = process.argv.includes('--sem-banco');
  const inventario = parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8'));
  const proposta = propostaDoInventario(inventario);
  if (!semBanco) {
    if (!db.isConfigured()) throw new Error('Banco não configurado (MONGODB_URI). Rode com --env-file-if-exists=.env.');
    await db.connect();
  }
  try {
    const artigos = semBanco
      ? artigosDoInventario(inventario)
      : await Artigo.find({ $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
          .select('slug titulo categoria tema conteudo publicado agendamento')
          .lean();

    // ---- Item 6: reclassificação de temas (não-relatos)
    const linhas = [];
    let mudaria = 0;
    let semInventario = 0;
    for (const a of artigos.sort((x, y) => x.slug.localeCompare(y.slug))) {
      const atual = temaAtual(a);
      const proposto = a.categoria === RELATOS ? '' : proposta.get(a.slug) || '';
      if (a.categoria !== RELATOS && !proposta.has(a.slug)) semInventario += 1;
      const mudou = proposto !== atual;
      if (mudou) mudaria += 1;
      const nomeAtual = atual ? TEMAS.find((t) => t.slug === atual).curto : '—';
      const nomeProposto = proposto ? TEMAS.find((t) => t.slug === proposto).curto : '—';
      linhas.push(`| ${a.titulo.replace(/\|/g, '/')} | ${nomeAtual} | ${nomeProposto} | ${mudou ? 'muda' : 'mantém'} | ${motivo(a, proposto)} |`);
    }
    const relatosTotal = artigos.filter((a) => a.categoria === RELATOS).length;
    const cabTemas = [
      '# Reclassificação de temas — levantamento (somente leitura)',
      '',
      `Data: 09/11/2026. Fonte: ${semBanco ? '`relatorios/plano-diretor/INVENTARIO.csv` (categoria = coluna publico; sem consulta ao banco)' : 'banco (artigos publicados ou agendados)'} + \`INVENTARIO.csv\` (tema proposto). Nada foi gravado.`,
      '',
      `- Artigos avaliados: **${artigos.length}** (incluindo ${relatosTotal} relatos, que ficam sem tema)`,
      `- Total que mudaria de tema: **${mudaria}**`,
      `- Sem tema proposto no inventário (revisar): ${semInventario}`,
      '- Regra: "Transtornos Mentais" = conceito, diagnóstico e conduta; os outros 6 = psicoeducação e cuidados; Relatos = sem tema.',
      '- Aplicação só depois de revisão do Dr. Antônio: `backend/scripts/portal/reclassificarTemas.js` (dry-run por padrão).',
      '',
      '| Título | Tema atual (Blog) | Tema proposto | Mudança | Motivo |',
      '|---|---|---|---|---|',
    ];
    fs.writeFileSync(SAIDA_TEMAS, `${[...cabTemas, ...linhas].join('\n')}\n`, 'utf8');

    // ---- Item 7: levantamento dos Relatos (texto do banco; sem alterar nada)
    const relatos = artigos.filter((a) => a.categoria === RELATOS);
    const contagem = { total: relatos.length, semNota: 0, semCaixa: 0, suicidio: 0 };
    const detalhes = [];
    if (semBanco) {
      // Sem o texto (só o inventário), não há como checar nota, caixa nem tema: fica pendente do banco.
      contagem.pendente = true;
    }
    for (const r of semBanco ? [] : relatos) {
      const problemas = checarRelato(String(r.conteudo || '').replace(/<[^>]+>/g, ' '));
      if (problemas.includes('nota-ficcao-ausente')) contagem.semNota += 1;
      if (problemas.includes('informacao-clinica-sem-caixa-para-entender')) contagem.semCaixa += 1;
      if (/suic|autoles/i.test(String(r.conteudo || ''))) contagem.suicidio += 1;
      if (problemas.length) detalhes.push(`| ${r.slug} | ${r.publicado ? 'publicado' : 'agendado'} | ${problemas.join(', ')} |`);
    }
    const cabRelatos = [
      '# Relatos da Prática — levantamento (somente leitura)',
      '',
      'Data: 09/11/2026. Verifica nota de ficção, lista de referências, informação clínica sem caixa "Para entender" e tema suicídio/autolesão. Nenhum texto foi alterado.',
      '',
      `- Relatos publicados ou agendados (inventário): **${contagem.total}**`,
      contagem.pendente
        ? '- **PENDENTE DO BANCO:** esta execução foi --sem-banco; nota, caixa e suicídio só saem com o texto (rodar `levantamentoTemas.js` com o `.env` do Dr.).'
        : `- Sem a nota de ficção: **${contagem.semNota}**`,
      ...(contagem.pendente ? [] : [
        `- Com informação clínica sem caixa "Para entender": **${contagem.semCaixa}**`,
        `- Tocam em suicídio/autolesão (revisar CVV 188 · SAMU 192 e orientação OMS 2023): **${contagem.suicidio}**`,
      ]),
      '- Script de inserção da nota (texto fixo, com dry-run/--backup/--aplicar/--conferir/--reverter): proposto, ainda não criado.',
      '',
      '| Slug | Status | Problemas |',
      '|---|---|---|',
    ];
    fs.writeFileSync(SAIDA_RELATOS, `${[...cabRelatos, ...detalhes].join('\n')}\n`, 'utf8');

    console.log(JSON.stringify({ fonte: semBanco ? 'inventario' : 'banco', artigos: artigos.length, mudaria, semInventario, relatos: contagem, saidas: [SAIDA_TEMAS, SAIDA_RELATOS] }, null, 2));
  } finally {
    if (!semBanco) await db.mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[levantamento] erro:', err.message);
  process.exitCode = 1;
});
