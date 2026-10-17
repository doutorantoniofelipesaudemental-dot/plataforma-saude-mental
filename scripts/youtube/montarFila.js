/**
 * Monta o calendário do YouTube (3 vídeos longos + 5 Shorts por semana, de 27/10/2026 a 31/01/2027), gera as mídias que faltam e
 * grava relatorios/youtube/fila.json + a pasta semanal de upload manual (relatorios/youtube/fila-manual/semana-AAAA-MM-DD/).
 *   node --env-file=.env scripts/youtube/montarFila.js                 plano (dry-run: não grava nem gera nada)
 *   node --env-file=.env scripts/youtube/montarFila.js --aplicar       grava fila.json e as pastas manuais (com o que já estiver gerado)
 *   node --env-file=.env scripts/youtube/montarFila.js --aplicar --gerar [--limite=N]   também gera os vídeos que faltam
 * Longos: terça, quinta e sábado, 18:00 (Bahia). Shorts: segunda, quarta, sexta, sábado e domingo, 12:00 (Bahia).
 * O vídeo sai no dia ou depois da publicação do texto. Itens que reprovam na checagem NÃO entram como "aprovado-checagem".
 * A fila é só do canal de conteúdo educativo: o vídeo da /mentoria é PROPOSTA e nunca entra aqui.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const L = require('./lib');
const longos = require('./gerarVideosLongos');
const shorts = require('./gerarShorts');
const { conferirVideo } = require('./conferirVideo');

const aplicar = process.argv.includes('--aplicar'), gerarMidia = process.argv.includes('--gerar');
const limite = Number((process.argv.find((a) => a.startsWith('--limite=')) || '--limite=9999').split('=')[1]);
const INICIO = new Date('2026-10-27T03:00:00Z'), FIM = new Date('2027-02-01T02:59:59Z'); // dias civis de Salvador (UTC-3)
const LONGO_DIAS = { 2: 18, 4: 18, 6: 18 }, SHORT_DIAS = { 1: 12, 3: 12, 5: 12, 6: 12, 0: 12 }; // 0 = domingo

function slots(mapa) {
  const out = [];
  for (let d = new Date(INICIO); d <= FIM; d = new Date(d.getTime() + 864e5)) {
    const local = new Date(d.getTime() - 3 * 3600e3); const dow = local.getUTCDay();
    if (mapa[dow] != null) out.push(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), mapa[dow] + 3, 0, 0)));
  }
  return out;
}
const segundaDe = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); const dow = (l.getUTCDay() + 6) % 7; const m = new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - dow)); return m.toISOString().slice(0, 10); };
const rotuloSlot = (dt) => { const l = new Date(dt.getTime() - 3 * 3600e3); return `${String(l.getUTCDate()).padStart(2, '0')}-${String(l.getUTCMonth() + 1).padStart(2, '0')}-${String(l.getUTCHours()).padStart(2, '0')}h`; };

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const arts = await db.collection('artigos').find({}).toArray();
  const dataTexto = (a) => new Date(a.publicado ? a.publicadoEm : (a.agendamento && a.agendamento.slot) || a.publicadoEm || '2099-01-01');
  const porSlug = new Map(arts.map((a) => [a.slug, a]));
  const mp3Valido = (a) => L.audioDisponivel(a);

  // ---------- longos ----------
  const candLongos = arts.filter((a) => !/^servico-/.test(a.slug) && a.status !== 'rascunho' && (a.publicado || (a.agendamento && a.agendamento.agendado)) && mp3Valido(a))
    .sort((x, y) => (Number(y.publicado) - Number(x.publicado)) || ((y.visualizacoes || 0) - (x.visualizacoes || 0)) || (dataTexto(x) - dataTexto(y)));
  const usados = new Set(); const itens = []; let ultimaPl = '';
  for (const s of slots(LONGO_DIAS)) {
    const disp = candLongos.filter((a) => !usados.has(a.slug) && dataTexto(a) <= s);
    const a = disp.find((x) => L.playlistDe(x) !== ultimaPl) || disp[0];
    if (!a) continue;
    usados.add(a.slug); ultimaPl = L.playlistDe(a);
    itens.push({ id: `longo-${a.slug}`, tipo: 'longo', slug: a.slug, titulo: a.titulo, slot: s.toISOString(), playlist: L.playlistDe(a) });
  }
  // ---------- Shorts: 60 posts do Instagram, depois os textos mais lidos ----------
  const posts = await db.collection('redes_v2').find({ status: 'aprovado-checagem' }).sort({ dataSugerida: 1 }).toArray();
  const sl = slots(SHORT_DIAS); let k = 0; const shortsUsados = new Set();
  for (const p of posts) {
    const a = porSlug.get(p.slug); if (!a) continue;
    const minimo = new Date(Math.max(new Date(p.dataSugerida), dataTexto(a)));
    while (k < sl.length && sl[k] < minimo) k++;
    if (k >= sl.length) break;
    itens.push({ id: `short-${p._id}`, tipo: 'short', slug: a.slug, postId: p._id, titulo: String(p.legenda).split('\n')[0], slot: sl[k].toISOString(), playlist: L.playlistDe(a) });
    shortsUsados.add(a.slug); k++;
  }
  const lidos = arts.filter((a) => a.publicado && !/^servico-/.test(a.slug) && !shortsUsados.has(a.slug) && a.resumo).sort((x, y) => (y.visualizacoes || 0) - (x.visualizacoes || 0));
  for (let j = 0; k < sl.length && j < lidos.length; k++, j++) {
    const a = lidos[j];
    itens.push({ id: `short-resumo-${a.slug}`, tipo: 'short', slug: a.slug, postId: null, titulo: a.titulo, slot: sl[k].toISOString(), playlist: L.playlistDe(a) });
  }
  itens.sort((x, y) => new Date(x.slot) - new Date(y.slot));
  const nL = itens.filter((i) => i.tipo === 'longo').length, nS = itens.filter((i) => i.tipo === 'short').length;
  const semanas = new Set(itens.map((i) => segundaDe(new Date(i.slot))));
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · slots: ${slots(LONGO_DIAS).length} longos, ${sl.length} Shorts · planejados: ${nL} longos + ${nS} Shorts em ${semanas.size} semanas · candidatos a longo com MP3 válido: ${candLongos.length}`);
  if (!aplicar) { itens.slice(0, 12).forEach((i) => console.log(' ', i.slot.slice(0, 16), i.tipo, i.slug)); await mongoose.disconnect(); return; }

  // ---------- gera mídia que falta e confere ----------
  let feitos = 0;
  for (const it of itens) {
    const a = porSlug.get(it.slug);
    const dir = it.tipo === 'longo' ? path.join(L.MIDIA, it.slug) : path.join(L.MIDIA, it.slug, `short-${it.postId || 'resumo'}`);
    const metaArq = path.join(dir, 'meta.json');
    if (!fs.existsSync(metaArq) && gerarMidia && feitos < limite) {
      try {
        if (it.tipo === 'longo') console.log(JSON.stringify(await longos.gerar(a)));
        else if (it.postId) { const p = posts.find((x) => x._id === it.postId); const r = shorts.linhasDoPost(p); console.log(JSON.stringify(await shorts.gerar({ a, id: it.postId, tituloTela: r.titulo, linhas: r.linhas }))); }
        else console.log(JSON.stringify(await shorts.gerar({ a, id: 'resumo', tituloTela: a.titulo, linhas: [a.titulo, L.semTags(a.resumo || '')].filter(Boolean) })));
        feitos++;
      } catch (e) { console.log(JSON.stringify({ slug: it.slug, erro: e.message.slice(0, 200) })); }
    }
    it.pasta = path.relative(L.RAIZ, dir).replace(/\\/g, '/');
    if (!fs.existsSync(metaArq)) { it.status = 'sem-midia'; continue; }
    const meta = JSON.parse(fs.readFileSync(metaArq, 'utf8'));
    Object.assign(it, { tituloYoutube: meta.titulo, tags: meta.tags, hashVideo: meta.hashVideo, duracao: Math.round(meta.duracao), checagem: { texto: meta.checagemTexto, midia: meta.checagemMidia } });
    // conferência automática do vídeo (quadros, crédito, assinatura, marca d'água, legenda, vinheta falada); reprovado vai para relatorios/youtube/reprovados/
    const conf = await conferirVideo(dir, meta);
    it.checagem.video = conf.falhas;
    it.status = !meta.checagemTexto.length && !meta.checagemMidia.length && conf.ok ? 'aprovado-checagem' : 'reprovado';
    if (it.status === 'reprovado' && conf.falhas.length) {
      const rep = path.join(L.REL, 'reprovados', it.id); fs.mkdirSync(rep, { recursive: true });
      for (const f of ['ini', 'meio', 'fim']) { const o = path.join(dir, 'conferencia', `${f}.png`); if (fs.existsSync(o)) fs.copyFileSync(o, path.join(rep, `${f}.png`)); }
      fs.writeFileSync(path.join(rep, 'motivos.txt'), [it.id, ...conf.falhas, `Pasta do vídeo: ${it.pasta}`].join('\n') + '\n', 'utf8');
    }
  }
  fs.mkdirSync(L.REL, { recursive: true });
  const anterior = (() => { try { return new Map(JSON.parse(fs.readFileSync(path.join(L.REL, 'fila.json'), 'utf8')).itens.map((i) => [i.id, i])); } catch { return new Map(); } })();
  for (const it of itens) { const a = anterior.get(it.id); if (a && a.status === 'publicado') Object.assign(it, { status: 'publicado', youtubeId: a.youtubeId, publicadoEm: a.publicadoEm }); }
  fs.writeFileSync(path.join(L.REL, 'fila.json'), JSON.stringify({ geradoEm: new Date().toISOString(), regra: 'longos ter/qui/sab 18h; Shorts seg/qua/sex/sab/dom 12h (Bahia)', itens }, null, 1), 'utf8');

  // ---------- pasta semanal de upload manual ----------
  const base = path.join(L.REL, 'fila-manual');
  for (const it of itens.filter((i) => i.status === 'aprovado-checagem' || i.status === 'publicado')) {
    const dir = path.join(base, `semana-${segundaDe(new Date(it.slot))}`, `${rotuloSlot(new Date(it.slot))}-${it.tipo}-${it.slug}${it.postId ? '' : ''}`);
    const orig = path.join(L.RAIZ, it.pasta); const meta = JSON.parse(fs.readFileSync(path.join(orig, 'meta.json'), 'utf8'));
    if (fs.existsSync(path.join(dir, 'titulo.txt')) && fs.existsSync(path.join(dir, meta.arquivos.video))) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(orig, meta.arquivos.video), path.join(dir, meta.arquivos.video));
    fs.copyFileSync(path.join(orig, meta.arquivos.capa), path.join(dir, 'capa.png'));
    if (meta.arquivos.legenda) fs.copyFileSync(path.join(orig, meta.arquivos.legenda), path.join(dir, 'legenda.srt'));
    fs.writeFileSync(path.join(dir, 'titulo.txt'), meta.titulo, 'utf8');
    fs.writeFileSync(path.join(dir, 'descricao.txt'), meta.descricao, 'utf8');
    fs.writeFileSync(path.join(dir, 'tags.txt'), meta.tags.join(', '), 'utf8');
    fs.writeFileSync(path.join(dir, 'LEIA-ME.txt'), `Publicar em: ${new Date(new Date(it.slot).getTime() - 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} (Bahia)\nPlaylist: ${it.playlist}\nTipo: ${it.tipo === 'short' ? 'Short (9:16)' : 'Vídeo longo (16:9)'}\nTexto no site: ${L.SITE}/artigo/${it.slug}\nPúblico: não é conteúdo para crianças. Legenda .srt: Studio > Legendas > Enviar arquivo (ou "Sincronizar automaticamente").\n`, 'utf8');
  }
  const cont = (s) => itens.filter((i) => i.status === s).length;
  console.log(`GRAVADO relatorios/youtube/fila.json · aprovado-checagem: ${cont('aprovado-checagem')} · reprovado: ${cont('reprovado')} · sem mídia: ${cont('sem-midia')} · publicado: ${cont('publicado')}`);
  try { const au = await require('./avisoAutorizacao').conferir(); if (au.problema) console.log(`⚠ YouTube: ${au.problema} (ver relatorios/youtube/AVISO-REAUTORIZAR.md)`); } catch (e) { console.log('aviso de autorização do YouTube não conferido:', e.message.slice(0, 80)); }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
