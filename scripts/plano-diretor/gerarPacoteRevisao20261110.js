#!/usr/bin/env node
/*
 * Gera o pacote de revisão de 10/11/2026 (ordem de 09/11, 23:15): index.html com abas Temas | Introduções | Relatos |
 * Erros corrigidos | Decisões clínicas. Só leitura: lê decisões, exportação do banco (.tmp) e as introduções.
 *   node scripts/plano-diretor/gerarPacoteRevisao20261110.js [--saida <pasta>]
 * Padrão de saída: C:/DRSAUDEMENTAL/.tmp/revisao-20261110
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { classificarRelatoSuicidio } = require('../../backend/lib/auditoriaSuicidio');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const RAIZ = path.resolve(__dirname, '..', '..');
const valor = (n) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const SAIDA_DIR = valor('--saida') || 'C:/DRSAUDEMENTAL/.tmp/revisao-20261110';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decisoes = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios', 'revisao-20261110', 'decisoes-temas.json'), 'utf8'));
const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, '.tmp', 'revisao-20261110', 'dados.json'), 'utf8'));
const introsNovas = fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INTRODUCOES-EIXOS.md'), 'utf8');
const ofertas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios', 'revisao-20261110', 'ofertas-individuais.json'), 'utf8'));
const tabelaOfertas = `<h3>Ofertas individuais (varredura só leitura, ordem 09/11 23:35)</h3>
<p>${esc(ofertas.resultado)}</p>
<div class="wrap"><table><thead><tr><th>Artigo</th><th>Tipo</th><th>Trecho atual</th><th>Proposta</th><th>Decisão</th></tr></thead><tbody>
${ofertas.itens.map((i) => `<tr><td>${esc(i.slug)}</td><td>${esc(i.tipo)}</td><td>${esc(i.atual)}</td><td>${esc(i.proposta)}</td><td>${esc(i.decisao)}</td></tr>`).join('\n')}
</tbody></table></div>
<h3>Revisto e mantido (não é oferta individual)</h3>
<ul>${ofertas.revisto_nao_e_oferta.map((r) => `<li>${esc(r.slug)} — ${esc(r.trecho)}: ${esc(r.motivo)}</li>`).join('')}</ul>
<p>${esc(ofertas.pendencia_tecnica)}</p>`;
const introsAntigas = execSync('git show origin/main:relatorios/plano-diretor/INTRODUCOES-EIXOS.md', { cwd: RAIZ, encoding: 'utf8' });

const extrairIntros = (md) => {
  const mapa = {};
  for (const l of md.split('\n')) {
    const m = l.match(/^\|\s*(\d)\s*—[^|]*\|\s*([^|]+?)\s*\|/);
    if (m) mapa[Number(m[1])] = m[2];
  }
  return mapa;
};
const antigas = extrairIntros(introsAntigas);
const novas = extrairIntros(introsNovas);
const nomesEixo = { 1: 'Infância, Adolescência, Pais & Família', 2: 'Maternidade, Puerpério & Saúde Perinatal', 3: 'Vida Adulta, Envelhecimento & Cuidados Paliativos', 4: 'Cuidar de Quem Cuida & Saúde do Trabalhador (NR-1)', 5: 'Transtornos Mentais', 6: 'Hábitos, Estilo de Vida & Sono', 7: 'Sociedade, Cultura & Existência' };

const contaPalavras = (t) => t.trim().split(/\s+/).length;
const contaFrases = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean).length;

// Relatos: triagem OMS (nível MÉDIO) + checagem ética do texto atual (sem alteração)
const relatos = dados.filter((x) => x.categoria === 'Relatos da Prática');
const medios = [];
for (const r of relatos) {
  const c = classificarRelatoSuicidio(r.conteudo);
  if (c.nivel === 'MÉDIO' || c.nivel === 'ALTO') medios.push({ slug: r.slug, nivel: c.nivel, criterios: c.criterios.join(', '), status: r.publicado ? 'publicado' : 'agendado', evidencia: c.evidencia });
}

const linhasTemas = decisoes.map((d, i) => {
  const media = d.confianca === 'média';
  const mudou = d.de !== d.para;
  return `<tr class="${media ? 'media' : ''}"><td>${i + 1}</td><td>${esc(d.titulo)}</td><td>${esc(d.de)}</td><td><strong>${esc(d.para)}</strong></td><td>${esc(d.grupo)}</td><td>${media ? '<strong>média</strong>' : 'alta'}</td><td>${mudou ? 'muda' : 'igual'}</td><td>${esc(d.motivo)}</td></tr>`;
}).join('\n');

const cardsIntros = [1, 2, 3, 4, 5, 6, 7].map((n) => {
  const nova = novas[n] || '';
  const velha = antigas[n] || '';
  const mantida = nova === velha;
  return `<article class="card"><h3>${n}. Eixo ${n} — ${esc(nomesEixo[n])}</h3>
  <p class="meta">${contaFrases(nova)} frases · ${contaPalavras(nova)} palavras · ${mantida ? '<strong>mantida (texto-base do Dr.)</strong>' : 'alterada'}</p>
  <p class="antes"><span>Antes (${contaPalavras(velha)} palavras):</span> ${esc(velha)}</p>
  <p class="depois"><span>Proposta:</span> ${esc(nova)}</p>
  <p class="meta">CFM (checagem ética, contexto portal): ${checarEticaCfm(nova, { contexto: 'portal', exigirIdentificacao: false }).ok ? 'passou' : 'REPROVADA'}</p></article>`;
}).join('\n');

const linhasMedios = medios.map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.slug)}</td><td>${esc(m.status)}</td><td>${esc(m.nivel)}</td><td>${esc(m.criterios)}</td><td>${esc(m.evidencia)}</td><td>sem alteração de texto; bloco CVV pelo template</td></tr>`).join('\n');

const totais = {
  temas: decisoes.length,
  A: decisoes.filter((d) => d.grupo === 'A').length,
  B: decisoes.filter((d) => d.grupo === 'B').length,
  C: decisoes.filter((d) => d.grupo === 'C').length,
  mudancasReais: decisoes.filter((d) => d.de !== d.para).length,
  medias: decisoes.filter((d) => d.confianca === 'média').length,
  introsAlteradas: [1, 2, 3, 4, 5, 6, 7].filter((n) => novas[n] !== antigas[n]).length,
  medios: medios.filter((m) => m.nivel === 'MÉDIO').length,
  altos: medios.filter((m) => m.nivel === 'ALTO').length,
};

const decisoesClinicas = [
  'Conferência de números (10/11, item 4): depressao-pos-parto-ansiedade-perinatal diz "cerca de uma em cada cinco gestantes" com ansiedade; Dennis 2017 indica cerca de 15% (antenatal) e 10–15% (pós-parto). NÃO alterado. Decidir o número a usar.',
  'Conferência de números (10/11, item 4): burnout-na-gestao-fatores-de-risco diz "20–30%" de sintomas de burnout sem referência no texto. NÃO alterado. Pedir fonte ou remover.',
  'Eixo 5 (Transtornos Mentais): introdução mantida. É o texto-base do Dr. Antônio; a linha de crise já está no texto.',
  '"pessoas com TEA": a ordem de 09/11 lista como erro, mas a regra de relatos (CLAUDE.md, item e) aprova "pessoas com TEA". Não alterado. Decidir qual forma vale.',
  'relato-silencio-fatal: "já tinha pensado em como faria" (sem método nem local descritos). Mantido. Confirmar.',
  'Os 23 relatos de risco MÉDIO não têm alteração de texto nesta rodada (critério d: desfecho e perguntas clínicas, não método). Confirmar a leitura.',
  `${totais.medias} decisões de tema com confiança média: revisar antes de aprovar a aba Temas.`,
  'Pontes de órfãos (126 artigos sem tema próprio) foram convertidas em tema definitivo pela proposta; itens de confiança média estão destacados na aba Temas.',
  'Os 3 fatos normativos (NR-1 na introdução do eixo 4) continuam com o link do gov.br a confirmar antes da publicação.',
];

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisão 10/11 · Portal</title>
<style>
:root{--fg:#1d2b27;--bg:#fbfaf6;--card:#fff;--ac:#2f6f63;--mut:#5b6b66;--warn:#fff4d6;--line:#e3e0d6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fg:#e9eeec;--bg:#14201d;--card:#1b2a26;--ac:#7fc2b2;--mut:#a9b8b3;--warn:#3a3218;--line:#2c3e39}}
:root[data-theme="dark"]{--fg:#e9eeec;--bg:#14201d;--card:#1b2a26;--ac:#7fc2b2;--mut:#a9b8b3;--warn:#3a3218;--line:#2c3e39}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
h1{font-size:1.4rem;margin:.2rem 0}h2{font-size:1.15rem}h3{font-size:1rem;margin:.2rem 0}
.totais{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:12px 0}
.totais div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px}
.totais b{display:block;font-size:1.3rem;color:var(--ac)}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}
.tabs label{padding:10px 12px;min-height:44px;display:flex;align-items:center;border:1px solid var(--line);border-radius:8px;cursor:pointer;background:var(--card)}
input[type=radio]{display:none}
.aba{display:none}
#t-temas:checked ~ .tabs label[for=t-temas],#t-intros:checked ~ .tabs label[for=t-intros],#t-relatos:checked ~ .tabs label[for=t-relatos],#t-erros:checked ~ .tabs label[for=t-erros],#t-decisoes:checked ~ .tabs label[for=t-decisoes]{background:var(--ac);color:#fff}
#t-temas:checked ~ .p-temas,#t-intros:checked ~ .p-intros,#t-relatos:checked ~ .p-relatos,#t-erros:checked ~ .p-erros,#t-decisoes:checked ~ .p-decisoes{display:block}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0}
.meta{color:var(--mut);font-size:.9rem;margin:.2rem 0}
.antes span{color:var(--mut)}.depois span{color:var(--ac);font-weight:600}
.wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:.88rem;min-width:640px}
th,td{border-bottom:1px solid var(--line);padding:6px;text-align:left;vertical-align:top}
tr.media td{background:var(--warn)}
.aprovar{background:var(--card);border:2px solid var(--ac);border-radius:10px;padding:12px;margin-top:16px}
ol li{margin:6px 0}
</style></head>
<body>
<h1>Revisão de 10/11/2026 · Temas, introduções e relatos</h1>
<p class="meta">Nada foi gravado no banco nem publicado. Textos e temas só entram no ar depois da sua aprovação e da aplicação pelo script.</p>
<div class="totais">
<div><b>${totais.temas}</b>artigos com tema</div>
<div><b>${totais.mudancasReais}</b>mudam de tema (leitor vê)</div>
<div><b>${totais.A}</b>só campo tema (A)</div>
<div><b>${totais.B}</b>mudam de tema (B)</div>
<div><b>${totais.C}</b>dúvidas decididas (C)</div>
<div><b>${totais.medias}</b>confiança média</div>
<div><b>${totais.introsAlteradas}</b>introduções alteradas (de 7)</div>
<div><b>0</b>relatos com texto alterado</div>
<div><b>0</b>áudios novos</div>
<div><b>${totais.medios}</b>relatos risco MÉDIO (sem alteração)</div>
<div><b>${totais.altos}</b>relatos risco ALTO</div>
<div><b>${decisoesClinicas.length}</b>decisões clínicas</div>
</div>
<input type="radio" name="aba" id="t-temas" checked><input type="radio" name="aba" id="t-intros"><input type="radio" name="aba" id="t-relatos"><input type="radio" name="aba" id="t-erros"><input type="radio" name="aba" id="t-decisoes">
<div class="tabs"><label for="t-temas">Temas (${totais.temas})</label><label for="t-intros">Introduções (7)</label><label for="t-relatos">Relatos (${medios.length})</label><label for="t-erros">Erros e ofertas (propostas)</label><label for="t-decisoes">Decisões clínicas (${decisoesClinicas.length})</label></div>

<section class="aba p-temas"><h2>Temas — regra 5 (Transtornos = conceito, diagnóstico e conduta; outros 6 = psicoeducação e cuidados; Relatos sem tema)</h2>
<p class="meta">Linhas em destaque: confiança média. Só o campo tema muda; nenhuma narração nova.</p>
<div class="wrap"><table><thead><tr><th>Nº</th><th>Título</th><th>Hoje</th><th>Proposto</th><th>Grupo</th><th>Confiança</th><th>Efeito</th><th>Motivo</th></tr></thead><tbody>
${linhasTemas}
</tbody></table></div></section>

<section class="aba p-intros"><h2>Introduções dos 7 temas (2–3 frases, acolhedora, sem promessa)</h2>
${cardsIntros}
</section>

<section class="aba p-relatos"><h2>Relatos da Prática — risco OMS (MÉDIO e ALTO)</h2>
<p class="meta">Critério d (desfecho), sem método nem local. Nenhum texto alterado: o bloco CVV 188 · SAMU 192 já aparece pelo template em todo relato sobre suicídio. Sem player: não há áudio novo.</p>
<div class="wrap"><table><thead><tr><th>Nº</th><th>Slug</th><th>Status</th><th>Nível</th><th>Critérios</th><th>Trecho (1 linha)</th><th>Ação</th></tr></thead><tbody>
${linhasMedios}
</tbody></table></div></section>

<section class="aba p-erros"><h2>Erros corrigidos</h2>
<p><strong>Nenhum erro confirmado foi corrigido nesta rodada.</strong> Verificações feitas nos 688 textos:</p>
<ol>
<li>"Antônio" sem acento: 0 ocorrências.</li>
<li>"pessoas com TEA": 0 ocorrências (ver decisão clínica 2).</li>
<li>"Dado" sem referência: 0 ocorrências na forma "Dado" (inicial maiúscula); falta conferir referências caso a caso.</li>
<li>"os suicidas": 0 ocorrências reais. Os casos encontrados eram "comportamentos suicidas", termo aceito.</li>
<li>"louco", "doido", "drogado": aparecem entre aspas, como exemplos de estigma ou fala de personagem, e não foram alterados.</li>
<li>"cometeu": 2 ocorrências fora de relatos ("cometeu o ataque", em texto de prevenção a ataques), sem relação com suicídio. Mantido.</li>
<li><strong>Não verificado nesta rodada:</strong> links quebrados (exige rede; a auditoria do portão cobre links) e grafia geral (sem revisor ortográfico automático).</li>
</ol>
${tabelaOfertas}
</section>

<section class="aba p-decisoes"><h2>Decisões clínicas (para o Dr. Antônio)</h2>
<ol>${decisoesClinicas.map((d) => `<li>${esc(d)}</li>`).join('\n')}</ol>
<div class="aprovar"><h3>Como aprovar</h3>
<p>Responda no chat: <strong>"aprovo tudo"</strong>, <strong>"aprovo tudo exceto N, N"</strong> (números da aba Temas) ou <strong>"aprovo aba X"</strong> (Temas, Introduções, Relatos).</p>
<p class="meta">A aprovação não publica nada sozinha: antes de ir ao ar, tudo passa de novo pela checagem.</p></div>
</section>
</body></html>
`;

fs.mkdirSync(SAIDA_DIR, { recursive: true });
fs.writeFileSync(path.join(SAIDA_DIR, 'index.html'), html, 'utf8');
console.log(JSON.stringify({ saida: path.join(SAIDA_DIR, 'index.html'), totais, relatosAnalisados: relatos.length }, null, 2));
