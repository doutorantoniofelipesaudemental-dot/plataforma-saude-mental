/**
 * Troca das 2 referências retratadas (aprovada pelo Dr. Antônio em 15/10/2026; relatorios/referencias-retratadas-proposta.md).
 *   Panagioti 2018 (JAMA IM, retratado em 2020)  -> Hodkinson 2022 (BMJ) ou Salyers 2017 (JGIM)
 *   Kamal 2016 (J Pain Symptom Manage, retratado) -> Parola 2017 (JBI) e Dijxhoorn 2021 (Palliat Med)
 * DRY-RUN POR PADRÃO. Com --aplicar: faz backup (Mongo + .mdx) e grava. Cada troca exige que o trecho antigo exista EXATAMENTE 1 vez.
 *   node --env-file=.env backend/scripts/corrigirRetratadas.js            dry-run
 *   node --env-file=.env backend/scripts/corrigirRetratadas.js --aplicar
 */
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
const DOI = (d) => `<a href="https://doi.org/${d}" target="_blank" rel="noopener">doi:${d}</a>`;

const REF = {
  hodkinson: `Hodkinson A, Zhou A, Johnson J, et al. Associations of physician burnout with career engagement and quality of patient care: systematic review and meta-analysis. <em>BMJ</em>. 2022;378:e070442. ${DOI('10.1136/bmj-2022-070442')}`,
  salyers: `Salyers MP, Bonfils KA, Luther L, et al. The relationship between professional burnout and quality and safety in healthcare: a meta-analysis. <em>J Gen Intern Med</em>. 2017;32(4):475-482. ${DOI('10.1007/s11606-016-3886-9')}`,
  parola: `Parola V, Coelho A, Cardoso D, Sandgren A, Apóstolo J. Prevalence of burnout in health professionals working in palliative care: a systematic review. <em>JBI Database System Rev Implement Rep</em>. 2017;15(7):1905-1933. ${DOI('10.11124/jbisrir-2016-003309')}`,
  dijxhoorn: `Dijxhoorn AQ, Brom L, van der Linden YM, et al. Prevalence of burnout in healthcare professionals providing palliative care and the effect of interventions to reduce symptoms: a systematic literature review. <em>Palliat Med</em>. 2021;35(1):6-26. ${DOI('10.1177/0269216320956825')}`,
};
const DOI_PANAGIOTI = '10.1001/jamainternmed.2018.3713';
const DOI_KAMAL = '10.1016/j.jpainsymman.2015.10.020';

// plano por texto: { doiAntigo -> chave da nova ref }, e trocas de frase (antiga -> nova, exatamente 1 ocorrência)
const SENT_MED = ['médicos com burnout têm cerca de duas vezes mais chance de se envolver em incidentes de segurança do paciente<sup>4</sup>', 'médicos com burnout têm chance cerca de duas vezes maior de se envolver em incidentes de segurança do paciente<sup>4</sup>'];
const PLANO_SITE = {
  'relato-cuidador-equipe-burnout': { refs: { [DOI_PANAGIOTI]: 'salyers' }, frases: [['O esgotamento da equipe se associa a mais incidentes de segurança do paciente.<sup>3</sup>', 'O esgotamento dos profissionais de saúde se associa a pior segurança do paciente.<sup>3</sup>']] },
  'relato-enfermeira-plantao-exaustao': { refs: { [DOI_PANAGIOTI]: 'salyers' }, frases: [['O esgotamento da equipe se associa a mais incidentes de segurança do paciente.<sup>2</sup>', 'O esgotamento dos profissionais de saúde se associa a pior segurança do paciente.<sup>2</sup>']] },
  'burnout-medicos-enfermeiros': { refs: { [DOI_PANAGIOTI]: 'hodkinson' }, frases: [SENT_MED] },
  'burnout-aps': { refs: { [DOI_PANAGIOTI]: 'hodkinson' }, frases: [SENT_MED] },
  'saude-mental-profissionais-saude-hospital': { refs: { [DOI_PANAGIOTI]: 'hodkinson' }, frases: [] },
  'paliativos-burnout-equipes': {
    refs: { [DOI_KAMAL]: 'parola', [DOI_PANAGIOTI]: 'hodkinson' },
    frases: [
      ['Um levantamento com profissionais de hospice e cuidados paliativos nos Estados Unidos encontrou taxa de burnout de cerca de 62%, maior entre os mais jovens, os que trabalhavam mais horas e em equipes pequenas.<sup>1</sup> Uma revisão sistemática com 59 estudos mostrou',
        'Uma revisão sistemática de 8 estudos, com 1.406 profissionais (médicos, enfermeiros e assistentes sociais) de serviços especializados de cuidados paliativos, encontrou prevalência de burnout de 17,3%.<sup>1</sup> Outra revisão sistemática, com 59 estudos, mostrou'],
      ['Entre médicos em geral, o burnout é frequente e está associado a mais erros, pior profissionalismo e menor satisfação dos pacientes.<sup>3</sup>',
        'Entre médicos em geral, o burnout está associado a mais incidentes de segurança do paciente, pior profissionalismo e menor satisfação dos pacientes.<sup>3</sup>'],
    ],
  },
  'paliativos-luto-do-profissional': {
    refs: { [DOI_KAMAL]: 'dijxhoorn' },
    frases: [['O acúmulo de perdas sem elaboração é um dos caminhos para o burnout em profissionais de cuidados paliativos.<sup>4</sup>',
      'Profissionais de cuidados paliativos convivem com perdas repetidas, e o burnout aparece nesse grupo, com prevalência que varia de 3% a 66% entre os estudos.<sup>4</sup>']],
  },
};
const PLANO_MDX = {
  'src/content/artigos/burnout-medicos-enfermeiros.mdx': PLANO_SITE['burnout-medicos-enfermeiros'],
  'src/content/artigos/burnout-aps.mdx': PLANO_SITE['burnout-aps'],
};

const conta = (t, s) => t.split(s).length - 1;
function aplicarPlano(texto, plano, rotulo, problemas) {
  let t = texto;
  for (const [doi, chave] of Object.entries(plano.refs)) {
    const re = new RegExp(`<li[^>]*>(?:(?!</li>)[\\s\\S])*?${doi.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:(?!</li>)[\\s\\S])*?</li>`);
    const m = t.match(re);
    if (!m) { problemas.push(`${rotulo}: referência ${doi} não encontrada`); continue; }
    const nLi = (t.match(new RegExp(re.source, 'g')) || []).length;
    if (nLi !== 1) problemas.push(`${rotulo}: ${doi} em ${nLi} itens de referência (esperado 1)`);
    t = t.replace(m[0], `<li>${REF[chave]}</li>`);
  }
  for (const [velho, novo] of plano.frases) {
    if (conta(t, velho) !== 1) { problemas.push(`${rotulo}: frase antiga ocorre ${conta(t, velho)}x (esperado 1): ${velho.slice(0, 60)}…`); continue; }
    t = t.replace(velho, novo);
  }
  return t;
}

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const problemas = [], mudancas = [];
  for (const [slug, plano] of Object.entries(PLANO_SITE)) {
    const d = await col.findOne({ slug });
    if (!d) { problemas.push(`${slug}: não existe no Mongo`); continue; }
    const novo = aplicarPlano(d.conteudo, plano, `site:${slug}`, problemas);
    const antes = estadoNarracao(d).estado, depois = estadoNarracao({ ...d, conteudo: novo }).estado;
    mudancas.push({ slug, d, novo, antes, depois });
  }
  const arquivos = [];
  for (const [rel, plano] of Object.entries(PLANO_MDX)) {
    const arq = path.join(APP, rel);
    const t = fs.readFileSync(arq, 'utf8');
    arquivos.push({ arq, rel, t, novo: aplicarPlano(t, plano, `next:${rel}`, problemas) });
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · textos do site: ${mudancas.length} · .mdx do Next: ${arquivos.length}`);
  for (const m of mudancas) console.log(`  site:${m.slug}: narração ${m.antes} → ${m.depois}`);
  problemas.forEach((p) => console.log('  PROBLEMA', p));
  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const dir = path.join(RAIZ, 'backups', `referencias-retratadas-${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}-${p2(dl.getHours())}${p2(dl.getMinutes())}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(mudancas.map((m) => m.d)));
    for (const a of arquivos) fs.copyFileSync(a.arq, path.join(dir, path.basename(a.arq)));
    const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8'));
    if (lido.length !== mudancas.length) throw new Error('backup não confere');
    for (const m of mudancas) await col.updateOne({ _id: m.d._id }, { $set: { conteudo: m.novo, ...(m.d.publicado ? { atualizadoEm: new Date() } : {}) } });
    for (const a of arquivos) fs.writeFileSync(a.arq, a.novo, 'utf8');
    console.log(`GRAVADO. Backup em ${path.relative(RAIZ, dir)} (${lido.length} documentos + ${arquivos.length} .mdx).`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
