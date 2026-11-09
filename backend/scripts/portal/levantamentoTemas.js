#!/usr/bin/env node
/*
 * Levantamento de temas e Relatos — SÓ LEITURA (ordem de 09/11/2026, itens 3 a 5 da correção de 18:40).
 * Não grava no banco, não altera textos, não usa IA externa. Saídas em relatorios/logs/ (ignorado pelo Git).
 *
 * Uso (pasta principal, depois do merge):
 *   node --env-file-if-exists=.env backend/scripts/portal/levantamentoTemas.js
 * Sem banco (só inventário + títulos): acrescente --sem-banco
 *
 * Regra 5: "Transtornos Mentais" = conceito, diagnóstico e conduta; os outros 6 = psicoeducação e cuidados;
 * Relatos da Prática = sem tema. Grupos:
 *   A: já têm tema pela ponte e o tema proposto é o mesmo (só grava o campo; o leitor não vê mudança);
 *   B: mudam de tema de verdade (inclui órfãos que passam a aparecer num tema), com motivo em 1 linha;
 *   C: dúvidas para decisão do Dr. Antônio (sem tema proposto, ou sinal de conceito/psicoeducação fora da regra 5).
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../../lib/db');
const Artigo = require('../../models/Artigo');
const { TEMAS, RELATOS, PONTES_PROVISORIAS, temaEfetivo } = require('../../lib/temas');
const { checarRelato } = require('../../lib/relatos');
const { SLUG_TRANSTORNOS, temaProposto, duvidaRegra5 } = require('../../lib/classificacaoTemas');
const { parseCsv } = require('../../../scripts/plano-diretor/pilares');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const SAIDA_DIR = path.join(RAIZ, 'relatorios', 'logs');
const SAIDA_TEMAS = path.join(SAIDA_DIR, 'levantamento-temas-20261109.md');
const SAIDA_RELATOS = path.join(SAIDA_DIR, 'levantamento-relatos-20261109.md');
const nomeCurto = (slug) => (slug ? TEMAS.find((t) => t.slug === slug).curto : '—');

function classificar(artigos, proposta) {
  const grupos = { A: [], B: [], C: [] };
  let relatos = 0;
  let orfaos = 0;
  for (const a of artigos) {
    if (a.categoria === RELATOS) { relatos += 1; continue; }
    // "Atual" = o que o leitor vê hoje: campo tema, ou ponte da main (órfãs não aparecem em tema).
    const atual = a.tema || (PONTES_PROVISORIAS.includes(a.categoria) ? '' : temaEfetivo({ categoria: a.categoria }));
    if (PONTES_PROVISORIAS.includes(a.categoria)) orfaos += 1;
    const proposto = proposta.get(a.slug) || '';
    const motivoDuvida = !proposto ? 'sem tema proposto no inventário' : duvidaRegra5(a.titulo, a.resumo, proposto);
    const item = { ...a, atual, proposto, motivoDuvida };
    if (motivoDuvida) grupos.C.push(item);
    else if (atual && atual === proposto) grupos.A.push(item);
    else grupos.B.push({ ...item, motivo: atual ? `inventário propõe ${nomeCurto(proposto)}; hoje ${nomeCurto(atual)}` : `categoria órfã (${a.categoria}): hoje só em Todos; passa a aparecer em ${nomeCurto(proposto)}` });
  }
  return { grupos, relatos, orfaos };
}

const linha = (cols) => `| ${cols.map((c) => String(c ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ')).join(' | ')} |`;

function escreverTemas(artigos, resultado, fonte) {
  const { A, B, C } = resultado.grupos;
  const publicados = artigos.filter((a) => a.publicado).length;
  const cab = [
    '# Levantamento de temas — só leitura (09/11/2026)',
    '',
    `Fonte: ${fonte}. Regra 5 aplicada: Transtornos = conceito/diagnóstico/conduta; outros 6 = psicoeducação e cuidados; Relatos sem tema. Nada foi gravado.`,
    '',
    `- Artigos avaliados (não-relatos): **${A.length + B.length + C.length}** · publicados: ${publicados} · agendados: ${artigos.length - publicados}`,
    `- Relatos (sem tema, fora da conta): ${resultado.relatos}`,
    `- **A (só recebem o campo tema; sem mudança percebida pelo leitor): ${A.length}**`,
    `- **B (mudam de tema de verdade): ${B.length}**`,
    `- **C (dúvidas para decisão do Dr. Antônio): ${C.length}**`,
    `- Órfãos pela ponte atual (Médicos & Enfermeiros, Residentes & Estudantes, Pós-Graduação & Concursos, Geral), que hoje só aparecem em Todos: **${resultado.orfaos}** (incluídos em A, B ou C)`,
    '',
    '## A — só gravar o campo tema',
    '',
    '| Título | Tema (ponte = proposta) |',
    '|---|---|',
    ...A.map((a) => linha([a.titulo, nomeCurto(a.proposto)])),
    '',
    '## B — mudam de tema de verdade (motivo em 1 linha)',
    '',
    '| Título | Hoje | Proposto | Motivo |',
    '|---|---|---|---|',
    ...B.map((a) => linha([a.titulo, nomeCurto(a.atual), nomeCurto(a.proposto), a.motivo])),
    '',
    '## C — casos duvidosos para decisão do Dr. Antônio',
    '',
    '| Título | Hoje | Proposto | Dúvida |',
    '|---|---|---|---|',
    ...C.map((a) => linha([a.titulo, nomeCurto(a.atual), nomeCurto(a.proposto), a.motivoDuvida])),
    '',
  ];
  fs.writeFileSync(SAIDA_TEMAS, `${cab.join('\n')}\n`, 'utf8');
  return { A: A.length, B: B.length, C: C.length, orfaos: resultado.orfaos, publicados };
}

function escreverRelatos(relatos, fonte) {
  const cab = [
    '# Relatos da Prática — levantamento (só leitura, 09/11/2026)',
    '',
    `Fonte: ${fonte}. Verifica nota de ficção (texto exato), lista de referências, informação clínica sem caixa "Para entender" e menção a suicídio/autolesão. Nenhum texto alterado.`,
    '',
    `- Relatos publicados ou agendados: **${relatos.total}**`,
    relatos.semTexto
      ? '- **PENDENTE DO BANCO:** execução sem texto; nota, caixa e suicídio saem só com o `.env` (rodar sem `--sem-banco`).'
      : `- Sem a nota de ficção: **${relatos.semNota}**`,
    ...(relatos.semTexto ? [] : [
      `- Com informação clínica sem caixa "Para entender": **${relatos.semCaixa}**`,
      `- Mencionam suicídio/autolesão (revisar CVV 188 · SAMU 192 e OMS 2023): **${relatos.suicidio}**`,
    ]),
    '',
    '| Slug | Status | Problemas |',
    '|---|---|---|',
    ...relatos.detalhes.map((d) => linha(d)),
    '',
  ];
  fs.writeFileSync(SAIDA_RELATOS, `${cab.join('\n')}\n`, 'utf8');
}

async function main() {
  const semBanco = process.argv.includes('--sem-banco');
  const inventario = parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8'));
  const proposta = temaProposto(inventario);
  fs.mkdirSync(SAIDA_DIR, { recursive: true });

  let artigos;
  if (semBanco) {
    artigos = inventario
      .filter((l) => ['publicado', 'agendado'].includes((l.status || '').trim()))
      .map((l) => ({ slug: l.slug, titulo: l.titulo, resumo: '', categoria: (l.publico || '').trim(), tema: '', conteudo: null, publicado: l.status.trim() === 'publicado' }));
  } else {
    if (!db.isConfigured()) throw new Error('Banco não configurado (MONGODB_URI). Rode com --env-file-if-exists=.env, ou use --sem-banco.');
    await db.connect();
    try {
      artigos = (await Artigo.find({ $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
        .select('slug titulo resumo categoria tema conteudo publicado')
        .lean()).sort((x, y) => x.slug.localeCompare(y.slug));
    } finally {
      await db.mongoose.disconnect();
    }
  }

  const fonte = semBanco ? 'INVENTARIO.csv (títulos; sem resumo nem texto)' : 'banco (título, resumo, texto) + INVENTARIO.csv (tema proposto)';
  const resultado = classificar(artigos, proposta);
  const resumoTemas = escreverTemas(artigos, resultado, fonte);

  const relatosAll = artigos.filter((a) => a.categoria === RELATOS);
  const relatos = { total: relatosAll.length, semTexto: semBanco, semNota: 0, semCaixa: 0, suicidio: 0, detalhes: [] };
  if (!semBanco) {
    for (const r of relatosAll) {
      const texto = String(r.conteudo || '').replace(/<[^>]+>/g, ' ');
      const problemas = checarRelato(texto);
      if (problemas.includes('nota-ficcao-ausente')) relatos.semNota += 1;
      if (problemas.includes('informacao-clinica-sem-caixa-para-entender')) relatos.semCaixa += 1;
      if (/suic|autoles/i.test(texto)) relatos.suicidio += 1;
      if (problemas.length) relatos.detalhes.push([r.slug, r.publicado ? 'publicado' : 'agendado', problemas.join(', ')]);
    }
  }
  escreverRelatos(relatos, semBanco ? 'INVENTARIO.csv (sem texto)' : 'banco');

  console.log(JSON.stringify({ fonte: semBanco ? 'inventario' : 'banco', temas: resumoTemas, relatos: { total: relatos.total, semNota: relatos.semNota, semCaixa: relatos.semCaixa, suicidio: relatos.suicidio, semTexto: relatos.semTexto }, saidas: [SAIDA_TEMAS, SAIDA_RELATOS] }, null, 2));
}

main().catch((err) => {
  console.error('[levantamento] erro:', err.message);
  process.exitCode = 1;
});
