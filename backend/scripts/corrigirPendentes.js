/**
 * Correções aprovadas pelo Dr. Antônio (17/10/2026) nos textos pendentes: catatonia, telas, abandono e as 2 páginas de cirurgia estética.
 *   node --env-file=.env backend/scripts/corrigirPendentes.js             dry-run: mostra antes/depois e a auditoria do texto novo
 *   node --env-file=.env backend/scripts/corrigirPendentes.js --aplicar   grava (backup da coleção "artigos" antes, em backups/importacao-completa-AAAAMMDD-HHMM/)
 * Fontes conferidas: BAP (Rogers et al., J Psychopharmacol 2023, PMID 37039129, texto integral PMC10101189); Academia Indiana de Pediatria (PMID 34969943);
 * Loots et al., Int J Environ Res Public Health 2021 (PMID 34639510); ISAPS Global Survey 2025 (isaps.org, 29/09/2026).
 * A narração NÃO é apagada: o hash muda e o player antigo deixa de tocar (estadoNarracao) até a nova ser gerada.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarTexto } = require('../lib/auditoriaTexto');

const aplicar = process.argv.includes('--aplicar');
const RAIZ = path.resolve(__dirname, '../..');

const ISAPS_REF_ANTIGA = 'ISAPS International Survey on Aesthetic/Cosmetic Procedures performed in 2024. <a href="https://www.isaps.org/media/3uhnjvup/2024-global-survey-portuguese-brazilian.pdf" target="_blank" rel="noopener">isaps.org</a>';
const ISAPS_REF_NOVA = 'ISAPS Global Survey 2025: procedimentos estéticos/cosméticos realizados em 2025 (divulgada em 29/09/2026). <a href="https://www.isaps.org/discover/about-isaps/global-statistics/global-survey-2025-full-report-and-press-releases/" target="_blank" rel="noopener">isaps.org</a>';
const TITULO_NOVO = 'Brasil entre os países que mais fazem cirurgias plásticas: o que isso diz sobre nós';

// campo: 'conteudo' (padrão), 'resumo' ou 'titulo'
const CORRECOES = {
  '^catatonia-na-emergencia': [
    ['Administre lorazepam 1 a 2 mg por via endovenosa ou intramuscular, ou 2 mg por via oral, e reavalie o paciente após 5 minutos (endovenosa), 15 minutos (intramuscular) ou 30 minutos (oral); a resposta por via oral costuma ser mais lenta. Considera-se resposta positiva uma redução de 50% em uma escala padronizada, como a BFCRS, o que apoia o diagnóstico (Rogers et al., 2023, PMID 37039129).',
      'Administre um benzodiazepínico (como o lorazepam), com dose e via definidas pelo médico conforme o protocolo do serviço, e reavalie o paciente após cerca de 5 minutos (via endovenosa), 15 minutos (intramuscular) ou 30 minutos (oral); a resposta por via oral costuma ser mais lenta. Considera-se resposta positiva uma redução de 50% em uma escala padronizada, como a BFCRS, o que torna o diagnóstico mais provável, embora não seja 100% específico (Rogers et al., 2023, PMID 37039129).'],
    ['O lorazepam é o fármaco de escolha. Inicie com 1 a 2 mg por via endovenosa ou intramuscular. Na maioria dos estudos, a dose usada foi de 1 a 4 mg por dia, com relatos de até 16 mg por dia e máximo de 24 mg por dia em alguns protocolos; na catatonia maligna, a diretriz britânica sugere começar com 8 mg por dia e titular conforme a resposta e a tolerância (Rogers et al., 2023, PMID 37039129). Se houver resposta parcial, repita a dose conforme a avaliação clínica. O diazepam também é uma alternativa, mas o lorazepam costuma ter perfil mais previsível.',
      'O tratamento de primeira linha costuma ser um benzodiazepínico (como o lorazepam), com dose e via definidas pelo médico conforme o protocolo do serviço; a diretriz britânica indica um teste com benzodiazepínicos e/ou eletroconvulsoterapia como primeira linha (Rogers et al., 2023, PMID 37039129). Se houver resposta parcial, reavalie e ajuste a conduta conforme a avaliação clínica.'],
    ['<p>Fique atento aos sinais de <strong>catatonia letal (ou maligna)</strong>:</p>',
      '<p>Fique atento aos sinais de <strong>catatonia letal (ou maligna)</strong>. Casos graves, como a catatonia maligna, com febre e instabilidade dos sinais vitais, ameaçam a vida (Rogers et al., 2023, PMID 37039129); por isso são tratados como emergência e podem exigir cuidados intensivos, conforme o protocolo do serviço. Os sinais são:</p>'],
  ],
  '^uso-problematico-de-telas': [
    ['<li><strong>O sistema de recompensa:</strong> As telas oferecem estímulos rápidos e constantes com liberação imediata de dopamina. Isso torna atividades cotidianas e mais lentas, como estudar ou ler, menos atraentes para o cérebro em desenvolvimento.</li>\n', ''],
    ['<li><strong>Perturbação do sono:</strong> A luz azul emitida pelas telas inibe a produção de melatonina, o hormônio do sono. Isso reduz o tempo de sono profundo, essencial para a consolidação da memória e a regulação emocional do dia seguinte.</li>',
      '<li><strong>Sono em primeiro lugar:</strong> O tempo de tela não deve tomar o lugar do sono, necessário para a saúde e o desenvolvimento de crianças e adolescentes (Academia Indiana de Pediatria, 2021, PMID 34969943).</li>'],
  ],
  '^abandono-de-tratamento': [
    ['<li>Dewa CS, Zipursky RB, Chau N et al.. Specialized home treatment versus hospital-based outpatient treatment for first-episode psychosis: a randomized clinical trial. Early Interv Psychiatry. 2009;3(4):304-11. PMID 22642735. doi:10.1111/j.1751-7893.2009.00139.x — Ensaio clínico randomizado piloto (tratamento domiciliar)</li>',
      '<li>Loots E, Goossens E, Vanwesemael T et al.. Interventions to Improve Medication Adherence in Patients with Schizophrenia or Bipolar Disorders: A Systematic Review and Meta-Analysis. Int J Environ Res Public Health. 2021;18(19):10213. PMID 34639510. doi:10.3390/ijerph181910213 — Revisão sistemática e metanálise (adesão ao tratamento)</li>'],
  ],
  '^brasil-campeao-cirurgias-plasticas': [
    ['Brasil, campeão de cirurgias plásticas: o que isso diz sobre nós', TITULO_NOVO, 'titulo'],
    ['O Brasil lidera o ranking mundial de cirurgias estéticas. Por que operamos tanto', 'O Brasil está entre os países que mais realizam cirurgias plásticas. Por que operamos tanto', 'resumo'],
    ['O Brasil está entre os países que mais realizam procedimentos estéticos no mundo e lidera o ranking de cirurgias plásticas.', 'O Brasil está entre os países que mais realizam cirurgias plásticas no mundo.'],
    ['Segundo o levantamento internacional da Sociedade Internacional de Cirurgia Plástica Estética (ISAPS), com dados de 2024, o Brasil lidera o mundo em procedimentos cirúrgicos estéticos. Globalmente, os procedimentos estéticos, cirúrgicos e não cirúrgicos, se aproximaram de 38 milhões em 2024, com crescimento de mais de 40% em relação a 2020. A procura por procedimentos no rosto e a participação masculina vêm aumentando.<sup>1</sup>',
      'Segundo a pesquisa global da Sociedade Internacional de Cirurgia Plástica Estética (ISAPS), publicada em 2026 com os procedimentos realizados em 2025, o Brasil está entre os países que mais realizam cirurgias plásticas: foi o 1º em procedimentos cirúrgicos (2,3 milhões) e o 2º no total (3,2 milhões), atrás dos Estados Unidos (mais de 5,4 milhões). No mundo, foram quase 17,9 milhões de procedimentos cirúrgicos e 17,3 milhões não cirúrgicos, e os homens responderam por 14,4% das cirurgias.<sup>1</sup>'],
    [ISAPS_REF_ANTIGA, ISAPS_REF_NOVA],
  ],
  '^querer-e-nao-poder-pagar': [
    ['O Brasil lidera o ranking mundial de cirurgias estéticas.<sup>1</sup>', 'O Brasil está entre os países que mais realizam cirurgias plásticas: foi o 1º em procedimentos cirúrgicos e o 2º no total, segundo a ISAPS (procedimentos de 2025).<sup>1</sup>'],
    [ISAPS_REF_ANTIGA, ISAPS_REF_NOVA],
  ],
};

const conta = (t, s) => t.split(s).length - 1;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const planos = [];
  for (const [re, trocas] of Object.entries(CORRECOES)) {
    const d = await col.findOne({ slug: { $regex: re } });
    if (!d) throw new Error(`texto não encontrado: ${re}`);
    const campos = { conteudo: d.conteudo, resumo: d.resumo, titulo: d.titulo };
    const log = [];
    for (const [antes, depois, campo = 'conteudo'] of trocas) {
      const n = conta(campos[campo], antes);
      if (n === 0 && conta(campos[campo], depois) >= 1) { log.push('já aplicada'); continue; }
      if (n !== 1) throw new Error(`${d.slug}: trecho aparece ${n}x em ${campo} (esperado 1): ${antes.slice(0, 70)}`);
      campos[campo] = campos[campo].replace(antes, () => depois);
      log.push({ antes, depois });
    }
    planos.push({ d, ...campos, log });
  }
  for (const p of planos) {
    const falhas = checarTexto({ origem: 'mongo', slug: p.d.slug, titulo: p.titulo, resumo: p.resumo, tempoLeitura: p.d.tempoLeitura, corpo: p.conteudo }).map((f) => f.msg);
    console.log(`\n=== ${p.d.slug}\n  trocas: ${p.log.length} · auditoria do texto novo: ${falhas.length ? falhas.join(' | ') : 'sem falhas'}`);
    for (const l of p.log) if (typeof l === 'object') console.log(`  - ANTES : ${l.antes.slice(0, 220)}\n    DEPOIS: ${l.depois.slice(0, 300)}`);
  }
  if (!aplicar) { console.log('\n(dry-run: nada gravado; use --aplicar)'); await mongoose.disconnect(); return; }

  const agora = new Date();
  const carimbo = `${agora.toISOString().slice(0, 10).replace(/-/g, '')}-${agora.toISOString().slice(11, 16).replace(':', '')}`;
  const dir = path.join(RAIZ, 'backups', `importacao-completa-${carimbo}`);
  fs.mkdirSync(dir, { recursive: true });
  const todos = await col.find({}).toArray();
  fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(todos), 'utf8');
  const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8'));
  if (lido.length !== todos.length) throw new Error('backup não confere');
  console.log(`\nbackup: ${dir} (${lido.length} documentos, confere)`);
  for (const p of planos) {
    const $set = { conteudo: p.conteudo, resumo: p.resumo, titulo: p.titulo, atualizadoEm: new Date() };
    const op = { $set };
    if (p.titulo !== p.d.titulo) op.$push = { historicoTitulos: { titulo: p.d.titulo, em: new Date() } };
    await col.updateOne({ _id: p.d._id }, op);
    console.log(`gravado: ${p.d.slug}${p.titulo !== p.d.titulo ? ' (título trocado, antigo em historicoTitulos)' : ''}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
