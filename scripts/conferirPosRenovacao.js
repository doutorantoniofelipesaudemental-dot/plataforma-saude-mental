/**
 * Conferência de 19/10/2026 (rodar depois das 12:00 UTC): o cron semanal ig_refresh_token renovou o token do Instagram?
 *   node --env-file=.env scripts/conferirPosRenovacao.js
 * SOMENTE LEITURA. Não imprime o token. Grava relatorios/conferencia-renovacao-AAAAMMDD.md.
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

  const hoje = new Date().toISOString().slice(0, 10);
  const md = `# Conferência pós-renovação do token — ${hoje}\n\n**Resultado: ${falhas.length ? 'ATENÇÃO' : 'OK, renovação funcionou'}**\n\n${linhas.join('\n')}\n\n${falhas.length ? '## Problemas\n' + falhas.map((x) => `- ${x}`).join('\n') + '\n' : ''}`;
  const arq = path.join(__dirname, '..', 'relatorios', `conferencia-renovacao-${hoje.replace(/-/g, '')}.md`);
  fs.writeFileSync(arq, md);
  console.log(md, '\nRelatório:', arq);
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
