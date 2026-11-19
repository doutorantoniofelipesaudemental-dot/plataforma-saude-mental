// Lote v4 das capas publicadas (somente leitura do banco). Saída: .tmp/capas-v4-20261118/lote/saida/<slug>/{stories,feed,site}.jpg
// Regras: relato = 1ª frase LITERAL do texto (4–12 palavras, sem reticências); artigo = sem gancho (dadosChaveVerificados
// não existe no banco); "Com narração em áudio" só com narracao.url; temas sensíveis = objeto de acolhimento (coração).
const RAIZ = require('path').resolve(__dirname, '../..');
require(require('path').join(RAIZ, 'scripts/carregarEnv')).carregarEnv();
const fs = require('fs'), path = require('path');
const sharp = require(require('path').join(RAIZ, 'node_modules/sharp'));
const db = require(require('path').join(RAIZ, 'backend/lib/db.js'));
const ASSETS = path.join(__dirname, 'assets'), OBJ = ASSETS + '/objetos', LIVRO = ASSETS + '/livro-clay.png', OUT = process.env.CAPAS_V4_SAIDA || path.join(RAIZ, '.tmp/capas-v4-lote/saida');
const VERIFICADOS = require(path.join(RAIZ, 'backend/lib/dadosChaveVerificados.json')).verificados || [];
const FUNDOS = ['1', '2', '3', '4', '5'].map((n) => ASSETS + '/s' + n + '-1.png');
const CORES = ['#1f5f7a', '#7a3b5f', '#4a5a2b', '#6b4a1f', '#2e4a6b', '#3b2f6b', '#6b2f2f', '#1d4d4a'];
const FORMATOS = [{ nome: 'stories', W: 1080, H: 1920 }, { nome: 'feed', W: 1080, H: 1350 }, { nome: 'site', W: 1200, H: 630 }];
const PORTAL = 'Portal de Saúde Mental Doutor Antônio Felipe Garabito';
const SENSIVEL = /suicid|autoles|abuso|estupr|violenc|luto|crise|morte|perda|homicid|automutil|sexual/;
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const escurece = (hex, k = 0.45) => { const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)).toString(16).padStart(2, '0')).join(''); };
function quebrar(texto, maxCar) { const out = []; let r = texto; while (r.length > maxCar) { let k = r.lastIndexOf(' ', maxCar); if (k < 1) k = maxCar; out.push(r.slice(0, k).trim()); r = r.slice(k).trim(); } if (r) out.push(r); return out; }
function fraseLiteral(conteudo) {
  const txt = String(conteudo || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  for (const f of txt.match(/[^.!?]+[.!?]/g) || []) {
    const s = f.trim(); const n = s.split(/\s+/).length;
    if (n < 4 || n > 12) continue;
    if (/[…]|\.\.\.|^[—–"“-]/.test(s) || !txt.includes(s)) continue;
    return s;
  }
  return null;
}
const objetoPara = (doc, sens) => sens ? 'heart' : (doc.tipoLote === 'relato' ? 'livro' : 'chat-bubble');
function montar(doc) {
  const tipo = doc.tipoLote;
  const sens = SENSIVEL.test(norm(`${doc.titulo} ${doc.resumo || ''} ${(doc.tags || []).join(' ')}`));
  // Relato: 1ª frase literal do texto. Artigo: frase verificada (dadosChaveVerificados.json) se tiver até 12 palavras;
  // senão, 1ª frase literal do resumo com 4–12 palavras e sem número (fallback). Sem frase, sem gancho.
  const verificado = VERIFICADOS.find((x) => x.slug === doc.slug);
  const ateDoze = (t) => !!t && t.trim().split(/s+/).length <= 12;
  const fraseResumo = (() => { const txt = String(doc.resumo || '').replace(/<[^>]+>/g, ' ').replace(/s+/g, ' ').trim(); for (const f of txt.match(/[^.!?]+[.!?]/g) || []) { const t = f.trim(); const n = t.split(/s+/).length; if (n >= 4 && n <= 12 && !/d/.test(t) && !/…|.../.test(t) && txt.includes(t)) return t; } return null; })();
  const gancho = tipo === 'relato' ? fraseLiteral(doc.conteudo) : (verificado && ateDoze(verificado.frase) ? verificado.frase : fraseResumo);
  const cor = CORES[hash(doc.categoria || '') % CORES.length];
  const fundo = FUNDOS[hash(doc.categoria || '') % FUNDOS.length];
  const min = Math.max(1, Math.round(+doc.tempoLeitura || 3));
  const comNarr = !!(doc.narracao && doc.narracao.url);
  return { slug: doc.slug, titulo: String(doc.titulo || '').toUpperCase(), gancho: gancho ? gancho.toUpperCase() : null, tipo: tipo === 'relato' ? 'RELATO LITERÁRIO' : 'ARTIGO', cor: escurece(cor), fundo, min, comNarr, sens, obj: sens ? 'heart' : (tipo === 'relato' ? 'livro' : 'chat-bubble'), objFile: sens ? OBJ + '/heart-clay.png' : (tipo === 'relato' ? LIVRO : OBJ + '/' + (tipo === 'relato' ? 'bookmark' : 'chat-bubble') + '-clay.png') };
}
async function desenhar(it, f) {
  const { W, H } = f; const vert = H > W; const pad = Math.round(W * 0.07);
  const cardW = vert ? W - 2 * pad : Math.round(W * 0.7); const cardX = Math.round((W - cardW) / 2);
  const gFont = Math.round(vert ? W * 0.034 : W * 0.024);
  const obj = Math.round(vert ? W * 0.3 : H * 0.3);
  const interno = cardW - 2 * Math.round(pad * 0.8) - Math.round(obj * 0.4);
  const cardY = vert ? Math.round(H * 0.36) : Math.round(H * 0.16); const rx = Math.round(W * 0.03);
  // Ajuste automático: reduz a fonte do título até caber no cartão (largura com fator 0.74 para maiúsculas em negrito)
  const base = Math.round(vert ? W * 0.072 : W * 0.04);
  let tFont = base, titulo = [], gancho = [], cardH = 0;
  for (const esc2 of [1, 0.92, 0.84, 0.76, 0.68, 0.6]) {
    tFont = Math.round(base * esc2);
    titulo = quebrar(it.titulo, Math.floor(interno / (tFont * 0.74)));
    gancho = it.gancho ? quebrar(it.gancho, Math.floor(interno / (gFont * 0.66))) : [];
    cardH = Math.round(tFont * 1.18 * titulo.length + (gancho.length ? gFont * 1.35 * gancho.length + tFont * 0.6 : 0) + tFont * 1.1);
    if (cardY + cardH <= H - 8 - Math.round(gFont * 4) && titulo.length <= 5) break;
  }
  const objX = Math.min(cardX + cardW - Math.round(obj * 0.72), W - obj - Math.round(W * 0.02)); const objY = cardY - Math.round(obj * 0.68);
  const eFont = Math.round(tFont * 0.36); const eW = Math.round(eFont * 0.7 * it.tipo.length + eFont * 1.6);
  const xT = cardX + Math.round(pad * 0.8);
  const linhasT = titulo.map((l, i) => `<text x="${xT}" y="${cardY + Math.round(tFont * 1.1) + i * Math.round(tFont * 1.18)}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${tFont}" fill="#faf7f2">${esc(l)}</text>`).join('');
  const yG = cardY + Math.round(tFont * 1.1) + titulo.length * Math.round(tFont * 1.18) + Math.round(tFont * 0.2);
  const linhasG = gancho.map((l, i) => `<text x="${xT}" y="${yG + i * Math.round(gFont * 1.35)}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${gFont}" fill="#faf7f2">${esc(l)}</text>`).join('');
  const cardSvg = `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${rx}" fill="${it.cor}" fill-opacity="0.96"/>`;
  const rodY = H - Math.round(H * (vert ? 0.075 : 0.08)); const rodLinha = rodY - Math.round(gFont * 1.6);
  const linha1 = (it.comNarr ? 'Com narração em áudio · ' : '') + `${it.min} min de leitura`;
  const rodTxt = vert ? [linha1, PORTAL] : [`${linha1} · ${PORTAL}`];
  const rodSvg = `<line x1="${pad}" y1="${rodLinha}" x2="${W - pad}" y2="${rodLinha}" stroke="#faf7f2" stroke-opacity="0.6" stroke-width="2"/>` + rodTxt.map((t, i) => `<text x="${pad}" y="${rodY + i * Math.round(gFont * 1.35)}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(gFont * 0.9)}" fill="#faf7f2">${esc(t)}</text>`).join('');
  const etiqSvg = `<rect x="${pad}" y="${pad}" width="${eW}" height="${Math.round(eFont * 2)}" rx="${eFont}" fill="#042426" fill-opacity="0.88"/><text x="${pad + Math.round(eFont * 0.8)}" y="${pad + Math.round(eFont * 1.4)}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${eFont}" fill="#f2d48a">${esc(it.tipo)}</text>`;
  const bg = await sharp(it.fundo).resize(W, H, { fit: 'cover' }).blur(14).toBuffer();
  const objBuf = await sharp(it.objFile).resize(obj, obj).png().toBuffer();
  const svg = (c) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${c}</svg>`);
  const soCartao = await sharp(bg).composite([{ input: svg(cardSvg) }]).removeAlpha().raw().toBuffer();
  const lums = [];
  for (let y = cardY + 4; y < cardY + cardH - 4; y += 3) for (let x = cardX + 4; x < cardX + cardW - 4; x += 3) { const i = (y * W + x) * 3; lums.push(lum(soCartao[i], soCartao[i + 1], soCartao[i + 2])); }
  lums.sort((a, b) => a - b); const L99 = lums[Math.floor(lums.length * 0.99)];
  const contraste = +((0.92 + 0.05) / (L99 + 0.05)).toFixed(2);
  // validações geométricas
  const falhas = [];
  if (cardY + cardH > H - 8) falhas.push('cartão sai da arte');
  if (contraste < 7) falhas.push(`contraste ${contraste} < 7`);
  const larg = (s, fonte) => s.length * fonte * 0.62;
  if (titulo.some((l) => larg(l, tFont) > interno + 4) || gancho.some((l) => larg(l, gFont) > interno + 4)) falhas.push('texto pode cortar na largura');
  if (/…|\.\.\./.test(it.titulo + (it.gancho || ''))) falhas.push('reticências');
  const objX1 = objX, objY1 = objY, objX2 = objX + obj, objY2 = objY + obj;
  const txtX2 = xT + Math.max(0, ...titulo.map((l) => larg(l, tFont)));
  const txtY1 = cardY + Math.round(tFont * 0.4), txtY2 = yG + Math.round(gFont * 1.35) * Math.max(gancho.length, 1);
  if (objX1 < txtX2 && objX2 > xT && objY1 < txtY2 && objY2 > txtY1 && objY1 + obj * 0.3 < cardY + Math.round(tFont * 1.1) + titulo.length * tFont * 1.18) falhas.push('objeto sobrepõe texto');
  if (tFont * (160 / W) < 6) falhas.push('título ilegível a 160 px');
  const dir = path.join(OUT, it.slug); fs.mkdirSync(dir, { recursive: true });
  const saida = path.join(dir, f.nome + '.jpg');
  await sharp(bg).composite([{ input: svg(cardSvg + linhasT + linhasG + rodSvg + etiqSvg) }, { input: objBuf, left: objX, top: objY }]).jpeg({ quality: 88 }).toFile(saida);
  await sharp(saida).resize(160).jpeg({ quality: 85 }).toFile(path.join(dir, f.nome + '-160.jpg'));
  return { slug: it.slug, formato: f.nome, contraste, falhas, sens: it.sens, gancho: !!it.gancho, narracao: it.comNarr };
}
(async () => {
  await db.connect();
  const c = db.mongoose.connection.db;
  const docs = await c.collection('artigos').find({ publicado: true }, { projection: { slug: 1, titulo: 1, resumo: 1, conteudo: 1, categoria: 1, tags: 1, tempoLeitura: 1, narracao: 1 } }).toArray();
  await db.mongoose.disconnect();
  const itens = docs.map((d) => { const cat = norm(d.categoria); const tipoLote = /relato/.test(cat) ? 'relato' : 'artigo'; return montar({ ...d, tipoLote }); });
  const medicoes = [];
  for (const it of itens) for (const f of FORMATOS) {
    try { medicoes.push(await desenhar(it, f)); }
    catch (e) { medicoes.push({ slug: it.slug, formato: f.nome, falhas: ['erro: ' + String(e.message).slice(0, 120)] }); }
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, '..'), { recursive: true }); fs.writeFileSync(path.join(OUT, '..', 'medicoes-lote.json'), JSON.stringify(medicoes, null, 0), 'utf8');
  const reprov = [...new Set(medicoes.filter((m) => m.falhas && m.falhas.length).map((m) => m.slug))];
  console.log(JSON.stringify({ artigos: itens.length, pecas: medicoes.length, comFalha: reprov.length, relatos: itens.filter((i) => i.tipo === 'RELATO LITERÁRIO').length, comGanchoLiteral: itens.filter((i) => i.gancho).length, sensiveis: itens.filter((i) => i.sens).length, comNarracao: itens.filter((i) => i.comNarr).length, contrasteMin: Math.min(...medicoes.map((m) => m.contraste || 99)) }));
})().catch((e) => { console.error('ERRO', e.stack.slice(0, 500)); process.exit(1); });
