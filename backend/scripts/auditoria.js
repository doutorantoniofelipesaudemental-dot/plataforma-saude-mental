/**
 * Auditoria geral (Parte 0 do PROMPT-MESTRE). SÓ LEITURA por padrão.
 *   npm run auditoria                 relatório em relatorios/auditoria-AAAAMMDD-HHMM.md
 *   npm run auditoria -- --corrigir   aplica só as correções automáticas permitidas (acento em "Antônio" nos MDX)
 *   npm run auditoria -- --sem-mongo  não consulta o MongoDB
 *   npm run auditoria -- --falhar     código de saída 1 se houver falha automática
 *
 * Checagens por texto (MDX do app + coleção `artigos` do MongoDB, somente leitura):
 *   técnica (marcadores, encoding, referências, identificação), ética (identificação do autor,
 *   CVV 188 em tema sensível, termos vetados/estigma) e humanizada (heurística de culpa/medo).
 * A checagem científica (a referência sustenta a afirmação?) NÃO é automatizável: o relatório
 * lista a amostra de 10% (mais antigos primeiro) para conferência.
 * Checagem de segurança: segredos em arquivos rastreados, .env no .gitignore, NEXT_PUBLIC_*.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const PASTAS = [path.join(APP, 'src/content/artigos'), path.join(APP, 'content/blog')];
const args = new Set(process.argv.slice(2));

const { checarTexto } = require('../lib/auditoriaTexto');
const { renderizarArtigoHtml } = require('../lib/renderizarArtigo');

/** Página RENDERIZADA (texto visível, sem <head>/<script>/<style>): identificação exatamente 1 vez e a TCC no rodapé. */
function checarRenderizada(doc) {
  const falhas = [];
  let html;
  try { html = renderizarArtigoHtml(doc); } catch (e) { return [{ grupo: 'renderizada', msg: `falha ao renderizar: ${e.message.slice(0, 80)}` }]; }
  const visivel = html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  for (const [re, nome] of [[/CRM-BA 41322/g, 'CRM-BA 41322'], [/RQE 26638/g, 'RQE 26638'], [/N[ÃA]O ESPECIALISTA/g, 'NÃO ESPECIALISTA']]) {
    const n = (visivel.match(re) || []).length;
    if (n !== 1) falhas.push({ grupo: 'renderizada', msg: `página renderizada com "${nome}" ${n}x (esperado 1)` });
  }
  if (!/Terapia Cognitivo-Comportamental/.test(visivel)) falhas.push({ grupo: 'renderizada', msg: 'página renderizada sem a TCC no rodapé' });
  return falhas;
}

function lerMdx() {
  const itens = [];
  for (const dir of PASTAS) {
    if (!fs.existsSync(dir)) continue;
    for (const nome of fs.readdirSync(dir).filter((n) => /\.mdx?$/.test(n))) {
      const arquivo = path.join(dir, nome);
      const corpo = fs.readFileSync(arquivo, 'utf8');
      const m = (k) => corpo.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`))?.[1];
      itens.push({ origem: 'mdx', arquivo, slug: nome.replace(/\.mdx?$/, ''), titulo: m('titulo'), resumo: m('resumo'), tempoLeitura: corpo.match(/tempoLeitura:\s*(\d+)/)?.[1], corpo, publicadoEm: m('publicadoEm') });
    }
  }
  return itens;
}

async function lerMongo() {
  if (args.has('--sem-mongo')) return { itens: [], nota: 'MongoDB ignorado (--sem-mongo)' };
  if (!process.env.MONGODB_URI) return { itens: [], nota: 'MONGODB_URI ausente: MongoDB não auditado' };
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 8000 });
    const docs = await mongoose.connection.db.collection('artigos').find({}).toArray();
    let cvvCorrigidos = 0;
    if (args.has('--corrigir')) {
      // Única escrita no banco: acrescenta a caixa CVV 188 · SAMU 192 onde falta (forma, não sentido).
      for (const d of docs) {
        const o = { origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: String(d.conteudo || '') };
        if (!checarTexto(o).some((f) => /sem CVV 188/.test(f.msg))) continue;
        d.conteudo = inserirAntes(o.corpo, [/<h2[^>]*>\s*Refer[êe]ncias/i, /<p class="identificacao-medico"/], CVV_HTML);
        await mongoose.connection.db.collection('artigos').updateOne({ _id: d._id }, { $set: { conteudo: d.conteudo, atualizadoEm: new Date() } });
        cvvCorrigidos += 1;
      }
    }
    await mongoose.disconnect();
    return { cvvCorrigidos, docs, itens: docs.map((d) => ({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: String(d.conteudo || ''), publicadoEm: d.criadoEm })), nota: `MongoDB: ${docs.length} documento(s) lidos${args.has('--corrigir') ? ` (${cvvCorrigidos} corrigido(s))` : ' (somente leitura)'}` };
  } catch (e) {
    return { itens: [], nota: `MongoDB inacessível (${e.message.slice(0, 90)}): provável IP não liberado no Atlas` };
  }
}

function auditarSeguranca() {
  const falhas = [];
  const gi = fs.existsSync(path.join(RAIZ, '.gitignore')) ? fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8') : '';
  if (!/^\.env/m.test(gi)) falhas.push('.env não está no .gitignore');
  if (!/client_secret/.test(gi)) falhas.push('client_secret.json não está no .gitignore');
  let rastreados = [];
  try { rastreados = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean); } catch { falhas.push('git ls-files indisponível'); }
  if (rastreados.some((f) => /(^|\/)\.env(\.|$)/.test(f) && !/\.example$/.test(f))) falhas.push('arquivo .env rastreado pelo git');
  const RE_SEGREDO = /(AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{36}|EAA[A-Za-z0-9]{60,}|mongodb(?:\+srv)?:\/\/[^\s'"<]+:[^\s'"<@]+@)/;
  for (const f of rastreados.filter((x) => /\.(js|mjs|json|md|mdx|html|py|ps1|yaml|yml)$/.test(x) && !/package-lock|node_modules/.test(x))) {
    try {
      const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
      const achado = t.match(new RegExp(RE_SEGREDO.source, 'g'))?.filter((m) => !/usuario|user|senha|pass|example|exemplo|<|fake|teste/i.test(m));
      if (achado?.length) falhas.push(`possível segredo em ${f}`);
      if (/NEXT_PUBLIC_\w*(KEY|TOKEN|SECRET|PASSWORD)/i.test(t)) falhas.push(`variável pública sensível (NEXT_PUBLIC_*) em ${f}`);
    } catch { /* binário ou removido */ }
  }
  return falhas;
}

// Correções AUTOMÁTICAS permitidas (forma, nunca sentido): acento do autor e caixa CVV 188 · SAMU 192. (O bloco de identificação NÃO é mais inserido no corpo: vive só no rodapé do template.)
const CVV_HTML = '<div class="callout"><strong>Precisa de apoio agora?</strong> CVV — 188 (ligação gratuita, 24h, também por chat em cvv.org.br) · SAMU — 192 em emergências · A UBS e o CAPS da sua cidade acolhem e encaminham.</div>';
const CVV_MDX = "<Callout titulo={'Se você precisar de apoio agora:'}>\nCVV — 188 (ligação gratuita, 24h, também por chat em cvv.org.br) · SAMU — 192 em emergências.\n</Callout>";

function inserirAntes(texto, marcadores, bloco) {
  for (const re of marcadores) {
    const m = texto.match(re);
    if (m) return `${texto.slice(0, m.index)}${bloco}\n\n${texto.slice(m.index)}`;
  }
  return `${texto.replace(/\s+$/, '')}\n\n${bloco}\n`;
}

function corrigirMdx(itens) {
  const cont = { acento: 0, cvv: 0, ident: 0 };
  for (const it of itens.filter((i) => i.origem === 'mdx')) {
    let t = it.corpo;
    const falhas = checarTexto(it).map((f) => f.msg);
    // "Antonio Felipe Garabito Jr." é o nome do filho (dedicatória): grafia preservada, nunca corrigir.
    if (/Antonio Felipe(?! Garabito Jr\.)/.test(t)) { t = t.replace(/Antonio Felipe(?! Garabito Jr\.)/g, 'Antônio Felipe'); cont.acento += 1; }
    if (falhas.some((m) => /sem CVV 188/.test(m))) { t = inserirAntes(t, [/<h2>\s*Refer[êe]ncias/i, /<p className="identificacao-medico"/, /<CallToTool/], CVV_MDX); cont.cvv += 1; }
    if (t !== it.corpo) fs.writeFileSync(it.arquivo, t, 'utf8');
  }
  return cont;
}

(async () => {
  const agora = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const stamp = `${agora.getFullYear()}${p2(agora.getMonth() + 1)}${p2(agora.getDate())}-${p2(agora.getHours())}${p2(agora.getMinutes())}`;
  let itens = lerMdx();
  const mongo = await lerMongo();
  let corrigidos = null;
  if (args.has('--corrigir')) { corrigidos = { ...corrigirMdx(itens), cvvBanco: mongo.cvvCorrigidos || 0 }; itens = lerMdx(); }
  const todos = [...itens, ...mongo.itens];
  const porSlug = new Map((mongo.docs || []).map((d) => [d.slug, d]));
  const resultados = todos.map((it) => ({ it, falhas: [...checarTexto(it), ...(it.origem === 'mongo' && porSlug.get(it.slug) ? checarRenderizada(porSlug.get(it.slug)) : [])] }));
  const comFalha = resultados.filter((r) => r.falhas.length);
  const porMsg = new Map();
  for (const r of comFalha) for (const f of r.falhas) { const k = `${f.grupo} · ${f.msg.replace(/\d+x|\(\d+\)|"[^"]*"/g, '…')}`; porMsg.set(k, [...(porMsg.get(k) || []), `${r.it.origem}:${r.it.slug}`]); }
  const seg = auditarSeguranca();
  const amostra = [...todos].sort((a, b) => String(a.publicadoEm).localeCompare(String(b.publicadoEm))).slice(0, Math.max(1, Math.ceil(todos.length * 0.1)));

  const L = [];
  L.push(`# Auditoria geral — ${agora.toISOString()}`, '', `Modo: ${args.has('--corrigir') ? 'CORRIGIR' : 'somente leitura'} · textos auditados: ${todos.length} (${itens.length} MDX + ${mongo.itens.length} MongoDB) · com falha: ${comFalha.length}`, `Fontes: ${mongo.nota}`);
  if (corrigidos) L.push(`Correções automáticas aplicadas: acento em ${corrigidos.acento} MDX · caixa CVV/SAMU em ${corrigidos.cvv} MDX e ${corrigidos.cvvBanco} documento(s) do MongoDB · bloco de identificação em ${corrigidos.ident} MDX.`);
  L.push('', '## Resumo das falhas (por tipo)', '');
  if (!porMsg.size) L.push('Nenhuma falha automática.');
  for (const [k, v] of [...porMsg].sort((a, b) => b[1].length - a[1].length)) L.push(`- **${k}**: ${v.length} texto(s) — ${v.slice(0, 6).join(', ')}${v.length > 6 ? ', …' : ''}`);
  L.push('', '## Segurança', '', ...(seg.length ? seg.map((s) => `- ${s}`) : ['Sem pendências detectadas (git rastreado, .gitignore, NEXT_PUBLIC_*).']), '- Não verificável aqui: IP liberado no Atlas (sem `0.0.0.0/0`) e variáveis da Vercel — conferir nos painéis.');
  L.push('', '## Checagem científica (manual) — amostra de 10%', '', 'Conferir se cada referência sustenta o dado citado e datar normas/estatísticas com mais de 2 anos:', '', ...amostra.map((a) => `- ${a.origem}:${a.slug}`));
  L.push('', '## Não coberto por este comando', '', '- `npm run build`, links/DOI 404, alt de imagens, `lastmod` do sitemap e conferência visual mobile/desktop (rodar nas Partes 1–2).', '', '## Detalhe por texto', '');
  for (const r of comFalha) L.push(`- **${r.it.origem}:${r.it.slug}** — ${r.falhas.map((f) => `[${f.grupo}] ${f.msg}`).join(' | ')}`);

  const dir = path.join(RAIZ, 'relatorios');
  fs.mkdirSync(dir, { recursive: true });
  const saida = path.join(dir, `auditoria-${stamp}.md`);
  fs.writeFileSync(saida, L.join('\n') + '\n', 'utf8');
  console.log(L.slice(0, 4).join('\n'));
  for (const [k, v] of [...porMsg].sort((a, b) => b[1].length - a[1].length).slice(0, 15)) console.log(`  ${String(v.length).padStart(3)}  ${k}`);
  console.log(`  segurança: ${seg.length} pendência(s)\nRelatório: ${saida}`);
  if (args.has('--falhar') && (comFalha.length || seg.length)) process.exit(1);
})().catch((e) => { console.error(e); process.exit(2); });
