/**
 * Conferência diária das redes e do Portal (09:30 de Salvador, tarefa DrSM-Conferencia-Diaria). SOMENTE LEITURA:
 * não publica, não apaga, não grava nada no banco e não mexe em freios. Não imprime token.
 *   node --env-file=.env scripts/conferencias/conferenciaDiaria.js [--data=AAAA-MM-DD] [--sem-alerta]
 * Grava relatorios/conferencias/AAAA-MM-DD.md. Falhou algo: bloco de ALERTA em destaque no topo de relatorios/ESTADO-GERAL.md
 * (não há envio de e-mail configurado no projeto); tudo certo: o bloco some sozinho.
 * Seções por data: >= 19/10 (token do Instagram renovado pelo cron + trava B) e >= 26/10 (primeiro post: imagens, legenda, link e ID na Meta).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mongoose = require('mongoose');
const db = require('../../backend/lib/db');
const { estadoNarracao, precisaVinheta } = require('../../backend/lib/narracao');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');
const { resultadoAlertaCusto } = require('./alertaCustoVercel');

const RAIZ = path.resolve(__dirname, '../..');
const SITE = 'https://www.drantoniofelipemedico.com.br';
const bahia = (d = new Date()) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const argData = (process.argv.find((a) => a.startsWith('--data=')) || '').split('=')[1];
const hoje = argData || bahia();
const falhas = [], avisos = [], linhas = [];
const ok = (t) => linhas.push(`- ✔ ${t}`);
const falha = (t) => { falhas.push(t); linhas.push(`- ✘ **${t}**`); };
const aviso = (t) => { avisos.push(t); linhas.push(`- ⚠ ${t}`); };

// Alerta de custo da Vercel (ordem de 28/10/2026). Trabalha numa cópia em .tmp/: o registro rastreado
// (relatorios/vercel-credito.json) não é gravado pela conferência, para não sujar a pasta principal.
function alertaCustoDoDia() {
  const copia = path.join(RAIZ, '.tmp', 'vercel-credito-diario.json');
  fs.mkdirSync(path.dirname(copia), { recursive: true });
  fs.copyFileSync(path.join(RAIZ, 'relatorios/vercel-credito.json'), copia);
  const { atualizarCredito } = require('../creditoVercel');
  const r = atualizarCredito({ hoje, arquivo: copia });
  const res = resultadoAlertaCusto(JSON.stringify(r));
  if (res.nivel === 'falha') falha(res.texto);
  else if (res.nivel === 'aviso') aviso(res.texto);
  else ok('custo Vercel dentro do limite');
}

// Backup diário do estado que saiu do Git (scripts/backupEstado.js). Falha ou mais de 2 dias sem backup = alerta com ação.
function backupDoEstado() {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/backupEstado.js'), '--executar'], { cwd: RAIZ, encoding: 'utf8', timeout: 300000 });
  let j = null;
  try { j = JSON.parse(String(r.stdout).trim().split('\n').pop()); } catch { /* sem JSON */ }
  const hojeMs = Date.parse(`${hoje}T00:00:00Z`);
  let t;
  if (!j || j.erro) t = 'backup do estado FALHOU (sem resultado): ver scripts/backupEstado.js';
  else if (j.falhas.length || j.recusados.length) t = `backup do estado incompleto: ${j.falhas.length} falha(s), ${j.recusados.length} recusado(s) por segurança`;
  else if (!j.ultimoBackup || hojeMs - Date.parse(`${j.ultimoBackup}T00:00:00Z`) > 2 * 24 * 3600e3) t = `backup do estado sem rodar há mais de 2 dias (último: ${j.ultimoBackup || 'nenhum'})`;
  if (t) {
    falha(t);
    fs.appendFileSync(path.join(RAIZ, 'relatorios/ESTADO-GERAL.md'), `\n- [${hoje}] PRECISA DE VOCÊ: ${t}\n`, 'utf8');
  }
}
const secao = (t) => linhas.push('', `## ${t}`);
const http = async (url, opcoes = {}) => { try { return await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), ...opcoes }); } catch (e) { return { status: 0, erro: e.message }; } };

async function paginas() {
  secao('1. Site e landings (HTTP)');
  for (const p of ['/', '/blog', '/mentoria', '/linkedin', '/youtube', '/instagram', '/links', '/privacidade', '/sitemap-index.xml']) {
    const r = await http(`${SITE}${p}`);
    (r.status === 200 ? ok : falha)(`${p}: HTTP ${r.status}`);
  }
}

async function instagram(d) {
  secao('2. Instagram: token, fila e publicações');
  const v = spawnSync(process.execPath, ['backend/scripts/redes/verificarToken.js'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  let t = null; try { t = JSON.parse(String(v.stdout).slice(String(v.stdout).indexOf('{'), String(v.stdout).lastIndexOf('}') + 1)); } catch { /* sem JSON */ }
  if (!t) falha('não consegui verificar o token do Instagram');
  else {
    (t.veredito === 'TOKEN VÁLIDO' ? ok : falha)(`token: ${t.veredito} · conta ${t.conta && t.conta.usuario} · vence em ${t.renovacaoAutomatica && t.renovacaoAutomatica.venceEm} (${t.renovacaoAutomatica && t.renovacaoAutomatica.diasRestantes} dias)`);
    if (t.renovacaoAutomatica && t.renovacaoAutomatica.diasRestantes < 14) falha('token do Instagram vence em menos de 14 dias');
    if (hoje >= '2026-10-19') (t.renovacaoAutomatica && t.renovacaoAutomatica.ultimaRenovacao ? ok : aviso)(`origem do token / última renovação pelo cron: ${(t.renovacaoAutomatica && t.renovacaoAutomatica.ultimaRenovacao) || 'ainda não registrada (o cron renova às segundas, 12:00 UTC)'}`);
    if (t.filaPausada) falha('fila do Instagram PAUSADA por token inválido');
  }
  const col = (n) => d.collection(n);
  const cfg = (await col('redes_v2_config').findOne({ _id: 'instagram' })) || {};
  linhas.push(`- carrossel automático liberado: ${cfg.carrosselLiberado === true ? 'sim' : 'NÃO'}${cfg.liberadoEm ? ` (em ${new Date(cfg.liberadoEm).toISOString()})` : ''}`);
  const agora = new Date();
  const contagem = {}; for (const p of await col('redes_v2').find({}, { projection: { status: 1 } }).toArray()) contagem[p.status] = (contagem[p.status] || 0) + 1;
  linhas.push(`- fila: ${JSON.stringify(contagem)}`);
  const limite = new Date(`${hoje}T12:30:00Z`); // 09:30 de Salvador (a publicação é às 08:00)
  const atrasados = await col('redes_v2').find({ status: 'aprovado-checagem', dataSugerida: { $lt: limite < agora ? limite : agora } }).toArray();
  for (const p of atrasados) (p.adiadoAte && new Date(p.adiadoAte) > agora ? aviso : falha)(`post devido e não publicado: ${p._id}${p.ultimoErro ? ` · último erro: ${p.ultimoErro.slice(0, 120)}` : ''}${p.adiadoAte ? ` · adiado até ${new Date(p.adiadoAte).toISOString().slice(0, 16)}` : ''}`);
  if (!atrasados.length) ok('nenhum post devido sem publicar');
  const presos = await col('redes_v2').find({ status: 'publicando', publicandoDesde: { $lt: new Date(agora.getTime() - 15 * 60000) } }).toArray();
  for (const p of presos) falha(`post preso em "publicando" há mais de 15 min: ${p._id} (não republicar sem olhar no Instagram)`);
  const logs = await col('redes_v2_log').find({ em: { $gte: new Date(agora.getTime() - 26 * 3600e3) }, nivel: { $in: ['alerta', 'erro'] } }).sort({ em: -1 }).limit(10).toArray();
  for (const l of logs) falha(`log ${l.nivel} (${l.postId || '-'}): ${String(l.mensagem).slice(0, 160)}`);
  if (!logs.length) ok('sem alertas nem erros no log das últimas 26 h');
  // publicados hoje e a partir de 26/10: confere pela Meta (só leitura): itens, link, ID, legenda
  const publicados = await col('redes_v2').find({ status: 'publicado', publicadoEm: { $gte: new Date(`${hoje}T03:00:00Z`) } }).toArray();
  const sp = require('../../backend/lib/socialPublisher');
  for (const p of publicados) {
    if (!p.instagramId) { falha(`${p._id}: publicado sem ID da Meta`); continue; }
    const r = await sp.conferirPublicacaoInstagram(p.instagramId, p.checagem && p.checagem.hashes ? p.checagem.hashes.length : undefined).catch((e) => ({ ok: false, falhas: [e.message] }));
    (r.ok ? ok : falha)(`${p._id}: na Meta ${p.instagramId} · ${r.itens} itens · ${r.permalink || 'sem link'}${r.falhas && r.falhas.length ? ' · ' + r.falhas.join('; ') : ''}`);
    const e = checarEticaCfm(p.legenda || '', { contexto: 'social' }).falhas;
    (e.length ? falha : ok)(`${p._id}: legenda ${e.length ? e.join('; ') : 'conforme (CFM, 3 linhas, CVV/SAMU, aviso de IA)'}`);
    if (!/Dr\. Antônio Felipe · Médico · CRM-BA 41322/.test(p.legenda || '')) falha(`${p._id}: legenda sem a assinatura de 3 linhas`);
  }
  if (hoje >= '2026-10-26') {
    const primeiro = await col('redes_v2').findOne({ _id: '2026-10-26-saude-mental-cuidador' });
    if (primeiro && primeiro.status === 'publicado') ok(`primeiro post publicado (ID Meta ${primeiro.instagramId}, verificação: ${primeiro.verificacao ? (primeiro.verificacao.ok ? 'ok' : 'FALHOU') : 'sem registro'})`);
    else if (hoje > '2026-10-26' || bahia() > '2026-10-26') falha(`primeiro post (2026-10-26-saude-mental-cuidador) não está publicado (status ${primeiro && primeiro.status})`);
    else aviso(`primeiro post ainda não publicado (status ${primeiro && primeiro.status}); a publicação é às 08:00`);
  }
}

async function narracoesETrava(d) {
  secao('3. Narrações e trava B');
  const docs = await d.collection('artigos').find({}).toArray();
  const estados = {}; let semVinheta = 0;
  for (const a of docs) { const e = estadoNarracao(a).estado; estados[e] = (estados[e] || 0) + 1; if (e !== 'ok' || precisaVinheta(a)) semVinheta += 1; }
  linhas.push(`- estados: ${JSON.stringify(estados)} · sem áudio com vinheta: ${semVinheta} de ${docs.length}`);
  (semVinheta === 0 ? ok : aviso)(`narração com vinheta: ${docs.length - semVinheta}/${docs.length}`);
  const inicio = new Date(`${hoje}T03:00:00Z`);
  const hojePub = docs.filter((a) => a.publicado === true && a.publicadoEm && new Date(a.publicadoEm) >= inicio);
  for (const a of hojePub) {
    const url = estadoNarracao(a).estado === 'ok' ? a.narracao.url : '';
    if (!url) { falha(`texto publicado hoje sem áudio tocável: ${a.slug}`); continue; }
    const r = await http(url, { method: 'HEAD' });
    (r.status === 200 ? ok : falha)(`trava B ${a.slug}: publicado hoje, áudio HTTP ${r.status}, vinheta ${a.narracao.vinhetaVersao === 1 ? 'sim' : 'NÃO'}`);
  }
  // agendados: o MP3 não pode estar acessível pela página antes da data (a página/API não devolve o áudio de texto não publicado)
  const futuros = docs.filter((a) => a.publicado !== true && a.agendamento && a.agendamento.agendado).slice(0, 3);
  for (const a of futuros) { const r = await http(`${SITE}/api/artigos/${a.slug}`); (r.status === 404 || r.status === 200 && !(await r.json().catch(() => ({}))).audioNarracaoUrl ? ok : falha)(`trava B (agendado ${a.slug}): sem áudio exposto antes da data (HTTP ${r.status})`); }
}

function outrasFilas() {
  secao('4. YouTube, LinkedIn e tarefas do Windows');
  try {
    const f = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios/youtube/fila.json'), 'utf8')); const c = {}; f.itens.forEach((i) => { c[i.status] = (c[i.status] || 0) + 1; });
    (c.reprovado || c.bloqueado ? falha : ok)(`YouTube: ${JSON.stringify(c)}`);
    // checagem cruzada (ordem de 20/10/2026): aprovado só com conferência do conferidor, com o mesmo hash
    const CF = require('../youtube/conferenciaFila');
    const div = CF.divergencias(f.itens, CF.lerConferenciaDoDisco(RAIZ));
    if (div.length) falha(`YouTube: ${div.length} divergência(s) entre a fila e o conferidor (ex.: ${div[0].id}: ${div[0].motivo})`);
  } catch (e) { aviso(`YouTube: fila ilegível (${e.message.slice(0, 60)})`); }
  // pasta principal sempre na main (ordem de 27/10/2026): fora da main vira aviso com a ação
  const branchPrincipal = spawnSync('git', ['branch', '--show-current'], { cwd: RAIZ, encoding: 'utf8' }).stdout.trim();
  if (branchPrincipal && branchPrincipal !== 'main') aviso(`pasta principal fora da main (está em ${branchPrincipal}): trocar para a main com a alteração guardada em stash`);
  else ok('pasta principal na main');
  // monitoramento das tarefas DrSM-* (ordem de 20/10/2026): leitura do último resultado; falha vira alerta com a correção
  for (const nome of ['DrSM-LinkedIn-Agendar', 'DrSM-Manutencao-Semanal']) {
    const r = spawnSync('powershell', ['-NoProfile', '-Command', `$i = Get-ScheduledTaskInfo -TaskName '${nome}'; $t = Get-ScheduledTask -TaskName '${nome}'; "$($i.LastTaskResult)|$($t.State)"`], { encoding: 'utf8', timeout: 30000 });
    const [res, estado] = String(r.stdout || '').trim().split('|');
    const codigo = parseInt(res, 10);
    if (Number.isNaN(codigo)) { aviso(`tarefa ${nome}: resultado não lido (verificar o Agendador)`); continue; }
    const a = require('./monitorTarefas').avaliarTarefa({ nome, ultimoResultado: codigo, estado: (estado || '').trim(), hoje });
    linhas.push(`- ${nome}: LastTaskResult ${codigo} → ${require('./codigosTarefa').interpretarResultado(codigo)}`);
    if (a === 'ok') continue;
    if (a.aviso) aviso(a.aviso); else falha(a.alerta);
  }
  const li = spawnSync(process.execPath, ['scripts/linkedin/filaManual.js', 'estado'], { cwd: RAIZ, encoding: 'utf8', timeout: 30000 });
  const linha = String(li.stdout).trim().split('\n').pop();
  linhas.push(`- LinkedIn: ${linha}`);
  if (/atrasados (\d+)/.test(linha) && Number(RegExp.$1) > 0) falha(`LinkedIn: ${RegExp.$1} post(s) atrasado(s)`);
  const ps = spawnSync('powershell', ['-NoProfile', '-Command', "Get-ScheduledTask -TaskName 'DrSM-*' | ForEach-Object { $i=$_ | Get-ScheduledTaskInfo; \"$($_.TaskName)|$($i.LastTaskResult)|$($i.LastRunTime.ToString('yyyy-MM-dd'))|$($i.NextRunTime.ToString('yyyy-MM-dd HH:mm'))\" }"], { encoding: 'utf8', timeout: 30000 });
  for (const l of String(ps.stdout).trim().split('\n').filter(Boolean)) {
    const [nome, res, ult, prox] = l.trim().split('|');
    if (/^Conferencia-(19|26)-10$/.test(nome.replace('DrSM-', '')) && prox > hoje) { linhas.push(`- ${nome}: aguardando a data (próxima ${prox})`); continue; }
    (res === '0' || res === '267011' ? ok : aviso)(`${nome}: último resultado ${res} em ${ult}; próxima ${prox}`);
  }
}

function alertaNoEstadoGeral() {
  if (process.argv.includes('--sem-alerta')) return;
  const eg = path.join(RAIZ, 'relatorios/ESTADO-GERAL.md');
  if (!fs.existsSync(eg)) return;
  let t = fs.readFileSync(eg, 'utf8');
  const re = /<!-- ALERTA-REDES:INICIO -->[\s\S]*?<!-- ALERTA-REDES:FIM -->\n?/;
  const bloco = falhas.length ? `<!-- ALERTA-REDES:INICIO -->\n> # 🚨 ALERTA DAS REDES (${hoje}): ${falhas.length} falha(s) na conferência diária\n${falhas.map((f) => `> - ${f}`).join('\n')}\n> Detalhes: relatorios/conferencias/${hoje}.md\n<!-- ALERTA-REDES:FIM -->\n` : '';
  if (re.test(t)) t = t.replace(re, bloco); else if (bloco) { const i = t.indexOf('\n'); t = t.slice(0, i + 1) + bloco + t.slice(i + 1); }
  fs.writeFileSync(eg, t, 'utf8');
}

(async () => {
  await db.connect();
  const d = mongoose.connection.db;
  for (const passo of [paginas, () => instagram(d), () => narracoesETrava(d), outrasFilas, alertaCustoDoDia]) { try { await passo(); } catch (e) { falha(`passo falhou: ${String(e.message).slice(0, 160)}`); } }
  // Backup do estado: passo isolado (falha vira alerta com ação; a conferência segue). Gravação à parte, na mesma tarefa.
  try { backupDoEstado(); } catch (e) { falha(`backup do estado falhou: ${String(e.message).slice(0, 160)}`); }
  const pasta = path.join(RAIZ, 'relatorios/conferencias'); fs.mkdirSync(pasta, { recursive: true });
  const md = `# Conferência diária — ${hoje}\n\n**Resultado: ${falhas.length ? `${falhas.length} FALHA(S)` : 'tudo certo'}${avisos.length ? ` · ${avisos.length} aviso(s)` : ''}** (somente leitura: nada foi publicado, apagado nem alterado; freios intactos)\n${linhas.join('\n')}\n`;
  fs.writeFileSync(path.join(pasta, `${hoje}.md`), md, 'utf8');
  try { // resumo do dia (máx. 15 linhas): falha exige ação; aviso, não
    const resumo = require('./resumoDoDia');
    const dados = await resumo.coletar(d, hoje);
    const alertas = [...falhas.map((texto) => ({ texto, acao: true })), ...avisos.map((texto) => ({ texto, acao: false }))];
    const { alertaValidade, lerVenceEm } = require('../youtube/validadeAutorizacao');
    const { contarPendentes } = require('../ollamaStatus');
    const validade = alertaValidade({ hoje, venceEm: lerVenceEm() });
    const credToken = await d.collection('credencials').findOne({ chave: 'instagram_access_token' }, { projection: { expiraEm: 1, renovadoEm: 1 } }).catch(() => null);
    const tokenIG = require('./alertaToken').alertaTokenInstagram({ hoje, expiraEm: credToken?.expiraEm || null });
    const tokenSemanal = require('./alertaToken').checagemRenovacaoSemanal({ hoje, renovadoEm: credToken?.renovadoEm || null, expiraEm: credToken?.expiraEm || null });
    const diagPub = await d.collection('diagnosticos_publicacao').findOne({ _id: 'instagram' }).catch(() => null);
    const alertaDiag = require('./alertaToken').alertaDiagnostico({ agora: new Date(), diag: diagPub });
    if (alertaDiag) fs.appendFileSync(path.join(RAIZ, 'relatorios/ESTADO-GERAL.md'), `
- [${hoje}] ${alertaDiag.texto}
`, 'utf8');
    const pendentesOllama = contarPendentes(path.join(RAIZ, 'relatorios/youtube/reprovados/estado-regeracao.json'));
    resumo.gravar(resumo.montarResumo({ hoje, ...dados, alertas: [...(validade ? [validade] : []), ...(tokenIG ? [tokenIG] : []), ...(tokenSemanal ? [tokenSemanal] : []), ...(alertaDiag ? [alertaDiag] : []), ...alertas], pendentesOllama }));
  } catch (e) { console.error(`resumo do dia não gerado: ${e.message}`); }
  alertaNoEstadoGeral();
  if (falhas.length) { // e-mail só se RESEND_API_KEY existir (desligado até lá)
    const { enviarAlerta } = require('../alertas/enviarAlerta');
    const r = await enviarAlerta({ assunto: `${falhas.length} falha(s) na conferência ${hoje}`, texto: `${falhas.map((f) => `- ${f}`).join('\n')}\n\nDetalhes: relatorios/conferencias/${hoje}.md` });
    if (!r.enviado) console.log(`e-mail de alerta não enviado: ${r.motivo}`);
  }
  console.log(`conferência ${hoje}: ${falhas.length} falha(s), ${avisos.length} aviso(s) → relatorios/conferencias/${hoje}.md`);
  await mongoose.disconnect();
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(2); });
