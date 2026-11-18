// Gera as páginas do protótipo a partir de textos LOCAIS (somente leitura). Textos copiados, nunca reescritos.
// Fontes: public/pilares/eixo-*.html e public/mentoria.html (conteúdo do <main>); backups/ (artigos publicados, HTML);
// capas em .tmp/capas-artigos-20261117/saida (amostra copiada para assets/capas). Sem requisições a /api ou /artigo.
const fs = require('fs'), path = require('path');
const R = 'C:/DRSAUDEMENTAL';
const OUT = __dirname;
const SERIES = { 'infancia-familia': 'Infância & Família', 'maternidade-perinatal': 'Maternidade & Perinatal', 'vida-adulta-envelhecimento': 'Vida Adulta & Envelhecimento', 'cuidar-de-quem-cuida': 'Cuidar de Quem Cuida (NR-1)', 'transtornos-mentais': 'Transtornos Mentais', 'habitos-sono': 'Hábitos & Sono', 'sociedade-cultura': 'Sociedade & Cultura', 'relatos': 'Relatos da Prática' };
const inv = JSON.parse(fs.readFileSync(`${R}/.tmp/capas-artigos-20261117/inventario.json`, 'utf8'));
const artigos = JSON.parse(fs.readFileSync(`${R}/backups/importacao-completa-20261026-2224/artigos.json`, 'utf8'));
const pub = new Map(artigos.filter(a => a.publicado === true).map(a => [a.slug, a]));
const lista = inv.filter(i => pub.has(i.slug)).map(i => ({ ...pub.get(i.slug), serie: i.serie }));
const amostra = [];
for (const s of Object.keys(SERIES)) { const x = lista.find(l => l.serie === s); if (x) amostra.push(x); }
const capas = new Map(inv.map(i => [i.slug, `${R}/.tmp/capas-artigos-20261117/saida/${i.slug}/capa.jpg`]));
fs.mkdirSync(path.join(OUT, 'assets/capas'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'artigos'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'pilares'), { recursive: true });
for (const a of amostra) fs.copyFileSync(capas.get(a.slug), path.join(OUT, 'assets/capas', a.slug + '.jpg'));
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const main = html => { const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i); return m ? m[1] : ''; };
const IDENT = '<p>Dr. Antônio Felipe — Médico — CRM-BA 41322</p><p>Especialista em Medicina de Família e Comunidade — RQE 26638</p><p>Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)</p><p>Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho</p><p>NÃO ESPECIALISTA</p>';
const HEAD = (titulo, desc) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)} · Portal de Saúde Mental Doutor Antônio Felipe Garabito</title><meta name="description" content="${esc(desc)}">`;
const CABECALHO = base => `<a class="skip" href="#conteudo">Pular para o conteúdo</a><header><div class="container"><a href="${base}index.html">Saúde Mental · Doutor Antônio Felipe</a><a href="${base}blog.html">Artigos</a><a href="${base}mentoria.html">Mentoria, consultoria e formação</a></div></header>`;
const AJUDA = () => '<details class="ajuda" id="ajuda"><summary>Preciso de ajuda agora</summary><div class="painel"><p><strong>Em crise, procure ajuda agora.</strong></p><a href="tel:188">CVV 188 (24 h, gratuito)</a><a href="tel:192">SAMU 192 (emergência)</a><p>Você também pode procurar a sua Unidade Básica de Saúde (UBS) ou o CAPS da sua cidade.</p></div></details>';
const RODAPE = base => `<footer class="rodape"><div class="container">${IDENT}</div></footer><script src="${base}assets/proto.js" defer></script>`;
function pagina(base, titulo, desc, corpo, extraHead = '') {
  return `${HEAD(titulo, desc)}<link rel="stylesheet" href="${base}assets/proto.css">${extraHead}</head><body>${CABECALHO(base)}<main id="conteudo" class="container">${corpo}</main>${AJUDA()}${RODAPE(base)}</body></html>`;
}
// 1. Pilares e mentoria: <main> copiado verbatim das páginas publicadas
const pilaresInfo = [];
for (let n = 1; n <= 7; n++) {
  const src = fs.readFileSync(`${R}/public/pilares/eixo-${n}.html`, 'utf8');
  const h1 = (src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, `Eixo ${n}`])[1].replace(/<[^>]+>/g, '').trim();
  fs.writeFileSync(path.join(OUT, `pilares/eixo-${n}.html`), pagina('../', h1, `Pilar ${n} do Portal.`, main(src)), 'utf8');
  pilaresInfo.push({ url: `pilares/eixo-${n}.html`, titulo: h1 });
}
{
  const src = fs.readFileSync(`${R}/public/mentoria.html`, 'utf8');
  const h1 = (src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, 'Mentoria'])[1].replace(/<[^>]+>/g, '').trim();
  fs.writeFileSync(path.join(OUT, 'mentoria.html'), pagina('', h1, 'Mentoria, consultoria e formação. Contato só por e-mail.', main(src)), 'utf8');
}
// 2. Artigos de amostra: HTML do backup verbatim
const artigosInfo = [];
for (const a of amostra) {
  const capa = `assets/capas/${a.slug}.jpg`;
  const tempo = a.tempoLeitura ? ' · Tempo de leitura: ' + esc(a.tempoLeitura) : '';
  const corpo = `<article class="artigo"><nav aria-label="Caminho" style="font-size:.95rem;padding-top:12px"><a href="../index.html">Início</a> › <a href="../blog.html">Artigos</a> › ${esc(SERIES[a.serie] || a.categoria)}</nav><h1>${esc(a.titulo)}</h1><p class="meta">Escrito e revisado por Dr. Antônio Felipe${tempo}</p><img src="../${capa}" alt="Capa do artigo: ${esc(a.titulo)}" width="1200" height="630" style="width:100%;height:auto;border-radius:12px"><div class="ferramentas" role="group" aria-label="Conforto de leitura"><button type="button" class="fmais" aria-label="Aumentar a letra">A+</button><button type="button" class="fmenos" aria-label="Diminuir a letra">A−</button><button type="button" class="escuro" aria-pressed="false">Modo escuro</button><button type="button" class="calmo" aria-pressed="false">Modo calmo</button></div><p style="font-size:.9rem">Narração gerada por inteligência artificial, sob responsabilidade do Dr. Antônio Felipe. O áudio só carrega ao clicar.</p>${a.audioNarracaoUrl ? `<button type="button" class="ouvir botao" data-audio="${esc(a.audioNarracaoUrl)}">Ouvir este artigo</button><div class="area-audio"></div>` : ''}<div class="texto-grande corpo">${a.conteudo}</div></article>`;
  const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'MedicalWebPage', name: a.titulo, inLanguage: 'pt-BR', reviewedBy: { '@type': 'Person', name: 'Dr. Antônio Felipe', jobTitle: 'Médico', identifier: 'CRM-BA 41322' } }) + '</script>';
  fs.writeFileSync(path.join(OUT, `artigos/${a.slug}.html`), pagina('../', a.titulo, a.resumo || a.titulo, corpo, ld), 'utf8');
  artigosInfo.push({ url: `artigos/${a.slug}.html`, titulo: a.titulo, serie: a.serie });
}
// 3. Blog: os 317 publicados (títulos do backup); link só quando a página existe
const naAmostra = new Set(amostra.map(m => m.slug));
const itens = lista.map(a => {
  const existe = naAmostra.has(a.slug);
  const capa = existe ? `<img src="assets/capas/${a.slug}.jpg" alt="" width="1200" height="630" loading="lazy">` : '<div class="sem-capa" style="background:#185d58;color:#fff;padding:24px;border-radius:12px">Capa disponível no site</div>';
  const tit = existe ? `<a href="artigos/${a.slug}.html">${esc(a.titulo)}</a>` : `<span>${esc(a.titulo)}</span>`;
  return `<li data-serie="${a.serie}" class="card-artigo">${capa}<h2 style="font-size:1.1rem">${tit}</h2><p class="meta">${esc(SERIES[a.serie] || a.categoria)}</p></li>`;
}).join('\n');
const filtros = Object.entries(SERIES).map(([k, v]) => `<button type="button" data-filtro="${k}" class="filtro">${esc(v)}</button>`).join(' ');
fs.writeFileSync(path.join(OUT, 'blog.html'), pagina('', 'Artigos', 'Lista de artigos publicados, com filtros por tema.', `<h1>Artigos</h1><p>Filtre por tema. Os textos completos desta amostra estão abertos; os demais ficam no site.</p><div class="filtros" role="group" aria-label="Temas"><button type="button" data-filtro="todos" class="filtro">Todos</button> ${filtros}</div><ul class="grade-artigos" style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${itens}</ul>`), 'utf8');
// 4. Home: troca o bloco de vídeo (sem vídeo publicado no YouTube)
const homePath = path.join(OUT, 'index.html');
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace(/<div class="video">[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/, '<div class="video"><div class="cartao"><p>Vídeo de boas-vindas: disponível após aprovação. Narração gerada por inteligência artificial, sob responsabilidade do Dr. Antônio Felipe.</p></div></div>');
fs.writeFileSync(homePath, home, 'utf8');
// 5. Índice local de busca (só páginas que existem)
const indice = [{ titulo: 'Início', url: 'index.html' }, { titulo: 'Artigos', url: 'blog.html' }, { titulo: 'Mentoria, consultoria e formação', url: 'mentoria.html' }, ...pilaresInfo, ...artigosInfo];
fs.writeFileSync(path.join(OUT, 'assets/indice.json'), JSON.stringify(indice, null, 1), 'utf8');
console.log(JSON.stringify({ pilares: pilaresInfo.length, artigosAmostra: artigosInfo.length, publicadosNoBlog: lista.length, indice: indice.length, videoTrocado: home.includes('disponível após aprovação') }));
