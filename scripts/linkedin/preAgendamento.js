/**
 * Pré-agendamento do LinkedIn (perfil pessoal, agendador NATIVO do LinkedIn): confere cada post da fila ANTES de agendar.
 * Regra (CLAUDE.md, 17/10/2026): só vai para o agendador o post que passar na auditoria + tripla checagem; reprovado NÃO é agendado e vai para
 * relatorios/linkedin/reprovados/<id>.md com o motivo.
 *   node --env-file=.env scripts/linkedin/preAgendamento.js           confere e grava relatorios/linkedin/agendamento-lote.json e .md (lotes de 5)
 * Conferências por post: checarPost (tamanho, assinatura curta de 3 linhas, crédito do Portal, CVV/SAMU, aviso de IA e de protocolos locais, acentos,
 * "psiquiatra" ligado ao autor, #psiquiatria, promessa, links só do domínio oficial, ética CFM) + o texto do site citado estará no ar na data do post
 * + texto dentro do limite de 3.000 caracteres do LinkedIn + (carrossel) PDF existente.
 * Carrosséis (PDF) e posts já agendados no LinkedIn ficam de fora do lote automático: carrossel só entra depois de o Dr. Antônio confirmar que o agendador aceita PDF.
 */
require('../carregarEnv').carregarEnv(); // .env carregado aqui, sem --env-file na linha de comando
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarPost } = require('../../backend/lib/linkedinChecagem');

const RAIZ = path.resolve(__dirname, '../..');
const REL = path.join(RAIZ, 'relatorios', 'linkedin');
const bahia = (d) => new Date(new Date(d).getTime() - 3 * 3600e3);
const dia = (d) => bahia(d).toISOString().slice(0, 10);
const br = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const itens = await db.collection('linkedin_fila').find({ status: { $in: ['aprovado-checagem', 'manual'] } }).sort({ slot: 1 }).toArray();
  const aprovados = [], reprovados = [], carrosseis = [];
  const vistos = new Set();
  fs.mkdirSync(path.join(REL, 'reprovados'), { recursive: true });
  for (const it of itens) {
    const motivos = checarPost({ ...it, tipo: it.tipo === 'carrossel' ? 'carrossel' : 'texto' }).map((f) => `checagem: ${f}`);
    if ((it.texto || '').length > 3000) motivos.push(`texto com ${(it.texto || '').length} caracteres (limite do LinkedIn: 3.000)`);
    if (vistos.has(it.texto)) motivos.push('texto repetido na fila'); vistos.add(it.texto);
    const slug = it.slug || (String(it.url || '').match(/\/artigo\/([^/?#]+)/) || [])[1];
    if (slug) {
      const a = await db.collection('artigos').findOne({ slug }, { projection: { publicado: 1, publicadoEm: 1, agendamento: 1 } });
      const quando = a && (a.publicado === true ? a.publicadoEm : a.agendamento && a.agendamento.agendado ? a.agendamento.slot : null);
      if (!a) motivos.push(`texto do site "${slug}" não existe`);
      else if (!quando) motivos.push(`texto do site "${slug}" não está publicado nem agendado: o link não estará no ar`);
      else if (new Date(quando) > new Date(it.slot)) motivos.push(`texto do site "${slug}" só sai em ${br(dia(quando))}, depois do post (${br(dia(it.slot))}): o link daria página inexistente`);
    }
    if (it.tipo === 'carrossel') { const pdf = it.pdf ? path.join(RAIZ, it.pdf) : ''; if (!pdf || !fs.existsSync(pdf)) motivos.push('PDF do carrossel não encontrado'); }
    if (motivos.length) {
      reprovados.push({ id: it.id, slot: it.slot, motivos });
      fs.writeFileSync(path.join(REL, 'reprovados', `${it.id}.md`), `# ${it.id} — REPROVADO para agendamento (${new Date().toISOString().slice(0, 10)})\n\nPost de ${br(dia(it.slot))} às 19:30 (Bahia): ${it.titulo}\n\n${motivos.map((m) => `- ${m}`).join('\n')}\n`, 'utf8');
      continue;
    }
    const base = { id: it.id, data: dia(it.slot), hora: '19:30', titulo: it.titulo, tipo: it.tipo, slug, caracteres: it.texto.length };
    (it.tipo === 'carrossel' ? carrosseis : aprovados).push({ ...base, pdf: it.pdf || null });
  }
  const lotes = []; for (let i = 0; i < aprovados.length; i += 5) lotes.push(aprovados.slice(i, i + 5).map((x) => x.id));
  const saida = { geradoEm: new Date().toISOString(), regra: 'só entra no agendador o que passou na auditoria + tripla checagem; lotes de 5', aprovados, carrosseis_manuais: carrosseis, reprovados, lotes };
  const nomes = require('./nomesLote').nomesLote({ simulacao: process.env.LOTE_SIMULACAO === '1' });
  fs.writeFileSync(path.join(REL, nomes.json), JSON.stringify(saida, null, 1), 'utf8');
  const md = `# Lote para o agendador nativo do LinkedIn (conferido em ${new Date().toISOString().slice(0, 10)})\n\n- Posts de texto aprovados para agendar: **${aprovados.length}** (de ${aprovados[0] ? br(aprovados[0].data) : '—'} a ${aprovados.length ? br(aprovados[aprovados.length - 1].data) : '—'}), em ${lotes.length} lote(s) de até 5.\n- Carrosséis (PDF), deixados na fila manual com o lembrete das 19:25 até confirmar que o agendador aceita PDF: **${carrosseis.length}**.\n- Reprovados (não agendados): **${reprovados.length}** (ver \`relatorios/linkedin/reprovados/\`).\n\n| Data | Hora | Tipo | Título |\n|---|---|---|---|\n${aprovados.map((x) => `| ${br(x.data)} | 19:30 | texto | ${x.titulo} |`).join('\n')}\n${reprovados.length ? `\n## Reprovados\n${reprovados.map((r) => `- ${r.id}: ${r.motivos.join('; ')}`).join('\n')}\n` : ''}`;
  fs.writeFileSync(path.join(REL, nomes.md), md, 'utf8');
  console.log(`aprovados ${aprovados.length} · carrosséis (manual) ${carrosseis.length} · reprovados ${reprovados.length} · lotes ${lotes.length}`);
  reprovados.forEach((r) => console.log(`  REPROVADO ${r.id}: ${r.motivos.join(' | ').slice(0, 200)}`));
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
