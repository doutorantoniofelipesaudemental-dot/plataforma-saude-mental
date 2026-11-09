// Gera as páginas-pilar estáticas (uma por eixo) em public/pilares/.
// Fontes: INVENTARIO.csv (só publicados, sem revisão pendente) e INTRODUCOES-EIXOS.md (introduções em aprovação).
// Leitura: "Comece por aqui" = 12 artigos do eixo com mais referências (relatos ficam de fora desse topo);
// os demais agrupados por público (subtema), em <details> recolhíveis. Sem script de terceiros.
// Dados de leitura (mais lidos) não existem no inventário: o critério é referências, não visitas.
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv, EIXOS_OFICIAIS } = require('./pilares.js');

const RAIZ = path.resolve(__dirname, '..', '..');
const SAIDA = path.join(RAIZ, 'public', 'pilares');
const TOPO = 12;

function escapar(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function lerIntroducoes() {
  const md = fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INTRODUCOES-EIXOS.md'), 'utf8');
  const mapa = {};
  for (const linha of md.split('\n')) {
    const m = linha.match(/^\|\s*(\d)\s*—[^|]*\|\s*([^|]+?)\s*\|/);
    if (m) mapa[Number(m[1])] = m[2];
  }
  return mapa;
}

const RODAPE = `<footer class="rodape"><div class="container">
  <p><strong>Portal de Saúde Mental Doutor Antônio Felipe Garabito</strong></p>
  <p>
    Dr. Antônio Felipe — Médico — CRM-BA 41322<br>
    Especialista em Medicina de Família e Comunidade — RQE 26638<br>
    Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)<br>
    Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho<br>
    NÃO ESPECIALISTA
  </p>
  <p>Orientação geral. Sempre se respeitam os protocolos do hospital, do Pronto Atendimento (PA) e da rede de saúde local. Em crise: CVV 188 · SAMU 192.</p>
  <p><a href="/">Início</a> · <a href="/blog">Artigos</a> · <a href="/mentoria">Mentoria, consultoria e formação</a> · <a href="/privacidade">Privacidade</a> · <a href="/termos">Termos de uso</a></p>
</div></footer>`;

const item = (s) => `<li><a href="/artigo/${escapar(s.slug)}">${escapar(s.titulo)}</a></li>`;

function pagina(n, nome, intro, arts) {
  const ordenados = [...arts].sort((a, b) => (b.refs - a.refs) || a.slug.localeCompare(b.slug));
  const topo = ordenados.filter((a) => a.publico !== 'Relatos da Prática').slice(0, TOPO);
  const topoSlugs = new Set(topo.map((a) => a.slug));
  const resto = ordenados.filter((a) => !topoSlugs.has(a.slug));

  const grupos = new Map();
  // "Todos os textos deste eixo" lista todos (inclusive os do topo), para o eixo nunca ficar sem grupos.
  for (const a of ordenados) {
    const k = a.publico || 'Geral';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(a);
  }
  const blocos = [...grupos.entries()]
    .sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))
    .map(([k, lista]) => `  <details>\n    <summary>${escapar(k)} (${lista.length})</summary>\n    <ul>\n${lista.map(item).join('\n')}\n    </ul>\n  </details>`)
    .join('\n');

  const topoHtml = topo.length
    ? `<ol>\n${topo.map(item).join('\n')}\n</ol>`
    : '<p>Em breve: os textos deste eixo estão em revisão.</p>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(nome)} · Saúde Mental · Doutor Antônio Felipe Garabito</title>
<meta name="description" content="${escapar(intro.slice(0, 150))}">
<link rel="canonical" href="https://www.drantoniofelipemedico.com.br/pilares/eixo-${n}">
<style>
  :root { --texto:#1d2a25; --fundo:#fbfaf6; --verde:#1f5a46; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --texto:#f2f4f1; --fundo:#14201b; --verde:#8fd3b6; } }
  body { margin:0; background:var(--fundo); color:var(--texto); font:17px/1.6 system-ui, sans-serif; }
  main, footer .container { max-width:44rem; margin:0 auto; padding:1.25rem 1rem; }
  h1 { font-size:1.6rem; line-height:1.25; color:var(--verde); }
  h2 { font-size:1.2rem; color:var(--verde); margin-top:2rem; }
  a { color:var(--verde); }
  li { margin:.4rem 0; }
  details { margin:.6rem 0; border-left:3px solid var(--verde); padding-left:.8rem; }
  summary { cursor:pointer; font-weight:600; min-height:44px; display:flex; align-items:center; }
  .rodape { border-top:1px solid #0002; margin-top:2rem; font-size:.92rem; }
</style>
</head>
<body>
<main itemscope itemtype="https://schema.org/MedicalWebPage">
  <meta itemprop="name" content="${escapar(`Eixo ${n}: ${nome}`)}">
  <meta itemprop="inLanguage" content="pt-BR">
  ${n === 5 ? '<div itemprop="about" itemscope itemtype="https://schema.org/MedicalCondition" hidden><meta itemprop="name" content="Transtornos mentais"></div>' : ''}
  <nav aria-label="Trilha de navegação"><ol itemscope itemtype="https://schema.org/BreadcrumbList" style="list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.25rem .5rem;font-size:.92rem;">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="/"><span itemprop="name">Início</span></a> › <meta itemprop="position" content="1"></li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="/#temas"><span itemprop="name">Temas</span></a> › <meta itemprop="position" content="2"></li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" aria-current="page"><span itemprop="name">${escapar(nome)}</span><meta itemprop="position" content="3"><meta itemprop="item" content="https://www.drantoniofelipemedico.com.br/pilares/eixo-${n}"></li>
  </ol></nav>
  <h1>Eixo ${n}: ${escapar(nome)}</h1>
  <p>${escapar(intro)}</p>
  <p><small>Introdução em aprovação pelo Dr. Antônio Felipe.</small></p>
  <h2>Comece por aqui</h2>
  ${topoHtml}
  <h2>Todos os textos deste eixo</h2>
  <p><small>Agrupados por público. Abra cada grupo.</small></p>
${blocos || '  <p>Nenhum outro texto publicado neste eixo.</p>'}
  <p>Para casos individuais, procure a UBS, o CAPS ou um profissional de confiança. Mentorias e consultorias são educativas e institucionais: não substituem consulta nem tratamento.</p>
</main>
${RODAPE}
</body>
</html>
`;
}

function main() {
  const linhas = parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8'));
  const intros = lerIntroducoes();
  fs.mkdirSync(SAIDA, { recursive: true });
  const resumo = [];
  EIXOS_OFICIAIS.forEach((nome, i) => {
    const n = i + 1;
    const arts = linhas
      .filter((l) => (l.status || '').trim() === 'publicado')
      .filter((l) => (l.revisar || '').trim().toLowerCase() !== 'sim')
      .filter((l) => (l.eixo_nome || '').trim() === nome)
      // Relatos da Prática são independentes e não entram nas páginas de tema (ordem de 09/11/2026).
      .filter((l) => (l.publico || '').trim() !== 'Relatos da Prática')
      .map((l) => ({ slug: l.slug, titulo: l.titulo, publico: (l.publico || '').trim(), refs: Number(l.referencias) || 0 }));
    const intro = intros[n] || '';
    if (!intro) throw new Error(`introdução do eixo ${n} não encontrada`);
    fs.writeFileSync(path.join(SAIDA, `eixo-${n}.html`), pagina(n, nome, intro, arts), 'utf8');
    resumo.push({ eixo: n, total: arts.length });
  });
  console.log(JSON.stringify(resumo));
}

if (require.main === module) main();
module.exports = { pagina };
