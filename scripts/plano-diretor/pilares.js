// Pilares automáticos (ordem de 02/11/2026, item 3c). Só leitura: monta a lista de satélites por eixo a partir do
// inventário (relatorios/plano-diretor/INVENTARIO.csv). Entra só o que está PUBLICADO e NÃO está marcado para revisão.
// Funções puras para teste. Uso: node scripts/plano-diretor/pilares.js  (imprime o índice; não grava nada).

const fs = require('node:fs');
const path = require('node:path');

// CSV com aspas (campos podem ter vírgula e aspas dobradas).
function parseCsv(texto) {
  const linhas = []; let campo = ''; let linha = []; let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo.replace(/\r$/, '')); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...dados] = linhas;
  return dados.filter((d) => d.length === cab.length).map((d) => Object.fromEntries(cab.map((k, i) => [k, d[i]])));
}

const EIXOS_OFICIAIS = [
  'Infância, Adolescência, Pais & Família, Professores & Saúde Escolar',
  'Maternidade, Puerpério & Saúde Perinatal',
  'Vida Adulta, Envelhecimento & Cuidados Paliativos',
  'Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1)',
  'Transtornos Mentais',
  'Hábitos, Estilo de Vida & Sono',
  'Sociedade, Cultura & Existência',
];

// Satélites por eixo: só publicado, sem revisão pendente, eixo oficial. Ordem alfabética dentro do eixo.
function gerarPilares(linhas) {
  const porEixo = Object.fromEntries(EIXOS_OFICIAIS.map((e) => [e, []]));
  for (const l of linhas) {
    if ((l.status || '').trim() !== 'publicado') continue;
    if ((l.revisar || '').trim().toLowerCase() === 'sim') continue;
    const eixo = (l.eixo_nome || '').trim();
    if (!porEixo[eixo]) continue;
    porEixo[eixo].push({ slug: l.slug, titulo: l.titulo });
  }
  for (const e of EIXOS_OFICIAIS) porEixo[e].sort((a, b) => a.slug.localeCompare(b.slug));
  return porEixo;
}

function caminhoInventario() {
  return path.resolve(__dirname, '../../relatorios/plano-diretor/INVENTARIO.csv');
}

if (require.main === module) {
  const porEixo = gerarPilares(parseCsv(fs.readFileSync(caminhoInventario(), 'utf8')));
  for (const [eixo, itens] of Object.entries(porEixo)) {
    console.log(`${eixo}: ${itens.length} satélite(s)`);
  }
}

module.exports = { parseCsv, gerarPilares, EIXOS_OFICIAIS };
