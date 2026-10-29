/**
 * PORTÃO ÚNICO DE QUALIDADE (CLAUDE.md): auditoria geral → tripla checagem dos itens alterados → build → testes unitários → e2e.
 * Para no primeiro erro. Grava relatorios/portao-AAAAMMDD-HHMM.md.
 *   npm run portao                      itens alterados em relação a origin/main (commits + árvore de trabalho + novos)
 *   npm run portao -- --base=<ref>      outra base de comparação
 *   npm run portao -- --so-checagem     só auditoria + tripla (sem build/testes), para uso interno rápido
 * Tripla checagem dos alterados (determinística, sem LLM; a revisão científica de CONTEÚDO NOVO é do modelo principal):
 *   técnica     checarTexto (marcadores, encoding, referências, identificação única), "Antonio" sem acento, mensageria de terceiros;
 *   científica  todo DOI/PMID citado existe e não foi retratado (Crossref/PubMed, lib/retratacoes);
 *   ética       checarEticaCfm (Res. CFM 2.336/2023 e 2.454/2026), "psiquiatra" como título, #psiquiatria, CVV 188 em tema sensível;
 *   humanizada  checarHumanizacao + culpa/estigma de checarTexto; imagens alteradas: sem marca d'água.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith('--base=')) || '--base=origin/main').split('=')[1];
const soChecagem = args.includes('--so-checagem');
// Lição de 28/10/2026: um portão por vez, em qualquer caminho (publicarBranch, merge-seguro, manutenção, direto).
// Dois portões ao mesmo tempo brigavam pela porta do e2e. Quem chega com a trava ocupada espera (lib/portaoTrava).
const { aguardarTravaSync, soltarTrava } = require('./lib/portaoTrava');
const { encerrarTesteOrfao } = require('./lib/encerrarTesteOrfao');
aguardarTravaSync({ aviso: (m) => console.log(`PORTÃO: ${m}`) });
// Lição de 28/10/2026: um portão interrompido deixava o servidor de teste (porta 3000) e navegadores vivos, e o
// portão seguinte reaproveitava esse servidor e caía no meio. Com a trava na mão, limpa os órfãos antes de começar
// e de novo ao sair, e só então solta a trava. Não há handler de SIGINT: ele mataria o processo sem disparar 'exit'
// (a trava velha é tomada pelo próximo portão, pelo pid morto). Dentro do spawnSync um handler não rodaria a tempo.
const limparTeste = () => { const mortos = encerrarTesteOrfao(); if (mortos.length) console.log(`PORTÃO: encerrados órfãos de teste (pids ${mortos.join(', ')})`); };
limparTeste();
process.on('exit', () => { limparTeste(); soltarTrava(); });
// Lição de 23/10/2026: o portão só roda com a branch local igual ao remoto (senão aprova código velho).
const sincronia = require('./lib/branchSincronizado').lerSincronia(RAIZ);
if (!sincronia.ok) { console.log(`PORTÃO NÃO EXECUTADO: ${sincronia.motivo}`); process.exit(1); }
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const agora = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const carimbo = `${agora.getFullYear()}${p2(agora.getMonth() + 1)}${p2(agora.getDate())}-${p2(agora.getHours())}${p2(agora.getMinutes())}`;
const RELATORIO = path.join(RAIZ, 'relatorios', `portao-${carimbo}.md`);
const etapas = [];

function git(...a) {
  const r = spawnSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : '';
}

function gravar(final) {
  const linhas = [`# Portão de qualidade — ${agora.toLocaleString('pt-BR')}`, '', `Base de comparação: \`${base}\` · resultado: **${final}**`, '', '| Etapa | Resultado | Detalhe |', '|---|---|---|'];
  for (const e of etapas) linhas.push(`| ${e.nome} | ${e.ok ? 'OK' : 'FALHOU'} | ${String(e.detalhe || '').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 400)} |`);
  const falhou = etapas.find((e) => !e.ok);
  if (falhou && falhou.itens?.length) linhas.push('', `## Falhas de "${falhou.nome}"`, '', ...falhou.itens.slice(0, 200).map((i) => `- ${i}`));
  fs.mkdirSync(path.dirname(RELATORIO), { recursive: true });
  fs.writeFileSync(RELATORIO, linhas.join('\n') + '\n', 'utf8');
}

function encerrar(ok) {
  const final = ok ? 'APROVADO' : 'REPROVADO';
  gravar(final);
  console.log(`\nPORTÃO ${final} · relatório: ${path.relative(RAIZ, RELATORIO)}`);
  if (!ok) { const f = etapas.find((e) => !e.ok); console.log(`Parou em "${f.nome}": ${f.detalhe}`); }
  process.exit(ok ? 0 : 1);
}

function comando(nome, cmd, cmdArgs) {
  console.log(`\n=== ${nome} ===`);
  const r = spawnSync(cmd, cmdArgs, { cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32' && cmd === NPM });
  const ok = r.status === 0;
  etapas.push({ nome, ok, detalhe: ok ? 'ok' : `código de saída ${r.status}` });
  if (!ok) encerrar(false);
}

/** Itens alterados: commits da branch em relação à base + árvore de trabalho + arquivos novos não ignorados. */
function itensAlterados() {
  const lista = new Set();
  const add = (txt) => txt.split('\n').map((s) => s.trim()).filter(Boolean).forEach((s) => lista.add(s));
  add(git('diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`));
  add(git('diff', '--name-only', '--diff-filter=ACMR', 'HEAD'));
  add(git('ls-files', '--others', '--exclude-standard'));
  return [...lista].filter((f) => fs.existsSync(path.join(RAIZ, f)) && fs.statSync(path.join(RAIZ, f)).isFile());
}

const EH_TEXTO_ARTIGO = (f) => /^apps\/plataforma-saude-mental\/(src\/content\/artigos|content\/blog)\/.+\.mdx?$/.test(f);
const EH_IMAGEM_PUBLICA = (f) => /\.(png|jpe?g|webp)$/i.test(f) && /^(public|conteudo\/redes-v2|assets\/marca|apps\/plataforma-saude-mental\/public)\//.test(f) && !/^assets\/marca\//.test(f);
const EH_PUBLICAVEL = (f) => /\.(md|mdx|html|txt)$/i.test(f) && /^(public|conteudo|apps\/plataforma-saude-mental\/(src|content)|CONTEUDO_INSTAGRAM|relatorios\/(linkedin|youtube)\/fila-manual)\//.test(f);

async function triplaChecagem() {
  const falhas = [];
  const f = (grupo, arq, msg) => falhas.push(`[${grupo}] ${arq}: ${msg}`);
  const { checarTexto } = require('../backend/lib/auditoriaTexto');
  const { checarEticaCfm, checarHumanizacao, checarImagemSemMarcaDagua } = require('../backend/lib/checagensAprovacao');
  const retr = require('../backend/lib/retratacoes');
  const itens = itensAlterados();
  const textos = [];

  for (const arq of itens) {
    const abs = path.join(RAIZ, arq);
    if (EH_TEXTO_ARTIGO(arq)) {
      const corpo = fs.readFileSync(abs, 'utf8');
      const m = (k) => corpo.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`))?.[1];
      for (const x of checarTexto({ origem: 'mdx', slug: path.basename(arq), titulo: m('titulo'), resumo: m('resumo'), tempoLeitura: corpo.match(/tempoLeitura:\s*(\d+)/)?.[1], corpo })) f(x.grupo, arq, x.msg);
      for (const x of checarEticaCfm(corpo, { contexto: 'portal', exigirIdentificacao: false }).falhas) f('ética', arq, x);
      for (const x of checarHumanizacao(corpo).falhas) f('humanizada', arq, x);
      textos.push({ chave: arq, corpo });
    } else if (EH_PUBLICAVEL(arq)) {
      const corpo = fs.readFileSync(abs, 'utf8');
      if (/wa\.me|api\.whatsapp\.com/i.test(corpo) && !/backend\/lib\/robos\.js/.test(arq)) f('técnica', arq, 'link de mensageria de terceiros');
      if (/Antonio Felipe(?! Garabito Jr\.)/.test(corpo) && !/(mailto|instagram\.com|@|\.com\.br|AntonioNeural)/.test(corpo.match(/.*Antonio Felipe.*/)?.[0] || '')) f('técnica', arq, '"Antonio" sem acento');
      if (/#psiquiatria\b/i.test(corpo)) f('ética', arq, '#psiquiatria é vetado');
      textos.push({ chave: arq, corpo });
    } else if (EH_IMAGEM_PUBLICA(arq)) {
      const r = await checarImagemSemMarcaDagua(fs.readFileSync(abs));
      for (const x of r.falhas) f('técnica', arq, `imagem: ${x}`);
    }
  }

  // fixture versionada da fila de LinkedIn (a fila real fica fora do Git, ordem de 28/10/2026): itens "aprovado-checagem" passam por checarPost
  if (itens.includes('tests/fixtures/linkedin-fila.json')) {
    try {
      const { checarPost } = require('../backend/lib/linkedinChecagem');
      const j = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests/fixtures/linkedin-fila.json'), 'utf8'));
      const lista = Array.isArray(j) ? j : j.itens || [];
      for (const it of lista.filter((i) => i.status === 'aprovado-checagem' && i.texto)) for (const x of checarPost(it)) f('ética', `tests/fixtures/linkedin-fila.json#${it.id || it._id}`, x);
    } catch (e) { f('técnica', 'tests/fixtures/linkedin-fila.json', `ilegível (${e.message})`); }
  }

  // científica: DOI/PMID dos textos alterados (rede indisponível = "não verificado", nunca reprova)
  if (textos.length) {
    try {
      const v = await retr.varrer(textos);
      for (const r of v.retratados) f('científica', r.chaves.join(', '), `${r.id} RETRATADO (${r.titulo || ''})`);
      for (const r of v.inexistentes) f('científica', r.chaves.join(', '), `${r.id} inexistente`);
      console.log(`  referências: ${v.total} conferidas, ${v.naoVerificados} não verificadas (rede)`);
    } catch (e) { console.log(`  varredura de retratações indisponível: ${e.message}`); }
  }
  console.log(`  itens alterados examinados: ${itens.length} (textos: ${textos.length})`);
  return { falhas, total: itens.length };
}

(async () => {
  comando('1. Auditoria geral', process.execPath, ['backend/scripts/auditoria.js', '--falhar']);
  console.log('\n=== 2. Tripla checagem dos itens alterados ===');
  const t = await triplaChecagem();
  etapas.push({ nome: '2. Tripla checagem (técnica, científica, ética, humanizada)', ok: t.falhas.length === 0, detalhe: t.falhas.length ? `${t.falhas.length} falha(s)` : `${t.total} itens, 0 falhas`, itens: t.falhas });
  if (t.falhas.length) { t.falhas.slice(0, 30).forEach((x) => console.log('  ✗ ' + x)); encerrar(false); }
  if (!soChecagem) {
    comando('3. Build', NPM, ['run', 'build']);
    comando('4. Testes unitários', NPM, ['run', 'test:unit']);
    comando('5. E2E completo', NPM, ['run', 'test:e2e']);
  }
  encerrar(true);
})().catch((e) => { etapas.push({ nome: 'erro interno do portão', ok: false, detalhe: e.message }); encerrar(false); });
