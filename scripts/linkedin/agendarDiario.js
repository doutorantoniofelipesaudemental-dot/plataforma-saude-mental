/**
 * Agendamento diário do LinkedIn (tarefa DrSM-LinkedIn-Agendar, 11:00). Autorizado pelo Dr. Antônio em 18/10/2026 (CLAUDE.md).
 * Salvaguardas: no máximo 3 posts por dia, 2 min entre eles, uma execução por dia, parada imediata em
 * deslogado/CAPTCHA/verificação/limite/atividade incomum (atividade incomum também DESATIVA a tarefa).
 * Agenda SEMPRE pelo agendador nativo, pela skill agendar-linkedin, com o perfil persistente do Chrome. Sem senha, sem cookies.
 *   node --env-file-if-exists=.env scripts/linkedin/agendarDiario.js            execução real
 *   node --env-file-if-exists=.env scripts/linkedin/agendarDiario.js --simular  só pré-checagem e regras (não abre o Chrome)
 * Estado: relatorios/linkedin/agendar-diario-estado.json. Alerta: topo do relatorios/ESTADO-GERAL.md e relatorios/RESUMO-DO-DIA.md.
 * Teto do claude -p (19/10/2026): 3 por dia e 15 por semana, via scripts/consumoClaude.js (consulta antes, registra depois).
 */
require('../carregarEnv').carregarEnv(); // .env carregado aqui, sem --env-file na linha de comando (o filho herda o ambiente)
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const consumo = require('../consumoClaude');
const mongoose = require('mongoose');
const { lerContagens, interpretarLote } = require('./travaDuplicidade');

const RAIZ = path.resolve(__dirname, '../..');
const ESTADO = path.join(RAIZ, 'relatorios/linkedin/agendar-diario-estado.json');
const MAX_POSTS = 2;
const INTERVALO_MS = 2 * 60e3;
const TAREFA = 'DrSM-LinkedIn-Agendar';

// Contrato: a ÚLTIMA linha "STATUS:" da saída do Claude diz o que fazer. Texto solto (ex.: "verificação concluída") não para nada.
// STATUS: OK | STATUS: PARAR <motivo> | STATUS: DESATIVAR <motivo> (só atividade incomum ou restrição de conta).
const LINHA_STATUS = /^\s*STATUS:\s*(OK|PARAR|DESATIVAR)\b\s*(.*)$/;

// Função pura: diz se a saída manda parar e se a tarefa deve ser desativada.
// Sem linha de status, código de saída diferente de 0 ou timeout (codigo null) contam como parada.
function classificarSaida(texto = '', codigo = 0) {
  if (codigo !== 0) return { parar: true, desativar: false, motivo: `sem status (código de saída ${codigo})` };
  const linhas = String(texto).split(/\r?\n/).filter((l) => /^\s*STATUS:/.test(l));
  const m = linhas.length ? linhas[linhas.length - 1].match(LINHA_STATUS) : null;
  if (!m) return { parar: true, desativar: false, motivo: 'sem status' };
  if (m[1] === 'OK') return { parar: false, desativar: false, motivo: '' };
  return { parar: true, desativar: m[1] === 'DESATIVAR', motivo: m[2].trim() || m[1].toLowerCase() };
}

// Função pura: a execução de hoje já aconteceu ou foi parada (não repete no mesmo dia).
function jaRodouHoje(estado, hoje) {
  return estado.ultimoDia === hoje && ['concluido', 'parado'].includes(estado.status);
}

const limitarPosts = (n) => Math.max(0, Math.min(MAX_POSTS, n));

function lerEstado() {
  try { return JSON.parse(fs.readFileSync(ESTADO, 'utf8')); } catch { return {}; }
}

function gravarEstado(estado) {
  fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
  fs.writeFileSync(ESTADO, `${JSON.stringify(estado, null, 1)}\n`, 'utf8');
}

// Alerta no topo do ESTADO-GERAL.md e primeira linha do RESUMO-DO-DIA.md (texto sem dados sensíveis).
function alertar(texto, hoje) {
  const eg = path.join(RAIZ, 'relatorios/ESTADO-GERAL.md');
  const bloco = `<!-- ALERTA-LINKEDIN:INICIO -->\n> # 🚨 ALERTA DO LINKEDIN (${hoje}): ${texto}\n> Agendamento parado até nova ordem do Dr. Antônio. Desligar: \`npm run linkedin:pausar\`.\n<!-- ALERTA-LINKEDIN:FIM -->\n`;
  if (fs.existsSync(eg)) {
    let t = fs.readFileSync(eg, 'utf8');
    const re = /<!-- ALERTA-LINKEDIN:INICIO -->[\s\S]*?<!-- ALERTA-LINKEDIN:FIM -->\n?/;
    t = re.test(t) ? t.replace(re, bloco) : t.replace(/\n/, `\n${bloco}`);
    fs.writeFileSync(eg, t, 'utf8');
  }
  const resumo = path.join(RAIZ, 'relatorios/RESUMO-DO-DIA.md');
  const linha = `PRECISA DE VOCÊ: SIM — LinkedIn: ${texto}`;
  const atual = fs.existsSync(resumo) ? fs.readFileSync(resumo, 'utf8') : '';
  fs.writeFileSync(resumo, `${linha}\n${atual.replace(/^PRECISA DE VOCÊ:.*\n?/, '')}`, 'utf8');
}

function desativarTarefa() {
  return spawnSync('schtasks', ['/Change', '/TN', TAREFA, '/DISABLE'], { encoding: 'utf8' }).status === 0;
}

const hojeBahia = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 }).catch(() => null);
  const simular = process.argv.includes('--simular');
  const hoje = hojeBahia();
  const estado = lerEstado();
  if (estado.pausado) return console.log('pausado (npm run linkedin:pausar). Nada feito.');
  if (jaRodouHoje(estado, hoje)) return console.log(`já rodou hoje (${estado.status}). Nada feito.`);

  // 1) pré-checagem: auditoria + tripla do lote (só escreve o lote; não agenda nada)
  const env = { ...process.env, LOTE_SIMULACAO: simular ? '1' : '' };
  const pre = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/linkedin/preAgendamento.js')], { cwd: RAIZ, encoding: 'utf8', timeout: 300000, env });
  if (pre.status !== 0) { alertar('pré-checagem do lote falhou (preAgendamento)', hoje); return gravarEstado({ ultimoDia: hoje, status: 'parado', motivo: 'pré-checagem' }); }
  const lote = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios/linkedin', require('./nomesLote').nomesLote({ simulacao: simular }).json), 'utf8'));
  const disponiveis = (lote.aprovados || []).length;
  const alvo = limitarPosts(disponiveis);
  if (simular) return console.log(`simulação: ${disponiveis} aprovado(s) no lote; agendaria até ${alvo} hoje (intervalo ${INTERVALO_MS / 60e3} min). Nada agendado.`);
  if (!alvo) { gravarEstado({ ultimoDia: hoje, status: 'concluido', agendados: 0 }); return console.log('nada aprovado para agendar hoje.'); }

  // 2) UMA chamada do claude -p para até `alvo` posts (ordem de 20/10/2026): uma linha STATUS por post.
  // A trava no banco vale antes e depois: o lote só é aceito se o banco mudou exatamente pelo número de STATUS OK.
  const teto = consumo.podeChamarClaude({ agora: new Date(), origem: consumo.ORIGEM_LINKEDIN });
  if (!teto.pode) {
    if (teto.uso) consumo.avisarTeto(teto.motivo, new Date());
    else alertar(teto.motivo, hoje);
    console.log(`não chamado: ${teto.motivo}`);
    return gravarEstado({ ultimoDia: hoje, status: 'parado', motivo: teto.motivo, agendados: 0 });
  }
  let antes;
  try { antes = await lerContagens(mongoose); } catch (e) {
    alertar(`banco ilegível antes do agendamento (${String(e.message).slice(0, 80)}); parado para evitar duplicidade`, hoje);
    return gravarEstado({ ultimoDia: hoje, status: 'parado', motivo: 'banco ilegível', agendados: 0 });
  }
  if (antes.abertos === 0) { gravarEstado({ ultimoDia: hoje, status: 'concluido', agendados: 0 }); return console.log('nenhum item aberto no banco. Nada feito.'); }
  // o prompt vai pela entrada padrão (no Windows o `claude` é .cmd, então shell: true; sem espaços nos argumentos)
  const prompt = `Rode a skill agendar-linkedin para agendar ATÉ ${alvo} post(s), um de cada vez, na ordem da fila aprovada. Antes de cada um: auditoria e tripla checagem. Entre um e outro, espere 2 minutos. Sem senha. Se aparecer login, verificação, CAPTCHA, limite ou atividade incomum, PARE e não tente de novo. Ao final, escreva UMA linha por post tentado, exatamente: "STATUS: OK" (agendado), "STATUS: PARAR <motivo curto>" ou "STATUS: DESATIVAR <motivo curto>" (DESATIVAR só para aviso de atividade incomum ou restrição de conta). Não escreva mais nada depois dessas linhas.`;
  const r = spawnSync('claude', ['-p'], { cwd: RAIZ, input: prompt, encoding: 'utf8', shell: true, timeout: 3600000 });
  const saida = `${r.stdout || ''}\n${r.stderr || ''}`;
  // registra DEPOIS, mesmo se a chamada falhou (a cota já foi usada)
  const grava = consumo.registrarChamada({ agora: new Date(), origem: 'agendarDiario-lote' });
  if (!grava.gravado) {
    alertar(`contador do claude -p não gravado (${grava.motivo}); parado por segurança`, hoje);
    return gravarEstado({ ultimoDia: hoje, status: 'parado', motivo: 'contador do claude -p', agendados: 0 });
  }
  const c = classificarSaida(saida, r.status);
  let depois = null;
  try { depois = await lerContagens(mongoose); } catch (e) { depois = null; }
  const resultado = interpretarLote(saida, { antes, depois, esperados: alvo });
  if (!resultado.ok) {
    if (c.desativar) desativarTarefa();
    alertar(`lote parado: ${resultado.motivo}. Conferir o LinkedIn e o banco antes de reativar.`, hoje);
    return gravarEstado({ ultimoDia: hoje, status: 'parado', motivo: resultado.motivo, agendados: resultado.agendados, desativadaAutomaticamente: c.desativar });
  }
  gravarEstado({ ultimoDia: hoje, status: 'concluido', agendados: resultado.agendados });
  console.log(`agendados hoje: ${resultado.agendados}`);
}

module.exports = { classificarSaida, jaRodouHoje, limitarPosts, MAX_POSTS, INTERVALO_MS };

if (require.main === module) main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); }).finally(() => mongoose.disconnect());
