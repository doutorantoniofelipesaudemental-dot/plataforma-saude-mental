/**
 * Troca as legendas das peças 11–17/11 da fila (conteudo/redes-v2) pela versão com a identificação de 5 linhas.
 * Ordem de 10/11/2026, 00:05 (item 2). Padrão: DRY-RUN (só mostra o que faria).
 *
 *   node scripts/redes/trocarLegendasFila11a17.js                     -> dry-run
 *   node scripts/redes/trocarLegendasFila11a17.js --backup            -> copia legenda.txt e meta.json para backups/
 *   node scripts/redes/trocarLegendasFila11a17.js --aplicar           -> grava as legendas novas (exige --backup antes)
 *   node scripts/redes/trocarLegendasFila11a17.js --conferir          -> confere 5 linhas, CVV e ausência de oferta
 *   node scripts/redes/trocarLegendasFila11a17.js --reverter          -> devolve legenda.txt e meta.json do backup mais recente
 *
 * Efeito em meta.json: status vira "pendente-rechecagem" (o publicador não publica peça sem nova checagem).
 * A arte (última lâmina, assinatura de 3 linhas) NÃO é alterada por este script.
 * Freio REDES_PUBLICACAO_ATIVA: não tocado.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
// A fila e os backups são estado fora do Git: na pasta principal. Em worktree, passe REDES_FILA e REDES_BACKUPS.
const FILA = process.env.REDES_FILA || path.join(RAIZ, 'conteudo', 'redes-v2');
const PROPOSTAS = process.env.REDES_PROPOSTAS || path.join(RAIZ, '.tmp', 'es-piloto-20261110', 'redes-11-17-propostas');
const BACKUPS = process.env.REDES_BACKUPS || path.join(RAIZ, 'backups');
const RE_PEÇA = /^2026-11-(1[1-7])-/;
const IDENTIFICACAO = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade — RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
];
const RE_OFERTA = /tipo=particular|agendar uma avalia|solicitar consulta|mentoria individual|wa\.me|whatsapp/i;

const args = new Set(process.argv.slice(2));
const pecas = fs.readdirSync(FILA).filter((d) => RE_PEÇA.test(d)).sort();
const agora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function listar() {
  return pecas.map((d) => ({
    d,
    dir: path.join(FILA, d),
    legAtual: path.join(FILA, d, 'legenda.txt'),
    meta: path.join(FILA, d, 'meta.json'),
    proposta: path.join(PROPOSTAS, d, 'legenda.txt'),
  }));
}

function conferir(texto) {
  const erros = [];
  const linhas = IDENTIFICACAO.filter((l) => texto.replace(/\s+/g, ' ').includes(l.replace(/\s+/g, ' ')));
  if (linhas.length !== IDENTIFICACAO.length) erros.push(`identificação: ${linhas.length}/5 linhas`);
  if (!/CVV 188/.test(texto) || !/SAMU 192/.test(texto)) erros.push('sem CVV 188 · SAMU 192');
  if (RE_OFERTA.test(texto)) erros.push('oferta individual no texto');
  return erros;
}

function dryRunOuAplicar(aplicar) {
  let ok = 0;
  for (const p of listar()) {
    if (!fs.existsSync(p.proposta)) { console.log(`${p.d}: sem proposta, pulado`); continue; }
    const nova = fs.readFileSync(p.proposta, 'utf8');
    const erros = conferir(nova);
    if (erros.length) { console.log(`${p.d}: NÃO aplicar (${erros.join('; ')})`); continue; }
    const atual = fs.readFileSync(p.legAtual, 'utf8');
    console.log(`${p.d}: ${atual === nova ? 'já igual' : `trocar legenda (${atual.length} → ${nova.length} caracteres)`}; status → pendente-rechecagem`);
    if (aplicar && atual !== nova) {
      fs.writeFileSync(p.legAtual, nova, 'utf8');
      const meta = JSON.parse(fs.readFileSync(p.meta, 'utf8'));
      meta.status = 'pendente-rechecagem';
      meta.legendaRevisadaEm = new Date().toISOString();
      fs.writeFileSync(p.meta, JSON.stringify(meta, null, 2), 'utf8');
    }
    ok += 1;
  }
  console.log(aplicar ? `aplicadas: ${ok}` : `dry-run: ${ok} peça(s) prontas. Use --backup e depois --aplicar.`);
}

function backup() {
  const destino = path.join(BACKUPS, `redes-11-17-legendas-${agora}`);
  fs.mkdirSync(destino, { recursive: true });
  for (const p of listar()) {
    const pasta = path.join(destino, p.d);
    fs.mkdirSync(pasta, { recursive: true });
    fs.copyFileSync(p.legAtual, path.join(pasta, 'legenda.txt'));
    fs.copyFileSync(p.meta, path.join(pasta, 'meta.json'));
  }
  const aberto = listar().filter((p) => fs.existsSync(path.join(destino, p.d, 'legenda.txt'))).length;
  console.log(`backup em ${destino}: ${aberto} peça(s) (conferido)`);
}

function reverter() {
  const todos = fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS).filter((n) => n.startsWith('redes-11-17-legendas-')).sort() : [];
  if (!todos.length) { console.log('nenhum backup encontrado'); return; }
  const ultimo = path.join(BACKUPS, todos[todos.length - 1]);
  for (const p of listar()) {
    const origem = path.join(ultimo, p.d);
    if (!fs.existsSync(origem)) continue;
    fs.copyFileSync(path.join(origem, 'legenda.txt'), p.legAtual);
    fs.copyFileSync(path.join(origem, 'meta.json'), p.meta);
  }
  console.log(`revertido a partir de ${ultimo}`);
}

function conferirFila() {
  let falhas = 0;
  for (const p of listar()) {
    const texto = fs.readFileSync(p.legAtual, 'utf8');
    const erros = conferir(texto);
    const status = JSON.parse(fs.readFileSync(p.meta, 'utf8')).status;
    console.log(`${p.d}: ${erros.length ? 'FALHA — ' + erros.join('; ') : 'ok'} · status ${status}`);
    if (erros.length) falhas += 1;
  }
  console.log(falhas ? `${falhas} peça(s) com falha` : 'todas as peças conferem');
  process.exitCode = falhas ? 1 : 0;
}

if (args.has('--reverter')) reverter();
else if (args.has('--conferir')) conferirFila();
else if (args.has('--backup')) backup();
else dryRunOuAplicar(args.has('--aplicar'));
