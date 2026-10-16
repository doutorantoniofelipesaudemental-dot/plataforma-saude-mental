/**
 * LinkedIn (profissionais de saúde, gestores, RH e empresas): posts de texto, carrosséis em PDF e artigos mensais, a partir dos textos do site.
 * Não reescreve conteúdo clínico: extrai o gancho, os pontos práticos de uma lista do próprio texto, a referência e o link. 3 posts/semana
 * (seg, qua, sex, 19:30 Bahia) de 27/10/2026 a 31/01/2027: 60% educativo, 25% trabalho/NR-1, 15% bastidores da prática (sem pacientes).
 *   node --env-file=.env scripts/linkedin/gerarConteudo.js            plano e amostra (dry-run: nada é gravado)
 *   node --env-file=.env scripts/linkedin/gerarConteudo.js --aplicar   grava relatorios/linkedin/fila.json, fila-manual/ e a coleção linkedin_fila
 * Nunca: caso identificável, promessa, depoimento, antes e depois. O post da /mentoria é PROPOSTA e não entra na fila.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mongoose = require('mongoose');
const L = require('../youtube/lib');
const { BASTIDORES } = require('./bastidores');
const { checarPost } = require('../../backend/lib/linkedinChecagem');

const aplicar = process.argv.includes('--aplicar');
const RAIZ = L.RAIZ, REL = path.join(RAIZ, 'relatorios', 'linkedin');
const INICIO = new Date('2026-10-27T03:00:00Z'), FIM = new Date('2027-02-01T02:59:59Z');
const DIAS = { 1: 'seg', 3: 'qua', 5: 'sex' };

const slots = () => {
  const out = [];
  for (let d = new Date(INICIO); d <= FIM; d = new Date(d.getTime() + 864e5)) {
    const l = new Date(d.getTime() - 3 * 3600e3);
    if (DIAS[l.getUTCDay()]) out.push(new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate(), 19 + 3, 30, 0)));
  }
  return out;
};
const segundaDe = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); const dow = (l.getUTCDay() + 6) % 7; return new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - dow)).toISOString().slice(0, 10); };
const dia = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); return `${String(l.getUTCDate()).padStart(2, '0')}-${String(l.getUTCMonth() + 1).padStart(2, '0')}`; };

// ---------- extração ----------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fimFrase = (s) => s.replace(/[;,:]\s*$/, '').replace(/\s+$/, '').replace(/([^.!?…])$/, '$1.');
function corpoSemRefs(html) { return String(html).replace(/<h2[^>]*>\s*Refer[eê]ncias[\s\S]*$/i, ''); }
function gancho(a) {
  const p = (String(a.conteudo).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
  const t = L.semTags(p || a.resumo || a.titulo);
  const fr = t.split(/(?<=[.!?])\s+/)[0] || t;
  return fr.length > 260 ? L.semTags(a.resumo || a.titulo) : fr;
}
function segundaFrase(a) {
  const p = (String(a.conteudo).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
  const fr = L.semTags(p || '').split(/(?<=[.!?])\s+/);
  return fr[1] && fr[1].length < 240 ? fr[1] : '';
}
function melhorLista(a) {
  const corpo = corpoSemRefs(a.conteudo); const partes = corpo.split(/(?=<h2\b)/i); let melhor = null;
  for (const p of partes) {
    const h2 = L.semTags((p.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i) || [])[1] || '');
    for (const m of p.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const itens = [...m[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => L.semTags(x[1])).filter((t) => t.length >= 25 && t.length <= 200 && !/^(Brasil|[A-Z][a-zà-ú]+ [A-Z]{1,3}[,.])/.test(t));
      if (itens.length < 3) continue;
      const pontos = (/como|o que fazer|o que funciona|passo|estrat|pr[aá]tic|orienta|cuidad|sinais|dicas|apoio/i.test(h2) ? 10 : 0) + Math.min(itens.length, 5);
      if (!melhor || pontos > melhor.pontos) melhor = { h2, itens: itens.slice(0, 5), pontos };
    }
  }
  return melhor;
}
const encurtar = (t, n) => (t.length <= n ? t : `${t.slice(0, n).replace(/[\s,;(]+\S*$/, '')}…`);
const PIE = (a) => ({ slug: a.slug, titulo: a.titulo, url: `${L.SITE}/artigo/${a.slug}`, ref: encurtar((L.referencias(a.conteudo)[0] || '').replace(/\s+https?:\/\/\S+$/, ''), 190) });

const RODAPE = `\nConteúdo educativo, não substitui consulta. Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.\n${L.CRISE}\n${L.AVISO_IA}\n\n${L.IDENTIFICACAO_3_LINHAS}`;
const HASH = { educativo: '#SaudeMental #AtencaoPrimaria #MedicinaDeFamilia', trabalho: '#SaudeMentalNoTrabalho #NR1 #RiscosPsicossociais', bastidores: '#SaudeMental #AtencaoPrimaria #PraticaClinica' };

function montarPost(a, tema) {
  const lista = melhorLista(a); if (!lista) return null;
  const semAutor = (t) => t.replace(/,?\s*por Dr\. Antônio Felipe\.?\s*$/i, '.').replace(/\.\.$/, '.');
  const info = PIE(a); const g = semAutor(gancho(a)); const resumo = semAutor(L.semTags(a.resumo || ''));
  for (let n = Math.min(5, lista.itens.length); n >= 3; n--) {
    const pontos = lista.itens.slice(0, n).map((i) => `• ${fimFrase(cap(i))}`).join('\n');
    const texto = [g, resumo && !g.includes(resumo.slice(0, 40)) ? `\n${resumo}` : '', `\nPontos práticos${lista.h2 ? ` (${lista.h2.replace(/[?:]+$/, '')})` : ''}:\n${pontos}`, info.ref ? `\nReferência: ${info.ref}` : '', `\nTexto completo: ${info.url}`, RODAPE, `\n${HASH[tema]}`].join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (texto.length <= 1990) return { texto, slug: a.slug, titulo: a.titulo, url: info.url };
  }
  return null;
}

// ---------- carrosséis em PDF ----------
const CARROSSEIS = [
  { id: 'nr1-primeiros-passos', tema: 'trabalho', titulo: 'NR-1 e riscos psicossociais: por onde começar', slug: 'nr1-riscos-psicossociais-passo-a-passo' },
  { id: 'nr1-pratica-clinica', tema: 'trabalho', titulo: 'NR-1 na prática clínica e na rotina de saúde', slug: 'nr1-riscos-psicossociais-pratica-clinica' },
  { id: 'burnout-aps', tema: 'educativo', titulo: 'Burnout na Atenção Primária: sinais e cuidado', slug: 'burnout-aps' },
  { id: 'burnout-equipes', tema: 'trabalho', titulo: 'Burnout de equipe: o que muda na gestão', slug: 'burnout-coletivo-equipe-inteira' },
  { id: 'manejo-crise', tema: 'educativo', titulo: 'Manejo da crise psiquiátrica: orientações gerais', slug: 'manejo-crise-psiquiatrica' },
  { id: 'risco-suicidio-aps', tema: 'educativo', titulo: 'Risco de suicídio na APS: avaliar e acolher', slug: 'risco-suicidio-aps' },
];
const palavras = (s) => String(s).trim().split(/\s+/).length;
function montarCarrossel(a, def) {
  const lista = melhorLista(a);
  const info = PIE(a);
  const itens = (lista ? lista.itens : []).filter((i) => palavras(i) <= 25);
  const secs = L.secoes(corpoSemRefs(a.conteudo)).filter((s) => s.titulo && !/^Refer/i.test(s.titulo)).map((s) => s.titulo).filter((t) => palavras(t) <= 14);
  const paginas = [{ tipo: 'capa', titulo: def.titulo, sub: 'Dr. Antônio Felipe · conteúdo educativo' }];
  secs.slice(0, 3).forEach((t) => paginas.push({ tipo: 'topico', titulo: t }));
  itens.slice(0, 4).forEach((i, k) => {
    const texto = fimFrase(cap(i)); const h2 = lista.h2 && k === 0 && palavras(lista.h2) + palavras(texto) <= 25 ? lista.h2 : '';
    paginas.push({ tipo: 'ponto', titulo: h2, texto });
  });
  if (paginas.length < 9) {
    // sem lista suficiente: primeira frase de cada seção (até 25 palavras, junto do título quando couber)
    const vistos = new Set(paginas.map((p) => p.texto || p.titulo));
    for (const s of L.secoes(corpoSemRefs(a.conteudo))) {
      if (paginas.length >= 9) break;
      if (!s.titulo || /^Refer/i.test(s.titulo)) continue;
      const par = (s.html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
      const fr = L.semTags(par || '').split(/(?<=[.!?])\s+/)[0];
      if (!fr || palavras(fr) > 25 || vistos.has(fr)) continue;
      vistos.add(fr);
      paginas.push({ tipo: 'ponto', titulo: palavras(s.titulo) + palavras(fr) <= 25 ? s.titulo : '', texto: fr });
    }
  }
  paginas.push({ tipo: 'final', titulo: 'Texto completo e referências no site', url: info.url, ref: info.ref });
  if (paginas.length < 8) return null;
  return { paginas: paginas.slice(0, 10), info, legenda: [`${def.titulo}.`, '', 'Documento em carrossel (8 a 10 páginas) com os pontos principais do texto.', `Texto completo: ${info.url}`, RODAPE, `\n${HASH[def.tema]}`].join('\n').trim() };
}

// ---------- newsletters mensais ----------
const NEWS = [
  { mes: '2026-11-16', titulo: 'Saúde mental no trabalho: o que o cuidado na prática ensina', slugs: ['burnout-aps', 'nr1-riscos-psicossociais-passo-a-passo', 'estresse-ocupacional-vs-burnout', 'burnout-sinais-reconhecer'] },
  { mes: '2026-12-14', titulo: 'Equipes de saúde e de empresas: sinais de sobrecarga e caminhos de cuidado', slugs: ['burnout-coletivo-equipe-inteira', 'burnout-medicos-enfermeiros', 'burnout-na-gestao-fatores-de-risco', 'prevencao-suicidio-ambiente-trabalho'] },
  { mes: '2027-01-18', titulo: 'Atenção Primária e saúde mental: o que muda no começo de um ano de trabalho', slugs: ['risco-suicidio-aps', 'ansiedade-generalizada-aps', 'transtorno-bipolar-na-aps-rastreio-e-manejo-intercrises', 'manejo-crise-psiquiatrica'] },
];
function montarNewsletter(n, porSlug) {
  const L2 = [`# ${n.titulo}`, '', '*Newsletter mensal do Dr. Antônio Felipe — saúde mental no trabalho e na Atenção Primária.*', ''];
  const refs = [];
  for (const s of n.slugs) {
    const a = porSlug.get(s); if (!a) continue;
    const lista = melhorLista(a); const info = PIE(a);
    L2.push(`## ${a.titulo}`, '', L.semTags(a.resumo || gancho(a)), '');
    if (lista) L2.push(`**${lista.h2 || 'Pontos principais'}**`, '', ...lista.itens.slice(0, 4).map((i) => `- ${fimFrase(cap(i))}`), '');
    L2.push(`Texto completo: ${info.url}`, '');
    if (info.ref) refs.push(info.ref);
  }
  L2.push('## Referências citadas nos textos', '', ...refs.map((r, i) => `${i + 1}. ${r}`), '', '---', RODAPE.trim());
  return L2.join('\n');
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const arts = await db.collection('artigos').find({}).toArray();
  const porSlug = new Map(arts.map((a) => [a.slug, a]));
  const dataTexto = (a) => new Date(a.publicado ? a.publicadoEm : (a.agendamento && a.agendamento.slot) || '2099-01-01');
  const sl = slots();
  // plano de tipos: 6 bastidores (15%), 25% trabalho, 60% educativo, distribuídos de forma intercalada
  const total = sl.length, nB = BASTIDORES.length, nT = Math.round(total * 0.25), nE = total - nB - nT;
  const plano = []; { const b = [...Array(nB).fill('bastidores'), ...Array(nT).fill('trabalho'), ...Array(nE).fill('educativo')]; const passo = total / b.length; const bucket = Array(total).fill(null);
    // espalha por razão: ordena tipos em sequência intercalada
    const fila = { bastidores: nB, trabalho: nT, educativo: nE }; const alvo = { bastidores: nB / total, trabalho: nT / total, educativo: nE / total }; const dado = { bastidores: 0, trabalho: 0, educativo: 0 };
    for (let i = 0; i < total; i++) { let melhor = null, falta = -1; for (const k of Object.keys(fila)) { if (dado[k] >= fila[k]) continue; const f = alvo[k] * (i + 1) - dado[k]; if (f > falta) { falta = f; melhor = k; } } dado[melhor]++; plano.push(melhor); } }
  const pool = {
    educativo: arts.filter((a) => /M[eé]dicos & Enfermeiros|Residentes/.test(a.categoria) && (a.publicado || (a.agendamento && a.agendamento.agendado)) && !/^relato-/.test(a.slug)),
    trabalho: arts.filter((a) => a.categoria === 'Empresas & RH' && (a.publicado || (a.agendamento && a.agendamento.agendado)) && !/^servico-/.test(a.slug)),
  };
  for (const k of Object.keys(pool)) pool[k].sort((x, y) => (Number(y.publicado) - Number(x.publicado)) || ((y.visualizacoes || 0) - (x.visualizacoes || 0)));
  const carr = CARROSSEIS.map((c) => ({ c, a: porSlug.get(c.slug) })).filter((x) => x.a).map((x) => ({ ...x, m: montarCarrossel(x.a, x.c) })).filter((x) => x.m);
  for (const c of CARROSSEIS) if (!carr.find((x) => x.c.id === c.id)) console.log('carrossel sem páginas suficientes (ou texto ausente):', c.id);
  const usados = new Set(); const itens = []; let b = 0; let ci = 0;
  sl.forEach((s, i) => {
    const tipo = plano[i]; const id = `li-${s.toISOString().slice(0, 10)}`;
    if (tipo === 'bastidores') { const x = BASTIDORES[b++]; itens.push({ id, tipo: 'texto', tema: 'bastidores', slot: s.toISOString(), titulo: x.titulo, texto: `${x.texto}\n${RODAPE}\n\n${HASH.bastidores}`.trim() }); return; }
    // a cada 7 slots, um carrossel (manual) do tema do slot, se o texto de origem já estiver publicado até a data
    if (i % 7 === 4 && ci < carr.length && dataTexto(carr[ci].a) <= s) { const x = carr[ci++]; itens.push({ id: `${id}-carrossel`, tipo: 'carrossel', tema: x.c.tema, slot: s.toISOString(), titulo: x.c.titulo, texto: x.m.legenda, url: x.m.info.url, carrossel: x }); return; }
    const cand = pool[tipo].filter((a) => !usados.has(a.slug) && dataTexto(a) <= s);
    for (const a of cand) { const p = montarPost(a, tipo); if (p && !checarPost({ tipo: 'texto', texto: p.texto }).length) { usados.add(a.slug); itens.push({ id, tipo: 'texto', tema: tipo, slot: s.toISOString(), titulo: a.titulo, texto: p.texto, url: p.url, slug: a.slug }); return; } }
    itens.push({ id, tipo: 'texto', tema: tipo, slot: s.toISOString(), titulo: '(sem texto elegível)', texto: '', status: 'sem-conteudo' });
  });
  for (const it of itens) { if (it.status) continue; const f = it.tipo === 'texto' ? checarPost(it) : checarPost({ ...it, tipo: 'carrossel' }); it.checagem = f; it.status = it.tipo === 'carrossel' ? (f.length ? 'reprovado' : 'manual') : (f.length ? 'reprovado' : 'aprovado-checagem'); }
  const novidades = NEWS.map((n) => ({ ...n, md: montarNewsletter(n, porSlug) }));
  const cont = (s) => itens.filter((i) => i.status === s).length;
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · slots ${total} · aprovado-checagem ${cont('aprovado-checagem')} · manual (carrossel PDF) ${cont('manual')} · reprovado ${cont('reprovado')} · sem conteúdo ${cont('sem-conteudo')} · newsletters ${novidades.length}`);
  const tipos = itens.reduce((m, i) => ((m[i.tema] = (m[i.tema] || 0) + 1), m), {}); console.log('mistura:', JSON.stringify(tipos));
  itens.filter((i) => i.status === 'reprovado').slice(0, 5).forEach((i) => console.log('  reprovado', i.id, i.checagem.join(' | ')));
  if (!aplicar) { const ex = itens.find((i) => i.status === 'aprovado-checagem' && i.tema === 'educativo'); if (ex) console.log(`\n--- amostra (${ex.texto.length} caracteres) ---\n${ex.texto}`); await mongoose.disconnect(); return; }

  // ---------- grava ----------
  fs.mkdirSync(REL, { recursive: true });
  const man = path.join(REL, 'fila-manual');
  for (const x of carr) {
    const dir = path.join(RAIZ, 'carrosseis-instagram', 'linkedin', x.c.id); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify({ saida: path.join(dir, 'carrossel.pdf'), paginas: x.m.paginas }), 'utf8');
    const r = spawnSync(L.PY, ['-I', path.join(__dirname, 'carrossel.py'), path.join(dir, 'spec.json')], { encoding: 'utf8' });
    if (r.status !== 0) console.log('PDF falhou', x.c.id, String(r.stderr).slice(-300));
  }
  for (const it of itens) {
    if (it.carrossel) { it.pdf = `carrosseis-instagram/linkedin/${it.carrossel.c.id}/carrossel.pdf`; delete it.carrossel; }
    if (it.status === 'aprovado-checagem' || it.status === 'manual') {
      const d = path.join(man, `semana-${segundaDe(new Date(it.slot))}`, `${dia(new Date(it.slot))}-${it.tipo}-${it.id.slice(-12).replace(/[^a-z0-9-]/gi, '')}`);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'texto.txt'), it.texto, 'utf8');
      fs.writeFileSync(path.join(d, 'LEIA-ME.txt'), `Publicar em: ${new Date(new Date(it.slot).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} (Bahia)\nTipo: ${it.tipo}${it.tipo === 'carrossel' ? ' (documento PDF: Criar publicação > Adicionar documento)' : ''}\nTema: ${it.tema}\n`, 'utf8');
      if (it.pdf && fs.existsSync(path.join(RAIZ, it.pdf))) fs.copyFileSync(path.join(RAIZ, it.pdf), path.join(d, 'carrossel.pdf'));
    }
  }
  fs.mkdirSync(path.join(REL, 'newsletters'), { recursive: true });
  for (const n of novidades) fs.writeFileSync(path.join(REL, 'newsletters', `${n.mes}-newsletter.md`), `<!-- Publicar manualmente como edição da newsletter em ${n.mes} (LinkedIn > Escrever artigo > Criar newsletter) -->\n${n.md}\n`, 'utf8');
  const col = db.collection('linkedin_fila');
  for (const it of itens) { const antes = await col.findOne({ _id: it.id }); if (antes && antes.status === 'publicado') continue; await col.replaceOne({ _id: it.id }, { _id: it.id, ...it, atualizadoEm: new Date() }, { upsert: true }); }
  fs.writeFileSync(path.join(REL, 'fila.json'), JSON.stringify({ geradoEm: new Date().toISOString(), regra: 'seg/qua/sex 19:30 (Bahia), 27/10/2026 a 31/01/2027; mistura 60/25/15', itens: itens.map(({ texto, ...r }) => ({ ...r, caracteres: texto.length })) }, null, 1), 'utf8');
  console.log(`GRAVADO: ${itens.length} itens em linkedin_fila (Mongo) e relatorios/linkedin/.`);
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.stack || e.message); process.exit(2); });
