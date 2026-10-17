/**
 * Agenda os textos "sem data" que passaram na auditoria + tripla checagem (decisão do Dr. Antônio, 17/10/2026):
 * a partir do primeiro dia útil depois do fim do calendário atual, até 11 por dia útil (08:00–18:00 Bahia), sem fins de semana nem feriados,
 * sem colidir com datas ocupadas e sem o mesmo tema em horários seguidos.
 *   node --env-file=.env backend/scripts/agendarSemData.js                dry-run (mostra correções de forma, ordem e datas)
 *   node --env-file=.env backend/scripts/agendarSemData.js --aplicar      grava (backup antes em backups/sem-agenda-AAAAMMDD-HHMM/)
 * Correções de FORMA permitidas (sem mudar o sentido): erros de digitação listados em CORRECOES e o aviso padrão de orientação geral/protocolos locais
 * nos textos com condutas e doses que não o traziam (regra permanente do CLAUDE.md). O resto do texto não é tocado.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarTexto } = require('../lib/auditoriaTexto');
const { HORARIOS, FERIADOS, temaDe } = require('../lib/calendarioSite');

const RAIZ = path.resolve(__dirname, '../..');
const aplicar = process.argv.includes('--aplicar');

// Aprovados na tripla checagem (22). Ficam de fora, para decisão do autor: abandono-de-tratamento..., catatonia..., delirium..., insatisfacao-corporal-brasil-numeros,
// relato-namorado-controlava-celular, transtorno-bipolar-na-aps... e uso-problematico-de-telas... (motivos em relatorios/textos-sem-agenda.md).
const APROVADOS = [
  'a-carta-que-nunca-foi-enviada-ao-psiquiatra', 'a-planta-que-sobreviveu-na-janela-do-posto', 'a-receita-dobrada-no-bolso-do-casaco', 'a-sala-de-espera-que-respirava-em-silencio',
  'conviver-com-a-oscilacao-de-humor-limites-e-apoio-familiar', 'esquecimento-comum-ou-sinal-de-alerta-conversando-sobre-memo', 'higiene-autocuidado-saude-mental',
  'insonia-refrataria-na-atencao-primaria-investigacao-e-condut', 'manejo-de-sintomas-dissociativos-associados-ao-trauma-e-estr', 'o-balcao-da-farmacia-e-as-perguntas-nao-feitas',
  'o-cafe-frio-que-esperou-a-consulta-acabar', 'o-corredor-que-parecia-nao-ter-fim', 'o-domingo-a-tarde-em-que-o-telefone-nao-chamou', 'o-idioma-do-afeto-acolhendo-quem-chegou-de-longe-na-ubs',
  'o-lenco-esquecido-na-cadeira-do-consultorio', 'o-relogio-na-parede-do-pronto-atendimento', 'primeiro-atendimento-em-psiquiatria-na-ubs-guia-pratico-para',
  'primeiro-episodio-psicotico-orientacoes-essenciais-para-a-fa', 'relato-baiano-que-trabalhava-dobrado', 'relato-calor-aos-quarenta-e-oito',
  'transtorno-obsessivo-compulsivo-na-aps-reconhecimento-e-mane', 'transtornos-somatoformes-na-ubs-investigacao-e-manejo-clinic',
];
const CORRECOES = {
  'conviver-com-a-oscilacao-de-humor-limites-e-apoio-familiar': [['não posso conversar gritos', 'não posso conversar aos gritos']],
  'manejo-de-sintomas-dissociativos-associados-ao-trauma-e-estr': [['retraumantização', 'retraumatização'], ['psychoeducação', 'psicoeducação']],
  'o-corredor-que-parecia-nao-ter-fim': [['nocturno', 'noturno'], ['esgotarse', 'esgotar-se']],
  'transtornos-somatoformes-na-ubs-investigacao-e-manejo-clinic': [['corporales', 'corporais']],
};
const COM_AVISO = ['insonia-refrataria-na-atencao-primaria-investigacao-e-condut', 'manejo-de-sintomas-dissociativos-associados-ao-trauma-e-estr'];
const AVISO = '<p><em>Conteúdo educativo, de caráter geral. Condutas, doses e fluxos descritos são orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.</em></p>\n';

const fmtDia = (d) => d.toISOString().slice(0, 10);
const bahia = (d) => new Date(d.getTime() - 3 * 3600e3);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const todos = await col.find({}).toArray();
  const docs = APROVADOS.map((s) => todos.find((d) => d.slug === s)).filter(Boolean);
  if (docs.length !== APROVADOS.length) throw new Error(`faltam textos: ${APROVADOS.filter((s) => !docs.find((d) => d.slug === s)).join(', ')}`);
  for (const d of docs) if (d.publicado === true || (d.agendamento && d.agendamento.agendado)) throw new Error(`já publicado/agendado: ${d.slug}`);

  // 1) correções de forma (em memória primeiro)
  const novos = new Map(); const relatorio = [];
  for (const d of docs) {
    let conteudo = d.conteudo, titulo = d.titulo, resumo = d.resumo; const feitas = [];
    for (const [de, para] of CORRECOES[d.slug] || []) {
      let achou = false;
      for (const k of ['conteudo', 'titulo', 'resumo']) { const v = k === 'conteudo' ? conteudo : k === 'titulo' ? titulo : resumo; if (v.includes(de)) { achou = true; const nv = v.split(de).join(para); if (k === 'conteudo') conteudo = nv; else if (k === 'titulo') titulo = nv; else resumo = nv; } }
      if (!achou) throw new Error(`correção não encontrada em ${d.slug}: "${de}"`);
      feitas.push(`"${de}" → "${para}"`);
    }
    if (COM_AVISO.includes(d.slug) && !/protocolos hospitalares, do Pronto Atendimento/.test(conteudo)) {
      const i = conteudo.search(/<h[2-4][^>]*>\s*(?:Refer[êe]ncias|Fontes)/i);
      if (i < 0) throw new Error(`sem seção de referências em ${d.slug}`);
      conteudo = conteudo.slice(0, i) + AVISO + conteudo.slice(i); feitas.push('aviso padrão de orientação geral e protocolos locais antes das referências');
    }
    const f = checarTexto({ origem: 'mongo', slug: d.slug, titulo, resumo, tempoLeitura: d.tempoLeitura, corpo: conteudo });
    if (f.length) throw new Error(`reprovado na auditoria após as correções: ${d.slug}: ${f.map((x) => x.msg).join(' | ')}`);
    novos.set(d.slug, { conteudo, titulo, resumo, feitas });
    if (feitas.length) relatorio.push(`${d.slug}: ${feitas.join('; ')}`);
  }

  // 2) datas: 1º dia útil depois do fim do calendário atual, 11 por dia útil, sem fins de semana/feriados/colisões
  const ocupados = new Set(); let ultimo = new Date(0);
  for (const d of todos) if (d.agendamento && d.agendamento.agendado && d.publicado !== true) { const s = new Date(d.agendamento.slot); ocupados.add(s.toISOString()); if (s > ultimo) ultimo = s; }
  let dia = new Date(`${fmtDia(bahia(ultimo))}T12:00:00Z`);
  const util = (dt) => dt.getUTCDay() !== 0 && dt.getUTCDay() !== 6 && !FERIADOS.has(fmtDia(dt));
  do { dia = new Date(dia.getTime() + 864e5); } while (!util(dia));
  // ordem: nunca o mesmo tema ou o mesmo tipo (relato/artigo) em horários seguidos
  const info = (d) => ({ d, tema: temaDe({ slug: d.slug, titulo: d.titulo }), tipo: d.categoria === 'Relatos da Prática' ? 'relato' : 'artigo', cat: d.categoria });
  let fila = docs.map(info); const ordem = []; let ant = null;
  while (fila.length) {
    const i = fila.findIndex((x) => !ant || (x.tema !== ant.tema && x.cat !== ant.cat)) ; const j = i >= 0 ? i : 0;
    const alt = fila.findIndex((x) => ant && x.tipo !== ant.tipo && x.tema !== ant.tema && x.cat !== ant.cat);
    const k = alt >= 0 ? alt : j; ant = fila[k]; ordem.push(ant); fila.splice(k, 1);
  }
  const plano = [];
  let n = 0;
  while (n < ordem.length) {
    for (const h of HORARIOS) {
      if (n >= ordem.length) break;
      const [hh, mm] = h.split(':').map(Number);
      const slot = new Date(`${fmtDia(dia)}T${String(hh + 3).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00.000Z`); // Bahia = UTC-3
      if (ocupados.has(slot.toISOString())) throw new Error(`colisão em ${slot.toISOString()}`);
      plano.push({ slug: ordem[n].d.slug, titulo: novos.get(ordem[n].d.slug).titulo, slot }); n++;
    }
    do { dia = new Date(dia.getTime() + 864e5); } while (!util(dia));
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · ${plano.length} textos · fim do calendário atual: ${fmtDia(bahia(ultimo))} · novos slots: ${plano[0].slot.toISOString()} → ${plano[plano.length - 1].slot.toISOString()}`);
  console.log('correções de forma:\n  ' + (relatorio.join('\n  ') || '(nenhuma)'));
  plano.forEach((p) => console.log(`  ${p.slot.toISOString().slice(0, 16)}Z (${bahia(p.slot).toISOString().slice(0, 16).replace('T', ' ')} Bahia)  ${p.slug}`));
  fs.writeFileSync(path.join(RAIZ, 'relatorios', 'sem-agenda-plano.json'), JSON.stringify({ geradoEm: new Date().toISOString(), correcoes: relatorio, plano: plano.map((p) => ({ slug: p.slug, titulo: p.titulo, slot: p.slot.toISOString() })) }, null, 1));
  if (!aplicar) return mongoose.disconnect();

  // 3) backup (documento inteiro) e gravação
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/^(\d{8})(\d{4})$/, '$1-$2');
  const dir = path.join(RAIZ, 'backups', `sem-agenda-${ts}`); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(docs));
  if (JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8')).length !== docs.length) throw new Error('backup não confere');
  console.log(`backup ok: ${dir} (${docs.length} documentos)`);
  for (const p of plano) {
    const nv = novos.get(p.slug);
    await col.updateOne({ slug: p.slug }, { $set: { conteudo: nv.conteudo, titulo: nv.titulo, resumo: nv.resumo, publicadoEm: p.slot, agendamento: { agendado: true, slot: p.slot, falha: '' }, atualizadoEm: new Date() } });
  }
  console.log(`gravado: ${plano.length} textos agendados.`);
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
