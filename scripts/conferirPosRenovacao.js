/**
 * Conferência de 19/10/2026 (rodar depois das 12:00 UTC): o cron semanal ig_refresh_token renovou o token do Instagram?
 *   node --env-file=.env scripts/conferirPosRenovacao.js
 * Com --simular: ensaio da trava B antes do dia (finge a publicação). SOMENTE LEITURA. Não imprime o token. Grava relatorios/conferencia-renovacao-AAAAMMDD.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const Credencial = require('../backend/models/Credencial');
const db = require('../backend/lib/db');

const DIA = 86400e3;
const BASE = process.env.NARRACAO_API_BASE || 'https://drsaudemental.vercel.app';
const fmt = (d) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');
const admin = { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } };

(async () => {
  await db.connect();
  const doc = await Credencial.findOne({ chave: 'instagram_access_token' }).lean();
  const linhas = [], falhas = [];
  const renovadoHa = doc?.renovadoEm ? (Date.now() - new Date(doc.renovadoEm)) / DIA : null;
  const dias = doc?.expiraEm ? Math.floor((new Date(doc.expiraEm) - Date.now()) / DIA) : null;
  if (!doc?.renovadoEm) falhas.push('nenhuma renovação registrada (renovadoEm vazio): o cron não rodou ou falhou');
  else if (renovadoHa > 2) falhas.push(`última renovação há ${renovadoHa.toFixed(1)} dias (esperado: hoje, segunda-feira 12:00 UTC)`);
  if (dias === null || dias < 55) falhas.push(`validade restante ${dias === null ? 'desconhecida' : dias + ' dias'} (esperado ~60)`);
  if (doc?.ultimoErro) falhas.push(`ultimoErro no banco: ${String(doc.ultimoErro).slice(0, 160)}`);
  if (doc?.pausadoEm) falhas.push(`fila pausada desde ${fmt(doc.pausadoEm)}: ${String(doc.motivoPausa).slice(0, 120)}`);
  linhas.push(`- Última renovação: ${fmt(doc?.renovadoEm)}`, `- Nova validade (expiraEm): ${fmt(doc?.expiraEm)} (${dias ?? '?'} dias)`, `- Impressão digital do token renovado: ${doc?.impressaoDigital || '—'}`);

  try {
    const j = await fetch(`${BASE}/api/admin/fila-redes`, admin).then((r) => r.json());
    linhas.push(`- Produção (/api/admin/fila-redes): origem do token "${j.tokenInstagram?.origem}", pausa ${j.tokenInstagram?.pausa ? 'SIM' : 'não'}, podePublicarAgora ${j.podePublicarAgora}`);
    if (j.tokenInstagram?.origem !== 'renovado') falhas.push(`origem do token em produção é "${j.tokenInstagram?.origem}" (esperado "renovado")`);
    if (j.tokenInstagram?.pausa) falhas.push('fila pausada em produção');
  } catch (e) { falhas.push(`não consegui consultar a produção: ${e.message}`); }

  const f = await fetch(`${BASE}/api/admin/freio-redes`, admin).then((r) => r.json()).catch(() => ({}));
  linhas.push(`- Freio das redes (REDES_PUBLICACAO_ATIVA): ${f.publicacaoAtiva === true ? 'ativo (true)' : 'NÃO ATIVO'}`);
  if (f.publicacaoAtiva !== true) falhas.push('freio das redes não está ativo (true)');

  // TRAVA B (teste real): o 1º texto agendado de 19/10 08:00 (Bahia = 11:00 UTC) deve estar publicado, tocar o áudio COM vinheta e o MP3 deve responder 200.
  try {
    const { urlNarracaoTocavel } = require('../backend/lib/narracao');
    const { VINHETA_VERSAO } = require('../backend/lib/vinheta');
    const col = require('mongoose').connection.db.collection('artigos');
    const a = await col.find({ 'agendamento.slot': { $gte: new Date('2026-10-19T10:00:00Z'), $lte: new Date('2026-10-19T12:00:00Z') } }).sort({ 'agendamento.slot': 1 }).limit(1).next();
    if (!a) { falhas.push('trava B: nenhum texto agendado para 19/10 às 08:00 (Bahia) encontrado'); linhas.push('- Trava B: sem texto agendado para 19/10 08:00'); }
    else {
      const SIM = process.argv.includes('--simular'); // simulação: finge que o texto já publicou (não toca a produção); a API/página só são conferidas no dia real
      const url = urlNarracaoTocavel(SIM ? { ...a, publicado: true } : a);
      const api = await fetch(`${BASE}/api/artigos/${a.slug}`).then(async (r) => ({ s: r.status, j: await r.json().catch(() => ({})) })).catch(() => ({ s: 0, j: {} }));
      const mp3 = url ? await fetch(url, { method: 'HEAD' }).then((r) => r.status).catch(() => 0) : 0;
      const vin = a.narracao?.vinhetaVersao === VINHETA_VERSAO;
      linhas.push(`- Trava B (${a.slug}): publicado ${a.publicado === true ? 'sim' : 'NÃO'} · página/API ${api.s} · player toca ${api.j?.artigo?.audioNarracaoUrl ? 'sim' : 'NÃO'} · MP3 HTTP ${mp3} · vinheta v${a.narracao?.vinhetaVersao ?? '—'} ${vin ? '(ok)' : '(FALTA)'}`);
      if (SIM) {
        linhas.push('- (SIMULAÇÃO: publicação, página/API e player só são conferidos no dia real; aqui: URL tocável pós-publicação, MP3 200 e vinheta)');
        if (!url) falhas.push(`trava B (simulação): após publicar, o player de ${a.slug} NÃO teria áudio (estado/hash)`);
      } else {
        if (a.publicado !== true) falhas.push(`trava B: ${a.slug} não foi publicado às 08:00`);
        if (api.s !== 200) falhas.push(`trava B: página/API de ${a.slug} respondeu ${api.s} (esperado 200)`);
        if (!api.j?.artigo?.audioNarracaoUrl) falhas.push(`trava B: o player de ${a.slug} não tem áudio para tocar após publicar`);
      }
      if (mp3 !== 200) falhas.push(`trava B: URL do MP3 de ${a.slug} respondeu ${mp3} (esperado 200)`);
      if (!vin) falhas.push(`trava B: o áudio de ${a.slug} não tem a vinheta (versão ${VINHETA_VERSAO})`);
    }
  } catch (e) { falhas.push(`trava B: não consegui conferir (${e.message})`); }

  // Autorização do YouTube: o app do Google em modo "Testando" vence 7 dias depois de autorizar (autorizada em 16/10/2026 → vence em 23/10/2026)
  try {
    const au = await require('./youtube/avisoAutorizacao').conferir();
    linhas.push(`- Autorização do YouTube: autorizada em ${au.autorizadoEm || '—'} (app: ${au.modo || '—'}) · ${au.venceEm ? `vence em ${au.venceEm} (${au.dias} dia(s))` : 'app publicado: não vence em 7 dias'}`);
    if (au.problema) falhas.push(`YouTube: ${au.problema} (passo a passo em relatorios/youtube/AVISO-REAUTORIZAR.md)`);
  } catch (e) { linhas.push(`- Autorização do YouTube: não consegui conferir (${e.message.slice(0, 60)})`); }

  const hoje = new Date().toISOString().slice(0, 10);
  const md = `# Conferência pós-renovação do token — ${hoje}\n\n**Resultado: ${falhas.length ? 'ATENÇÃO' : 'OK, renovação funcionou'}**\n\n${linhas.join('\n')}\n\n${falhas.length ? '## Problemas\n' + falhas.map((x) => `- ${x}`).join('\n') + '\n' : ''}`;
  const arq = path.join(__dirname, '..', 'relatorios', `conferencia-renovacao-${hoje.replace(/-/g, '')}.md`);
  fs.writeFileSync(arq, md);
  console.log(md, '\nRelatório:', arq);
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
