/**
 * Conferência de 26/10/2026 (rodar depois das 08:00, horário da Bahia): o primeiro post saiu?
 *   node --env-file=.env scripts/conferirPrimeiroPost.js [id-do-post]    (padrão: 2026-10-26-saude-mental-cuidador)
 * SOMENTE LEITURA. Não imprime o token. Grava relatorios/conferencia-primeiro-post-AAAAMMDD.md.
 * Confere: publicado ou não, link, legenda (assinatura curta de 3 linhas, sem "psiquiatra" como título, sem #psiquiatria, com acentos) e erros do log.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const db = require('../backend/lib/db');
const { IDENTIFICACAO_3_LINHAS } = require('../backend/lib/legendaInstagram');
const { obterTokenInstagram } = require('../backend/lib/tokenInstagram');

(async () => {
  const id = process.argv[2] || '2026-10-26-saude-mental-cuidador';
  await db.connect();
  const d = mongoose.connection.db;
  const post = await d.collection('redes_v2').findOne({ _id: id });
  if (!post) { console.error('post não encontrado:', id); process.exit(2); }
  const falhas = [], linhas = [];
  const publicado = post.status === 'publicado';
  linhas.push(`- Post: ${id} · programado para ${new Date(post.dataSugerida).toISOString()}`, `- Status: ${post.status}${post.publicadoEm ? ' em ' + new Date(post.publicadoEm).toISOString() : ''}`);
  if (!publicado) falhas.push(`não publicado (status ${post.status})`);

  let legenda = post.legenda || '';
  let link = null;
  if (publicado && post.instagramId) {
    const token = await obterTokenInstagram();
    const j = await fetch(`https://graph.instagram.com/v21.0/${post.instagramId}?fields=permalink,caption,timestamp,media_type`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (j.error) falhas.push(`Meta não devolveu o post (código ${j.error.code}): ${String(j.error.message).slice(0, 100)}`);
    else { link = j.permalink; legenda = j.caption || legenda; linhas.push(`- Link: ${link}`, `- Tipo: ${j.media_type}`); }
  }
  linhas.push(`- ID no Instagram: ${post.instagramId || '—'}`);
  if (publicado && !link) falhas.push('sem link do post');

  if (!legenda.includes(IDENTIFICACAO_3_LINHAS)) falhas.push('legenda sem a assinatura curta de 3 linhas exata');
  if (/#psiquiatria/i.test(legenda)) falhas.push('legenda com #psiquiatria');
  if (/Antônio Felipe[^.\n]{0,80}\bpsiquiatra\b/i.test(legenda)) falhas.push('legenda apresenta o autor como psiquiatra');
  if (/Antonio Felipe/.test(legenda)) falhas.push('legenda com "Antonio" sem acento');
  if (/Ã[©¡£§³ª´µ¢]|â€/.test(legenda)) falhas.push('legenda com caracteres corrompidos (acentos)');
  if (!/CVV 188/.test(legenda) || !/SAMU 192/.test(legenda)) falhas.push('legenda sem "CVV 188 · SAMU 192"');
  linhas.push(`- Legenda conferida: ${falhas.some((x) => x.startsWith('legenda')) ? 'COM PROBLEMAS' : 'ok (3 linhas, sem psiquiatra/#psiquiatria, com acentos)'}`);

  const erros = await d.collection('redes_v2_log').find({ postId: id, nivel: { $in: ['erro', 'bloqueado'] } }).sort({ em: -1 }).limit(5).toArray();
  for (const e of erros) falhas.push(`log ${e.nivel} (${new Date(e.em).toISOString()}): ${String(e.mensagem).slice(0, 160)}`);
  linhas.push(`- Erros/bloqueios no log: ${erros.length}`);

  if (!/Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito/.test(legenda)) falhas.push('legenda sem a linha de crédito do Portal');

  // Autorização do YouTube (app em modo "Testando" vence 7 dias depois de autorizar; autorizada em 16/10/2026 → vence em 23/10/2026)
  try {
    const au = await require('./youtube/avisoAutorizacao').conferir();
    linhas.push(`- Autorização do YouTube: autorizada em ${au.autorizadoEm || '—'} (app: ${au.modo || '—'}) · ${au.venceEm ? `vence em ${au.venceEm} (${au.dias} dia(s))` : 'app publicado: não vence em 7 dias'}`);
    if (au.problema) falhas.push(`YouTube: ${au.problema} (passo a passo em relatorios/youtube/AVISO-REAUTORIZAR.md)`);
  } catch (e) { linhas.push(`- Autorização do YouTube: não consegui conferir (${e.message.slice(0, 60)})`); }

  const hoje = new Date().toISOString().slice(0, 10);
  const md = `# Conferência do primeiro post — ${hoje}\n\n**Resultado: ${falhas.length ? 'ATENÇÃO' : publicado ? 'PUBLICADO e conferido' : 'NÃO PUBLICADO'}**\n\n${linhas.join('\n')}\n\n${falhas.length ? '## Problemas\n' + falhas.map((x) => `- ${x}`).join('\n') + '\n' : ''}`;
  const arq = path.join(__dirname, '..', 'relatorios', `conferencia-primeiro-post-${hoje.replace(/-/g, '')}.md`);
  fs.writeFileSync(arq, md);
  console.log(md, '\nRelatório:', arq);
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
