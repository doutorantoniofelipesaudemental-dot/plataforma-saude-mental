/**
 * Arte das redes no PADRÃO EDITORIAL (ordens de 08/11/2026, 00:12 e 00:50): fundo pastel com textura de papel, fonte condensada
 * (Oswald, OFL), marca-texto no ponto principal, ícone 3D CC0 (3dicons) ligado ao tema, rodapé de identificação
 * (3 linhas nas intermediárias; bloco COMPLETO de 5 linhas na última), CVV 188 · SAMU 192 e aviso.
 * Renderiza com Playwright (gratuito) e MEDE cada lâmina para a checagem de arte (checagemArte.js), inclusive colisão entre linhas.
 * Lâmina 1080×1350.
 *   const { renderizarEditorial } = require('./arteEditorial');
 *   const { imagens, medidas, checagem } = await renderizarEditorial(laminas, { ativos: { fontes, icones } });
 * laminas: [{ tipo: 'capa'|'ponto'|'final', kicker, titulo, marcar, corpo, rotulo, fundo, icone, aviso }]
 */
const path = require('node:path');
const fs = require('node:fs');
const { checarArte } = require('./checagemArte');
const { IDENTIFICACAO_COMPLETA } = require('../conformidadeCfm');

// Cores e medidas vêm de docs/tokens.json (fonte: docs/DESIGN.md, seção 9). Valores iguais aos anteriores.
const { TOKENS } = require('./tokens');
const A = TOKENS.arte;
const PALETA = A.fundos;
const CORPO_COR = A.corpo;
// Aviso aprovado pelo Dr. Antônio (ordem de 08/11/2026, 00:50). "revisado" só com selo (ver checagemArte.avisoValido).
const AVISO_CURTO = 'Conteúdo educativo com apoio de IA, aprovado pelo Dr. Antônio Felipe (CFM 2.454/2026).';
const RODAPE_3 = ['Dr. Antônio Felipe · Médico · CRM-BA 41322', 'Especialista em Medicina de Família e Comunidade · RQE 26638', 'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)'];
const RODAPE_5 = IDENTIFICACAO_COMPLETA.split('\n');
// Banco de ícones 3D CC0 (pacote realvjy/3dicons, pasta static/). Cada ícone tem a licença registrada aqui e no LICENCAS.md.
// Regra (ordem de 08/11, item 5): nenhum ícone repetido na mesma semana. Polegar (hand.png) e livro preto proibidos para estes temas.
const BANCO_ICONES_CC0 = {
  'heart-1.png': 'CC0-1.0 (repo LICENSE)', 'heart-2.png': 'CC0-1.0 (repo LICENSE)', 'heart-3.png': 'CC0-1.0 (repo LICENSE)',
  'premium.png': 'CC0-1.0 (repo LICENSE)', 'notebook-dynamic-00.png': 'CC0-1.0 (repo LICENSE)', 'bubble.png': 'CC0-1.0 (repo LICENSE)',
  'setting.png': 'CC0-1.0 (repo LICENSE)', 'clay.png': 'CC0-1.0 (repo LICENSE)', 'colored.png': 'CC0-1.0 (repo LICENSE)', 'dynamic.png': 'CC0-1.0 (repo LICENSE)',
};
const ICONE_POR_TEMA = {
  'ansiedade-infantil-sinais': 'heart-1.png',
  'esquecimento-ou-demencia': 'notebook-dynamic-00.png',
  'cirurgia-bariatrica-saude-mental': 'heart-3.png',
  'racismo-cotidiano-saude-mental': 'premium.png',
  'o-corredor-que-parecia-nao-ter-fim': 'bubble.png',
  'assedio-sexual-trabalho-prevencao': 'setting.png',
  'dismorfia-corporal-procedimentos-esteticos': 'heart-2.png',
};
const ICONE_FINAL = 'bubble.png';
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hexDeRgb = (s) => { const m = String(s).match(/\d+/g).slice(0, 3).map(Number); return '#' + m.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(); };
const dataUri = (arquivo, mime) => `data:${mime};base64,${fs.readFileSync(arquivo).toString('base64')}`;

function marcarPrimeiraPalavra(titulo, marcar) {
  if (!marcar) return esc(titulo);
  const palavras = String(titulo).split(/\s+/);
  const i = palavras.findIndex((p) => p.length >= 4);
  const k = i >= 0 ? i : 0;
  palavras[k] = `<mark>${esc(palavras[k])}</mark>`;
  return palavras.join(' ');
}

function paginaHtml(l, ativos, fundo) {
  const completo = l.tipo === 'final';
  const rodape = completo ? RODAPE_5 : RODAPE_3;
  const rh = completo ? 250 : 190;
  const rf = completo ? 22 : 26;
  const fonteOswald = dataUri(ativos.fontes.oswald, 'font/ttf');
  const fonteRaleway = dataUri(ativos.fontes.raleway, 'font/ttf');
  const icone = dataUri(path.join(ativos.icones, l.icone || 'heart-1.png'), 'image/png');
  const corpo = completo
    ? `<p class="cvv">CVV 188 · SAMU 192</p><p class="aviso">${esc(l.aviso || AVISO_CURTO)}</p>`
    : `${l.rotulo ? `<p class="rotulo">${esc(l.rotulo)}</p>` : ''}<p class="corpo" id="b">${esc(l.corpo)}</p>`;
  const titulo = l.titulo ? `<h1 id="t">${marcarPrimeiraPalavra(l.titulo, l.marcar)}</h1>` : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:"OswaldPC";src:url("${fonteOswald}");font-weight:200 700}
@font-face{font-family:"RalewayPC";src:url("${fonteRaleway}");font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;background:${fundo}}
body{font-family:"RalewayPC",sans-serif;color:${CORPO_COR}}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:${fundo}}
.slide::before{content:"";position:absolute;inset:0;opacity:.22;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.wrap{position:absolute;left:90px;right:90px;top:170px;bottom:${rh + 40}px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}
.kicker{font-family:"OswaldPC";font-weight:500;font-size:38px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px}
#t{font-family:"OswaldPC";font-weight:700;text-transform:uppercase;line-height:${l.lhTitulo || 1.22};font-size:104px;margin-bottom:44px}
mark{background:linear-gradient(transparent 12%,${A.marcaTexto} 12%,${A.marcaTexto} 92%,transparent 92%);color:inherit;padding:0 6px}
.rotulo{font-family:"OswaldPC";font-weight:600;font-size:36px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px}
.corpo{font-size:48px;line-height:1.35;font-weight:600}
.cvv{font-family:"OswaldPC";font-weight:700;font-size:70px;text-transform:uppercase;margin-bottom:28px}
.aviso{font-size:42px;line-height:1.3;font-weight:500}
.icone{position:absolute;right:80px;top:56px;width:170px;height:170px;object-fit:contain}
.rodape{position:absolute;left:0;right:0;bottom:0;height:${rh}px;background:${A.rodape};color:${A.rodapeTexto};padding:24px 80px;display:flex;flex-direction:column;justify-content:center;border-top:8px solid ${A.rodapeFilete}}
.rodape p{font-size:${rf}px;line-height:1.3;font-weight:500}
.rodape p:first-child{font-family:"OswaldPC";font-size:${rf + 6}px;font-weight:600}
</style></head><body><section class="slide"><img class="icone" src="${icone}" alt="">
<div class="wrap">${l.kicker ? `<div class="kicker">${esc(l.kicker)}</div>` : ''}${titulo}${corpo}</div>
<footer class="rodape">${rodape.map((x) => `<p>${esc(x)}</p>`).join('')}</footer></section></body></html>`;
}

async function medirELayout(page) {
  return page.evaluate(() => {
    const w = document.querySelector('.wrap');
    const t = document.getElementById('t');
    const b = document.getElementById('b');
    const fits = () => w.scrollHeight <= w.clientHeight + 1;
    if (t) {
      t.style.fontSize = '104px';
      while (!fits() && parseFloat(t.style.fontSize) > 64) t.style.fontSize = (parseFloat(t.style.fontSize) - 2) + 'px';
    }
    let corpoPx = 40; // última lâmina: aviso com fonte fixa de 40 px
    if (b) {
      b.style.fontSize = '48px';
      while (!fits() && parseFloat(b.style.fontSize) > 40) b.style.fontSize = (parseFloat(b.style.fontSize) - 2) + 'px';
      corpoPx = parseFloat(b.style.fontSize);
    }
    // Colisão entre linhas do título: tinta (acento, cedilha, cauda) de uma linha encostando na linha vizinha.
    let colisoes = 0; const pares = [];
    if (t) {
      const linhas = [];
      const walker = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        for (let i = 0; i < node.length; i++) {
          const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
          const rc = r.getClientRects()[0];
          if (!rc) continue;
          const top = Math.round(rc.top);
          let linha = linhas.find((l) => Math.abs(l.top - top) <= 4);
          if (!linha) { linha = { top, txt: '', rect: rc }; linhas.push(linha); }
          linha.txt += node.data[i];
        }
      }
      linhas.sort((a, c) => a.top - c.top);
      const cs = getComputedStyle(t);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fm = ctx.measureText('Hg');
      const medidasLinha = linhas.map((l) => {
        const m = ctx.measureText(l.txt.trim());
        const base = l.rect.top + fm.fontBoundingBoxAscent;
        return { inkTopo: base - m.actualBoundingBoxAscent, inkBase: base + m.actualBoundingBoxDescent, txt: l.txt.trim() };
      });
      for (let k = 0; k + 1 < medidasLinha.length; k++) {
        if (medidasLinha[k].inkBase >= medidasLinha[k + 1].inkTopo) { colisoes++; pares.push(`${medidasLinha[k].txt} / ${medidasLinha[k + 1].txt}`); }
      }
    }
    const texto = (w.innerText || '').trim();
    const palavras = texto ? texto.split(/\s+/).length : 0;
    const img = document.querySelector('img.icone');
    const bodyTxt = document.body.innerText;
    return {
      fonteOk: document.fonts.check('700 40px "OswaldPC"') && document.fonts.check('400 40px "RalewayPC"'),
      iconeOk: !!(img && img.complete && img.naturalWidth > 0),
      tituloPx: t ? parseFloat(t.style.fontSize) : null,
      corpoPx,
      palavras,
      transbordou: !fits(),
      colisoes,
      pares,
      corCorpo: getComputedStyle(b || t || document.body).color,
      cvv: /CVV 188 · SAMU 192/.test(bodyTxt),
      aviso: /CFM 2\.454\/2026/.test(bodyTxt) ? (document.querySelector('.aviso') || {}).innerText || null : null,
      rodape: {
        crm: /CRM-BA 41322/.test(bodyTxt),
        rqe: /RQE 26638/.test(bodyTxt),
        assinatura3: /Atuo em Pronto Atendimento/.test(bodyTxt),
        completo: /Pós-graduação em Psiquiatria/.test(bodyTxt) && /NÃO ESPECIALISTA/.test(bodyTxt),
      },
    };
  });
}

/**
 * @returns {Promise<{imagens: Buffer[], medidas: object[], checagem: object}>}
 */
async function renderizarEditorial(laminas, { ativos } = {}) {
  const a = ativos || {};
  if (!a.icones || !a.fontes) throw new Error('ativos: informe fontes {oswald, raleway} e icones (pasta)');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const imagens = [], medidas = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    for (let i = 0; i < laminas.length; i++) {
      const l = laminas[i];
      const fundo = l.fundo || PALETA[i % PALETA.length];
      await page.setContent(paginaHtml({ ...l, icone: l.icone || ICONE_FINAL }, { fontes: a.fontes, icones: a.icones }, fundo), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const m = await medirELayout(page);
      imagens.push(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1350 } }));
      medidas.push({ n: i + 1, tipo: l.tipo, rotulo: l.rotulo || null, corpoTexto: l.corpo || null, fundo, ...m, corCorpo: hexDeRgb(m.corCorpo), final: l.tipo === 'final', rodapeCompleto: !!m.rodape.completo });
    }
  } finally {
    await browser.close();
  }
  return { imagens, medidas, checagem: checarArte(medidas) };
}

module.exports = { renderizarEditorial, PALETA, AVISO_CURTO, RODAPE_3, RODAPE_5, ICONE_POR_TEMA, ICONE_FINAL, BANCO_ICONES_CC0, paginaHtml, medirELayout };
