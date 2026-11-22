/**
 * Valida TODOS os lotes de reescrita (backend/data/reescritas/<lote>/) antes do merge:
 * converte cada HTML para MDX e compila. Não acessa o banco e não grava nada.
 * Uso: node backend/tools/validar-lotes-reescrita.js   (saída 1 se algum item falhar)
 * Usado pelo portão (npm run portao) para pegar HTML/MDX quebrado antes do merge.
 */
const path = require('path');
const { validarMdxDosLotes } = require('../lib/reescritas');

const RAIZ = path.join(__dirname, '..', '..');

validarMdxDosLotes(RAIZ)
  .then(({ total, falhas }) => {
    console.log(`Lotes de reescrita: ${total} item(ns) verificado(s), ${falhas.length} falha(s) de HTML/MDX.`);
    for (const f of falhas) console.log(`  ✗ ${f.lote}/${f.slug}: ${f.erro}`);
    process.exit(falhas.length ? 1 : 0);
  })
  .catch((e) => {
    console.error('Erro ao validar lotes:', e.message);
    process.exit(1);
  });
