/**
 * Arte das redes no PADRÃO EDITORIAL (ordem de 08/11/2026, 00:12): fundo pastel com textura de papel, fonte condensada
 * (Oswald, OFL), faixa de marca-texto no ponto principal, ícone 3D (3dicons, CC0), rodapé de identificação,
 * "CVV 188 · SAMU 192" e aviso curto. Renderiza com Playwright (gratuito) e MEDE cada lâmina para a checagem de arte
 * (backend/lib/redesV2/checagemArte.js). Lâmina 1080×1350.
 *   const { renderizarEditorial } = require('./arteEditorial');
 *   const { imagens, medidas } = await renderizarEditorial(laminas, { ativos: { fontes, icones } });
 * laminas: [{ tipo: 'capa'|'ponto'|'final', kicker, titulo, marcar, corpo, fundo, icone, cvv, aviso }]
 */
const path = require('node:path');
const { checarArte } = require('./checagemArte');

const PALETA = ['#F7F1E3', '#ECEEF0', '#DDEFD9', '#CFF1E4', '#FBE0CF'];
const CORPO_COR = '#1B1B1B';
const AVISO_CURTO = 'Conteúdo educativo com apoio de IA, revisado pelo Dr. Antônio Felipe (CFM 2.454/2026).';
const RODAPE = ['Dr. Antônio Felipe · Médico · CRM-BA 41322', 'Especialista em Medicina de Família e Comunidade · RQE 26638', 'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)'];
const ICONES_PADRAO = ['heart-1.png', 'heart-2.png', 'premium.png', 'hand.png', 'setting.png', 'notebook-dynamic-00.png', 'bubble.png'];
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hexDeRgb = (s) => { const m = String(s).match(/\d+/g).slice(0, 3).map(Number); return '#' + m.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(); };

function marcarPrimeiraPalavra(titulo, marcar) {
  if (!marcar) return esc(titulo);
  const palavras = String(titulo).split(/\s+/);
  const i = palavras.findIndex((p) => p.length >= 4);
  const k = i >= 0 ? i : 0;
  palavras[k] = `<mark>${esc(palavras[k])}</mark>`;
  return palavras.join(' ');
}

// setContent não tem origem de arquivo: fontes e ícones entram como data URI (embutidos na página)
const dataUri = (arquivo, mime) => `data:${mime};base64,${require('node:fs').readFileSync(arquivo).toString('base64')}`;

function paginaHtml(l, ativos, fundo) {
  const fonteOswald = dataUri(ativos.fontes.oswald, 'font/ttf');
  const fonteRaleway = dataUri(ativos.fontes.raleway, 'font/ttf');
  const icone = dataUri(path.join(ativos.icones, l.icone || 'heart-1.png'), 'image/png');
  const corpo = l.tipo === 'final'
    ? `<p class="cvv">CVV 188 · SAMU 192</p><p class="aviso">${esc(l.aviso || AVISO_CURTO)}</p>`
    : `<p class="corpo" id="b">${esc(l.corpo)}</p>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:"OswaldPC";src:url("${fonteOswald}");font-weight:200 700}
@font-face{font-family:"RalewayPC";src:url("${fonteRaleway}");font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;background:${fundo}}
body{font-family:"RalewayPC",sans-serif;color:${CORPO_COR}}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:${fundo}}
.slide::before{content:"";position:absolute;inset:0;opacity:.22;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.wrap{position:absolute;left:80px;right:80px;top:230px;height:880px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}
.kicker{font-family:"OswaldPC";font-weight:500;font-size:36px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px}
#t{font-family:"OswaldPC";font-weight:700;text-transform:uppercase;line-height:1.16;font-size:96px;margin-bottom:40px}
mark{background:linear-gradient(transparent 12%,#FFE46B 12%,#FFE46B 92%,transparent 92%);color:inherit;padding:0 6px}
.corpo{font-size:44px;line-height:1.35;font-weight:600}
.cvv{font-family:"OswaldPC";font-weight:700;font-size:64px;text-transform:uppercase;margin-bottom:24px}
.aviso{font-size:40px;line-height:1.3;font-weight:500}
.icone{position:absolute;right:80px;top:50px;width:150px;height:150px;object-fit:contain}
.rodape{position:absolute;left:0;right:0;bottom:0;height:190px;background:#1B1B1B;color:#FFFFFF;padding:26px 80px;display:flex;flex-direction:column;justify-content:center;border-top:8px solid #C9A227}
.rodape p{font-size:26px;line-height:1.35;font-weight:500}
.rodape p:first-child{font-family:"OswaldPC";font-size:32px;font-weight:600}
</style></head><body><section class="slide"><img class="icone" src="${icone}" alt="">
<div class="wrap">${l.kicker ? `<div class="kicker">${esc(l.kicker)}</div>` : ''}<h1 id="t">${marcarPrimeiraPalavra(l.titulo, l.marcar)}</h1>${corpo}</div>
<footer class="rodape">${RODAPE.map((x) => `<p>${esc(x)}</p>`).join('')}</footer></section></body></html>`;
}

async function medirELayout(page) {
  return page.evaluate(() => {
    const w = document.querySelector('.wrap');
    const t = document.getElementById('t');
    const b = document.getElementById('b');
    const fits = () => w.scrollHeight <= w.clientHeight + 1;
    t.style.fontSize = '96px';
    while (!fits() && parseFloat(t.style.fontSize) > 64) t.style.fontSize = (parseFloat(t.style.fontSize) - 2) + 'px';
    let corpoPx = 40; // última lâmina: aviso com fonte fixa de 40 px
    if (b) {
      b.style.fontSize = '44px';
      while (!fits() && parseFloat(b.style.fontSize) > 40) b.style.fontSize = (parseFloat(b.style.fontSize) - 2) + 'px';
      corpoPx = parseFloat(b.style.fontSize);
    }
    const texto = (w.innerText || '').trim();
    const palavras = texto ? texto.split(/\s+/).length : 0;
    const img = document.querySelector('img.icone');
    return {
      fonteOk: document.fonts.check('700 40px "OswaldPC"') && document.fonts.check('400 40px "RalewayPC"'),
      iconeOk: !!(img && img.complete && img.naturalWidth > 0),
      tituloPx: parseFloat(t.style.fontSize),
      corpoPx,
      palavras,
      transbordou: !fits(),
      corCorpo: getComputedStyle(b || t).color,
      cvv: /CVV 188 · SAMU 192/.test(document.body.innerText),
      aviso: /CFM 2\.454\/2026/.test(document.body.innerText),
      rodape: { crm: /CRM-BA 41322/.test(document.body.innerText), rqe: /RQE 26638/.test(document.body.innerText), assinatura3: /Atuo em Pronto Atendimento/.test(document.body.innerText) },
    };
  });
}

/**
 * @returns {Promise<{imagens: Buffer[], medidas: object[], checagem: object}>}
 */
async function renderizarEditorial(laminas, { ativos } = {}) {
  const a = ativos || {};
  const dirIcones = a.icones;
  const fontes = a.fontes;
  if (!dirIcones || !fontes) throw new Error('ativos: informe fontes {oswald, raleway} e icones (pasta)');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const imagens = [], medidas = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    for (let i = 0; i < laminas.length; i++) {
      const l = laminas[i];
      const fundo = l.fundo || PALETA[i % PALETA.length];
      await page.setContent(paginaHtml({ ...l, icone: l.icone || ICONES_PADRAO[i % ICONES_PADRAO.length] }, { fontes, icones: dirIcones }, fundo), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const m = await medirELayout(page);
      const hex = hexDeRgb(m.corCorpo);
      imagens.push(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1350 } }));
      medidas.push({ n: i + 1, tipo: l.tipo, fundo, ...m, corCorpo: hex, final: l.tipo === 'final' });
    }
  } finally {
    await browser.close();
  }
  return { imagens, medidas, checagem: checarArte(medidas) };
}

module.exports = { renderizarEditorial, PALETA, AVISO_CURTO, RODAPE, paginaHtml };
