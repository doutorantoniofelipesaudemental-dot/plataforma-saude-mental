// Gera as páginas-pilar estáticas (uma por eixo) em public/pilares/ (ordem de 03/11/2026, PR empilhado no #227).
// Fontes: INVENTARIO.csv (satélites publicados, sem revisão pendente) e INTRODUCOES-EIXOS.md (introduções em aprovação).
// Sem script de terceiros. Rodapé com a identificação de 5 linhas (3ª linha nova). Uso: node scripts/plano-diretor/gerarPaginasPilar.js
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv, gerarPilares, EIXOS_OFICIAIS } = require('./pilares.js');

const RAIZ = path.resolve(__dirname, '..', '..');
const SAIDA = path.join(RAIZ, 'public', 'pilares');

function escapar(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Lê as introduções: linhas "| N — Nome | Introdução | palavras | fonte |".
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

function pagina(n, nome, intro, satelites) {
  const itens = satelites.length
    ? satelites.map((s) => `    <li><a href="/artigo/${escapar(s.slug)}">${escapar(s.titulo)}</a></li>`).join('\n')
    : '    <li>Em breve: os textos deste eixo estão em revisão.</li>';
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
  a { color:var(--verde); }
  li { margin:.4rem 0; }
  .rodape { border-top:1px solid #0002; margin-top:2rem; font-size:.92rem; }
</style>
</head>
<body>
<main>
  <p><a href="/">← Portal</a></p>
  <h1>Eixo ${n}: ${escapar(nome)}</h1>
  <p>${escapar(intro)}</p>
  <p><small>Introdução em aprovação pelo Dr. Antônio Felipe.</small></p>
  <h2>Textos deste eixo</h2>
  <ul>
${itens}
  </ul>
  <p>Para casos individuais, procure a UBS, o CAPS ou um profissional de confiança. Mentorias e consultorias são educativas e institucionais: não substituem consulta nem tratamento.</p>
</main>
${RODAPE}
</body>
</html>
`;
}

function main() {
  const linhas = parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8'));
  const porEixo = gerarPilares(linhas);
  const intros = lerIntroducoes();
  fs.mkdirSync(SAIDA, { recursive: true });
  const resumo = [];
  EIXOS_OFICIAIS.forEach((nome, i) => {
    const n = i + 1;
    const satelites = porEixo[nome] || [];
    const intro = intros[n] || '';
    if (!intro) throw new Error(`introdução do eixo ${n} não encontrada`);
    fs.writeFileSync(path.join(SAIDA, `eixo-${n}.html`), pagina(n, nome, intro, satelites), 'utf8');
    resumo.push({ eixo: n, satelites: satelites.length });
  });
  console.log(JSON.stringify(resumo));
}

if (require.main === module) main();
module.exports = { pagina, lerIntroducoes };
