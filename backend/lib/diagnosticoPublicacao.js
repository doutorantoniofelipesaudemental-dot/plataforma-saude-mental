/**
 * Diagnóstico diário da publicação (ordem 20/10/2026): valida o PRÓXIMO post da fila pela Graph API com as variáveis de PRODUÇÃO
 * da Vercel, sem publicar. Guarda só o resultado (ok ou falhas sem segredo) em `diagnosticos_publicacao`, para a conferência local ler.
 * Nunca publica: usa validarPostNoInstagram (que só cria containers até FINISHED).
 */
const { validarPostNoInstagram, proximoPostParaDiagnostico } = require('./redesV2/validacaoCarrossel');
const db = require('./db');

const DOC_ID = 'instagram';

// Remove o que não pode sair: tokens (IGAA/EAA) e números longos (IDs de conta, containers).
function sanear(texto) {
  return String(texto).replace(/\b(IGAA|EAA)[A-Za-z0-9_-]*/g, '[REDIGIDO]').replace(/\b\d{12,}\b/g, '[ID]').slice(0, 200);
}

async function executarDiagnostico({ agora = new Date(), proximo = proximoPostParaDiagnostico, validar = validarPostNoInstagram, salvar } = {}) {
  let resultado;
  try {
    const post = await proximo(agora);
    if (!post) {
      resultado = { ok: false, postId: null, falhas: ['nenhum post futuro na fila para validar'] };
    } else {
      const r = await validar(post);
      resultado = { ok: r.ok, postId: post._id, falhas: r.falhas.map(sanear) };
    }
  } catch (e) {
    resultado = { ok: false, postId: null, falhas: [sanear(e.message)] };
  }
  resultado.executadoEm = agora;
  resultado.publicou = false; // invariante: este diagnóstico nunca publica
  if (salvar) await salvar(resultado);
  return resultado;
}

async function salvarNoBanco(resultado) {
  await db.connect();
  const col = require('mongoose').connection.db.collection('diagnosticos_publicacao');
  await col.updateOne({ _id: DOC_ID }, { $set: resultado }, { upsert: true });
}

module.exports = { executarDiagnostico, salvarNoBanco, sanear, DOC_ID };
