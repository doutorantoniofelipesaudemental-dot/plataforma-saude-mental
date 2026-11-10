/**
 * Substitui, na fila (conteudo/redes-v2), as peças 11–17/11 pela versão regenerada com identificação de 5 linhas.
 * Ordem de 10/11/2026, 00:05 (item 2), com autorização escrita para o contexto social (10/11/2026).
 * Padrão: DRY-RUN (só mostra o que faria). Quem roda é o Dr. Antônio, na pasta principal.
 *
 *   node scripts/redes/trocarLegendasFila11a17.js                 -> dry-run
 *   node scripts/redes/trocarLegendasFila11a17.js --backup        -> copia legenda, alt, telas e meta para backups/ (conferido)
 *   node scripts/redes/trocarLegendasFila11a17.js --aplicar       -> grava as peças novas (exige --backup antes)
 *   node scripts/redes/trocarLegendasFila11a17.js --conferir      -> confere 5 linhas, CVV, oferta e assinatura na arte
 *   node scripts/redes/trocarLegendasFila11a17.js --reverter      -> devolve a peça do backup mais recente
 *
 * Efeito: status vira "pendente-rechecagem" (o publicador não publica peça sem nova checagem).
 * Freio REDES_PUBLICACAO_ATIVA: não tocado. Variáveis: REDES_FILA, REDES_ORIGEM (regeradas), REDES_BACKUPS.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const FILA = process.env.REDES_FILA || path.join(RAIZ, 'conteudo', 'redes-v2');
const ORIGEM = process.env.REDES_ORIGEM || path.join(RAIZ, 'conteudo', 'redes-v2');
const BACKUPS = process.env.REDES_BACKUPS || path.join(RAIZ, 'backups');
const RE_PECA = /^2026-11-(1[1-7])-/;
const ARQUIVOS = ['legenda.txt', 'alt.txt', 'meta.json'];
const IDENTIFICACAO = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade — RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
];
const RE_OFERTA = /tipo=particular|agendar uma avalia|solicitar consulta|mentoria individual|wa\.me|whatsapp/i;

const args = new Set(process.argv.slice(2));
const agora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const telasDe = (dir) => fs.readdirSync(dir).filter((f) => /^tela-\d+\.png$/.test(f));
const pecas = () => (fs.existsSync(ORIGEM) ? fs.readdirSync(ORIGEM).filter((d) => RE_PECA.test(d)).sort() : []);

function conferirPeca(dirOrigem) {
  const erros = [];
  const texto = fs.readFileSync(path.join(dirOrigem, 'legenda.txt'), 'utf8').replace(/\s+/g, ' ');
  const linhas = IDENTIFICACAO.filter((l) => texto.includes(l.replace(/\s+/g, ' ')));
  if (linhas.length !== 5) erros.push(`identificação: ${linhas.length}/5 linhas`);
  if (!/CVV 188/.test(texto) || !/SAMU 192/.test(texto)) erros.push('sem CVV 188 · SAMU 192');
  if (RE_OFERTA.test(texto)) erros.push('oferta individual no texto');
  const alt = fs.readFileSync(path.join(dirOrigem, 'alt.txt'), 'utf8');
  if (!alt.includes(IDENTIFICACAO[4])) erros.push('texto alternativo sem a 5ª linha');
  if (!telasDe(dirOrigem).length) erros.push('sem telas');
  return erros;
}

function dryRunOuAplicar(aplicar) {
  let prontas = 0;
  for (const d of pecas()) {
    const origem = path.join(ORIGEM, d);
    const destino = path.join(FILA, d);
    const erros = conferirPeca(origem);
    if (erros.length) { console.log(`${d}: NÃO aplicar (${erros.join('; ')})`); continue; }
    if (!fs.existsSync(destino)) { console.log(`${d}: não existe na fila, pulado`); continue; }
    console.log(`${d}: substituir legenda, alt, ${telasDe(origem).length} tela(s); status → pendente-rechecagem`);
    if (aplicar) {
      for (const f of ARQUIVOS) {
        const meta = f === 'meta.json';
        if (meta) {
          const m = JSON.parse(fs.readFileSync(path.join(origem, f), 'utf8'));
          m.status = 'pendente-rechecagem';
          m.trocadaEm = new Date().toISOString();
          fs.writeFileSync(path.join(destino, f), JSON.stringify(m, null, 2), 'utf8');
        } else fs.copyFileSync(path.join(origem, f), path.join(destino, f));
      }
      for (const t of fs.readdirSync(destino).filter((f) => /^tela-\d+\.png$/.test(f))) fs.rmSync(path.join(destino, t));
      for (const t of telasDe(origem)) fs.copyFileSync(path.join(origem, t), path.join(destino, t));
    }
    prontas += 1;
  }
  console.log(aplicar ? `aplicadas: ${prontas}` : `dry-run: ${prontas} peça(s) prontas. Use --backup e depois --aplicar.`);
}

function backup() {
  const destino = path.join(BACKUPS, `redes-11-17-${agora}`);
  let n = 0;
  for (const d of pecas()) {
    const origem = path.join(FILA, d);
    if (!fs.existsSync(origem)) continue;
    const pasta = path.join(destino, d);
    fs.mkdirSync(pasta, { recursive: true });
    for (const f of [...ARQUIVOS, ...telasDe(origem)]) fs.copyFileSync(path.join(origem, f), path.join(pasta, f));
    n += 1;
  }
  console.log(`backup em ${destino}: ${n} peça(s)`);
}

function reverter() {
  const todos = fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS).filter((n) => n.startsWith('redes-11-17-')).sort() : [];
  if (!todos.length) { console.log('nenhum backup encontrado'); return; }
  const ultimo = path.join(BACKUPS, todos[todos.length - 1]);
  for (const d of fs.readdirSync(ultimo)) {
    const destino = path.join(FILA, d);
    for (const t of telasDe(destino)) fs.rmSync(path.join(destino, t));
    for (const f of fs.readdirSync(path.join(ultimo, d))) fs.copyFileSync(path.join(ultimo, d, f), path.join(destino, f));
  }
  console.log(`revertido a partir de ${ultimo}`);
}

function conferirFila() {
  let falhas = 0;
  for (const d of pecas()) {
    const dir = path.join(FILA, d);
    if (!fs.existsSync(dir)) continue;
    const erros = conferirPeca(dir);
    const status = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')).status;
    console.log(`${d}: ${erros.length ? 'FALHA — ' + erros.join('; ') : 'ok'} · status ${status}`);
    if (erros.length) falhas += 1;
  }
  console.log(falhas ? `${falhas} peça(s) com falha` : 'todas as peças conferem');
  process.exitCode = falhas ? 1 : 0;
}

if (args.has('--reverter')) reverter();
else if (args.has('--conferir')) conferirFila();
else if (args.has('--backup')) backup();
else dryRunOuAplicar(args.has('--aplicar'));
