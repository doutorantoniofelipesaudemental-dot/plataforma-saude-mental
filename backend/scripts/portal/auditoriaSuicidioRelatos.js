#!/usr/bin/env node
/*
 * Auditoria dos Relatos da Prática que tocam em suicídio/autolesão (ordem de 09/11/2026, item 3). SÓ LEITURA.
 * Não grava no banco, não altera textos. Saída: relatorios/logs/auditoria-suicidio-relatos-20261109.md (ignorado pelo Git).
 *
 * Fontes:
 *   --dump <arquivo.json>   export de artigos (ex.: backups/...); offline
 *   (padrão)                banco; exige o .env do Dr.: node --env-file-if-exists=.env backend/scripts/portal/auditoriaSuicidioRelatos.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { classificarRelatoSuicidio } = require('../../lib/auditoriaSuicidio');
const { RELATOS } = require('../../lib/temas');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const SAIDA = path.join(RAIZ, 'relatorios', 'logs', 'auditoria-suicidio-relatos-20261109.md');
const ORDEM = { ALTO: 0, 'MÉDIO': 1, BAIXO: 2 };

function valorDe(nome) {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function lerDump(arquivo) {
  const d = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  return Array.isArray(d) ? d : d.artigos || d.docs || Object.values(d).find(Array.isArray) || [];
}

async function carregarBanco() {
  const db = require('../../lib/db');
  const Artigo = require('../../models/Artigo');
  if (!db.isConfigured()) throw new Error('Banco não configurado. Use --dump ou rode com --env-file-if-exists=.env.');
  await db.connect();
  try {
    return await Artigo.find({ categoria: RELATOS, $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
      .select('slug titulo categoria conteudo publicado agendamento')
      .lean();
  } finally {
    await db.mongoose.disconnect();
  }
}

async function main() {
  const dump = valorDe('--dump');
  const fonte = dump ? `dump ${dump}` : 'banco';
  const artigos = (dump ? lerDump(dump) : await carregarBanco())
    .filter((a) => a.categoria === RELATOS && (a.publicado || (a.agendamento && a.agendamento.agendado)));

  const linhas = [];
  for (const a of artigos) {
    const r = classificarRelatoSuicidio(a.conteudo);
    if (!r.toca) continue;
    linhas.push({
      slug: a.slug,
      status: a.publicado ? 'publicado' : 'agendado',
      nivel: r.nivel,
      criterios: r.criterios.join(', ') || '—',
      evidencia: r.evidencia.replace(/\|/g, '/'),
    });
  }
  linhas.sort((x, y) => ORDEM[x.nivel] - ORDEM[y.nivel] || x.status.localeCompare(y.status) || x.slug.localeCompare(y.slug));

  const cont = (nivel) => linhas.filter((l) => l.nivel === nivel).length;
  const agendadosAlto = linhas.filter((l) => l.nivel === 'ALTO' && l.status === 'agendado').length;
  const cab = [
    '# Auditoria — relatos que tocam em suicídio (triagem OMS 2023, só leitura)',
    '',
    `Fonte: ${fonte} · relatos avaliados: ${artigos.length} · tocam em suicídio/autolesão: **${linhas.length}**`,
    '',
    `- **ALTO: ${cont('ALTO')}** (método, local ou detalhe do meio descritos)`,
    `- **MÉDIO: ${cont('MÉDIO')}** (desfecho sem esperança/caminho de ajuda, ou linguagem "cometeu")`,
    `- **BAIXO: ${cont('BAIXO')}** (toca no tema, sem critério acima)`,
    `- ALTO agendados (candidatos à retirada da agenda, script \`retirarAgendadosAltoRisco.js\`): **${agendadosAlto}**`,
    '',
    'Critérios: a) método · b) local · c) detalhe do meio/quantidade · d) desfecho sem esperança ou sem caminho de ajuda · e) "cometeu". Triagem automática e determinística (sem IA externa): é SUGESTÃO; o Dr. Antônio decide cada caso. Evidência: trecho de até uma linha.',
    '',
    '| Slug | Status | Nível | Critérios | Evidência |',
    '|---|---|---|---|---|',
    ...linhas.map((l) => `| ${l.slug} | ${l.status} | ${l.nivel} | ${l.criterios} | ${l.evidencia} |`),
    '',
  ];
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, `${cab.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify({ fonte, avaliados: artigos.length, tocam: linhas.length, ALTO: cont('ALTO'), MEDIO: cont('MÉDIO'), BAIXO: cont('BAIXO'), agendadosAlto, saida: SAIDA }, null, 2));
}

main().catch((err) => {
  console.error('[auditoria-suicidio] erro:', err.message);
  process.exitCode = 1;
});
