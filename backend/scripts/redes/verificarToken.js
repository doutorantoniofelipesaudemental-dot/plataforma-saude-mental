/**
 * Verifica o token do Instagram (Instagram Login). SOMENTE LEITURA: não renova, não grava, NÃO imprime o token.
 *   node --env-file=.env backend/scripts/redes/verificarToken.js
 * Mostra: se o token existe e de que tipo é; se a Meta o aceita; a conta ligada (e se bate com INSTAGRAM_ACCOUNT_ID);
 * a data de validade (quando já foi renovado pelo cron, vem do banco; senão informa que é desconhecida) e se a fila está pausada.
 * Saída com código 1 se o token for inválido. Para conferir o token que está na Vercel, a variável precisa estar no
 * seu .env local (segredos da Vercel não podem ser baixados pelo `vercel env pull`).
 */
const mongoose = require('mongoose');
const db = require('../../lib/db');
const Credencial = require('../../models/Credencial');

const DIA = 86400e3;
const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

async function consultar(token, caminho) {
  const host = require('../../lib/instagramHost').hostDoToken(token);
  try {
    const r = await fetch(`https://${host}/v21.0/${caminho}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    if (!r.ok || j.error) return { ok: false, erro: `código ${j.error?.code ?? r.status}${j.error?.error_subcode ? `/${j.error.error_subcode}` : ''}: ${String(j.error?.message || 'sem detalhe').slice(0, 120)}` };
    return { ok: true, dados: j };
  } catch (e) { return { ok: false, erro: e.message }; }
}

(async () => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  const contaEsperada = process.env.INSTAGRAM_ACCOUNT_ID || '';
  const saida = { tokenPresente: Boolean(token), tipo: require('../../lib/instagramConta').tipoDoToken(token), formatoPlausivel: /^[A-Za-z0-9_-]{60,}$/.test(token) };
  let valido = false;

  if (token) {
    const eu = await consultar(token, `me?fields=${token.startsWith('IGAA') ? 'user_id,username,account_type' : 'id,name'}`);
    saida.aceitoPelaMeta = eu.ok;
    if (eu.ok) {
      valido = true;
      const id = require('../../lib/instagramConta').idDaConta(eu.dados, token);
      saida.conta = { usuario: eu.dados.username || eu.dados.name || null, tipo: eu.dados.account_type || null, id };
      saida.contaBateComINSTAGRAM_ACCOUNT_ID = contaEsperada ? String(id) === String(contaEsperada) : 'INSTAGRAM_ACCOUNT_ID ausente';
    } else saida.erroDaMeta = eu.erro;
  }

  try {
    await db.connect();
    const doc = await Credencial.findOne({ chave: 'instagram_access_token' }).lean();
    saida.renovacaoAutomatica = {
      cronSemanal: 'segunda-feira 12:00 UTC (/api/cron/renovar-token-instagram, vercel.json)',
      ultimaRenovacao: fmt(doc?.renovadoEm),
      venceEm: fmt(doc?.expiraEm),
      diasRestantes: doc?.expiraEm ? Math.floor((new Date(doc.expiraEm) - Date.now()) / DIA) : null,
      observacao: doc?.expiraEm ? undefined : 'Ainda sem renovação registrada: a validade real só é conhecida depois da 1ª renovação (token novo vale 60 dias a partir da geração).',
    };
    saida.filaPausada = doc?.pausadoEm ? { desde: fmt(doc.pausadoEm), motivo: String(doc.motivoPausa || '').slice(0, 140) } : false;
    saida.ultimoErro = doc?.ultimoErro ? String(doc.ultimoErro).slice(0, 140) : null;
    await mongoose.disconnect();
  } catch (e) { saida.banco = `não consultado (${e.message.slice(0, 60)})`; }

  saida.veredito = valido ? 'TOKEN VÁLIDO' : 'TOKEN INVÁLIDO OU AUSENTE';
  console.log(JSON.stringify(saida, null, 2));
  process.exit(valido ? 0 : 1);
})();
