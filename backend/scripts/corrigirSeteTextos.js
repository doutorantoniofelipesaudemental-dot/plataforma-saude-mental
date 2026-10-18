/**
 * Correções aprovadas pelo Dr. Antônio (17/10/2026) nos 7 textos parados. Cada troca vale só se o trecho antigo aparecer exatamente 1 vez.
 *   node --env-file=.env backend/scripts/corrigirSeteTextos.js             dry-run: mostra antes/depois e a auditoria do texto novo
 *   node --env-file=.env backend/scripts/corrigirSeteTextos.js --aplicar   grava (backup da coleção "artigos" antes, em backups/importacao-completa-AAAAMMDD-HHMM/)
 * Fontes conferidas: ISAPS Global Survey 2025 (isaps.org, comunicado de 29/09/2026); Nolen et al., Bipolar Disord 2019, PMID 31112628 (resumo literal no PubMed).
 * A narração NÃO é apagada: o hash muda e o player antigo deixa de tocar (estadoNarracao) até a nova ser gerada.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarTexto } = require('../lib/auditoriaTexto');

const aplicar = process.argv.includes('--aplicar');
const RAIZ = path.resolve(__dirname, '../..');

const NOLEN_LI = '<li>Nolen WA, Licht RW, Young AH et al.. What is the optimal serum level for lithium in the maintenance treatment of bipolar disorder? A systematic review and recommendations from the ISBD/IGSLI Task Force on treatment with lithium. <em>Bipolar Disord</em>. 2019;21(5):394-409. PMID 31112628. <a href="https://doi.org/10.1111/bdi.12805" target="_blank" rel="noopener">doi:10.1111/bdi.12805</a> — Revisão sistemática e recomendações (ISBD/IGSLI)</li>';

const CORRECOES = {
  '^delirium-no-pronto': [
    ['pode-se utilizar antipsicóticos de baixa potência como a risperidona ou o haloperidol,', 'pode-se utilizar antipsicóticos em dose baixa, como a risperidona (atípico) ou o haloperidol (típico de alta potência),'],
  ],
  '^insatisfacao-corporal': [
    ['O país que mais faz cirurgias plásticas no mundo.', 'Um dos países que mais realizam cirurgias plásticas no mundo.'],
    ['<h2>Estética: o Brasil na liderança</h2>', '<h2>Estética: o Brasil entre os líderes</h2>'],
    ['Pelo levantamento internacional da Sociedade Internacional de Cirurgia Plástica Estética (ISAPS), com dados de 2024, o Brasil está entre os países que mais realizam procedimentos estéticos e lidera o ranking mundial em cirurgias. A participação dos homens vem crescendo, sobretudo em cirurgias de pálpebras e de ginecomastia.<sup>4</sup>',
      'Segundo a pesquisa global da Sociedade Internacional de Cirurgia Plástica Estética (ISAPS), publicada em 2026 com os procedimentos realizados em 2025, os Estados Unidos ficaram em 1º lugar no total de procedimentos (mais de 5,4 milhões) e o Brasil em 2º (3,2 milhões), sendo o 1º em procedimentos cirúrgicos (2,3 milhões). Os homens respondem por 14,4% das cirurgias; entre eles, a cirurgia de pálpebras foi a mais comum, seguida da ginecomastia.<sup>4</sup>'],
    ['ISAPS International Survey on Aesthetic/Cosmetic Procedures performed in 2024. <a href="https://www.isaps.org/media/3uhnjvup/2024-global-survey-portuguese-brazilian.pdf" target="_blank" rel="noopener">isaps.org</a>',
      'ISAPS Global Survey 2025: procedimentos estéticos/cosméticos realizados em 2025 (divulgada em 29/09/2026). <a href="https://www.isaps.org/discover/about-isaps/global-statistics/global-survey-2025-full-report-and-press-releases/" target="_blank" rel="noopener">isaps.org</a>'],
    ['achando, sem razão, que se trata apenas de falta de força de vontade.', 'achando, sem razão, que precisam resolver sozinhas, quando se trata de uma condição de saúde que merece cuidado.'],
    ['liderança em cirurgias e compulsão alimentar', 'cirurgias plásticas e compulsão alimentar', 'resumo'],
  ],
  '^transtorno-bipolar-na-aps': [
    ['Para o lítio, a diretriz CANMAT/ISBD 2018 sugere litemia-alvo de 0,8 a 1,2 mEq/L no tratamento agudo (0,4 a 0,8 em idosos) e de 0,6 a 1 mEq/L na manutenção, dosada cerca de 5 dias após cada ajuste de dose (PMID 29536616).',
      'Para o lítio, o nível no sangue (litemia) orienta a dose, e a faixa é individualizada pelo médico conforme resposta, efeitos e idade. Na manutenção em adultos, o consenso da força-tarefa ISBD/IGSLI indica como padrão 0,60 a 0,80 mmol/L, com a opção de reduzir para 0,40 a 0,60 se houver boa resposta e pouca tolerância, ou de subir para 0,80 a 1,00 se a resposta for insuficiente e a tolerância boa. Em idosos não houve consenso, mas a maioria apoiou uma abordagem mais conservadora, em geral 0,40 a 0,60 mmol/L, com máximo de 0,70 ou 0,80 entre 65 e 79 anos e de 0,70 acima dos 80 (Nolen et al., 2019, PMID 31112628). Como a faixa terapêutica é estreita e há risco de toxicidade, a litemia é repetida com exames periódicos, segundo o protocolo local.'],
    ['__REF_APOS_CANMAT__', NOLEN_LI],
  ],
  '^abandono-de-tratamento': [
    ['A principal causa de abandono é o desconforto físico.', 'Uma das causas frequentes de abandono é o desconforto físico dos efeitos colaterais.'],
    ['Antidepressipvos (Inibidores Seletivos da Reaptação de Serotonina)', 'Antidepressivos (Inibidores Seletivos da Recaptação de Serotonina)'],
    ['no caso do lítio, a litemia orienta a dose (CANMAT/ISBD 2018, PMID 29536616).', 'no caso do lítio, a litemia (nível do medicamento no sangue) orienta a dose, com exames periódicos, porque a faixa terapêutica é estreita e há risco de toxicidade.'],
  ],
  '^uso-problematico-de-telas': [
    ['Zero telas para menores de dois anos, exceto videochamadas rápidas. Para crianças maiores, limite o tempo diário de uso de qualidade e com supervisão.', 'Para menores de dois anos, a recomendação é evitar qualquer tipo de tela. Entre 24 e 59 meses, no máximo uma hora por dia, com supervisão, e abaixo de duas horas por dia entre 5 e 10 anos; o uso não deve substituir sono, brincadeiras ao ar livre, convivência e estudo (Academia Indiana de Pediatria, 2021, PMID 34969943).'],
  ],
  '^relato-namorado': [
    ['ele dizia que ela era "louca", que ninguém mais a aguentaria.', 'ele dizia que ela era "exagerada", que ninguém mais a aguentaria.'],
    ['Que ela não era louca.', 'Que ela não estava exagerando.'],
    ['<strong>Precisa de apoio agora?</strong> CVV — 188 (ligação gratuita, 24h, também por chat em cvv.org.br) · SAMU — 192 em emergências · A UBS e o CAPS da sua cidade acolhem e encaminham.',
      '<strong>Precisa de apoio agora?</strong> Ligue 180 (Central de Atendimento à Mulher, ligação gratuita, 24h) · 190 (Polícia Militar, se houver risco imediato) · Disque 100 (violência contra crianças e adolescentes, ligação gratuita, 24h) · CVV — 188 (ligação gratuita, 24h, também por chat em cvv.org.br) · SAMU — 192 em emergências · A UBS e o CAPS da sua cidade acolhem e encaminham.'],
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
    let conteudo = d.conteudo, resumo = d.resumo;
    const log = [];
    for (const [antes, depois, campo] of trocas) {
      if (antes === '__REF_APOS_CANMAT__') {
        const i = conteudo.indexOf('PMID 29536616');
        if (i < 0) throw new Error(`${d.slug}: referência CANMAT não achada`);
        const fim = conteudo.indexOf('</li>', i) + 5;
        if (conteudo.includes('PMID 31112628')) { log.push('referência Nolen já presente'); continue; }
        conteudo = conteudo.slice(0, fim) + '\n  ' + depois + conteudo.slice(fim);
        log.push({ antes: '(lista de referências)', depois: 'acrescentada: Nolen et al. 2019 (PMID 31112628)' });
        continue;
      }
      const alvo = campo === 'resumo' ? resumo : conteudo;
      const n = conta(alvo, antes);
      if (n === 0 && conta(alvo, depois) === 1) { log.push('já aplicada'); continue; }
      if (n !== 1) throw new Error(`${d.slug}: trecho aparece ${n}x (esperado 1): ${antes.slice(0, 60)}`);
      if (campo === 'resumo') resumo = resumo.replace(antes, () => depois); else conteudo = conteudo.replace(antes, () => depois);
      log.push({ antes, depois });
    }
    planos.push({ d, conteudo, resumo, log });
  }
  for (const p of planos) {
    const falhas = checarTexto({ origem: 'mongo', slug: p.d.slug, titulo: p.d.titulo, resumo: p.resumo, tempoLeitura: p.d.tempoLeitura, corpo: p.conteudo }).map((f) => f.msg);
    console.log(`\n=== ${p.d.slug}\n  trocas: ${p.log.length} · auditoria do texto novo: ${falhas.length ? falhas.join(' | ') : 'sem falhas'}`);
    for (const l of p.log) if (typeof l === 'object') console.log(`  - ANTES : ${l.antes.slice(0, 200)}\n    DEPOIS: ${l.depois.slice(0, 260)}`);
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
    await col.updateOne({ _id: p.d._id }, { $set: { conteudo: p.conteudo, resumo: p.resumo, atualizadoEm: new Date() } });
    console.log(`gravado: ${p.d.slug}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
