/**
 * Auditoria dos roteiros de Stories, Carrosséis e Reels em CONTEUDO_INSTAGRAM (todos os .md;
 * a pasta pautas/ é de artigos e fica de fora). Só lê: não altera nenhum arquivo.
 *
 * Por arquivo:
 *   - identificação: CRM-BA 41322 e RQE 26638;
 *   - atuação: a linha "Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)";
 *   - normas CFM: aviso da Res. CFM 2.454/2026, termos/promessas vetados, sensacionalismo, veto de
 *     "psiquiatra" e CVV 188 em tema sensível (as mesmas regras de backend/lib/checagensAprovacao.js).
 * Por peça (cada Reel, o Carrossel e os Stories):
 *   - CTA de Mentoria (a palavra "mentoria" no texto da peça).
 *
 *   npm run audit:instagram                    (resumo por arquivo)
 *   npm run audit:instagram -- --detalhe       (lista cada falha, inclusive por Reel)
 *   npm run audit:instagram -- --arquivo=aprovados/burnout-aps.md
 *   npm run audit:instagram -- --autocorrigir [--dry-run]  (insere assinatura CFM, atuação PAP/APS, CVV e aviso; depois audita)
 *   npm run audit:instagram -- --falhar       (código de saída 1 se houver falha — para CI)
 */
const fs = require('fs');
const path = require('path');
const { checarEticaCfm } = require('../lib/checagensAprovacao');
const { AVISO_CFM, IDENTIFICACAO_COMPLETA, LINHA_CVV } = require('../lib/conformidadeCfm');

const PASTA = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM');
const PASTAS_FORA = new Set(['pautas']);

const RE_ATUACAO = /Atuo em Pronto Atendimento Psiqui[aá]trico[^\n]*Aten[cç][aã]o Prim[aá]ria/i;
const RE_MENTORIA = /\bmentoria\b/i;
const LINHA_ATUACAO = IDENTIFICACAO_COMPLETA.split('\n').find((l) => /^Atuo em/.test(l));
// Rol de pós-graduações, com Terapia Cognitivo-Comportamental (TCC); a versão antiga, sem TCC, é substituída.
const LINHA_POS = IDENTIFICACAO_COMPLETA.split('\n').find((l) => /^Pós-graduação em/.test(l));
const RE_LINHA_POS_ANTIGA = /^Pós-graduação em .*$/m;

// Falsos positivos do detector de CFM: a menção negada ("sem milagres", "não promete cura") e a menção
// meta ("em nenhum lugar o autor é chamado de psiquiatra") não são promessa nem título indevido.
const NEGACAO = '(?:sem|nem|nunca|nenhum[a]?|nada de|não)';
const RE_PROMESSA_NEGADA = new RegExp(`\\b${NEGACAO}\\s+(?:\\p{L}+\\s+){0,2}(?:milagr\\p{L}*|cura\\p{L}*|garant\\p{L}*)`, 'giu');
const RE_VETO_NEGADO = /(?:em nenhum lugar|nunca|não|sem|vetad[oa]|proibid[oa]|chamado de)[^.\n]{0,200}(?:especialista em (?:psiquiatria|sa[uú]de mental)|psiquiatra)/gi;
// Caixa alta legítima: direções de cena (texto na tela, áudio, trilha…), código inline e siglas de periódico/arquivo.
const RE_DIRECAO_DE_CENA = /^[ \t>*_-]*\**(?:texto na tela|[aá]udio sugerido|trilha|visual|cena|corte|dire[cç][aã]o de cena|b-roll|overlay|legenda na tela|hashtags? extras?)\b.*$/gim;
const SIGLAS_NO_TEXTO = /\b(?:IJERPH|CLAUDE)\b/g;

// Linhas do relatório das checagens do próprio bot ("- ⚠️ CFM: linguagem de milagre…") citam o termo apontado.
const RE_LINHA_DE_RELATORIO = /^\s*-\s*(?:⚠️|🟠|🔴|✅)[^\n]*$/gm;
const semNegacoes = (t) => t.replace(RE_LINHA_DE_RELATORIO, ' ').replace(RE_PROMESSA_NEGADA, ' ').replace(RE_VETO_NEGADO, ' ');
const semDirecoes = (t) => t.replace(RE_DIRECAO_DE_CENA, ' ').replace(/`[^`\n]*`/g, ' ').replace(SIGLAS_NO_TEXTO, ' ');
const ehCaixaAlta = (f) => /^sensacionalismo: caixa alta/.test(f);

/** Formato de uma seção pelo título; ganchos, LinkedIn e YouTube não são roteiros de Instagram. */
function formatoDoTitulo(titulo) {
  if (/gancho/i.test(titulo)) return null;
  if (/^reel\b/i.test(titulo)) return 'Reels';
  if (/^carrossel\b/i.test(titulo)) return 'Carrossel';
  if (/^stor(?:y|ies)\b/i.test(titulo)) return 'Stories';
  return null;
}

/** Peças do arquivo: cada seção de Reel, de Carrossel ou de Stories (com as subseções dela). */
function extrairPecas(md) {
  const linhas = String(md).replace(/\r\n/g, '\n').split('\n');
  const pecas = [];
  let atual = null;
  for (const l of linhas) {
    const h = l.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (h) {
      const nivel = h[1].length;
      const formato = formatoDoTitulo(h[2]);
      // Um título de Reel/Carrossel/Stories abre peça nova em qualquer nível; subseções (Legenda…) ficam na peça.
      if (atual && (formato || nivel <= atual.nivel)) { pecas.push(atual); atual = null; }
      if (formato) { atual = { formato, titulo: h[2], nivel, linhas: [] }; continue; }
    }
    if (atual) atual.linhas.push(l);
  }
  if (atual) pecas.push(atual);
  return pecas.map(({ formato, titulo, linhas: ls }) => ({ formato, titulo, texto: ls.join('\n') }));
}

function auditarTexto(md) {
  const falhas = [];
  const t = String(md);
  if (!/CRM-BA 41322/.test(t)) falhas.push({ codigo: 'crm', mensagem: 'sem CRM-BA 41322' });
  if (!/RQE 26638/.test(t)) falhas.push({ codigo: 'rqe', mensagem: 'sem RQE 26638' });
  if (!RE_ATUACAO.test(t)) falhas.push({ codigo: 'atuacao', mensagem: 'sem a atuação em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária (APS)' });
  if (!t.includes(LINHA_POS)) falhas.push({ codigo: 'pos-graduacao', mensagem: 'sem a linha de pós-graduações (Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho)' });
  if (!t.includes(AVISO_CFM)) falhas.push({ codigo: 'aviso-cfm', mensagem: 'sem o aviso da Res. CFM 2.454/2026' });
  const opcoes = { contexto: 'social', exigirIdentificacao: false };
  const base = semNegacoes(t);
  const normas = [
    ...checarEticaCfm(base, opcoes).falhas.filter((f) => !ehCaixaAlta(f)),
    ...checarEticaCfm(semDirecoes(base), opcoes).falhas.filter(ehCaixaAlta),
  ];
  for (const f of normas) falhas.push({ codigo: /CVV 188/.test(f) ? 'cvv' : 'cfm', mensagem: f });

  const pecas = extrairPecas(t);
  for (const p of pecas) {
    if (!RE_MENTORIA.test(p.texto)) falhas.push({ codigo: 'cta-mentoria', mensagem: `sem CTA de Mentoria`, peca: `${p.formato}: ${p.titulo}` });
  }
  const formatos = [...new Set(pecas.map((p) => p.formato))];
  return { formatos, pecas: pecas.length, falhas };
}

/**
 * Insere o que falta e é padronizado: assinatura completa do CFM (CRM-BA, RQE e atuação), a linha de atuação
 * PAP/APS, o CVV 188 (tema sensível) e o aviso da Res. CFM 2.454/2026 — sempre no fim do arquivo, sem repetir
 * o que já existe. CTA de Mentoria e termos vetados dependem de decisão editorial e ficam para revisão.
 */
function autocorrigirTexto(md) {
  let t = String(md).replace(/\s+$/, '');
  const codigos = new Set(auditarTexto(t).falhas.map((f) => f.codigo));
  const inseridos = [];
  if (codigos.has('crm') || codigos.has('rqe')) {
    t += `\n\n${IDENTIFICACAO_COMPLETA}`;
    inseridos.push('assinatura CFM');
  } else if (codigos.has('atuacao')) {
    const linhas = t.split('\n');
    const i = linhas.findIndex((l) => /Especialista em Medicina de Fam[ií]lia e Comunidade\s*·\s*RQE 26638/.test(l));
    if (i >= 0) linhas.splice(i + 1, 0, LINHA_ATUACAO);
    else linhas.push('', LINHA_ATUACAO);
    t = linhas.join('\n');
    inseridos.push('linha de atuação PAP/APS');
  }
  if (!t.includes(LINHA_POS)) {
    if (RE_LINHA_POS_ANTIGA.test(t)) t = t.replace(RE_LINHA_POS_ANTIGA, LINHA_POS);
    else {
      const linhas = t.split('\n');
      const i = linhas.findIndex((l) => l.startsWith('Atuo em Pronto Atendimento'));
      if (i >= 0) linhas.splice(i + 1, 0, LINHA_POS);
      else linhas.push('', LINHA_POS);
      t = linhas.join('\n');
    }
    inseridos.push('pós-graduações (com TCC)');
  }
  if (codigos.has('cvv') && !/CVV 188/.test(t)) { t += `\n\n${LINHA_CVV}`; inseridos.push('CVV 188'); }
  if (!t.includes(AVISO_CFM)) { t += `\n\n${AVISO_CFM}`; inseridos.push('aviso CFM'); }
  return { texto: `${t}\n`, inseridos };
}

/** Aplica autocorrigirTexto aos arquivos (grava, salvo em dryRun). Retorna só os que mudaram. */
function autocorrigirPasta({ pasta = PASTA, arquivo = null, dryRun = false } = {}) {
  const arquivos = arquivo ? [arquivo] : listarMarkdown(pasta);
  const alterados = [];
  for (const a of arquivos) {
    const caminho = path.join(pasta, a);
    const { texto, inseridos } = autocorrigirTexto(fs.readFileSync(caminho, 'utf8'));
    if (!inseridos.length) continue;
    if (!dryRun) fs.writeFileSync(caminho, texto);
    alterados.push({ arquivo: a, inseridos });
  }
  return alterados;
}

function listarMarkdown(pasta = PASTA, base = pasta) {
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(pasta, e.name);
    if (e.isDirectory()) return PASTAS_FORA.has(e.name) && pasta === base ? [] : listarMarkdown(p, base);
    return e.name.endsWith('.md') ? [path.relative(base, p).split(path.sep).join('/')] : [];
  }).sort();
}

function auditarPasta({ pasta = PASTA, arquivo = null } = {}) {
  const arquivos = arquivo ? [arquivo] : listarMarkdown(pasta);
  return arquivos.map((a) => ({ arquivo: a, ...auditarTexto(fs.readFileSync(path.join(pasta, a), 'utf8')) }));
}

function argumentos(argv = process.argv.slice(2)) {
  const args = {};
  for (const a of argv) {
    const [chave, ...resto] = a.replace(/^--/, '').split('=');
    args[chave] = resto.length ? resto.join('=') : true;
  }
  return args;
}

function main() {
  const args = argumentos();
  const arquivo = typeof args.arquivo === 'string' ? args.arquivo : null;
  if (args.autocorrigir) {
    const dryRun = Boolean(args['dry-run']);
    const alterados = autocorrigirPasta({ arquivo, dryRun });
    for (const a of alterados) console.log(`  [${dryRun ? 'a corrigir' : 'corrigido'}] ${a.arquivo}: ${a.inseridos.join(', ')}`);
    console.log(`\n${alterados.length} arquivo(s) ${dryRun ? 'a corrigir' : 'corrigido(s)'}.${dryRun ? '' : ' Auditoria após a correção:\n'}`);
    if (dryRun) return;
  }
  const resultados = auditarPasta({ arquivo });
  let totalFalhas = 0;
  let limpos = 0;
  for (const r of resultados) {
    const formatos = r.formatos.length ? r.formatos.join('/') : 'sem Stories/Carrossel/Reels identificados';
    totalFalhas += r.falhas.length;
    if (!r.falhas.length) { limpos++; console.log(`  [ok] ${r.arquivo} (${formatos})`); continue; }
    const porCodigo = {};
    for (const f of r.falhas) porCodigo[f.codigo] = (porCodigo[f.codigo] || 0) + 1;
    console.log(`  [${r.falhas.length} falha(s)] ${r.arquivo} (${formatos}; ${r.pecas} peça(s)) — ${Object.entries(porCodigo).map(([c, n]) => (n > 1 ? `${c} ×${n}` : c)).join(', ')}`);
    if (args.detalhe) for (const f of r.falhas) console.log(`      ${f.peca ? `${f.peca} — ` : ''}${f.mensagem}`);
  }
  console.log(`\n${resultados.length} arquivo(s) auditado(s): ${limpos} sem falhas, ${resultados.length - limpos} com falhas (${totalFalhas} no total).`);
  if (!args.detalhe && totalFalhas) console.log('Use --detalhe para ver cada falha.');
  if (args.falhar && totalFalhas) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { autocorrigirTexto, autocorrigirPasta, extrairPecas, auditarTexto, listarMarkdown, auditarPasta, formatoDoTitulo, argumentos };
