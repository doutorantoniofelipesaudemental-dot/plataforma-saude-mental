#!/usr/bin/env node
/*
 * Exportação SÓ DE LEITURA para a revisão de 10/11/2026 (ordem de 09/11, 23:15). Não grava no banco.
 *   node --env-file-if-exists=.env backend/scripts/portal/exportarRevisao20261110.js [--saida <arquivo.json>]
 * Padrão de saída: .tmp/revisao-20261110/dados.json (ignorado pelo Git).
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const valor = (n) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const SAIDA = valor('--saida') || path.join(RAIZ, '.tmp', 'revisao-20261110', 'dados.json');

(async () => {
  const db = require('../../lib/db');
  const Artigo = require('../../models/Artigo');
  if (!db.isConfigured()) throw new Error('Banco não configurado (MONGODB_URI).');
  await db.connect();
  try {
    const docs = await Artigo.find({ $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
      .select('slug titulo resumo categoria tema conteudo publicado agendamento revisao atualizadoEm publicadoEm visualizacoes')
      .lean();
    const itens = docs.map((a) => ({
      _id: String(a._id),
      slug: a.slug,
      titulo: a.titulo,
      resumo: a.resumo || '',
      categoria: a.categoria,
      tema: a.tema || '',
      conteudo: a.conteudo || '',
      publicado: !!a.publicado,
      agendado: !!(a.agendamento && a.agendamento.agendado),
      revisado: !!(a.revisao && a.revisao.status === 'aprovada'),
      revisaoStatus: (a.revisao && a.revisao.status) || '',
      visualizacoes: a.visualizacoes || 0,
    }));
    fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
    fs.writeFileSync(SAIDA, JSON.stringify(itens, null, 2), 'utf8');
    console.log(JSON.stringify({ total: itens.length, relatos: itens.filter((i) => i.categoria === 'Relatos da Prática').length, saida: SAIDA }, null, 2));
  } finally {
    await db.mongoose.disconnect();
  }
})().catch((err) => {
  console.error('[exportar-revisao] erro:', err.message);
  process.exitCode = 1;
});
