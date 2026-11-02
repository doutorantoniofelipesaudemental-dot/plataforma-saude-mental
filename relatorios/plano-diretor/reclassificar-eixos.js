// Reclassificação dos eixos oficiais (ordem de 02/11/2026, 08:10). Só lê e grava INVENTARIO.csv.
// Uso: node relatorios/plano-diretor/reclassificar-eixos.js [--gravar]
const fs = require('fs');
const path = require('path');

const CSV = path.join(__dirname, 'INVENTARIO.csv');
const GRAVAR = process.argv.includes('--gravar');

const NOMES = {
  1: 'Infância, Adolescência, Pais & Família, Professores & Saúde Escolar',
  2: 'Maternidade, Puerpério & Saúde Perinatal',
  3: 'Vida Adulta, Envelhecimento & Cuidados Paliativos',
  4: 'Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1)',
  5: 'Transtornos Mentais',
  6: 'Hábitos, Estilo de Vida & Sono',
  7: 'Sociedade, Cultura & Existência',
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// CSV com aspas duplas escapadas ("")
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

// ---- Regras (títulos normalizados) ----
const PAL = /paliativ|fim da vida|sedacao paliativa|diretivas antecipadas|dor total|cicely|psicoterapias no fim|perde o sentido|morrer na rua|luto antecipatorio/;
const PAL_CUIDADOR = /cuidador|quem cuida|cuidar de quem|burnout|fadiga|sofrimento moral|profissional|equipes? de cuidados|equipe interprofissional|formacao em cuidados|rodas de conversa|cuidam de familiares/;
const PERINATAL = /pos-parto|puerp|gravidez|gestant|gestacao|pre-natal|perinatal|amament|maternidade|parto\b|neonatal|prematur|obstetric/;
const TEACH = /professor|docente/;
const TRAB = /trabalh|empresa|\brh\b|nr-1|psicossocial|gestao (institucional|de conflitos|de equipes)|corporativ|ocupacional|emprego|cuidam de familiares|burnout|equipe|equipes|medic|enfermeir|residente|plantao|cuidador|quem cuida|cuidar de quem|cuidado vira|afastamento|demiss|desligamento|call center|varejo|startup|vendas|terceirizad|metas|ranking|home office|integracao de novos|reestruturac|fusoes|organizacional|motorista|entregador|vigilante|comerciante|cuidar de familiares/;
const LUTO = /\bluto\b|enluta|viuvez|perda de|perder um bebe|perdeu alguem/;
const VIOL = /violencia|agress|assedio|feminicid|tiroteio|homicid|atentado|ataque|assalto|trafico|vitima|abuso|negligencia|maus-tratos|humilhacao|importunacao|bala perdida|sextorsao|golpe/;
const IDOSO = /idos|envelhec|terceira idade|avo\b|dona lourdes|pais que ficam/;
const CRIANCA = /crianc|adolesc|filh|infan|escola|pais\b|jovem|aluno|menino|menina|irmao|irmaos|sextorsao|nudes|autismo|tdah na infancia/;
const MIGRA = /migra|refugi|imigr|estrangeir|expatri|deslocad|sotaque|de volta, mas|brasileiros que vivem fora|viver sem documentos/;

const HITS = {
  1: /crianc|adolesc|filh|infan|escola|pais\b|jovem|tela|redes sociais|jogos online|roblox|fortnite|sharenting|bullying|autismo|tdah na infancia|dislexia|tiques|xixi|desfralde|mutismo|pesadelo|escuro|vacina|agulha|namoro|adocao|irmao|irmaos|brincar|birra|puberdade|desafiador|bebe e|sono na adolescencia|vape|cyberbullying|alta habilidades|altas habilidades|mae que dormia|menino|menina|aluno/,
  3: /idos|envelhec|terceira idade|aposentad|demencia|esquecimento|memoria|cognitiv|neuropsicolog|fragilidade|polifarmacia|remedios demais|viuvez|dona lourdes|avo\b|velhice|a idosa|o idoso/,
  5: /ansiedade|depress|panico|compulsao|compulsoes|toc\b|transtorno|bipolar|psicos|psicot|tept|estresse pos-traumatico|trauma|dissociativ|catatonia|delirium|fobia|pensamentos suicidas|suicid|psicofarmac|medicacao psiquiatrica|benzodiazep|sindrome do panico|dismorf|vigorexia|anorexia|bulimia|obsessivo|mania|raiva|tpm|disforico/,
  6: /alcool|tabaco|fumar|drogas|dependencia|maconha|canabi|sono|insonia|dormir|telas|alimentac|nutri|academia|exercicio|suplement|whey|creatina|rotina|procrastin|cafe|estimulante|zolpidem|bets|apostas|jogo patologico|hidrat|agua|bebida|cerveja/,
  7: /racis|lgbt|estigma|solidao|capacitismo|gordofobia|preconceito|xenofob|desinformacao|indigen|aldeia|religi|pastor|terreiro|desastre|enchente|clima|sociedade|desigualdade|pobreza|cor da pele|racial|morte|morrer|cultura|politica|diversidade|migra|refugi|imigr|estrangeir|deslocad|sotaque|capacitismo/,
  4: TRAB,
};
const PRIO = [4, 1, 3, 2, 5, 6, 7];

function classificar(titulo, eixoAtual, revisarAtual) {
  const t = norm(titulo);
  if (PAL.test(t)) {
    if (PAL_CUIDADOR.test(t)) return { eixo: 4, revisar: true, motivo: 'paliativos-cuidador' };
    return { eixo: 3, revisar: !/paliativ/.test(t), motivo: 'paliativos' };
  }
  if (PERINATAL.test(t)) return { eixo: 2, revisar: false, motivo: 'perinatal' };
  if (TEACH.test(t)) return { eixo: 1, revisar: false, motivo: 'professores' };
  if (TRAB.test(t)) {
    const extra = [1, 3, 5, 6, 7].filter((e) => HITS[e].test(t) && e !== 3);
    return { eixo: 4, revisar: false, motivo: 'trabalho' + (extra.length ? '(outros temas)' : '') };
  }
  if (LUTO.test(t)) {
    if (VIOL.test(t) || /sociedade|migra|racis|enchente|desastre/.test(t)) return { eixo: 7, revisar: false, motivo: 'luto-violencia' };
    return { eixo: 3, revisar: false, motivo: 'luto' };
  }
  if (VIOL.test(t)) {
    const e = IDOSO.test(t) ? 3 : CRIANCA.test(t) ? 1 : 7;
    return { eixo: e, revisar: false, motivo: 'violencia' };
  }
  if (MIGRA.test(t) && !CRIANCA.test(t)) return { eixo: 7, revisar: false, motivo: 'migracao' };
  const hits = Object.keys(HITS).map(Number).filter((e) => HITS[e].test(t));
  if (hits.length === 1) return { eixo: hits[0], revisar: false, motivo: 'palavra-chave' };
  if (hits.length > 1) {
    const e = PRIO.find((p) => hits.includes(p));
    return { eixo: e, revisar: true, motivo: 'ambiguo:' + hits.join('/') };
  }
  return { eixo: Number(eixoAtual), revisar: revisarAtual === 'sim', motivo: 'sem-regra (eixo anterior)' };
}

// ---- Execução ----
const linhas = parseCSV(fs.readFileSync(CSV, 'utf8'));
const cab = linhas[0];
const iT = cab.indexOf('titulo'), iE = cab.indexOf('eixo'), iN = cab.indexOf('eixo_nome'), iR = cab.indexOf('revisar');
const resumo = {}, revisar = [], mudou = [];
const OVR = new Map(JSON.parse(fs.readFileSync(path.join(__dirname, 'reclassificacao-02-11-overrides.json'), 'utf8')).map(([t, e, rv]) => [t, { eixo: e, revisar: rv, motivo: 'decisão manual' }]));
const usados = new Set();
for (const r of linhas.slice(1)) {
  if (r.length < cab.length) continue;
  const antes = r[iE];
  const c = OVR.has(r[iT]) ? (usados.add(r[iT]), OVR.get(r[iT])) : classificar(r[iT], antes, r[iR]);
  if (String(c.eixo) !== String(antes)) mudou.push(`${antes}->${c.eixo} | ${r[iT]} | ${c.motivo}`);
  r[iE] = String(c.eixo);
  r[iN] = NOMES[c.eixo];
  r[iR] = c.revisar ? 'sim' : 'não';
  resumo[c.eixo] = (resumo[c.eixo] || 0) + 1;
  if (c.revisar) revisar.push(`${r[iE]} | ${r[iT]} | ${c.motivo}`);
}
const motivos = {};
for (const r of linhas.slice(1)) {}
console.log('Eixos:', JSON.stringify(resumo));
console.log('Revisar:', revisar.length);
console.log('Mudanças de eixo:', mudou.length);
fs.writeFileSync(path.join(__dirname, 'reclassificacao-02-11-revisar.txt'), revisar.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'reclassificacao-02-11-mudancas.txt'), mudou.join('\n') + '\n');
if (GRAVAR) {
  const out = [cab.join(',')].concat(linhas.slice(1).filter((r) => r.length >= cab.length).map((r) => r.map((v) => esc(v)).join(',')));
  fs.writeFileSync(CSV, out.join('\r\n') + '\r\n'); // o CSV rastreado usa CRLF
  console.log('INVENTARIO.csv gravado.');
}
