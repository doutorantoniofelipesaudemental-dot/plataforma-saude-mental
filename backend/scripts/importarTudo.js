/**
 * Importação completa (PROMPT-MESTRE de 14/10/2026). DRY-RUN POR PADRÃO.
 *   npm run importar-tudo                          dry-run de tudo + relatórios + calendário
 *   npm run importar-tudo -- --etapa A|B|C         dry-run de uma etapa
 *   npm run importar-tudo -- --etapa A --aplicar   grava a etapa (exige backup de hoje em backups/)
 *
 * Modos: atualizar-com-titulo (A), atualizar-so-conteudo (B), criar-rascunho (C e itens A/B sem correspondência).
 * Itens novos entram como rascunho (publicado:false, status:'rascunho'), com data/hora do calendário do site
 * (backend/lib/calendarioSite.js) e publicados depois por backend/scripts/publicarAgendados.js.
 * Narração: o `conteudo` muda, `narracao` não → o estado vira "desatualizada" (player oculto, áudio preservado).
 * Idempotente: rodar de novo não duplica nem regrava o que já está igual.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { montarCalendario, publicoDe } = require('../lib/calendarioSite');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const BASE = path.join(RAIZ, 'importacao-completa/importacao');
const BASE_EXTRA = path.join(RAIZ, 'importacao-extra-180/importacao'); // etapa D (3 séries extras)
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const args = process.argv.slice(2);
const val = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : null);
const etapaArg = val('etapa');
const aplicar = args.includes('--aplicar');

const CATEGORIAS = require('../models/Artigo').CATEGORIAS;
const ORIGEM_CATEGORIA = { empresas: 'Empresas & RH', medicos: 'Médicos & Enfermeiros', pacientes: 'Pacientes & Famílias', pais: 'Pais & Famílias', relatos: 'Relatos da Prática' };
const PARTE_EQUIVALENTE = {
  'Terceira Idade': 'Saúde Mental na Terceira Idade',
  'Estilo de Vida & Saúde Mental': 'Geral',
  'Sociedade, Política & Saúde Mental': 'Terceiro Setor & Causas Sociais',
  'Corpo e Saúde Mental': 'Geral',
};
const SLUG_CORRIGIDO = { 'criancas-superproteção-riscos': 'criancas-superprotecao-riscos' };
const COLISAO = { slug: 'ansiedade-social-timidez', pastaPlano180: '04-plano180-lotes-07-09', novoSlug: 'ansiedade-social-timidez-adolescencia' };
// "psiquiatra" como nome da profissão (nunca o autor): os 2 itens originais + 2 da Etapa D (psiquiatra espanhol citado; "não precisa de psiquiatra").
const PROFISSAO_OK = new Set(['quando-encaminhar-aps', 'quando-procurar-psiquiatra-psicologo', 'migracao-luto-migratorio', 'migracao-papel-da-sociedade-e-politicas']);
const RE_SENSIVEL = /\b(suic[ií]d\w*|autoles\w*|autom?utila\w*|desejo de morrer|quer(?:er)? morrer|tirar a (?:pr[óo]pria )?vida|morte)\b/i;
const n = (t, re) => (t.match(re) || []).length;
const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

/* ------------------------------ Leitura -------------------------------------- */
function carregarItens() {
  const manifestos = [[BASE, 'manifesto.json'], [BASE_EXTRA, 'manifesto-extra.json']].filter(([b, nome]) => fs.existsSync(path.join(b, nome)));
  const pastas = manifestos.flatMap(([b, nome]) => JSON.parse(fs.readFileSync(path.join(b, nome), 'utf8')).pastas.map((p) => ({ ...p, base: b })));
  const itens = [];
  let ordem = 0;
  for (const p of pastas) {
    const BASE = p.base; // eslint-disable-line no-shadow
    const lote = path.join(BASE, p.pasta, 'lote.json');
    if (p.modo === 'nao-importar-agora' || !fs.existsSync(lote)) continue;
    const lista = JSON.parse(fs.readFileSync(lote, 'utf8'));
    const referenciados = new Set(lista.map((i) => i.arquivo_conteudo));
    const soltos = fs.readdirSync(path.join(BASE, p.pasta, 'conteudo')).filter((f) => !referenciados.has(f));
    for (const it of lista) {
      const item = { ...it, pasta: p.pasta, etapa: p.etapa, modo: p.modo, ordem: (ordem += 1), slugOriginal: it.slug };
      let slug = SLUG_CORRIGIDO[it.slug] || it.slug;
      if (p.pasta === COLISAO.pastaPlano180 && it.slug === COLISAO.slug) slug = COLISAO.novoSlug;
      item.slug = slug;
      let arq = path.join(BASE, p.pasta, 'conteudo', it.arquivo_conteudo);
      if (!fs.existsSync(arq)) {
        // HTML com nome corrompido: localiza pelo conteúdo entre os arquivos não referenciados da pasta.
        const palavra = /superprote/i; // único caso conhecido: nome do arquivo corrompido no zip
        const achado = soltos.find((f) => palavra.test(fs.readFileSync(path.join(BASE, p.pasta, 'conteudo', f), 'utf8')));
        if (achado) { arq = path.join(BASE, p.pasta, 'conteudo', achado); item.arquivoLocalizadoPorConteudo = achado; }
      }
      item.arquivo = arq;
      item.html = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : null;
      // Pasta 04 (Plano 180) da colisão entra como novo; pasta 08 atualiza o item existente.
      // Etapa D (verificar-e-importar): se já existir → atualizar-com-titulo; se não → criar (decide a existência no banco).
      item.modoEfetivo = slug === COLISAO.novoSlug ? 'criar-rascunho' : p.etapa === 'D' ? 'atualizar-com-titulo' : p.modo;
      itens.push(item);
    }
  }
  return itens;
}

// Etapa D: as 3 categorias do pacote não existem no site; cada "parte" vai para a categoria existente mais próxima.
const D_PARTE = {
  '18-paliativos-saude-mental-60': { 'Cuidadores e familiares': 'Cuidadores & Famílias', 'Saúde mental dos profissionais': 'Médicos & Enfermeiros', 'Sociedade e instituições': 'Terceiro Setor & Causas Sociais', '*': 'Condições Específicas' },
  '19-violencia-saude-mental-60': { 'Infância': 'Infância & Adolescência', 'Adolescência, escola e faculdade': 'Infância & Adolescência', 'Pessoa idosa': 'Saúde Mental na Terceira Idade', Trabalho: 'Empresas & RH', 'Bairro e comunidade': 'Terceiro Setor & Causas Sociais', '*': 'Pacientes & Famílias' },
  '20-migracao-saude-mental-60': { '*': 'Migrantes & Expatriados' },
};

function categoriaDe(it) {
  let cat, motivo = null;
  if (it.tipo !== 'relato' && D_PARTE[it.pasta]) {
    cat = D_PARTE[it.pasta][it.parte] || D_PARTE[it.pasta]['*'];
    return { cat, motivo: `${it.pasta.slice(0, 2)}: "${it.categoria}" / "${it.parte}" → "${cat}" (categoria nova não criada; a mais próxima)` };
  }
  if (it.tipo === 'relato') cat = 'Relatos da Prática';
  else if (it.parte && CATEGORIAS.includes(it.parte)) cat = it.parte;
  else if (it.parte && PARTE_EQUIVALENTE[it.parte]) { cat = PARTE_EQUIVALENTE[it.parte]; motivo = `"${it.parte}" → "${cat}" (sem categoria própria; a mais próxima)`; }
  else if (!it.parte && ORIGEM_CATEGORIA[it.origem]) { cat = ORIGEM_CATEGORIA[it.origem]; motivo = `origem "${it.origem}" (sem "parte") → "${cat}"`; }
  else { cat = 'Geral'; motivo = `"${it.parte || it.origem}" → "Geral" (sem correspondência)`; }
  return { cat, motivo };
}

function validarHtml(it) {
  const html = it.html, av = [];
  if (!html) return ['HTML ausente'];
  if (n(html, /CRM-BA 41322/g) !== 1) av.push(`CRM-BA 41322 ${n(html, /CRM-BA 41322/g)}x`);
  if (n(html, /RQE 26638/g) !== 1) av.push(`RQE 26638 ${n(html, /RQE 26638/g)}x`);
  if (n(html, /N[ÃA]O ESPECIALISTA/g) !== 1) av.push(`NÃO ESPECIALISTA ${n(html, /N[ÃA]O ESPECIALISTA/g)}x`);
  if (html.includes('{{')) av.push('"{{" sobrando');
  if (/Antonio/.test(html)) av.push('"Antonio" sem acento');
  if (/#psiq/i.test(html)) av.push('#psiq');
  if (/\bpsiquiatra\b/i.test(html) && !PROFISSAO_OK.has(it.slug)) av.push('contém "psiquiatra" (conferir)');
  const iRef = html.search(/<h[2-4][^>]*>\s*Refer[êe]ncias/i);
  const refs = iRef >= 0 ? n(html.slice(iRef), /<li[ >]/g) : 0;
  if (refs < 4) av.push(`${refs} referências (<4)`);
  for (const s of new Set([...html.matchAll(/<sup[^>]*>\s*\[?(\d+)\]?\s*<\/sup>/g)].map((m) => +m[1]))) if (s > refs) av.push(`<sup>${s}</sup> sem referência`);
  // Etapa D (pastas 18 a 20): 188 só para suicídio, autolesão ou desejo de morrer; morte e fim de vida (paliativos) NÃO exigem a caixa.
  const reSens = /^(18|19|20)-/.test(it.pasta) ? new RegExp(RE_SENSIVEL.source.replace('|morte', ''), 'i') : RE_SENSIVEL;
  if (reSens.test(iRef >= 0 ? html.slice(0, iRef) : html) && !/\b188\b/.test(html)) av.push('tema sensível sem 188');
  if (it.tipo === 'relato') {
    if (n(html, /Narrativa composta/g) !== 1) av.push(`"Narrativa composta" ${n(html, /Narrativa composta/g)}x`);
    if (!/reflection-box/.test(html)) av.push('sem .reflection-box');
  }
  return av;
}

/* ------------------------------ Plano ---------------------------------------- */
async function main() {
  const todos = carregarItens();
  const itens = etapaArg ? todos.filter((i) => i.etapa === etapaArg) : todos;
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const noBanco = new Map((await col.find({}).toArray()).map((d) => [d.slug, d]));
  const mdxExiste = (slug) => ['src/content/artigos', 'content/blog'].some((d) => fs.existsSync(path.join(APP, d, `${slug}.mdx`)));

  // Vínculos simétricos artigo↔relato (sobre TODOS os itens, com os slugs finais).
  const slugFinal = new Map(todos.map((i) => [i.slugOriginal, i.slug]));
  const vinc = new Map(); // slug -> Set(slugs ligados)
  const ligar = (a, b) => { if (!a || !b) return; (vinc.get(a) || vinc.set(a, new Set()).get(a)).add(b); (vinc.get(b) || vinc.set(b, new Set()).get(b)).add(a); };
  for (const i of todos) { ligar(i.slug, i.relato_ligado && (slugFinal.get(i.relato_ligado) || i.relato_ligado)); ligar(i.slug, i.artigo_ligado && (slugFinal.get(i.artigo_ligado) || i.artigo_ligado)); }
  const conflitos = [...vinc].filter(([, s]) => s.size > 1).map(([k, s]) => `${k} ↔ ${[...s].join(', ')}`);

  // Quem é "novo": slug fora do banco, ou criado por esta importação (tem importacao.pasta).
  for (const it of todos) {
    const d = noBanco.get(it.slug);
    it.existeNoBanco = Boolean(d);
    it.criadoPorNos = Boolean(d?.agendamento); // só os documentos criados por esta importação têm `agendamento`
    it.novo = it.modoEfetivo === 'criar-rascunho' ? (!d || it.criadoPorNos) : (!d || it.criadoPorNos);
    const c = categoriaDe(it); it.categoria = c.cat; it.motivoCategoria = c.motivo;
    it.avisos = validarHtml(it);
  }
  const novos = todos.filter((i) => i.novo);
  const { agenda, avisos: avisosCal } = montarCalendario(novos.map((i) => ({
    slug: i.slug, titulo: i.titulo, tipo: i.tipo, categoria: i.categoria, semana: i.semana_publicacao != null ? +i.semana_publicacao : undefined,
    numeroSerie: i.numero_serie, serie: i.origem === 'serie-corpo', ordem: i.ordem, par: [...(vinc.get(i.slug) || [])].find((s) => novos.some((x) => x.slug === s)),
  })));
  const slotDe = new Map(agenda.map((a) => [a.slug, a]));

  const acoes = itens.map((it) => {
    const d = noBanco.get(it.slug);
    let acao;
    if (!it.html) acao = 'erro-html';
    else if (it.novo) acao = d ? (d.conteudo === it.html ? 'inalterado' : 'recriar') : 'criar';
    else if (d.conteudo === it.html && d.titulo === it.titulo && (it.modoEfetivo !== 'atualizar-com-titulo' || true)) acao = 'inalterado';
    else acao = 'atualizar';
    return { it, acao, d };
  });

  /* ---------------------------- Relatório ---------------------------------- */
  const cont = (e, a) => acoes.filter((x) => x.it.etapa === e && x.acao === a).length;
  const resumo = ['A', 'B', 'C', 'D'].map((e) => `Etapa ${e}: ${cont(e, 'atualizar')} atualizar · ${cont(e, 'criar') + cont(e, 'recriar')} criar · ${cont(e, 'inalterado')} inalterados · ${cont(e, 'erro-html')} erro`);
  const mapeamentos = new Map();
  for (const x of acoes.filter((a) => a.acao === 'criar' && a.it.motivoCategoria)) mapeamentos.set(x.it.motivoCategoria, (mapeamentos.get(x.it.motivoCategoria) || 0) + 1);
  const comMdx = acoes.filter((x) => mdxExiste(x.it.slug)).map((x) => x.it.slug);
  const narr = acoes.filter((x) => x.acao === 'atualizar' && x.d).reduce((s, x) => { const e = x.d.narracao?.hash ? 'tinha' : 'sem'; s[e] += 1; return s; }, { tinha: 0, sem: 0 });
  const dir = path.join(RAIZ, 'relatorios');
  fs.mkdirSync(dir, { recursive: true });
  const nomeRel = `importacao-completa-${etapaArg || 'dryrun'}${aplicar ? '' : '-dryrun'}.md`;
  const md = [`# Importação ${aplicar ? 'APLICADA' : '(dry-run)'} ${etapaArg ? `— etapa ${etapaArg}` : '— todas'} — ${new Date().toISOString()}`, '', ...resumo.map((l) => `- ${l}`),
    `- Novos na colisão: ${COLISAO.novoSlug} (versão Plano 180 da pasta 04); o slug ${COLISAO.slug} é atualizado com a versão Pacientes (pasta 08).`,
    `- Slug corrigido: criancas-superproteção-riscos → criancas-superprotecao-riscos (HTML localizado pelo conteúdo: ${acoes.find((x) => x.it.arquivoLocalizadoPorConteudo)?.it.arquivoLocalizadoPorConteudo ? 'sim' : 'n/d'}).`,
    `- Itens que também têm .mdx no app Next: ${comMdx.length}${comMdx.length ? ` (${comMdx.join(', ')})` : ''}`,
    `- Vínculos artigo↔relato: ${vinc.size} itens ligados · conflitos (um item com 2+ pares): ${conflitos.length}${conflitos.length ? ` — ${conflitos.join('; ')}` : ''}`,
    `- Narração dos itens a atualizar: ${narr.tinha} tinham áudio (ficam "desatualizada": player oculto, arquivo preservado), ${narr.sem} sem áudio`,
    `- Avisos do calendário: ${avisosCal.length ? avisosCal.join(' | ') : 'nenhum'}`, '',
    '## Mapeamento de categorias (itens novos)', '', ...[...mapeamentos].map(([k, v]) => `- ${v}× ${k}`), '',
    '## Avisos de validação do HTML', '', ...(acoes.filter((x) => x.it.avisos.length).map((x) => `- ${x.it.slug} (${x.it.pasta}): ${x.it.avisos.join(' | ')}`) || []), '',
    '## Itens', '', '| Etapa | Slug | Ação | Categoria | Slot |', '|---|---|---|---|---|', ...acoes.map((x) => `| ${x.it.etapa} | ${x.it.slug} | ${x.acao} | ${x.it.categoria} | ${slotDe.get(x.it.slug)?.slot || '—'} |`)].join('\n');
  fs.writeFileSync(path.join(dir, nomeRel), md + '\n', 'utf8');

  if (!etapaArg || aplicar === false) {
    const cal = ['# Calendário de publicação do site', '', `${agenda.length} itens · ${new Set(agenda.map((a) => a.data)).size} dias úteis · de ${agenda[0]?.data} a ${agenda.at(-1)?.data}`, '',
      '| Data | Hora | Slug | Título | Tipo | Público |', '|---|---|---|---|---|---|', ...agenda.map((a) => `| ${a.data} | ${a.hora} | ${a.slug} | ${a.titulo.replace(/\|/g, '/')} | ${a.tipo} | ${a.publico} |`)].join('\n');
    if (!etapaArg) fs.writeFileSync(path.join(dir, 'calendario-publicacao-site.md'), cal + '\n', 'utf8');
  }
  console.log(resumo.join('\n'));
  console.log(`Total no calendário: ${agenda.length} · dias: ${new Set(agenda.map((a) => a.data)).size} · de ${agenda[0]?.data} a ${agenda.at(-1)?.data}`);
  console.log(`Avisos HTML: ${acoes.filter((x) => x.it.avisos.length).length} · conflitos de vínculo: ${conflitos.length} · com .mdx: ${comMdx.length}`);
  console.log(`Calendário avisos: ${avisosCal.length}`);

  /* ------------------------------ Gravação --------------------------------- */
  if (aplicar) {
    if (!etapaArg) throw new Error('--aplicar exige --etapa A|B|C');
    const bk = fs.readdirSync(path.join(RAIZ, 'backups')).filter((d) => d.startsWith('importacao-completa-')).sort().pop();
    const dl = new Date(); const hoje = `${dl.getFullYear()}${String(dl.getMonth() + 1).padStart(2, '0')}${String(dl.getDate()).padStart(2, '0')}`; // data local, como no nome do backup
    if (!bk || !bk.includes(hoje)) throw new Error('sem backup importacao-completa de hoje em backups/ — abortado');
    if (acoes.some((x) => x.acao === 'erro-html')) throw new Error('há itens com HTML ausente — abortado');
    const bloqueios = acoes.filter((x) => x.it.avisos.length && x.acao !== 'inalterado');
    if (bloqueios.length) throw new Error(`${bloqueios.length} item(ns) com avisos de validação — abortado: ${bloqueios.slice(0, 3).map((b) => b.it.slug).join(', ')}`);
    const agora = new Date();
    const log = { atualizados: [], criados: [], inalterados: [], falhas: [] };
    for (const { it, acao, d } of acoes) {
      try {
        if (acao === 'inalterado') { log.inalterados.push(it.slug); continue; }
        const ligados = [...(vinc.get(it.slug) || [])];
        const parRelatos = it.tipo === 'artigo' ? ligados : [];
        const parArtigos = it.tipo === 'relato' ? ligados : [];
        const meta = { lote180: it.lote_180 ?? null, semanaPublicacao: it.semana_publicacao != null ? +it.semana_publicacao : null, parte: it.parte || '', origem: it.origem || 'extra-180', tipo: it.tipo, pasta: it.pasta };
        if (it.origem === 'serie-corpo') meta.serie = { nome: it.serie, slug: 'corpo-e-saude-mental', numero: it.numero_serie, bloco: it.bloco };
        if (acao === 'atualizar') {
          const set = { conteudo: it.html, tempoLeitura: it.tempoLeitura, atualizadoEm: agora, 'vinculos.relatos': parRelatos, 'vinculos.artigos': parArtigos };
          for (const [k, v] of Object.entries(meta)) if (v !== null && v !== '') set[`importacao.${k}`] = v;
          if (it.modoEfetivo === 'atualizar-com-titulo') { set.titulo = it.titulo; set.resumo = it.resumo; }
          else if (d.resumo !== it.resumo) set.resumo = it.resumo;
          if (d.publicado) set.capaPendente = true;
          const upd = { $set: set };
          if (it.modoEfetivo === 'atualizar-com-titulo' && d.titulo !== it.titulo) upd.$push = { historicoTitulos: { titulo: d.titulo, em: agora } };
          await col.updateOne({ _id: d._id }, upd);
          log.atualizados.push(it.slug);
        } else { // criar / recriar
          const slot = slotDe.get(it.slug);
          const doc = {
            titulo: it.titulo, slug: it.slug, resumo: it.resumo, conteudo: it.html, categoria: it.categoria, tags: [], autor: 'Dr. Antônio Felipe', imagemCapa: '',
            audioNarracaoUrl: '', solicitacoesNarracao: 0, usosFerramenta: 0, tempoLeitura: it.tempoLeitura, publicado: false, publicadoEm: new Date(slot.slot), visualizacoes: 0,
            enquete: { util: { sim: 0, nao: 0 }, perfil: { gestorRh: 0, profissionalSaude: 0, usoPessoal: 0 } }, status: 'rascunho', publicadoRedesEm: null,
            importacao: { ...Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== null && v !== '')), importadaEm: agora },
            vinculos: { relatos: parRelatos, artigos: parArtigos }, capaPendente: true, historicoTitulos: [],
            agendamento: { agendado: true, slot: new Date(slot.slot), falha: '' }, criadoEm: agora, atualizadoEm: agora,
          };
          if (acao === 'recriar') await col.updateOne({ _id: d._id }, { $set: { conteudo: it.html, titulo: it.titulo, resumo: it.resumo, atualizadoEm: agora } });
          else {
            // fonte única contra duplicidade (20/10/2026): texto novo não entra se já existir no site (banco, MDX, rotas ou similaridade)
            const r = await require('../lib/criarTextoNovo').criarSeNaoExistir({ col, doc: { ...doc, conteudo: it.html } });
            if (!r.criado) { log.ignorados = log.ignorados || []; log.ignorados.push({ slug: it.slug, motivos: r.motivos }); continue; }
          }
          log.criados.push(it.slug);
        }
      } catch (e) { log.falhas.push(`${it.slug}: ${e.message}`); }
    }
    // Vínculos nos DOIS sentidos também para itens fora desta etapa que já existem no banco.
    for (const [slug, set] of vinc) {
      const doc = await col.findOne({ slug }, { projection: { vinculos: 1, categoria: 1 } });
      if (!doc) continue;
      const campo = doc.categoria === 'Relatos da Prática' ? 'artigos' : 'relatos';
      const existentes = [];
      for (const alvo of set) if (await col.findOne({ slug: alvo }, { projection: { _id: 1 } })) existentes.push(alvo);
      const atuais = doc.vinculos?.[campo] || [];
      if (existentes.length && existentes.some((x) => !atuais.includes(x))) await col.updateOne({ _id: doc._id }, { $set: { [`vinculos.${campo}`]: [...new Set([...atuais, ...existentes])] } });
    }
    const rel = [`# Resultado da gravação — etapa ${etapaArg} — ${agora.toISOString()}`, '', `- atualizados: ${log.atualizados.length}`, `- criados: ${log.criados.length}`, `- inalterados: ${log.inalterados.length}`, `- falhas: ${log.falhas.length}`, '', ...log.falhas.map((f) => `- FALHA ${f}`)];
    fs.writeFileSync(path.join(dir, `importacao-completa-${etapaArg}.md`), `${rel.join('\n')}\n\n${md}\n`, 'utf8');
    console.log(`GRAVADO etapa ${etapaArg}: atualizados ${log.atualizados.length} · criados ${log.criados.length} · inalterados ${log.inalterados.length} · falhas ${log.falhas.length}`);
    if (log.falhas.length) { console.error(log.falhas.join('\n')); process.exitCode = 4; }
    const estados = {};
    for (const slug of log.atualizados) { const d = await col.findOne({ slug }); const e = estadoNarracao(d).estado; estados[e] = (estados[e] || 0) + 1; }
    console.log('Estado da narração dos atualizados:', JSON.stringify(estados));
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
