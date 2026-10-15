/**
 * Correções editoriais aprovadas pelo Dr. Antônio em 15/10/2026 (relatorios/referencias-retratadas-proposta.md, "Observações"):
 *  A. links de referência quebrados ou genéricos (404 em bvsms; Resolução CFM 2.333 apontando para a home do CFM);
 *  B. jogos-online-consulta-medicos (.mdx): afirmação específica sobre a classificação NR16 sem fonte primária acessível sai;
 *     fica a orientação geral, apoiada na Lei 15.211/2025 e no Decreto 12.880/2026 (lidos em planalto.gov.br);
 *  C. selo "Narrativa composta" nos textos que abrem com a cena de uma pessoa específica e não tinham o selo.
 * DRY-RUN POR PADRÃO. Com --aplicar: backup (Mongo + .mdx) e gravação. Cada troca exige ocorrência exata.
 *   node --env-file=.env backend/scripts/corrigirEditorial.js [--aplicar]
 */
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');

const HREFS = [
  ['https://bvsms.saude.gov.br/bvs/publicacoes/guia_da_crianca_2019.pdf', 'https://portaldeboaspraticas.iff.fiocruz.br/wp-content/uploads/2019/11/guia_da_crianca_2019.pdf'],
  ['https://bvsms.saude.gov.br/bvs/saudelegis/gm/2002/prt0254_31_01_2002.html', 'https://www.mpf.mp.br/atuacao/ccr6/documentos-e-publicacoes/legislacao/legislacao-docs/saude/docs_portarias/portaria-no-254-de-31-de-janeiro-de-2002'],
];
const CFM_2333 = { itemContem: '2.333/2023', velho: 'href="https://portal.cfm.org.br"', novo: 'href="https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2023/2333"' };

const SELO = 'Narrativa composta, construída a partir de padrões observados na prática clínica. Nomes, idades e circunstâncias foram criados ou alterados, e nenhum personagem corresponde a uma pessoa real. ';
const SLUGS_SELO = ['violencia-adultos-que-sofreram-abuso-na-infancia', 'caneta-sem-indicacao-magreza', 'violencia-criancas-em-acolhimento', 'violencia-obstetrica', 'violencia-depois-de-sair-reconstruir', 'violencia-financeira-contra-idoso', 'violencia-idoso-e-cuidador-sobrecarregado', 'violencia-trabalhadores-expostos-a-assaltos', 'violencia-domestica-e-trabalho', 'violencia-maes-que-perderam-filhos', 'violencia-digital-e-perseguicao', 'violencia-institucional-e-revitimizacao', 'violencia-psicologica-controle-coercitivo', 'familias-separadas-migracao-quem-fica', 'migracao-sofrimento-no-corpo', 'violencia-trauma-vicario-rede-de-protecao', 'violencia-contra-pessoa-idosa', 'violencia-negligencia-infantil', 'migracao-adolescentes-entre-dois-mundos'];

const MDX_JOGOS = 'src/content/artigos/jogos-online-consulta-medicos.mdx';
const TROCAS_JOGOS = [
  ['Com a reclassificação desses jogos pelo Ministério da Justiça e Segurança Pública no contexto do ECA Digital (Lei nº 15.211/2025), o tema ganhou visibilidade nas famílias',
    'Com a entrada em vigor do ECA Digital (Lei nº 15.211/2025) e do Decreto nº 12.880/2026, que o regulamenta, o tema ganhou visibilidade nas famílias'],
  ['desde a entrada em vigor do ECA Digital, Roblox, Fortnite e Free Fire foram classificados como NR16 (não recomendados para menores de 16 anos) pelo critério de "engajamento contínuo e sistemas de recomendação algorítmica" — distinto de critérios tradicionais como violência ou linguagem. Conhecer esse contexto permite orientar famílias com base em informação atualizada, não apenas impressão pessoal sobre o jogo.',
    'o Decreto nº 12.880/2026, que regulamenta o ECA Digital, trata como riscos a considerar nos jogos e plataformas a interação entre usuários, o estímulo ao uso problemático ou excessivo e as caixas de recompensa (loot boxes), que a Lei nº 15.211/2025 (art. 20) veda em jogos direcionados a crianças e adolescentes ou de acesso provável por eles. Para a faixa etária de cada jogo, consulte a classificação indicativa vigente no site do Ministério da Justiça e Segurança Pública. Conhecer esse contexto permite orientar famílias com base em informação atualizada, não apenas impressão pessoal sobre o jogo.'],
  ['<li>Brasil. Lei nº 15.211, de 17 de setembro de 2025 — Estatuto Digital da Criança e do Adolescente (ECA Digital), em vigor desde 17 de março de 2026. <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm" target="_blank" rel="noopener">planalto.gov.br</a></li>',
    '<li>Brasil. Lei nº 15.211, de 17 de setembro de 2025 — Estatuto Digital da Criança e do Adolescente (ECA Digital), em vigor desde 17 de março de 2026. <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm" target="_blank" rel="noopener">planalto.gov.br</a> · Decreto nº 12.880, de 18 de março de 2026, que a regulamenta. <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12880.htm" target="_blank" rel="noopener">planalto.gov.br</a></li>'],
  ['baseado em decisões do Ministério da Justiça e Segurança Pública sobre classificação indicativa (ECA Digital, Lei nº 15.211/2025) e em literatura', 'baseado no ECA Digital (Lei nº 15.211/2025), no Decreto nº 12.880/2026 e em literatura'],
];

const conta = (t, s) => t.split(s).length - 1;
function trocarHrefs(texto, rotulo, problemas, registro) {
  let t = texto;
  for (const [velho, novo] of HREFS) { const n = conta(t, velho); if (n) { t = t.split(velho).join(novo); registro.push(`${rotulo}: ${n}× ${velho.split('/').pop()}`); } }
  // CFM 2.333: troca o href genérico só no item da própria resolução
  t = t.replace(/<li[^>]*>(?:(?!<\/li>)[\s\S])*?<\/li>/g, (li) => (li.includes(CFM_2333.itemContem) && li.includes(CFM_2333.velho) ? (registro.push(`${rotulo}: link da Resolução CFM 2.333/2023`), li.replace(CFM_2333.velho, CFM_2333.novo)) : li));
  return t;
}

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const problemas = [], registro = [], mud = new Map();
  for (const d of await col.find({}).toArray()) {
    let t = trocarHrefs(d.conteudo, `site:${d.slug}`, problemas, registro);
    if (SLUGS_SELO.includes(d.slug)) {
      const marca = '<p class="refs-note">';
      if (/Narrativa composta/i.test(t)) problemas.push(`site:${d.slug}: já tem o selo`);
      else if (conta(t, marca) !== 1) problemas.push(`site:${d.slug}: ${conta(t, marca)} parágrafos refs-note (esperado 1)`);
      else { t = t.replace(marca, marca + SELO); registro.push(`site:${d.slug}: selo "Narrativa composta"`); }
    }
    if (t !== d.conteudo) mud.set(d.slug, { d, novo: t, antes: estadoNarracao(d).estado, depois: estadoNarracao({ ...d, conteudo: t }).estado });
  }
  for (const s of SLUGS_SELO) if (!mud.has(s)) problemas.push(`site:${s}: sem mudança (slug inexistente?)`);

  const arquivos = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx$/.test(e.name) ? [path.join(dir, e.name)] : []));
  for (const arq of [...walk(path.join(APP, 'src/content')), ...walk(path.join(APP, 'content'))]) {
    const rel = path.relative(APP, arq).replace(/\\/g, '/');
    const orig = fs.readFileSync(arq, 'utf8');
    let t = trocarHrefs(orig, `next:${rel}`, problemas, registro);
    if (rel === MDX_JOGOS) {
      for (const [velho, novo] of TROCAS_JOGOS) { if (conta(t, velho) !== 1) problemas.push(`next:${rel}: trecho antigo ocorre ${conta(t, velho)}x: ${velho.slice(0, 50)}…`); else t = t.replace(velho, novo); }
      registro.push(`next:${rel}: afirmação NR16 trocada pela orientação geral + Decreto 12.880/2026`);
    }
    if (t !== orig) arquivos.push({ arq, rel, orig, novo: t });
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · textos do site: ${mud.size} · .mdx do Next: ${arquivos.length}`);
  registro.forEach((r) => console.log('  •', r));
  const muda = [...mud.values()].filter((m) => m.antes !== m.depois);
  console.log('  narração que passa a "desatualizada":', muda.filter((m) => m.antes === 'ok').map((m) => m.slug || m.d.slug).join(', ') || 'nenhuma');
  problemas.forEach((p) => console.log('  PROBLEMA', p));
  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const dir = path.join(RAIZ, 'backups', `editorial-${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}-${p2(dl.getHours())}${p2(dl.getMinutes())}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify([...mud.values()].map((m) => m.d)));
    for (const a of arquivos) { const alvo = path.join(dir, 'mdx', a.rel); fs.mkdirSync(path.dirname(alvo), { recursive: true }); fs.writeFileSync(alvo, a.orig, 'utf8'); }
    const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8'));
    if (lido.length !== mud.size) throw new Error('backup não confere');
    for (const m of mud.values()) await col.updateOne({ _id: m.d._id }, { $set: { conteudo: m.novo, ...(m.d.publicado ? { atualizadoEm: new Date() } : {}) } });
    for (const a of arquivos) fs.writeFileSync(a.arq, a.novo, 'utf8');
    console.log(`GRAVADO. Backup em ${path.relative(RAIZ, dir)} (${lido.length} documentos + ${arquivos.length} .mdx).`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
